"use server";

import { createAdminClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import {
  buildPaymentUpdateFromOrderUi,
  type OrderStatusUi,
} from "@/lib/order-status";
import { requireAdmin } from "@/lib/admin-auth";

type UpdateOrderStatusParams = {
  orderId: string;
  paymentStatus: OrderStatusUi;
};

async function updateSubmissionsPaymentByOrderId(
  supabase: ReturnType<typeof createAdminClient>,
  orderId: string,
  paymentStatus: OrderStatusUi,
) {
  const payload = buildPaymentUpdateFromOrderUi(paymentStatus);

  const byGroup = await supabase
    .from("submissions")
    .update(payload)
    .eq("request_group_id", orderId)
    .select("id");

  if (byGroup.error) {
    if (/request_group_id|column.*does not exist/i.test(String(byGroup.error.message))) {
      const byId = await supabase.from("submissions").update(payload).eq("id", orderId);
      if (byId.error) return { success: false as const, error: byId.error.message };
      return { success: true as const };
    }
    console.error("Error updating order status:", byGroup.error);
    return { success: false as const, error: byGroup.error.message };
  }

  if ((byGroup.data || []).length > 0) {
    return { success: true as const };
  }

  const byId = await supabase.from("submissions").update(payload).eq("id", orderId);
  if (byId.error) return { success: false as const, error: byId.error.message };
  return { success: true as const };
}

export async function updateOrderStatus({
  orderId,
  paymentStatus,
}: UpdateOrderStatusParams) {
  const admin = await requireAdmin();
  if (!admin) {
    return { success: false, error: "Unauthorized" };
  }

  if (admin.role !== "super_admin" && paymentStatus !== "cancelled") {
    return { success: false, error: "Forbidden" };
  }

  const supabase = createAdminClient();
  const result = await updateSubmissionsPaymentByOrderId(
    supabase,
    orderId,
    paymentStatus,
  );
  if (!result.success) {
    return result;
  }

  revalidatePath("/admin");
  return { success: true };
}
