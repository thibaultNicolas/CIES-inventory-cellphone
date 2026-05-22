import { reportDayEndIso, reportDayStartIso } from "@/lib/report-dates";

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
  not: (column: string, operator: string, value: string) => QueryLike;
};

function asQuery<T>(query: T): QueryLike {
  return query as unknown as QueryLike;
}

function fromQuery<T>(query: QueryLike): T {
  return query as unknown as T;
}

/** Exclut les demandes annulées des rapports et agrégats. */
export function excludeCancelledSubmissions<T>(query: T): T {
  return fromQuery<T>(asQuery(query).not("status", "in", "(cancelled)"));
}

/** Lignes « à recevoir » : commission non payée, hors annulées. */
export function applyReceivableFilters<T>(query: T): T {
  return fromQuery<T>(asQuery(excludeCancelledSubmissions(query)).eq("commission_paid", false));
}

export function applyCommissionFilters<T>(
  query: T,
  params: CommissionFilterParams,
): T {
  let q = asQuery(query);
  if (isValidDateInput(params.fromDate)) {
    q = q.gte("created_at", reportDayStartIso(params.fromDate));
  }
  if (isValidDateInput(params.toDate)) {
    q = q.lte("created_at", reportDayEndIso(params.toDate));
  }
  if (params.commissionPaid === "paid") {
    q = asQuery(excludeCancelledSubmissions(fromQuery<T>(q)));
    q = q.eq("commission_paid", true);
  } else if (params.commissionPaid === "unpaid") {
    q = asQuery(applyReceivableFilters(fromQuery<T>(q)));
  } else {
    q = asQuery(excludeCancelledSubmissions(fromQuery<T>(q)));
  }
  if (params.employeeFullName) {
    q = q.eq("employee_full_name", params.employeeFullName);
  }
  if (params.storeName) {
    q = q.eq("store_name", params.storeName);
  }
  return fromQuery<T>(q);
}
