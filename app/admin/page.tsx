import { createAdminClient, createCachedClient } from "@/lib/supabase-server";
import type { SubmissionRow, SubmissionStatus } from "@/lib/submissions";
import {
  normalizeSubmissionRow,
  SUBMISSIONS_SELECT_ADMIN_LIST,
  orderGrandTotal,
  submissionLineTotal,
} from "@/lib/submissions";
import { AdminLayout, type CommissionReportAggregates } from "./components/AdminLayout";
import type { ProductsPricesFiltersInit } from "./components/ProductsManager";
import { buildStoreCashflowSnapshot } from "@/lib/petty-cash";
import { getStaff, requireAdmin } from "@/lib/admin-auth";
import { parseAppRole, type AppRole } from "@/lib/app-role";
import { applyCommissionFilters, applyReceivableFilters } from "@/lib/commission-filters";
import { submissionMonthKey } from "@/lib/report-dates";
import { redirect } from "next/navigation";
import {
  isOrderStatusUi,
  normalizeOverallOrderStatus,
  orderMatchesStatusFilter,
  parseOrdersStoresParam,
  type OrderStatusUi,
} from "@/lib/order-status";

type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  last_login: string | null;
  role: AppRole;
};

function isStaffAuthUser(user: { app_metadata?: Record<string, unknown> | null }) {
  return parseAppRole(user.app_metadata ?? undefined) != null;
}

type Submission = {
  id: string;
  request_group_id: string | null;
  created_at: string;
  employee_full_name: string;
  store_name: string;
  client_full_name: string;
  client_account_number: string;
  client_city: string;
  device_imei: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  brand_name: string;
  model_name: string;
  memory: string;
  condition: string;
  price: number;
  quantity: number;
  price_override_previous?: number | null;
  price_override_reason?: string | null;
  price_override_updated_at?: string | null;
  price_override_updated_by?: string | null;
  clickship_shipment_id?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
  shipping_label_url?: string | null;
  shipping_label_status?: string | null;
  shipping_label_error?: string | null;
  status: SubmissionStatus;
  commission_paid: boolean;
  commission_employee?: number | null;
  commission_manager?: number | null;
  commission_owner?: number | null;
};

type SearchParams = {
  section?: string;
  tab?: string;
  order?: string;
  /** Orders list pagination & filters */
  ordersPage?: string;
  ordersPageSize?: string;
  /** Magasins (sélection multiple, séparés par des virgules encodées) */
  ordersStores?: string;
  /** @deprecated utiliser ordersStores */
  ordersStore?: string;
  ordersStatus?: string;
  ordersSort?: string;
  /** Commissions: pagination & filters */
  commissionPage?: string;
  commissionPageSize?: string;
  commissionFrom?: string;
  commissionTo?: string;
  commissionPaid?: string;
  commissionEmployee?: string;
  commissionStore?: string;
  /** Onglet Produits → Prix : filtres & pagination (persistés dans l’URL) */
  priceBrand?: string;
  priceModel?: string;
  priceCondition?: string;
  priceMemory?: string;
  priceMin?: string;
  priceMax?: string;
  pricePage?: string;
  pricePageSize?: string;
};

type EmployeeRef = {
  id: string;
  full_name: string;
};

type StoreRef = {
  id: string;
  name: string;
  petty_cash_opening_balance: number;
};

type AdminSection =
  | "comptes"
  | "referentiel"
  | "demandes"
  | "produits"
  | "commissions"
  | "caisse";

type Price = {
  id: string;
  model_id: string;
  condition: string;
  memory: string;
  price: number;
  created_at: string;
  models: {
    name: string;
    brands: { name: string } | { name: string }[];
  };
};

const SUBMISSIONS_SELECT_ADMIN_LIST_FALLBACK =
  "id, created_at, status, brand_name, model_name, memory, condition, price, customer_name, customer_email, customer_phone, customer_address, clickship_shipment_id, tracking_number, tracking_url, shipping_label_url, shipping_label_status, shipping_label_error";

const SUBMISSIONS_SELECT_ADMIN_LIST_PARTIAL =
  "id, request_group_id, created_at, status, brand_name, model_name, memory, condition, price, customer_name, customer_email, customer_phone, customer_address, clickship_shipment_id, tracking_number, tracking_url, shipping_label_url, shipping_label_status, shipping_label_error";

