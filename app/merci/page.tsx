import { Suspense } from "react";
import { createAdminClient } from "@/lib/supabase-server";
import type { SubmissionRow } from "@/lib/submissions";
import { normalizeSubmissionRow, SUBMISSIONS_SELECT_SUMMARY } from "@/lib/submissions";
import { MerciContent } from "./MerciContent";

type SearchParams = {
  id?: string;
};

export default async function MerciPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const submissionId = params.id;

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

  const submissionSummary = submission ? normalizeSubmissionRow(submission as SubmissionRow) : null;

  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <MerciContent submission={submissionSummary} />
    </Suspense>
  );
}
