import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

const SERVICE_KEY_NAMES = ["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY"] as const;

function normalizeSecretValue(raw: string): string | undefined {
  let s = raw.trim().replace(/^\uFEFF/, "").replace(/\r/g, "");
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s.length > 0 ? s : undefined;
}

function normalizeUrl(raw: string): string | undefined {
  const s = raw.trim().replace(/^\uFEFF/, "").replace(/\r/g, "");
  if (!s || !s.startsWith("https://")) return undefined;
  return s;
}

/** Parse KEY=value lines (first `=` splits); ignores comments and blank lines. */
function parseDotEnvContent(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const unexported = line.replace(/^export\s+/i, "").trim();
    const eq = unexported.indexOf("=");
    if (eq <= 0) continue;
    const k = unexported.slice(0, eq).trim();
    let v = unexported.slice(eq + 1).trim();
    const commentAt = v.search(/\s+#/);
    if (commentAt !== -1) v = v.slice(0, commentAt).trim();
    if (k && v) out[k] = v;
  }
  return out;
}

/** `.env` first, then `.env.local` overwrites (Next / dotenv convention). */
function readEnvLayerFromDir(dir: string): Record<string, string> {
  const merged: Record<string, string> = {};
  for (const file of [".env", ".env.local"]) {
    const p = join(/* turbopackIgnore: true */ dir, file);
    if (!existsSync(p)) continue;
    try {
      Object.assign(merged, parseDotEnvContent(readFileSync(p, "utf8")));
    } catch {
      /* ignore */
    }
  }
  return merged;
}

/**
 * Walk `process.cwd()` and a few parents — monorepos sometimes run `next` from a subfolder
 * while `.env.local` lives at the repo root.
 */
function walkEnvDirs(): string[] {
  const dirs: string[] = [];
  let dir = /* turbopackIgnore: true */ process.cwd();
  for (let i = 0; i < 8; i++) {
    dirs.push(dir);
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return dirs;
}

/** Parents first, then cwd — so the closest `.env.local` wins. */
function mergeAllRootEnvFiles(): Record<string, string> {
  const merged: Record<string, string> = {};
  for (const dir of walkEnvDirs().reverse()) {
    Object.assign(merged, readEnvLayerFromDir(dir));
  }
  return merged;
}

/** Supabase project URL: `process.env` first, then merged `.env*` on disk. */
export function pickSupabaseProjectUrl(): string | undefined {
  const fromEnv = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  if (fromEnv) return fromEnv;
  const disk = mergeAllRootEnvFiles()["NEXT_PUBLIC_SUPABASE_URL"];
  return disk ? normalizeUrl(disk) : undefined;
}

/**
 * Service / secret key: `process.env` first, then merged `.env*` on disk (walks cwd + parents).
 */
export function pickServiceRoleKey(): string | undefined {
  const env = process.env as NodeJS.ProcessEnv;
  for (const name of SERVICE_KEY_NAMES) {
    const raw = env[name];
    if (typeof raw === "string") {
      const v = normalizeSecretValue(raw);
      if (v) return v;
    }
  }
  const merged = mergeAllRootEnvFiles();
  for (const name of SERVICE_KEY_NAMES) {
    const raw = merged[name];
    if (typeof raw === "string") {
      const v = normalizeSecretValue(raw);
      if (v) return v;
    }
  }
  return undefined;
}

export function isServiceRoleConfigured(): boolean {
  return Boolean(pickSupabaseProjectUrl() && pickServiceRoleKey());
}

export function createSupabaseServiceClient(): SupabaseClient | null {
  const url = pickSupabaseProjectUrl();
  const key = pickServiceRoleKey();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

/** True if `.env.local` on disk contains a service-role assignment (not unsaved editor-only). */
function envLocalContainsServiceRoleAssignment(path: string): boolean {
  if (!existsSync(path)) return false;
  try {
    const text = readFileSync(path, "utf8");
    return /^\s*SUPABASE_SERVICE_ROLE_KEY\s*=/m.test(text) || /^\s*SUPABASE_SECRET_KEY\s*=/m.test(text);
  } catch {
    return false;
  }
}

/** Safe dev hints (no secret values). */
export function serviceRoleConfigDebug(): {
  cwd: string;
  pickedUrl: boolean;
  pickedKey: boolean;
  envLocalPath: string;
  envLocalExists: boolean;
  /** Whether the saved file on disk has a `SUPABASE_SERVICE_ROLE_KEY=` / `SUPABASE_SECRET_KEY=` line */
  serviceRoleLineOnDisk: boolean;
} {
  const cwd = /* turbopackIgnore: true */ process.cwd();
  const envLocalPath = join(/* turbopackIgnore: true */ cwd, ".env.local");
  return {
    cwd,
    pickedUrl: Boolean(pickSupabaseProjectUrl()),
    pickedKey: Boolean(pickServiceRoleKey()),
    envLocalPath,
    envLocalExists: existsSync(envLocalPath),
    serviceRoleLineOnDisk: envLocalContainsServiceRoleAssignment(envLocalPath)
  };
}
