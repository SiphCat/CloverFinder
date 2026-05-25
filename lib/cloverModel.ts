import * as tf from "@tensorflow/tfjs";
import sharp from "sharp";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const MOBILENET_URL =
  "https://tfhub.dev/google/imagenet/mobilenet_v2_100_224/classification/2";

const CUSTOM_MODEL_DIR = join(process.cwd(), "models", "clover-classifier");

const IMAGE_SIZE = 224;

/**
 * ImageNet class indices that correspond to plants, vegetation, flowers,
 * fruits, vegetables, and fungi. If MobileNet's top predictions land in these
 * classes it is very likely the image contains organic plant material.
 */
const PLANT_INDICES = new Set([
  738, // flowerpot
  936, 937, 938, 939, 940, 941, 942, 943, 944, 945, 946, // vegetables
  947, // mushroom
  948, 949, 950, 951, 952, 953, 954, 955, 956, 957, // fruits
  958, // hay
  984, // rapeseed
  985, // daisy
  986, // yellow lady's slipper
  987, // corn
  988, // acorn
  989, // rose hip
  990, // buckeye
  991, 992, 993, 994, 995, 996, 997, // fungi
  998, // ear / spike / capitulum
]);

export type CloverModelResult = {
  isPlant: boolean;
  leafCount: number;
  confidence: number;
};

let cachedMobileNet: tf.GraphModel | null = null;
let cachedClassifier: tf.LayersModel | null = null;
let classifierClasses: string[] | null = null;
let classifierChecked = false;

async function getMobileNet(): Promise<tf.GraphModel> {
  if (cachedMobileNet) return cachedMobileNet;
  cachedMobileNet = await tf.loadGraphModel(MOBILENET_URL, {
    fromTFHub: true,
  });
  return cachedMobileNet;
}

async function getClassifier(): Promise<{
  model: tf.LayersModel;
  classes: string[];
} | null> {
  if (classifierChecked) {
    return cachedClassifier && classifierClasses
      ? { model: cachedClassifier, classes: classifierClasses }
      : null;
  }
  classifierChecked = true;

  const modelPath = join(CUSTOM_MODEL_DIR, "model.json");
  const classesPath = join(CUSTOM_MODEL_DIR, "classes.json");
  if (!existsSync(modelPath) || !existsSync(classesPath)) return null;

  try {
    cachedClassifier = await tf.loadLayersModel(
      `file://${modelPath}`
    );
    classifierClasses = JSON.parse(readFileSync(classesPath, "utf-8"));
    return { model: cachedClassifier, classes: classifierClasses! };
  } catch {
    // file:// handler may not be available in pure-JS tfjs;
    // the custom classifier is optional — fall back to default path.
    return null;
  }
}

/**
 * Preprocess an image buffer into a [1, 224, 224, 3] float32 tensor
 * normalised to [-1, 1] (MobileNet v2 expected range).
 */
async function preprocessImage(buf: Buffer): Promise<tf.Tensor4D> {
  const { data, info } = await sharp(buf)
    .resize(IMAGE_SIZE, IMAGE_SIZE, { fit: "cover" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const tensor = tf.tensor3d(new Uint8Array(data), [
    info.height,
    info.width,
    info.channels as number,
  ]);

  // Normalise from [0, 255] to [0, 1] (TF Hub MobileNet v2 expected range)
  const normalised = tensor.toFloat().div(255);
  tensor.dispose();
  const batched = normalised.expandDims(0) as tf.Tensor4D;
  normalised.dispose();
  return batched;
}

/**
 * Analyse the colour distribution of the image.
 * Returns the fraction of pixels that are "green-dominant"
 * (green channel > red and green channel > blue by a margin).
 */
async function greenFraction(buf: Buffer): Promise<number> {
  const { data } = await sharp(buf)
    .resize(64, 64, { fit: "cover" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = data.length / 3;
  let greenCount = 0;
  for (let i = 0; i < data.length; i += 3) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    if (g > r + 15 && g > b + 15 && g > 60) {
      greenCount++;
    }
  }
  return greenCount / pixels;
}

/**
 * Run inference on an image buffer and determine:
 * 1. Whether the image likely contains a plant (MobileNet + green analysis)
 * 2. An estimated leaf count (defaults to 4; improvable with training data)
 *
 * If a fine-tuned classifier exists in models/clover-classifier/ it will
 * be used for both plant detection and leaf counting. Otherwise falls back
 * to MobileNet ImageNet classification + green colour heuristics.
 */
export async function analyzeWithModel(
  buf: Buffer
): Promise<CloverModelResult> {
  const [mobilenet, classifier, input, greenRatio] = await Promise.all([
    getMobileNet(),
    getClassifier(),
    preprocessImage(buf),
    greenFraction(buf),
  ]);

  // ── Path A: fine-tuned custom classifier available ──
  if (classifier) {
    const featureVec = mobilenet.predict(input) as tf.Tensor2D;
    input.dispose();

    const prediction = classifier.model.predict(featureVec) as tf.Tensor2D;
    featureVec.dispose();

    const predData = (await prediction.data()) as Float32Array;
    prediction.dispose();

    let topIdx = 0;
    let topProb = 0;
    for (let i = 0; i < predData.length; i++) {
      if (predData[i]! > topProb) {
        topProb = predData[i]!;
        topIdx = i;
      }
    }

    const className = classifier.classes[topIdx] ?? "not-clover";
    const isPlant = className !== "not-clover";
    const leafMatch = className.match(/^leaf-(\d+)$/);
    const leafCount = leafMatch ? parseInt(leafMatch[1]!, 10) : 4;

    return { isPlant, leafCount, confidence: topProb };
  }

  // ── Path B: default MobileNet + colour heuristics ──
  const logits = mobilenet.predict(input) as tf.Tensor2D;
  input.dispose();

  const probabilities = tf.softmax(logits);
  logits.dispose();

  const probs = (await probabilities.data()) as Float32Array;
  probabilities.dispose();

  let plantScore = 0;
  for (const idx of PLANT_INDICES) {
    plantScore += probs[idx] ?? 0;
  }

  // Combined plant confidence using both MobileNet and colour analysis.
  // MobileNet plant classes may not fire for close-up clover photos, so
  // green colour provides a strong complementary signal.
  const mobilenetSignal = Math.min(1, plantScore * 3);
  const colourSignal = Math.min(1, greenRatio * 2.5);
  const confidence = mobilenetSignal * 0.4 + colourSignal * 0.6;

  const isPlant =
    confidence > 0.25 || plantScore > 0.1 || greenRatio > 0.15;

  // Leaf count estimation: without custom training data we default to 4.
  // Green pixel density gives a very rough proxy — denser patches of green
  // sometimes correlate with more leaves, but this is intentionally
  // conservative. Fine-tuning with the training script will replace this.
  let leafCount = 4;
  if (greenRatio > 0.45) leafCount = 5;
  if (greenRatio > 0.6) leafCount = 6;

  return { isPlant, leafCount, confidence };
}