async function getSubmissions(): Promise<Submission[]> {
  // Use the service role key to bypass RLS.
  const { createAdminClient } = await import("@/lib/supabase-server");
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("submissions")
    .select(SUBMISSIONS_SELECT_ADMIN_LIST)
    .order("created_at", { ascending: false });

  let rows: SubmissionRow[] = [];
  if (error) {
    const message = String((error as { message?: string }).message ?? error);
    const needsFallback =
      /commission_paid|commission_employee|commission_manager|commission_owner|request_group_id|customer_address|employee_full_name|store_name|client_full_name|client_account_number|client_city|device_imei|price_override_previous|price_override_reason|price_override_updated_at|price_override_updated_by|quantity|column.*does not exist/i.test(
        message,
      );

    if (needsFallback) {
      // Try to keep `request_group_id` if available; otherwise fall back to legacy schema.
      const partial = await supabase
        .from("submissions")
        .select(SUBMISSIONS_SELECT_ADMIN_LIST_PARTIAL)
        .order("created_at", { ascending: false });

      if (!partial.error) {
        rows = (partial.data || []) as SubmissionRow[];
      } else {
        const fallback = await supabase
          .from("submissions")
          .select(SUBMISSIONS_SELECT_ADMIN_LIST_FALLBACK)
          .order("created_at", { ascending: false });
        if (fallback.error) {
          const err = fallback.error as { message?: string; code?: string; details?: string };
          console.error("Error fetching submissions:", err.message ?? err.code ?? err.details ?? fallback.error);
          return [];
        }
        rows = (fallback.data || []) as SubmissionRow[];
      }
    } else {
      const err = error as { message?: string; code?: string; details?: string };
      console.error("Error fetching submissions:", err.message ?? err.code ?? err.details ?? error);
      return [];
    }
  } else {
    rows = (data || []) as SubmissionRow[];
  }
  return rows.map((row) => {
    const s = normalizeSubmissionRow(row);
    return {
      id: s.id,
      request_group_id: s.request_group_id ?? null,
      created_at: s.created_at,
      employee_full_name: s.employee_full_name,
      store_name: s.store_name,
      client_full_name: s.client_full_name,
      client_account_number: s.client_account_number,
      client_city: s.client_city,
      device_imei: s.device_imei,
      customer_name: s.customer_name,
      customer_email: s.customer_email,
      customer_phone: s.customer_phone,
      customer_address: s.customer_address,
      brand_name: s.brand_name,
      model_name: s.model_name,
      memory: s.memory,
      condition: s.condition,
      price: s.price,
      quantity: s.quantity,
      clickship_shipment_id: s.clickship_shipment_id ?? null,
      tracking_number: s.tracking_number ?? null,
      tracking_url: s.tracking_url ?? null,
      shipping_label_url: s.shipping_label_url ?? null,
      shipping_label_status: s.shipping_label_status ?? null,
      shipping_label_error: s.shipping_label_error ?? null,
      price_override_previous: s.price_override_previous ?? null,
      price_override_reason: s.price_override_reason ?? null,
      price_override_updated_at: s.price_override_updated_at ?? null,
      price_override_updated_by: s.price_override_updated_by ?? null,
      status: s.status,
      commission_paid: s.commission_paid,
      commission_employee: s.commission_employee,
      commission_manager: s.commission_manager,
      commission_owner: s.commission_owner,
    };
  });
}

async function getAdminUsers(): Promise<AdminUser[]> {
  const supabase = createAdminClient();
  const allAuthUsers: Array<{
    id: string;
    email?: string;
    created_at?: string;
    last_sign_in_at?: string | null;
    app_metadata?: Record<string, unknown> | null;
    user_metadata?: { name?: string };
  }> = [];

  const PER_PAGE = 200;
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: PER_PAGE,
    });

    if (error) {
      console.error("Error fetching auth users:", error);
      break;
    }

    const users = data?.users || [];
    allAuthUsers.push(...users);

    if (users.length < PER_PAGE) {
      break;
    }
  }

  const staffOnly = allAuthUsers
    .filter(isStaffAuthUser)
    .map((user) => {
      const role = parseAppRole(user.app_metadata ?? undefined)!;
      return {
        id: user.id,
        email: user.email || "",
        name:
          typeof user.user_metadata?.name === "string" &&
          user.user_metadata.name.trim()
            ? user.user_metadata.name
            : null,
        created_at: user.created_at || new Date(0).toISOString(),
        last_login: user.last_sign_in_at ?? null,
        role,
      };
    });

  const sortNewestFirst = [...staffOnly].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  return sortNewestFirst;
}

async function getBrands() {
  const supabase = createCachedClient();
  const { data, error } = await supabase
    .from("brands")
    .select("id, name, slug, logo_url, created_at")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching brands:", error);
    return [];
  }

  return data || [];
}

async function getModels() {
  const supabase = createCachedClient();
  const { data, error } = await supabase
    .from("models")
    .select("*, brands(name)")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching models:", error);
    return [];
  }

  return data || [];
}

async function getPrices() {
  const supabase = createCachedClient();
  const PAGE_SIZE = 1000;
  const all: Price[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("prices")
      .select("*, models(name, brands(name))")
      .order("price", { ascending: false })
      .order("id", { ascending: true })
      .range(from, to);

    if (error) {
      console.error("Error fetching prices:", error);
      return [];
    }

    const rows = (data || []) as Price[];
    all.push(...rows);

    if (rows.length < PAGE_SIZE) {
      break;
    }
  }

  return all;
}

async function getEmployees(): Promise<EmployeeRef[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("employees")
    .select("id, full_name")
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  if (error) return [];
  return data || [];
}

async function getStores(): Promise<StoreRef[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("stores")
    .select("id, name, petty_cash_opening_balance")
    .eq("is_active", true)
    .order("name", { ascending: true });

  let { data, error } = await query;

  if (error && /petty_cash_opening_balance|column.*does not exist/i.test(String(error.message))) {
    const fb = await supabase
      .from("stores")
      .select("id, name")
      .eq("is_active", true)
      .order("name", { ascending: true });
    if (fb.error) return [];
    return (fb.data || []).map((r) => ({
      id: r.id,
      name: r.name,
      petty_cash_opening_balance: 0,
    }));
  }

  if (error) return [];
  return (data || []).map((r) => ({
    id: r.id,
    name: r.name,
    petty_cash_opening_balance: Number(
      (r as { petty_cash_opening_balance?: unknown }).petty_cash_opening_balance ?? 0,
    ),
  }));
}

