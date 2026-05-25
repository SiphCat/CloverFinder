#!/usr/bin/env node
/**
 * Train (fine-tune) a custom clover classifier on top of MobileNet v2.
 *
 * Usage:
 *   node scripts/train-clover-model.mjs
 *
 * Before running, organise your training images like this:
 *
 *   training-data/
 *     not-clover/       ← photos that are NOT clovers (people, objects, etc.)
 *     leaf-4/           ← four-leaf clover photos
 *     leaf-5/           ← five-leaf clover photos
 *     leaf-6/           ← six-leaf clover photos
 *     leaf-7/           ← seven-leaf clover photos
 *     leaf-8/           ← eight-leaf clover photos
 *     leaf-9/           ← nine-leaf clover photos
 *     leaf-10/          ← ten-leaf clover photos
 *
 * Each folder should contain .jpg / .png images. Aim for at least 20-50 images
 * per category for basic training, 200+ per category for good accuracy.
 *
 * The script will:
 *   1. Load MobileNet v2 and truncate it to use as a feature extractor
 *   2. Train a small classifier on top of those features
 *   3. Save the trained model to models/clover-classifier/
 */

import { readdir, stat, mkdir } from "node:fs/promises";
import { join, extname } from "node:path";
import { existsSync } from "node:fs";

const TRAINING_DIR = join(process.cwd(), "training-data");
const MODEL_OUTPUT = join(process.cwd(), "models", "clover-classifier");
const IMAGE_SIZE = 224;

const CLASSES = [
  "not-clover",
  "leaf-4",
  "leaf-5",
  "leaf-6",
  "leaf-7",
  "leaf-8",
  "leaf-9",
  "leaf-10",
];

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

async function listImages(dir) {
  if (!existsSync(dir)) return [];
  const entries = await readdir(dir);
  return entries
    .filter((f) => IMAGE_EXTS.has(extname(f).toLowerCase()))
    .map((f) => join(dir, f));
}

async function main() {
  console.log("Clover Model Training Script");
  console.log("============================\n");

  // Check training data exists
  if (!existsSync(TRAINING_DIR)) {
    console.error(
      `Training data directory not found: ${TRAINING_DIR}\n\n` +
        "Create it with subdirectories for each class:\n" +
        CLASSES.map((c) => `  training-data/${c}/`).join("\n") +
        "\n\nPut your labeled images in the appropriate folders, then run this script again."
    );
    process.exit(1);
  }

  // Count images per class
  const classCounts = {};
  let totalImages = 0;
  for (const cls of CLASSES) {
    const images = await listImages(join(TRAINING_DIR, cls));
    classCounts[cls] = images.length;
    totalImages += images.length;
  }

  console.log("Training data found:");
  for (const cls of CLASSES) {
    const count = classCounts[cls];
    const status = count === 0 ? "(empty)" : `${count} images`;
    console.log(`  ${cls}: ${status}`);
  }
  console.log(`  Total: ${totalImages} images\n`);

  if (totalImages < 10) {
    console.error(
      "Not enough training data. Add at least 10 images total " +
        "(ideally 20+ per class) and try again."
    );
    process.exit(1);
  }

  // Dynamic import so script can run without tensorflow pre-loaded
  console.log("Loading TensorFlow.js...");
  const tf = await import("@tensorflow/tfjs");
  const sharp = (await import("sharp")).default;

  // Load MobileNet as feature extractor
  console.log("Loading MobileNet v2 feature extractor...");
  const mobilenet = await tf.loadGraphModel(
    "https://tfhub.dev/google/imagenet/mobilenet_v2_100_224/classification/2",
    { fromTFHub: true }
  );

  // Extract features from all images
  console.log("\nExtracting features from training images...");
  const features = [];
  const labels = [];

  for (let classIdx = 0; classIdx < CLASSES.length; classIdx++) {
    const cls = CLASSES[classIdx];
    const images = await listImages(join(TRAINING_DIR, cls));

    for (const imgPath of images) {
      try {
        const buf = await sharp(imgPath)
          .resize(IMAGE_SIZE, IMAGE_SIZE, { fit: "cover" })
          .removeAlpha()
          .raw()
          .toBuffer();

        const tensor = tf.tensor3d(new Uint8Array(buf), [
          IMAGE_SIZE,
          IMAGE_SIZE,
          3,
        ]);
        const normalised = tensor.toFloat().div(255);
        tensor.dispose();
        const batched = normalised.expandDims(0);
        normalised.dispose();

        const featureVec = mobilenet.predict(batched);
        const featureData = await featureVec.data();
        features.push(Array.from(featureData));
        labels.push(classIdx);

        batched.dispose();
        featureVec.dispose();
      } catch (err) {
        console.warn(`  Skipping ${imgPath}: ${err.message}`);
      }
    }
    if (images.length > 0) {
      console.log(`  ${cls}: ${images.length} images processed`);
    }
  }

  const numFeatures = features[0].length;
  console.log(`\nFeature vector size: ${numFeatures}`);
  console.log(`Total samples: ${features.length}`);

  // Build a small classifier
  console.log("\nBuilding classifier...");
  const model = tf.sequential();
  model.add(
    tf.layers.dense({
      inputShape: [numFeatures],
      units: 128,
      activation: "relu",
    })
  );
  model.add(tf.layers.dropout({ rate: 0.3 }));
  model.add(
    tf.layers.dense({
      units: CLASSES.length,
      activation: "softmax",
    })
  );

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: "sparseCategoricalCrossentropy",
    metrics: ["accuracy"],
  });

  model.summary();

  // Train
  const xs = tf.tensor2d(features);
  const ys = tf.tensor1d(labels, "int32");

  console.log("\nTraining...");
  await model.fit(xs, ys, {
    epochs: 50,
    batchSize: Math.min(32, features.length),
    validationSplit: 0.2,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if ((epoch + 1) % 10 === 0 || epoch === 0) {
          console.log(
            `  Epoch ${epoch + 1}/50 — ` +
              `loss: ${logs.loss.toFixed(4)}, ` +
              `acc: ${logs.acc.toFixed(4)}, ` +
              `val_loss: ${(logs.val_loss ?? 0).toFixed(4)}, ` +
              `val_acc: ${(logs.val_acc ?? 0).toFixed(4)}`
          );
        }
      },
    },
  });

  xs.dispose();
  ys.dispose();

  // Save the classifier
  await mkdir(MODEL_OUTPUT, { recursive: true });
  await model.save(`file://${MODEL_OUTPUT}`);

  // Also save the class mapping
  const { writeFile } = await import("node:fs/promises");
  await writeFile(
    join(MODEL_OUTPUT, "classes.json"),
    JSON.stringify(CLASSES, null, 2)
  );

  console.log(`\nModel saved to ${MODEL_OUTPUT}`);
  console.log(
    "\nTo use the trained model, the app will automatically detect it at startup."
  );
  console.log("Restart your dev server to load the new model.");
}

main().catch((err) => {
  console.error("Training failed:", err);
  process.exit(1);
});
