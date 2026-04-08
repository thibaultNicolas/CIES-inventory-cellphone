export type CommissionPaidFilter = "all" | "paid" | "unpaid";

export type CommissionFilterParams = {
  fromDate?: string;
  toDate?: string;
  commissionPaid?: CommissionPaidFilter;
  employeeFullName?: string;
  storeName?: string;
};

function isValidDateInput(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

type QueryLike = {
  gte: (column: string, value: string) => QueryLike;
  lte: (column: string, value: string) => QueryLike;
  eq: (column: string, value: string | boolean) => QueryLike;
};

export function applyCommissionFilters<T extends QueryLike>(
  query: T,
  params: CommissionFilterParams,
): T {
  let q = query;
  if (isValidDateInput(params.fromDate)) {
    q = q.gte("created_at", `${params.fromDate}T00:00:00.000Z`) as T;
  }
  if (isValidDateInput(params.toDate)) {
    q = q.lte("created_at", `${params.toDate}T23:59:59.999Z`) as T;
  }
  if (params.commissionPaid === "paid") {
    q = q.eq("commission_paid", true) as T;
  } else if (params.commissionPaid === "unpaid") {
    q = q.eq("commission_paid", false) as T;
  }
  if (params.employeeFullName) {
    q = q.eq("employee_full_name", params.employeeFullName) as T;
  }
  if (params.storeName) {
    q = q.eq("store_name", params.storeName) as T;
  }
  return q;
}
