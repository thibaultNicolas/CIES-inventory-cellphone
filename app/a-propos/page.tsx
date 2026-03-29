import type { Metadata } from "next";
import { getAboutMetadata } from "@/metadata";
import { AboutContent } from "./AboutContent";

export const metadata: Metadata = getAboutMetadata("fr");

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background pt-6 md:pt-8">
      <main>
        <AboutContent />
      </main>
    </div>
  );
}
