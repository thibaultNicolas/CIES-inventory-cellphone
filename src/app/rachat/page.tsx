import Link from "next/link";
import { createCachedClient } from "@/lib/supabase-server";
import { RachatFlow } from "./rachat-flow";

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

  return data || [];
}

async function getModelsWithMinPrice(): Promise<Model[]> {
  const supabase = createCachedClient();

  const { data: models, error: modelsError } = await supabase
    .from("models")
    .select(`
      id,
      brand_id,
      name,
      slug,
      image_url,
      prices (price)
    `)
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
    prices: { price: number }[] | null;
  };

  return (models || []).map((model: ModelWithPrices) => {
    const prices = model.prices?.map((p) => p.price) ?? [];
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 0;
    return {
      id: model.id,
      brand_id: model.brand_id,
      name: model.name,
      slug: model.slug,
      image_url: model.image_url,
      min_price: minPrice,
      max_price: maxPrice,
    };
  });
}

export default async function RachatPage() {
  const [brands, models] = await Promise.all([
    getBrands(),
    getModelsWithMinPrice(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <header className="p-6">
        <Link href="/" className="text-xs uppercase tracking-premium text-foreground">
          ACHETETONCELL
        </Link>
      </header>
      <main className="px-6 pb-24">
        <RachatFlow brands={brands} models={models} />
      </main>
    </div>
  );
}
