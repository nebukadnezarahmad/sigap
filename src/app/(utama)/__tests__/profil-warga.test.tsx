import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HalamanWarga from "../warga/[username]/page";

const { mockProfil, mockLaporan, mockLencana } = vi.hoisted(() => ({
  mockProfil: {
    id: "warga-1",
    nama_lengkap: "Budi Santoso",
    username: "budi_s",
    avatar_url: null,
    poin: 49,
    role: "warga",
  },
  mockLaporan: [
    {
      id: "laporan-1",
      judul: "Titik sampah di lapangan futsal (duplikat)",
      status: "ditolak",
      created_at: new Date(Date.now() - 17 * 86400000).toISOString(),
      categories: { slug: "sampah", nama: "Sampah Menumpuk", warna: "#4d7c0f" },
    },
    {
      id: "laporan-2",
      judul: "TPS dekat pasar bau menyengat sejak pagi",
      status: "dikerjakan",
      created_at: new Date(Date.now() - 19 * 86400000).toISOString(),
      categories: { slug: "sampah", nama: "Sampah Menumpuk", warna: "#4d7c0f" },
    },
    {
      id: "laporan-3",
      judul: "Usulan titik bank sampah untuk RT 05 dan RT 07",
      status: "baru",
      created_at: new Date(Date.now() - 24 * 86400000).toISOString(),
      categories: { slug: "lainnya", nama: "Lainnya", warna: "#64748b" },
    },
  ],
  mockLencana: [{ badge_key: "langkah_pertama" }, { badge_key: "kontributor" }],
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: (tabel: string) => {
      if (tabel === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: mockProfil, error: null }),
            }),
          }),
        };
      }
      if (tabel === "reports") {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: async () => ({ data: mockLaporan, error: null }),
              }),
            }),
          }),
        };
      }
      if (tabel === "user_badges") {
        return {
          select: () => ({
            eq: async () => ({ data: mockLencana, error: null }),
          }),
        };
      }
      return {
        select: () => ({
          eq: async () => ({ data: [], error: null }),
        }),
      };
    },
  })),
}));

describe("Profil warga", () => {
  it("menyajikan identitas, progres, lencana, dan laporan sebagai satu alur Apple-calm", async () => {
    const { container } = render(
      await HalamanWarga({ params: Promise.resolve({ username: "budi_s" }) })
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Budi Santoso" })
    ).toBeInTheDocument();
    expect(screen.getByText("@budi_s")).toBeInTheDocument();

    // Tanpa banner dekoratif besar.
    expect(container.querySelector(".h-28.bg-action")).not.toBeInTheDocument();

    // Statistik sebagai definisi, bukan pil.
    const statistik = screen.getByRole("group", { name: "Statistik kontribusi" });
    expect(within(statistik).getByText("Laporan terakhir")).toBeInTheDocument();
    expect(within(statistik).getByText("Hari beruntun")).toBeInTheDocument();

    // Progres level aksesibel dengan tujuan berikutnya yang jelas.
    expect(
      screen.getByRole("progressbar", { name: "Progres level Semai" })
    ).toBeInTheDocument();
    expect(screen.getByText("49 poin")).toBeInTheDocument();
    expect(screen.getByText("1 poin lagi menuju Tunas")).toBeInTheDocument();

    // Lencana sebagai daftar dengan deskripsi cara memperoleh.
    const lencana = screen.getByRole("list", { name: "Koleksi lencana" });
    expect(within(lencana).getAllByRole("listitem")).toHaveLength(10);
    expect(
      within(lencana).getByText("Melaporkan masalah pertamamu")
    ).toBeInTheDocument();

    // Laporan sebagai grouped list tunggal.
    const laporan = screen.getByRole("list", { name: "Laporan terakhir" });
    expect(within(laporan).getAllByRole("listitem")).toHaveLength(3);
    expect(
      within(laporan).getByText("Titik sampah di lapangan futsal (duplikat)")
    ).toBeInTheDocument();
  });
});
