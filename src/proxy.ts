import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ["fr", "en"];
const defaultLocale = "fr";

function getLocale(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];

  if (locales.includes(firstSegment)) {
    return firstSegment;
  }

  return defaultLocale;
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Routes that should not be locale-prefixed
  const publicRoutes = ["/api", "/admin", "/login", "/_next", "/favicon.webp", "/favicon.ico"];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check whether the URL already contains a locale prefix
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  // If there is no locale in the URL
  if (!pathnameHasLocale) {
    const locale = request.cookies.get("locale")?.value || defaultLocale;

    if (locale === "en") {
      // For English, add /en
      const newPath = `/${locale}${pathname === "/" ? "" : pathname}`;
      const newUrl = new URL(newPath, request.url);
      return NextResponse.redirect(newUrl);
    }
    // For French, let it pass (no prefix)
    // The page will be served from app/[locale]/page.tsx with an implicit locale="fr"
  }

  // Attach the locale to headers for Server Components
  const locale = getLocale(pathname);
  const response = NextResponse.next();
  response.headers.set("x-locale", locale);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.webp / favicon.ico (favicon files)
     */
    "/((?!api|_next/static|_next/image|favicon\\.webp|favicon\\.ico).*)",
  ],
};
