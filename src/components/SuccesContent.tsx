"use client";

import Link from "next/link";
import { useCallback } from "react";
import { Printer } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";
import type { Locale } from "@/lib/i18n";
import type { SubmissionNormalized } from "@/lib/submissions";
import { submissionLineTotal } from "@/lib/submissions";

export type SuccesContactSummary = {
  employee_full_name: string;
  store_name: string;
  client_full_name: string;
  client_account_number: string;
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

function formatMoney(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(value);
}

function formatDateTime(iso: string | null, locale: Locale): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(d);
}

function EmptyBox() {
  return (
    <span
      className="inline-block h-5 w-5 shrink-0 border-2 border-foreground align-middle"
      aria-hidden
    />
  );
}

function CheckboxLine({ text }: { text: string }) {
  return (
    <div className="flex gap-2 py-1.5 break-inside-avoid print:gap-1.5 print:py-0.5">
      <EmptyBox />
      <span className="text-sm leading-snug text-foreground print:text-[11px] print:leading-tight">
        {text}
      </span>
    </div>
  );
}

/**
 * Page de confirmation après envoi du rachat : message + bon imprimable (PDF via le navigateur).
 */
export function SuccesContent({
  locale: localeProp,
  orderNumber,
  submittedAt,
  totalPayout,
  contactSummary,
  orderItems,
}: SuccesContentProps) {
  const { t, locale: contextLocale } = useI18n();
  const locale = localeProp ?? contextLocale;
  const rachatPath = locale === "fr" ? "/" : `/${locale}`;

  const handlePrint = useCallback(() => {
    if (typeof window !== "undefined") {
      window.print();
    }
  }, []);

  const total =
    totalPayout ??
    orderItems.reduce(
      (sum, item) => sum + submissionLineTotal(item.price, item.quantity),
      0,
    );

  return (
    <div className="min-h-screen bg-background pt-16 sm:pt-20 print:min-h-0 print:pt-0">
      <main className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 sm:pb-24 print:px-4 print:pb-2 print:pt-0">
        <div className="print:hidden flex min-h-[40vh] flex-col items-center justify-center text-center">
          <p className="font-(family-name:--font-playfair) text-2xl font-light leading-relaxed text-brand-dark sm:text-3xl md:text-4xl">
            {t.success.confirmationMessage}
          </p>
          <button
            type="button"
            onClick={handlePrint}
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-brand-dark px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-background transition-colors hover:bg-brand-primary"
          >
            <Printer className="h-4 w-4" aria-hidden />
            {t.success.printPdfButton}
          </button>
          <p className="mt-4 max-w-md text-center text-xs text-foreground/60">
            {t.success.printPdfHint}
          </p>
          <Link
            href={rachatPath}
            className="mt-6 inline-flex items-center justify-center rounded-full border border-brand-dark/30 px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-brand-dark transition-colors hover:bg-brand-dark hover:text-background"
          >
            {locale === "fr" ? "Retour au rachat" : "Back to trade-in"}
          </Link>
        </div>

        {/* Bon PDF : masqué à l’écran, visible uniquement à l’impression / PDF */}
        <article
          id="rachat-confirmation-print"
          className="hidden print:block"
          aria-hidden
        >
          <div className="rounded-card border border-foreground/15 bg-background p-6 shadow-soft print:border-0 print:p-0 print:pt-0 print:shadow-none sm:p-8 print:text-[11px] print:leading-snug">
            <h1 className="font-(family-name:--font-playfair) text-xl font-medium text-brand-dark print:mt-0 print:text-lg print:leading-tight">
              {t.success.pdfDocumentTitle}
            </h1>
            <div className="mt-4 space-y-1 text-sm text-foreground/90 print:mt-2 print:space-y-0.5">
              <p>
                <span className="font-medium text-foreground">
                  {t.success.orderNumber}
                </span>{" "}
                {orderNumber}
              </p>
              <p>
                <span className="font-medium text-foreground">
                  {t.success.date}
                </span>{" "}
                {formatDateTime(submittedAt, locale)}
              </p>
              <p>
                <span className="font-medium text-foreground">
                  {t.success.totalPayoutLabel}
                </span>{" "}
                {formatMoney(total, locale)}
              </p>
              <p>
                <span className="font-medium text-foreground">
                  {t.success.pdfClientLabel}
                </span>{" "}
                {contactSummary?.client_full_name?.trim() || "—"}
              </p>
            </div>

            <h2 className="mt-8 border-b border-foreground/15 pb-2 text-sm font-semibold uppercase tracking-[0.14em] text-foreground/80 print:mt-3 print:pb-1 print:text-[11px]">
              {t.success.pdfDevicesTitle}
            </h2>
            <div className="mt-3 overflow-x-auto print:mt-1.5">
              <table className="w-full min-w-[520px] border-collapse text-left text-sm print:min-w-0 print:text-[11px]">
                <thead>
                  <tr className="border-b border-foreground/20 text-xs uppercase tracking-wide text-foreground/60 print:text-[9px]">
                    <th className="py-2 pr-2 font-medium print:py-1 print:pr-1">
                      {t.success.pdfBrandLabel}
                    </th>
                    <th className="py-2 pr-2 font-medium print:py-1 print:pr-1">
                      {t.success.pdfModelLabel}
                    </th>
                    <th className="py-2 pr-2 font-medium print:py-1 print:pr-1">
                      {t.success.pdfMemoryLabel}
                    </th>
                    <th className="py-2 pr-2 font-medium print:py-1 print:pr-1">
                      {t.success.pdfConditionLabel}
                    </th>
                    <th className="py-2 pr-2 font-medium print:py-1 print:pr-1">
                      {t.success.pdfQuantityLabel}
                    </th>
                    <th className="py-2 text-right font-medium print:py-1">
                      {t.success.pdfLineAmountLabel}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-4 text-foreground/50"
                      >
                        —
                      </td>
                    </tr>
                  ) : (
                    orderItems.map((item, idx) => (
                      <tr
                        key={`${item.model_name}-${idx}`}
                        className="border-b border-foreground/10"
                      >
                        <td className="py-2 pr-2 align-top print:py-1 print:pr-1">
                          {item.brand_name}
                        </td>
                        <td className="py-2 pr-2 align-top print:py-1 print:pr-1">
                          {item.model_name}
                        </td>
                        <td className="py-2 pr-2 align-top print:py-1 print:pr-1">
                          {item.memory}
                        </td>
                        <td className="py-2 pr-2 align-top print:py-1 print:pr-1">
                          {item.condition}
                        </td>
                        <td className="py-2 pr-2 align-top print:py-1 print:pr-1">
                          {item.quantity ?? 1}
                        </td>
                        <td className="py-2 text-right align-top tabular-nums print:py-1">
                          {formatMoney(
                            submissionLineTotal(item.price, item.quantity),
                            locale,
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {contactSummary ? (
              <>
                <h2 className="mt-8 border-b border-foreground/15 pb-2 text-sm font-semibold uppercase tracking-[0.14em] text-foreground/80 print:mt-3 print:pb-1 print:text-[11px]">
                  {t.success.contactSummaryTitle}
                </h2>
                <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2 print:mt-1.5 print:gap-1 print:text-[11px]">
                  <div>
                    <dt className="text-foreground/60">
                      {t.success.pdfEmployeeLabel}
                    </dt>
                    <dd className="font-medium">
                      {contactSummary.employee_full_name || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-foreground/60">
                      {t.success.pdfStoreLabel}
                    </dt>
                    <dd className="font-medium">
                      {contactSummary.store_name || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-foreground/60">
                      {t.success.pdfClientAccountLabel}
                    </dt>
                    <dd className="font-medium font-mono text-xs">
                      {contactSummary.client_account_number || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-foreground/60">
                      {t.success.pdfPhoneLabel}
                    </dt>
                    <dd className="font-medium">
                      {contactSummary.customer_phone || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-foreground/60">
                      {t.success.pdfCityLabel}
                    </dt>
                    <dd className="font-medium">
                      {contactSummary.client_city || "—"}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-foreground/60">
                      {t.success.pdfImeiLabel}
                    </dt>
                    <dd className="font-mono text-sm">
                      {contactSummary.device_imei || "—"}
                    </dd>
                  </div>
                  {contactSummary.customer_email ? (
                    <div className="sm:col-span-2">
                      <dt className="text-foreground/60">
                        {t.success.pdfEmailLabel}
                      </dt>
                      <dd>{contactSummary.customer_email}</dd>
                    </div>
                  ) : null}
                </dl>
              </>
            ) : null}

            <h2 className="mt-10 border-b border-foreground/15 pb-2 text-sm font-semibold uppercase tracking-[0.14em] text-foreground/80 print:mt-3 print:pb-1 print:text-[11px]">
              {t.success.pdfDeclarationsTitle}
            </h2>

            <div className="mt-4 space-y-3 text-sm print:mt-2 print:space-y-2">
              <p className="font-medium print:text-[11px] print:leading-tight">
                {t.success.pdfCreditReturnQuestion}
              </p>
              <div className="flex flex-wrap items-center gap-6 print:gap-4">
                <span className="inline-flex items-center gap-2 print:text-[11px]">
                  <EmptyBox /> {t.success.pdfYes}
                </span>
                <span className="inline-flex items-center gap-2 print:text-[11px]">
                  <EmptyBox /> {t.success.pdfNo}
                </span>
              </div>
              <div className="mt-4 break-inside-avoid print:mt-2">
                <p className="print:text-[11px] print:leading-tight">
                  {t.success.pdfCreditReturnPenalty}
                </p>
                <div className="mt-2 min-h-6 border-b border-foreground print:mt-1 print:min-h-5" />
              </div>
            </div>

            <div className="mt-6 space-y-0 border-t border-foreground/10 pt-4 print:mt-3 print:pt-2">
              <CheckboxLine text={t.success.pdfCheckboxPersonalData} />
              <CheckboxLine text={t.success.pdfCheckboxAccountRemoved} />
              <CheckboxLine text={t.success.pdfCheckboxFinal} />
              <CheckboxLine text={t.success.pdfCheckboxCash} />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 break-inside-avoid sm:grid-cols-2 print:mt-4 print:grid-cols-2 print:gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium print:text-[11px]">
                  {t.success.pdfSignatureClientLine}
                </p>
                <div className="mt-2 min-h-8 border-b border-foreground print:mt-1 print:min-h-7" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium print:text-[11px]">
                  {t.success.pdfSignatureEmployeeLine}
                </p>
                <div className="mt-2 min-h-8 border-b border-foreground print:mt-1 print:min-h-7" />
              </div>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
