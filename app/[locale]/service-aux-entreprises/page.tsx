import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n";
import { getBusinessMetadata } from "@/metadata";
import { BusinessServiceContent } from "../../service-aux-entreprises/BusinessServiceContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return getBusinessMetadata(locale === "en" ? "en" : "fr");
}

export default async function BusinessServiceLocalePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale: Locale = locale === "en" ? "en" : "fr";

  return (
    <div className="min-h-screen bg-background pt-6 md:pt-8">
      <main>
        <BusinessServiceContent locale={validLocale} />
      </main>
    </div>
  );
}
