"use client";

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import { useEffect, useRef } from "react";
import type * as LeafletNS from "leaflet";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/use-theme";
import { svgUriKategori } from "@/lib/ikon-vektor";

const CARTO_KEY = process.env.NEXT_PUBLIC_CARTO_API_KEY
  ? `?api_key=${process.env.NEXT_PUBLIC_CARTO_API_KEY}`
  : "";

const TILE_TERANG =
  `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png${CARTO_KEY}`;
const TILE_GELAP =
  `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png${CARTO_KEY}`;

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

  useEffect(() => {
    cbRef.current = { onPilih, onKlikTitik };
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
      L.control.zoom({ position: "bottomright" }).addTo(peta);

      refTile.current = L.tileLayer(gelap ? TILE_GELAP : TILE_TERANG, {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>',
        maxZoom: 19,
      }).addTo(peta);

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
            gradient: { 0.2: "#fbbf24", 0.55: "#f97316", 0.9: "#dc2626" },
          }).addTo(peta);
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
          const m = L.marker([t.lat, t.lng], {
            icon: buatIkon(L, t.warna, t.slug, t.id === terpilih),
          }).bindTooltip(t.judul, { direction: "top", offset: [0, -22] });
          m.on("click", () => cbRef.current.onKlikTitik?.(t.id));
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
        L.marker([t.lat, t.lng], {
          icon: buatIkon(L, t.warna, t.slug, true),
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
      refTile.current.setUrl(gelap ? TILE_GELAP : TILE_TERANG);
    }
  }, [gelap]);

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

  return (
    <div
      ref={refDiv}
      className={cn(
        "z-0 h-full w-full",
        mode === "pilih" && "cursor-crosshair",
        className
      )}
      role="application"
      aria-label="Peta interaktif"
    />
  );
}

function buatIkon(
  L: typeof LeafletNS,
  warna: string,
  slug: string,
  aktif?: boolean
) {
  const ikon = svgUriKategori(slug, "#ffffff", 15);
  return L.divIcon({
    className: "",
    html: `<span class="pin-sigap${aktif ? " pin-aktif" : ""}" style="--pin:${warna}"><img src="${ikon}" width="15" height="15" alt="" class="pin-ikon" /></span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    tooltipAnchor: [0, -26],
  });
}
