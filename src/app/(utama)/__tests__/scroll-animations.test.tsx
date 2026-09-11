import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  PanggungPetaScroll,
  SorotTeksScroll,
  GaleriBuktiScroll,
  PenutupKineticOrbit,
} from "../scroll-animations";

describe("Scroll Animations", () => {
  it("me-render PanggungPetaScroll dengan container bertarget perspektif", () => {
    render(
      <PanggungPetaScroll>
        <div data-testid="peta-anak">Peta Interaktif</div>
      </PanggungPetaScroll>
    );
    expect(screen.getByTestId("panggung-peta-scroll")).toBeInTheDocument();
    expect(screen.getByTestId("peta-anak")).toBeInTheDocument();
  });

  it("me-render SorotTeksScroll dan memecah teks menjadi kata-kata", () => {
    render(
      <SorotTeksScroll teks="Kecil langkahnya terasa dampaknya bersama warga." />
    );
    const container = screen.getByTestId("sorot-teks-scroll");
    expect(container).toBeInTheDocument();
    expect(container).toHaveTextContent("Kecil");
    expect(container).toHaveTextContent("dampaknya");
  });

  it("me-render GaleriBuktiScroll dengan tombol navigasi geser dan indikator kartu", () => {
    render(<GaleriBuktiScroll />);
    expect(screen.getByTestId("galeri-bukti-scroll")).toBeInTheDocument();
    expect(
      screen.getByText(/Gotong royong warga lingkungan/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Kota dan permukiman berkelanjutan/i)
    ).toBeInTheDocument();

    // Memverifikasi tombol navigasi panah kiri dan kanan
    const tombolSebelumnya = screen.getByRole("button", {
      name: /geser ke kartu sebelumnya/i,
    });
    const tombolBerikutnya = screen.getByRole("button", {
      name: /geser ke kartu berikutnya/i,
    });
    expect(tombolSebelumnya).toBeInTheDocument();
    expect(tombolBerikutnya).toBeInTheDocument();

    // Memverifikasi region yang dapat digeser
    const regionGaleri = screen.getByRole("region", {
      name: /galeri bukti perubahan nyata yang dapat digeser/i,
    });
    expect(regionGaleri).toBeInTheDocument();

    // Memverifikasi tablist dots kartu
    const tablist = screen.getByRole("tablist", {
      name: /pilih kartu dokumentasi/i,
    });
    expect(tablist).toBeInTheDocument();
  });

  it("me-render PenutupKineticOrbit dengan orbit stage dan children CTA", () => {
    render(
      <PenutupKineticOrbit>
        <h2>Ada yang perlu kita bereskan?</h2>
        <button type="button">Buat laporan</button>
      </PenutupKineticOrbit>
    );
    expect(screen.getByTestId("penutup-kinetic-orbit")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Ada yang perlu kita bereskan\?/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Buat laporan/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Laporkan titik masalah/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Bukti foto tuntas/i)
    ).toBeInTheDocument();
  });
});
