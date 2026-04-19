import { parseSubmissionLineQuantity } from "@/lib/submissions";

export type CommissionBreakdown = {
  employee: number;
  manager: number;
  owner: number;
  total: number;
};

export type CommissionRule = {
  minGross: number;
  maxGross: number | null;
  employeeCommission: number;
  managerCommission: number;
  ownerCommission: number;
};

export const DEFAULT_COMMISSION_RULES: CommissionRule[] = [
  { minGross: 0, maxGross: 0, employeeCommission: 0, managerCommission: 0, ownerCommission: 0 },
  { minGross: 0.01, maxGross: 99.99, employeeCommission: 5, managerCommission: 5, ownerCommission: 20 },
  { minGross: 100, maxGross: 249.99, employeeCommission: 5, managerCommission: 5, ownerCommission: 30 },
  { minGross: 250, maxGross: 449.99, employeeCommission: 5, managerCommission: 5, ownerCommission: 40 },
  { minGross: 450, maxGross: 649.99, employeeCommission: 5, managerCommission: 5, ownerCommission: 50 },
  { minGross: 650, maxGross: null, employeeCommission: 5, managerCommission: 5, ownerCommission: 60 },
];

/**
 * Business rules (per device, before scaling by quantity):
 * - Donation / zero-value unit price: no commission.
 * - Tiers use **unit gross** = unit buyback price (one phone).
 * - Employee / manager / owner amounts from the matched tier are then multiplied by line quantity.
 */
export function computeCommissionFromGross(
  grossAmount: number,
  rules: CommissionRule[] = DEFAULT_COMMISSION_RULES,
): CommissionBreakdown {
  const gross = Number.isFinite(grossAmount) ? grossAmount : 0;
  const ordered = [...rules].sort((a, b) => a.minGross - b.minGross);
  const match =
    ordered.find((r) => {
      if (gross < r.minGross) return false;
      return r.maxGross == null ? true : gross <= r.maxGross;
    }) ?? ordered[ordered.length - 1];

  if (!match) return { employee: 0, manager: 0, owner: 0, total: 0 };

  const employee = Math.max(0, match.employeeCommission);
  const manager = Math.max(0, match.managerCommission);
  const owner = Math.max(0, match.ownerCommission);

  return {
    employee,
    manager,
    owner,
    total: employee + manager + owner,
  };
}

/**
 * Commissions for one submission line: tier is chosen from **unit price** (one device),
 * then employee / manager / owner amounts are multiplied by **quantity**.
 */
export function computeCommissionForLineUnits(
  unitPrice: number,
  quantity: number | string | null | undefined,
  rules: CommissionRule[] = DEFAULT_COMMISSION_RULES,
): CommissionBreakdown {
  const units = parseSubmissionLineQuantity(quantity);
  const unit = Number.isFinite(unitPrice) ? unitPrice : 0;
  if (unit * units <= 0) {
    return { employee: 0, manager: 0, owner: 0, total: 0 };
  }

  const perUnit = computeCommissionFromGross(unit, rules);
  const employee = perUnit.employee * units;
  const manager = perUnit.manager * units;
  const owner = perUnit.owner * units;
  return {
    employee,
    manager,
    owner,
    total: employee + manager + owner,
  };
}
