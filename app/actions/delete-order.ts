"use server";

import { createAdminClient } from "@/lib/supabase-server";
import { requireSuperAdmin } from "@/lib/admin-auth";

export async function deleteOrder(orderId: string) {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return { success: false, error: "Forbidden" };
  }

  const supabase = createAdminClient();

  // First, try deleting by `request_group_id` (the real order id).
  // If the column doesn't exist or doesn't match anything, fall back to deleting by `id`.
  const byGroup = await supabase
    .from("submissions")
    .delete()
    .eq("request_group_id", orderId)
    .select("id");

  if (byGroup.error) {
    if (/request_group_id|column.*does not exist/i.test(String(byGroup.error.message))) {
      const byId = await supabase.from("submissions").delete().eq("id", orderId);
      if (byId.error) return { success: false, error: byId.error.message };
      return { success: true };
    }

    return { success: false, error: byGroup.error.message };
  }

  if ((byGroup.data || []).length > 0) {
    return { success: true };
  }

  const byId = await supabase.from("submissions").delete().eq("id", orderId);
  if (byId.error) return { success: false, error: byId.error.message };
  return { success: true };
}

