import type { SubmissionStatus } from "@/lib/submissions";

/** Statuts affichés dans l’admin (demandes de rachat). */
export type OrderStatusUi = "pending" | "paid" | "cancelled";

export const ORDER_STATUS_UI_VALUES: readonly OrderStatusUi[] = [
  "pending",
  "paid",
  "cancelled",
] as const;

export type OrderPaymentLine = {
  status: SubmissionStatus;
  commission_paid: boolean;
};

export function isOrderStatusUi(value: string): value is OrderStatusUi {
  return ORDER_STATUS_UI_VALUES.includes(value as OrderStatusUi);
}

/**
 * Statut de paiement affiché : une seule source — `commission_paid` (hors annulé).
 */
export function toOrderStatusUi(line: OrderPaymentLine): OrderStatusUi {
  if (line.status === "cancelled") return "cancelled";
  if (line.commission_paid) return "paid";
  return "pending";
}

/** @deprecated Préférer `toOrderStatusUi` avec `commission_paid`. */
export function toOrderStatusUiFromDbStatus(status: SubmissionStatus): OrderStatusUi {
  return toOrderStatusUi({
    status,
    commission_paid: status === "paid",
  });
}

export function orderStatusUiToDb(ui: OrderStatusUi): SubmissionStatus {
  return buildPaymentUpdateFromOrderUi(ui).status;
}

/** Payload DB aligné sur « commission payée » = demande soldée. */
export function buildPaymentUpdateFromOrderUi(ui: OrderStatusUi): {
  status: SubmissionStatus;
  commission_paid: boolean;
} {
  switch (ui) {
    case "paid":
      return { status: "paid", commission_paid: true };
    case "cancelled":
      return { status: "cancelled", commission_paid: false };
    default:
      return { status: "unprocessed", commission_paid: false };
  }
}

export function buildPaymentUpdateFromCommissionPaid(commissionPaid: boolean): {
  status: SubmissionStatus;
  commission_paid: boolean;
} {
  return commissionPaid
    ? { status: "paid", commission_paid: true }
    : { status: "unprocessed", commission_paid: false };
}

/** Statut agrégé d’une commande (plusieurs lignes). */
export function normalizeOverallOrderPaymentStatus(
  lines: ReadonlyArray<OrderPaymentLine>,
): OrderStatusUi {
  if (lines.length === 0) return "pending";
  if (lines.some((l) => l.status === "cancelled")) return "cancelled";
  if (lines.every((l) => l.commission_paid && l.status !== "cancelled")) return "paid";
  return "pending";
}

export function orderMatchesStatusFilter(
  paymentStatus: OrderStatusUi,
  filter: OrderStatusUi | null,
): boolean {
  if (!filter) return true;
  return paymentStatus === filter;
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

/** @deprecated Utiliser `normalizeOverallOrderPaymentStatus`. */
export function normalizeOverallOrderStatus(
  statuses: ReadonlySet<SubmissionStatus>,
): SubmissionStatus {
  const lines = Array.from(statuses).map((status) => ({
    status,
    commission_paid: status === "paid",
  }));
  const ui = normalizeOverallOrderPaymentStatus(lines);
  if (ui === "cancelled") return "cancelled";
  if (ui === "paid") return "paid";
  return "unprocessed";
}
