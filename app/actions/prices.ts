"use server";

import { createCachedClient } from "@/lib/supabase-server";

type GetPriceParams = {
  modelId: string;
  condition: string;
  memory: string;
};

type GetPriceResult = {
  success: true;
  price: number;
} | {
  success: false;
  error: string;
};

export async function getPrice({
  modelId,
  condition,
  memory,
}: GetPriceParams): Promise<GetPriceResult> {
  try {
    const supabase = createCachedClient();

    const { data, error } = await supabase
      .from("prices")
      .select("price")
      .eq("model_id", modelId)
      .eq("condition", condition)
      .eq("memory", memory)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error fetching price:", error);
      return {
        success: false,
        error: `Erreur lors de la récupération du prix: ${error.message}`,
      };
    }

    const row = data?.[0];
    if (!row || row.price === null || row.price === undefined) {
      return {
        success: false,
        error: "Aucun prix trouvé pour cette combinaison de modèle, état et capacité",
      };
    }

    return {
      success: true,
      price: row.price,
    };
  } catch (error) {
    console.error("Unexpected error in getPrice:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur inattendue s'est produite",
    };
  }
}
