import { createAdminClient, createCachedClient } from "@/lib/supabase-server";
import type { SubmissionRow, SubmissionStatus } from "@/lib/submissions";
import { normalizeSubmissionRow, SUBMISSIONS_SELECT_ADMIN_LIST } from "@/lib/submissions";
import { AdminLayout } from "./components/AdminLayout";
import { getStaff, requireAdmin } from "@/lib/admin-auth";
import { parseAppRole, type AppRole } from "@/lib/app-role";
import { redirect } from "next/navigation";

type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  last_login: string | null;
  role: AppRole;
};

function normalizeOverallOrderStatus(statuses: ReadonlySet<SubmissionStatus>): SubmissionStatus {
  if (statuses.size === 0) return "unprocessed";
  if (statuses.size === 1) return statuses.values().next().value as SubmissionStatus;
  if (statuses.has("cancelled")) return "cancelled";
  if (statuses.has("unprocessed")) return "unprocessed";
  if (statuses.has("label_sent")) return "label_sent";
  if (statuses.has("paid")) return "paid";
  return statuses.values().next().value as SubmissionStatus;
}

function isStaffAuthUser(user: { app_metadata?: Record<string, unknown> | null }) {
  return parseAppRole(user.app_metadata ?? undefined) != null;
}

type Submission = {
  id: string;
  request_group_id: string | null;
  created_at: string;
  employee_full_name: string;
  client_full_name: string;
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
  with_insurance: boolean;
  insurance_fee: number;
  status: SubmissionStatus;
  commission_paid: boolean;
};

type SearchParams = {
  section?: string;
  tab?: string;
  order?: string;
  /** Commissions: pagination & filters */
  commissionPage?: string;
  commissionPageSize?: string;
  commissionFrom?: string;
  commissionTo?: string;
  commissionPaid?: string;
};

