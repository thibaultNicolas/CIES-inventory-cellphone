import type { MetadataRoute } from "next";

/**
 * App interne : ne pas publier de plan de site pour les moteurs de recherche.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [];
}
