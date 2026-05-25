/** Shared limits for finds (API + forms). */
export const FINDS_LIMITS = {
  titleMax: 200,
  descriptionMax: 4000,
  /** Per photo upload */
  imageMaxBytes: 5 * 1024 * 1024
} as const;

export function formatImageMaxMb(): string {
  return `${FINDS_LIMITS.imageMaxBytes / (1024 * 1024)} MB`;
}
