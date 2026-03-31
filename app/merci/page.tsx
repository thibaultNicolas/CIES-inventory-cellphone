import { Suspense } from "react";
import { loadMerciPageSubmission } from "@/lib/merci-page-data";
import { MerciContent } from "./MerciContent";

type SearchParams = {
  id?: string;
  token?: string;
};

export default async function MerciPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const submission = await loadMerciPageSubmission({
    token: params.token,
    id: params.id,
  });

  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <MerciContent submission={submission} />
    </Suspense>
  );
}
