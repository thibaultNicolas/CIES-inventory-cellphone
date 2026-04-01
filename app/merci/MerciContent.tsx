"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import type { SubmissionNormalized } from "@/lib/submissions";
import { submissionLineTotal } from "@/lib/submissions";

type SubmissionSummary = Pick<
  SubmissionNormalized,
  "brand_name" | "model_name" | "memory" | "condition" | "price" | "quantity"
>;

type MerciContentProps = {
  submission: SubmissionSummary | null;
};

export function MerciContent({ submission }: MerciContentProps) {
  return (
    <div className="min-h-screen bg-background pt-28 sm:pt-32">
      <header className="fixed left-0 right-0 top-14 z-50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
          <Link
            href="/"
            className="shrink-0 font-(family-name:--font-playfair) text-lg font-semibold tracking-tight text-brand-dark transition-colors hover:text-brand-primary sm:text-xl"
          >
            AcheteTonCell
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-8">
            <Link
              href="/"
              className="text-xs uppercase tracking-[0.15em] text-foreground/70 transition-colors hover:text-brand-primary"
            >
              Rachat
            </Link>
            <Link
              href="/a-propos"
              className="text-xs uppercase tracking-[0.15em] text-foreground/70 transition-colors hover:text-brand-primary"
            >
              À propos
            </Link>
            <Link
              href="/contact"
              className="text-xs uppercase tracking-[0.15em] text-foreground/70 transition-colors hover:text-brand-primary"
            >
              Contact
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
            className="mb-6 sm:mb-8"
          >
            <CheckCircle2
              className="h-20 w-20 text-brand-primary sm:h-24 sm:w-24"
              strokeWidth={1}
            />
          </motion.div>

          <h1 className="mb-3 font-(family-name:--font-playfair) text-4xl font-light text-brand-dark sm:mb-4 sm:text-5xl md:text-6xl">
            Merci !
          </h1>

          <p className="mb-8 max-w-md text-base leading-relaxed text-foreground/60 sm:mb-12 sm:text-lg">
            Votre demande de rachat a été enregistrée avec succès. Nous vous
            enverrons un courriel de confirmation sous peu avec toutes les
            instructions pour l&apos;expédition.
          </p>

          {submission && (
            <div className="mb-8 w-full rounded-2xl border border-foreground/10 bg-secondary p-5 shadow-soft text-left sm:mb-12 sm:rounded-card sm:p-8">
              <h2 className="mb-6 font-(family-name:--font-playfair) text-2xl font-light text-brand-dark">
                Récapitulatif
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-foreground/60">Appareil :</span>
                  <span className="font-medium text-foreground">
                    {submission.brand_name} {submission.model_name}
                  </span>
                </div>
                {submission.memory && (
                  <div className="flex justify-between">
                    <span className="text-foreground/60">Capacité :</span>
                    <span className="font-medium text-foreground">
                      {submission.memory}
                    </span>
                  </div>
                )}
                {submission.condition && (
                  <div className="flex justify-between">
                    <span className="text-foreground/60">État :</span>
                    <span className="font-medium text-foreground">
                      {submission.condition}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-foreground/60">Quantité :</span>
                  <span className="font-medium text-foreground">
                    {submission.quantity}
                  </span>
                </div>
                <div className="flex justify-between border-t border-foreground/10 pt-3">
                  <span className="text-foreground/60">Prix offert :</span>
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
              href="/"
              className="inline-block rounded-full border-2 border-brand-dark bg-background px-12 py-5 text-center text-sm font-medium uppercase tracking-[0.15em] text-brand-dark shadow-md transition-all duration-300 hover:bg-brand-dark hover:text-background hover:scale-105"
            >
              Nouvelle demande
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
