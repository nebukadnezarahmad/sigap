import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SiteHeader } from "@/components/site-header";

const { mockPathname, mockUseUser } = vi.hoisted(() => ({
  mockPathname: vi.fn((): string => "/peta"),
  mockUseUser: vi.fn((): { user: unknown; profil: unknown; muat: boolean } => ({
    user: null,
    profil: null,
    muat: false,
  })),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/lib/use-user", () => ({
  useUser: () => mockUseUser(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signOut: vi.fn().mockResolvedValue({ error: null }) },
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({ limit: () => Promise.resolve({ data: [] }) }),
        }),
      }),
      update: () => ({ eq: () => ({ eq: () => Promise.resolve({}) }) }),
    }),
    channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
    removeChannel: vi.fn(),
  }),
}));

beforeEach(() => {
  mockPathname.mockReturnValue("/peta");
  mockUseUser.mockReturnValue({ user: null, profil: null, muat: false });
});

describe("SiteHeader", () => {
  it("menandai tautan aktif desktop dengan aria-current=page", () => {
    render(<SiteHeader />);
    const nav = screen.getByRole("navigation", { name: "Utama" });
    expect(within(nav).getByRole("link", { name: "Peta" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(
      within(nav).getByRole("link", { name: "Laporan Saya" })
    ).not.toHaveAttribute("aria-current");
  });

  it("menandai tautan aktif seluler dengan aria-current=page", () => {
    render(<SiteHeader />);
    fireEvent.click(
      screen.getByRole("button", { name: "Buka menu navigasi" })
    );
    const nav = screen.getByRole("navigation", { name: "Navigasi seluler" });
    expect(within(nav).getByRole("link", { name: "Peta" })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("label toggle tema berupa aksi dan berubah setelah diklik", async () => {
    render(<SiteHeader />);
    fireEvent.click(
      screen.getByRole("button", { name: "Aktifkan mode gelap" })
    );
    expect(
      await screen.findByRole("button", { name: "Aktifkan mode terang" })
    ).toBeInTheDocument();
  });

  it("menu seluler ditutup via tautan dan fokus kembali ke pemicu", () => {
    render(<SiteHeader />);
    const pemicu = screen.getByRole("button", { name: "Buka menu navigasi" });
    pemicu.focus();
    fireEvent.click(pemicu);
    const nav = screen.getByRole("navigation", { name: "Navigasi seluler" });
    fireEvent.click(within(nav).getByRole("link", { name: "Peta" }));
    expect(
      screen.queryByRole("navigation", { name: "Navigasi seluler" })
    ).not.toBeInTheDocument();
    expect(pemicu).toHaveFocus();
  });

  it("menu seluler ditutup via Escape dan fokus kembali ke pemicu", () => {
    render(<SiteHeader />);
    const pemicu = screen.getByRole("button", { name: "Buka menu navigasi" });
    pemicu.focus();
    fireEvent.click(pemicu);
    expect(
      screen.getByRole("navigation", { name: "Navigasi seluler" })
    ).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(
      screen.queryByRole("navigation", { name: "Navigasi seluler" })
    ).not.toBeInTheDocument();
    expect(pemicu).toHaveFocus();
  });
});

describe("SiteHeader menu akun", () => {
  beforeEach(() => {
    mockUseUser.mockReturnValue({
      user: { id: "u-1", email: "warga@sigap.id" },
      profil: {
        username: "warga",
        nama_lengkap: "Warga Sigap",
        avatar_url: null,
        role: "warga",
      },
      muat: false,
    });
  });

  it("Escape menutup menu akun dan fokus kembali ke pemicu", () => {
    render(<SiteHeader />);
    const pemicu = screen.getByRole("button", { name: "Menu akun" });
    pemicu.focus();
    fireEvent.click(pemicu);
    expect(pemicu).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(pemicu, { key: "Escape" });
    expect(pemicu).toHaveAttribute("aria-expanded", "false");
    expect(pemicu).toHaveFocus();
  });

  it("klik di luar menutup menu akun", () => {
    render(<SiteHeader />);
    const pemicu = screen.getByRole("button", { name: "Menu akun" });
    fireEvent.click(pemicu);
    expect(pemicu).toHaveAttribute("aria-expanded", "true");
    fireEvent.mouseDown(document.body);
    expect(pemicu).toHaveAttribute("aria-expanded", "false");
  });

  it("memilih item menutup menu dan fokus kembali ke pemicu", () => {
    render(<SiteHeader />);
    const pemicu = screen.getByRole("button", { name: "Menu akun" });
    pemicu.focus();
    fireEvent.click(pemicu);
    fireEvent.click(screen.getByRole("link", { name: "Laporan saya" }));
    expect(pemicu).toHaveAttribute("aria-expanded", "false");
    expect(pemicu).toHaveFocus();
  });
});
