export const PROFILE_PREFS_STORAGE_KEY = "cloverfinder:profilePrefs:v1";
export const PROFILE_PREFS_UPDATED_EVENT = "cloverfinder:prefs-updated";

export type ProfileLocale =
  | "en-US"
  | "en-GB"
  | "en-CA"
  | "es"
  | "es-419"
  | "fr"
  | "de"
  | "uk"
  | "pl"
  | "it"
  | "nl"
  | "pt-BR"
  | "ja"
  | "ko"
  | "zh-Hans"
  | "sv"
  | "da"
  | "fi"
  | "nb"
  | "he";

export type ProfileDateFormat = "locale" | "mdy" | "dmy" | "ymd";

export type ProfileWeekStart = "locale" | "sunday" | "monday";

export type ProfileColorScheme = "light" | "dark" | "system";

export type ProfilePrefs = {
  locale: ProfileLocale;
  dateFormat: ProfileDateFormat;
  weekStartsOn: ProfileWeekStart;
  colorScheme: ProfileColorScheme;
  density: "comfortable" | "compact";
  largerText: boolean;
  reduceMotion: boolean;
  productTips: boolean;
  findingReminders: boolean;
  weeklySummary: boolean;
  confirmLeave: boolean;
};

export const defaultProfilePrefs: ProfilePrefs = {
  locale: "en-US",
  dateFormat: "locale",
  weekStartsOn: "locale",
  colorScheme: "system",
  density: "comfortable",
  largerText: false,
  reduceMotion: false,
  productTips: true,
  findingReminders: true,
  weeklySummary: false,
  confirmLeave: false
};

const LOCALE_LABELS: Record<ProfileLocale, string> = {
  "en-US": "English (United States)",
  "en-GB": "English (United Kingdom)",
  "en-CA": "English (Canada)",
  es: "Español (España)",
  "es-419": "Español (Latinoamérica)",
  fr: "Français",
  de: "Deutsch",
  uk: "Українська",
  pl: "Polski",
  it: "Italiano",
  nl: "Nederlands",
  "pt-BR": "Português (Brasil)",
  ja: "日本語",
  ko: "한국어",
  "zh-Hans": "中文（简体）",
  sv: "Svenska",
  da: "Dansk",
  fi: "Suomi",
  nb: "Norsk",
  he: "עברית"
};

export function listLocaleOptions(): { value: ProfileLocale; label: string }[] {
  return (Object.keys(LOCALE_LABELS) as ProfileLocale[])
    .map((value) => ({
      value,
      label: LOCALE_LABELS[value]
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "en"));
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function pickLocale(v: unknown): ProfileLocale {
  if (typeof v === "string" && v in LOCALE_LABELS) return v as ProfileLocale;
  return defaultProfilePrefs.locale;
}

function pickDateFormat(v: unknown): ProfileDateFormat {
  if (v === "locale" || v === "mdy" || v === "dmy" || v === "ymd") return v;
  return defaultProfilePrefs.dateFormat;
}

function pickWeekStart(v: unknown): ProfileWeekStart {
  if (v === "locale" || v === "sunday" || v === "monday") return v;
  return defaultProfilePrefs.weekStartsOn;
}

function pickDensity(v: unknown): "comfortable" | "compact" {
  if (v === "compact" || v === "comfortable") return v;
  return defaultProfilePrefs.density;
}

function pickColorScheme(v: unknown): ProfileColorScheme {
  if (v === "light" || v === "dark" || v === "system") return v;
  return defaultProfilePrefs.colorScheme;
}

/** Resolved theme for CSS (light or dark only). */
export function resolveColorScheme(prefs: ProfilePrefs): "light" | "dark" {
  if (prefs.colorScheme === "dark") return "dark";
  if (prefs.colorScheme === "light") return "light";
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

function pickBool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}

export function parseProfilePrefs(raw: unknown): ProfilePrefs {
  if (!isRecord(raw)) return { ...defaultProfilePrefs };
  return {
    locale: pickLocale(raw.locale),
    dateFormat: pickDateFormat(raw.dateFormat),
    weekStartsOn: pickWeekStart(raw.weekStartsOn),
    colorScheme: pickColorScheme(raw.colorScheme),
    density: pickDensity(raw.density),
    largerText: pickBool(raw.largerText, defaultProfilePrefs.largerText),
    reduceMotion: pickBool(raw.reduceMotion, defaultProfilePrefs.reduceMotion),
    productTips: pickBool(raw.productTips, defaultProfilePrefs.productTips),
    findingReminders: pickBool(raw.findingReminders, defaultProfilePrefs.findingReminders),
    weeklySummary: pickBool(raw.weeklySummary, defaultProfilePrefs.weeklySummary),
    confirmLeave: pickBool(raw.confirmLeave, defaultProfilePrefs.confirmLeave)
  };
}

export function readProfilePrefs(): ProfilePrefs {
  if (typeof window === "undefined") return { ...defaultProfilePrefs };
  try {
    const s = window.localStorage.getItem(PROFILE_PREFS_STORAGE_KEY);
    if (!s) return { ...defaultProfilePrefs };
    return parseProfilePrefs(JSON.parse(s) as unknown);
  } catch {
    return { ...defaultProfilePrefs };
  }
}

export function writeProfilePrefs(prefs: ProfilePrefs): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PROFILE_PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // quota / private mode
  }
}

export function applyProfilePrefsToDocument(prefs: ProfilePrefs): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.lang = prefs.locale;
  root.dataset.profileDensity = prefs.density;
  root.dataset.profileText = prefs.largerText ? "large" : "normal";
  root.dataset.reduceMotion = prefs.reduceMotion ? "on" : "off";
  root.dataset.dateFormat = prefs.dateFormat;
  root.dataset.weekStartsOn = prefs.weekStartsOn;
  root.dataset.colorScheme = resolveColorScheme(prefs);
}

export function resetProfilePrefs(): ProfilePrefs {
  const prefs = { ...defaultProfilePrefs };
  writeProfilePrefs(prefs);
  applyProfilePrefsToDocument(prefs);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(PROFILE_PREFS_UPDATED_EVENT));
  }
  return prefs;
}
