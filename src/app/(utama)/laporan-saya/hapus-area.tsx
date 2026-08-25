"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BellOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function HapusAreaKlien({ id }: { id: string }) {
  const router = useRouter();
  const [proses, setProses] = useState(false);

  async function hapus() {
    setProses(true);
    const supabase = createClient();
    await supabase.from("area_follows").delete().eq("id", id);
    setProses(false);
    router.refresh();
  }

  return (
    <button
      onClick={hapus}
      disabled={proses}
      aria-label="Berhenti ikuti area"
      title="Berhenti ikuti"
      className="flex size-8 items-center justify-center rounded-lg text-muted transition hover:bg-danger/10 hover:text-danger"
    >
      <BellOff size={15} />
    </button>
  );
}
