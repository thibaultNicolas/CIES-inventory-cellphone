import { createAdminClient } from "@/lib/supabase-server";
import { SUBMISSIONS_SELECT_MERCI_MINIMAL } from "@/lib/submissions";
import { isUuid, verifyRachatViewToken } from "@/lib/rachat-view-token";

export type MerciSummaryForContent = {
  brand_name: string;
  model_name: string;
  memory: string;
  condition: string;
  price: number;
  quantity: number;
};

function asString(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return 0;
}

function rowToSummary(row: Record<string, unknown>): MerciSummaryForContent {
  const qtyRaw = asNumber(row.quantity);
  const quantity = qtyRaw >= 1 ? Math.min(999, Math.floor(qtyRaw)) : 1;
  return {
    brand_name: asString(row.brand_name),
    model_name: asString(row.model_name),
    memory: asString(row.memory),
    condition: asString(row.condition),
    price: asNumber(row.price),
    quantity,
  };
}

export async function loadMerciPageSubmission(searchParams: {
  token?: string | null;
  id?: string | null;
}): Promise<MerciSummaryForContent | null> {
  const verified = verifyRachatViewToken(searchParams.token ?? undefined);
  let submissionId: string | null = null;

  if (verified) {
    submissionId = verified.submissionIds[0] ?? null;
  } else if (process.env.NODE_ENV !== "production") {
    const raw = searchParams.id?.trim();
    if (raw && isUuid(raw)) submissionId = raw;
  }

  if (!submissionId) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("submissions")
    .select(SUBMISSIONS_SELECT_MERCI_MINIMAL)
    .eq("id", submissionId)
    .single();

  if (error || !data) return null;

  return rowToSummary(data as Record<string, unknown>);
}
