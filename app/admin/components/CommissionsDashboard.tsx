"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { StoreCashflowPanel } from "./StoreCashflowPanel";
import type { CashflowOrphanRow, StoreCashflowRow } from "@/lib/petty-cash";
import { useMemo, useState, useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useI18n } from "@/contexts/I18nContext";
import type { CommissionsData, CommissionReportAggregates } from "./AdminLayout";
import { submissionLineTotal } from "@/lib/submissions";
import {
  Filter,
  Smartphone,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Coins,
  FileDown,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
} from "recharts";

type PeriodPreset =
  | "all"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "3_months"
  | "6_months"
  | "this_year"
  | "custom";

type CommissionPaidFilter = "all" | "paid" | "unpaid";
type CommissionTypeFilter = "all" | "employee" | "manager" | "owner";

const PIE_COLORS = ["#0026FF", "#000072", "#4F6BFF"];

const EMPTY_AGG: CommissionReportAggregates = {
  totalUnits: 0,
  totalBuyback: 0,
  totalCommissionEmployee: 0,
  totalCommissionManager: 0,
  totalCommissionOwner: 0,
  totalCommission: 0,
  salesByMonth: [],
  topModels: [],
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function toDateInputValue(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfWeekMonday(date: Date) {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

function endOfWeekSunday(date: Date) {
  const start = startOfWeekMonday(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return endOfDay(end);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(date: Date) {
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return endOfDay(end);
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function startOfYear(date: Date) {
  return new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
}

function formatDate(dateString: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-CA" : "fr-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function buildCommissionsQuery(params: {
  page?: number;
  pageSize?: number;
  from?: string;
  to?: string;
  commissionPaid?: CommissionPaidFilter;
  employeeFullName?: string;
  storeName?: string;
  periodPreset?: PeriodPreset;
}) {
  const search = new URLSearchParams();
  search.set("section", "commissions");
  if (params.page != null) search.set("commissionPage", String(params.page));
  if (params.pageSize != null) search.set("commissionPageSize", String(params.pageSize));
  if (params.from) search.set("commissionFrom", params.from);
  if (params.to) search.set("commissionTo", params.to);
  if (params.commissionPaid && params.commissionPaid !== "all") {
    search.set("commissionPaid", params.commissionPaid);
  }
  if (params.employeeFullName) search.set("commissionEmployee", params.employeeFullName);
  if (params.storeName) search.set("commissionStore", params.storeName);
  return search.toString();
}

function buildCommissionsExportUrl(params: {
  scope: "filtered" | "all";
  from?: string;
  to?: string;
  commissionPaid?: CommissionPaidFilter;
  employeeFullName?: string;
  storeName?: string;
}) {
  const search = new URLSearchParams();
  search.set("scope", params.scope);
  if (params.scope === "filtered") {
    if (params.from) search.set("from", params.from);
    if (params.to) search.set("to", params.to);
    if (params.commissionPaid && params.commissionPaid !== "all") {
      search.set("commissionPaid", params.commissionPaid);
    }
    if (params.employeeFullName) search.set("employee", params.employeeFullName);
    if (params.storeName) search.set("store", params.storeName);
  }
  return `/admin/commissions/export?${search.toString()}`;
}

type CommissionsDashboardProps = {
  commissionsData: CommissionsData | null;
  commissionReportAggregates: CommissionReportAggregates | null;
  employees: { id: string; full_name: string }[];
  stores: { id: string; name: string }[];
  /** PDF réservé au super administrateur ; CSV reste disponible pour les admins. */
  canExportPdf?: boolean;
  cashflowSnapshot: { rows: StoreCashflowRow[]; orphans: CashflowOrphanRow[] };
  canEditPettyCash?: boolean;
};

export function CommissionsDashboard({
  commissionsData,
  commissionReportAggregates,
  employees,
  stores,
  canExportPdf = false,
  cashflowSnapshot,
  canEditPettyCash = false,
}: CommissionsDashboardProps) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [isPending, startTransition] = useTransition();
  const [commissionType, setCommissionType] = useState<CommissionTypeFilter>("all");

  const agg = commissionReportAggregates ?? EMPTY_AGG;

  const salesChartData = useMemo(() => {
    return agg.salesByMonth.map((row) => {
      const [y, m] = row.monthKey.split("-").map(Number);
      const label = new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(
        locale === "en" ? "en-CA" : "fr-CA",
        { month: "short", year: "numeric" },
      );
      return {
        ...row,
        label,
        buyback: Math.round(row.buyback * 100) / 100,
      };
    });
  }, [agg.salesByMonth, locale]);

  const commissionPieData = useMemo(
    () => [
      { name: t.admin.employeeCommission, value: agg.totalCommissionEmployee },
      { name: t.admin.managerCommission, value: agg.totalCommissionManager },
      { name: t.admin.ownerCommission, value: agg.totalCommissionOwner },
    ],
    [
      agg.totalCommissionEmployee,
      agg.totalCommissionManager,
      agg.totalCommissionOwner,
      t.admin.employeeCommission,
      t.admin.managerCommission,
      t.admin.ownerCommission,
    ],
  );

  const topModelsChart = useMemo(
    () =>
      [...agg.topModels]
        .slice(0, 10)
        .map((m) => ({
          ...m,
          labelShort: m.label.length > 42 ? `${m.label.slice(0, 40)}…` : m.label,
        }))
        .reverse(),
    [agg.topModels],
  );

  if (!commissionsData) {
    return (
      <div className="rounded-card border border-foreground/10 bg-background p-12 text-center text-foreground/60">
        {t.admin.reportLoading}
      </div>
    );
  }

  const {
    submissions,
    total,
    page,
    pageSize,
    fromDate,
    toDate,
    commissionPaid,
    employeeFullName,
    storeName,
  } = commissionsData;
  const employeeFilter = employeeFullName || "all";
  const storeFilter = storeName || "all";

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const commissionTotalForType =
    commissionType === "employee"
      ? agg.totalCommissionEmployee
      : commissionType === "manager"
        ? agg.totalCommissionManager
        : commissionType === "owner"
          ? agg.totalCommissionOwner
          : agg.totalCommission;

  const handleExportPdf = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const margin = 14;
    let y = 16;
    doc.setFontSize(15);
    doc.text(locale === "en" ? "Trade-in report" : "Rapport rachats", margin, y);
    y += 8;
    doc.setFontSize(10);
    const period =
      fromDate && toDate
        ? `${fromDate} – ${toDate}`
        : fromDate
          ? `${fromDate} →`
          : toDate
            ? `→ ${toDate}`
            : locale === "en"
              ? "All periods"
              : "Toutes periodes";
    doc.text(period, margin, y);
    y += 10;
    const lines = [
      `${locale === "en" ? "Units" : "Unites"}: ${agg.totalUnits}`,
      `${locale === "en" ? "Buyback" : "Rachats"}: ${agg.totalBuyback.toFixed(2)} $`,
      `${locale === "en" ? "Commissions" : "Commissions"}: ${agg.totalCommission.toFixed(2)} $`,
      `  ${locale === "en" ? "Employee" : "Employe"}: ${agg.totalCommissionEmployee.toFixed(2)} $`,
      `  ${locale === "en" ? "Manager" : "Gerant"}: ${agg.totalCommissionManager.toFixed(2)} $`,
      `  ${locale === "en" ? "Owner" : "Proprio"}: ${agg.totalCommissionOwner.toFixed(2)} $`,
    ];
    for (const line of lines) {
      doc.text(line, margin, y);
      y += 6;
      if (y > 270) {
        doc.addPage();
        y = 16;
      }
    }
    y += 4;
    doc.setFontSize(11);
    doc.text(
      locale === "en" ? "Top models (units)" : "Appareils les plus rachetes",
      margin,
      y,
    );
    y += 7;
    doc.setFontSize(9);
    for (const m of agg.topModels.slice(0, 10)) {
      const safe = m.label.replace(/[^\x00-\x7F]/g, "?");
      const txt = `${safe.slice(0, 52)}: ${m.units} / ${m.buyback.toFixed(0)} $`;
      doc.text(txt, margin, y);
      y += 5;
      if (y > 280) {
        doc.addPage();
        y = 16;
      }
    }
    doc.save(`rapport-rachats-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handlePeriodPreset = (preset: PeriodPreset) => {
    if (preset === "all") {
      const q = buildCommissionsQuery({
        page: 1,
        pageSize,
        commissionPaid,
        employeeFullName: employeeFilter === "all" ? undefined : employeeFilter,
        storeName: storeFilter === "all" ? undefined : storeFilter,
      });
      startTransition(() => {
        router.push(`/admin?${q}`);
      });
      return;
    }
    if (preset === "custom") return;

    const now = new Date();
    let from: Date;
    let to: Date;

    switch (preset) {
      case "this_week":
        from = startOfWeekMonday(now);
        to = now;
        break;
      case "last_week": {
        const lastWeekRef = addDays(now, -7);
        from = startOfWeekMonday(lastWeekRef);
        to = endOfWeekSunday(lastWeekRef);
        break;
      }
      case "this_month":
        from = startOfMonth(now);
        to = now;
        break;
      case "last_month": {
        const lastMonthRef = addMonths(now, -1);
        from = startOfMonth(lastMonthRef);
        to = endOfMonth(lastMonthRef);
        break;
      }
      case "3_months":
        from = startOfDay(addMonths(now, -3));
        to = now;
        break;
      case "6_months":
        from = startOfDay(addMonths(now, -6));
        to = now;
        break;
      case "this_year":
        from = startOfYear(now);
        to = now;
        break;
      default:
        return;
    }

    const q = buildCommissionsQuery({
      page: 1,
      pageSize,
      from: toDateInputValue(from),
      to: toDateInputValue(to),
      commissionPaid,
      employeeFullName: employeeFilter === "all" ? undefined : employeeFilter,
      storeName: storeFilter === "all" ? undefined : storeFilter,
    });
    startTransition(() => {
      router.push(`/admin?${q}`);
    });
  };

  const currentPeriodPreset = (): PeriodPreset => {
    if (!fromDate && !toDate) return "all";
    return "custom";
  };

  const handleCommissionPaidChange = (value: CommissionPaidFilter) => {
    const q = buildCommissionsQuery({
      page: 1,
      pageSize,
      from: fromDate || undefined,
      to: toDate || undefined,
      commissionPaid: value,
      employeeFullName: employeeFilter === "all" ? undefined : employeeFilter,
      storeName: storeFilter === "all" ? undefined : storeFilter,
    });
    startTransition(() => {
      router.push(`/admin?${q}`);
    });
  };

  const handleFromDateChange = (value: string) => {
    const q = buildCommissionsQuery({
      page: 1,
      pageSize,
      from: value || undefined,
      to: toDate || undefined,
      commissionPaid,
      employeeFullName: employeeFilter === "all" ? undefined : employeeFilter,
      storeName: storeFilter === "all" ? undefined : storeFilter,
    });
    startTransition(() => {
      router.push(`/admin?${q}`);
    });
  };

  const handleToDateChange = (value: string) => {
    const q = buildCommissionsQuery({
      page: 1,
      pageSize,
      from: fromDate || undefined,
      to: value || undefined,
      commissionPaid,
      employeeFullName: employeeFilter === "all" ? undefined : employeeFilter,
      storeName: storeFilter === "all" ? undefined : storeFilter,
    });
    startTransition(() => {
      router.push(`/admin?${q}`);
    });
  };

  const handleEmployeeFilterChange = (value: string) => {
    const q = buildCommissionsQuery({
      page: 1,
      pageSize,
      from: fromDate || undefined,
      to: toDate || undefined,
      commissionPaid,
      employeeFullName: value === "all" ? undefined : value,
      storeName: storeFilter === "all" ? undefined : storeFilter,
    });
    startTransition(() => {
      router.push(`/admin?${q}`);
    });
  };

  const handleStoreFilterChange = (value: string) => {
    const q = buildCommissionsQuery({
      page: 1,
      pageSize,
      from: fromDate || undefined,
      to: toDate || undefined,
      commissionPaid,
      employeeFullName: employeeFilter === "all" ? undefined : employeeFilter,
      storeName: value === "all" ? undefined : value,
    });
    startTransition(() => {
      router.push(`/admin?${q}`);
    });
  };

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="space-y-6">
      {isPending ? (
        <div className="rounded-card border border-brand-primary/25 bg-brand-primary/8 px-4 py-2 text-xs font-medium text-brand-primary">
          {t.admin.reportLoading}
        </div>
      ) : null}
      <section className="space-y-3 rounded-card border border-foreground/10 bg-background p-4 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-foreground/70">
            {t.admin.filters}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            {canExportPdf ? (
              <button
                type="button"
                onClick={() => void handleExportPdf()}
                className="inline-flex items-center gap-1.5 rounded-card border border-foreground/20 px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:bg-foreground/5"
              >
                <FileDown className="h-3.5 w-3.5" />
                {t.admin.exportPdfLabel}
              </button>
            ) : null}
            <a
              href={buildCommissionsExportUrl({
                scope: "filtered",
                from: fromDate || undefined,
                to: toDate || undefined,
                commissionPaid,
                employeeFullName: employeeFilter === "all" ? undefined : employeeFilter,
                storeName: storeFilter === "all" ? undefined : storeFilter,
              })}
              className="rounded-card border border-foreground/20 px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:bg-foreground/5"
            >
              {t.admin.exportFilteredCsvLabel}
            </a>
            <a
              href={buildCommissionsExportUrl({ scope: "all" })}
              className="rounded-card border border-foreground/20 px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:bg-foreground/5"
            >
              {t.admin.exportAllCsvLabel}
            </a>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 shrink-0 text-foreground/60" />
            <span className="text-sm font-medium text-foreground/70">
              {t.admin.filterByPaymentStatus}
            </span>
          </div>
          <select
            value={commissionPaid}
            onChange={(e) => handleCommissionPaidChange(e.target.value as CommissionPaidFilter)}
            disabled={isPending}
            className="rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-3 text-sm text-foreground transition-all focus:border-brand-primary focus:bg-background focus:outline-none"
            aria-label={t.admin.filterByPaymentStatus}
          >
            <option value="all">{t.admin.all}</option>
            <option value="paid">{t.admin.paid}</option>
            <option value="unpaid">{t.admin.unpaid}</option>
          </select>
          <span className="text-sm font-medium text-foreground/70">
            {t.admin.employeeFullName}
          </span>
          <select
            value={employeeFilter}
            onChange={(e) => handleEmployeeFilterChange(e.target.value)}
            disabled={isPending}
            className="rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-3 text-sm text-foreground transition-all focus:border-brand-primary focus:bg-background focus:outline-none"
          >
            <option value="all">{t.admin.all}</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.full_name}>
                {employee.full_name}
              </option>
            ))}
          </select>
          <span className="text-sm font-medium text-foreground/70">{t.admin.storeNameLabel}</span>
          <select
            value={storeFilter}
            onChange={(e) => handleStoreFilterChange(e.target.value)}
            disabled={isPending}
            className="rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-3 text-sm text-foreground transition-all focus:border-brand-primary focus:bg-background focus:outline-none"
          >
            <option value="all">{t.admin.all}</option>
            {stores.map((store) => (
              <option key={store.id} value={store.name}>
                {store.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-foreground/15 pt-3 sm:gap-4">
          <span className="text-sm font-medium text-foreground/70">{t.admin.period}</span>
          <select
            value={currentPeriodPreset()}
            onChange={(e) => handlePeriodPreset(e.target.value as PeriodPreset)}
            disabled={isPending}
            className="rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-3 text-sm text-foreground transition-all focus:border-brand-primary focus:bg-background focus:outline-none"
          >
            <option value="all">{t.admin.allPeriods}</option>
            <option value="this_week">{t.admin.thisWeek}</option>
            <option value="last_week">{t.admin.lastWeek}</option>
            <option value="this_month">{t.admin.thisMonth}</option>
            <option value="last_month">{t.admin.lastMonth}</option>
            <option value="3_months">{t.admin.threeMonths}</option>
            <option value="6_months">{t.admin.sixMonths}</option>
            <option value="this_year">{t.admin.thisYear}</option>
            <option value="custom">{t.admin.custom}</option>
          </select>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => handleFromDateChange(e.target.value)}
            disabled={isPending}
            className="rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-3 text-sm text-foreground transition-all focus:border-brand-primary focus:bg-background focus:outline-none"
            aria-label={t.admin.startDate}
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => handleToDateChange(e.target.value)}
            disabled={isPending}
            className="rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-3 text-sm text-foreground transition-all focus:border-brand-primary focus:bg-background focus:outline-none"
            aria-label={t.admin.endDate}
          />
          <span className="text-sm font-medium text-foreground/70">{t.admin.commissionTypeLabel}</span>
          <select
            value={commissionType}
            onChange={(e) => setCommissionType(e.target.value as CommissionTypeFilter)}
            disabled={isPending}
            className="rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-3 text-sm text-foreground transition-all focus:border-brand-primary focus:bg-background focus:outline-none"
          >
            <option value="all">{t.admin.allCommissionsLabel}</option>
            <option value="employee">{t.admin.employeeCommission}</option>
            <option value="manager">{t.admin.managerCommission}</option>
            <option value="owner">{t.admin.ownerCommission}</option>
          </select>
        </div>
      </section>

      <section className="space-y-3 rounded-card border border-foreground/10 bg-background p-4 shadow-soft">
        <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-foreground/70">
          {t.admin.reportStatsSectionTitle}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-card border border-foreground/10 bg-background p-4 shadow-soft">
            <div className="flex items-center gap-2 text-foreground/60">
              <Smartphone className="h-5 w-5" />
              <span className="text-sm font-medium">{t.admin.devicesFilter}</span>
            </div>
            <p className="mt-2 font-(family-name:--font-playfair) text-3xl font-light text-brand-dark">
              {agg.totalUnits}
            </p>
          </div>
          <div className="rounded-card border border-foreground/10 bg-background p-4 shadow-soft">
            <div className="flex items-center gap-2 text-foreground/60">
              <Coins className="h-5 w-5" />
              <span className="text-sm font-medium">{t.admin.reportStatBuybackLabel}</span>
            </div>
            <p className="mt-2 font-(family-name:--font-playfair) text-3xl font-light text-brand-dark">
              {agg.totalBuyback.toFixed(2)} $
            </p>
          </div>
          <div className="rounded-card border border-foreground/10 bg-background p-4 shadow-soft">
            <div className="flex items-center gap-2 text-foreground/60">
              <Coins className="h-5 w-5" />
              <span className="text-sm font-medium">{t.admin.commissionAmount}</span>
            </div>
            <p className="mt-2 font-(family-name:--font-playfair) text-3xl font-light text-brand-dark">
              {commissionTotalForType.toFixed(2)} $
            </p>
          </div>
          <div className="rounded-card border border-foreground/10 bg-background p-4 shadow-soft">
            <div className="flex items-center gap-2 text-foreground/60">
              <Coins className="h-5 w-5" />
              <span className="text-sm font-medium">{t.admin.employeeCommission}</span>
            </div>
            <p className="mt-2 font-(family-name:--font-playfair) text-3xl font-light text-brand-dark">
              {agg.totalCommissionEmployee.toFixed(2)} $
            </p>
          </div>
          <div className="rounded-card border border-foreground/10 bg-background p-4 shadow-soft">
            <div className="flex items-center gap-2 text-foreground/60">
              <Coins className="h-5 w-5" />
              <span className="text-sm font-medium">{t.admin.managerCommission}</span>
            </div>
            <p className="mt-2 font-(family-name:--font-playfair) text-3xl font-light text-brand-dark">
              {agg.totalCommissionManager.toFixed(2)} $
            </p>
          </div>
          <div className="rounded-card border border-foreground/10 bg-background p-4 shadow-soft">
            <div className="flex items-center gap-2 text-foreground/60">
              <Coins className="h-5 w-5" />
              <span className="text-sm font-medium">{t.admin.ownerCommission}</span>
            </div>
            <p className="mt-2 font-(family-name:--font-playfair) text-3xl font-light text-brand-dark">
              {agg.totalCommissionOwner.toFixed(2)} $
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-card border border-foreground/10 bg-background p-4 shadow-soft">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-foreground/70">
            {t.admin.pettyCashReportSectionTitle}
          </h3>
          <Link
            href="/admin?section=caisse"
            className="text-xs font-medium text-brand-primary underline-offset-2 hover:underline"
          >
            {t.admin.pettyCashFullPageLink}
          </Link>
        </div>
        <StoreCashflowPanel
          rows={cashflowSnapshot.rows}
          orphans={cashflowSnapshot.orphans}
          canEditOpening={canEditPettyCash}
        />
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-foreground/70">
          {t.admin.reportChartsSectionTitle}
        </h3>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-card border border-foreground/10 bg-background p-4 shadow-soft">
            <h4 className="mb-3 text-xs font-semibold text-foreground/80">
              {t.admin.reportChartSalesByMonth}
            </h4>
            {salesChartData.length === 0 ? (
              <p className="py-12 text-center text-sm text-foreground/50">{t.admin.noDevicesForPeriod}</p>
            ) : (
              <div className="h-[280px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={salesChartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-foreground/10" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} className="fill-foreground/60" />
                    <YAxis
                      yAxisId="buyback"
                      orientation="left"
                      tick={{ fontSize: 11 }}
                      className="fill-foreground/60"
                    />
                    <YAxis
                      yAxisId="units"
                      orientation="right"
                      tick={{ fontSize: 11 }}
                      className="fill-foreground/60"
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid rgba(0,0,0,0.08)",
                      }}
                    />
                    <Legend />
                    <Bar
                      yAxisId="buyback"
                      dataKey="buyback"
                      name={t.admin.reportAxisBuyback}
                      fill="#0026FF"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      yAxisId="units"
                      dataKey="units"
                      name={t.admin.reportAxisUnits}
                      fill="#4F6BFF"
                      radius={[4, 4, 0, 0]}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="rounded-card border border-foreground/10 bg-background p-4 shadow-soft">
            <h4 className="mb-3 text-xs font-semibold text-foreground/80">
              {t.admin.reportChartCommissionByType}
            </h4>
            {agg.totalCommission <= 0 ? (
              <p className="py-12 text-center text-sm text-foreground/50">{t.admin.noDevicesForPeriod}</p>
            ) : (
              <div className="h-[280px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={commissionPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ name, percent }) =>
                        `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
                      }
                    >
                      {commissionPieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => [
                        `${Number(v ?? 0).toFixed(2)} $`,
                        t.admin.commissionAmount,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="rounded-card border border-foreground/10 bg-background p-4 shadow-soft lg:col-span-2">
            <h4 className="mb-3 text-xs font-semibold text-foreground/80">
              {t.admin.reportChartTopModels}
            </h4>
            {topModelsChart.length === 0 ? (
              <p className="py-12 text-center text-sm text-foreground/50">{t.admin.noDevicesForPeriod}</p>
            ) : (
              <div className="h-[320px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={topModelsChart}
                    margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-foreground/10" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="labelShort"
                      width={148}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip />
                    <Bar dataKey="units" name={t.admin.reportAxisUnits} fill="#0026FF" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-foreground/70">
          {t.admin.reportTableTitle}
        </h3>
        <div className="overflow-x-auto rounded-card border border-foreground/10 bg-background shadow-soft">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow>
                <TableHead className="px-3 sm:px-6">{t.admin.date}</TableHead>
                <TableHead className="px-3 sm:px-6">{t.admin.client}</TableHead>
                <TableHead className="px-3 sm:px-6">{t.admin.device}</TableHead>
                <TableHead className="px-3 text-center sm:px-6">{t.admin.quantity}</TableHead>
                <TableHead className="px-3 sm:px-6">{t.admin.price}</TableHead>
                <TableHead className="px-3 sm:px-6">{t.admin.employeeCommission}</TableHead>
                <TableHead className="px-3 sm:px-6">{t.admin.managerCommission}</TableHead>
                <TableHead className="px-3 sm:px-6">{t.admin.ownerCommission}</TableHead>
                <TableHead className="px-3 text-center sm:px-6">{t.admin.commissionPaid}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="px-3 py-8 text-center text-foreground/60 sm:px-6">
                    {t.admin.noDevicesForPeriod}
                  </TableCell>
                </TableRow>
              ) : (
                submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="whitespace-nowrap px-3 py-3 text-sm text-foreground/70 sm:px-6 sm:py-4">
                      {formatDate(submission.created_at, locale)}
                    </TableCell>
                    <TableCell className="px-3 py-3 font-medium text-foreground sm:px-6 sm:py-4">
                      {submission.client_full_name || submission.customer_name}
                    </TableCell>
                    <TableCell className="px-3 py-3 sm:px-6 sm:py-4">
                      <span className="text-foreground/80">
                        {submission.brand_name} {submission.model_name}
                      </span>
                      <span className="ml-1 text-xs text-foreground/60">
                        {submission.memory} – {submission.condition}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 py-3 text-center text-sm text-foreground sm:px-6 sm:py-4">
                      {submission.quantity}
                    </TableCell>
                    <TableCell className="px-3 py-3 font-medium text-brand-primary sm:px-6 sm:py-4">
                      {submissionLineTotal(submission.price, submission.quantity).toFixed(2)} $
                    </TableCell>
                    <TableCell className="px-3 py-3 font-medium text-foreground sm:px-6 sm:py-4">
                      {Number(submission.commission_employee ?? 0).toFixed(2)} $
                    </TableCell>
                    <TableCell className="px-3 py-3 font-medium text-foreground sm:px-6 sm:py-4">
                      {Number(submission.commission_manager ?? 0).toFixed(2)} $
                    </TableCell>
                    <TableCell className="px-3 py-3 font-medium text-foreground sm:px-6 sm:py-4">
                      {Number(submission.commission_owner ?? 0).toFixed(2)} $
                    </TableCell>
                    <TableCell className="px-3 py-3 text-center sm:px-6 sm:py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-card border-2 px-3 py-2 text-sm font-medium ${
                          submission.commission_paid
                            ? "border-green-500/50 bg-green-500/10 text-green-700"
                            : "border-foreground/20 bg-foreground/5 text-foreground/70"
                        }`}
                      >
                        {submission.commission_paid ? (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            {t.admin.yes}
                          </>
                        ) : (
                          <>
                            <Clock className="h-4 w-4" />
                            {t.admin.no}
                          </>
                        )}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-foreground/10 px-3 py-3 sm:gap-4 sm:px-4">
              <p className="text-sm text-foreground/60">
                {total > 0 ? (
                  <>
                    Affichage {from}–{to} sur {total}
                  </>
                ) : (
                  "Aucun résultat"
                )}
              </p>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin?${buildCommissionsQuery({
                    page: page - 1,
                    pageSize,
                    from: fromDate || undefined,
                    to: toDate || undefined,
                    commissionPaid,
                    employeeFullName: employeeFilter === "all" ? undefined : employeeFilter,
                    storeName: storeFilter === "all" ? undefined : storeFilter,
                  })}`}
                  className={`inline-flex items-center gap-1 rounded-card border-2 px-3 py-2 text-sm font-medium transition-all ${
                    page <= 1
                      ? "pointer-events-none border-foreground/10 text-foreground/40"
                      : "border-foreground/20 text-foreground hover:bg-foreground/5"
                  }`}
                  aria-disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Précédent
                </Link>
                <span className="px-2 text-sm text-foreground/70">
                  Page {page} / {totalPages}
                </span>
                <Link
                  href={`/admin?${buildCommissionsQuery({
                    page: page + 1,
                    pageSize,
                    from: fromDate || undefined,
                    to: toDate || undefined,
                    commissionPaid,
                    employeeFullName: employeeFilter === "all" ? undefined : employeeFilter,
                    storeName: storeFilter === "all" ? undefined : storeFilter,
                  })}`}
                  className={`inline-flex items-center gap-1 rounded-card border-2 px-3 py-2 text-sm font-medium transition-all ${
                    page >= totalPages
                      ? "pointer-events-none border-foreground/10 text-foreground/40"
                      : "border-foreground/20 text-foreground hover:bg-foreground/5"
                  }`}
                  aria-disabled={page >= totalPages}
                >
                  Suivant
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
