import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PixelGrid } from "@/components/pixel-grid";

describe("PixelGrid", () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => {
      return {
        scale: vi.fn(),
        clearRect: vi.fn(),
        beginPath: vi.fn(),
        roundRect: vi.fn(),
        fill: vi.fn(),
        fillStyle: "",
      } as unknown as CanvasRenderingContext2D;
    });
  });

  it("me-render container pixel grid dengan atribut aksesibilitas yang tepat", () => {
    render(<PixelGrid className="test-custom-class" />);
    const el = screen.getByTestId("pixel-grid");
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute("aria-hidden", "true");
    expect(el).toHaveClass("test-custom-class");
    expect(el).toHaveClass("pointer-events-none");
  });

  it("dapat di-mount dan di-unmount tanpa error", () => {
    const { unmount } = render(<PixelGrid cellSize={32} speed={0.5} />);
    expect(screen.getByTestId("pixel-grid")).toBeInTheDocument();
    expect(() => unmount()).not.toThrow();
  });
});
