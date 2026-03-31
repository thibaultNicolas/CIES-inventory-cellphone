"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

const DEVICE_PHOTOS_BUCKET = "device-photos";

function storageObjectPathsFromRefs(refs: string[]): string[] {
  const marker = `/object/public/${DEVICE_PHOTOS_BUCKET}/`;
  const paths: string[] = [];
  for (const ref of refs) {
    if (typeof ref !== "string" || !ref.trim()) continue;
    const t = ref.trim();
    const i = t.indexOf(marker);
    if (i >= 0) {
      const path = decodeURIComponent(t.slice(i + marker.length).split("?")[0] || "");
      if (path) paths.push(path);
      continue;
    }
    if (!/^https?:\/\//i.test(t)) {
      paths.push(t.replace(/^\/+/, ""));
    }
  }
  return paths;
}

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
      const paths = storageObjectPathsFromRefs(submission.device_photos as string[]);
      if (paths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from(DEVICE_PHOTOS_BUCKET)
          .remove(paths);

        if (storageError) {
          console.error("Erreur lors de la suppression des photos:", storageError);
        }
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
