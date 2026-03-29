import { Suspense } from "react";
import { createAdminClient } from "@/lib/supabase-server";
import type { Locale } from "@/lib/i18n";
import type { SubmissionRow } from "@/lib/submissions";
import { normalizeSubmissionRow, SUBMISSIONS_SELECT_SUMMARY } from "@/lib/submissions";
import { MerciContent } from "./MerciContent";

type SearchParams = {
  id?: string;
};

export default async function MerciPage({
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

  let submission = null;
  if (submissionId) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("submissions")
      .select(SUBMISSIONS_SELECT_SUMMARY)
      .eq("id", submissionId)
      .single();

    submission = data;
  }

  const s = submission ? normalizeSubmissionRow(submission as SubmissionRow) : null;

  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <MerciContent
        locale={validLocale}
        submission={
          s
            ? {
                brand_name: s.brand_name,
                model_name: s.model_name,
                memory: s.memory,
                condition: s.condition,
                price: s.price,
                quantity: s.quantity,
              }
            : null
        }
      />
    </Suspense>
  );
}
