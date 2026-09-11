import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  PanggungPetaScroll,
  SorotTeksScroll,
  GaleriBuktiScroll,
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

  it("me-render GaleriBuktiScroll dengan 3 kartu dokumentasi warga", () => {
    render(<GaleriBuktiScroll />);
    expect(screen.getByTestId("galeri-bukti-scroll")).toBeInTheDocument();
    expect(
      screen.getByText(/Gotong royong warga lingkungan/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Kota dan permukiman berkelanjutan/i)
    ).toBeInTheDocument();
  });
});
