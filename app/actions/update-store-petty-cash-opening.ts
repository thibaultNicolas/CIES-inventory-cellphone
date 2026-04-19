"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

export async function updateStorePettyCashOpening(input: {
  storeId: string;
  amount: number;
}) {
  const admin = await requireAdmin();
  if (!admin) {
    return { success: false, error: "Forbidden" };
  }

  const storeId = input.storeId?.trim();
  if (!storeId) {
    return { success: false, error: "Missing store" };
  }

  if (!Number.isFinite(input.amount) || input.amount < 0) {
    return { success: false, error: "Invalid amount" };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("stores")
    .update({ petty_cash_opening_balance: input.amount })
    .eq("id", storeId)
    .eq("is_active", true);

  if (error) {
    if (/petty_cash_opening_balance|column.*does not exist/i.test(String(error.message))) {
      return {
        success: false,
        error: "Migration requise: colonne petty_cash_opening_balance sur stores.",
      };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/admin");
  return { success: true };
}
