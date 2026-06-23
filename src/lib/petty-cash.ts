import type { SubmissionStatus } from "@/lib/submissions";
import { submissionLineTotal } from "@/lib/submissions";

export type StoreCashflowRow = {
  id: string;
  name: string;
  openingBalance: number;
  addedTotal: number;
  totalInflow: number;
  buybackOutflow: number;
  balance: number;
};

export type CashflowOrphanRow = { storeName: string; total: number };

/**
 * Lignes par magasin actif + totaux « orphelins » (store_name inconnu au référentiel).
 */
export function buildStoreCashflowSnapshot(
  submissions: ReadonlyArray<{
    store_name: string | null | undefined;
    price: number;
    quantity: number;
    status: SubmissionStatus;
  }>,
  stores: ReadonlyArray<{
    id: string;
    name: string;
    petty_cash_opening_balance: number;
    petty_cash_added_total: number;
  }>,
): { rows: StoreCashflowRow[]; orphans: CashflowOrphanRow[] } {
  const outflow = buybackOutflowByStoreName(submissions);
  const known = new Set(stores.map((s) => s.name.trim()));
  const rows: StoreCashflowRow[] = stores.map((store) => {
    const spent = outflow.get(store.name.trim()) ?? 0;
    const opening = Number(store.petty_cash_opening_balance ?? 0);
    const added = Number(store.petty_cash_added_total ?? 0);
    const totalInflow = opening + added;
    return {
      id: store.id,
      name: store.name,
      openingBalance: opening,
      addedTotal: added,
      totalInflow,
      buybackOutflow: spent,
      balance: totalInflow - spent,
    };
  });
  const orphans: CashflowOrphanRow[] = [];
  for (const [storeName, total] of outflow) {
    if (!known.has(storeName)) orphans.push({ storeName, total });
  }
  orphans.sort((a, b) => b.total - a.total);
  return { rows, orphans };
}

/**
 * Somme des montants de rachat (prix × quantité, sans commissions) par `store_name`,
 * pour les lignes non annulées.
 *
 * Note: la sortie de petite caisse correspond au moment où le magasin paie le client
 * (au rachat), pas au paiement de la commission par achetetoncell. On ne filtre donc
 * PAS sur `commission_paid` — seules les demandes annulées sont exclues, ce qui est
 * cohérent avec le total des rachats du rapport (`globalYearBuybackTotal`).
 */
export function buybackOutflowByStoreName(
  submissions: ReadonlyArray<{
    store_name: string | null | undefined;
    price: number;
    quantity: number;
    status: SubmissionStatus;
  }>,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const s of submissions) {
    const name = typeof s.store_name === "string" ? s.store_name.trim() : "";
    if (!name || s.status === "cancelled") continue;
    const line = submissionLineTotal(s.price, s.quantity);
    map.set(name, (map.get(name) ?? 0) + line);
  }
  return map;
}
