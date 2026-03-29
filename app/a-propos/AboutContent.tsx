"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, Truck, BadgeDollarSign, ArrowRight } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";

const cardAnimation = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

export function AboutContent() {
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const rachatHref = isFr ? "/" : "/en";

  return (
    <section className="relative overflow-hidden bg-secondary py-20 md:py-28">
      <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-brand-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-brand-dark/10 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="max-w-3xl"
        >
          <p className="mb-4 text-xs uppercase tracking-[0.2em] text-foreground/55">
            {isFr ? "À propos" : "About"}
          </p>
          <h1 className="font-(family-name:--font-playfair) text-4xl font-semibold leading-tight text-brand-dark md:text-6xl">
            {isFr
              ? "Un rachat simple, transparent et rapide"
              : "A simple, transparent and fast buyback"}
          </h1>
          <p className="mt-6 text-base leading-relaxed text-foreground/75 md:text-lg">
            {isFr
              ? "AcheteTonCell aide les particuliers à revendre leurs appareils au juste prix. Notre mission: offrir une expérience sans friction, du devis jusqu'au paiement."
              : "AcheteTonCell helps people sell devices at a fair price. Our mission: offer a frictionless experience from quote to payout."}
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          transition={{ staggerChildren: 0.08 }}
          className="mt-12 grid gap-5 md:grid-cols-3"
        >
          <motion.article
            variants={cardAnimation}
            className="rounded-3xl border border-foreground/10 bg-background p-6 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.25)]"
          >
            <ShieldCheck
              className="h-8 w-8 text-brand-primary"
              strokeWidth={1.8}
            />
            <h2 className="mt-4 text-xl font-semibold text-brand-dark">
              {isFr ? "Évaluation fiable" : "Reliable valuation"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground/70">
              {isFr
                ? "Nos grilles de prix sont basées sur l'état réel de l'appareil et mises à jour régulièrement."
                : "Our price grid is based on the real condition of the device and updated regularly."}
            </p>
          </motion.article>

          <motion.article
            variants={cardAnimation}
            className="rounded-3xl border border-foreground/10 bg-background p-6 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.25)]"
          >
            <Truck className="h-8 w-8 text-brand-primary" strokeWidth={1.8} />
            <h2 className="mt-4 text-xl font-semibold text-brand-dark">
              {isFr ? "Expédition facile" : "Easy shipping"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground/70">
              {isFr
                ? "Recevez votre étiquette et expédiez gratuitement. On s'occupe du reste."
                : "Get your shipping label and send your device for free. We handle the rest."}
            </p>
          </motion.article>

          <motion.article
            variants={cardAnimation}
            className="rounded-3xl border border-foreground/10 bg-background p-6 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.25)]"
          >
            <BadgeDollarSign
              className="h-8 w-8 text-brand-primary"
              strokeWidth={1.8}
            />
            <h2 className="mt-4 text-xl font-semibold text-brand-dark">
              {isFr ? "Paiement rapide" : "Fast payout"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground/70">
              {isFr
                ? "Après validation, le paiement est envoyé rapidement selon le mode choisi."
                : "After validation, payment is sent quickly using your selected method."}
            </p>
          </motion.article>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mt-12"
        >
          <Link
            href={rachatHref}
            className="inline-flex items-center gap-2 rounded-full bg-brand-dark px-7 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-background hover:bg-brand-primary"
          >
            {isFr ? "Commencer mon rachat" : "Start my buyback"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
