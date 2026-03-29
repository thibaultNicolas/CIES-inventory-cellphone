import type { Metadata } from "next";
import { Suspense } from "react";
import { getPolitiqueConfidentialiteMetadata } from "@/metadata";
import { PolitiqueContent } from "../../politique-de-confidentialite/PolitiqueContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return getPolitiqueConfidentialiteMetadata(locale === "en" ? "en" : "fr");
}

export default function PolitiqueConfidentialite() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <PolitiqueContent />
    </Suspense>
  );
}
