import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);

const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env;
if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("env belum lengkap — isi .env.local dulu.");
  process.exit(1);
}

const AKUN = [
  ["budi@sigap.demo", "budi_s", "Budi Santoso"],
  ["sari@sigap.demo", "sari_m", "Sari Melati"],
  ["agus@sigap.demo", "agus_p", "Agus Pratama"],
  ["dewi@sigap.demo", "dewi_k", "Dewi Kartika"],
  ["rafa@sigap.demo", "rafa_a", "Rafa Alfarizi"],
  ["dewan@sigap.demo", "dewan_kota", "Dewan Kota Harapan"],
];

for (const [email, username, nama] of AKUN) {
  const res = await fetch(`${NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password: "sigap123456",
      email_confirm: true,
      user_metadata: { nama_lengkap: nama, username },
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (res.ok) console.log(`✓ ${email} dibuat`);
  else if (/already|exist|registered/i.test(body.msg ?? "")) console.log(`• ${email} sudah ada`);
  else console.error(`✗ ${email}:`, body.msg ?? res.status);
}
