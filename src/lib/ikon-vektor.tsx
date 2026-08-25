import type { BadgeDef, LevelDef } from "@/lib/constants";

type AtributIkon = Readonly<Record<string, string>>;

export type NodeIkon = ReadonlyArray<readonly [string, AtributIkon]>;

type PetaIkon = Readonly<Record<string, NodeIkon>>;

const NODE_KATEGORI: PetaIkon = {
  "sampah": [
    ["path", { d: "M10 11v6" }],
    ["path", { d: "M14 11v6" }],
    ["path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" }],
    ["path", { d: "M3 6h18" }],
    ["path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" }]
  ],
  "drainase": [
    ["path", { d: "M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z" }],
    ["path", { d: "M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97" }]
  ],
  "lampu": [
    ["path", { d: "M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" }],
    ["path", { d: "M9 18h6" }],
    ["path", { d: "M10 22h4" }]
  ],
  "jalan": [
    ["rect", { x: "2", y: "6", width: "20", height: "8", rx: "1" }],
    ["path", { d: "M17 14v7" }],
    ["path", { d: "M7 14v7" }],
    ["path", { d: "M17 3v3" }],
    ["path", { d: "M7 3v3" }],
    ["path", { d: "M10 14 2.3 6.3" }],
    ["path", { d: "m14 6 7.7 7.7" }],
    ["path", { d: "m8 6 8 8" }]
  ],
  "ruang-hijau": [
    ["path", { d: "M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z" }],
    ["path", { d: "M7 16v6" }],
    ["path", { d: "M13 19v3" }],
    ["path", { d: "M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5" }]
  ],
  "lainnya": [
    ["path", { d: "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" }],
    ["circle", { cx: "12", cy: "10", r: "3" }]
  ]
} as const;

export const NODE_LAIN: PetaIkon = {
  "semai": [
    ["path", { d: "M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3" }],
    ["path", { d: "M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4" }],
    ["path", { d: "M5 21h14" }]
  ],
  "tunas": [
    ["path", { d: "M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" }],
    ["path", { d: "M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" }]
  ],
  "pohon": [
    ["path", { d: "m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z" }],
    ["path", { d: "M12 22v-3" }]
  ],
  "rimbawan": [
    ["path", { d: "M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" }],
    ["path", { d: "M5 21h14" }]
  ],
  "kontributor": [
    ["path", { d: "m11 17 2 2a1 1 0 1 0 3-3" }],
    ["path", { d: "m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" }],
    ["path", { d: "m21 3 1 11h-2" }],
    ["path", { d: "M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" }],
    ["path", { d: "M3 4h8" }]
  ],
  "juru_bersih": [
    ["path", { d: "m11 10 3 3" }],
    ["path", { d: "M6.5 21A3.5 3.5 0 1 0 3 17.5a2.62 2.62 0 0 1-.708 1.792A1 1 0 0 0 3 21z" }],
    ["path", { d: "M9.969 17.031 21.378 5.624a1 1 0 0 0-3.002-3.002L6.967 14.031" }]
  ],
  "pendengar": [
    ["path", { d: "M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0" }],
    ["path", { d: "M15 8.5a2.5 2.5 0 0 0-5 0v1a2 2 0 1 1 0 4" }]
  ],
  "suara_rakyat": [
    ["path", { d: "M11 6a13 13 0 0 0 8.4-2.8A1 1 0 0 1 21 4v12a1 1 0 0 1-1.6.8A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" }],
    ["path", { d: "M6 14a12 12 0 0 0 2.4 7.2 2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14" }],
    ["path", { d: "M8 6v8" }]
  ],
  "pemberi_semangat": [
    ["path", { d: "M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4" }]
  ],
  "terkunci": [
    ["rect", { width: "18", height: "11", x: "3", y: "11", rx: "2", ry: "2" }],
    ["path", { d: "M7 11V7a5 5 0 0 1 10 0v4" }]
  ]
} as const;


