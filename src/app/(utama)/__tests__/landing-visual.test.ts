import { describe, expect, it } from "vitest";
import { pilihTitikHero, type TitikHero } from "../landing-visual";

const laporan: TitikHero[] = [];

describe("pilihTitikHero", () => {
  it("tidak mengganti data live kosong dengan laporan demo", () => {
    expect(pilihTitikHero("live", laporan)).toEqual([]);
  });

  it("tidak mengganti kegagalan data dengan laporan demo", () => {
    expect(pilihTitikHero("galat", laporan)).toEqual([]);
  });

  it("hanya memakai contoh pada mode demo eksplisit", () => {
    expect(pilihTitikHero("demo", laporan).length).toBeGreaterThan(0);
  });
});
