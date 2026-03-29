import { cookies, headers } from "next/headers";

import type { Locale } from "./i18n";
import { locales, defaultLocale } from "./i18n";

/**
 * Get the locale from headers or cookies (Server Components only).
 */
export async function getLocale(): Promise<Locale> {
  // Try to read from headers (set by the proxy)
  const headersList = await headers();
  const localeFromHeader = headersList.get("x-locale");
  
  if (localeFromHeader && locales.includes(localeFromHeader as Locale)) {
    return localeFromHeader as Locale;
  }
  
  // Fall back to cookies
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value as Locale;
  return locales.includes(locale) ? locale : defaultLocale;
}

/**
 * Set the locale cookie (Server Components only).
 */
export async function setLocale(locale: Locale) {
  const cookieStore = await cookies();
  cookieStore.set("locale", locale, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
  });
}
