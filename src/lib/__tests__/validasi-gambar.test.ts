import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { pesanValidasiGambar } from "@/lib/validasi-gambar";

describe("pesanValidasiGambar", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => ({ width: 100, height: 100, close: vi.fn() }))
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  it("menerima JPEG, PNG, dan WebP dengan signature yang sesuai", async () => {
    const jpeg = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], "bukti.jpg", {
      type: "image/jpeg",
    });
    const png = new File(
      [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
      "bukti.png",
      { type: "image/png" }
    );
    const webp = new File(["RIFF", new Uint8Array(4), "WEBP"], "bukti.webp", {
      type: "image/webp",
    });
    await expect(pesanValidasiGambar(jpeg)).resolves.toBeNull();
    await expect(pesanValidasiGambar(png)).resolves.toBeNull();
    await expect(pesanValidasiGambar(webp)).resolves.toBeNull();
  });

  it("menolak MIME atau ekstensi di luar whitelist", async () => {
    await expect(
      pesanValidasiGambar(new File(["<svg />"], "bukti.svg", { type: "image/svg+xml" }))
    ).resolves.toBe("Format foto harus JPEG, PNG, atau WebP.");
    await expect(
      pesanValidasiGambar(new File(["x"], "bukti.jpg.exe", { type: "image/jpeg" }))
    ).resolves.toBe("Format foto harus JPEG, PNG, atau WebP.");
  });

  it("menolak foto di atas 5 MB", async () => {
    const file = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "besar.jpg", {
      type: "image/jpeg",
    });
    await expect(pesanValidasiGambar(file)).resolves.toContain("maksimal 5 MB");
  });

  it("menolak berkas dengan signature palsu", async () => {
    const file = new File(["bukan jpeg"], "bukti.jpg", { type: "image/jpeg" });
    await expect(pesanValidasiGambar(file)).resolves.toContain("Isi berkas");
  });

  it("menolak foto yang tidak dapat didekode", async () => {
    vi.stubGlobal("createImageBitmap", vi.fn(async () => Promise.reject(new Error("rusak"))));
    const file = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], "rusak.jpg", {
      type: "image/jpeg",
    });
    await expect(pesanValidasiGambar(file)).resolves.toContain("tidak dapat dibaca");
  });
});
