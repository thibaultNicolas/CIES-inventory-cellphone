"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { X } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";

const COOKIE_CONSENT_KEY = "cookie-consent";

type CookieConsent = "accepted" | "rejected" | null;

export function CookieBanner() {
  const { t } = useI18n();
  const [showBanner, setShowBanner] = useState(false);

  const loadTrackingScripts = useCallback(() => {
    // Load tracking scripts here
    // e.g. Google Analytics, Facebook Pixel, etc.
    
    // Example for Google Analytics (adapt to your needs)
    // if (typeof window !== "undefined" && !window.gtag) {
    //   const script1 = document.createElement("script");
    //   script1.async = true;
    //   script1.src = "https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID";
    //   document.head.appendChild(script1);
    //
    //   const script2 = document.createElement("script");
    //   script2.innerHTML = `
    //     window.dataLayer = window.dataLayer || [];
    //     function gtag(){dataLayer.push(arguments);}
    //     gtag('js', new Date());
    //     gtag('config', 'GA_MEASUREMENT_ID');
    //   `;
    //   document.head.appendChild(script2);
    // }
  }, []);

  useEffect(() => {
    // Check whether the user already made a choice
    const storedConsent = localStorage.getItem(COOKIE_CONSENT_KEY) as CookieConsent;
    
    if (!storedConsent) {
      // Show the banner if no choice was made yet
      setShowBanner(true);
    } else {
      // Load tracking scripts if accepted
      if (storedConsent === "accepted") {
        loadTrackingScripts();
      }
    }
  }, [loadTrackingScripts]);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setShowBanner(false);
    loadTrackingScripts();
  };

  const handleReject = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "rejected");
    setShowBanner(false);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-6 left-6 right-6 z-50 mx-auto max-w-2xl md:left-auto md:right-6"
        >
          <div className="relative rounded-card bg-background p-6 shadow-soft">
            <button
              onClick={handleReject}
              className="absolute right-4 top-4 text-foreground/40 transition-colors hover:text-foreground"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="pr-8">
              <h3 className="mb-2 text-base font-medium text-brand-dark">
                {t.cookie.title}
              </h3>
              <p className="mb-6 text-sm leading-relaxed text-foreground/70">
                {t.cookie.description}{" "}
                <Link
                  href="/politique-de-confidentialite"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline transition-colors hover:opacity-80"
                  style={{ color: "#0026FF" }}
                >
                  {t.cookie.learnMore}
                </Link>
                .
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  onClick={handleReject}
                  className="rounded-full border-2 border-foreground px-6 py-3 text-sm font-medium uppercase tracking-widest text-foreground transition-all hover:bg-foreground/5"
                >
                  {t.cookie.reject}
                </button>
                <button
                  onClick={handleAccept}
                  className="rounded-full px-6 py-3 text-sm font-medium uppercase tracking-widest text-background transition-all hover:opacity-90"
                  style={{ backgroundColor: "#0026FF" }}
                >
                  {t.cookie.accept}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
