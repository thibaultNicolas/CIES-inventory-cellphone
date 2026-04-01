import { NextResponse, type NextRequest } from "next/server";
// Imports relatifs requis : les alias @/ dans le proxy peuvent échouer sur Vercel.
import { updateSupabaseSession } from "./src/lib/supabase/middleware";
import { parseAppRole, hasMinRole, type AppRole } from "./src/lib/app-role";

const LOGIN_PATH = "/login";

/**
 * Application interne : tout est protégé sauf la page de connexion et les assets
 * nécessaires au chargement (Next, fichiers dans /public).
 * Session Supabase + rôle staff (app_metadata.role) requis pour le reste.
 */
function isPublicPath(pathname: string): boolean {
  if (pathname === LOGIN_PATH) return true;
  if (pathname.startsWith("/_next")) return true;
  // Fichiers typiques dans `public/` (logos, images) pour /login
  if (
    /\.(ico|webp|png|jpg|jpeg|svg|gif|webmanifest|json)$/i.test(pathname)
  ) {
    return true;
  }
  return false;
}

function loginRedirect(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = LOGIN_PATH;
  const redirect = request.nextUrl.pathname + request.nextUrl.search;
  if (redirect && redirect !== LOGIN_PATH) {
    url.searchParams.set("redirect", redirect);
  }
  return NextResponse.redirect(url);
}

function forbiddenRedirect(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/";
  url.searchParams.set("forbidden", "1");
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const { supabaseResponse, user } = await updateSupabaseSession(request);

  if (isPublicPath(pathname)) {
    if (pathname === LOGIN_PATH && user) {
      const role = parseAppRole(user.app_metadata as Record<string, unknown>);
      if (role) {
        const raw = request.nextUrl.searchParams.get("redirect");
        const dest =
          raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
        return NextResponse.redirect(new URL(dest, request.url));
      }
    }
    return supabaseResponse;
  }

  if (!user) {
    return loginRedirect(request);
  }

  const role = parseAppRole(user.app_metadata as Record<string, unknown>);
  if (!role) {
    return loginRedirect(request);
  }

  if (pathname.startsWith("/admin")) {
    const adminMin: AppRole = "admin";
    if (!hasMinRole(role, adminMin)) {
      return forbiddenRedirect(request);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|favicon\\.webp).*)"],
};
