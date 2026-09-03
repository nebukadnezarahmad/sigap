import { readFileSync } from "node:fs";
import pg from "pg";

const [file] = process.argv.slice(2);
if (!file) {
  console.error("pemakaian: node scripts/jalankan-sql.mjs <berkas.sql>");
  process.exit(1);
}

// Parse .env.local yang tahan quote/komentar/spasi.
// - Abaikan baris kosong dan komentar (# ...)
// - Potong spasi di sekitar kunci dan nilai
// - Kupas satu lapis quote pembungkus ('...' atau "...")
const env = {};
try {
  const raw = readFileSync(".env.local", "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    env[key] = value;
  }
} catch {
  // .env.local opsional: fallback ke process.env saja
}

const url =
  process.env.DB_URL ??
  env.DB_URL ??
  `postgresql://postgres.${env.SUPABASE_PROJECT_REF}:${env.SUPABASE_DB_PASSWORD}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`;

// Hormati SSL: hanya longgarkan verifikasi bila eksplisit diminta.
// Jangan hardcode rejectUnauthorized:false.
const allowInsecureSsl =
  process.env.ALLOW_INSECURE_SSL === "true" || env.ALLOW_INSECURE_SSL === "true";

const client = new pg.Client({
  connectionString: url,
  ssl: allowInsecureSsl ? { rejectUnauthorized: false } : { rejectUnauthorized: true },
  statement_timeout: 30_000,
});

await client.connect();
const sql = readFileSync(file, "utf8");
await client.query("BEGIN");
try {
  await client.query(sql);
  await client.query("COMMIT");
} catch (err) {
  try {
    await client.query("ROLLBACK");
  } catch {
    // abaikan kegagalan rollback agar error asli tetap muncul
  }
  throw err;
} finally {
  await client.end();
}
// Sengaja hanya log nama berkas — jangan pernah cetak secret/URL koneksi.
console.log(`OK: ${file}`);
