"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

export async function deleteSubmission(submissionId: string) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = createAdminClient();

    // 1. Fetch photo URLs before deleting
    const { data: submission, error: fetchError } = await supabase
      .from("submissions")
      .select("device_photos")
      .eq("id", submissionId)
      .single();

    if (fetchError || !submission) {
      return { success: false, error: "Soumission introuvable" };
    }

    // 2. Delete photos from Supabase Storage
    if (submission.device_photos && Array.isArray(submission.device_photos) && submission.device_photos.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("device-photos")
        .remove(submission.device_photos);

      if (storageError) {
        console.error("Erreur lors de la suppression des photos:", storageError);
        // Continue even if photo deletion fails
      }
    }

    // 3. Delete the row from the submissions table
    const { error: deleteError } = await supabase
      .from("submissions")
      .delete()
      .eq("id", submissionId);

    if (deleteError) {
      return { success: false, error: "Erreur lors de la suppression de la soumission" };
    }

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la suppression:", error);
    return { success: false, error: "Une erreur inattendue s'est produite" };
  }
}
