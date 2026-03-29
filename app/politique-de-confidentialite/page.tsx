import type { Metadata } from "next";
import { getPolitiqueConfidentialiteMetadata } from "@/metadata";
import { PolitiqueContent } from "./PolitiqueContent";

export const metadata: Metadata = getPolitiqueConfidentialiteMetadata();

export default function PolitiqueConfidentialite() {
  return <PolitiqueContent />;
}
