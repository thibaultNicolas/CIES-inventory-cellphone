"use server";

import { createAdminClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import type { SubmissionStatus } from "@/lib/submissions";
import { requireAdmin } from "@/lib/admin-auth";
import { commissionPaidForOrderStatus } from "@/lib/order-status";

type UpdateOrderStatusParams = {
  orderId: string;
  status: SubmissionStatus;
};

function buildStatusUpdatePayload(status: SubmissionStatus) {
  const payload: { status: SubmissionStatus; commission_paid?: boolean } = { status };
  const commissionPaid = commissionPaidForOrderStatus(status);
  if (commissionPaid !== undefined) {
    payload.commission_paid = commissionPaid;
  }
  return payload;
}

async function updateSubmissionsByOrderId(
  supabase: ReturnType<typeof createAdminClient>,
  orderId: string,
  status: SubmissionStatus,
) {
  const payload = buildStatusUpdatePayload(status);

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

export async function updateOrderStatus({ orderId, status }: UpdateOrderStatusParams) {
  const admin = await requireAdmin();
  if (!admin) {
    return { success: false, error: "Unauthorized" };
  }

  if (admin.role !== "super_admin" && status !== "cancelled") {
    return { success: false, error: "Forbidden" };
  }

  const supabase = createAdminClient();
  const result = await updateSubmissionsByOrderId(supabase, orderId, status);
  if (!result.success) {
    return result;
  }

  revalidatePath("/admin");
  return { success: true };
}
