"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/contexts/I18nContext";
import { updateStorePettyCashOpening } from "../../actions/update-store-petty-cash-opening";
import type { CashflowOrphanRow, StoreCashflowRow } from "@/lib/petty-cash";

function money(n: number) {
  return `${n.toFixed(2)} $`;
}

export function StoreCashflowPanel({
  rows,
  orphans,
  canEditOpening,
}: {
  rows: StoreCashflowRow[];
  orphans: CashflowOrphanRow[];
  canEditOpening: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [errorById, setErrorById] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const openingSignature = rows.map((r) => `${r.id}:${r.openingBalance}`).join("|");
  const [draftById, setDraftById] = useState<Record<string, string>>(() =>
    Object.fromEntries(rows.map((r) => [r.id, String(r.openingBalance)])),
  );

  useEffect(() => {
    setDraftById(Object.fromEntries(rows.map((r) => [r.id, String(r.openingBalance)])));
  }, [openingSignature, rows]);

  function saveOpening(storeId: string) {
    const raw = (draftById[storeId] ?? "0").trim().replace(",", ".");
    const amount = parseFloat(raw);
    if (!Number.isFinite(amount) || amount < 0) {
      setErrorById((e) => ({
        ...e,
        [storeId]: t.admin.pettyCashInvalidAmount,
      }));
      return;
    }
    setErrorById((e) => {
      const next = { ...e };
      delete next[storeId];
      return next;
    });
    setSavingId(storeId);
    void (async () => {
      const res = await updateStorePettyCashOpening({ storeId, amount });
      setSavingId(null);
      if (!res.success) {
        setErrorById((e) => ({
          ...e,
          [storeId]: res.error ?? t.admin.pettyCashSaveError,
        }));
        return;
      }
      router.refresh();
    })();
  }

  return (
    <div className="space-y-8">
      <p className="max-w-3xl text-sm text-foreground/55">
        {t.admin.pettyCashSubtitle}
      </p>
      {canEditOpening ? (
        <p className="text-sm text-foreground/55">{t.admin.pettyCashEditHint}</p>
      ) : (
        <p className="text-sm text-foreground/55">{t.admin.pettyCashReadOnlyHint}</p>
      )}

      <div className="overflow-x-auto rounded-card border border-foreground/10 shadow-soft">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-foreground/10 bg-foreground/[0.03] text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground/60">
            <tr>
              <th className="px-4 py-3">{t.admin.pettyCashStoreColumn}</th>
              <th className="px-4 py-3">{t.admin.pettyCashOpeningLabel}</th>
              <th className="px-4 py-3">{t.admin.pettyCashBuybackOutLabel}</th>
              <th className="px-4 py-3">{t.admin.pettyCashBalanceLabel}</th>
              {canEditOpening ? <th className="px-4 py-3 w-[120px]" /> : null}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={canEditOpening ? 5 : 4}
                  className="px-4 py-8 text-center text-foreground/50"
                >
                  {t.admin.pettyCashNoStores}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-foreground/[0.06] last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-brand-dark">{row.name}</td>
                  <td className="px-4 py-3">
                    {canEditOpening ? (
                      <div className="flex flex-col gap-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={draftById[row.id] ?? ""}
                          onChange={(e) =>
                            setDraftById((d) => ({ ...d, [row.id]: e.target.value }))
                          }
                          className="w-full max-w-[140px] rounded-lg border border-foreground/15 bg-background px-2.5 py-1.5 text-sm"
                          aria-label={t.admin.pettyCashOpeningLabel}
                        />
                        {errorById[row.id] ? (
                          <span className="text-xs text-red-600">{errorById[row.id]}</span>
                        ) : null}
                      </div>
                    ) : (
                      money(row.openingBalance)
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-foreground/80">
                    {money(row.buybackOutflow)}
                  </td>
                  <td className="px-4 py-3 tabular-nums font-semibold text-brand-dark">
                    {money(row.balance)}
                  </td>
                  {canEditOpening ? (
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={savingId === row.id}
                        onClick={() => saveOpening(row.id)}
                        className="rounded-lg border border-brand-primary/40 bg-brand-primary/10 px-3 py-1.5 text-xs font-semibold text-brand-primary transition-colors hover:bg-brand-primary/18 disabled:opacity-50"
                      >
                        {t.admin.save}
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {orphans.length > 0 ? (
        <section className="rounded-card border border-amber-500/25 bg-amber-500/[0.06] p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-amber-900/80 dark:text-amber-200/90">
            {t.admin.pettyCashOrphansTitle}
          </h3>
          <p className="mb-3 text-sm text-foreground/65">{t.admin.pettyCashOrphansHint}</p>
          <ul className="space-y-1.5 text-sm">
            {orphans.map((o) => (
              <li
                key={o.storeName}
                className="flex justify-between gap-4 border-b border-foreground/10 pb-1.5 last:border-0"
              >
                <span className="text-foreground/80">{o.storeName}</span>
                <span className="shrink-0 tabular-nums font-medium">{money(o.total)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
