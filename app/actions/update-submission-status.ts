"use server";

import { createAdminClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import type { SubmissionStatus } from "@/lib/submissions";
import { requireAdmin } from "@/lib/admin-auth";

type UpdateStatusParams = {
  submissionId: string;
  status: SubmissionStatus;
};

export async function updateSubmissionStatus({
  submissionId,
  status,
}: UpdateStatusParams) {
  const admin = await requireAdmin();
  if (!admin) {
    return { success: false, error: "Unauthorized" };
  }

  // Use the service role key to bypass RLS (admin operation)
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("submissions")
    .update({ status })
    .eq("id", submissionId);

  if (error) {
    console.error("Error updating submission status:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin");
  return { success: true };
}
