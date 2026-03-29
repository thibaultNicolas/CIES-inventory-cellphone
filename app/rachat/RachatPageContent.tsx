import { createCachedClient } from "@/lib/supabase-server";
import { sortModelsByRecent } from "@/lib/model-sort";
import { RachatWizard } from "./rachat-wizard";
import type { Locale } from "@/lib/i18n";

type Brand = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
};

type Model = {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
  image_url: string | null;
  min_price: number;
  max_price: number;
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

async function getBrands(): Promise<Brand[]> {
  const supabase = createCachedClient();
  const { data, error } = await supabase
    .from("brands")
    .select("id, name, slug, logo_url")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching brands:", error);
    return [];
  }

  const brands = data || [];
  brands.sort((a, b) => {
    const orderA = getBrandOrderIndex(a.name);
    const orderB = getBrandOrderIndex(b.name);
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name);
  });

  return brands;
}

async function getModelsWithMinPrice(): Promise<Model[]> {
  const supabase = createCachedClient();

  const { data: models, error: modelsError } = await supabase
    .from("models")
    .select(
      `
      id,
      brand_id,
      name,
      slug,
      image_url,
      brands (name),
      prices (price)
    `,
    )
    .order("name", { ascending: true });

  if (modelsError) {
    console.error("Error fetching models:", modelsError);
    return [];
  }

  type ModelWithPrices = {
    id: string;
    brand_id: string;
    name: string;
    slug: string;
    image_url: string | null;
    brands: { name: string }[] | { name: string } | null;
    prices: { price: number }[] | null;
  };

  const mappedModels = (models || []).map((model: ModelWithPrices) => {
    const brandName = Array.isArray(model.brands)
      ? model.brands[0]?.name || ""
      : model.brands?.name || "";

    const prices = model.prices?.map((p) => p.price) ?? [];
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 0;

    return {
      id: model.id,
      brand_id: model.brand_id,
      name: model.name,
      slug: model.slug,
      image_url: model.image_url,
      brand_name: brandName,
      min_price: minPrice,
      max_price: maxPrice,
    };
  });

  const modelsByBrand = new Map<string, typeof mappedModels>();
  for (const model of mappedModels) {
    const brand = model.brand_name;
    if (!modelsByBrand.has(brand)) {
      modelsByBrand.set(brand, []);
    }
    modelsByBrand.get(brand)!.push(model);
  }

  const sortedModels: typeof mappedModels = [];
  const sortedBrandEntries = Array.from(modelsByBrand.entries()).sort(
    (a, b) => {
      const orderA = getBrandOrderIndex(a[0]);
      const orderB = getBrandOrderIndex(b[0]);
      if (orderA !== orderB) return orderA - orderB;
      return a[0].localeCompare(b[0]);
    },
  );

  for (const [brand, brandModels] of sortedBrandEntries) {
    sortedModels.push(...sortModelsByRecent(brandModels, brand));
  }

  return sortedModels;
}

export type RachatPageContentProps = {
  locale: Locale;
};

export async function RachatPageContent({ locale }: RachatPageContentProps) {
  const [brands, models] = await Promise.all([
    getBrands(),
    getModelsWithMinPrice(),
  ]);

  return (
    <div id="rachat-top" className="min-h-screen bg-background pt-6 md:pt-8">
      <div id="faq" className="sr-only" aria-hidden="true" />
      <main>
        <RachatWizard brands={brands} models={models} />
      </main>
      <a
        href="#rachat-top"
        aria-label={locale === "fr" ? "Retour en haut" : "Back to top"}
        className="fixed bottom-5 right-5 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-brand-dark text-lg text-background shadow-lg transition-all hover:bg-brand-primary"
      >
        ↑
      </a>
    </div>
  );
}
