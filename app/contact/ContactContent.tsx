"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Phone, Clock3 } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";

export function ContactContent() {
  const { locale } = useI18n();
  const isFr = locale === "fr";

  return (
    <section className="bg-secondary py-12 sm:py-20 md:py-28">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:gap-8 sm:px-6 md:grid-cols-[1.1fr_0.9fr]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="rounded-2xl border border-foreground/10 bg-background p-5 sm:rounded-3xl sm:p-7 md:p-10"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-foreground/55">
            Contact
          </p>
          <h1 className="mt-2 font-(family-name:--font-playfair) text-3xl font-semibold text-brand-dark sm:mt-3 sm:text-4xl md:text-5xl">
            {isFr
              ? "Parlons de votre demande"
              : "Let's talk about your request"}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-foreground/75 sm:mt-4 sm:text-base">
            {isFr
              ? "Vous avez une question sur l'évaluation, l'état d'un appareil ou le paiement? Notre équipe vous répond rapidement."
              : "Have questions about valuation, device condition or payout? Our team will get back to you quickly."}
          </p>

          <div className="mt-8 space-y-4">
            <InfoRow
              icon={<Mail className="h-5 w-5" />}
              label={isFr ? "Courriel" : "Email"}
              value="info@achetetoncell.com"
              href="mailto:info@achetetoncell.com"
            />
            <InfoRow
              icon={<Phone className="h-5 w-5" />}
              label={isFr ? "Téléphone" : "Phone"}
              value="1-833-803-2023"
              href="tel:+18338032023"
            />
            <InfoRow
              icon={<Clock3 className="h-5 w-5" />}
              label={isFr ? "Heures" : "Hours"}
              value={isFr ? "Lun-Ven, 9h à 17h" : "Mon-Fri, 9am to 5pm"}
            />
          </div>
        </motion.div>

        <motion.aside
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="rounded-2xl border border-brand-primary/15 bg-gradient-to-br from-brand-dark to-brand-primary p-5 text-background sm:rounded-3xl sm:p-7 md:p-10"
        >
          <h2 className="text-xl font-semibold sm:text-2xl md:text-3xl">
            {isFr
              ? "Prêt à vendre votre appareil?"
              : "Ready to sell your device?"}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-background/85">
            {isFr
              ? "Lancez votre estimation en quelques clics et obtenez votre prix instantanément."
              : "Start your estimate in a few clicks and get your instant quote."}
          </p>
          <Link
            href={isFr ? "/" : "/en"}
            className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-full border border-background/50 px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.12em] hover:bg-background hover:text-brand-dark sm:mt-7 sm:px-6 sm:py-3"
          >
            {isFr ? "Aller au rachat" : "Go to buyback"}
          </Link>
        </motion.aside>
      </div>
    </section>
  );
}

function InfoRow({
  icon,
  label,
  value,
  href,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const content = href ? (
    <a href={href} className="text-brand-dark hover:text-brand-primary">
      {value}
    </a>
  ) : (
    <span>{value}</span>
  );

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-foreground/10 bg-secondary/60 p-4">
      <span className="mt-0.5 text-brand-primary">{icon}</span>
      <div>
        <p className="text-xs uppercase tracking-[0.12em] text-foreground/60">
          {label}
        </p>
        <p className="mt-1 text-sm font-medium text-foreground">{content}</p>
      </div>
    </div>
  );
}
