import type { Metadata } from "next";
import { getRachatMetadata } from "@/metadata";
import type { Locale } from "@/lib/i18n";
import { RachatPageContent } from "../rachat/RachatPageContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return getRachatMetadata(locale === "en" ? "en" : "fr");
}

export default async function LocaleHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale: Locale = locale === "en" ? "en" : "fr";

  return <RachatPageContent locale={validLocale} />;
}
