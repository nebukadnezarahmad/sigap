"use client";

import { useSyncExternalStore } from "react";

function langganan(cb: () => void) {
  const pengamat = new MutationObserver(cb);
  pengamat.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => pengamat.disconnect();
}

function ambil() {
  return document.documentElement.classList.contains("dark");
}

function awal() {
  return false;
}

export function useTheme() {
  return useSyncExternalStore(langganan, ambil, awal);
}

export function toggleTema() {
  const gelap = document.documentElement.classList.contains("dark");
  document.documentElement.classList.toggle("dark", !gelap);
  localStorage.setItem("tema", !gelap ? "dark" : "light");
}
