import { Suspense } from "react";
import type { SubmissionRow } from "@/lib/submissions";
import {
  normalizeSubmissionRow,
  submissionLineTotal,
} from "@/lib/submissions";
import { loadRachatSuccesPageData } from "@/lib/rachat-succes-page-data";
import { SuccesContent } from "@/components/SuccesContent";

type SearchParams = {
  token?: string;
  id?: string;
  ids?: string;
  order?: string;
  total?: string;
};

export default async function SuccesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const {
    submission,
    groupedSubmissions,
    orderNumber,
    requestedTotal,
  } = await loadRachatSuccesPageData({
    token: sp.token,
    id: sp.id,
    ids: sp.ids,
    order: sp.order,
    total: sp.total,
  });

  const s = submission ? normalizeSubmissionRow(submission as SubmissionRow) : null;
  const groupedSummary =
    groupedSubmissions.length > 0
      ? normalizeSubmissionRow(groupedSubmissions[0] as SubmissionRow)
      : null;
  const shippingSummary = groupedSummary ?? s;
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
          const normalized = normalizeSubmissionRow(row as SubmissionRow);
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
        locale="fr"
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
        trackingNumber={shippingSummary?.tracking_number ?? null}
        trackingUrl={shippingSummary?.tracking_url ?? null}
        contactSummary={contactSummary}
        orderItems={orderItems}
      />
    </Suspense>
  );
}
