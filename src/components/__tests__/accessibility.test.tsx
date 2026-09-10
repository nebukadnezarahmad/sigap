import { useState } from "react";
import axe from "axe-core";
import { render } from "@testing-library/react";
import { Search } from "lucide-react";
import { describe, expect, it } from "vitest";
import { FeedbackState } from "@/components/feedback-state";
import { SearchField } from "@/components/search-field";
import { Button } from "@/components/ui";

function ContohAksesibel() {
  const [nilai, setNilai] = useState("jalan");
  return (
    <main>
      <SearchField label="Cari laporan" nilai={nilai} onUbah={setNilai} />
      <FeedbackState
        jenis="tanpa-hasil"
        ikon={Search}
        judul="Tidak ada hasil"
        deskripsi="Coba istilah pencarian lain."
        aksi={<Button type="button">Bersihkan pencarian</Button>}
      />
    </main>
  );
}

describe("aksesibilitas primitif", () => {
  it("tidak memiliki pelanggaran axe yang dapat diperiksa di JSDOM", async () => {
    const { container } = render(<ContohAksesibel />);
    const hasil = await axe.run(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(hasil.violations).toEqual([]);
  });
});
