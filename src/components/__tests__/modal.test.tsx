import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "@/components/modal";

function ModalTerpicu() {
  const [buka, setBuka] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setBuka(true)}>
        Buka modal
      </button>
      <Modal terbuka={buka} tutup={() => setBuka(false)} judul="Contoh Modal">
        <p>Isi modal untuk pengujian.</p>
      </Modal>
    </>
  );
}

describe("Modal", () => {
  it("saat terbuka me-render dialog beserta judul", async () => {
    render(
      <Modal terbuka tutup={() => {}} judul="Hapus Laporan">
        <p>Yakin ingin menghapus?</p>
      </Modal>
    );
    expect(
      await screen.findByRole("dialog", { name: "Hapus Laporan" })
    ).toBeInTheDocument();
    expect(screen.getByText("Hapus Laporan")).toBeInTheDocument();
  });

  it("tombol Escape memanggil tutup", () => {
    const tutup = vi.fn();
    render(
      <Modal terbuka tutup={tutup} judul="Tutup dengan Escape">
        <p>Isi</p>
      </Modal>
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(tutup).toHaveBeenCalledTimes(1);
  });

  it("fokus masuk ke dalam dialog saat dibuka", async () => {
    render(
      <Modal terbuka tutup={() => {}} judul="Fokus Awal">
        <p>Isi</p>
      </Modal>
    );
    const dialog = await screen.findByRole("dialog", { name: "Fokus Awal" });
    await waitFor(() =>
      expect(dialog).toContainElement(
        document.activeElement as HTMLElement | null
      )
    );
  });

  it("fokus kembali ke pemicu setelah modal ditutup", async () => {
    render(<ModalTerpicu />);
    const pemicu = screen.getByRole("button", { name: "Buka modal" });
    pemicu.focus();
    fireEvent.click(pemicu);
    await screen.findByRole("dialog", { name: "Contoh Modal" });
    fireEvent.click(screen.getByRole("button", { name: "Tutup modal" }));
    await waitFor(() => expect(pemicu).toHaveFocus());
  });
});
