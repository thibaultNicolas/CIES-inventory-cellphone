import "server-only";

import { createAdminClient } from "@/lib/supabase-server";

export type ClickShipLabelStatus = "not_requested" | "pending" | "ready" | "failed";

class ClickShipApiError extends Error {
  status: number;
  path: string;
  json: unknown;
  text: string;

  constructor(params: { status: number; path: string; message: string; json: unknown; text: string }) {
    super(params.message);
    this.name = "ClickShipApiError";
    this.status = params.status;
    this.path = params.path;
    this.json = params.json;
    this.text = params.text;
  }
}

type ClickShipConfig = {
  apiUrl: string;
  apiKey: string;
  apiKeyHeader: string;
  paymentMethodId: string;
  serviceId: string;
  origin: {
    name: string;
    contact: string;
    phone: string;
    email: string;
    address1: string;
    address2: string;
    city: string;
    region: string;
    postal: string;
    country: string;
  };
};

type ParsedAddress = {
  address_line_1: string;
  address_line_2?: string;
  city: string;
  region: string;
  postal_code: string;
  country: string;
};

type CreateOrderParams = {
  uniqueId: string;
  orderReference?: string;
  devicesCount: number;
  customer: {
    name: string;
    email: string;
    phone: string;
    formattedAddress: string;
  };
};

export type ClickShipOrderResult = {
  shipmentId: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
};

const CANADIAN_PROVINCES = new Set([
  "AB",
  "BC",
  "MB",
  "NB",
  "NL",
  "NS",
  "NT",
  "NU",
  "ON",
  "PE",
  "QC",
  "SK",
  "YT",
]);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function getClickShipConfig(): ClickShipConfig | null {
  const apiUrl = process.env.CLICKSHIP_API_URL?.trim();
  const apiKey = process.env.CLICKSHIP_API_KEY?.trim();
  const apiKeyHeader = (process.env.CLICKSHIP_API_KEY_HEADER || "Authorization").trim();
  const paymentMethodId = process.env.CLICKSHIP_PAYMENT_METHOD_ID?.trim();
  const serviceId = process.env.CLICKSHIP_SERVICE_ID?.trim();

  const origin = {
    name: process.env.CLICKSHIP_ORIGIN_NAME?.trim() || "",
    contact: process.env.CLICKSHIP_ORIGIN_CONTACT?.trim() || "",
    phone: process.env.CLICKSHIP_ORIGIN_PHONE?.trim() || "",
    email: process.env.CLICKSHIP_ORIGIN_EMAIL?.trim() || "",
    address1: process.env.CLICKSHIP_ORIGIN_ADDRESS1?.trim() || "",
    address2: process.env.CLICKSHIP_ORIGIN_ADDRESS2?.trim() || "",
    city: process.env.CLICKSHIP_ORIGIN_CITY?.trim() || "",
    region: process.env.CLICKSHIP_ORIGIN_REGION?.trim() || "",
    postal: process.env.CLICKSHIP_ORIGIN_POSTAL?.trim() || "",
    country: process.env.CLICKSHIP_ORIGIN_COUNTRY?.trim() || "CA",
  };

  const hasAll =
    isNonEmptyString(apiUrl) &&
    isNonEmptyString(apiKey) &&
    isNonEmptyString(apiKeyHeader) &&
    isNonEmptyString(paymentMethodId) &&
    isNonEmptyString(serviceId) &&
    isNonEmptyString(origin.name) &&
    isNonEmptyString(origin.contact) &&
    isNonEmptyString(origin.phone) &&
    isNonEmptyString(origin.email) &&
    isNonEmptyString(origin.address1) &&
    isNonEmptyString(origin.city) &&
    isNonEmptyString(origin.region) &&
    isNonEmptyString(origin.postal) &&
    isNonEmptyString(origin.country);

  if (!hasAll) return null;

  return {
    apiUrl: apiUrl.replace(/\/+$/, ""),
    apiKey,
    apiKeyHeader,
    paymentMethodId,
    serviceId,
    origin,
  };
}

export function getClickShipConfigStatus(): { enabled: boolean; canadaOnly: boolean } {
  const enabled = Boolean(getClickShipConfig());
  const canadaOnly = (process.env.CLICKSHIP_CANADA_ONLY || "true").trim().toLowerCase() !== "false";
  return { enabled, canadaOnly };
}

function normalizePhoneNumber(raw: string): string {
  const digits = raw.replace(/[^\d]/g, "");
  // ClickShip expects only digits; keep last 15 digits if longer.
  if (digits.length > 15) return digits.slice(-15);
  return digits;
}

