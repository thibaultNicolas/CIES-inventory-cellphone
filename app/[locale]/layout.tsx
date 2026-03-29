import type { Locale } from "@/lib/i18n";
import { Plus_Jakarta_Sans, Sora } from "next/font/google";
import { getStructuredData } from "@/metadata";
import Script from "next/script";
import { Suspense } from "react";
import { I18nClientWrapper } from "./I18nClientWrapper";
import { ScrollToTopOnRouteChange } from "../components/ScrollToTopOnRouteChange";
import "../globals.css";

const GOOGLE_ANALYTICS_ID = "G-QRGX2498HX";

const geistSans = Plus_Jakarta_Sans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const playfair = Sora({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale: Locale = (locale === "fr" || locale === "en") ? locale : "fr";
  const structuredData = getStructuredData();

  return (
    <html lang={validLocale}>
      <body className={`${geistSans.variable} ${playfair.variable} antialiased`}>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GOOGLE_ANALYTICS_ID}');`}
        </Script>
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <ScrollToTopOnRouteChange />
        <Suspense fallback={children}>
          <I18nClientWrapper initialLocale={validLocale}>
            {children}
          </I18nClientWrapper>
        </Suspense>
      </body>
    </html>
  );
}
