"use client";

import { useEffect, useRef } from "react";

interface PixelGridProps {
  cellSize?: number;
  gap?: number;
  speed?: number;
  interactive?: boolean;
  className?: string;
}

export function PixelGrid({
  cellSize = 44,
  gap = 3,
  speed = 0.35,
  interactive = true,
  className = "",
}: PixelGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext("2d");
    } catch {
      return;
    }
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let animId: number | null = null;
    let isVisible = true;
    let width = 0;
    let height = 0;
    let dpr = 1;

    // Pointer tracking with smooth lerp
    let mouseTargetX = -1000;
    let mouseTargetY = -1000;
    let mouseCurrentX = -1000;
    let mouseCurrentY = -1000;
    let mouseIntensity = 0;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      mouseTargetX = e.clientX - rect.left;
      mouseTargetY = e.clientY - rect.top;
      mouseIntensity = 1;
    };

    const handlePointerLeave = () => {
      mouseIntensity = 0;
    };

    if (interactive) {
      window.addEventListener("pointermove", handlePointerMove, { passive: true });
      container.addEventListener("pointerleave", handlePointerLeave, { passive: true });
    }

    const resize = () => {
      if (!container || !canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = container.clientWidth;
      height = container.clientHeight;

      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
    };

    resize();

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            resize();
            if (prefersReducedMotion) draw(0);
          })
        : null;

    resizeObserver?.observe(container);

    const intersectionObserver =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver((entries) => {
            const entry = entries[0];
            isVisible = entry ? entry.isIntersecting : true;
            if (isVisible && !prefersReducedMotion && animId === null) {
              lastTime = performance.now();
              animId = requestAnimationFrame(loop);
            } else if (!isVisible && animId !== null) {
              cancelAnimationFrame(animId);
              animId = null;
            }
          })
        : null;

    intersectionObserver?.observe(container);

    // Color palette: SDG 11 Action Blue, Emerald Green, Warm Amber
    // We sample these tones to create subtle harmonic refraction
    const isDark = () => document.documentElement.classList.contains("dark");

    let lastTime = performance.now();
    let accumulatedTime = 0;

    const draw = (t: number) => {
      if (width <= 0 || height <= 0) return;
      ctx.clearRect(0, 0, width, height);

      const dark = isDark();
      const step = cellSize + gap;
      const cols = Math.ceil(width / step);
      const rows = Math.ceil(height / step);

      // Smooth pointer interpolation
      mouseCurrentX += (mouseTargetX - mouseCurrentX) * 0.1;
      mouseCurrentY += (mouseTargetY - mouseCurrentY) * 0.1;

      const baseAlpha = dark ? 0.04 : 0.03;
      const maxExtraAlpha = dark ? 0.22 : 0.14;

      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const x = c * step;
          const y = r * step;

          // Wave field
          const wave1 = Math.sin(c * 0.18 + t * 0.7) * Math.cos(r * 0.18 - t * 0.5);
          const wave2 = Math.sin((c + r) * 0.12 + t * 0.35);
          const combined = (wave1 + wave2) * 0.5; // range approx -1 to 1
          const normalizedWave = Math.max(0, combined);

          // Mouse proximity calculation
          let mouseFactor = 0;
          if (interactive && mouseIntensity > 0) {
            const centerX = x + cellSize / 2;
            const centerY = y + cellSize / 2;
            const dist = Math.hypot(centerX - mouseCurrentX, centerY - mouseCurrentY);
            const radius = 220;
            if (dist < radius) {
              mouseFactor = (1 - dist / radius) * mouseIntensity;
              mouseFactor = mouseFactor * mouseFactor; // exponential falloff
            }
          }

          const alpha = baseAlpha + normalizedWave * maxExtraAlpha + mouseFactor * 0.28;
          if (alpha < 0.01) continue;

          // Color selection: blend between Action Blue (SDG 11) and Emerald/Amber highlights
          const colorSelector = (Math.sin(c * 0.25 - r * 0.2 + t * 0.2) + 1) / 2;

          let rCol = 0;
          let gCol = 102;
          let bCol = 204; // default action blue #0066cc

          if (colorSelector > 0.75) {
            // Warm Amber highlight (#fd9d24)
            rCol = 253;
            gCol = 157;
            bCol = 36;
          } else if (colorSelector > 0.45) {
            // Emerald Green (#2e9e57)
            rCol = 46;
            gCol = 158;
            bCol = 87;
          } else if (dark) {
            // Cyan/Sky in dark mode
            rCol = 56;
            gCol = 189;
            bCol = 248;
          }

          ctx.fillStyle = `rgba(${rCol}, ${gCol}, ${bCol}, ${Math.min(alpha, 0.45)})`;

          // Subtle rounded corners for blocks
          const radius = 4;
          ctx.beginPath();
          ctx.roundRect(x, y, cellSize, cellSize, radius);
          ctx.fill();
        }
      }
    };

    const loop = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      accumulatedTime += delta * speed;

      draw(accumulatedTime);

      if (isVisible && !prefersReducedMotion) {
        animId = requestAnimationFrame(loop);
      }
    };

    if (prefersReducedMotion) {
      draw(0);
    } else {
      animId = requestAnimationFrame(loop);
    }

    return () => {
      if (animId !== null) cancelAnimationFrame(animId);
      if (interactive) {
        window.removeEventListener("pointermove", handlePointerMove);
        container.removeEventListener("pointerleave", handlePointerLeave);
      }
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
    };
  }, [cellSize, gap, speed, interactive]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 -z-10 pointer-events-none overflow-hidden ${className}`}
      style={{
        maskImage:
          "linear-gradient(to bottom, black 0%, black calc(100% - 160px), transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, black 0%, black calc(100% - 160px), transparent 100%)",
      }}
      aria-hidden="true"
      data-testid="pixel-grid"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
