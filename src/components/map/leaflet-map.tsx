"use client";

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type * as LeafletNS from "leaflet";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/use-theme";
import { svgUriKategori } from "@/lib/ikon-vektor";

const KUNCI_CARTO = process.env.NEXT_PUBLIC_CARTO_API_KEY ?? "";
const ADA_KUNCI_CARTO = KUNCI_CARTO.length > 0;

const TILE_TERANG = `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png${
  ADA_KUNCI_CARTO ? `?api_key=${KUNCI_CARTO}` : ""
}`;
const TILE_GELAP = `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png${
  ADA_KUNCI_CARTO ? `?api_key=${KUNCI_CARTO}` : ""
}`;

// Fallback ubin OSM standar saat kunci CARTO kosong. Tanpa ini, ubin CARTO
// tanpa kunci menampilkan watermark "API KEY REQUIRED" dan peta terlihat kotor.
const TILE_OSM = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATRIBUSI_OSM =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';
const ATRIBUSI_CARTO =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>';

function urlTile(gelap: boolean) {
  if (!ADA_KUNCI_CARTO) return TILE_OSM;
  return gelap ? TILE_GELAP : TILE_TERANG;
}

function atribusiTile() {
  return ADA_KUNCI_CARTO ? ATRIBUSI_CARTO : ATRIBUSI_OSM;
}

// Palet literal khusus Leaflet: gradien kanvas heatmap dan data-URI ikon SVG
// tidak bisa membaca var() CSS, jadi nilainya diselaraskan manual dengan
// token @theme di globals.css:
// - PUTIH_PIN: --color-panel mode terang (#ffffff), untuk ikon di atas pin berwarna.
// - HIJAU_BAKU: --color-daun-500 (#2e9e57), warna pin cadangan.
// - PANAS_SEDANG (#f97316): belum ada padanan token, didefinisikan di sini.
// - PANAS_RENDAH / PANAS_TINGGI dibaca dari --color-kunyit-400 / --color-danger
//   saat runtime (dengan nilai ganti yang sama bila token tak ditemukan).
const PUTIH_PIN = "#ffffff";
const HIJAU_BAKU = "#2e9e57";
const PANAS_SEDANG = "#f97316";

function nilaiToken(nama: string, ganti: string) {
  if (typeof window === "undefined") return ganti;
  return (
    getComputedStyle(document.documentElement).getPropertyValue(nama).trim() ||
    ganti
  );
}

export type TitikPeta = {
  id: string;
  lat: number;
  lng: number;
  warna: string;
  slug: string;
  judul: string;
};

type Mode = "jelajah" | "pilih" | "satu";

