import { Suspense } from "react";
import type { Locale } from "@/lib/i18n";
import { loadMerciPageSubmission } from "@/lib/merci-page-data";
import { MerciContent } from "./MerciContent";

type SearchParams = {
  id?: string;
  token?: string;
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
  const submission = await loadMerciPageSubmission({
    token: searchParamsData.token,
    id: searchParamsData.id,
  });

  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <MerciContent locale={validLocale} submission={submission} />
    </Suspense>
  );
}
