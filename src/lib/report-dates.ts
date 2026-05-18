/** Fuseau pour les rapports admin (dates d’achat / ventes par mois). */
export const REPORT_TIME_ZONE = "America/Toronto";

/** Clé `YYYY-MM` du mois d’achat selon le fuseau métier. */
export function submissionMonthKey(iso: string, timeZone = REPORT_TIME_ZONE): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date(iso));
  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  return `${year}-${month}`;
}

/** Libellé court du mois à partir d’une clé `YYYY-MM`. */
export function formatReportMonthLabel(
  monthKey: string,
  locale: string,
  timeZone = REPORT_TIME_ZONE,
): string {
  const [y, m] = monthKey.split("-").map(Number);
  if (!y || !m) return monthKey;
  return new Intl.DateTimeFormat(locale === "en" ? "en-CA" : "fr-CA", {
    month: "short",
    year: "numeric",
    timeZone,
  }).format(new Date(Date.UTC(y, m - 1, 15, 12, 0, 0)));
}
