import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://achetetoncell.com";
const routes = [
  "/",
  "/a-propos",
  "/contact",
  "/politique-de-confidentialite",
  "/termes-et-conditions",
] as const;

function toAbsolute(path: string) {
  return `${siteUrl}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return routes.flatMap((route) => {
    const frPath = route;
    const enPath = route === "/" ? "/en" : `/en${route}`;
    return [
      {
        url: toAbsolute(frPath),
        lastModified,
        alternates: {
          languages: {
            "fr-CA": toAbsolute(frPath),
            "en-CA": toAbsolute(enPath),
            "x-default": toAbsolute(frPath),
          },
        },
      },
      {
        url: toAbsolute(enPath),
        lastModified,
        alternates: {
          languages: {
            "fr-CA": toAbsolute(frPath),
            "en-CA": toAbsolute(enPath),
            "x-default": toAbsolute(frPath),
          },
        },
      },
    ];
  });
}