type AdminSection = "comptes" | "demandes" | "produits" | "incidents" | "commissions";

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
      /commission_paid|with_insurance|insurance_fee|request_group_id|customer_address|employee_full_name|client_full_name|client_city|device_imei|price_override_previous|price_override_reason|price_override_updated_at|price_override_updated_by|quantity|column.*does not exist/i.test(
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
      client_full_name: s.client_full_name,
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
      with_insurance: s.with_insurance,
      insurance_fee: s.insurance_fee,
      price_override_previous: s.price_override_previous ?? null,
      price_override_reason: s.price_override_reason ?? null,
      price_override_updated_at: s.price_override_updated_at ?? null,
      price_override_updated_by: s.price_override_updated_by ?? null,
      status: s.status,
      commission_paid: s.commission_paid,
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

const COMMISSIONS_DEFAULT_PAGE_SIZE = 20;

type GetCommissionsParams = {
  page: number;
  pageSize: number;
  fromDate: string;
  toDate: string;
  commissionPaid: "all" | "paid" | "unpaid";
};

type CommissionsResult = {
  submissions: Submission[];
  total: number;
  unpaidTotal: number;
  page: number;
  pageSize: number;
  fromDate: string;
  toDate: string;
  commissionPaid: "all" | "paid" | "unpaid";
};

async function getCommissionsPaginated(
  params: GetCommissionsParams,
): Promise<CommissionsResult> {
  const { createAdminClient } = await import("@/lib/supabase-server");
  const supabase = createAdminClient();

  let query = supabase
    .from("submissions")
    .select(SUBMISSIONS_SELECT_ADMIN_LIST, { count: "exact" })
    .order("created_at", { ascending: false });

  if (params.fromDate) {
    const fromIso = `${params.fromDate}T00:00:00.000Z`;
    query = query.gte("created_at", fromIso);
  }
  if (params.toDate) {
    const toIso = `${params.toDate}T23:59:59.999Z`;
    query = query.lte("created_at", toIso);
  }
  if (params.commissionPaid === "paid") {
    query = query.eq("commission_paid", true);
  } else if (params.commissionPaid === "unpaid") {
    query = query.eq("commission_paid", false);
  }

  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;
  const { data, error, count } = await query.range(from, to);

  if (error) {
    if (/commission_paid|with_insurance|insurance_fee|request_group_id|employee_full_name|client_full_name|client_city|device_imei|quantity|column.*does not exist/i.test(String(error.message))) {
      const fallbackQuery = supabase
        .from("submissions")
        .select(SUBMISSIONS_SELECT_ADMIN_LIST_PARTIAL, { count: "exact" })
        .order("created_at", { ascending: false });
      let fallback = fallbackQuery;
      if (params.fromDate) {
        fallback = fallback.gte("created_at", `${params.fromDate}T00:00:00.000Z`);
      }
      if (params.toDate) {
        fallback = fallback.lte("created_at", `${params.toDate}T23:59:59.999Z`);
      }
      const fallbackResult = await fallback.range(from, to);
      if (fallbackResult.error) {
        const legacyFallbackQuery = supabase
          .from("submissions")
          .select(SUBMISSIONS_SELECT_ADMIN_LIST_FALLBACK, { count: "exact" })
          .order("created_at", { ascending: false });
        let legacyFallback = legacyFallbackQuery;
        if (params.fromDate) {
          legacyFallback = legacyFallback.gte("created_at", `${params.fromDate}T00:00:00.000Z`);
        }
        if (params.toDate) {
          legacyFallback = legacyFallback.lte("created_at", `${params.toDate}T23:59:59.999Z`);
        }
        const legacyResult = await legacyFallback.range(from, to);
        if (legacyResult.error) {
          return {
            submissions: [],
            total: 0,
            unpaidTotal: 0,
            page: params.page,
            pageSize: params.pageSize,
            fromDate: params.fromDate,
            toDate: params.toDate,
            commissionPaid: "all",
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
            client_full_name: s.client_full_name,
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
            with_insurance: false,
            insurance_fee: 0,
            status: s.status,
            commission_paid: false,
          };
        });
        return {
          submissions: legacySubmissions,
          total: legacyResult.count ?? 0,
          unpaidTotal: legacyResult.count ?? 0,
          page: params.page,
          pageSize: params.pageSize,
          fromDate: params.fromDate,
          toDate: params.toDate,
          commissionPaid: "all",
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
          client_full_name: s.client_full_name,
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
          with_insurance: false,
          insurance_fee: 0,
          status: s.status,
          commission_paid: false,
        };
      });
      return {
        submissions,
        total: fallbackResult.count ?? 0,
        unpaidTotal: fallbackResult.count ?? 0,
        page: params.page,
        pageSize: params.pageSize,
        fromDate: params.fromDate,
        toDate: params.toDate,
        commissionPaid: "all",
      };
    }
    return {
      submissions: [],
      total: 0,
      unpaidTotal: 0,
      page: params.page,
      pageSize: params.pageSize,
      fromDate: params.fromDate,
      toDate: params.toDate,
      commissionPaid: params.commissionPaid,
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
      client_full_name: s.client_full_name,
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
      with_insurance: s.with_insurance,
      insurance_fee: s.insurance_fee,
      status: s.status,
      commission_paid: s.commission_paid,
    };
  });

  let unpaidTotal = 0;
  try {
    let unpaidQuery = supabase
      .from("submissions")
      .select("quantity")
      .eq("commission_paid", false);

    if (params.fromDate) {
      unpaidQuery = unpaidQuery.gte("created_at", `${params.fromDate}T00:00:00.000Z`);
    }
    if (params.toDate) {
      unpaidQuery = unpaidQuery.lte("created_at", `${params.toDate}T23:59:59.999Z`);
    }

    const unpaidResult = await unpaidQuery;
    if (!unpaidResult.error && unpaidResult.data) {
      unpaidTotal = unpaidResult.data.reduce((sum, row) => {
        const s = normalizeSubmissionRow(row as SubmissionRow);
        return sum + s.quantity;
      }, 0);
    } else if (
      unpaidResult.error &&
      /quantity|column.*does not exist/i.test(String(unpaidResult.error.message))
    ) {
      let countQuery = supabase
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .eq("commission_paid", false);
      if (params.fromDate) {
        countQuery = countQuery.gte("created_at", `${params.fromDate}T00:00:00.000Z`);
      }
      if (params.toDate) {
        countQuery = countQuery.lte("created_at", `${params.toDate}T23:59:59.999Z`);
      }
      const countResult = await countQuery;
      if (!countResult.error) {
        unpaidTotal = countResult.count ?? 0;
      }
    }
  } catch {
    unpaidTotal = 0;
  }

  return {
    submissions,
    total: count ?? 0,
    unpaidTotal,
    page: params.page,
    pageSize: params.pageSize,
    fromDate: params.fromDate,
    toDate: params.toDate,
    commissionPaid: params.commissionPaid,
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
    sp.section === "demandes" ||
    sp.section === "produits" ||
    sp.section === "incidents" ||
    sp.section === "commissions"
      ? sp.section
      : "demandes";

  if (requestedSection === "comptes" && admin.role !== "super_admin") {
    redirect("/admin?section=demandes");
  }

  const section = requestedSection;
  const tab = sp.tab === "brands" || sp.tab === "models" || sp.tab === "prices" ? sp.tab : "brands";
  const selectedOrder = typeof sp.order === "string" && sp.order.trim() !== "" ? sp.order.trim() : null;

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

  const [submissions, adminUsers, brands, models, prices, commissionsData] =
    await Promise.all([
      getSubmissions(),
      getAdminUsers(),
      getBrands(),
      getModels(),
      getPrices(),
      section === "commissions"
        ? getCommissionsPaginated({
            page: commissionPage,
            pageSize: commissionPageSize,
            fromDate: commissionFrom,
            toDate: commissionTo,
            commissionPaid,
          })
        : Promise.resolve(null),
    ]);

  const ordersById = new Map<
    string,
    {
      orderId: string;
      created_at: string;
      customer_name: string;
      customer_email: string;
      customer_phone: string;
      client_city: string;
      device_imei: string;
      employee_full_name: string;
      statuses: Set<SubmissionStatus>;
    }
  >();

  for (const s of submissions) {
    const orderId = s.request_group_id ?? s.id;
    const existing = ordersById.get(orderId);
    if (!existing) {
      ordersById.set(orderId, {
        orderId,
        created_at: s.created_at,
        customer_name: s.client_full_name || s.customer_name,
        customer_email: s.customer_email,
        customer_phone: s.customer_phone,
        client_city: s.client_city,
        device_imei: s.device_imei,
        employee_full_name: s.employee_full_name,
        statuses: new Set([s.status]),
      });
      continue;
    }

    if (s.created_at < existing.created_at) {
      existing.created_at = s.created_at;
    }

    if (!existing.employee_full_name && s.employee_full_name) {
      existing.employee_full_name = s.employee_full_name;
    }
    if (!existing.client_city && s.client_city) {
      existing.client_city = s.client_city;
    }
    if (!existing.device_imei && s.device_imei) {
      existing.device_imei = s.device_imei;
    }

    existing.statuses.add(s.status);
  }

  const orders = Array.from(ordersById.values()).map(({ statuses, ...order }) => ({
    ...order,
    status: normalizeOverallOrderStatus(statuses),
  }));

  const orderSubmissions =
    section === "demandes" && selectedOrder
      ? submissions.filter((s) => (s.request_group_id ?? s.id) === selectedOrder)
      : [];

  return (
    <AdminLayout
      submissions={submissions}
      orders={orders}
      selectedOrder={section === "demandes" ? selectedOrder : null}
      orderSubmissions={orderSubmissions}
      adminUsers={adminUsers}
      brands={brands}
      models={models}
      prices={prices}
      initialSection={section}
      initialProductsTab={tab}
      commissionsData={commissionsData}
      canManageStaffAccounts={admin.role === "super_admin"}
      viewerRole={admin.role}
    />
  );
}
