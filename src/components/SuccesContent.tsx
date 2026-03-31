"use client";

import Link from "next/link";
import { useI18n } from "@/contexts/I18nContext";
import type { Locale } from "@/lib/i18n";
import type { SubmissionNormalized } from "@/lib/submissions";

export type SuccesContactSummary = {
  employee_full_name: string;
  client_full_name: string;
  customer_phone: string;
  client_city: string;
  device_imei: string;
  customer_email: string;
};

export type SuccesContentProps = {
  /** Locale for copy and paths. Defaults to context locale. */
  locale?: Locale;
  orderNumber: string;
  submittedAt: string | null;
  totalPayout: number | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  /** Magasin : employé, client, ville, IMEI ; flux classique : courriel éventuel. */
  contactSummary?: SuccesContactSummary | null;
  orderItems: Array<
    Pick<
      SubmissionNormalized,
      | "brand_name"
      | "model_name"
      | "memory"
      | "condition"
      | "price"
      | "quantity"
    >
  >;
};

/**
 * Page de confirmation après envoi du rachat : affiche uniquement le message de confirmation.
 */
export function SuccesContent({
  locale: localeProp,
}: SuccesContentProps) {
  const { t, locale: contextLocale } = useI18n();
  const locale = localeProp ?? contextLocale;
  const homePath = locale === "fr" ? "/" : `/${locale}`;
  const rachatPath = locale === "fr" ? "/" : `/${locale}`;

  return (
    <div className="min-h-screen bg-background pt-20 sm:pt-24">
      <header className="fixed left-0 right-0 top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
          <Link
            href={homePath}
            className="shrink-0 font-(family-name:--font-playfair) text-lg font-semibold tracking-tight text-brand-dark transition-colors hover:text-brand-primary sm:text-xl"
          >
            AcheteTonCell
          </Link>
          <div className="flex items-center gap-4 sm:gap-8">
            <Link
              href={rachatPath}
              className="text-xs uppercase tracking-[0.15em] text-foreground/70 transition-colors hover:text-brand-primary"
            >
              {t.success.rachat}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-4 pb-16 sm:px-6 sm:pb-24">
        <p className="text-center font-(family-name:--font-playfair) text-2xl font-light leading-relaxed text-brand-dark sm:text-3xl md:text-4xl">
          {t.success.confirmationMessage}
        </p>
      </main>
    </div>
  );
}
