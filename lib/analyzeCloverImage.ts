import { createHash } from "node:crypto";
import { clampLeafCount } from "@/lib/badges";
import { analyzeWithModel } from "@/lib/cloverModel";

export type CloverAnalysisResult =
  | {
      ok: true;
      leaves: number;
      method: "local-model";
    }
  | {
      ok: false;
      reason: string;
      code: "NOT_CLOVER" | "TOO_FEW_LEAVES" | "UNVERIFIED" | "ANALYSIS_FAILED";
      canRequestReview: true;
    };

export async function analyzeCloverImage(
  buf: Buffer,
  _mime: string
): Promise<CloverAnalysisResult> {
  try {
    const result = await analyzeWithModel(buf);

    if (!result.isPlant) {
      return {
        ok: false,
        reason:
          "You can only post clover images with 4 leaves and up. This photo does not look like an accepted clover.",
        code: "NOT_CLOVER",
        canRequestReview: true,
      };
    }

    if (result.leafCount < 4) {
      return {
        ok: false,
        reason:
          "You can only post clover images with 4 leaves and up. Three-leaf clovers are not accepted.",
        code: "TOO_FEW_LEAVES",
        canRequestReview: true,
      };
    }

    return {
      ok: true,
      leaves: clampLeafCount(result.leafCount),
      method: "local-model",
    };
  } catch {
    return {
      ok: false,
      reason: "Photo check failed. Try again, or request a human review.",
      code: "ANALYSIS_FAILED",
      canRequestReview: true,
    };
  }
}

/** @deprecated Demo hash — not used for acceptance when clover must be verified. */
export function leafCountFromBufferHash(buf: Buffer): number {
  const h = createHash("sha256").update(buf).digest();
  const mix = (h[0]! + h[1]! + h[2]! + h[3]!) % 7;
  return 4 + mix;
}
