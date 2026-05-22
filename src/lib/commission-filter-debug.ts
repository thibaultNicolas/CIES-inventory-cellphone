import type { SupabaseClient } from "@supabase/supabase-js";
import {
  applyCommissionFilters,
  type CommissionFilterParams,
  type CommissionPaidFilter,
} from "@/lib/commission-filters";

export type CommissionFilterDebugSnapshot = {
  totals: {
    all: number;
    commissionPaidTrue: number;
    commissionPaidFalse: number;
    cancelled: number;
    receivableUnpaid: number;
  };
  activeFilter: {
    fromDate: string;
    toDate: string;
    commissionPaid: CommissionPaidFilter;
    employeeFullName: string;
    storeName: string;
  };
  matchedWithActiveFilter: number;
  note: string | null;
};

async function countSubmissions(
  supabase: SupabaseClient,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mutate?: (q: any) => any,
): Promise<number> {
  let q = supabase.from("submissions").select("id", { count: "exact", head: true });
  if (mutate) q = mutate(q);
  const { count, error } = await q;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function fetchCommissionFilterDebug(
  supabase: SupabaseClient,
  filter: CommissionFilterParams & {
    commissionPaid: CommissionPaidFilter;
    fromDate?: string;
    toDate?: string;
    employeeFullName?: string;
    storeName?: string;
  },
): Promise<CommissionFilterDebugSnapshot> {
  const all = await countSubmissions(supabase);
  const commissionPaidTrue = await countSubmissions(supabase, (q) =>
    q.eq("commission_paid", true),
  );
  const commissionPaidFalse = await countSubmissions(supabase, (q) =>
    q.eq("commission_paid", false),
  );
  const cancelled = await countSubmissions(supabase, (q) => q.eq("status", "cancelled"));
  const receivableUnpaid = await countSubmissions(supabase, (q) =>
    applyCommissionFilters(q, { commissionPaid: "unpaid" }),
  );

  const matchedWithActiveFilter = await countSubmissions(supabase, (q) =>
    applyCommissionFilters(q, {
      fromDate: filter.fromDate,
      toDate: filter.toDate,
      commissionPaid: filter.commissionPaid,
      employeeFullName: filter.employeeFullName,
      storeName: filter.storeName,
    }),
  );

  let note: string | null = null;
  if (
    filter.commissionPaid === "paid" &&
    commissionPaidTrue === 0 &&
    commissionPaidFalse > 0
  ) {
    note =
      "Aucune ligne avec commission_paid=true. Marquez « Commission payée » dans Demandes de rachat.";
  }

  return {
    totals: {
      all,
      commissionPaidTrue,
      commissionPaidFalse,
      cancelled,
      receivableUnpaid,
    },
    activeFilter: {
      fromDate: filter.fromDate ?? "",
      toDate: filter.toDate ?? "",
      commissionPaid: filter.commissionPaid,
      employeeFullName: filter.employeeFullName ?? "",
      storeName: filter.storeName ?? "",
    },
    matchedWithActiveFilter,
    note,
  };
}
