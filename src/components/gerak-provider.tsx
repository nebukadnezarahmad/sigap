"use client";

import { MotionConfig } from "motion/react";

/**
 * Menghormati prefers-reduced-motion untuk animasi motion/react.
 * CSS `@media (prefers-reduced-motion)` di globals.css hanya menjinakkan
 * transisi CSS — motion/react menganimasi lewat JS, jadi butuh ini.
 */
export function GerakProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
