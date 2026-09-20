import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotifikasiBel } from "@/components/notifikasi-bel";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  removeChannel: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/lib/use-user", () => ({
  useUser: () => ({ user: { id: "warga-1" } }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => {
    const query: Record<string, unknown> = {};
    query.select = vi.fn(() => query);
    query.eq = vi.fn(() => query);
    query.order = vi.fn(() => query);
    query.limit = vi.fn(() => query);
    query.then = (resolve: (value: { data: unknown[] }) => unknown) =>
      Promise.resolve({ data: [] }).then(resolve);

    const channel: Record<string, unknown> = {};
    channel.on = vi.fn(() => channel);
    channel.subscribe = vi.fn(() => channel);

    return {
      from: vi.fn(() => query),
      channel: vi.fn(() => channel),
      removeChannel: mocks.removeChannel,
    };
  },
}));

describe("NotifikasiBel", () => {
  beforeEach(() => vi.clearAllMocks());

  it("memindahkan fokus ke dialog dan mengembalikannya saat Escape", async () => {
    render(<NotifikasiBel />);
    const pemicu = screen.getByRole("button", { name: "Notifikasi" });
    pemicu.focus();
    fireEvent.click(pemicu);

    const dialog = await screen.findByRole("dialog", { name: "Notifikasi" });
    await waitFor(() =>
      expect(dialog).toContainElement(document.activeElement as HTMLElement | null)
    );
    expect(screen.getByRole("button", { name: "Tutup notifikasi" })).toHaveFocus();

    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(pemicu).toHaveFocus());
  });

  it("menutup dialog dari tombol yang terlihat dan mengembalikan fokus", async () => {
    render(<NotifikasiBel />);
    const pemicu = screen.getByRole("button", { name: "Notifikasi" });
    fireEvent.click(pemicu);

    fireEvent.click(await screen.findByRole("button", { name: "Tutup notifikasi" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(pemicu).toHaveFocus();
  });
});
