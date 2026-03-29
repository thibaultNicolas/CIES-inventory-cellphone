"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { CheckCircle2, Package } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";
import type { Locale } from "@/lib/i18n";
import type { SubmissionNormalized } from "@/lib/submissions";
import { submissionLineTotal } from "@/lib/submissions";

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
  withInsurance: boolean;
  insuranceFee: number;
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

export function SuccesContent({
  locale: localeProp,
  orderNumber,
  submittedAt,
  totalPayout,
  withInsurance,
  insuranceFee,
  trackingNumber = null,
  trackingUrl = null,
  contactSummary = null,
  orderItems,
}: SuccesContentProps) {
  const { t, locale: contextLocale } = useI18n();
  const locale = localeProp ?? contextLocale;
  const homePath = locale === "fr" ? "/" : `/${locale}`;
  const rachatPath = locale === "fr" ? "/" : `/${locale}`;
  const dateLocale = locale === "fr" ? "fr-CA" : "en-CA";
  const formattedDate = submittedAt
    ? new Intl.DateTimeFormat(dateLocale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(submittedAt))
    : "—";
  const displayOrder = orderNumber
    ? orderNumber.slice(0, 8).toUpperCase()
    : "—";

  const contactBlock =
    contactSummary &&
    (contactSummary.employee_full_name ||
      contactSummary.client_full_name ||
      contactSummary.customer_phone ||
      contactSummary.client_city ||
      contactSummary.device_imei ||
      contactSummary.customer_email)
      ? contactSummary
      : null;

  return (
    <div className="min-h-screen bg-background pt-20 sm:pt-24">
      <header className="fixed left-0 right-0 top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
          <Link href={homePath} className="flex items-center shrink-0">
            <Image
              src="/logo.png"
              alt="AcheteTonCell"
              width={200}
              height={100}
              className="h-9 w-auto sm:h-11"
              priority
            />
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

      <main className="mx-auto max-w-4xl px-4 pb-16 sm:px-6 sm:pb-24">
        <div className="flex min-h-[70vh] flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", duration: 0.8, bounce: 0.4 }}
            className="mb-8 sm:mb-12"
          >
            <CheckCircle2
              className="h-24 w-24 text-brand-primary sm:h-32 sm:w-32 md:h-40 md:w-40"
              strokeWidth={1.5}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-6 text-center sm:mb-8"
          >
            <h1 className="mb-4 font-(family-name:--font-playfair) text-4xl font-light text-brand-dark sm:mb-6 sm:text-5xl md:text-6xl lg:text-7xl">
              {t.success.done}
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-brand-dark/80 sm:text-xl md:text-2xl">
              {t.success.messageIntro}
              <br />
              <span className="font-medium">{t.success.messageEmail}</span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mb-8 grid w-full max-w-4xl gap-3 rounded-2xl border border-brand-dark/10 bg-background p-4 sm:mb-12 sm:gap-4 sm:rounded-card sm:p-5 md:grid-cols-3"
          >
            <div className="rounded-xl bg-secondary p-3 sm:rounded-2xl sm:p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/50">
                {t.success.orderNumber}
              </p>
              <p className="mt-2 text-xl font-semibold text-brand-primary">
                {displayOrder}
              </p>
            </div>
            <div className="rounded-xl bg-secondary p-3 sm:rounded-2xl sm:p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/50">
                {t.success.date}
              </p>
              <p className="mt-2 text-xl font-semibold text-brand-primary">
                {formattedDate}
              </p>
            </div>
            <div className="rounded-xl bg-secondary p-3 sm:rounded-2xl sm:p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/50">
                {t.success.totalPayout}
              </p>
              <p className="mt-2 text-xl font-semibold text-brand-primary">
                {typeof totalPayout === "number"
                  ? `${totalPayout.toFixed(2)}$`
                  : "—"}
              </p>
            </div>
          </motion.div>

          {contactBlock ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="mb-8 w-full max-w-3xl rounded-2xl border border-brand-dark/10 bg-background p-5 text-left shadow-soft sm:mb-10 sm:rounded-card sm:p-6"
            >
              <h2 className="mb-4 font-(family-name:--font-playfair) text-2xl font-light text-brand-dark sm:text-3xl">
                {t.success.contactSummaryTitle}
              </h2>
              <dl className="space-y-3 text-sm text-foreground/80">
                {contactBlock.employee_full_name ? (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground/50">
                      {t.admin.employeeFullName}
                    </dt>
                    <dd className="mt-1 font-medium text-foreground">{contactBlock.employee_full_name}</dd>
                  </div>
                ) : null}
                {contactBlock.client_full_name ? (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground/50">
                      {t.admin.clientFullNameLabel}
                    </dt>
                    <dd className="mt-1 font-medium text-foreground">{contactBlock.client_full_name}</dd>
                  </div>
                ) : null}
                {contactBlock.customer_phone ? (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground/50">
                      {t.admin.clientPhoneLabel}
                    </dt>
                    <dd className="mt-1">{contactBlock.customer_phone}</dd>
                  </div>
                ) : null}
                {contactBlock.client_city ? (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground/50">
                      {t.admin.clientCityLabel}
                    </dt>
                    <dd className="mt-1">{contactBlock.client_city}</dd>
                  </div>
                ) : null}
                {contactBlock.device_imei ? (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground/50">
                      {t.admin.deviceImeiLabel}
                    </dt>
                    <dd className="mt-1 font-mono text-foreground">{contactBlock.device_imei}</dd>
                  </div>
                ) : null}
                {contactBlock.customer_email ? (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground/50">
                      {t.wizard.form.email}
                    </dt>
                    <dd className="mt-1">{contactBlock.customer_email}</dd>
                  </div>
                ) : null}
              </dl>
            </motion.div>
          ) : null}

          {orderItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mb-8 w-full max-w-3xl rounded-2xl border-2 border-brand-dark/10 bg-brand-dark/5 p-5 shadow-soft sm:mb-12 sm:rounded-card sm:p-8"
            >
              <div className="mb-6 flex items-center gap-3">
                <Package
                  className="h-6 w-6 text-brand-dark"
                  strokeWidth={1.5}
                />
                <h2 className="font-(family-name:--font-playfair) text-3xl font-light text-brand-dark">
                  {t.success.orderDetails}
                </h2>
              </div>
              <div className="overflow-hidden rounded-2xl border border-brand-dark/10 bg-background">
                <div className="grid grid-cols-[1fr_auto] border-b border-brand-dark/10 bg-secondary px-4 py-3 text-sm font-semibold text-brand-dark/80">
                  <p>{t.success.product}</p>
                  <p>{t.success.total}</p>
                </div>
                <div>
                  {orderItems.map((item, index) => (
                    <div
                      key={`${item.brand_name}-${item.model_name}-${item.memory}-${index}`}
                      className="grid grid-cols-[1fr_auto] border-b border-brand-dark/10 px-4 py-3 text-sm"
                    >
                      <p className="text-foreground">
                        {item.brand_name} {item.model_name} / {item.memory} /{" "}
                        {item.condition} × {item.quantity}
                      </p>
                      <p className="font-medium text-brand-dark">
                        {submissionLineTotal(
                          item.price,
                          item.quantity,
                        ).toFixed(2)}
                        $
                      </p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-[1fr_auto] border-b border-brand-dark/10 px-4 py-3 text-sm">
                  <p className="text-foreground">
                    {t.success.shippingProtection}{" "}
                    <span className="text-foreground/70">
                      ({withInsurance ? t.success.yes : t.success.no})
                    </span>
                  </p>
                  <p className="font-medium text-brand-dark">
                    {withInsurance ? `-${insuranceFee.toFixed(2)}$` : "0.00$"}
                  </p>
                </div>
                <div className="grid grid-cols-[1fr_auto] bg-secondary px-4 py-3">
                  <p className="font-semibold text-brand-dark">
                    {t.success.totalPayoutLabel}
                  </p>
                  <p className="font-semibold text-brand-dark">
                    {typeof totalPayout === "number"
                      ? `${totalPayout.toFixed(2)}$`
                      : "—"}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mb-8 w-full max-w-3xl rounded-2xl border border-brand-dark/10 bg-background p-5 shadow-soft sm:mb-12 sm:rounded-card sm:p-8"
          >
            <h2 className="mb-4 font-(family-name:--font-playfair) text-3xl font-light text-brand-dark">
              {t.success.shippingTitle}
            </h2>
            {trackingNumber ? (
              <div className="mb-4 rounded-2xl border border-brand-dark/10 bg-secondary p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/50">
                  {t.success.trackingNumber}
                </p>
                {trackingUrl ? (
                  <a
                    href={trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-sm font-semibold text-brand-primary underline underline-offset-4"
                  >
                    {trackingNumber}
                  </a>
                ) : (
                  <p className="mt-2 text-sm font-semibold text-brand-primary">
                    {trackingNumber}
                  </p>
                )}
              </div>
            ) : null}

            <p className="text-sm text-foreground/70">
              {t.success.shippingLabelManual}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="w-full max-w-2xl"
          >
            <p className="text-center text-sm text-foreground/70">
              {t.success.reviewInstructions}
            </p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-8 text-center text-sm text-brand-dark/60"
          >
            {t.success.emailInstructions}
          </motion.p>
        </div>
      </main>
    </div>
  );
}
