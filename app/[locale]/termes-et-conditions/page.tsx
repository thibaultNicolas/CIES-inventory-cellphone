import type { Metadata } from "next";
import { Suspense } from "react";
import { getTermesEtConditionsMetadata } from "@/metadata";
import { TermesContent } from "../../termes-et-conditions/TermesContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return getTermesEtConditionsMetadata(locale === "en" ? "en" : "fr");
}

export default function TermesEtConditions() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <TermesContent />
    </Suspense>
  );
}