export const NODE_FASILITAS: PetaIkon = {
  "recycle": [
  ["path", { d: "M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" }],
      ["path", { d: "M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12" }],
      ["path", { d: "m14 16-3 3 3 3" }],
      ["path", { d: "M8.293 13.596 7.196 9.5 3.1 10.598" }],
      ["path", { d: "m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843" }],
      ["path", { d: "m13.378 9.633 4.096 1.098 1.097-4.096" }]
  ],
  "gudang": [
  ["path", { d: "M18 21V10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v11" }],
      ["path", { d: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 1.132-1.803l7.95-3.974a2 2 0 0 1 1.837 0l7.948 3.974A2 2 0 0 1 22 8z" }],
      ["path", { d: "M6 13h12" }],
      ["path", { d: "M6 17h12" }]
  ],
  "paket": [
  ["path", { d: "M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" }],
      ["path", { d: "M12 22V12" }],
      ["polyline", { points: "3.29 7 12 12 20.71 7" }],
      ["path", { d: "m7.5 4.27 9 5.15" }]
  ]
} as const;

export const NODE_TAMBAHAN: PetaIkon = {
  "cerdas_lingkungan": [
  ["path", { d: "M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" }],
      ["path", { d: "M22 10v6" }],
      ["path", { d: "M6 12.5V16a6 3 0 0 0 12 0v-3.5" }]
  ],
  "relawan": [
  ["path", { d: "M19.414 14.414C21 12.828 22 11.5 22 9.5a5.5 5.5 0 0 0-9.591-3.676.6.6 0 0 1-.818.001A5.5 5.5 0 0 0 2 9.5c0 2.3 1.5 4 3 5.5l5.535 5.362a2 2 0 0 0 2.879.052 2.12 2.12 0 0 0-.004-3 2.124 2.124 0 1 0 3-3 2.124 2.124 0 0 0 3.004 0 2 2 0 0 0 0-2.828l-1.881-1.882a2.41 2.41 0 0 0-3.409 0l-1.71 1.71a2 2 0 0 1-2.828 0 2 2 0 0 1 0-2.828l2.823-2.762" }]
  ]
} as const;

function nodeKeSvg(
  node: NodeIkon,
  warna: string,
  ukuran: number,
  tebal: number
) {
  const isi = node
    .map(([tag, attrs]) => {
      const a = Object.entries(attrs)
        .map(([k, v]) => `${k}="${v}"`)
        .join(" ");
      return `<${tag} ${a}/>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${ukuran}" height="${ukuran}" viewBox="0 0 24 24" fill="none" stroke="${warna}" stroke-width="${tebal}" stroke-linecap="round" stroke-linejoin="round">${isi}</svg>`;
}

export function svgUriKategori(slug: string, warna: string, ukuran = 15) {
  if (slug.startsWith("fasilitas:")) {
    return svgUriDariNode(nodeFasilitas(slug.slice(10)), warna, ukuran);
  }
  return svgUriDariNode(NODE_KATEGORI[slug] ?? NODE_KATEGORI.lainnya, warna, ukuran);
}

export function svgUriDariNode(
  node: NodeIkon,
  warna: string,
  ukuran = 15,
  tebal = 2
) {
  return `data:image/svg+xml,${encodeURIComponent(nodeKeSvg(node, warna, ukuran, tebal))}`;
}

export function IkonVektor({
  node,
  ukuran = 16,
  tebal = 2,
  className,
}: {
  node: NodeIkon;
  ukuran?: number;
  tebal?: number;
  className?: string;
}) {
  const html = node
    .map(([tag, attrs]) => {
      const a = Object.entries(attrs)
        .map(([k, v]) => `${k}="${v}"`)
        .join(" ");
      return `<${tag} ${a}/>`;
    })
    .join("");
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={ukuran}
      height={ukuran}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={tebal}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function IkonKategori({
  slug,
  ukuran = 16,
  tebal = 2,
  className,
}: {
  slug: string;
  ukuran?: number;
  tebal?: number;
  className?: string;
}) {
  return (
    <IkonVektor
      node={NODE_KATEGORI[slug] ?? NODE_KATEGORI.lainnya}
      ukuran={ukuran}
      tebal={tebal}
      className={className}
    />
  );
}

export function nodeBadge(b: Pick<BadgeDef, "ikon">): NodeIkon {
  return (
    NODE_LAIN[b.ikon] ??
    NODE_TAMBAHAN[b.ikon] ??
    NODE_LAIN.terkunci
  );
}

export function nodeFasilitas(jenis: string): NodeIkon {
  return NODE_FASILITAS[jenis] ?? NODE_FASILITAS.recycle;
}

export function IkonFasilitas({
  jenis,
  ukuran = 16,
  tebal = 2,
  className,
}: {
  jenis: string;
  ukuran?: number;
  tebal?: number;
  className?: string;
}) {
  return (
    <IkonVektor
      node={nodeFasilitas(jenis)}
      ukuran={ukuran}
      tebal={tebal}
      className={className}
    />
  );
}

export function nodeLevel(l: Pick<LevelDef, "ikon">): NodeIkon {
  return NODE_LAIN[l.ikon] ?? NODE_LAIN.semai;
}
