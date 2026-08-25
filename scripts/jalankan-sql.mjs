import { readFileSync } from "node:fs";
import pg from "pg";

const [file] = process.argv.slice(2);
if (!file) {
  console.error("pemakaian: node scripts/jalankan-sql.mjs <berkas.sql>");
  process.exit(1);
}

const env = {};
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2];
}

const url =
  process.env.DB_URL ??
  `postgresql://postgres.${env.SUPABASE_PROJECT_REF}:${env.SUPABASE_DB_PASSWORD}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`;

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
const sql = readFileSync(file, "utf8");
await client.query(sql);
console.log(`OK: ${file}`);
await client.end();
