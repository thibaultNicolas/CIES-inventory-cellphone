import { NextResponse, type NextRequest } from "next/server";
// Imports relatifs requis : les alias @/ dans le middleware Edge peuvent échouer sur Vercel.
import { updateSupabaseSession } from "./src/lib/supabase/middleware";
import { parseAppRole, hasMinRole, type AppRole } from "./src/lib/app-role";

const LOGIN_PATH = "/login";

const PUBLIC_ROOTS = [
  "/a-propos",
  "/contact",
  "/service-aux-entreprises",
] as const;

function isPublicPath(pathname: string): boolean {
  if (pathname === LOGIN_PATH) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/api")) return true;
  // Fichiers statiques courants
  if (
    /\.(ico|webp|png|jpg|jpeg|svg|gif|txt|xml|webmanifest|json)$/i.test(
      pathname
    )
  ) {
    return true;
  }
  if (pathname === "/robots.txt" || pathname === "/sitemap.xml") return true;

  // Site public (rachat, pages légales, locale EN)
  if (pathname === "/" || pathname === "/merci") return true;
  if (pathname.startsWith("/rachat")) return true;
  for (const root of PUBLIC_ROOTS) {
    if (pathname === root || pathname.startsWith(`${root}/`)) return true;
  }
  if (pathname === "/en" || pathname.startsWith("/en/")) return true;
  if (pathname === "/fr" || pathname.startsWith("/fr/")) return true;

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

export async function middleware(request: NextRequest) {
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
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|favicon\\.webp).*)",
  ],
};
