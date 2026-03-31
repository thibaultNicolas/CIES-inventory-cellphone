import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function createServerActionClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components may not allow mutating cookies.
          }
        },
      },
    },
  );
}

/** PostgREST errors often look like `{}` in console — use this for readable logs. */
export function formatSupabaseError(error: unknown): Record<string, unknown> {
  if (!error || typeof error !== "object") {
    return { value: error };
  }
  const e = error as Record<string, unknown>;
  return {
    message: e.message,
    code: e.code,
    details: e.details,
    hint: e.hint,
  };
}

/**
 * Anonymous Supabase client for server-side reads (brands, models, prices).
 * Uses `createClient` — no cookies — instead of `createServerClient`, which is meant for user sessions.
 */
export function createCachedClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    console.error(
      "[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
    );
  }

  return createClient(url ?? "", anonKey ?? "", {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Create a Supabase client with the service role key for admin operations.
 * This client bypasses RLS and can access all data.
 *
 * ⚠️ IMPORTANT: Never use this client on the client-side (React components).
 * Use it only in Server Actions and API Routes.
 *
 * To use this client, add SUPABASE_SERVICE_ROLE_KEY to your .env.local
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!serviceRoleKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SUPABASE_SERVICE_ROLE_KEY is required in production for server-side admin operations.",
      );
    }
    console.warn(
      "⚠️ SUPABASE_SERVICE_ROLE_KEY is not set. " +
        "Admin operations may fail if RLS is enabled. " +
        "Falling back to the anon key (development only).",
    );
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
