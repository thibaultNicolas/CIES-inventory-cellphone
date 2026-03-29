"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import { getTranslations, type Translations } from "@/lib/translations";

type I18nContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ 
  children, 
  initialLocale = "fr"
}: { 
  children: ReactNode; 
  initialLocale?: Locale;
}) {
  // Use initialLocale as the default during SSR/prerender.
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  
  // Load translations on the client (state starts empty).
  const [translations, setTranslations] = useState<Translations | null>(null);
  
  // Fetch translations after client mount (no-op on the server).
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const newTranslations = getTranslations(locale);
    setTranslations(newTranslations);
  }, [locale]);
  
  // Use loaded translations when available; otherwise fall back to initial locale translations.
  const t = translations || getTranslations(initialLocale);
  
  // Detect locale from the URL after client mount.
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    
    const pathname = window.location.pathname;
    const segments = pathname.split("/").filter(Boolean);
    const firstSegment = segments[0];
    
    let detectedLocale: Locale = initialLocale;
    if (firstSegment === "en") {
      detectedLocale = "en";
    } else if (firstSegment === "fr" || pathname === "/") {
      detectedLocale = "fr";
    }
    
    // Update state only when it actually changes.
    if (detectedLocale !== locale) {
      setLocaleState(detectedLocale);
    }
  }, [initialLocale, locale]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof document !== "undefined") {
      document.cookie = `locale=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}`;
    }
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
