import { readFileSync } from "node:fs";
import { join } from "node:path";

export async function runFindsMigration(connectionString: string): Promise<{ ok: boolean; error?: string }> {
  const { default: pg } = await import("pg");
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const sqlPath = join(process.cwd(), "supabase/sql/ensure_finds_table.sql");
    const sql = readFileSync(sqlPath, "utf8");
    await client.query(sql);

    const check = await client.query(
      `select exists (
        select 1 from information_schema.tables
        where table_schema = 'public' and table_name = 'finds'
      ) as ok`
    );
    const ok = Boolean(check.rows[0]?.ok);
    return ok ? { ok: true } : { ok: false, error: "Table public.finds still missing after migration." };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  } finally {
    await client.end().catch(() => undefined);
  }
}
