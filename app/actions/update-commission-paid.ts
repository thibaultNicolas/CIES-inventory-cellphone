"use server";

import { createAdminClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { buildPaymentUpdateFromCommissionPaid } from "@/lib/order-status";
import { requireAdmin } from "@/lib/admin-auth";

type UpdateCommissionPaidParams = {
  submissionId: string;
  commissionPaid: boolean;
};

async function resolveOrderIdForSubmission(
  supabase: ReturnType<typeof createAdminClient>,
  submissionId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("submissions")
    .select("id, request_group_id")
    .eq("id", submissionId)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as { id: string; request_group_id?: string | null };
  return row.request_group_id ?? row.id;
}

async function updatePaymentByOrderId(
  supabase: ReturnType<typeof createAdminClient>,
  orderId: string,
  commissionPaid: boolean,
) {
  const payload = buildPaymentUpdateFromCommissionPaid(commissionPaid);

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
    return { success: false as const, error: byGroup.error.message };
  }

  if ((byGroup.data || []).length > 0) {
    return { success: true as const };
  }

  const byId = await supabase.from("submissions").update(payload).eq("id", orderId);
  if (byId.error) return { success: false as const, error: byId.error.message };
  return { success: true as const };
}

export async function updateCommissionPaid({
  submissionId,
  commissionPaid,
}: UpdateCommissionPaidParams) {
  const admin = await requireAdmin();
  if (!admin) {
    return { success: false, error: "Forbidden" };
  }

  const supabase = createAdminClient();
  const orderId = await resolveOrderIdForSubmission(supabase, submissionId);
  if (!orderId) {
    return { success: false, error: "Submission not found" };
  }

  const result = await updatePaymentByOrderId(supabase, orderId, commissionPaid);
  if (!result.success) {
    return result;
  }

  revalidatePath("/admin");
  return { success: true };
}
