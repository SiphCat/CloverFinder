import { FINDS_LIMITS } from "@/lib/findsLimits";

export type ParsedFindInput = {
  title: string;
  description: string;
  lat: number;
  lng: number;
  shareRequested: boolean;
};

export function parseFindInput(
  titleRaw: unknown,
  descriptionRaw: unknown,
  latRaw: unknown,
  lngRaw: unknown,
  shareRaw: unknown
): { ok: true; data: ParsedFindInput } | { ok: false; error: string } {
  const title = String(titleRaw ?? "").trim();
  const description = String(descriptionRaw ?? "").trim();
  const lat = Number(latRaw);
  const lng = Number(lngRaw);
  const shareRequested =
    shareRaw === "true" || shareRaw === "on" || shareRaw === "1" || shareRaw === true;

  if (!title || title.length > FINDS_LIMITS.titleMax) {
    return {
      ok: false,
      error: `Title is required (max ${FINDS_LIMITS.titleMax} characters).`
    };
  }
  if (description.length > FINDS_LIMITS.descriptionMax) {
    return {
      ok: false,
      error: `Description is too long (max ${FINDS_LIMITS.descriptionMax} characters).`
    };
  }
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return { ok: false, error: "Invalid latitude." };
  }
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    return { ok: false, error: "Invalid longitude." };
  }

  return {
    ok: true,
    data: { title, description, lat, lng, shareRequested }
  };
}
