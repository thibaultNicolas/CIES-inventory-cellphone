"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { updateCommissionPaid } from "../../actions/update-commission-paid";
import { useI18n } from "@/contexts/I18nContext";
import type { CommissionsData } from "./AdminLayout";
import { submissionLineTotal } from "@/lib/submissions";
import { Filter, Smartphone, CheckCircle, Clock, ChevronLeft, ChevronRight, Coins } from "lucide-react";

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
  employees: { id: string; full_name: string }[];
  stores: { id: string; name: string }[];
  /** Basculer payé / non payé : super_admin uniquement. */
  canManageCommissionPaid?: boolean;
};

export function CommissionsDashboard({
  commissionsData,
  employees,
  stores,
  canManageCommissionPaid = false,
}: CommissionsDashboardProps) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [isPending, startTransition] = useTransition();

  if (!commissionsData) {
    return (
      <div className="rounded-card border border-foreground/10 bg-background p-12 text-center text-foreground/60">
        {t.admin.loadingCommissions}
      </div>
    );
  }

  const {
    submissions,
    total,
    unpaidTotal,
    unpaidEmployeeTotal,
    unpaidManagerTotal,
    unpaidOwnerTotal,
    page,
    pageSize,
    fromDate,
    toDate,
    commissionPaid,
    employeeFullName,
    storeName,
  } = commissionsData;
  const [commissionType, setCommissionType] = useState<CommissionTypeFilter>("all");
  const employeeFilter = employeeFullName || "all";
  const storeFilter = storeName || "all";

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const commissionAmountForPeriod =
    commissionType === "employee"
      ? unpaidEmployeeTotal
      : commissionType === "manager"
        ? unpaidManagerTotal
        : commissionType === "owner"
          ? unpaidOwnerTotal
          : unpaidTotal;
  const paidOnPage = submissions.filter((s) => s.commission_paid).length;
  const unpaidOnPage = submissions.length - paidOnPage;
  const employeeOnPage = submissions.reduce(
    (sum, s) => sum + Number(s.commission_employee ?? 0),
    0,
  );
  const managerOnPage = submissions.reduce(
    (sum, s) => sum + Number(s.commission_manager ?? 0),
    0,
  );
  const ownerOnPage = submissions.reduce(
    (sum, s) => sum + Number(s.commission_owner ?? 0),
    0,
  );

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

  const handleTogglePaid = async (submissionId: string, current: boolean) => {
    const result = await updateCommissionPaid({
      submissionId,
      commissionPaid: !current,
    });
    if (result.success) {
      router.refresh();
    } else {
      alert(t.admin.errorUpdate);
    }
  };

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="space-y-6">
      {isPending ? (
        <div className="rounded-card border border-brand-primary/25 bg-brand-primary/8 px-4 py-2 text-xs font-medium text-brand-primary">
          {t.admin.loadingCommissions}
        </div>
      ) : null}
      <section className="space-y-3 rounded-card border border-foreground/10 bg-background p-4 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-foreground/70">
            Filtres
          </h3>
          <div className="flex flex-wrap items-center gap-2">
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
            <span className="text-sm font-medium text-foreground/70">{t.admin.commissionLabel}</span>
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
          Stats
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="rounded-card border border-foreground/10 bg-background p-4 shadow-soft">
          <div className="flex items-center gap-2 text-foreground/60">
            <Smartphone className="h-5 w-5" />
            <span className="text-sm font-medium">{t.admin.devicesFilter}</span>
          </div>
          <p className="mt-2 font-(family-name:--font-playfair) text-3xl font-light text-brand-dark">
            {total}
          </p>
        </div>
        <div className="rounded-card border border-foreground/10 bg-background p-4 shadow-soft">
          <div className="flex items-center gap-2 text-foreground/60">
            <Coins className="h-5 w-5" />
            <span className="text-sm font-medium">{t.admin.commissionAmount}</span>
          </div>
          <p className="mt-2 font-(family-name:--font-playfair) text-3xl font-light text-brand-dark">
            {commissionAmountForPeriod.toFixed(2)} $
          </p>
        </div>
        <div className="rounded-card border border-foreground/10 bg-background p-4 shadow-soft">
          <div className="flex items-center gap-2 text-foreground/60">
            <Coins className="h-5 w-5" />
            <span className="text-sm font-medium">{t.admin.employeeCommission}</span>
          </div>
          <p className="mt-2 font-(family-name:--font-playfair) text-3xl font-light text-brand-dark">
            {employeeOnPage.toFixed(2)} $
          </p>
        </div>
        <div className="rounded-card border border-foreground/10 bg-background p-4 shadow-soft">
          <div className="flex items-center gap-2 text-foreground/60">
            <Coins className="h-5 w-5" />
            <span className="text-sm font-medium">{t.admin.managerCommission}</span>
          </div>
          <p className="mt-2 font-(family-name:--font-playfair) text-3xl font-light text-brand-dark">
            {managerOnPage.toFixed(2)} $
          </p>
        </div>
        <div className="rounded-card border border-foreground/10 bg-background p-4 shadow-soft">
          <div className="flex items-center gap-2 text-foreground/60">
            <Coins className="h-5 w-5" />
            <span className="text-sm font-medium">{t.admin.ownerCommission}</span>
          </div>
          <p className="mt-2 font-(family-name:--font-playfair) text-3xl font-light text-brand-dark">
            {ownerOnPage.toFixed(2)} $
          </p>
        </div>
        <div className="rounded-card border border-foreground/10 bg-background p-4 shadow-soft">
          <div className="flex items-center gap-2 text-foreground/60">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium">{t.admin.commissionPaidPage}</span>
          </div>
          <p className="mt-2 font-(family-name:--font-playfair) text-3xl font-light text-green-700">
            {paidOnPage}
          </p>
        </div>
        <div className="rounded-card border border-foreground/10 bg-background p-4 shadow-soft">
          <div className="flex items-center gap-2 text-foreground/60">
            <Clock className="h-5 w-5 text-amber-600" />
            <span className="text-sm font-medium">{t.admin.unpaidPage}</span>
          </div>
          <p className="mt-2 font-(family-name:--font-playfair) text-3xl font-light text-amber-700">
            {unpaidOnPage}
          </p>
        </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-foreground/70">
          Liste des cells rachetés
        </h3>
        <div className="rounded-card border border-foreground/10 bg-background shadow-soft overflow-x-auto">
        <Table className="min-w-[600px]">
          <TableHeader>
            <TableRow>
              <TableHead className="px-3 sm:px-6">{t.admin.date}</TableHead>
              <TableHead className="px-3 sm:px-6">{t.admin.client}</TableHead>
              <TableHead className="px-3 sm:px-6">{t.admin.device}</TableHead>
              <TableHead className="text-center px-3 sm:px-6">{t.admin.quantity}</TableHead>
              <TableHead className="px-3 sm:px-6">{t.admin.price}</TableHead>
              <TableHead className="px-3 sm:px-6">{t.admin.employeeCommission}</TableHead>
              <TableHead className="px-3 sm:px-6">{t.admin.managerCommission}</TableHead>
              <TableHead className="px-3 sm:px-6">{t.admin.ownerCommission}</TableHead>
              <TableHead className="text-center px-3 sm:px-6">{t.admin.commissionPaid}</TableHead>
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
                      {submissionLineTotal(
                        submission.price,
                        submission.quantity,
                      ).toFixed(2)}{" "}
                      $
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
                    <TableCell className="text-center px-3 py-3 sm:px-6 sm:py-4">
                      {canManageCommissionPaid ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleTogglePaid(submission.id, submission.commission_paid)
                          }
                          className={`inline-flex items-center gap-1.5 rounded-card border-2 px-3 py-2 text-sm font-medium transition-all ${
                            submission.commission_paid
                              ? "border-green-500/50 bg-green-500/10 text-green-700"
                              : "border-foreground/20 bg-foreground/5 text-foreground/70 hover:border-amber-500/50 hover:bg-amber-500/10 hover:text-amber-700"
                          }`}
                          aria-pressed={submission.commission_paid}
                          aria-label={
                            submission.commission_paid
                              ? t.admin.markAsUnpaid
                              : t.admin.markAsPaid
                          }
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
                        </button>
                      ) : (
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
                      )}
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
