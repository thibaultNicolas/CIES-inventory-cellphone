import type { Metadata } from "next";
import { getAboutMetadata } from "@/metadata";
import { AboutContent } from "../../a-propos/AboutContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return getAboutMetadata(locale === "en" ? "en" : "fr");
}

export default async function AboutLocalePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;

  return (
    <div className="min-h-screen bg-background pt-6 md:pt-8">
      <main>
        <AboutContent />
      </main>
    </div>
  );
}
