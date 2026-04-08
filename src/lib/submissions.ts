export type SubmissionStatus = "unprocessed" | "label_sent" | "paid" | "cancelled";

export type SubmissionNormalized = {
  id: string;
  request_group_id?: string | null;
  created_at: string;
  status: SubmissionStatus;
  brand_name: string;
  model_name: string;
  memory: string;
  condition: string;
  price: number;
  /** Nombre d'unités (prix unitaire dans `price`). Défaut 1 si absent en base. */
  quantity: number;
  /** Nom complet de l’employé (magasin). */
  employee_full_name: string;
  store_name: string;
  /** Nom complet du client final. */
  client_full_name: string;
  client_account_number: string;
  /** Ville (client / transaction). */
  client_city: string;
  /** IMEI de l’appareil. */
  device_imei: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  device_photos: string[];
  brand_id?: string | null;
  model_id?: string | null;
  /** ClickShip/Freightcom shipment id (for retries/support) */
  clickship_shipment_id?: string | null;
  /** Carrier tracking number */
  tracking_number?: string | null;
  /** Carrier tracking page URL */
  tracking_url?: string | null;
  /** Public URL of the carrier shipping label PDF (e.g. Supabase Storage) */
  shipping_label_url?: string | null;
  /** Label state: not_requested | pending | ready | failed */
  shipping_label_status?: string | null;
  /** Last label error (if any) */
  shipping_label_error?: string | null;
  /** True when your commission for this order has been paid */
  commission_paid: boolean;
  commission_employee: number;
  commission_manager: number;
  commission_owner: number;
  /** Previous price before last override (if any) */
  price_override_previous?: number | null;
  /** Reason for price override (if any) */
  price_override_reason?: string | null;
  /** Last override timestamp (if any) */
  price_override_updated_at?: string | null;
  /** Admin identifier who last overrode price (if any) */
  price_override_updated_by?: string | null;
};

/**
 * Minimal representation of a `public.submissions` row as returned by PostgREST.
 * Notes:
 * - `numeric` fields may be returned as strings (PostgREST default).
 * - Some fields can still be NULL (e.g. `price`) depending on your business rules.
 */
export type SubmissionRow = {
  id: string;
  request_group_id?: string | null;
  created_at: string;
  status: SubmissionStatus | null;
  brand_id: string | null;
  model_id: string | null;
  brand_name: string | null;
  model_name: string | null;
  memory: string | null;
  condition: string | null;
  price: number | string | null;
  quantity?: number | string | null;
  employee_full_name?: string | null;
  store_name?: string | null;
  client_full_name?: string | null;
  client_account_number?: string | null;
  client_city?: string | null;
  device_imei?: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  device_photos: string[] | null;
  clickship_shipment_id?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
  shipping_label_url?: string | null;
  shipping_label_status?: string | null;
  shipping_label_error?: string | null;
  commission_paid?: boolean | null;
  commission_employee?: number | string | null;
  commission_manager?: number | string | null;
  commission_owner?: number | string | null;
  price_override_previous?: number | string | null;
  price_override_reason?: string | null;
  price_override_updated_at?: string | null;
  price_override_updated_by?: string | null;
};

// Canonical `submissions` column lists to avoid `.select("*")`.
// Keep these in sync with the DB schema.
export const SUBMISSIONS_SELECT_ADMIN_LIST =
  "id, request_group_id, created_at, status, brand_name, model_name, memory, condition, price, quantity, employee_full_name, store_name, client_full_name, client_account_number, client_city, device_imei, customer_name, customer_email, customer_phone, customer_address, clickship_shipment_id, tracking_number, tracking_url, shipping_label_url, shipping_label_status, shipping_label_error, commission_paid, commission_employee, commission_manager, commission_owner, price_override_previous, price_override_reason, price_override_updated_at, price_override_updated_by";

export const SUBMISSIONS_SELECT_SUMMARY =
  "id, created_at, brand_name, model_name, memory, condition, price, quantity, employee_full_name, store_name, client_full_name, client_account_number, client_city, device_imei, customer_name, customer_phone, customer_address";

/** Page merci : uniquement le récap affiché (pas de PII en base si possible). */
export const SUBMISSIONS_SELECT_MERCI_MINIMAL =
  "id, brand_name, model_name, memory, condition, price, quantity";

/** Summary + shipping fields for confirmation/success page */
export const SUBMISSIONS_SELECT_SUCCESS =
  "id, created_at, brand_name, model_name, memory, condition, price, quantity, employee_full_name, store_name, client_full_name, client_account_number, client_city, device_imei, customer_email, clickship_shipment_id, tracking_number, tracking_url, shipping_label_url, shipping_label_status, shipping_label_error";

