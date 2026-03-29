import { Suspense } from "react";
import { createAdminClient } from "@/lib/supabase-server";
import type { Locale } from "@/lib/i18n";
import type { SubmissionRow } from "@/lib/submissions";
import {
  normalizeSubmissionRow,
  submissionLineTotal,
  SUBMISSIONS_SELECT_SUCCESS,
  SUBMISSIONS_SELECT_SUCCESS_SCHEMA_ERROR,
} from "@/lib/submissions";
import { SuccesContent } from "@/components/SuccesContent";

type SearchParams = {
  id?: string;
  ids?: string;
  order?: string;
  total?: string;
};

const SUBMISSIONS_SELECT_SUCCESS_FALLBACK =
  "id, created_at, brand_name, model_name, memory, condition, price, tracking_number, tracking_url, shipping_label_url";

export default async function SuccesPage({
  searchParams,
  params,
}: {
  searchParams: Promise<SearchParams>;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale: Locale = (locale === "fr" || locale === "en") ? locale : "fr";
  const searchParamsData = await searchParams;
  const submissionId = searchParamsData.id;
  const submissionIds =
    typeof searchParamsData.ids === "string" && searchParamsData.ids.trim() !== ""
      ? searchParamsData.ids
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean)
      : [];
  const orderNumber = searchParamsData.order || submissionId || "";
  const requestedTotal = searchParamsData.total
    ? Number(searchParamsData.total)
    : null;

  const supabase = createAdminClient();
  let submission = null;
  let groupedSubmissions: SubmissionRow[] = [];

  if (submissionIds.length > 0) {
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
  } else if (submissionId) {
    const { data, error } = await supabase
      .from("submissions")
      .select(SUBMISSIONS_SELECT_SUCCESS)
      .eq("id", submissionId)
      .single();

    if (error && SUBMISSIONS_SELECT_SUCCESS_SCHEMA_ERROR.test(String(error.message))) {
      const fallback = await supabase
        .from("submissions")
        .select(SUBMISSIONS_SELECT_SUCCESS_FALLBACK)
        .eq("id", submissionId)
        .single();
      submission = fallback.data;
    } else {
      submission = data;
    }

    if (orderNumber) {
      const { data: groupedData, error: groupedError } = await supabase
        .from("submissions")
        .select(SUBMISSIONS_SELECT_SUCCESS)
        .eq("request_group_id", orderNumber)
        .order("created_at", { ascending: true });

      if (groupedError && SUBMISSIONS_SELECT_SUCCESS_SCHEMA_ERROR.test(String(groupedError.message))) {
        const fallbackGrouped = await supabase
          .from("submissions")
          .select(SUBMISSIONS_SELECT_SUCCESS_FALLBACK)
          .eq("request_group_id", orderNumber)
          .order("created_at", { ascending: true });
        if (!fallbackGrouped.error && fallbackGrouped.data?.length) {
          groupedSubmissions = fallbackGrouped.data as SubmissionRow[];
        }
      } else if (!groupedError && groupedData?.length) {
        groupedSubmissions = groupedData as SubmissionRow[];
      }
    }
  }

  const s = submission ? normalizeSubmissionRow(submission as SubmissionRow) : null;
  const groupedSummary =
    groupedSubmissions.length > 0
      ? normalizeSubmissionRow(groupedSubmissions[0])
      : null;
  const shippingSummary = groupedSummary ?? s;
  const withInsurance = groupedSummary?.with_insurance ?? s?.with_insurance ?? false;
  const insuranceFee = groupedSummary?.insurance_fee ?? s?.insurance_fee ?? 0;
  const contactSummary = shippingSummary
    ? {
        employee_full_name: shippingSummary.employee_full_name,
        client_full_name: shippingSummary.client_full_name,
        customer_phone: shippingSummary.customer_phone,
        client_city: shippingSummary.client_city,
        device_imei: shippingSummary.device_imei,
        customer_email: shippingSummary.customer_email,
      }
    : null;
  const orderItems =
    groupedSubmissions.length > 0
      ? groupedSubmissions.map((row) => {
          const normalized = normalizeSubmissionRow(row);
          return {
            brand_name: normalized.brand_name,
            model_name: normalized.model_name,
            memory: normalized.memory,
            condition: normalized.condition,
            price: normalized.price,
            quantity: normalized.quantity,
          };
        })
      : s
        ? [
            {
              brand_name: s.brand_name,
              model_name: s.model_name,
              memory: s.memory,
              condition: s.condition,
              price: s.price,
              quantity: s.quantity,
            },
          ]
        : [];

  const computedTotal = orderItems.reduce(
    (total, item) => total + submissionLineTotal(item.price, item.quantity),
    0,
  );

  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <SuccesContent
        locale={validLocale}
        orderNumber={orderNumber}
        submittedAt={s?.created_at || null}
        totalPayout={
          requestedTotal ??
          (orderItems.length > 0
            ? computedTotal
            : s
              ? submissionLineTotal(s.price, s.quantity)
              : null)
        }
        withInsurance={withInsurance}
        insuranceFee={insuranceFee}
        trackingNumber={shippingSummary?.tracking_number ?? null}
        trackingUrl={shippingSummary?.tracking_url ?? null}
        contactSummary={contactSummary}
        orderItems={orderItems}
      />
    </Suspense>
  );
}
