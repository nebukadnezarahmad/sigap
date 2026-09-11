import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TopoLines } from "@/components/topo-lines";

describe("TopoLines", () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => {
      return null;
    });
  });

  it("me-render container topo lines dengan atribut aksesibilitas yang tepat", () => {
    render(<TopoLines className="test-topo-class" />);
    const el = screen.getByTestId("topo-lines");
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute("aria-hidden", "true");
    expect(el).toHaveClass("test-topo-class");
    expect(el).toHaveClass("pointer-events-none");
  });

  it("dapat di-mount dan di-unmount tanpa melempar error di lingkungan non-WebGL (JSDOM)", () => {
    const { unmount } = render(<TopoLines density={12} speed={0.3} />);
    expect(screen.getByTestId("topo-lines")).toBeInTheDocument();
    expect(() => unmount()).not.toThrow();
  });
});
