import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui";

describe("Button", () => {
  it("me-render children", () => {
    render(<Button>Kirim Laporan</Button>);
    expect(
      screen.getByRole("button", { name: "Kirim Laporan" })
    ).toBeInTheDocument();
  });

  it("disabled saat prop disabled diberikan", () => {
    render(<Button disabled>Simpan</Button>);
    expect(screen.getByRole("button", { name: "Simpan" })).toBeDisabled();
  });

  it("varian utama memakai warna aksi", () => {
    render(<Button variant="utama">Lapor Sekarang</Button>);
    expect(
      screen.getByRole("button", { name: "Lapor Sekarang" })
    ).toHaveClass("bg-action");
  });

  it("tiap varian punya kelas visual pembeda", () => {
    const { rerender } = render(<Button variant="sekunder">Aksi</Button>);
    expect(screen.getByRole("button", { name: "Aksi" })).toHaveClass(
      "bg-panel"
    );

    rerender(<Button variant="hantu">Aksi</Button>);
    expect(screen.getByRole("button", { name: "Aksi" })).toHaveClass(
      "text-muted"
    );

    rerender(<Button variant="bahaya">Aksi</Button>);
    expect(screen.getByRole("button", { name: "Aksi" })).toHaveClass(
      "bg-danger/10"
    );
  });
});
