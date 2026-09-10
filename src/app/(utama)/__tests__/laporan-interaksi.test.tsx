import axe from "axe-core";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { KomentarSection } from "../laporan/[id]/komentar";
import { VoteButton } from "../laporan/[id]/vote-button";

const channel = {
  on: vi.fn(),
  subscribe: vi.fn(),
};
channel.on.mockReturnValue(channel);
channel.subscribe.mockReturnValue(channel);

vi.mock("@/lib/use-user", () => ({
  useUser: () => ({ user: null }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: async () => ({ data: [] }),
          }),
        }),
      }),
    }),
    channel: () => channel,
    removeChannel: vi.fn(),
  }),
}));

vi.mock("@/components/tombol-demo-login", () => ({
  DemoAuthModal: ({
    terbuka,
    tutup,
    judul,
  }: {
    terbuka: boolean;
    tutup: () => void;
    judul: string;
  }) =>
    terbuka ? (
      <div role="dialog" aria-label={judul}>
        <button type="button" onClick={tutup}>
          Tutup
        </button>
      </div>
    ) : null,
}));

describe("Interaksi detail laporan", () => {
  it("membuka gerbang masuk dari tombol dukungan tanpa tautan bantuan terpisah", async () => {
    const pengguna = userEvent.setup();
    const { container } = render(
      <VoteButton reportId="laporan-1" jumlahAwal={3} />
    );

    const tombol = screen.getByRole("button", { name: /Dukung laporan ini/ });
    expect(tombol).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.queryByText("masuk untuk memberi dukungan")
    ).not.toBeInTheDocument();

    await pengguna.click(tombol);
    expect(
      screen.getByRole("dialog", { name: "Dukung Laporan Ini" })
    ).toBeInTheDocument();

    const hasilAksesibilitas = await axe.run(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(hasilAksesibilitas.violations).toEqual([]);
  });

  it("menyajikan diskusi dan ajakan masuk sebagai satu region aksesibel", async () => {
    const { container } = render(
      <KomentarSection reportId="laporan-1" jumlahAwal={0} />
    );

    const diskusi = screen.getByRole("region", { name: /Diskusi warga/ });
    expect(diskusi).toBeInTheDocument();
    expect(
      await screen.findByText("Belum ada komentar. Jadilah suara pertama.")
    ).toBeInTheDocument();
    expect(screen.getByText("Ingin ikut berdiskusi?")).toBeInTheDocument();

    const hasilAksesibilitas = await axe.run(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(hasilAksesibilitas.violations).toEqual([]);
  });
});
