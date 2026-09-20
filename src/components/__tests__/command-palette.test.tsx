import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CommandPalette } from "@/components/command-palette";

const { mockUseUser } = vi.hoisted(() => ({
  mockUseUser: vi.fn((): { user: unknown; profil: unknown; muat: boolean } => ({
    user: null,
    profil: null,
    muat: false,
  })),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/lib/use-user", () => ({
  useUser: () => mockUseUser(),
}));

beforeEach(() => {
  mockUseUser.mockReturnValue({ user: null, profil: null, muat: false });
});

describe("CommandPalette", () => {
  it("dialog memakai label Indonesia Palet perintah", async () => {
    render(<CommandPalette />);
    fireEvent.click(
      screen.getByRole("button", { name: "Buka palet perintah" })
    );
    expect(
      await screen.findByRole("dialog", { name: "Palet perintah" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: "Command palette" })
    ).not.toBeInTheDocument();
  });

  it("Escape menutup palet dan fokus kembali ke pemicu", async () => {
    render(<CommandPalette />);
    const pemicu = screen.getByRole("button", { name: "Buka palet perintah" });
    pemicu.focus();
    fireEvent.click(pemicu);
    const input = await screen.findByRole("combobox", {
      name: "Cari perintah",
    });
    await waitFor(() => expect(input).toHaveFocus());
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Palet perintah" })
      ).not.toBeInTheDocument()
    );
    expect(pemicu).toHaveFocus();
  });

  it("pintasan Ctrl+K membuka palet", async () => {
    render(<CommandPalette />);
    expect(
      screen.queryByRole("dialog", { name: "Palet perintah" })
    ).not.toBeInTheDocument();
    fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    expect(
      await screen.findByRole("dialog", { name: "Palet perintah" })
    ).toBeInTheDocument();
  });
});
