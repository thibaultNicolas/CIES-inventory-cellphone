"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Globe } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { getLocaleFromPath, removeLocaleFromPath } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type LanguageSwitcherProps = {
  /** Classes pour le bouton déclencheur (ex. taille réduite dans le header staff). */
  triggerClassName?: string;
};

export function LanguageSwitcher({ triggerClassName }: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [locale, setLocale] = useState<Locale>("fr");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Read the locale from the URL
    const currentLocale = getLocaleFromPath(pathname);
    setLocale(currentLocale);
  }, [pathname]);

  const handleLocaleChange = (newLocale: Locale) => {
    // Persist in cookies
    document.cookie = `locale=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}`;
    setIsOpen(false);

    // Admin and other non-locale routes: reload so root layout re-reads cookie and I18nProvider gets new initialLocale
    if (pathname.startsWith("/admin")) {
      window.location.reload();
      return;
    }

    // Build the new URL with the locale for locale-prefixed routes
    const pathWithoutLocale = removeLocaleFromPath(pathname);
    let newPath: string;
    if (newLocale === "fr") {
      newPath = pathWithoutLocale || "/";
    } else {
      newPath = `/${newLocale}${pathWithoutLocale === "/" ? "" : pathWithoutLocale}`;
    }
    router.push(newPath);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 rounded-full border border-foreground/20 bg-background px-4 py-2 text-xs uppercase tracking-[0.15em] text-foreground/70 transition-all hover:border-brand-primary hover:text-brand-primary",
          triggerClassName,
        )}
        aria-label="Change language"
      >
        <Globe className="h-4 w-4" />
        <span>{locale.toUpperCase()}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 rounded-card border border-foreground/10 bg-background shadow-soft">
            <button
              onClick={() => handleLocaleChange("fr")}
              className={`block w-full px-6 py-3 text-left text-xs uppercase tracking-[0.15em] transition-colors ${
                locale === "fr"
                  ? "bg-brand-primary/10 text-brand-primary font-medium"
                  : "text-foreground/70 hover:bg-foreground/5"
              }`}
            >
              Français
            </button>
            <button
              onClick={() => handleLocaleChange("en")}
              className={`block w-full px-6 py-3 text-left text-xs uppercase tracking-[0.15em] transition-colors ${
                locale === "en"
                  ? "bg-brand-primary/10 text-brand-primary font-medium"
                  : "text-foreground/70 hover:bg-foreground/5"
              }`}
            >
              English
            </button>
          </div>
        </>
      )}
    </div>
  );
}
