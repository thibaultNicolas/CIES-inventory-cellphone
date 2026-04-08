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

export function applyCommissionFilters<T>(
  query: T,
  params: CommissionFilterParams,
): T {
  let q = query as unknown as QueryLike;
  if (isValidDateInput(params.fromDate)) {
    q = q.gte("created_at", `${params.fromDate}T00:00:00.000Z`);
  }
  if (isValidDateInput(params.toDate)) {
    q = q.lte("created_at", `${params.toDate}T23:59:59.999Z`);
  }
  if (params.commissionPaid === "paid") {
    q = q.eq("commission_paid", true);
  } else if (params.commissionPaid === "unpaid") {
    q = q.eq("commission_paid", false);
  }
  if (params.employeeFullName) {
    q = q.eq("employee_full_name", params.employeeFullName);
  }
  if (params.storeName) {
    q = q.eq("store_name", params.storeName);
  }
  return q as unknown as T;
}
