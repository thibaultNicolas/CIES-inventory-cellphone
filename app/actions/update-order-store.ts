"use server";

import { createAdminClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { hasMinRole } from "@/lib/app-role";

type UpdateOrderStoreParams = {
  orderId: string;
  storeName: string;
};

export async function updateOrderStore({ orderId, storeName }: UpdateOrderStoreParams) {
  const admin = await requireAdmin();
  if (!admin) {
    return { success: false, error: "Unauthorized" };
  }

  if (!hasMinRole(admin.role, "admin")) {
    return { success: false, error: "Forbidden" };
  }

  const trimmed = storeName.trim();
  if (!trimmed) {
    return { success: false, error: "Store name is required" };
  }

  const supabase = createAdminClient();
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id, name")
    .eq("name", trimmed)
    .eq("is_active", true)
    .maybeSingle();

  if (storeError || !store?.id) {
    return { success: false, error: "Unknown or inactive store" };
  }

  const payload = { store_name: store.name };

  const byGroup = await supabase
    .from("submissions")
    .update(payload)
    .eq("request_group_id", orderId)
    .select("id");

  if (byGroup.error) {
    if (/request_group_id|column.*does not exist/i.test(String(byGroup.error.message))) {
      const byId = await supabase.from("submissions").update(payload).eq("id", orderId);
      if (byId.error) return { success: false, error: byId.error.message };
      revalidatePath("/admin");
      return { success: true, storeName: store.name };
    }
    return { success: false, error: byGroup.error.message };
  }

  if ((byGroup.data || []).length > 0) {
    revalidatePath("/admin");
    return { success: true, storeName: store.name };
  }

  const byId = await supabase.from("submissions").update(payload).eq("id", orderId);
  if (byId.error) return { success: false, error: byId.error.message };
  revalidatePath("/admin");
  return { success: true, storeName: store.name };
}
