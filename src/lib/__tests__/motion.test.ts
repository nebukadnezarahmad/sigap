import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DUR,
  EASE_APPLE,
  animasiModal,
  fadeNaik,
  fadeSaja,
  harusKurangiGerak,
  skalaPress,
  transisiCepat,
  transisiModal,
  transisiReveal,
  transisiSedang,
} from "@/lib/motion";

function pasangMatchMedia(cocok: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockReturnValue({
      matches: cocok,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("token motion", () => {
  it("DUR berada dalam rentang standar Apple", () => {
    expect(DUR.instan).toBe(0.1);
    expect(DUR.cepat).toBe(0.18);
    expect(DUR.sedang).toBe(0.3);
    expect(DUR.reveal).toBe(0.5);
  });

  it("EASE_APPLE memakai kurva Apple", () => {
    expect([...EASE_APPLE]).toEqual([0.32, 0.72, 0, 1]);
  });

  it("transisi turunan memakai DUR + EASE_APPLE", () => {
    expect(transisiCepat).toMatchObject({ duration: DUR.cepat });
    expect(transisiSedang).toMatchObject({ duration: DUR.sedang });
    expect(transisiReveal).toMatchObject({ duration: DUR.reveal });
    expect(transisiModal).toMatchObject({
      duration: DUR.sedang,
      ease: EASE_APPLE,
    });
  });

  it("fadeNaik reveal sekali: y 12→0 selama 0,5 dtk", () => {
    expect(fadeNaik.initial).toMatchObject({ y: 12, opacity: 0 });
    expect(fadeNaik.whileInView).toMatchObject({ y: 0, opacity: 1 });
    expect(fadeNaik.viewport).toMatchObject({ once: true, margin: "-80px" });
    expect(fadeNaik.transition).toMatchObject({ duration: DUR.reveal });
  });

  it("fadeSaja hanya opacity dengan durasi cepat", () => {
    expect(fadeSaja.transition).toMatchObject({ duration: DUR.cepat });
    expect(fadeSaja.exit).toMatchObject({ opacity: 0 });
  });

  it("skalaPress menyusut halus saat ditekan", () => {
    expect(skalaPress.whileTap).toMatchObject({ scale: 0.97 });
  });

  it("animasiModal y 16→0 tanpa spring", () => {
    expect(animasiModal.initial).toMatchObject({ y: 16, opacity: 0 });
    expect(animasiModal.animate).toMatchObject({ y: 0, opacity: 1 });
  });
});

describe("harusKurangiGerak", () => {
  it("false bila pengguna tidak meminta pengurangan", () => {
    pasangMatchMedia(false);
    expect(harusKurangiGerak()).toBe(false);
    expect(window.matchMedia).toHaveBeenCalledWith(
      "(prefers-reduced-motion: reduce)"
    );
  });

  it("true bila prefers-reduced-motion: reduce", () => {
    pasangMatchMedia(true);
    expect(harusKurangiGerak()).toBe(true);
  });
});
