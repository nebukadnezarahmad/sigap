import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HalamanPapanSkor from "../papan-skor/page";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: () => ({
      select: () => ({
        order: () => ({
          limit: async () => ({
            data: Array.from({ length: 10 }, (_, indeks) => ({
              id: `warga-${indeks + 1}`,
              username: `warga${indeks + 1}`,
              nama_lengkap: `Warga ${indeks + 1}`,
              avatar_url: null,
              poin: 100 - indeks,
            })),
            error: null,
          }),
        }),
      }),
    }),
  })),
}));

vi.mock("../papan-skor/badge-saya", () => ({
  BadgeSaya: () => <div>Perjalananmu</div>,
}));

describe("Papan skor", () => {
  it("menyajikan sepuluh warga sebagai satu daftar dengan juara pertama yang jelas", async () => {
    render(await HalamanPapanSkor());

    const daftar = screen.getByRole("list", { name: "Peringkat 10 besar" });
    expect(within(daftar).getAllByRole("listitem")).toHaveLength(10);
    expect(within(daftar).getByText("Juara pertama")).toBeInTheDocument();
  });
});
