import axe from "axe-core";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HalamanLaporan from "../laporan/[id]/page";

const laporan = {
  id: "laporan-1",
  judul: "Got tersumbat limbah minyak dari deretan warung",
  deskripsi: "Air got hitam pekat dan berminyak.",
  status: "dikerjakan",
  created_at: "2026-09-01T08:00:00.000Z",
  foto_url: null,
  alamat_teks: "Jl. Swadaya IV, Cipinang",
  lat: -6.2543,
  lng: 106.8602,
  petugas: "Tim DLH Kecamatan",
  categories: {
    slug: "drainase",
    nama: "Drainase & Banjir",
    warna: "#0369a1",
  },
  profiles: {
    id: "warga-1",
    username: "sari_m",
    nama_lengkap: "Sari Melati",
    avatar_url: null,
  },
  votes: [{ count: 3 }],
  comments: [{ count: 1 }],
  confirmations: [{ count: 3 }],
  report_photos: [],
  report_events: [
    {
      id: "event-1",
      status: "diverifikasi",
      catatan: "Diverifikasi tim lingkungan kecamatan.",
      created_at: "2026-09-01T09:00:00.000Z",
    },
    {
      id: "event-2",
      status: "dikerjakan",
      catatan: "Tim lapangan dikirim ke lokasi.",
      created_at: "2026-09-02T09:00:00.000Z",
    },
  ],
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: laporan, error: null }),
        }),
      }),
    }),
    auth: {
      getUser: async () => ({ data: { user: null } }),
    },
  })),
}));

vi.mock("@/components/map/leaflet-map", () => ({
  LeafletMap: () => <div>Peta laporan</div>,
}));

vi.mock("../laporan/[id]/vote-button", () => ({
  VoteButton: () => <button type="button">Dukung laporan ini</button>,
}));

vi.mock("../laporan/[id]/konfirmasi-button", () => ({
  KonfirmasiButton: () => <button type="button">Saya juga melihat ini</button>,
}));

vi.mock("../laporan/[id]/share-buttons", () => ({
  ShareButtons: () => <button type="button">Bagikan laporan</button>,
}));

vi.mock("../laporan/[id]/komentar", () => ({
  KomentarSection: () => <section>Diskusi warga</section>,
}));

vi.mock("../laporan/[id]/admin-panel", () => ({
  AdminPanel: () => null,
}));

describe("Detail laporan", () => {
  it("menyusun identitas, aksi, lokasi, dan pembaruan sebagai satu alur yang jelas", async () => {
    const { container } = render(
      await HalamanLaporan({
        params: Promise.resolve({ id: laporan.id }),
      })
    );

    expect(
      screen.getByRole("heading", { level: 1, name: laporan.judul })
    ).toBeInTheDocument();
    expect(screen.getByText("Ditangani oleh")).toBeInTheDocument();
    expect(screen.getByText("Batas waktu layanan")).toBeInTheDocument();

    const aksi = screen.getByRole("group", { name: "Aksi laporan" });
    expect(within(aksi).getByText("Dukung laporan ini")).toBeInTheDocument();
    expect(within(aksi).getByText("Saya juga melihat ini")).toBeInTheDocument();
    expect(within(aksi).getByText("Bagikan laporan")).toBeInTheDocument();

    const informasi = screen.getByRole("complementary", {
      name: "Lokasi dan penanganan laporan",
    });
    expect(within(informasi).getByText("Peta laporan")).toBeInTheDocument();
    expect(within(informasi).getByText("Pembaruan terbaru")).toBeInTheDocument();

    const diskusi = screen.getByText("Diskusi warga");
    expect(
      informasi.compareDocumentPosition(diskusi) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(screen.getByRole("article").parentElement).toHaveClass(
      "lg:grid-cols-[minmax(0,1fr)_320px]"
    );
    expect(informasi).toHaveClass(
      "lg:col-start-2",
      "lg:row-span-2",
      "lg:row-start-1"
    );
    expect(diskusi.parentElement).toHaveClass(
      "lg:col-start-1",
      "lg:row-start-2"
    );

    const hasilAksesibilitas = await axe.run(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(hasilAksesibilitas.violations).toEqual([]);
  });
});
