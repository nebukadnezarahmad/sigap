import { describe, expect, it } from "vitest";
import { SLA_HARI, SLA_KATEGORI, hitungSla } from "@/lib/constants";

const HARI_MS = 86400000;

function hariLalu(n: number) {
  // Offset kecil agar floor() stabil di n hari meskipun ada jeda eksekusi.
  return new Date(Date.now() - n * HARI_MS - 60_000).toISOString();
}

describe("SLA_KATEGORI", () => {
  it("semua target di bawah 14 hari", () => {
    expect(Object.keys(SLA_KATEGORI).length).toBeGreaterThan(0);
    for (const [slug, target] of Object.entries(SLA_KATEGORI)) {
      expect(target, `SLA ${slug}`).toBeLessThan(14);
    }
  });

  it("mempertahankan target sampah/drainase/lampu dan batas baru jalan/ruang-hijau/lainnya", () => {
    expect(SLA_KATEGORI.sampah).toBe(3);
    expect(SLA_KATEGORI.drainase).toBe(7);
    expect(SLA_KATEGORI.lampu).toBe(7);
    expect(SLA_KATEGORI.jalan).toBe(10);
    expect(SLA_KATEGORI["ruang-hijau"]).toBe(12);
    expect(SLA_KATEGORI.lainnya).toBe(10);
  });

  it("SLA_HARI default tetap 7", () => {
    expect(SLA_HARI).toBe(7);
  });
});

describe("hitungSla", () => {
  it("ruang-hijau 13 hari lalu sudah lewat SLA dengan hariTerlambat=1", () => {
    const hasil = hitungSla("ruang-hijau", hariLalu(13));
    expect(hasil.targetHari).toBe(12);
    expect(hasil.lewatSla).toBe(true);
    expect(hasil.hariTerlambat).toBe(1);
    expect(hasil.sisaHari).toBe(0);
  });

  it("jalan 9 hari lalu belum lewat SLA dengan sisaHari=1", () => {
    const hasil = hitungSla("jalan", hariLalu(9));
    expect(hasil.targetHari).toBe(10);
    expect(hasil.lewatSla).toBe(false);
    expect(hasil.sisaHari).toBe(1);
    expect(hasil.hariTerlambat).toBe(0);
  });

  it("slug tak dikenal fallback ke 7 hari", () => {
    const hasil = hitungSla("slug-tidak-ada", hariLalu(5));
    expect(hasil.targetHari).toBe(7);
    expect(hasil.lewatSla).toBe(false);
    expect(hasil.sisaHari).toBe(2);
  });
});