function normalizePostalCode(raw: string): string {
  const value = raw.trim().toUpperCase();
  // Canadian postal code: A1A 1A1
  const m = value.match(/[A-Z]\d[A-Z]\s?\d[A-Z]\d/);
  if (!m) return value;
  const compact = m[0].replace(/\s+/g, "");
  return `${compact.slice(0, 3)} ${compact.slice(3)}`;
}

function parseCanadianAddress(formattedAddress: string): ParsedAddress | null {
  const normalized = formattedAddress.replace(/\n/g, ",").trim();
  const parts = normalized
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length < 2) return null;

  const joined = parts.join(" ");
  const postalMatch = joined.toUpperCase().match(/[A-Z]\d[A-Z]\s?\d[A-Z]\d/);
  if (!postalMatch) return null;
  const postal = normalizePostalCode(postalMatch[0]);

  // Find a province code anywhere in the string. Do NOT take the first 2-letter token
  // because French addresses often contain "du", "de", etc. (e.g. "Rue du ...").
  const upper = joined.toUpperCase();
  const regionCandidates = Array.from(upper.matchAll(/\b([A-Z]{2})\b/g)).map((m) => m[1]);
  const region = regionCandidates.find((code) => code && CANADIAN_PROVINCES.has(code)) || null;
  if (!region) return null;

  const country = /canada|\bca\b/i.test(parts[parts.length - 1] || "") ? "CA" : "CA";

  // Heuristic for address layout: "<addr1>, <city>, <region> <postal>[, Canada]"
  const addressLine1 = parts[0];
  const city = parts.length >= 2 ? parts[1] : "";
  if (!isNonEmptyString(addressLine1) || !isNonEmptyString(city)) return null;

  return {
    address_line_1: addressLine1,
    city,
    region,
    country,
    postal_code: postal,
  };
}

export function parseCanadianAddressForClickShip(formattedAddress: string): ParsedAddress | null {
  return parseCanadianAddress(formattedAddress);
}