/** When PostgREST rejects `SUBMISSIONS_SELECT_SUCCESS`, retry with `SUBMISSIONS_SELECT_SUCCESS_FALLBACK`. */
export const SUBMISSIONS_SELECT_SUCCESS_SCHEMA_ERROR =
  /request_group_id|quantity|employee_full_name|store_name|client_full_name|client_account_number|client_city|device_imei|clickship_shipment_id|shipping_label_status|shipping_label_error|column.*does not exist/i;

export const SUBMISSIONS_SELECT_PDF =
  "id, created_at, brand_name, model_name, memory, condition, price, quantity, employee_full_name, store_name, client_full_name, client_account_number, client_city, device_imei, customer_name, customer_email, customer_phone, customer_address";

export const SUBMISSIONS_SELECT_CANONICAL =
  "id, created_at, status, brand_id, model_id, brand_name, model_name, memory, condition, price, quantity, employee_full_name, store_name, client_full_name, client_account_number, client_city, device_imei, customer_name, customer_email, customer_phone, customer_address, device_photos";

/** Total pour une ligne (prix unitaire × quantité). */
export function submissionLineTotal(
  unitPrice: number,
  quantity: number | null | undefined,
): number {
  const raw =
    typeof quantity === "number" && Number.isFinite(quantity)
      ? Math.floor(quantity)
      : 1;
  const q = raw >= 1 ? Math.min(999, raw) : 1;
  return unitPrice * q;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return 0;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => asString(v)).filter(Boolean);
  }
  return [];
}

function toSubmissionStatus(value: unknown): SubmissionStatus {
  const v = asString(value).toLowerCase();
  if (v === "unprocessed" || v === "label_sent" || v === "paid" || v === "cancelled") return v;
  // Legacy values (older deployments)
  if (v === "pending") return "unprocessed";
  if (v === "received" || v === "inspected") return "label_sent";
  return "unprocessed";
}

/**
 * Normalize a `submissions` row (canonical schema).
 * We keep light coercion (string/number/array) but no legacy fallbacks.
 */
export function normalizeSubmissionRow(row: SubmissionRow): SubmissionNormalized {
  const id = asString(row.id);
  const request_group_id = asString(row.request_group_id) || null;
  const created_at = asString(row.created_at) || new Date().toISOString();
  const status = toSubmissionStatus(row.status);

  const brand_name = asString(row.brand_name);
  const model_name = asString(row.model_name);
  const memory = asString(row.memory);
  const condition = asString(row.condition);
  const price = asNumber(row.price);
  const qtyRaw = asNumber(row.quantity);
  const quantity = qtyRaw >= 1 ? Math.min(999, Math.floor(qtyRaw)) : 1;

  const employee_full_name = asString(row.employee_full_name);
  const store_name = asString(row.store_name);
  const client_full_name =
    asString(row.client_full_name) || asString(row.customer_name);
  const client_account_number = asString(row.client_account_number);
  const client_city =
    asString(row.client_city) || asString(row.customer_address);
  const device_imei = asString(row.device_imei);

  const customer_name = asString(row.customer_name);
  const customer_email = asString(row.customer_email);
  const customer_phone = asString(row.customer_phone);
  const customer_address = asString(row.customer_address);

  const device_photos = asStringArray(row.device_photos);

  const brand_id = asString(row.brand_id) || null;
  const model_id = asString(row.model_id) || null;

  const clickship_shipment_id = asString(row.clickship_shipment_id) || null;
  const tracking_number = asString(row.tracking_number) || null;
  const tracking_url = asString(row.tracking_url) || null;
  const shipping_label_url = asString(row.shipping_label_url) || null;
  const shipping_label_status = asString(row.shipping_label_status) || null;
  const shipping_label_error = asString(row.shipping_label_error) || null;

  const commission_paid = row.commission_paid === true;

  return {
    id,
    request_group_id,
    created_at,
    status,
    brand_name,
    model_name,
    memory,
    condition,
    price,
    quantity,
    employee_full_name,
    store_name,
    client_full_name,
    client_account_number,
    client_city,
    device_imei,
    customer_name,
    customer_email,
    customer_phone,
    customer_address,
    device_photos,
    brand_id,
    model_id,
    clickship_shipment_id,
    tracking_number,
    tracking_url,
    shipping_label_url,
    shipping_label_status,
    shipping_label_error,
    commission_paid,
    commission_employee: asNumber(row.commission_employee),
    commission_manager: asNumber(row.commission_manager),
    commission_owner: asNumber(row.commission_owner),
    price_override_previous:
      row.price_override_previous == null ? null : asNumber(row.price_override_previous),
    price_override_reason: asString(row.price_override_reason) || null,
    price_override_updated_at: asString(row.price_override_updated_at) || null,
    price_override_updated_by: asString(row.price_override_updated_by) || null,
  };
}
