import type { Metadata } from "next";
import { getContactMetadata } from "@/metadata";
import { ContactContent } from "../../contact/ContactContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return getContactMetadata(locale === "en" ? "en" : "fr");
}

export default async function ContactLocalePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;

  return (
    <div className="min-h-screen bg-background pt-6 md:pt-8">
      <main>
        <ContactContent />
      </main>
    </div>
  );
}
