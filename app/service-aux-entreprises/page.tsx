import type { Metadata } from "next";
import { getBusinessMetadata } from "@/metadata";
import { BusinessServiceContent } from "./BusinessServiceContent";

export const metadata: Metadata = getBusinessMetadata("fr");

export default function BusinessServicePage() {
  return (
    <div className="min-h-screen bg-background pt-6 md:pt-8">
      <main>
        <BusinessServiceContent locale="fr" />
      </main>
    </div>
  );
}
