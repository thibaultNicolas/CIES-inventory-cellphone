import type { Metadata } from "next";
import { getRachatMetadata } from "@/metadata";
import { RachatPageContent } from "./rachat/RachatPageContent";

export const metadata: Metadata = getRachatMetadata("fr");

export default async function Home() {
  return <RachatPageContent locale="fr" />;
}
