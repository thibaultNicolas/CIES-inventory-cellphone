import { permanentRedirect } from "next/navigation";

export default async function LocaleRachatRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const valid = locale === "en" ? "en" : "fr";
  permanentRedirect(`/${valid}`);
}
