import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Inbox, WifiOff } from "lucide-react";
import { FeedbackState } from "@/components/feedback-state";

describe("FeedbackState", () => {
  it("me-render ikon, judul, dan deskripsi di tengah", () => {
    render(
      <FeedbackState
        jenis="kosong"
        ikon={Inbox}
        judul="Belum ada laporan"
        deskripsi="Jadilah yang pertama melapor."
      />
    );
    expect(
      screen.getByRole("status", { name: "" })
    ).toBeInTheDocument();
    expect(screen.getByText("Belum ada laporan")).toBeInTheDocument();
    expect(
      screen.getByText("Jadilah yang pertama melapor.")
    ).toBeInTheDocument();
  });

  it("jenis galat memakai role alert", () => {
    render(
      <FeedbackState jenis="galat" ikon={WifiOff} judul="Gagal memuat" />
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("me-render aksi saat diberikan", async () => {
    const pengguna = userEvent.setup();
    let diklik = 0;
    render(
      <FeedbackState
        jenis="luring"
        ikon={WifiOff}
        judul="Kamu luring"
        aksi={
          <button type="button" onClick={() => (diklik += 1)}>
            Coba lagi
          </button>
        }
      />
    );
    await pengguna.click(screen.getByRole("button", { name: "Coba lagi" }));
    expect(diklik).toBe(1);
  });
});
