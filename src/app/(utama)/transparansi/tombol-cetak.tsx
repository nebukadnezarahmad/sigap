"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui";

export function TombolCetak() {
  return (
    <Button
      variant="sekunder"
      size="sm"
      onClick={() => window.print()}
      className="print:hidden"
    >
      <Printer size={14} /> Cetak / simpan PDF
    </Button>
  );
}
