import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Plus_Jakarta_Sans, Sora } from "next/font/google";
import { getDefaultMetadata, getStructuredData } from "@/metadata";
import Script from "next/script";
import type { Locale } from "@/lib/i18n";
import { ScrollToTopOnRouteChange } from "./components/ScrollToTopOnRouteChange";
import { AuthenticatedHeader } from "./components/AuthenticatedHeader";
import { I18nProvider } from "@/contexts/I18nContext";
import "./globals.css";

const GOOGLE_ANALYTICS_ID = "G-QRGX2498HX";

const geistSans = Plus_Jakarta_Sans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const playfair = Sora({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = getDefaultMetadata();

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = getStructuredData();
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("locale")?.value;
  const initialLocale: Locale = localeCookie === "en" ? "en" : "fr";

  return (
    <html lang={initialLocale}>
      <body className={`${geistSans.variable} ${playfair.variable} antialiased`}>
        <I18nProvider initialLocale={initialLocale}>
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
          <AuthenticatedHeader />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
