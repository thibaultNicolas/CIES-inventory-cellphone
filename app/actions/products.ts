"use server";

import { createAdminClient, createCachedClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";

export async function getBrands() {
  const supabase = createCachedClient();
  const { data, error } = await supabase
    .from("brands")
    .select("id, name, slug, logo_url, created_at")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching brands:", error);
    return { success: false, data: [], error: error.message };
  }

  return { success: true, data: data || [], error: null };
}

export async function getModels(brandId?: string) {
  const supabase = createCachedClient();
  let query = supabase
    .from("models")
    .select("id, brand_id, name, slug, image_url, created_at, brands(name)");

  if (brandId) {
    query = query.eq("brand_id", brandId);
  }

  const { data, error } = await query.order("name", { ascending: true });

  if (error) {
    console.error("Error fetching models:", error);
    return { success: false, data: [], error: error.message };
  }

  return { success: true, data: data || [], error: null };
}

export async function getPrices(modelId?: string) {
  const supabase = createCachedClient();
  const PAGE_SIZE = 1000;
  const all: unknown[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const to = from + PAGE_SIZE - 1;
    let query = supabase.from("prices").select("*, models(name, brands(name))");

    if (modelId) {
      query = query.eq("model_id", modelId);
    }

    const { data, error } = await query
      .order("price", { ascending: false })
      .order("id", { ascending: true })
      .range(from, to);

    if (error) {
      console.error("Error fetching prices:", error);
      return { success: false, data: [], error: error.message };
    }

    const rows: unknown[] = data || [];
    all.push(...rows);

    if (rows.length < PAGE_SIZE) {
      break;
    }
  }

  return { success: true, data: all, error: null };
}

export async function createBrand(name: string, logoUrl?: string) {
  const admin = await requireAdmin();
  if (!admin) return { success: false, data: null, error: "Unauthorized" };

  // Writes must bypass RLS
  const supabase = createAdminClient();
  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const { data, error } = await supabase
    .from("brands")
    .insert({ name, slug, logo_url: logoUrl || null })
    .select()
    .single();

  if (error) {
    console.error("Error creating brand:", error);
    return { success: false, data: null, error: error.message };
  }

  revalidatePath("/admin");
  return { success: true, data, error: null };
}

export async function updateBrand(id: string, name: string, logoUrl?: string) {
  const admin = await requireAdmin();
  if (!admin) return { success: false, data: null, error: "Unauthorized" };

  // Writes must bypass RLS
  const supabase = createAdminClient();
  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const { data, error } = await supabase
    .from("brands")
    .update({ name, slug, logo_url: logoUrl || null })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating brand:", error);
    return { success: false, data: null, error: error.message };
  }

  revalidatePath("/admin");
  return { success: true, data, error: null };
}

export async function deleteBrand(id: string) {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Unauthorized" };

  // Writes must bypass RLS
  const supabase = createAdminClient();

  const { error } = await supabase.from("brands").delete().eq("id", id);

  if (error) {
    console.error("Error deleting brand:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin");
  return { success: true, error: null };
}

export async function createModel(brandId: string, name: string, imageUrl?: string) {
  const admin = await requireAdmin();
  if (!admin) return { success: false, data: null, error: "Unauthorized" };

  // Writes must bypass RLS
  const supabase = createAdminClient();
  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const { data, error } = await supabase
    .from("models")
    .insert({ brand_id: brandId, name, slug, image_url: imageUrl || null })
    .select()
    .single();

  if (error) {
    console.error("Error creating model:", error);
    return { success: false, data: null, error: error.message };
  }

  revalidatePath("/admin");
  return { success: true, data, error: null };
}

export async function updateModel(id: string, name: string, imageUrl?: string) {
  const admin = await requireAdmin();
  if (!admin) return { success: false, data: null, error: "Unauthorized" };

  // Writes must bypass RLS
  const supabase = createAdminClient();
  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const { data, error } = await supabase
    .from("models")
    .update({ name, slug, image_url: imageUrl || null })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating model:", error);
    return { success: false, data: null, error: error.message };
  }

  revalidatePath("/admin");
  return { success: true, data, error: null };
}