function toJsonDate(date: Date): { year: number; month: number; day: number } {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function parseEnvCsv(value: string | undefined): string[] {
  return (value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function fetchClickShipServices(config: ClickShipConfig): Promise<
  Array<{ id: string; carrier_name?: string; service_name?: string }>
> {
  const { json } = await clickShipFetchJson<Array<{ id?: unknown; carrier_name?: unknown; service_name?: unknown }>>(
    config,
    "/services",
    { method: "GET" },
  );
  return Array.isArray(json)
    ? json
        .map((s) => ({
          id: typeof s?.id === "string" ? s.id : "",
          carrier_name: typeof s?.carrier_name === "string" ? s.carrier_name : undefined,
          service_name: typeof s?.service_name === "string" ? s.service_name : undefined,
        }))
        .filter((s) => s.id.trim().length > 0)
    : [];
}

async function resolveClickShipServiceIdsForRating(config: ClickShipConfig): Promise<string[]> {
  const explicitServiceIds = parseEnvCsv(process.env.CLICKSHIP_SERVICE_IDS);
  if (explicitServiceIds.length > 0) return Array.from(new Set(explicitServiceIds));

  const carrierAllowlist = parseEnvCsv(process.env.CLICKSHIP_CARRIERS_ALLOWLIST).map((s) => s.toLowerCase());
  if (carrierAllowlist.length === 0) return [config.serviceId];

  const services = await fetchClickShipServices(config);
  const candidates = services
    .filter((s) => {
      const carrierName = (s.carrier_name || "").toLowerCase();
      const id = s.id.toLowerCase();
      return carrierAllowlist.some((k) => carrierName.includes(k) || id.startsWith(k));
    })
    .map((s) => s.id);

  return candidates.length > 0 ? Array.from(new Set(candidates)) : [config.serviceId];
}

type ClickShipMoney = { currency?: string; value?: string };
type ClickShipRate = {
  carrier_name?: string;
  service_name?: string;
  service_id?: string;
  total?: ClickShipMoney;
};

function moneyToCents(m: ClickShipMoney | undefined): number | null {
  const raw = typeof m?.value === "string" ? m.value.trim() : "";
  if (!raw || !/^\d+$/.test(raw)) return null;
  const cents = Number(raw);
  return Number.isFinite(cents) ? cents : null;
}

async function requestClickShipRateId(params: {
  config: ClickShipConfig;
  details: unknown;
  services: string[];
}): Promise<string> {
  const { json } = await clickShipFetchJson<{ request_id?: string }>(params.config, "/rate", {
    method: "POST",
    body: JSON.stringify({
      services: params.services,
      details: params.details,
    }),
  });
  const requestId = typeof json?.request_id === "string" && json.request_id.trim() ? json.request_id.trim() : null;
  if (!requestId) throw new Error("ClickShip rate request succeeded but request_id is missing");
  return requestId;
}

async function pollClickShipRates(params: {
  config: ClickShipConfig;
  rateId: string;
  maxWaitMs: number;
}): Promise<ClickShipRate[]> {
  const startedAt = Date.now();
  let attempt = 0;

  while (Date.now() - startedAt < params.maxWaitMs) {
    attempt += 1;
    const { json } = await clickShipFetchJson<{
      status?: { done?: boolean; total?: number; complete?: number };
      rates?: ClickShipRate[];
    }>(params.config, `/rate/${encodeURIComponent(params.rateId)}`, { method: "GET" });

    const done = Boolean(json?.status?.done);
    const rates = Array.isArray(json?.rates) ? json.rates : [];
    if (done) return rates;

    const waitMs = Math.min(4000, 500 + attempt * 350);
    await new Promise((r) => setTimeout(r, waitMs));
  }

  return [];
}

async function clickShipFetchJson<T>(
  config: ClickShipConfig,
  path: string,
  init?: RequestInit,
): Promise<{ status: number; json: T }> {
  const url = `${config.apiUrl}${path.startsWith("/") ? "" : "/"}${path}`;
  const headers = new Headers(init?.headers || {});
  headers.set("Accept", "application/json");
  headers.set("Content-Type", "application/json");
  headers.set(config.apiKeyHeader, config.apiKey);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  try {
    const res = await fetch(url, {
      ...init,
      headers,
      signal: controller.signal,
    });
    const status = res.status;
    const text = await res.text();
    let json: unknown = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    if (!res.ok) {
      const jsonObject =
        json && typeof json === "object" ? (json as Record<string, unknown>) : null;
      const messageFromJson =
        jsonObject && typeof jsonObject.message === "string" ? jsonObject.message : null;
      const dataFromJson = jsonObject && "data" in jsonObject ? (jsonObject as { data?: unknown }).data : null;
      const details =
        dataFromJson && typeof dataFromJson === "object" ? ` (data: ${JSON.stringify(dataFromJson)})` : "";
      const message = (messageFromJson || text || `HTTP ${status}`) + details;
      throw new ClickShipApiError({
        status,
        path,
        message: `ClickShip API error (${status}) on ${path}: ${message}`,
        json,
        text,
      });
    }
    return { status, json: json as T };
  } finally {
    clearTimeout(timeout);
  }
}

export async function createClickShipShipment(
  params: CreateOrderParams,
): Promise<ClickShipOrderResult | null> {
  const config = getClickShipConfig();
  if (!config) return null;

  const customerAddress = parseCanadianAddress(params.customer.formattedAddress);
  const canadaOnly = (process.env.CLICKSHIP_CANADA_ONLY || "true").trim().toLowerCase() !== "false";
  if (!customerAddress) {
    if (canadaOnly) {
      throw new Error("CLICKSHIP_CANADA_ONLY_ADDRESS_REQUIRED");
    }
    return null;
  }

  const safeDevicesCount = Number.isFinite(params.devicesCount)
    ? Math.max(1, Math.floor(params.devicesCount))
    : 1;

  const baseWeightKg = Number(process.env.CLICKSHIP_PACKAGE_WEIGHT_KG_BASE || "0.35");
  const perDeviceKg = Number(process.env.CLICKSHIP_PACKAGE_WEIGHT_KG_PER_DEVICE || "0.25");
  const weightKgRaw = baseWeightKg + safeDevicesCount * perDeviceKg;
  const weightKg = Math.min(5, Math.max(0.25, Number.isFinite(weightKgRaw) ? weightKgRaw : 0.85));

  const dimL = Number(process.env.CLICKSHIP_PACKAGE_DIM_L_CM || "25");
  const dimW = Number(process.env.CLICKSHIP_PACKAGE_DIM_W_CM || "18");
  const dimH = Number(process.env.CLICKSHIP_PACKAGE_DIM_H_CM || "10");
  const dimensions = {
    l: Number.isFinite(dimL) ? Math.max(1, dimL) : 25,
    w: Number.isFinite(dimW) ? Math.max(1, dimW) : 18,
    h: Number.isFinite(dimH) ? Math.max(1, dimH) : 10,
  };

  const referenceCodes = (() => {
    const raw = (params.orderReference || params.uniqueId || "").toString();
    const normalized = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 30);
    return normalized ? [normalized] : [];
  })();

  const details = {
    origin: {
      name: params.customer.name,
      contact_name: params.customer.name,
      residential: true,
      phone_number: { number: normalizePhoneNumber(params.customer.phone) },
      email_addresses: [params.customer.email],
      receives_email_updates: false,
      address: customerAddress,
    },
    destination: {
      name: config.origin.name,
      contact_name: config.origin.contact,
      residential: false,
      phone_number: { number: normalizePhoneNumber(config.origin.phone) },
      email_addresses: [config.origin.email],
      receives_email_updates: false,
      address: {
        address_line_1: config.origin.address1,
        ...(config.origin.address2 ? { address_line_2: config.origin.address2 } : {}),
        city: config.origin.city,
        region: config.origin.region,
        country: config.origin.country,
        postal_code: normalizePostalCode(config.origin.postal),
      },
      // ClickShip schema expects structured Date / TimeOfDay objects (not strings).
      ready_at: { hour: 9, minute: 0 },
      ready_until: { hour: 17, minute: 0 },
      signature_requirement: "not-required",
    },
    expected_ship_date: toJsonDate(new Date()),
    packaging_type: "package",
    packaging_properties: {
      packages: [
        {
          measurements: {
            weight: { unit: "kg", value: weightKg },
            cuboid: { unit: "cm", ...dimensions },
          },
          description: params.orderReference ? `Order ${params.orderReference}` : "Trade-in devices",
        },
      ],
    },
    ...(referenceCodes.length > 0 ? { reference_codes: referenceCodes } : {}),
  };

  const candidateServiceIds = await resolveClickShipServiceIdsForRating(config);
  const isTrivialCandidateList =
    candidateServiceIds.length === 1 && candidateServiceIds[0] && candidateServiceIds[0] === config.serviceId;

  let chosenServiceId: string | null = config.serviceId;

  if (!isTrivialCandidateList) {
    const rateId = await requestClickShipRateId({ config, details, services: candidateServiceIds });
    const rates = await pollClickShipRates({
      config,
      rateId,
      maxWaitMs: Math.min(15_000, Number(process.env.CLICKSHIP_LABEL_POLL_MS || "20000") || 20_000),
    });
    const cheapest = rates
      .map((r) => ({
        serviceId: typeof r?.service_id === "string" ? r.service_id : null,
        cents: moneyToCents(r?.total),
      }))
      .filter((r): r is { serviceId: string; cents: number } => Boolean(r.serviceId) && typeof r.cents === "number")
      .sort((a, b) => a.cents - b.cents)[0];

    chosenServiceId = cheapest?.serviceId || null;

    if (!chosenServiceId) {
      const requireRate = (process.env.CLICKSHIP_RATE_REQUIRED || "false").trim().toLowerCase() === "true";
      if (requireRate) {
        throw new Error("CLICKSHIP_NO_RATES_FOUND_FOR_ROUTE");
      }
      // Fallback to configured service_id to avoid blocking submissions in environments
      // where some carriers are listed but none return rates for a given route.
      chosenServiceId = config.serviceId;
    }
  }

  const payload = {
    unique_id: params.uniqueId,
    payment_method_id: config.paymentMethodId,
    service_id: chosenServiceId,
    details,
  };

  const { json: booked } = await clickShipFetchJson<{ id?: string }>(config, "/shipment", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const shipmentId = typeof booked?.id === "string" && booked.id.trim() ? booked.id : null;
  if (!shipmentId) throw new Error("ClickShip booking succeeded but shipment id is missing");

  return { shipmentId, trackingNumber: null, trackingUrl: null };
}

export async function persistClickShipStateToSubmissions(params: {
  requestGroupId: string;
  submissionIds: string[];
  shipmentId?: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  shippingLabelUrl?: string | null;
  shippingLabelStatus?: ClickShipLabelStatus | null;
  shippingLabelError?: string | null;
}): Promise<void> {
  const supabase = createAdminClient();

  const updatePayload: Record<string, unknown> = {
    ...(params.shipmentId ? { clickship_shipment_id: params.shipmentId } : {}),
    tracking_number: params.trackingNumber,
    tracking_url: params.trackingUrl,
    ...(typeof params.shippingLabelUrl === "string" || params.shippingLabelUrl === null
      ? { shipping_label_url: params.shippingLabelUrl }
      : {}),
    ...(typeof params.shippingLabelStatus === "string" || params.shippingLabelStatus === null
      ? { shipping_label_status: params.shippingLabelStatus }
      : {}),
    ...(typeof params.shippingLabelError === "string" || params.shippingLabelError === null
      ? { shipping_label_error: params.shippingLabelError }
      : {}),
  };

  // Prefer updating by request_group_id when available.
  const byGroup = await supabase
    .from("submissions")
    .update(updatePayload)
    .eq("request_group_id", params.requestGroupId);

  if (byGroup.error && /request_group_id|column.*does not exist/i.test(String(byGroup.error.message))) {
    const byIds = await supabase.from("submissions").update(updatePayload).in("id", params.submissionIds);
    if (byIds.error) throw new Error(`Supabase update failed: ${byIds.error.message}`);
  } else if (byGroup.error) {
    throw new Error(`Supabase update failed: ${byGroup.error.message}`);
  }

  return;
}
