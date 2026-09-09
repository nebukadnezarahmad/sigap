import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { toggleTema, useTheme } from "@/lib/use-theme";

beforeEach(() => {
  document.documentElement.classList.remove("dark");
  localStorage.clear();
});

describe("useTheme", () => {
  it("false saat mode terang", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current).toBe(false);
  });

  it("true saat kelas dark terpasang", () => {
    document.documentElement.classList.add("dark");
    const { result } = renderHook(() => useTheme());
    expect(result.current).toBe(true);
  });
});

describe("toggleTema", () => {
  it("menyalakan mode gelap dan menyimpan preferensi", () => {
    toggleTema();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("tema")).toBe("dark");
  });

  it("mematikan mode gelap dan menyimpan preferensi", () => {
    document.documentElement.classList.add("dark");
    toggleTema();
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("tema")).toBe("light");
  });
});
