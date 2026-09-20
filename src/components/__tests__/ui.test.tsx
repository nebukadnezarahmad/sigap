import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Search } from "lucide-react";
import {
  Avatar,
  Button,
  IconButton,
  Skeleton,
  SkeletonGrafik,
  SkeletonKartu,
  SkeletonTeks,
} from "@/components/ui";

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

  it("size md/lg memenuhi target sentuh 44px", () => {
    const { rerender } = render(<Button size="md">Simpan</Button>);
    expect(screen.getByRole("button", { name: "Simpan" })).toHaveClass(
      "min-h-[44px]"
    );
    rerender(<Button size="lg">Simpan</Button>);
    expect(screen.getByRole("button", { name: "Simpan" })).toHaveClass(
      "min-h-[44px]"
    );
  });

  it("loading membuat tombol disabled + aria-busy + spinner", () => {
    render(<Button loading>Kirim</Button>);
    const tombol = screen.getByRole("button", { name: "Kirim" });
    expect(tombol).toBeDisabled();
    expect(tombol).toHaveAttribute("aria-busy", "true");
  });

  it("loading tetap menonaktifkan tombol saat disabled diberikan false", () => {
    render(<Button loading disabled={false}>Kirim</Button>);
    expect(screen.getByRole("button", { name: "Kirim" })).toBeDisabled();
  });

  it("size sm tetap memenuhi target sentuh 44px", () => {
    render(<Button size="sm">Simpan</Button>);
    expect(screen.getByRole("button", { name: "Simpan" })).toHaveClass(
      "min-h-[44px]"
    );
  });

  it("loadingLabel menggantikan children saat loading", () => {
    render(
      <Button loading loadingLabel="Mengirim…">
        Kirim
      </Button>
    );
    expect(
      screen.getByRole("button", { name: "Mengirim…" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Kirim" })).not.toBeInTheDocument();
  });
});

describe("IconButton", () => {
  it("me-render dengan nama aksesibel wajib", () => {
    render(
      <IconButton aria-label="Cari">
        <Search size={16} />
      </IconButton>
    );
    expect(screen.getByRole("button", { name: "Cari" })).toBeInTheDocument();
  });

  it("ukuran md memenuhi target 44px dan rounded-full", () => {
    render(
      <IconButton aria-label="Tutup" ukuran="md">
        <Search size={16} />
      </IconButton>
    );
    const tombol = screen.getByRole("button", { name: "Tutup" });
    expect(tombol).toHaveClass("rounded-full");
    expect(tombol).toHaveClass("min-h-[44px]");
  });

  it("ukuran sm tetap menyediakan kotak interaksi 44px", () => {
    render(
      <IconButton aria-label="Cari" ukuran="sm">
        <Search size={16} />
      </IconButton>
    );
    expect(screen.getByRole("button", { name: "Cari" })).toHaveClass(
      "min-h-[44px]"
    );
  });
});

describe("Skeleton", () => {
  it("Skeleton dasar disembunyikan dari pembaca layar", () => {
    const { container } = render(<Skeleton className="h-4 w-full" />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("SkeletonTeks mengumumkan status muat", () => {
    render(<SkeletonTeks baris={3} label="Memuat komentar…" />);
    expect(
      screen.getByRole("status", { name: "Memuat komentar…" })
    ).toBeInTheDocument();
  });

  it("SkeletonKartu dan SkeletonGrafik memakai label bawaan", () => {
    render(<SkeletonKartu />);
    render(<SkeletonGrafik />);
    expect(screen.getAllByRole("status").length).toBe(2);
  });
});

describe("Avatar", () => {
  it("alt foto memakai pola Foto profil nama", () => {
    render(<Avatar nama="Siti Aminah" url="https://contoh.id/foto.jpg" />);
    expect(screen.getByAltText("Foto profil Siti Aminah")).toBeInTheDocument();
  });
});
