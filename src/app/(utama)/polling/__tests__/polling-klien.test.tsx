import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PollingKlien } from "../polling-klien";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  resolveInsert: undefined as
    | ((hasil: { error: null | { message: string } }) => void)
    | undefined,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

vi.mock("@/lib/use-user", () => ({
  useUser: () => ({ user: { id: "warga-1" } }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => {
    const channel: Record<string, unknown> = {};
    channel.on = vi.fn(() => channel);
    channel.subscribe = vi.fn(() => channel);

    return {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "warga-1" } } }),
      },
      from: vi.fn(() => ({
        insert: vi.fn(
          () =>
            new Promise<{ error: null | { message: string } }>((resolve) => {
              mocks.resolveInsert = resolve;
            })
        ),
      })),
      channel: vi.fn(() => channel),
      removeChannel: vi.fn(),
    };
  },
}));

describe("PollingKlien", () => {
  beforeEach(() => {
    mocks.refresh.mockClear();
    mocks.resolveInsert = undefined;
  });

  it("baru mengumumkan suara tercatat setelah insert berhasil", async () => {
    render(
      <PollingKlien
        awal={[
          {
            id: "poll-1",
            pertanyaan: "Setuju dengan program ini?",
            opsi: ["Setuju", "Tidak setuju"],
            totalSuara: 0,
            perOpsi: [0, 0],
            pilihanKu: null,
            buatanKu: false,
          },
        ]}
        isAdmin={false}
        masuk
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Setuju" }));
    expect(await screen.findByText("Menyimpan suaramu…")).toBeInTheDocument();
    expect(screen.queryByText(/suaramu tercatat/i)).not.toBeInTheDocument();

    await waitFor(() => expect(mocks.resolveInsert).toBeTypeOf("function"));
    await act(async () => mocks.resolveInsert?.({ error: null }));

    expect(await screen.findByText(/suaramu tercatat/i)).toBeInTheDocument();
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });
});
