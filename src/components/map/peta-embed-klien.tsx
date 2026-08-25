"use client";

import dynamic from "next/dynamic";
import type { TitikPeta } from "./leaflet-map";

const LeafletMap = dynamic(
  () => import("./leaflet-map").then((m) => m.LeafletMap),
  {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse bg-panel-2" />,
  }
);

export function PetaEmbedKlien({ titik }: { titik: TitikPeta[] }) {
  return <LeafletMap titik={titik} zoom={12} />;
}
