import { act, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BadgeSaya } from "../papan-skor/badge-saya";

const { mockFrom, mockUseUser } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockUseUser: vi.fn(),
}));

vi.mock("@/lib/use-user", () => ({
  useUser: mockUseUser,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ from: mockFrom }),
}));

describe("BadgeSaya", () => {
  beforeEach(() => {
    mockFrom.mockReset();
    mockUseUser.mockReturnValue({ user: null, muat: false });
  });

  it("menyatukan perjalanan warga dan seluruh koleksi lencana", () => {
    render(<BadgeSaya />);

    expect(
      screen.getByRole("heading", { name: "Perjalananmu", level: 2 })
    ).toBeInTheDocument();

    const koleksi = screen.getByRole("list", { name: "Koleksi lencana" });
    expect(within(koleksi).getAllByRole("listitem")).toHaveLength(10);
  });

  it("tetap memuat sampai poin dan lencana sama-sama tersedia", async () => {
    let selesaikanLencana: (nilai: { data: { badge_key: string }[]; error: null }) => void;
    const lencanaTertunda = new Promise<{ data: { badge_key: string }[]; error: null }>(
      (resolve) => {
        selesaikanLencana = resolve;
      }
    );

    mockUseUser.mockReturnValue({ user: { id: "warga-1" }, muat: false });
    mockFrom.mockImplementation((tabel: string) => ({
      select: () => ({
        eq: () =>
          tabel === "user_badges"
            ? lencanaTertunda
            : {
                single: () => Promise.resolve({ data: { poin: 75 }, error: null }),
              },
      }),
    }));

    const { unmount } = render(<BadgeSaya />);
    await waitFor(() => expect(mockFrom).toHaveBeenCalledTimes(2));
    await act(async () => Promise.resolve());

    expect(
      screen.getByRole("status", { name: "Memuat progres lencanamu" })
    ).toBeInTheDocument();
    expect(screen.queryByText("0 dari 10 lencana")).not.toBeInTheDocument();

    unmount();
    selesaikanLencana!({ data: [], error: null });
  });

  it("menampilkan galat jika progres tidak dapat dimuat", async () => {
    mockUseUser.mockReturnValue({ user: { id: "warga-1" }, muat: false });
    mockFrom.mockImplementation((tabel: string) => ({
      select: () => ({
        eq: () =>
          tabel === "user_badges"
            ? Promise.resolve({ data: null, error: new Error("gagal") })
            : {
                single: () => Promise.resolve({ data: null, error: new Error("gagal") }),
              },
      }),
    }));

    render(<BadgeSaya />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Progres belum dapat dimuat"
    );
  });
});
