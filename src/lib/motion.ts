// Token motion Apple yang halus — satu-satunya sumber durasi/easing untuk
// animasi `motion/react` di seluruh aplikasi. Selaras dengan token CSS
// `--dur-*` + `--ease-apple` di `src/app/globals.css`.
//
// Standar: hover/press 150–180ms; fade/ganti-ikon 180–220ms; popover 180–240ms;
// modal/sheet 280–320ms; scroll-reveal 450–550ms sekali (`once`).

export const DUR = {
  instan: 0.1,
  cepat: 0.18,
  sedang: 0.3,
  reveal: 0.5,
} as const;

export const EASE_APPLE: [number, number, number, number] = [0.32, 0.72, 0, 1];

// Transisi siap pakai (turunan DUR + EASE_APPLE).
export const transisiInstan = { duration: DUR.instan, ease: EASE_APPLE } as const;
export const transisiCepat = { duration: DUR.cepat, ease: EASE_APPLE } as const;
export const transisiSedang = { duration: DUR.sedang, ease: EASE_APPLE } as const;
export const transisiReveal = { duration: DUR.reveal, ease: EASE_APPLE } as const;

// Scroll-reveal: y 12→0 + opacity selama 0,5 dtk, sekali saja.
// Wajib dipakai bersama `viewport={{ once: true, margin: "-80px" }}`.
// Contoh:
//   <motion.div initial={fadeNaik.initial} whileInView={fadeNaik.whileInView}
//     viewport={fadeNaik.viewport} transition={fadeNaik.transition} />
export const fadeNaik = {
  initial: { y: 12, opacity: 0 },
  whileInView: { y: 0, opacity: 1 },
  viewport: { once: true, margin: "-80px" },
  transition: transisiReveal,
} as const;

// Fade saja untuk pergantian daftar/restrained popover (180ms).
export const fadeSaja = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: transisiCepat,
} as const;

// Tekan tombol/kartu yang bisa ditekan: skala 0,97 saat ditekan.
// Contoh: <motion.button {...skalaPress}>.
export const skalaPress = {
  whileTap: { scale: 0.97 },
} as const;

// Modal/sheet/popover: y 16→0 + opacity selama 0,3 dtk (menggantikan spring lama).
// Contoh:
//   <motion.div initial={animasiModal.initial} animate={animasiModal.animate}
//     exit={animasiModal.exit} transition={transisiModal} />
export const transisiModal = {
  duration: DUR.sedang,
  ease: EASE_APPLE,
} as const;

export const animasiModal = {
  initial: { y: 16, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: 16, opacity: 0 },
} as const;

export const animasiPopover = {
  initial: { opacity: 0, y: 6, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 6, scale: 0.98 },
} as const;

// true bila pengguna meminta pengurangan gerak (OS/browser).
// Aman di server (mengembalikan false) dan bila matchMedia tak tersedia.
export function harusKurangiGerak(): boolean {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