const COMMISSIONS_DEFAULT_PAGE_SIZE = 20;

const ORDERS_DEFAULT_PAGE_SIZE = 20;
const ORDERS_PAGE_SIZES = new Set([20, 50, 100, 500, 1000]);
const ORDERS_SORT_VALUES = new Set(["date-desc", "date-asc", "store-asc", "store-desc"]);
const PRICES_PAGE_SIZES = new Set([10, 25, 50, 100, 250, 500, 1000]);

function parseProductsPricesFilters(sp: SearchParams): ProductsPricesFiltersInit {
  const brand =
    typeof sp.priceBrand === "string" && sp.priceBrand !== "" ? sp.priceBrand : "all";
  const model =
    typeof sp.priceModel === "string" && sp.priceModel !== "" ? sp.priceModel : "all";
  const condition =
    typeof sp.priceCondition === "string" && sp.priceCondition !== ""
      ? sp.priceCondition
      : "all";
  const memory =
    typeof sp.priceMemory === "string" && sp.priceMemory !== "" ? sp.priceMemory : "all";
  const min = typeof sp.priceMin === "string" ? sp.priceMin : "";
  const max = typeof sp.priceMax === "string" ? sp.priceMax : "";
  const page = Math.max(1, parseInt(sp.pricePage ?? "1", 10) || 1);
  const pageSizeRaw = parseInt(sp.pricePageSize ?? "50", 10) || 50;
  const pageSize = PRICES_PAGE_SIZES.has(pageSizeRaw) ? pageSizeRaw : 50;
  return {
    brand,
    model,
    condition,
    memory,
    min,
    max,
    pageIndex: page - 1,
    pageSize,
  };
}

type GetCommissionsParams = {
  page: number;
  pageSize: number;
  fromDate: string;
  toDate: string;
  commissionPaid: "all" | "paid" | "unpaid";
  employeeFullName: string;
  storeName: string;
};

type CommissionsResult = {
  submissions: Submission[];
  total: number;
  unpaidTotal: number;
  unpaidEmployeeTotal: number;
  unpaidManagerTotal: number;
  unpaidOwnerTotal: number;
  globalYearUnitsTotal: number;
  globalYearBuybackTotal: number;
  globalYearEmployeeCommissionTotal: number;
  globalYearManagerCommissionTotal: number;
  globalYearOwnerCommissionTotal: number;
  globalYearCommissionTotal: number;
  /** Année en cours, lignes dont la commission n’est pas marquée payée. */
  globalYearOwnerToReceive: number;
  globalYearOtherCommissionToReceive: number;
  globalYearTotalToReceive: number;
  page: number;
  pageSize: number;
  fromDate: string;
  toDate: string;
  commissionPaid: "all" | "paid" | "unpaid";
  employeeFullName: string;
  storeName: string;
};

const EMPTY_COMMISSION_REPORT_AGGREGATES: CommissionReportAggregates = {
  totalUnits: 0,
  totalBuyback: 0,
  totalCommissionEmployee: 0,
  totalCommissionManager: 0,
  totalCommissionOwner: 0,
  totalCommission: 0,
  salesByMonth: [],
  topModels: [],
};

async function getCommissionReportAggregates(
  params: Omit<GetCommissionsParams, "page" | "pageSize">,
): Promise<CommissionReportAggregates> {
  const { createAdminClient } = await import("@/lib/supabase-server");
  const supabase = createAdminClient();
  const batchSize = 1000;
  let totalUnits = 0;
  let totalBuyback = 0;
  let totalCommissionEmployee = 0;
  let totalCommissionManager = 0;
  let totalCommissionOwner = 0;
  const monthMap = new Map<string, { units: number; buyback: number }>();
  const modelMap = new Map<string, { units: number; buyback: number; commission: number }>();

  try {
    for (let p = 0; ; p += 1) {
      const start = p * batchSize;
      const end = start + batchSize - 1;
      let q = supabase
        .from("submissions")
        .select(
          "created_at,price,quantity,brand_name,model_name,commission_employee,commission_manager,commission_owner",
        )
        .order("created_at", { ascending: false })
        .range(start, end);
      q = applyCommissionFilters(q, {
        fromDate: params.fromDate,
        toDate: params.toDate,
        commissionPaid: params.commissionPaid,
        employeeFullName: params.employeeFullName,
        storeName: params.storeName,
      });
      const { data, error } = await q;
      if (error) {
        return { ...EMPTY_COMMISSION_REPORT_AGGREGATES };
      }
      const batch = (data || []) as SubmissionRow[];
      if (batch.length === 0) break;
      for (const row of batch) {
        const s = normalizeSubmissionRow(row);
        const lineTotal = submissionLineTotal(s.price, s.quantity);
        const ce = Number(s.commission_employee ?? 0);
        const cm = Number(s.commission_manager ?? 0);
        const co = Number(s.commission_owner ?? 0);
        totalUnits += s.quantity;
        totalBuyback += lineTotal;
        totalCommissionEmployee += ce;
        totalCommissionManager += cm;
        totalCommissionOwner += co;
        const monthKey = submissionMonthKey(s.created_at);
        const mm = monthMap.get(monthKey) ?? { units: 0, buyback: 0 };
        mm.units += s.quantity;
        mm.buyback += lineTotal;
        monthMap.set(monthKey, mm);
        const modelLabel =
          [s.brand_name, s.model_name].filter(Boolean).join(" ").trim() || "—";
        const mo = modelMap.get(modelLabel) ?? { units: 0, buyback: 0, commission: 0 };
        mo.units += s.quantity;
        mo.buyback += lineTotal;
        mo.commission += ce + cm + co;
        modelMap.set(modelLabel, mo);
      }
      if (batch.length < batchSize) break;
    }
  } catch {
    return { ...EMPTY_COMMISSION_REPORT_AGGREGATES };
  }

  const salesByMonth = Array.from(monthMap.entries())
    .map(([monthKey, v]) => ({
      monthKey,
      units: v.units,
      buyback: v.buyback,
    }))
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey));

  const topModels = Array.from(modelMap.entries())
    .map(([label, v]) => ({ label, ...v }))
    .sort((a, b) => b.units - a.units)
    .slice(0, 12);

  return {
    totalUnits,
    totalBuyback,
    totalCommissionEmployee,
    totalCommissionManager,
    totalCommissionOwner,
    totalCommission:
      totalCommissionEmployee + totalCommissionManager + totalCommissionOwner,
    salesByMonth,
    topModels,
  };
}

