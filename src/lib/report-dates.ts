/** Fuseau pour les rapports admin (dates d’achat / ventes par mois). */
export const REPORT_TIME_ZONE = "America/Toronto";

function localOffsetMinutesAt(utcDate: Date, timeZone: string): number {
  const asUtc = new Date(utcDate.toLocaleString("en-US", { timeZone: "UTC" }));
  const asTarget = new Date(utcDate.toLocaleString("en-US", { timeZone }));
  return (asTarget.getTime() - asUtc.getTime()) / 60_000;
}

function parseReportDateInput(dateStr: string): { y: number; m: number; d: number } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return null;
  return { y, m, d };
}

/** Début de journée locale (fuseau rapport) en ISO UTC pour filtre `created_at` (gte). */
export function reportDayStartIso(dateStr: string, timeZone = REPORT_TIME_ZONE): string {
  const p = parseReportDateInput(dateStr);
  if (!p) return `${dateStr}T00:00:00.000Z`;
  const refUtc = Date.UTC(p.y, p.m - 1, p.d, 12, 0, 0);
  const offsetMin = localOffsetMinutesAt(new Date(refUtc), timeZone);
  return new Date(Date.UTC(p.y, p.m - 1, p.d, 0, 0, 0, 0) - offsetMin * 60_000).toISOString();
}

/** Fin de journée locale (fuseau rapport) en ISO UTC pour filtre `created_at` (lte). */
export function reportDayEndIso(dateStr: string, timeZone = REPORT_TIME_ZONE): string {
  const p = parseReportDateInput(dateStr);
  if (!p) return `${dateStr}T23:59:59.999Z`;
  const refUtc = Date.UTC(p.y, p.m - 1, p.d, 12, 0, 0);
  const offsetMin = localOffsetMinutesAt(new Date(refUtc), timeZone);
  return new Date(Date.UTC(p.y, p.m - 1, p.d, 23, 59, 59, 999) - offsetMin * 60_000).toISOString();
}

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
