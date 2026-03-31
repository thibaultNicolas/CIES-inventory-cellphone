import { createAdminClient } from "@/lib/supabase-server";
import type { SubmissionRow } from "@/lib/submissions";
import {
  SUBMISSIONS_SELECT_SUCCESS,
  SUBMISSIONS_SELECT_SUCCESS_SCHEMA_ERROR,
} from "@/lib/submissions";
import { isUuid, verifyRachatViewToken } from "@/lib/rachat-view-token";

const SUBMISSIONS_SELECT_SUCCESS_FALLBACK =
  "id, created_at, brand_name, model_name, memory, condition, price, tracking_number, tracking_url, shipping_label_url";

export type RachatSuccesPageData = {
  submission: SubmissionRow | null;
  groupedSubmissions: SubmissionRow[];
  orderNumber: string;
  requestedTotal: number | null;
};

function parseTotal(raw: string | undefined | null): number | null {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * Charge les soumissions pour la page succès uniquement si le jeton est valide
 * (production) ou en dev si paramètres legacy présents.
 */
export async function loadRachatSuccesPageData(searchParams: {
  token?: string | null;
  id?: string | null;
  ids?: string | null;
  order?: string | null;
  total?: string | null;
}): Promise<RachatSuccesPageData> {
  const empty: RachatSuccesPageData = {
    submission: null,
    groupedSubmissions: [],
    orderNumber: "",
    requestedTotal: parseTotal(searchParams.total ?? null),
  };

  const verified = verifyRachatViewToken(searchParams.token ?? undefined);
  let submissionIds: string[] = [];
  let orderHint: string | null = null;

  if (verified) {
    submissionIds = verified.submissionIds;
    orderHint = verified.requestGroupId;
  } else if (process.env.NODE_ENV !== "production") {
    const idsRaw = searchParams.ids?.trim();
    if (idsRaw) {
      submissionIds = idsRaw
        .split(",")
        .map((s) => s.trim())
        .filter(isUuid);
    } else if (searchParams.id?.trim() && isUuid(searchParams.id.trim())) {
      submissionIds = [searchParams.id.trim()];
    }
    orderHint = searchParams.order?.trim() || null;
  } else {
    return empty;
  }

  if (submissionIds.length === 0) {
    return empty;
  }

  const supabase = createAdminClient();
  let submission: SubmissionRow | null = null;
  let groupedSubmissions: SubmissionRow[] = [];

  const { data, error } = await supabase
    .from("submissions")
    .select(SUBMISSIONS_SELECT_SUCCESS)
    .in("id", submissionIds)
    .order("created_at", { ascending: true });

  if (error && SUBMISSIONS_SELECT_SUCCESS_SCHEMA_ERROR.test(String(error.message))) {
    const fallback = await supabase
      .from("submissions")
      .select(SUBMISSIONS_SELECT_SUCCESS_FALLBACK)
      .in("id", submissionIds)
      .order("created_at", { ascending: true });
    if (!fallback.error && fallback.data?.length) {
      groupedSubmissions = fallback.data as SubmissionRow[];
      submission = groupedSubmissions[0];
    }
  } else if (!error && data?.length) {
    groupedSubmissions = data as SubmissionRow[];
    submission = groupedSubmissions[0];
  }

  const orderNumber = orderHint || submissionIds[0] || "";

  return {
    submission,
    groupedSubmissions,
    orderNumber: String(orderNumber),
    requestedTotal: parseTotal(searchParams.total ?? null),
  };
}