async function getCommissionsPaginated(
  params: GetCommissionsParams,
): Promise<CommissionsResult> {
  const { createAdminClient } = await import("@/lib/supabase-server");
  const supabase = createAdminClient();

  let query = supabase
    .from("submissions")
    .select(SUBMISSIONS_SELECT_ADMIN_LIST, { count: "exact" })
    .order("created_at", { ascending: false });
  query = applyCommissionFilters(query, params);

  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;
  const { data, error, count } = await query.range(from, to);

  if (error) {
    if (/commission_paid|commission_employee|commission_manager|commission_owner|request_group_id|employee_full_name|store_name|client_full_name|client_account_number|client_city|device_imei|quantity|column.*does not exist/i.test(String(error.message))) {
      const fallbackQuery = supabase
        .from("submissions")
        .select(SUBMISSIONS_SELECT_ADMIN_LIST_PARTIAL, { count: "exact" })
        .order("created_at", { ascending: false });
      const fallback = applyCommissionFilters(fallbackQuery, params);
      const fallbackResult = await fallback.range(from, to);
      if (fallbackResult.error) {
        const legacyFallbackQuery = supabase
          .from("submissions")
          .select(SUBMISSIONS_SELECT_ADMIN_LIST_FALLBACK, { count: "exact" })
          .order("created_at", { ascending: false });
        let legacyFallback = legacyFallbackQuery;
        legacyFallback = applyCommissionFilters(legacyFallback, params);
        const legacyResult = await legacyFallback.range(from, to);
        if (legacyResult.error) {
          return {
            submissions: [],
            total: 0,
            unpaidTotal: 0,
            unpaidEmployeeTotal: 0,
            unpaidManagerTotal: 0,
            unpaidOwnerTotal: 0,
            globalYearUnitsTotal: 0,
            globalYearBuybackTotal: 0,
            globalYearEmployeeCommissionTotal: 0,
            globalYearManagerCommissionTotal: 0,
            globalYearOwnerCommissionTotal: 0,
            globalYearCommissionTotal: 0,
            globalYearOwnerToReceive: 0,
            globalYearOtherCommissionToReceive: 0,
            globalYearTotalToReceive: 0,
            page: params.page,
            pageSize: params.pageSize,
            fromDate: params.fromDate,
            toDate: params.toDate,
            commissionPaid: "all",
            employeeFullName: params.employeeFullName,
            storeName: params.storeName,
          };
        }
        const legacyRows = (legacyResult.data || []) as SubmissionRow[];
        const legacySubmissions = legacyRows.map((row) => {
          const s = normalizeSubmissionRow(row);
          return {
            id: s.id,
            request_group_id: s.request_group_id ?? null,
            created_at: s.created_at,
            employee_full_name: s.employee_full_name,
            store_name: s.store_name,
            client_full_name: s.client_full_name,
            client_account_number: s.client_account_number,
            client_city: s.client_city,
            device_imei: s.device_imei,
            customer_name: s.customer_name,
            customer_email: s.customer_email,
            customer_phone: s.customer_phone,
            customer_address: s.customer_address,
            brand_name: s.brand_name,
            model_name: s.model_name,
            memory: s.memory,
            condition: s.condition,
            price: s.price,
            quantity: s.quantity,
            status: s.status,
            commission_paid: false,
            commission_employee: 0,
            commission_manager: 0,
            commission_owner: 0,
          };
        });
        return {
          submissions: legacySubmissions,
          total: legacyResult.count ?? 0,
          unpaidTotal: legacyResult.count ?? 0,
          unpaidEmployeeTotal: 0,
          unpaidManagerTotal: 0,
          unpaidOwnerTotal: 0,
          globalYearUnitsTotal: 0,
          globalYearBuybackTotal: 0,
          globalYearEmployeeCommissionTotal: 0,
          globalYearManagerCommissionTotal: 0,
          globalYearOwnerCommissionTotal: 0,
          globalYearCommissionTotal: 0,
          globalYearOwnerToReceive: 0,
          globalYearOtherCommissionToReceive: 0,
          globalYearTotalToReceive: 0,
          page: params.page,
          pageSize: params.pageSize,
          fromDate: params.fromDate,
          toDate: params.toDate,
          commissionPaid: "all",
          employeeFullName: params.employeeFullName,
          storeName: params.storeName,
        };
      }
      const rows = (fallbackResult.data || []) as SubmissionRow[];
      const submissions = rows.map((row) => {
        const s = normalizeSubmissionRow(row);
        return {
          id: s.id,
          request_group_id: s.request_group_id ?? null,
          created_at: s.created_at,
          employee_full_name: s.employee_full_name,
          store_name: s.store_name,
          client_full_name: s.client_full_name,
          client_account_number: s.client_account_number,
          client_city: s.client_city,
          device_imei: s.device_imei,
          customer_name: s.customer_name,
          customer_email: s.customer_email,
          customer_phone: s.customer_phone,
          customer_address: s.customer_address,
          brand_name: s.brand_name,
          model_name: s.model_name,
          memory: s.memory,
          condition: s.condition,
          price: s.price,
          quantity: s.quantity,
          status: s.status,
          commission_paid: false,
          commission_employee: 0,
          commission_manager: 0,
          commission_owner: 0,
        };
      });
      return {
        submissions,
        total: fallbackResult.count ?? 0,
        unpaidTotal: fallbackResult.count ?? 0,
        unpaidEmployeeTotal: 0,
        unpaidManagerTotal: 0,
        unpaidOwnerTotal: 0,
        globalYearUnitsTotal: 0,
        globalYearBuybackTotal: 0,
        globalYearEmployeeCommissionTotal: 0,
        globalYearManagerCommissionTotal: 0,
        globalYearOwnerCommissionTotal: 0,
        globalYearCommissionTotal: 0,
        globalYearOwnerToReceive: 0,
        globalYearOtherCommissionToReceive: 0,
        globalYearTotalToReceive: 0,
        page: params.page,
        pageSize: params.pageSize,
        fromDate: params.fromDate,
        toDate: params.toDate,
        commissionPaid: "all",
        employeeFullName: params.employeeFullName,
        storeName: params.storeName,
      };
    }
    return {
      submissions: [],
      total: 0,
      unpaidTotal: 0,
      unpaidEmployeeTotal: 0,
      unpaidManagerTotal: 0,
      unpaidOwnerTotal: 0,
      globalYearUnitsTotal: 0,
      globalYearBuybackTotal: 0,
      globalYearEmployeeCommissionTotal: 0,
      globalYearManagerCommissionTotal: 0,
      globalYearOwnerCommissionTotal: 0,
      globalYearCommissionTotal: 0,
      globalYearOwnerToReceive: 0,
      globalYearOtherCommissionToReceive: 0,
      globalYearTotalToReceive: 0,
      page: params.page,
      pageSize: params.pageSize,
      fromDate: params.fromDate,
      toDate: params.toDate,
      commissionPaid: params.commissionPaid,
      employeeFullName: params.employeeFullName,
      storeName: params.storeName,
    };
  }

  const rows = (data || []) as SubmissionRow[];
  const submissions = rows.map((row) => {
    const s = normalizeSubmissionRow(row);
    return {
      id: s.id,
      request_group_id: s.request_group_id ?? null,
      created_at: s.created_at,
      employee_full_name: s.employee_full_name,
      store_name: s.store_name,
      client_full_name: s.client_full_name,
      client_account_number: s.client_account_number,
      client_city: s.client_city,
      device_imei: s.device_imei,
      customer_name: s.customer_name,
      customer_email: s.customer_email,
      customer_phone: s.customer_phone,
      customer_address: s.customer_address,
      brand_name: s.brand_name,
      model_name: s.model_name,
      memory: s.memory,
      condition: s.condition,
      price: s.price,
      quantity: s.quantity,
      status: s.status,
      commission_paid: s.commission_paid,
      commission_employee: s.commission_employee,
      commission_manager: s.commission_manager,
      commission_owner: s.commission_owner,
    };
  });

  let unpaidTotal = 0;
  let unpaidEmployeeTotal = 0;
  let unpaidManagerTotal = 0;
  let unpaidOwnerTotal = 0;
  let globalYearUnitsTotal = 0;
  let globalYearBuybackTotal = 0;
  let globalYearEmployeeCommissionTotal = 0;
  let globalYearManagerCommissionTotal = 0;
  let globalYearOwnerCommissionTotal = 0;
  let globalYearCommissionTotal = 0;
  let globalYearOwnerToReceive = 0;
  let globalYearOtherCommissionToReceive = 0;
  let globalYearTotalToReceive = 0;
  try {
    const unpaidBatchSize = 1000;
    let uCommSum = 0;
    let uEmpSum = 0;
    let uMgrSum = 0;
    let uOwnSum = 0;
    let unpaidLegacyCountOnly: number | null = null;
    for (let p = 0; ; p += 1) {
      const start = p * unpaidBatchSize;
      const end = start + unpaidBatchSize - 1;
      let unpaidQuery = applyReceivableFilters(
        supabase
          .from("submissions")
          .select("commission_employee, commission_manager, commission_owner"),
      )
        .order("id", { ascending: true })
        .range(start, end);
      unpaidQuery = applyCommissionFilters(unpaidQuery, {
        ...params,
        commissionPaid: "unpaid",
      });
      const unpaidResult = await unpaidQuery;
      if (unpaidResult.error) {
        if (
          p === 0 &&
          /quantity|column.*does not exist/i.test(String(unpaidResult.error.message))
        ) {
          let countQuery = applyReceivableFilters(
            supabase.from("submissions").select("id", { count: "exact", head: true }),
          );
          countQuery = applyCommissionFilters(countQuery, {
            ...params,
            commissionPaid: "unpaid",
          });
          const countResult = await countQuery;
          if (!countResult.error) {
            unpaidLegacyCountOnly = countResult.count ?? 0;
          }
        }
        break;
      }
      const batch = unpaidResult.data || [];
      if (batch.length === 0) break;
      for (const row of batch) {
        const s = normalizeSubmissionRow(row as SubmissionRow);
        uCommSum += s.commission_employee + s.commission_manager + s.commission_owner;
        uEmpSum += s.commission_employee;
        uMgrSum += s.commission_manager;
        uOwnSum += s.commission_owner;
      }
      if (batch.length < unpaidBatchSize) break;
    }
    if (unpaidLegacyCountOnly !== null) {
      unpaidTotal = unpaidLegacyCountOnly;
      unpaidEmployeeTotal = 0;
      unpaidManagerTotal = 0;
      unpaidOwnerTotal = 0;
    } else {
      unpaidTotal = uCommSum;
      unpaidEmployeeTotal = uEmpSum;
      unpaidManagerTotal = uMgrSum;
      unpaidOwnerTotal = uOwnSum;
    }
  } catch {
    unpaidTotal = 0;
    unpaidEmployeeTotal = 0;
    unpaidManagerTotal = 0;
    unpaidOwnerTotal = 0;
  }

  try {
    const year = new Date().getUTCFullYear();
    const fromYear = `${year}-01-01T00:00:00.000Z`;
    const toYear = `${year + 1}-01-01T00:00:00.000Z`;
    const batchSize = 1000;
    let gyUnits = 0;
    let gyBuyback = 0;
    let gyEmp = 0;
    let gyMgr = 0;
    let gyOwn = 0;
    for (let p = 0; ; p += 1) {
      const start = p * batchSize;
      const end = start + batchSize - 1;
      const { data, error } = await supabase
        .from("submissions")
        .select("price, quantity, commission_employee, commission_manager, commission_owner")
        .gte("created_at", fromYear)
        .lt("created_at", toYear)
        .order("id", { ascending: true })
        .range(start, end);
      if (error) throw error;
      const batch = (data || []) as SubmissionRow[];
      if (batch.length === 0) break;
      for (const row of batch) {
        const s = normalizeSubmissionRow(row);
        const lineTotal = submissionLineTotal(s.price, s.quantity);
        gyUnits += s.quantity;
        gyBuyback += lineTotal;
        gyEmp += s.commission_employee;
        gyMgr += s.commission_manager;
        gyOwn += s.commission_owner;
      }
      if (batch.length < batchSize) break;
    }
    globalYearUnitsTotal = gyUnits;
    globalYearBuybackTotal = gyBuyback;
    globalYearEmployeeCommissionTotal = gyEmp;
    globalYearManagerCommissionTotal = gyMgr;
    globalYearOwnerCommissionTotal = gyOwn;
    globalYearCommissionTotal = gyOwn + gyEmp + gyMgr;
  } catch {
    globalYearUnitsTotal = 0;
    globalYearBuybackTotal = 0;
    globalYearEmployeeCommissionTotal = 0;
    globalYearManagerCommissionTotal = 0;
    globalYearOwnerCommissionTotal = 0;
    globalYearCommissionTotal = 0;
  }

  try {
    const year = new Date().getUTCFullYear();
    const fromYear = `${year}-01-01T00:00:00.000Z`;
    const toYear = `${year + 1}-01-01T00:00:00.000Z`;
    const batchSize = 1000;
    let recvOwn = 0;
    let recvOther = 0;
    let recvTotal = 0;
    for (let p = 0; ; p += 1) {
      const start = p * batchSize;
      const end = start + batchSize - 1;
      const { data, error } = await applyReceivableFilters(
        supabase
          .from("submissions")
          .select("price, quantity, commission_employee, commission_manager, commission_owner"),
      )
        .gte("created_at", fromYear)
        .lt("created_at", toYear)
        .order("id", { ascending: true })
        .range(start, end);
      if (error) throw error;
      const batch = (data || []) as SubmissionRow[];
      if (batch.length === 0) break;
      for (const row of batch) {
        const s = normalizeSubmissionRow(row);
        const lineTotal = submissionLineTotal(s.price, s.quantity);
        const emp = Number(s.commission_employee ?? 0);
        const mgr = Number(s.commission_manager ?? 0);
        const own = Number(s.commission_owner ?? 0);
        recvOwn += own;
        recvOther += emp + mgr;
        recvTotal += lineTotal + emp + mgr + own;
      }
      if (batch.length < batchSize) break;
    }
    globalYearOwnerToReceive = recvOwn;
    globalYearOtherCommissionToReceive = recvOther;
    globalYearTotalToReceive = recvTotal;
  } catch {
    globalYearOwnerToReceive = 0;
    globalYearOtherCommissionToReceive = 0;
    globalYearTotalToReceive = 0;
  }

  return {
    submissions,
    total: count ?? 0,
    unpaidTotal,
    unpaidEmployeeTotal,
    unpaidManagerTotal,
    unpaidOwnerTotal,
    globalYearUnitsTotal,
    globalYearBuybackTotal,
    globalYearEmployeeCommissionTotal,
    globalYearManagerCommissionTotal,
    globalYearOwnerCommissionTotal,
    globalYearCommissionTotal,
    globalYearOwnerToReceive,
    globalYearOtherCommissionToReceive,
    globalYearTotalToReceive,
    page: params.page,
    pageSize: params.pageSize,
    fromDate: params.fromDate,
    toDate: params.toDate,
    commissionPaid: params.commissionPaid,
    employeeFullName: params.employeeFullName,
    storeName: params.storeName,
  };
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const admin = await requireAdmin();
  if (!admin) {
    const staff = await getStaff();
    if (staff) {
      redirect("/?forbidden=1");
    }
    redirect("/login?redirect=/admin");
  }

  const sp = (await searchParams) || {};
  const requestedSection: AdminSection =
    sp.section === "comptes" ||
    sp.section === "referentiel" ||
    sp.section === "demandes" ||
    sp.section === "produits" ||
    sp.section === "commissions" ||
    sp.section === "caisse"
      ? sp.section
      : "demandes";

  if (
    (requestedSection === "comptes" || requestedSection === "produits") &&
    admin.role !== "super_admin"
  ) {
    redirect("/admin?section=demandes");
  }

  const section = requestedSection;
  const tab = sp.tab === "brands" || sp.tab === "models" || sp.tab === "prices" ? sp.tab : "brands";
  const initialProductsPricesFilters = parseProductsPricesFilters(sp);
  const selectedOrder = typeof sp.order === "string" && sp.order.trim() !== "" ? sp.order.trim() : null;
  const ordersPage = Math.max(1, parseInt(sp.ordersPage ?? "1", 10) || 1);
  const ordersPageSizeRaw =
    parseInt(sp.ordersPageSize ?? String(ORDERS_DEFAULT_PAGE_SIZE), 10) ||
    ORDERS_DEFAULT_PAGE_SIZE;
  const ordersPageSize = ORDERS_PAGE_SIZES.has(ordersPageSizeRaw)
    ? ordersPageSizeRaw
    : ORDERS_DEFAULT_PAGE_SIZE;
  const ordersStoresFilterRaw = sp.ordersStores ?? sp.ordersStore ?? "";
  const ordersStoresFilterParsed = parseOrdersStoresParam(ordersStoresFilterRaw);
  const ordersStatusFilter: OrderStatusUi | null =
    sp.ordersStatus && isOrderStatusUi(sp.ordersStatus) ? sp.ordersStatus : null;
  const ordersSortRaw = sp.ordersSort ?? "date-desc";
  const ordersSort = ORDERS_SORT_VALUES.has(ordersSortRaw) ? ordersSortRaw : "date-desc";

  const commissionPage = Math.max(1, parseInt(sp.commissionPage ?? "1", 10) || 1);
  const commissionPageSize = Math.min(
    100,
    Math.max(5, parseInt(sp.commissionPageSize ?? String(COMMISSIONS_DEFAULT_PAGE_SIZE), 10) || COMMISSIONS_DEFAULT_PAGE_SIZE),
  );
  const commissionFrom = sp.commissionFrom ?? "";
  const commissionTo = sp.commissionTo ?? "";
  const commissionPaid =
    sp.commissionPaid === "paid" || sp.commissionPaid === "unpaid"
      ? sp.commissionPaid
      : "all";
  const commissionEmployee = sp.commissionEmployee ?? "";
  const commissionStore = sp.commissionStore ?? "";

  const [submissions, adminUsers, brands, models, prices, employees, stores, commissionsPayload] =
    await Promise.all([
      getSubmissions(),
      admin.role === "super_admin" ? getAdminUsers() : Promise.resolve([] as AdminUser[]),
      getBrands(),
      getModels(),
      getPrices(),
      getEmployees(),
      getStores(),
      section === "commissions"
        ? Promise.all([
            getCommissionsPaginated({
              page: commissionPage,
              pageSize: commissionPageSize,
              fromDate: commissionFrom,
              toDate: commissionTo,
              commissionPaid,
              employeeFullName: commissionEmployee,
              storeName: commissionStore,
            }),
            getCommissionReportAggregates({
              fromDate: commissionFrom,
              toDate: commissionTo,
              commissionPaid,
              employeeFullName: commissionEmployee,
              storeName: commissionStore,
            }),
          ]).then(([commissionsData, commissionReportAggregates]) => ({
            commissionsData,
            commissionReportAggregates,
          }))
        : Promise.resolve({
            commissionsData: null as CommissionsResult | null,
            commissionReportAggregates: null as CommissionReportAggregates | null,
          }),
    ]);

  const commissionsData = commissionsPayload.commissionsData;
  const commissionReportAggregates = commissionsPayload.commissionReportAggregates;

  const ordersById = new Map<
    string,
    {
      orderId: string;
      created_at: string;
      model_names: Set<string>;
      gross_total: number;
      customer_name: string;
      customer_email: string;
      customer_phone: string;
      client_city: string;
      device_imei: string;
      employee_full_name: string;
      store_name: string;
      client_account_number: string;
      statuses: Set<SubmissionStatus>;
      commission_employee_total: number;
      commission_manager_total: number;
      commission_owner_total: number;
    }
  >();

  for (const s of submissions) {
    const orderId = s.request_group_id ?? s.id;
    const existing = ordersById.get(orderId);
    if (!existing) {
      ordersById.set(orderId, {
        orderId,
        created_at: s.created_at,
        model_names: new Set([s.model_name].filter(Boolean)),
        gross_total: submissionLineTotal(s.price, s.quantity),
        customer_name: s.client_full_name || s.customer_name,
        customer_email: s.customer_email,
        customer_phone: s.customer_phone,
        client_city: s.client_city,
        device_imei: s.device_imei,
        employee_full_name: s.employee_full_name,
        store_name: s.store_name,
        client_account_number: s.client_account_number,
        statuses: new Set([s.status]),
        commission_employee_total: Number(s.commission_employee ?? 0),
        commission_manager_total: Number(s.commission_manager ?? 0),
        commission_owner_total: Number(s.commission_owner ?? 0),
      });
      continue;
    }

    if (s.created_at < existing.created_at) {
      existing.created_at = s.created_at;
    }
    if (s.model_name) {
      existing.model_names.add(s.model_name);
    }
    existing.gross_total += submissionLineTotal(s.price, s.quantity);

    if (!existing.employee_full_name && s.employee_full_name) {
      existing.employee_full_name = s.employee_full_name;
    }
    if (!existing.store_name && s.store_name) {
      existing.store_name = s.store_name;
    }
    if (!existing.client_account_number && s.client_account_number) {
      existing.client_account_number = s.client_account_number;
    }
    if (!existing.client_city && s.client_city) {
      existing.client_city = s.client_city;
    }
    if (!existing.device_imei && s.device_imei) {
      existing.device_imei = s.device_imei;
    }

    existing.statuses.add(s.status);
    existing.commission_employee_total += Number(s.commission_employee ?? 0);
    existing.commission_manager_total += Number(s.commission_manager ?? 0);
    existing.commission_owner_total += Number(s.commission_owner ?? 0);
  }

  const allOrders = Array.from(ordersById.values())
    .map(({ statuses, model_names, ...order }) => {
      const models = Array.from(model_names).filter(Boolean);
      const model_summary =
        models.length <= 1 ? (models[0] ?? "—") : `${models[0]} +${models.length - 1}`;
      return {
        ...order,
        model_summary,
        status: normalizeOverallOrderStatus(statuses),
        grand_total: orderGrandTotal(order),
      };
    })
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  const knownStoreNames = new Set([
    ...stores.map((s) => s.name),
    ...allOrders.map((o) => o.store_name?.trim()).filter(Boolean),
  ] as string[]);
  const ordersStoresFilter = ordersStoresFilterParsed.filter((name) =>
    knownStoreNames.has(name),
  );

  let filteredOrders = allOrders;
  if (ordersStoresFilter.length > 0) {
    const selected = new Set(ordersStoresFilter);
    filteredOrders = filteredOrders.filter((o) => selected.has(o.store_name));
  }
  if (ordersStatusFilter) {
    filteredOrders = filteredOrders.filter((o) =>
      orderMatchesStatusFilter(o.status, ordersStatusFilter),
    );
  }

  filteredOrders = [...filteredOrders].sort((a, b) => {
    switch (ordersSort) {
      case "date-asc":
        return a.created_at.localeCompare(b.created_at);
      case "store-asc": {
        const byStore = a.store_name.localeCompare(b.store_name, "fr");
        return byStore !== 0 ? byStore : b.created_at.localeCompare(a.created_at);
      }
      case "store-desc": {
        const byStore = b.store_name.localeCompare(a.store_name, "fr");
        return byStore !== 0 ? byStore : b.created_at.localeCompare(a.created_at);
      }
      case "date-desc":
      default:
        return b.created_at.localeCompare(a.created_at);
    }
  });

  const totalOrders = filteredOrders.length;
  const totalOrdersAll = allOrders.length;
  const totalOrdersPages = Math.max(1, Math.ceil(totalOrders / ordersPageSize));
  const safeOrdersPage = Math.min(ordersPage, totalOrdersPages);
  const ordersStart = (safeOrdersPage - 1) * ordersPageSize;
  const orders = filteredOrders.slice(ordersStart, ordersStart + ordersPageSize);

  const orderSubmissions =
    section === "demandes" && selectedOrder
      ? submissions.filter((s) => (s.request_group_id ?? s.id) === selectedOrder)
      : [];

  const cashflowSnapshot = buildStoreCashflowSnapshot(submissions, stores);

  return (
    <AdminLayout
      submissions={submissions}
      orders={orders}
      ordersPage={safeOrdersPage}
      ordersPageSize={ordersPageSize}
      totalOrders={totalOrders}
      totalOrdersAll={totalOrdersAll}
      totalOrdersPages={totalOrdersPages}
      ordersStoresFilter={ordersStoresFilter}
      ordersStatusFilter={ordersStatusFilter}
      ordersSort={ordersSort}
      selectedOrder={section === "demandes" ? selectedOrder : null}
      orderSubmissions={orderSubmissions}
      adminUsers={adminUsers}
      brands={brands}
      models={models}
      prices={prices}
      initialSection={section}
      initialProductsTab={tab}
      initialProductsPricesFilters={initialProductsPricesFilters}
      commissionsData={commissionsData}
      commissionReportAggregates={commissionReportAggregates}
      employees={employees}
      stores={stores}
      cashflowSnapshot={cashflowSnapshot}
      canManageStaffAccounts={admin.role === "super_admin"}
      viewerRole={admin.role}
    />
  );
}
