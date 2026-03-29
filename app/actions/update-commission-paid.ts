"use server";

import { createAdminClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";

type UpdateCommissionPaidParams = {
  submissionId: string;
  commissionPaid: boolean;
};

export async function updateCommissionPaid({
  submissionId,
  commissionPaid,
}: UpdateCommissionPaidParams) {
  const admin = await requireAdmin();
  if (!admin) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("submissions")
    .update({ commission_paid: commissionPaid })
    .eq("id", submissionId);

  if (error) {
    console.error("Error updating commission_paid:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin");
  return { success: true };
}
