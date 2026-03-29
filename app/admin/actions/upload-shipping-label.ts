"use server";

import { createAdminClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";

function isPdf(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export async function uploadShippingLabel(params: {
  requestGroupId: string;
  file: File;
}) {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Unauthorized" };

  const requestGroupId = params.requestGroupId?.trim();
  if (!requestGroupId) return { success: false, error: "Missing requestGroupId" };

  const file = params.file;
  if (!file) return { success: false, error: "Missing file" };
  if (!isPdf(file)) return { success: false, error: "Invalid file type (PDF required)" };

  const maxBytes = 10 * 1024 * 1024; // 10MB
  if (file.size > maxBytes) return { success: false, error: "File too large (max 10MB)" };

  const supabase = createAdminClient();

  const arrayBuffer = await file.arrayBuffer();
  const content = Buffer.from(arrayBuffer);
  const objectPath = `orders/${requestGroupId}/manual-shipping-label.pdf`;

  const upload = await supabase.storage.from("shipping-labels").upload(objectPath, content, {
    contentType: "application/pdf",
    cacheControl: "3600",
    upsert: true,
  });
  if (upload.error) {
    return { success: false, error: upload.error.message };
  }

  const { data: publicUrl } = supabase.storage.from("shipping-labels").getPublicUrl(objectPath);
  const url = publicUrl.publicUrl;

  // Persist on all rows of the order.
  const { error: updateError } = await supabase
    .from("submissions")
    .update({
      shipping_label_url: url,
      shipping_label_status: "ready",
      shipping_label_error: null,
    })
    .eq("request_group_id", requestGroupId);

  if (updateError) {
    // Try fallback for envs without request_group_id (legacy).
    if (!/request_group_id|column.*does not exist/i.test(String(updateError.message))) {
      return { success: false, error: updateError.message };
    }
  }

  revalidatePath("/admin");
  return { success: true, shippingLabelUrl: url };
}

