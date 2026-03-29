import type { Metadata } from "next";
import { getContactMetadata } from "@/metadata";
import { ContactContent } from "./ContactContent";

export const metadata: Metadata = getContactMetadata("fr");

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background pt-6 md:pt-8">
      <main>
        <ContactContent />
      </main>
    </div>
  );
}
