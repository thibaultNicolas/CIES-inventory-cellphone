"use server";

import { createAdminClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import type { SubmissionStatus } from "@/lib/submissions";
import {
  buildPaymentUpdateFromCommissionPaid,
  buildPaymentUpdateFromOrderUi,
} from "@/lib/order-status";
import { requireAdmin } from "@/lib/admin-auth";

type UpdateStatusParams = {
  submissionId: string;
  status: SubmissionStatus;
};

function payloadFromSubmissionStatus(status: SubmissionStatus): {
  status: SubmissionStatus;
  commission_paid: boolean;
} {
  if (status === "paid") {
    return buildPaymentUpdateFromCommissionPaid(true);
  }
  if (status === "cancelled") {
    return buildPaymentUpdateFromOrderUi("cancelled");
  }
  if (status === "label_sent") {
    return { status: "label_sent", commission_paid: false };
  }
  return { status: "unprocessed", commission_paid: false };
}

export async function updateSubmissionStatus({
  submissionId,
  status,
}: UpdateStatusParams) {
  const admin = await requireAdmin();
  if (!admin) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();
  const payload = payloadFromSubmissionStatus(status);

  const { error } = await supabase
    .from("submissions")
    .update(payload)
    .eq("id", submissionId);

  if (error) {
    console.error("Error updating submission status:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin");
  return { success: true };
}
