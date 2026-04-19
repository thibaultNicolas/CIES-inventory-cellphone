/**
 * Carte type « stats » pour l’onglet Rapport (titres en capitales, lignes label / valeur, total en accent).
 */
export type ReportStatsPanelRow = {
  label: string;
  value: string;
};

type ReportStatsPanelProps = {
  title: string;
  rows: ReportStatsPanelRow[];
  total: { label: string; value: string };
  /** Texte sous le total (ex. mention du rachat à titre indicatif). */
  totalHint?: string;
  className?: string;
};

export function ReportStatsPanel({
  title,
  rows,
  total,
  totalHint,
  className = "",
}: ReportStatsPanelProps) {
  return (
    <section
      className={`w-full max-w-[520px] shrink-0 rounded-2xl border border-foreground/10 bg-background p-5 shadow-soft lg:flex-1 ${className}`.trim()}
    >
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-foreground/70">
        {title}
      </h3>
      <div className="space-y-2.5 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4">
            <span className="text-foreground/55">{row.label}</span>
            <span className="shrink-0 font-semibold tabular-nums text-brand-dark">{row.value}</span>
          </div>
        ))}
        <div className="border-t border-foreground/10 pt-3">
          <div className="flex items-center justify-between gap-4">
            <span className="text-foreground/70">{total.label}</span>
            <span className="shrink-0 font-semibold tabular-nums text-brand-primary">{total.value}</span>
          </div>
          {totalHint ? (
            <p className="mt-2 text-[11px] leading-snug text-foreground/50">{totalHint}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
