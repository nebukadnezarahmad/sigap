import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Penangkap semua /api/* yang tidak cocok rute spesifik.
// Rute yang lebih spesifik (mis. /api/open-data) tetap menang di Next.js.
function endpointTakDikenal() {
  return NextResponse.json(
    { error: "Endpoint API tidak ditemukan." },
    { status: 404 }
  );
}

export const GET = endpointTakDikenal;
export const POST = endpointTakDikenal;
export const PUT = endpointTakDikenal;
export const PATCH = endpointTakDikenal;
export const DELETE = endpointTakDikenal;
export const OPTIONS = endpointTakDikenal;
