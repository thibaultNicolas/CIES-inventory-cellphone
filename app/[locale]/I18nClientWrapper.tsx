"use client";

import { ReactNode, Suspense } from "react";
import type { Locale } from "@/lib/i18n";
import { I18nProvider } from "@/contexts/I18nContext";
import { CookieBanner } from "../components/CookieBanner";

export function I18nClientWrapper({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale: Locale;
}) {
  return (
    <I18nProvider initialLocale={initialLocale}>
      {children}
      <Suspense fallback={null}>
        <CookieBanner />
      </Suspense>
    </I18nProvider>
  );
}
