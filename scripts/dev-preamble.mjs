#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnvLocal() {
  const path = join(root, ".env.local");
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
}

function resolveDbUrl(env) {
  const direct = env.SUPABASE_DB_URL || env.DATABASE_URL;
  if (direct && !direct.includes("[YOUR-PASSWORD]")) return direct;
  const ref = env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  const password = env.SUPABASE_DB_PASSWORD?.trim();
  if (ref && password) {
    return `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
  }
  return null;
}

async function maybeEnsureFindsTable() {
  const env = { ...process.env, ...loadEnvLocal() };
  if (!resolveDbUrl(env)) return;
  try {
    const { default: pg } = await import("pg");
    const client = new pg.Client({
      connectionString: resolveDbUrl(env),
      ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    const check = await client.query(
      `select exists (
        select 1 from information_schema.tables
        where table_schema = 'public' and table_name = 'finds'
      ) as ok`
    );
    if (check.rows[0]?.ok) {
      await client.end();
      return;
    }
    await client.end();
    const { spawnSync } = await import("node:child_process");
    const r = spawnSync(process.execPath, [join(root, "scripts/setup-database.mjs")], {
      cwd: root,
      stdio: "inherit",
      env: { ...process.env, ...env }
    });
    if (r.status !== 0) process.exit(r.status ?? 1);
  } catch {
    /* dev server still starts; use /dev or npm run db:setup */
  }
}

await maybeEnsureFindsTable();

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Cloverfinder — local dev
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Wait until you see "Ready", then open ONE of these and keep
 using the same host in every tab (including email magic links):

   http://127.0.0.1:3000
   http://localhost:3000

 Chrome error -102 = connection refused: nothing is listening on
 that URL/port. Fix: run "npm run dev" here, wait for Ready, match
 the port (3000 vs 3001), stop other servers on the same port.

 In .env.local set NEXT_PUBLIC_SITE_URL to the same origin you use
 so Supabase email links open a running dev server.

 Dev uses Webpack (not Turbopack) so server secrets like
 SUPABASE_SERVICE_ROLE_KEY load reliably in API routes. Use
 npm run dev:turbo if you explicitly want Turbopack.

 Posting finds needs public.finds in Supabase. Add SUPABASE_DB_PASSWORD
 to .env.local (Dashboard → Database) and restart — the table is created
 on startup. Otherwise open /dev or run ensure_finds_table.sql in SQL Editor.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
