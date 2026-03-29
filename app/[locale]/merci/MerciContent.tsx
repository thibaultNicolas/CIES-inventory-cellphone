"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";
import type { Locale } from "@/lib/i18n";
import type { SubmissionNormalized } from "@/lib/submissions";
import { submissionLineTotal } from "@/lib/submissions";

type MerciContentProps = {
  locale: Locale;
  submission: Pick<
    SubmissionNormalized,
    "brand_name" | "model_name" | "memory" | "condition" | "price" | "quantity"
  > | null;
};

export function MerciContent({
  locale,
  submission,
}: MerciContentProps) {
  const { t } = useI18n();
  const homePath = locale === "fr" ? "/" : `/${locale}`;
  const rachatPath = locale === "fr" ? "/" : `/${locale}`;

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
              {t.merci.rachat}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 sm:pb-24">
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="mb-8"
          >
            <CheckCircle2
              className="h-24 w-24 text-brand-primary"
              strokeWidth={1}
            />
          </motion.div>

          <h1 className="mb-4 font-(family-name:--font-playfair) text-5xl font-light text-brand-dark md:text-6xl">
            {t.merci.thankYou}
          </h1>

          <p className="mb-12 max-w-md text-lg leading-relaxed text-foreground/60">
            {t.merci.message}
          </p>

          {submission && (
            <div className="mb-12 w-full rounded-card border border-foreground/10 bg-secondary p-8 shadow-soft text-left">
              <h2 className="mb-6 font-(family-name:--font-playfair) text-2xl font-light text-brand-dark">
                {t.merci.summary}
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-foreground/60">{t.merci.device}</span>
                  <span className="font-medium text-foreground">
                    {submission.brand_name} {submission.model_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/60">{t.merci.capacity}</span>
                  <span className="font-medium text-foreground">
                    {submission.memory}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/60">
                    {t.merci.condition}
                  </span>
                  <span className="font-medium text-foreground">
                    {submission.condition}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/60">
                    {t.wizard.quantityLabel}
                  </span>
                  <span className="font-medium text-foreground">
                    {submission.quantity}
                  </span>
                </div>
                <div className="flex justify-between border-t border-foreground/10 pt-3">
                  <span className="text-foreground/60">
                    {t.merci.offeredPrice}
                  </span>
                  <span className="font-(family-name:--font-playfair) text-2xl font-light text-brand-primary">
                    {submission.price
                      ? `${submissionLineTotal(submission.price, submission.quantity).toFixed(2)}$`
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              href={rachatPath}
              className="inline-block rounded-full border-2 border-brand-dark bg-background px-12 py-5 text-center text-sm font-medium uppercase tracking-[0.15em] text-brand-dark shadow-md transition-all duration-300 hover:bg-brand-dark hover:text-background hover:scale-105"
            >
              {t.merci.newRequest}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
