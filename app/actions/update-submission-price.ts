"use server";

import { createAdminClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";

type UpdateSubmissionPriceParams = {
  submissionId: string;
  price: number;
  reason: string;
};

export async function updateSubmissionPrice({
  submissionId,
  price,
  reason,
}: UpdateSubmissionPriceParams) {
  const admin = await requireAdmin();
  if (!admin) {
    return { success: false, error: "Unauthorized" };
  }

  const normalizedReason = (reason || "").trim();
  if (!normalizedReason) {
    return { success: false, error: "Reason required" };
  }

  if (!Number.isFinite(price) || price <= 0) {
    return { success: false, error: "Invalid price" };
  }

  const supabase = createAdminClient();

  const current = await supabase
    .from("submissions")
    .select("price")
    .eq("id", submissionId)
    .maybeSingle();

  if (current.error) {
    console.error("Error fetching submission price:", current.error);
    return { success: false, error: current.error.message };
  }

  const previousPriceRaw = (current.data as { price?: number | string | null } | null)
    ?.price;
  const previousPrice =
    typeof previousPriceRaw === "number"
      ? previousPriceRaw
      : typeof previousPriceRaw === "string" && previousPriceRaw.trim()
        ? Number(previousPriceRaw)
        : null;

  const update = await supabase
    .from("submissions")
    .update({
      price,
      price_override_previous: previousPrice,
      price_override_reason: normalizedReason,
      price_override_updated_at: new Date().toISOString(),
      price_override_updated_by: admin.email,
    })
    .eq("id", submissionId);

  if (update.error) {
    const message = String(update.error.message ?? update.error);
    const missingColumns =
      /price_override_previous|price_override_reason|price_override_updated_at|price_override_updated_by|column.*does not exist/i.test(
        message,
      );
    if (missingColumns) {
      return {
        success: false,
        error:
          "DB migration missing: run the price override columns migration before using this feature.",
      };
    }

    console.error("Error updating submission price:", update.error);
    return { success: false, error: update.error.message };
  }

  revalidatePath("/admin");
  return { success: true };
}

