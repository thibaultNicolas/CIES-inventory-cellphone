"use client";

import { ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import { I18nProvider } from "@/contexts/I18nContext";

export function I18nClientWrapper({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale: Locale;
}) {
  return <I18nProvider initialLocale={initialLocale}>{children}</I18nProvider>;
}
