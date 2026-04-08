"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-server";
import { DEFAULT_COMMISSION_RULES, type CommissionRule } from "@/lib/commission-policy";

type SaveCommissionRulesInput = {
  rules: CommissionRule[];
};

function normalizeRule(rule: CommissionRule): CommissionRule {
  const minGross = Number.isFinite(rule.minGross) ? Math.max(0, rule.minGross) : 0;
  const maxGross =
    rule.maxGross == null
      ? null
      : Number.isFinite(rule.maxGross)
        ? Math.max(0, rule.maxGross)
        : null;
  return {
    minGross,
    maxGross,
    employeeCommission: Number.isFinite(rule.employeeCommission)
      ? Math.max(0, rule.employeeCommission)
      : 0,
    managerCommission: Number.isFinite(rule.managerCommission)
      ? Math.max(0, rule.managerCommission)
      : 0,
    ownerCommission: Number.isFinite(rule.ownerCommission)
      ? Math.max(0, rule.ownerCommission)
      : 0,
  };
}

function validateRules(input: CommissionRule[]): string | null {
  if (!input.length) return "At least one rule is required.";
  const rules = [...input].map(normalizeRule).sort((a, b) => a.minGross - b.minGross);
  for (let i = 0; i < rules.length; i += 1) {
    const current = rules[i];
    if (current.maxGross != null && current.maxGross < current.minGross) {
      return `Rule ${i + 1}: max must be >= min.`;
    }
    const next = rules[i + 1];
    if (!next) continue;
    const currentMax = current.maxGross;
    if (currentMax == null) return "Open-ended rule must be the last one.";
    if (next.minGross <= currentMax) {
      return `Rules ${i + 1} and ${i + 2} overlap.`;
    }
  }
  return null;
}

export async function getCommissionRules() {
  const admin = await requireSuperAdmin();
  if (!admin) return { success: false, error: "Forbidden", rules: [] as CommissionRule[] };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("commission_rules")
    .select("id,min_gross,max_gross,employee_commission,manager_commission,owner_commission,is_active")
    .eq("is_active", true)
    .order("min_gross", { ascending: true });

  if (error) {
    if (/commission_rules|does not exist|relation/i.test(String(error.message))) {
      return { success: true, rules: DEFAULT_COMMISSION_RULES };
    }
    return { success: false, error: error.message, rules: [] as CommissionRule[] };
  }

  const rules =
    data?.map((r) => ({
      minGross: Number(r.min_gross ?? 0),
      maxGross: r.max_gross == null ? null : Number(r.max_gross),
      employeeCommission: Number(r.employee_commission ?? 0),
      managerCommission: Number(r.manager_commission ?? 0),
      ownerCommission: Number(r.owner_commission ?? 0),
    })) ?? DEFAULT_COMMISSION_RULES;

  return { success: true, rules };
}

export async function saveCommissionRules({ rules }: SaveCommissionRulesInput) {
  const admin = await requireSuperAdmin();
  if (!admin) return { success: false, error: "Forbidden" };

  const normalized = [...rules].map(normalizeRule).sort((a, b) => a.minGross - b.minGross);
  const validationError = validateRules(normalized);
  if (validationError) return { success: false, error: validationError };

  const supabase = createAdminClient();
  const disableOld = await supabase
    .from("commission_rules")
    .update({ is_active: false })
    .eq("is_active", true);

  if (disableOld.error && !/commission_rules|does not exist|relation/i.test(String(disableOld.error.message))) {
    return { success: false, error: disableOld.error.message };
  }

  const payload = normalized.map((rule, index) => ({
    min_gross: rule.minGross,
    max_gross: rule.maxGross,
    employee_commission: rule.employeeCommission,
    manager_commission: rule.managerCommission,
    owner_commission: rule.ownerCommission,
    sort_order: index + 1,
    is_active: true,
  }));

  const inserted = await supabase.from("commission_rules").insert(payload);
  if (inserted.error) {
    return { success: false, error: inserted.error.message };
  }

  revalidatePath("/admin");
  return { success: true };
}
