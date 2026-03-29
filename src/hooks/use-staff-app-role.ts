"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { parseAppRole, type AppRole } from "@/lib/app-role";

type StaffRoleState =
  | { status: "loading"; role: null }
  | { status: "none"; role: null }
  | { status: "ready"; role: AppRole };

/**
 * Lit le rôle staff depuis la session Supabase (JWT app_metadata.role).
 * À utiliser uniquement pour l’UI ; le serveur / middleware font foi.
 */
export function useStaffAppRole(): StaffRoleState {
  const [state, setState] = useState<StaffRoleState>({
    status: "loading",
    role: null,
  });

  useEffect(() => {
    const supabase = createClient();

    const sync = () => {
      void supabase.auth.getSession().then(({ data: { session } }) => {
        const r = parseAppRole(
          session?.user?.app_metadata as Record<string, unknown> | undefined,
        );
        if (!r) {
          setState({ status: "none", role: null });
          return;
        }
        setState({ status: "ready", role: r });
      });
    };

    sync();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      sync();
    });

    return () => subscription.unsubscribe();
  }, []);

  return state;
}
