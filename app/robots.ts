import type { MetadataRoute } from "next";

/**
 * Application interne : aucune URL ne doit être explorée ni indexée.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        disallow: ["/"],
      },
    ],
  };
}
