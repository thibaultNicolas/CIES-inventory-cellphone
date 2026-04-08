"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { getCommissionRules, saveCommissionRules } from "../../actions/commission-rules";
import type { CommissionRule } from "@/lib/commission-policy";

function makeEmptyRule(): CommissionRule {
  return {
    minGross: 0,
    maxGross: null,
    employeeCommission: 5,
    managerCommission: 5,
    ownerCommission: 20,
  };
}

export function CommissionRulesManager() {
  const { t } = useI18n();
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const result = await getCommissionRules();
      if (!mounted) return;
      if (!result.success) {
        setError(result.error || t.admin.errorUpdate);
      } else {
        setRules(result.rules);
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [t.admin.errorUpdate]);

  const sortedRules = useMemo(
    () => [...rules].sort((a, b) => a.minGross - b.minGross),
    [rules],
  );

  const updateRule = (index: number, patch: Partial<CommissionRule>) => {
    setRules((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const addRule = () => setRules((prev) => [...prev, makeEmptyRule()]);
  const removeRule = (index: number) =>
    setRules((prev) => prev.filter((_, i) => i !== index));

  const save = async () => {
    setSaving(true);
    setError(null);
    const result = await saveCommissionRules({ rules: sortedRules });
    setSaving(false);
    if (!result.success) {
      setError(result.error || t.admin.errorUpdate);
      return;
    }
  };

  if (loading) {
    return (
      <div className="rounded-card border border-foreground/10 bg-background p-4 text-sm text-foreground/60">
        {t.admin.loadingCommissions}
      </div>
    );
  }

  return (
    <div className="rounded-card border border-foreground/10 bg-background p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground/80">
          {t.admin.commissionRulesTitle}
        </h3>
        <div className="flex items-center gap-2">
          {isOpen ? (
            <button
              type="button"
              onClick={addRule}
              className="rounded-card border border-foreground/20 px-3 py-1.5 text-xs"
            >
              + {t.admin.addRuleLabel}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="rounded-card border border-foreground/20 px-3 py-1.5 text-xs"
          >
            {isOpen ? t.admin.hideRulesLabel : t.admin.editRulesLabel}
          </button>
        </div>
      </div>

      {isOpen ? (
        <>
          <div className="mb-2 hidden grid-cols-6 gap-2 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground/60 md:grid">
            <span>{t.admin.commissionMinLabel}</span>
            <span>{t.admin.commissionMaxLabel}</span>
            <span>{t.admin.employeeCommission}</span>
            <span>{t.admin.managerCommission}</span>
            <span>{t.admin.ownerCommission}</span>
            <span>{t.admin.actions}</span>
          </div>
          <div className="space-y-2">
            {sortedRules.map((rule, index) => (
              <div
                key={`${rule.minGross}-${rule.maxGross ?? "open"}-${index}`}
                className="grid grid-cols-2 gap-2 rounded-card border border-foreground/10 p-3 md:grid-cols-6"
              >
                <input
                  type="number"
                  step="0.01"
                  value={rule.minGross}
                  onChange={(e) => updateRule(index, { minGross: Number(e.target.value) })}
                  className="rounded-card border border-foreground/15 px-2 py-1 text-xs"
                  placeholder={t.admin.commissionMinLabel}
                />
                <input
                  type="number"
                  step="0.01"
                  value={rule.maxGross ?? ""}
                  onChange={(e) =>
                    updateRule(index, {
                      maxGross: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                  className="rounded-card border border-foreground/15 px-2 py-1 text-xs"
                  placeholder={t.admin.commissionMaxLabel}
                />
                <input
                  type="number"
                  step="0.01"
                  value={rule.employeeCommission}
                  onChange={(e) =>
                    updateRule(index, { employeeCommission: Number(e.target.value) })
                  }
                  className="rounded-card border border-foreground/15 px-2 py-1 text-xs"
                  placeholder={t.admin.employeeCommission}
                />
                <input
                  type="number"
                  step="0.01"
                  value={rule.managerCommission}
                  onChange={(e) =>
                    updateRule(index, { managerCommission: Number(e.target.value) })
                  }
                  className="rounded-card border border-foreground/15 px-2 py-1 text-xs"
                  placeholder={t.admin.managerCommission}
                />
                <input
                  type="number"
                  step="0.01"
                  value={rule.ownerCommission}
                  onChange={(e) =>
                    updateRule(index, { ownerCommission: Number(e.target.value) })
                  }
                  className="rounded-card border border-foreground/15 px-2 py-1 text-xs"
                  placeholder={t.admin.ownerCommission}
                />
                <button
                  type="button"
                  onClick={() => removeRule(index)}
                  className="rounded-card border border-red-500/30 px-2 py-1 text-xs text-red-700"
                >
                  {t.admin.removeRuleLabel}
                </button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-xs text-foreground/60">{t.admin.rulesHiddenHint}</p>
      )}

      {error ? <p className="mt-3 text-xs text-red-600">{error}</p> : null}

      {isOpen ? (
        <div className="mt-4">
          <button
            type="button"
            disabled={saving}
            onClick={save}
            className="rounded-card border border-brand-primary/30 bg-brand-primary/10 px-4 py-2 text-xs font-medium text-brand-primary disabled:opacity-60"
          >
            {saving ? "…" : t.admin.save}
          </button>
        </div>
      ) : null}
    </div>
  );
}
