import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SearchField } from "@/components/search-field";

describe("SearchField", () => {
  it("label persisten terhubung ke input pencarian", () => {
    render(
      <SearchField label="Cari layanan" nilai="" onUbah={() => {}} />
    );
    const input = screen.getByRole("searchbox", { name: "Cari layanan" });
    expect(input).toHaveAttribute("type", "search");
  });

  it("memanggil onUbah saat mengetik", async () => {
    const pengguna = userEvent.setup();
    const onUbah = vi.fn();
    render(<SearchField label="Cari" nilai="" onUbah={onUbah} />);
    await pengguna.type(screen.getByRole("searchbox", { name: "Cari" }), "air");
    expect(onUbah).toHaveBeenCalled();
  });

  it("tombol bersih muncul saat ada nilai dan mengosongkan", async () => {
    const pengguna = userEvent.setup();
    const onUbah = vi.fn();
    const onBersihkan = vi.fn();
    render(
      <SearchField
        label="Cari"
        nilai="banjir"
        onUbah={onUbah}
        onBersihkan={onBersihkan}
      />
    );
    const tombol = screen.getByRole("button", { name: "Bersihkan pencarian" });
    expect(tombol).toBeInTheDocument();
    await pengguna.click(tombol);
    expect(onUbah).toHaveBeenCalledWith("");
    expect(onBersihkan).toHaveBeenCalledTimes(1);
  });

  it("tombol bersih disembunyikan saat nilai kosong", () => {
    render(<SearchField label="Cari" nilai="" onUbah={() => {}} />);
    expect(
      screen.queryByRole("button", { name: "Bersihkan pencarian" })
    ).not.toBeInTheDocument();
  });
});
