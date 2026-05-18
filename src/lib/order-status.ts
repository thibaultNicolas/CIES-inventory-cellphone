import type { SubmissionStatus } from "@/lib/submissions";

/** Statuts affichés dans l’admin (demandes de rachat). */
export type OrderStatusUi = "pending" | "paid" | "cancelled";

export const ORDER_STATUS_UI_VALUES: readonly OrderStatusUi[] = [
  "pending",
  "paid",
  "cancelled",
] as const;

export function isOrderStatusUi(value: string): value is OrderStatusUi {
  return ORDER_STATUS_UI_VALUES.includes(value as OrderStatusUi);
}

/** Regroupe `unprocessed` et `label_sent` (legacy) sous « en attente ». */
export function toOrderStatusUi(status: SubmissionStatus): OrderStatusUi {
  if (status === "paid") return "paid";
  if (status === "cancelled") return "cancelled";
  return "pending";
}

export function orderStatusUiToDb(ui: OrderStatusUi): SubmissionStatus {
  switch (ui) {
    case "paid":
      return "paid";
    case "cancelled":
      return "cancelled";
    default:
      return "unprocessed";
  }
}

/** Aligne `commission_paid` avec le statut rachat (Payé / en attente / annulé). */
export function commissionPaidForOrderStatus(
  status: SubmissionStatus,
): boolean | undefined {
  if (status === "paid") return true;
  if (status === "unprocessed" || status === "cancelled") return false;
  return undefined;
}

export function orderMatchesStatusFilter(
  status: SubmissionStatus,
  filter: OrderStatusUi | null,
): boolean {
  if (!filter) return true;
  return toOrderStatusUi(status) === filter;
}

export const ORDER_STATUS_BADGE_CLASS: Record<OrderStatusUi, string> = {
  pending: "border-amber-300 bg-amber-100 text-amber-950",
  paid: "border-emerald-400 bg-emerald-100 text-emerald-950",
  cancelled: "border-red-300 bg-red-100 text-red-900",
};

const ORDERS_STORES_SEP = ",";

export function parseOrdersStoresParam(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(ORDERS_STORES_SEP)
    .map((part) => decodeURIComponent(part.trim()))
    .filter(Boolean);
}

export function serializeOrdersStoresParam(storeNames: string[]): string {
  return storeNames.map((name) => encodeURIComponent(name)).join(ORDERS_STORES_SEP);
}

export function normalizeOverallOrderStatus(
  statuses: ReadonlySet<SubmissionStatus>,
): SubmissionStatus {
  if (statuses.size === 0) return "unprocessed";
  if (statuses.has("cancelled")) return "cancelled";
  if (statuses.has("unprocessed") || statuses.has("label_sent")) return "unprocessed";
  if (statuses.has("paid")) return "paid";
  return "unprocessed";
}
