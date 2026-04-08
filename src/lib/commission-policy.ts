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
 * Business rules:
 * - Donation / zero-value purchase: no commission.
 * - Employee: 5 CAD flat.
 * - Manager: 5 CAD flat.
 * - Owner by gross amount tiers (before commission).
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
