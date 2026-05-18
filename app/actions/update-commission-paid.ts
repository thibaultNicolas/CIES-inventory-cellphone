"use server";

import { createAdminClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/admin-auth";

type UpdateCommissionPaidParams = {
  submissionId: string;
  commissionPaid: boolean;
};

export async function updateCommissionPaid({
  submissionId,
  commissionPaid,
}: UpdateCommissionPaidParams) {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return { success: false, error: "Forbidden" };
  }

  const supabase = createAdminClient();

  const payload: { commission_paid: boolean; status?: string } = {
    commission_paid: commissionPaid,
  };
  if (commissionPaid) {
    payload.status = "paid";
  }

  const { error } = await supabase
    .from("submissions")
    .update(payload)
    .eq("id", submissionId);

  if (error) {
    console.error("Error updating commission_paid:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin");
  return { success: true };
}
