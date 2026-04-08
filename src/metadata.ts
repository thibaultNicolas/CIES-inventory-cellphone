import type { Metadata } from "next";

const siteName = "Rachat cellulaire";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://achetetoncell.com";
const shareImage = "/share.png";
type SiteLocale = "fr" | "en";

function normalizePath(path: string): string {
  if (!path || path === "/") return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

function withLocale(path: string, locale: SiteLocale): string {
  const normalized = normalizePath(path);
  if (locale === "fr") return normalized;
  if (normalized === "/") return "/en";
  return `/en${normalized}`;
}

function absoluteUrl(path: string): string {
  return `${siteUrl}${path}`;
}

function getAlternatesForPath(path: string) {
  const normalized = normalizePath(path);
  const frPath = withLocale(normalized, "fr");
  return {
    "fr-CA": absoluteUrl(frPath),
    "en-CA": absoluteUrl(withLocale(normalized, "en")),
    "x-default": absoluteUrl(frPath),
  };
}

const defaultTitle = "Rachat cellulaire Québec | Vendre iPhone Montréal";
const defaultDescription =
  "Vendez votre cellulaire au meilleur prix au Québec. Rachat iPhone, Samsung et plus. Évaluation gratuite, expédition offerte, paiement rapide en 4 jours. Service de rachat cellulaire à Montréal et partout au Québec.";

// Electric blue brand color for OpenGraph
const brandColor = "#0026FF";

/**
 * Generate the site's default metadata.
 */
export function getDefaultMetadata(): Metadata {
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: defaultTitle,
      template: `%s | ${siteName}`,
    },
    description: defaultDescription,
    keywords: [
      "rachat cellulaire québec",
      "vendre iphone montréal",
      "rachat téléphone québec",
      "vendre cellulaire montréal",
      "rachat iphone québec",
      "vendre samsung montréal",
      "rachat téléphone canada",
      "vendre cellulaire en ligne",
      "rachat cellulaire rapide",
      "vendre iphone usagé",
      "rachat téléphone montréal",
      "vendre cellulaire québec",
    ],
    authors: [{ name: siteName }],
    creator: siteName,
    publisher: siteName,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      type: "website",
      locale: "fr_CA",
      url: siteUrl,
      siteName: siteName,
      title: defaultTitle,
      description: defaultDescription,
      images: [
        {
          url: shareImage,
          width: 1200,
          height: 630,
          alt: "Rachat cellulaire au Québec",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: defaultTitle,
      description: defaultDescription,
      images: [shareImage],
      creator: "@achetetoncell",
    },
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      // Add your verification codes here if needed
      // google: "your-google-verification-code",
      // yandex: "your-yandex-verification-code",
    },
    alternates: {
      canonical: siteUrl,
      languages: getAlternatesForPath("/"),
    },
    other: {
      "theme-color": brandColor,
      "msapplication-TileColor": brandColor,
      "apple-mobile-web-app-status-bar-style": "black-translucent",
    },
  };
}

/**
 * Generate custom metadata for a specific page.
 */
export function getPageMetadata({
  title,
  description,
  keywords,
  image,
  url,
  locale = "fr",
  noindex = true,
}: {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  locale?: SiteLocale;
  noindex?: boolean;
}): Metadata {
  const fullTitle = `${title} | ${siteName}`;
  const normalizedPath = normalizePath(url || "/");
  const canonicalPath = withLocale(normalizedPath, locale);
  const pageUrl = absoluteUrl(canonicalPath);
  const pageImage = image || shareImage;

  return {
    title: fullTitle,
    description,
    keywords: keywords || [],
    openGraph: {
      title: fullTitle,
      description,
      url: pageUrl,
      siteName: siteName,
      images: [
        {
          url: pageImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: "fr_CA",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [pageImage],
    },
    alternates: {
      canonical: pageUrl,
      languages: getAlternatesForPath(normalizedPath),
    },
    robots: noindex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
        },
  };
}

/**
 * Métadonnées spécifiques pour la page d'accueil
 */
export function getHomeMetadata(locale: SiteLocale = "fr"): Metadata {
  return getPageMetadata({
    title: "Rachat cellulaire Québec | Vendre iPhone Montréal",
    description:
      "Vendez votre cellulaire au meilleur prix au Québec. Service de rachat iPhone, Samsung et autres téléphones. Évaluation gratuite, expédition offerte, paiement rapide en 4 jours.",
    keywords: [
      "rachat cellulaire québec",
      "vendre iphone montréal",
      "rachat téléphone québec",
      "vendre cellulaire montréal",
      "rachat iphone québec",
      "vendre samsung montréal",
    ],
    url: "/",
    locale,
  });
}

/**
 * Metadata for the trade-in form page.
 */
export function getRachatMetadata(locale: SiteLocale = "fr"): Metadata {
  return getPageMetadata({
    title: "Vendre mon cellulaire - Formulaire de rachat",
    description:
      "Vendez votre cellulaire en quelques clics. Évaluation gratuite et instantanée. Expédition offerte partout au Québec. Paiement rapide en 4 jours.",
    keywords: [
      "vendre cellulaire en ligne",
      "formulaire rachat téléphone",
      "évaluation cellulaire gratuite",
      "vendre téléphone québec",
    ],
    url: "/",
    locale,
  });
}

/**
 * Metadata for the thank-you page.
 */
export function getMerciMetadata(locale: SiteLocale = "fr"): Metadata {
  return getPageMetadata({
    title: "Merci pour votre demande",
    description:
      "Votre demande de rachat a été reçue. Nous vous contacterons sous peu pour finaliser la transaction.",
    url: "/merci",
    locale,
    noindex: true, // Do not index thank-you pages
  });
}

/**
 * Metadata for the admin page.
 */
export function getAdminMetadata(): Metadata {
  return getPageMetadata({
    title: "Administration",
    description: "Panneau d'administration",
    url: "/admin",
    noindex: true, // Do not index admin pages
  });
}

/**
 * Generate extra OpenGraph meta tags (including the electric blue theme color).
 */
export function getOpenGraphTags() {
  return {
    "og:site_name": siteName,
    "og:locale": "fr_CA",
    "og:type": "website",
    "og:image:type": "image/png",
    "og:image:width": "1200",
    "og:image:height": "630",
    "og:image:alt": "Rachat cellulaire au Québec",
    // Brand color for OpenGraph cards
    "theme-color": brandColor,
  };
}

/**
 * Generate structured JSON-LD tags for SEO.
 */
export function getStructuredData() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: siteName,
      url: siteUrl,
      image: `${siteUrl}${shareImage}`,
      priceRange: "$$",
      areaServed: ["Montreal", "Quebec"],
      address: {
        "@type": "PostalAddress",
        addressCountry: "CA",
        addressRegion: "QC",
        addressLocality: "Montreal",
      },
    },
    {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: siteUrl,
    description: defaultDescription,
    address: {
      "@type": "PostalAddress",
      addressCountry: "CA",
      addressRegion: "QC",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
      areaServed: "CA",
      availableLanguage: "French",
    },
    sameAs: [
      // Add your social links here
      // "https://www.facebook.com/achetetoncell",
      // "https://twitter.com/achetetoncell",
    ],
    },
  ];
}

/**
 * Generate JSON-LD tags for the trade-in service.
 */
export function getServiceStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Rachat de téléphones cellulaires",
    provider: {
      "@type": "Organization",
      name: siteName,
      url: siteUrl,
    },
    areaServed: {
      "@type": "Country",
      name: "Canada",
    },
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: siteUrl,
      serviceType: "Online",
    },
    description: defaultDescription,
  };
}
