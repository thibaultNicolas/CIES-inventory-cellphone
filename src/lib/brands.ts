import { createCachedClient, formatSupabaseError } from "@/lib/supabase-server";

export type BrandForHome = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
};

const DEFAULT_BRAND_ORDER = [
  ["iphone", "apple"],
  ["samsung"],
  ["pixel", "google"],
  ["motorola"],
  ["lg"],
  ["huawei"],
  ["tcl"],
  ["oneplus", "one plus"],
] as const;

function normalizeBrandName(brandName: string): string {
  return brandName
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

export function getBrandOrderIndex(brandName: string): number {
  const normalized = normalizeBrandName(brandName);
  const idx = DEFAULT_BRAND_ORDER.findIndex((aliases) =>
    aliases.some(
      (alias) =>
        normalized === alias ||
        normalized.startsWith(`${alias} `) ||
        normalized.endsWith(` ${alias}`),
    ),
  );
  return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
}

export function compareBrandsByDefaultOrder(a: string, b: string): number {
  const orderA = getBrandOrderIndex(a);
  const orderB = getBrandOrderIndex(b);
  if (orderA !== orderB) return orderA - orderB;
  return a.localeCompare(b);
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
  brands.sort((a, b) => compareBrandsByDefaultOrder(a.name, b.name));

  return brands;
}
