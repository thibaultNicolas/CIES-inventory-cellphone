"use server";

import { createAdminClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { submissionLineTotal } from "@/lib/submissions";
import { computeCommissionFromGross } from "@/lib/commission-policy";
import { getActiveCommissionRules } from "@/lib/commission-rules-server";

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
    .select("price, quantity")
    .eq("id", submissionId)
    .maybeSingle();

  if (current.error) {
    console.error("Error fetching submission price:", current.error);
    return { success: false, error: current.error.message };
  }

  const previousPriceRaw = (current.data as { price?: number | string | null } | null)
    ?.price;
  const quantityRaw = (current.data as { quantity?: number | string | null } | null)
    ?.quantity;
  const previousPrice =
    typeof previousPriceRaw === "number"
      ? previousPriceRaw
      : typeof previousPriceRaw === "string" && previousPriceRaw.trim()
        ? Number(previousPriceRaw)
        : null;
  const quantity =
    typeof quantityRaw === "number" && Number.isFinite(quantityRaw)
      ? Math.max(1, Math.floor(quantityRaw))
      : typeof quantityRaw === "string" && quantityRaw.trim() && Number.isFinite(Number(quantityRaw))
        ? Math.max(1, Math.floor(Number(quantityRaw)))
        : 1;
  const gross = submissionLineTotal(price, quantity);
  const commissionRules = await getActiveCommissionRules();
  const commission = computeCommissionFromGross(gross, commissionRules);

  const update = await supabase
    .from("submissions")
    .update({
      price,
      price_override_previous: previousPrice,
      price_override_reason: normalizedReason,
      price_override_updated_at: new Date().toISOString(),
      price_override_updated_by: admin.email,
      commission_employee: commission.employee,
      commission_manager: commission.manager,
      commission_owner: commission.owner,
    })
    .eq("id", submissionId);

  if (update.error) {
    const message = String(update.error.message ?? update.error);
    const missingColumns =
      /price_override_previous|price_override_reason|price_override_updated_at|price_override_updated_by|commission_employee|commission_manager|commission_owner|column.*does not exist/i.test(
        message,
      );
    if (missingColumns) {
      return {
        success: false,
        error:
          "DB migration missing: run migrations for price override and commission columns before using this feature.",
      };
    }

    console.error("Error updating submission price:", update.error);
    return { success: false, error: update.error.message };
  }

  revalidatePath("/admin");
  return { success: true };
}

