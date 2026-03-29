import { createCachedClient, formatSupabaseError } from "@/lib/supabase-server";

export type BrandForHome = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
};

const DEFAULT_BRAND_ORDER = [
  "iphone",
  "samsung",
  "google",
  "motorola",
  "lg",
  "huawei",
  "tcl",
  "oneplus",
] as const;

function getBrandOrderIndex(brandName: string): number {
  const normalized = brandName.trim().toLowerCase();
  const idx = DEFAULT_BRAND_ORDER.findIndex((b) => b === normalized);
  return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
}

/** Fetch brands for home page "marques qu'on rachète" section. Sorted by default order then name. */
export async function getBrandsForHome(): Promise<BrandForHome[]> {
  const supabase = createCachedClient();
  const { data, error } = await supabase
    .from("brands")
    .select("id, name, slug, logo_url")
    .order("name", { ascending: true });

  if (error) {
    console.error(
      "Error fetching brands for home:",
      formatSupabaseError(error),
    );
    return [];
  }

  const brands = (data || []) as BrandForHome[];
  brands.sort((a, b) => {
    const orderA = getBrandOrderIndex(a.name);
    const orderB = getBrandOrderIndex(b.name);
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name);
  });

  return brands;
}
