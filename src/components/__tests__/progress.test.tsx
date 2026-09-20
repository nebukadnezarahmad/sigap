import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Progress } from "@/components/progress";

describe("Progress", () => {
  it("me-render progressbar dengan nilai aria yang benar", () => {
    render(<Progress nilai={40} label="Mengunggah foto" />);
    const bar = screen.getByRole("progressbar", { name: "Mengunggah foto" });
    expect(bar).toHaveAttribute("aria-valuenow", "40");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it("menjepit nilai di luar rentang", () => {
    const { rerender } = render(<Progress nilai={150} label="Progres" />);
    expect(screen.getByRole("progressbar", { name: "Progres" })).toHaveAttribute(
      "aria-valuenow",
      "100"
    );
    rerender(<Progress nilai={-5} label="Progres" />);
    expect(screen.getByRole("progressbar", { name: "Progres" })).toHaveAttribute(
      "aria-valuenow",
      "0"
    );
  });

  it("bilah memakai warna aksi secara bawaan", () => {
    const { container } = render(<Progress nilai={50} label="Progres" />);
    const bar = screen.getByRole("progressbar", { name: "Progres" });
    const isi = bar.firstElementChild;
    expect(isi).toHaveClass("bg-action");
    expect(isi?.getAttribute("style")).toContain("50%");
    expect(container).toBeInTheDocument();
  });
});