export function LeafletMap({
  titik,
  terpilih,
  onPilih,
  onKlikTitik,
  mode = "jelajah",
  pusat,
  zoom = 13,
  panas,
  className,
}: {
  titik: TitikPeta[];
  terpilih?: string | null;
  onPilih?: (lat: number, lng: number) => void;
  onKlikTitik?: (id: string) => void;
  mode?: Mode;
  pusat?: [number, number];
  zoom?: number;
  panas?: [number, number][];
  className?: string;
}) {
  const refDiv = useRef<HTMLDivElement>(null);
  const refPeta = useRef<LeafletNS.Map | null>(null);
  const refL = useRef<typeof LeafletNS | null>(null);
  const refLayer = useRef<LeafletNS.Layer | null>(null);
  const refTile = useRef<LeafletNS.TileLayer | null>(null);
  const refPengamat = useRef<ResizeObserver | null>(null);
  const refPanas = useRef<LeafletNS.Layer | null>(null);
  const refSudahFit = useRef(false);
  const gelap = useTheme();
  const cbRef = useRef({ onPilih, onKlikTitik });
  // `gelap` dibaca lewat ref di efek init agar ganti tema tidak me-recreate
  // seluruh peta; URL tile diperbarui oleh efek khusus di bawah.
  const gelapRef = useRef(gelap);
  const [mencariLokasi, setMencariLokasi] = useState(false);
  const [statusLokasi, setStatusLokasi] = useState<string | null>(null);

  useEffect(() => {
    cbRef.current = { onPilih, onKlikTitik };
    gelapRef.current = gelap;
  });

  useEffect(() => {
    let batal = false;

    async function init() {
      const modul = (await import("leaflet")) as unknown as {
        default: typeof LeafletNS;
      };
      const L = modul.default;
      await import("leaflet.markercluster");
      await import("leaflet.heat");
      if (batal || !refDiv.current || refPeta.current) return;

      const peta = L.map(refDiv.current, {
        center: pusat ?? [-6.2, 106.816666],
        zoom,
        zoomControl: false,
      });
      L.control.zoom({
        position: "bottomright",
        zoomInText: "+",
        zoomInTitle: "Perbesar peta",
        zoomOutText: "−",
        zoomOutTitle: "Perkecil peta",
      }).addTo(peta);

      refTile.current = L.tileLayer(urlTile(gelapRef.current), {
        attribution: atribusiTile(),
        maxZoom: 19,
      }).addTo(peta);

      peta.createPane("panas");
      const panePanas = peta.getPane("panas");
      if (panePanas) panePanas.style.zIndex = "350";

      if (mode === "pilih") {
        peta.on("click", (e: LeafletNS.LeafletMouseEvent) => {
          cbRef.current.onPilih?.(e.latlng.lat, e.latlng.lng);
        });
      }

      refPeta.current = peta;
      refL.current = L;
      renderTitik();

      const pengamat = new ResizeObserver(() => {
        peta.invalidateSize({ animate: false });
      });
      pengamat.observe(refDiv.current);
      refPengamat.current = pengamat;
    }

    function renderTitik() {
      const L = refL.current;
      const peta = refPeta.current;
      if (!L || !peta) return;

      if (refLayer.current) {
        peta.removeLayer(refLayer.current);
        refLayer.current = null;
      }
      if (refPanas.current) {
        peta.removeLayer(refPanas.current);
        refPanas.current = null;
      }

      if (panas && panas.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const heatFn = (L as any).heatLayer as any;
        if (heatFn) {
          refPanas.current = heatFn(panas, {
            radius: 34,
            blur: 24,
            maxZoom: 16,
            pane: "panas",
            gradient: {
              0.2: nilaiToken("--color-kunyit-400", "#fbbf24"),
              0.55: PANAS_SEDANG,
              0.9: nilaiToken("--color-danger", "#dc2626"),
            },
          }).addTo(peta);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (refPanas.current as any).bringToBack?.();
        }
      }

      if (mode === "jelajah") {
        const cluster = (
          L as unknown as {
            markerClusterGroup: (o?: object) => LeafletNS.MarkerClusterGroup;
          }
        ).markerClusterGroup({
          showCoverageOnHover: false,
          maxClusterRadius: 42,
        });
        titik.forEach((t) => {
          const adalahFasilitas =
            t.id.startsWith("fas:") || t.slug.startsWith("fasilitas:");
          const labelMarker = adalahFasilitas ? t.judul : `Pin laporan: ${t.judul}`;
          const m = L.marker([t.lat, t.lng], {
            icon: buatIkon(L, t.warna, t.slug, t.id === terpilih),
            // Marker Leaflet bisa difokus (Tab) dan diklik via Enter secara
            // bawaan; title/alt memberi nama yang terbaca pembaca layar.
            keyboard: true,
            title: labelMarker,
            alt: labelMarker,
          }).bindTooltip(escapeHtml(t.judul), {
            direction: "top",
            offset: [0, -22],
          });
          const bukaLaporan = () => cbRef.current.onKlikTitik?.(t.id);
          m.on("click", bukaLaporan);
          // Pengaman bila event keydown marker didukung: Space/Enter
          // membuka laporan yang sama seperti klik.
          (
            m as unknown as {
              on(
                nama: string,
                fn: (e: { originalEvent?: KeyboardEvent }) => void
              ): void;
            }
          ).on("keydown", (e) => {
            const tombol = e.originalEvent;
            if (tombol && (tombol.key === "Enter" || tombol.key === " ")) {
              tombol.preventDefault();
              bukaLaporan();
            }
          });
          cluster.addLayer(m);
        });
        peta.addLayer(cluster);
        refLayer.current = cluster;
        if (titik.length > 0 && !refSudahFit.current) {
          peta.fitBounds(cluster.getBounds().pad(0.15));
          refSudahFit.current = true;
        }
      } else if (titik.length > 0) {
        const t = titik[titik.length - 1];
        const layer = L.layerGroup().addTo(peta);
        const labelSatu =
          t.id.startsWith("fas:") || t.slug.startsWith("fasilitas:")
            ? t.judul
            : `Pin laporan: ${t.judul}`;
        L.marker([t.lat, t.lng], {
          icon: buatIkon(L, t.warna, t.slug, true),
          keyboard: true,
          title: labelSatu,
          alt: labelSatu,
        }).addTo(layer);
        refLayer.current = layer;
        peta.setView([t.lat, t.lng], Math.max(peta.getZoom(), 15));
      }
    }

    init();
    renderTitik();

    return () => {
      batal = true;
    };
  }, [titik, terpilih, mode, panas, pusat, zoom]);

  useEffect(() => {
    if (refTile.current) {
      refTile.current.setUrl(urlTile(gelap));
    }
  }, [gelap]);

  const pusatLat = pusat?.[0];
  const pusatLng = pusat?.[1];

  // Geser tampilan saat `pusat` berubah tanpa mengulang fitBounds.
  useEffect(() => {
    if (
      refPeta.current &&
      pusatLat !== undefined &&
      pusatLng !== undefined
    ) {
      refPeta.current.setView([pusatLat, pusatLng], refPeta.current.getZoom());
    }
  }, [pusatLat, pusatLng]);

  useEffect(() => {
    return () => {
      refPengamat.current?.disconnect();
      refPengamat.current = null;
      refPeta.current?.remove();
      refPeta.current = null;
      refTile.current = null;
      refLayer.current = null;
      refPanas.current = null;
      refSudahFit.current = false;
    };
  }, []);

  // Fallback keyboard untuk mode "pilih": peta Leaflet hanya bisa diklik
  // dengan tetikus, jadi sediakan tombol geolokasi + Enter untuk menandai
  // titik tengah peta (peta bisa digeser dengan tombol panah).
  function pakaiLokasiSaya() {
    if (!("geolocation" in navigator)) {
      setStatusLokasi("Peramban tidak mendukung geolokasi.");
      return;
    }
    setMencariLokasi(true);
    setStatusLokasi("Mencari lokasimu…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setMencariLokasi(false);
        setStatusLokasi(
          `Lokasi ditemukan: ${lat.toFixed(5)}, ${lng.toFixed(5)}.`
        );
        if (refPeta.current) {
          refPeta.current.setView(
            [lat, lng],
            Math.max(refPeta.current.getZoom(), 15)
          );
        }
        cbRef.current.onPilih?.(lat, lng);
      },
      (err) => {
        setMencariLokasi(false);
        if (err.code === err.PERMISSION_DENIED) {
          setStatusLokasi(
            "Akses lokasi ditolak. Izinkan akses lokasi di peramban, atau geser peta lalu tekan Enter."
          );
        } else if (err.code === err.TIMEOUT) {
          setStatusLokasi(
            "Pengambilan lokasi kehabisan waktu. Periksa koneksi lalu coba lagi."
          );
        } else {
          setStatusLokasi(
            "Lokasi tidak tersedia. Geser peta lalu tekan Enter."
          );
        }
      },
      { timeout: 8000 }
    );
  }

  // Enter/Space saat fokus di badan peta menandai titik tengah.
  // Abaikan bila fokus ada di kontrol zoom, marker, tautan, atau tombol
  // agar tidak ganda dengan aksi bawaan elemen tersebut.
  function pilihTengah(e: KeyboardEvent<HTMLDivElement>) {
    if (mode !== "pilih") return;
    if (e.key !== "Enter" && e.key !== " ") return;
    const el = e.target;
    if (!(el instanceof HTMLElement)) return;
    if (!el.closest(".leaflet-container")) return;
    if (el.closest(".leaflet-control, .leaflet-marker-icon, a, button")) {
      return;
    }
    e.preventDefault();
    const tengah = refPeta.current?.getCenter();
    if (tengah) cbRef.current.onPilih?.(tengah.lat, tengah.lng);
  }

  return (
    <>
      {/* Perbesar kontrol zoom bawaan Leaflet (30px) ke target 44px,
          plus cincin fokus yang jelas untuk marker keyboard. */}
      <style>{`.sigap-peta .leaflet-bar a{width:44px!important;height:44px!important;line-height:44px!important}
.sigap-peta .leaflet-marker-icon:focus-visible{outline:3px solid var(--action);outline-offset:3px;border-radius:12px}`}</style>
      <div className="relative h-full w-full" onKeyDown={pilihTengah}>
        <div
          ref={refDiv}
          className={cn(
            "sigap-peta z-0 h-full w-full",
            mode === "pilih" && "cursor-crosshair",
            className
          )}
          role="region"
          aria-label="Peta interaktif"
        />
        {mode === "pilih" && (
          <div className="pointer-events-none absolute left-3 top-3 z-[600] flex max-w-[calc(100%-1.5rem)] flex-col items-start gap-1.5">
            <button
              type="button"
              onClick={pakaiLokasiSaya}
              disabled={mencariLokasi}
              className="pointer-events-auto inline-flex min-h-11 items-center gap-2 rounded-full border garis-halus bg-panel/95 px-4 text-sm font-semibold shadow-lg backdrop-blur transition hover:border-action disabled:opacity-60"
            >
              {mencariLokasi ? "Mencari…" : "Pakai lokasi saya"}
            </button>
            <p className="rounded-lg bg-panel/90 px-2.5 py-1 text-[11px] leading-snug text-muted shadow backdrop-blur">
              Keyboard: geser dengan tombol panah, tekan Enter untuk menandai
              titik tengah.
            </p>
            {statusLokasi && (
              <p
                role="status"
                className="rounded-lg bg-panel/90 px-2.5 py-1 text-[11px] leading-snug text-ink shadow backdrop-blur"
              >
                {statusLokasi}
              </p>
            )}
          </div>
        )}
      </div>
      {/* Pintasan keyboard: setiap tombol membuka laporan yang sama
          seperti klik marker. Tersembunyi visual hingga difokus (pola
          skip-link) agar tidak membebani navigasi Tab pengguna awas. */}
      <ul aria-label="Pintasan keyboard daftar laporan">
        {titik.slice(0, 30).map((t) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => cbRef.current.onKlikTitik?.(t.id)}
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[2000] focus:min-h-11 focus:rounded-full focus:bg-action focus:px-5 focus:text-sm focus:font-semibold focus:text-white focus:shadow-xl"
            >
              Buka laporan: {t.judul}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

function escapeHtml(teks: string) {
  return teks
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function warnaAman(warna: string) {
  return /^#[0-9a-fA-F]{6}$/.test(warna) ? warna : HIJAU_BAKU;
}

function buatIkon(
  L: typeof LeafletNS,
  warna: string,
  slug: string,
  aktif?: boolean
) {
  const aman = warnaAman(warna);
  const ikon = svgUriKategori(slug, PUTIH_PIN, 15);
  return L.divIcon({
    className: "",
    html: `<span class="pin-sigap${aktif ? " pin-aktif" : ""}" style="--pin:${aman}"><img src="${ikon}" width="15" height="15" alt="" class="pin-ikon" /></span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    tooltipAnchor: [0, -26],
  });
}
