import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

export type SupabaseMiddlewareResult = {
  supabaseResponse: NextResponse;
  user: User | null;
};

/**
 * Rafraîchit la session Supabase et propage les cookies sur la réponse.
 */
export async function updateSupabaseSession(
  request: NextRequest
): Promise<SupabaseMiddlewareResult> {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    return { supabaseResponse, user: null };
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Ne pas appeler request.cookies.set ici : sur Vercel Edge / Next récents cela peut lever
        // une exception → 500 MIDDLEWARE_INVOCATION_FAILED. Les cookies session passent par la réponse.
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabaseResponse, user: user ?? null };
}
