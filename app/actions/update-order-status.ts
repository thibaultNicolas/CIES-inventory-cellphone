"use server";

import { createAdminClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import type { SubmissionStatus } from "@/lib/submissions";
import { requireAdmin } from "@/lib/admin-auth";

type UpdateOrderStatusParams = {
  orderId: string;
  status: SubmissionStatus;
};

export async function updateOrderStatus({ orderId, status }: UpdateOrderStatusParams) {
  const admin = await requireAdmin();
  if (!admin) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();

  // First, try updating by `request_group_id` (the real order id).
  // If the column doesn't exist or doesn't match anything, fall back to updating by `id`.
  const byGroup = await supabase
    .from("submissions")
    .update({ status })
    .eq("request_group_id", orderId)
    .select("id");

  if (byGroup.error) {
    if (/request_group_id|column.*does not exist/i.test(String(byGroup.error.message))) {
      const byId = await supabase
        .from("submissions")
        .update({ status })
        .eq("id", orderId);
      if (byId.error) return { success: false, error: byId.error.message };
      revalidatePath("/admin");
      return { success: true };
    }

    console.error("Error updating order status:", byGroup.error);
    return { success: false, error: byGroup.error.message };
  }

  if ((byGroup.data || []).length > 0) {
    revalidatePath("/admin");
    return { success: true };
  }

  const byId = await supabase.from("submissions").update({ status }).eq("id", orderId);
  if (byId.error) return { success: false, error: byId.error.message };
  revalidatePath("/admin");
  return { success: true };
}

