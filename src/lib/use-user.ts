"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Profil } from "@/types/database";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [profil, setProfil] = useState<Profil | null>(null);
  const [muat, setMuat] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let batal = false;

    async function ambil() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (batal) return;
      setUser(user);
      if (user) {
        const { data: p } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (!batal) setProfil(p);
      }
      if (!batal) setMuat(false);
    }

    ambil();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (batal) return;
      setUser(session?.user ?? null);
      if (!session?.user) {
        setProfil(null);
      } else {
        const { data: p } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        if (!batal) setProfil(p);
      }
    });

    return () => {
      batal = true;
      subscription.unsubscribe();
    };
  }, []);

  return { user, profil, muat };
}