export async function deleteModel(id: string) {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Unauthorized" };

  // Writes must bypass RLS
  const supabase = createAdminClient();

  const { error } = await supabase.from("models").delete().eq("id", id);

  if (error) {
    console.error("Error deleting model:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin");
  return { success: true, error: null };
}

export async function createPrice(
  modelId: string,
  condition: string,
  memory: string,
  price: number
) {
  const admin = await requireAdmin();
  if (!admin) return { success: false, data: null, error: "Unauthorized" };

  // Writes must bypass RLS
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("prices")
    .insert({ model_id: modelId, condition, memory, price })
    .select()
    .single();

  if (error) {
    console.error("Error creating price:", error);
    return { success: false, data: null, error: error.message };
  }

  revalidatePath("/admin");
  return { success: true, data, error: null };
}

export async function updatePrice(
  id: string,
  condition: string,
  memory: string,
  price: number
) {
  const admin = await requireAdmin();
  if (!admin) return { success: false, data: null, error: "Unauthorized" };

  // Writes must bypass RLS
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("prices")
    .update({ condition, memory, price })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating price:", error);
    return { success: false, data: null, error: error.message };
  }

  revalidatePath("/admin");
  return { success: true, data, error: null };
}

export async function updatePricesBulk(
  updates: Array<{
    id: string;
    model_id?: string;
    condition?: string;
    memory?: string;
    price?: number;
  }>
) {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Unauthorized" };

  // Writes must bypass RLS
  const supabase = createAdminClient();

  if (updates.length === 0) {
    return { success: false, error: "Aucune modification à appliquer" };
  }

  // Upsert requires NOT NULL columns to be present in the INSERT payload even if it
  // will ultimately hit the conflict path. Therefore we always hydrate condition/memory
  // (and model_id for completeness) from existing rows when missing.
  const ids = Array.from(new Set(updates.map((u) => u.id).filter(Boolean)));
  if (ids.length === 0) {
    return { success: false, error: "Aucune modification à appliquer" };
  }

  const existingById = new Map<
    string,
    { id: string; model_id: string | null; condition: string; memory: string }
  >();

  const FETCH_CHUNK = 200;
  for (let i = 0; i < ids.length; i += FETCH_CHUNK) {
    const chunk = ids.slice(i, i + FETCH_CHUNK);
    const { data, error } = await supabase
      .from("prices")
      .select("id, model_id, condition, memory")
      .in("id", chunk);

    if (error) {
      console.error("Error fetching prices for bulk update:", error);
      return { success: false, error: error.message };
    }

    const rows = (data || []) as Array<{
      id: string;
      model_id: string | null;
      condition: string;
      memory: string;
    }>;

    for (const row of rows) {
      existingById.set(row.id, row);
    }
  }

  // Use batched upserts to avoid issuing one request per row.
  const rowsToUpsert = updates
    .map((u) => {
      const existing = existingById.get(u.id);
      if (!existing) {
        return null;
      }

      const condition = u.condition ?? existing.condition;
      const memory = u.memory ?? existing.memory;
      const model_id = u.model_id ?? existing.model_id;

      // Always include NOT NULL columns for INSERT payload safety.
      const row: Record<string, unknown> = {
        id: u.id,
        condition,
        memory,
      };
      if (model_id !== undefined) row.model_id = model_id;
      if (u.price !== undefined) row.price = u.price;
      return row;
    })
    .filter((row): row is Record<string, unknown> => row !== null)
    // Keep only rows that actually change something besides id
    .filter((row) => Object.keys(row).length > 1);

  if (rowsToUpsert.length === 0) {
    return { success: false, error: "Aucune modification à appliquer" };
  }

  const CHUNK_SIZE = 200;
  for (let i = 0; i < rowsToUpsert.length; i += CHUNK_SIZE) {
    const chunk = rowsToUpsert.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase
      .from("prices")
      .upsert(chunk, { onConflict: "id" });

    if (error) {
      console.error("Error bulk-updating prices:", error);
      return { success: false, error: error.message };
    }
  }

  revalidatePath("/admin");
  return { success: true, error: null };
}

export async function deletePrice(id: string) {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Unauthorized" };

  // Writes must bypass RLS
  const supabase = createAdminClient();

  const { error } = await supabase.from("prices").delete().eq("id", id);

  if (error) {
    console.error("Error deleting price:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin");
  return { success: true, error: null };
}
