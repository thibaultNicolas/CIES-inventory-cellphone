// Shared types and constants
export type Locale = "fr" | "en";

export const defaultLocale: Locale = "fr";
export const locales: Locale[] = ["fr", "en"];

/**
 * Extract the locale from a pathname (client-safe).
 */
export function getLocaleFromPath(pathname: string): Locale {
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];
  
  if (locales.includes(firstSegment as Locale)) {
    return firstSegment as Locale;
  }
  
  return defaultLocale;
}

/**
 * Remove the locale prefix from a pathname (client-safe).
 */
export function removeLocaleFromPath(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];
  
  if (locales.includes(firstSegment as Locale)) {
    return "/" + segments.slice(1).join("/");
  }
  
  return pathname;
}
