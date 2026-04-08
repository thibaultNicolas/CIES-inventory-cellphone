import { createAdminClient } from "@/lib/supabase-server";
import { DEFAULT_COMMISSION_RULES, type CommissionRule } from "@/lib/commission-policy";

type DbCommissionRule = {
  min_gross: number | string;
  max_gross: number | string | null;
  employee_commission: number | string;
  manager_commission: number | string;
  owner_commission: number | string;
  is_active?: boolean | null;
};

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return fallback;
}

export async function getActiveCommissionRules(): Promise<CommissionRule[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("commission_rules")
    .select("min_gross,max_gross,employee_commission,manager_commission,owner_commission,is_active")
    .eq("is_active", true)
    .order("min_gross", { ascending: true });

  if (error || !data?.length) {
    return DEFAULT_COMMISSION_RULES;
  }

  const rules = (data as DbCommissionRule[]).map((row) => ({
    minGross: Math.max(0, asNumber(row.min_gross, 0)),
    maxGross:
      row.max_gross == null ? null : Math.max(0, asNumber(row.max_gross, 0)),
    employeeCommission: Math.max(0, asNumber(row.employee_commission, 0)),
    managerCommission: Math.max(0, asNumber(row.manager_commission, 0)),
    ownerCommission: Math.max(0, asNumber(row.owner_commission, 0)),
  }));

  return rules.length ? rules : DEFAULT_COMMISSION_RULES;
}
