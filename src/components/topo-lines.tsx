"use client";

import { useEffect, useRef } from "react";

interface TopoLinesProps {
  className?: string;
  density?: number;
  speed?: number;
  interactive?: boolean;
}

const VERT_SHADER = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAG_SHADER = `
precision highp float;
varying vec2 v_uv;
uniform vec2 u_res;
uniform float u_time;
uniform float u_speed;
uniform float u_density;
uniform vec2 u_mouse;
uniform float u_mouseAct;
uniform vec3 u_ink0;
uniform vec3 u_ink1;
uniform float u_bgalpha;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

float fbm(vec2 p, float t) {
  float v = 0.0;
  float a = 0.52;
  mat2 m = mat2(0.80, 0.60, -0.60, 0.80);
  vec2 sh = vec2(t * 0.08, t * 0.05);
  for (int i = 0; i < 3; i++) {
    v += a * noise(p + sh);
    p = m * p * 2.02 + vec2(7.3, 3.1);
    sh = m * sh * 1.35;
    a *= 0.52;
  }
  return v;
}

float terrain(vec2 p, float t) {
  p = mat2(1.02, 0.20, -0.14, 0.92) * p;
  float base = fbm(p * 0.6, t * 0.6);
  base = (base - 0.5) * 1.6 + 0.5;
  return base;
}

void main() {
  float aspect = u_res.x / max(u_res.y, 1.0);
  vec2 uv = vec2(v_uv.x * aspect, v_uv.y);
  float t = u_time * u_speed;

  vec2 p = uv * 2.2;
  float h0 = terrain(p, t);

  // Mouse elevation hill
  if (u_mouseAct > 0.01) {
    vec2 toM = uv - u_mouse;
    float mDist2 = dot(toM, toM);
    float hill = exp(-mDist2 * 8.0) * 0.45 * u_mouseAct;
    h0 += hill;
  }

  // Analytical contour lines
  float N = u_density;
  float H = h0 * N;
  vec2 dH = vec2(dFdx(H), dFdy(H));
  float gradPx = length(dH);
  float dInt = abs(fract(H) - 0.5);
  float dPx = dInt / max(gradPx, 1e-4);

  // Every 5th line is an index contour (heavier)
  float idx = floor(H + 0.5);
  float isIdx = 1.0 - step(0.5, mod(idx, 5.0));

  float lineW = mix(1.2, 2.4, isIdx);
  float line = 1.0 - smoothstep(lineW * 0.4, lineW * 0.9, dPx);

  // Blend colors
  vec3 ink = mix(u_ink0, u_ink1, isIdx);
  float alpha = line * mix(0.18, 0.42, isIdx);

  // Subtle glow around pointer
  if (u_mouseAct > 0.01) {
    float mGlow = exp(-dot(uv - u_mouse, uv - u_mouse) * 12.0) * 0.15 * u_mouseAct;
    alpha += mGlow;
  }

  if (alpha < 0.005) discard;

  gl_FragColor = vec4(ink, alpha);
}
`;

export function TopoLines({
  className = "",
  density = 16,
  speed = 0.25,
  interactive = true,
}: TopoLinesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let gl: WebGLRenderingContext | null = null;
    try {
      gl =
        (canvas.getContext("webgl", { alpha: true, antialias: true }) as WebGLRenderingContext | null) ||
        (canvas.getContext("experimental-webgl", { alpha: true, antialias: true }) as WebGLRenderingContext | null);
    } catch {
      return;
    }

    if (!gl) return;

    // Enable standard derivatives extension for dFdx/dFdy
    gl.getExtension("OES_standard_derivatives");

    const compileShader = (type: number, src: string) => {
      if (!gl) return null;
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        gl.deleteShader(s);
        return null;
      }
      return s;
    };

    const vs = compileShader(gl.VERTEX_SHADER, VERT_SHADER);
    const fs = compileShader(
      gl.FRAGMENT_SHADER,
      "#extension GL_OES_standard_derivatives : enable\n" + FRAG_SHADER
    );
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;

    gl.useProgram(prog);

    // Quad buffer
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );

    const aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Uniform locations
    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uSpeed = gl.getUniformLocation(prog, "u_speed");
    const uDensity = gl.getUniformLocation(prog, "u_density");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");
    const uMouseAct = gl.getUniformLocation(prog, "u_mouseAct");
    const uInk0 = gl.getUniformLocation(prog, "u_ink0");
    const uInk1 = gl.getUniformLocation(prog, "u_ink1");

    gl.uniform1f(uSpeed, speed);
    gl.uniform1f(uDensity, density);

    let isVisible = true;
    let width = 0;
    let height = 0;
    let mouseTargetX = 0.5;
    let mouseTargetY = 0.5;
    let mouseCurrX = 0.5;
    let mouseCurrY = 0.5;
    let mouseActive = 0;
    let animId: number | null = null;
    let lastTime = performance.now();
    let accumulatedTime = 0;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const aspect = rect.width / rect.height;
        mouseTargetX = ((e.clientX - rect.left) / rect.width) * aspect;
        mouseTargetY = 1.0 - (e.clientY - rect.top) / rect.height;
        mouseActive = 1;
      }
    };

    const handlePointerLeave = () => {
      mouseActive = 0;
    };

    if (interactive) {
      window.addEventListener("pointermove", handlePointerMove, { passive: true });
      container.addEventListener("pointerleave", handlePointerLeave, { passive: true });
    }

    const resize = () => {
      if (!container || !canvas || !gl) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = container.clientWidth;
      height = container.clientHeight;

      const pxW = Math.max(1, Math.round(width * dpr));
      const pxH = Math.max(1, Math.round(height * dpr));

      if (canvas.width !== pxW || canvas.height !== pxH) {
        canvas.width = pxW;
        canvas.height = pxH;
        gl.viewport(0, 0, pxW, pxH);
        gl.uniform2f(uRes, pxW, pxH);
      }
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

    const isDark = () => document.documentElement.classList.contains("dark");

    const draw = (t: number) => {
      if (!gl || width <= 0 || height <= 0) return;

      const dark = isDark();

      // Colors:
      // Light mode: Action Blue (#0066cc) + Deep Navy (#004080)
      // Dark mode: Cyan (#38bdf8) + Warm Amber (#fd9d24)
      if (dark) {
        gl.uniform3f(uInk0, 0.22, 0.74, 0.97); // #38bdf8
        gl.uniform3f(uInk1, 0.99, 0.62, 0.14); // #fd9d24
      } else {
        gl.uniform3f(uInk0, 0.0, 0.40, 0.80);  // #0066cc
        gl.uniform3f(uInk1, 0.18, 0.62, 0.34); // #2e9e57
      }

      mouseCurrX += (mouseTargetX - mouseCurrX) * 0.08;
      mouseCurrY += (mouseTargetY - mouseCurrY) * 0.08;

      gl.uniform1f(uTime, t);
      gl.uniform2f(uMouse, mouseCurrX, mouseCurrY);
      gl.uniform1f(uMouseAct, mouseActive);

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const loop = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      accumulatedTime += delta;

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
      if (prog && gl) gl.deleteProgram(prog);
      if (vs && gl) gl.deleteShader(vs);
      if (fs && gl) gl.deleteShader(fs);
      if (buf && gl) gl.deleteBuffer(buf);
    };
  }, [density, speed, interactive]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 -z-10 pointer-events-none overflow-hidden ${className}`}
      aria-hidden="true"
      data-testid="topo-lines"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
