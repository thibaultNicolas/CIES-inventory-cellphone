"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { updateSubmissionStatus } from "../../actions/update-submission-status";
import { updateCommissionPaid } from "../../actions/update-commission-paid";
import { deleteSubmission } from "../../actions/delete-submission";
import { useI18n } from "@/contexts/I18nContext";
import { ChevronDown, DollarSign, Filter, CheckCircle, Clock, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { SubmissionStatus } from "@/lib/submissions";
import { submissionLineTotal } from "@/lib/submissions";

type BadgeVariant = NonNullable<BadgeProps["variant"]>;

type Submission = {
  id: string;
  request_group_id: string | null;
  created_at: string;
  employee_full_name: string;
  client_full_name: string;
  client_city: string;
  device_imei: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  brand_name: string;
  model_name: string;
  memory: string;
  condition: string;
  price: number;
  quantity: number;
  status: SubmissionStatus;
  commission_paid: boolean;
};

type SubmissionsTableWithFiltersProps = {
  submissions: Submission[];
  hideFilters?: boolean;
  /** Basculer payé / non payé : super_admin uniquement. */
  canManageCommissionPaid?: boolean;
};

function getStatusOptions(t: {
  statusUnprocessed: string;
  statusLabelSent: string;
  statusPaid: string;
  statusCancelled: string;
}) {
  return [
    { value: "unprocessed" as const, label: t.statusUnprocessed, color: "unprocessed" as const },
    { value: "label_sent" as const, label: t.statusLabelSent, color: "label_sent" as const },
    { value: "paid" as const, label: t.statusPaid, color: "paid" as const },
    { value: "cancelled" as const, label: t.statusCancelled, color: "cancelled" as const },
  ] as const;
}

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

function getStatusBadge(
  status: string,
  statusOptions: ReadonlyArray<{ value: string; label: string; color: BadgeVariant }>,
  defaultLabel: string
) {
  const normalized = status.toLowerCase();
  const statusOption = statusOptions.find((s) => s.value === normalized);
  if (!statusOption) {
    return <Badge variant="unprocessed">{status || defaultLabel}</Badge>;
  }
  return <Badge variant={statusOption.color}>{statusOption.label}</Badge>;
}

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

function parseDateInput(value: string): Date | null {
  if (!value) return null;
  const parts = value.split("-");
  if (parts.length !== 3) return null;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  return new Date(y, m - 1, d);
}

function startOfWeekMonday(date: Date) {
  const d = startOfDay(date);
  const day = d.getDay(); // 0=Sun, 1=Mon...
  const diff = (day + 6) % 7; // Mon -> 0, Sun -> 6
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
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(locale === "en" ? "en-CA" : "fr-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function SubmissionsTableWithFilters({
  submissions,
  hideFilters = false,
  canManageCommissionPaid = false,
}: SubmissionsTableWithFiltersProps) {
  const { t, locale } = useI18n();
  const statusOptions = useMemo(() => getStatusOptions(t.admin), [t.admin]);
  const [selectedModel, setSelectedModel] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodPreset>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const router = useRouter();

  const uniqueModels = useMemo(() => {
    const models = new Set(submissions.map((s) => `${s.brand_name} ${s.model_name}`));
    return Array.from(models).sort();
  }, [submissions]);

  const uniqueBrands = useMemo(() => {
    const brands = new Set(submissions.map((s) => s.brand_name));
    return Array.from(brands).sort();
  }, [submissions]);

  const applyPeriodPreset = (preset: PeriodPreset) => {
    const now = new Date();

    if (preset === "all") {
      setFromDate("");
      setToDate("");
      return;
    }

    if (preset === "custom") {
      return;
    }

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

    setFromDate(toDateInputValue(from));
    setToDate(toDateInputValue(to));
  };

  const filteredSubmissions = useMemo(() => {
    if (hideFilters) return submissions;
    let from = parseDateInput(fromDate);
    let to = parseDateInput(toDate);

    if (from && to && from.getTime() > to.getTime()) {
      const tmp = from;
      from = to;
      to = tmp;
    }

    const fromMs = from ? startOfDay(from).getTime() : null;
    const toMs = to ? endOfDay(to).getTime() : null;

    return submissions.filter((submission) => {
      const modelMatch =
        selectedModel === "all" ||
        `${submission.brand_name} ${submission.model_name}` === selectedModel;
      const statusMatch =
        selectedStatus === "all" || submission.status === selectedStatus;
      const brandMatch =
        selectedBrand === "all" || submission.brand_name === selectedBrand;

      const createdMs = new Date(submission.created_at).getTime();
      const dateMatch =
        (fromMs === null || (Number.isFinite(createdMs) && createdMs >= fromMs)) &&
        (toMs === null || (Number.isFinite(createdMs) && createdMs <= toMs));

      return modelMatch && statusMatch && brandMatch && dateMatch;
    });
  }, [hideFilters, submissions, selectedModel, selectedStatus, selectedBrand, fromDate, toDate]);

  const toggleDropdown = (id: string) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const closeDropdown = (id: string) => {
    setOpenDropdowns((prev) => {
      if (!prev[id]) return prev;
      return { ...prev, [id]: false };
    });
  };

  const handleStatusChange = async (
    submissionId: string,
    newStatus: SubmissionStatus,
    dropdownId?: string,
  ) => {
    const result = await updateSubmissionStatus({
      submissionId,
      status: newStatus,
    });

    if (result.success) {
      window.location.reload();
    } else {
      alert(t.admin.errorUpdateStatus);
      if (dropdownId) closeDropdown(dropdownId);
    }
  };

  const handleToggleCommissionPaid = async (
    submissionId: string,
    current: boolean
  ) => {
    const result = await updateCommissionPaid({
      submissionId,
      commissionPaid: !current,
    });
    if (result.success) {
      window.location.reload();
    } else {
      alert(t.admin.errorUpdate);
    }
  };

  const handleDeleteSubmission = async (submissionId: string) => {
    if (!confirm(t.admin.deleteConfirm)) return;
    setIsDeleting(submissionId);
    const result = await deleteSubmission(submissionId);
    if (result.success) {
      toggleDropdown(submissionId);
      router.refresh();
    } else {
      alert(t.admin.deleteError);
    }
    setIsDeleting(null);
  };

  return (
    <div className="space-y-6">
      {!hideFilters && (
        <div className="flex flex-wrap items-center gap-4 rounded-card border border-foreground/10 bg-background p-3 shadow-soft sm:p-4">
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Filter className="h-4 w-4 shrink-0 text-foreground/60" />
            <span className="text-sm font-medium text-foreground/70">{t.admin.filters}</span>
          </div>

          <div className="flex w-full flex-wrap gap-3 sm:w-auto">
            <select
              value={selectedPeriod}
              onChange={(e) => {
                const preset = e.target.value as PeriodPreset;
                setSelectedPeriod(preset);
                applyPeriodPreset(preset);
              }}
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
              onChange={(e) => {
                setFromDate(e.target.value);
                setSelectedPeriod("custom");
              }}
              className="rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-3 text-sm text-foreground transition-all focus:border-brand-primary focus:bg-background focus:outline-none"
              aria-label={t.admin.startDate}
            />

            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setSelectedPeriod("custom");
              }}
              className="rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-3 text-sm text-foreground transition-all focus:border-brand-primary focus:bg-background focus:outline-none"
              aria-label={t.admin.endDate}
            />

            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-3 text-sm text-foreground transition-all focus:border-brand-primary focus:bg-background focus:outline-none"
            >
              <option value="all">{t.admin.allBrands}</option>
              {uniqueBrands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>

            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-3 text-sm text-foreground transition-all focus:border-brand-primary focus:bg-background focus:outline-none"
            >
              <option value="all">{t.admin.allModels}</option>
              {uniqueModels.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-3 text-sm text-foreground transition-all focus:border-brand-primary focus:bg-background focus:outline-none"
            >
              <option value="all">{t.admin.allStatuses}</option>
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full text-sm text-foreground/60 sm:ml-auto sm:w-auto">
            {filteredSubmissions.length}{" "}
            {filteredSubmissions.length > 1 ? t.admin.submissionsCountPlural : t.admin.submissionsCount}
          </div>
        </div>
      )}

      <div className="rounded-card border border-foreground/10 bg-background shadow-soft overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead className="px-3 sm:px-6">{t.admin.date}</TableHead>
              <TableHead className="px-3 sm:px-6">{t.admin.orderNumber}</TableHead>
              <TableHead className="px-3 sm:px-6">{t.admin.client}</TableHead>
              <TableHead className="px-3 sm:px-6">{t.admin.device}</TableHead>
              <TableHead className="px-3 sm:px-6 text-center">
                {t.admin.quantity}
              </TableHead>
              <TableHead className="px-3 sm:px-6">{t.admin.price}</TableHead>
              <TableHead className="text-center px-3 sm:px-6">{t.admin.status}</TableHead>
              <TableHead className="text-center px-3 sm:px-6">{t.admin.commissionPaid}</TableHead>
              <TableHead className="text-right px-3 sm:px-6">{t.admin.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubmissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="px-3 py-6 text-center text-foreground/60 sm:px-6">
                  {t.admin.noSubmissions}
                </TableCell>
              </TableRow>
            ) : (
              filteredSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                    <TableCell className="whitespace-nowrap px-3 py-3 text-sm text-foreground/70 sm:px-6 sm:py-4">
                      {formatDate(submission.created_at, locale)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-3 py-3 text-sm sm:px-6 sm:py-4">
                      <span className="font-mono text-foreground/80">
                        {(submission.request_group_id || submission.id).slice(0, 8).toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 py-3 sm:px-6 sm:py-4">
                      <div>
                        <div className="font-medium text-foreground">
                          {submission.client_full_name || submission.customer_name}
                        </div>
                        <div className="text-xs text-foreground/60">
                          {submission.employee_full_name
                            ? `${t.admin.employeeFullName}: ${submission.employee_full_name}`
                            : null}
                        </div>
                        <div className="text-xs text-foreground/60">
                          {t.admin.clientPhoneLabel}: {submission.customer_phone}
                          {submission.client_city ? ` · ${submission.client_city}` : ""}
                        </div>
                        {submission.device_imei ? (
                          <div className="font-mono text-xs text-foreground/50">
                            {t.admin.deviceImeiLabel}: {submission.device_imei}
                          </div>
                        ) : null}
                        {submission.customer_email ? (
                          <div className="text-xs text-foreground/50">{submission.customer_email}</div>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-3 sm:px-6 sm:py-4">
                      <div>
                        <div className="font-medium text-foreground">{submission.brand_name} {submission.model_name}</div>
                        <div className="text-xs text-foreground/60">
                          {submission.memory} - {submission.condition}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-3 text-center text-sm text-foreground sm:px-6 sm:py-4">
                      {submission.quantity}
                    </TableCell>
                    <TableCell className="px-3 py-3 sm:px-6 sm:py-4">
                      <div className="flex flex-col gap-0.5">
                        {submission.quantity > 1 ? (
                          <span className="text-xs text-foreground/55">
                            {submission.quantity} × {submission.price.toFixed(2)} $ (
                            {t.admin.unitPrice})
                          </span>
                        ) : null}
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-brand-primary" />
                          <span className="font-medium text-brand-primary">
                            {submissionLineTotal(
                              submission.price,
                              submission.quantity,
                            ).toFixed(2)}{" "}
                            $
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center px-3 py-3 sm:px-6 sm:py-4">
                      <div className="relative inline-flex">
                        <button
                          type="button"
                          onClick={() => toggleDropdown(`status-${submission.id}`)}
                          className="inline-flex items-center gap-2 rounded-card border-2 border-transparent bg-[#F5F5F4] px-3 py-2 text-xs font-medium text-foreground transition-all duration-300 hover:border-brand-primary hover:bg-brand-primary/5"
                          aria-haspopup="menu"
                          aria-expanded={Boolean(openDropdowns[`status-${submission.id}`])}
                        >
                          {getStatusBadge(
                            submission.status,
                            statusOptions,
                            t.admin.statusUnprocessed,
                          )}
                          <ChevronDown
                            className={`h-3 w-3 transition-transform ${
                              openDropdowns[`status-${submission.id}`] ? "rotate-180" : ""
                            }`}
                            aria-hidden
                          />
                        </button>

                        <AnimatePresence>
                          {openDropdowns[`status-${submission.id}`] && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute left-1/2 top-full z-10 mt-2 w-52 -translate-x-1/2 rounded-card border border-foreground/10 bg-background p-2 shadow-soft"
                              role="menu"
                            >
                              {statusOptions.map((status) => (
                                <button
                                  key={status.value}
                                  type="button"
                                  onClick={() =>
                                    handleStatusChange(
                                      submission.id,
                                      status.value,
                                      `status-${submission.id}`,
                                    )
                                  }
                                  className={`w-full rounded-card px-3 py-2 text-left text-xs transition-all duration-300 ${
                                    submission.status === status.value
                                      ? "bg-brand-primary/10 text-brand-primary"
                                      : "text-foreground hover:bg-foreground/5"
                                  }`}
                                  role="menuitem"
                                >
                                  {status.label}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </TableCell>
                    <TableCell className="text-center px-3 py-3 sm:px-6 sm:py-4">
                      {canManageCommissionPaid ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleCommissionPaid(submission.id, submission.commission_paid)
                          }
                          className={`inline-flex items-center gap-1.5 rounded-card border-2 px-3 py-2 text-xs font-medium transition-all ${
                            submission.commission_paid
                              ? "border-green-500/50 bg-green-500/10 text-green-700"
                              : "border-foreground/20 bg-foreground/5 text-foreground/70 hover:border-amber-500/50 hover:bg-amber-500/10 hover:text-amber-700"
                          }`}
                          aria-pressed={submission.commission_paid}
                          aria-label={
                            submission.commission_paid
                              ? t.admin.markCommissionUnpaid
                              : t.admin.markCommissionPaid
                          }
                        >
                          {submission.commission_paid ? (
                            <>
                              <CheckCircle className="h-3.5 w-3.5" />
                              {t.admin.yes}
                            </>
                          ) : (
                            <>
                              <Clock className="h-3.5 w-3.5" />
                              {t.admin.no}
                            </>
                          )}
                        </button>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-card border-2 px-3 py-2 text-xs font-medium ${
                            submission.commission_paid
                              ? "border-green-500/50 bg-green-500/10 text-green-700"
                              : "border-foreground/20 bg-foreground/5 text-foreground/70"
                          }`}
                        >
                          {submission.commission_paid ? (
                            <>
                              <CheckCircle className="h-3.5 w-3.5" />
                              {t.admin.yes}
                            </>
                          ) : (
                            <>
                              <Clock className="h-3.5 w-3.5" />
                              {t.admin.no}
                            </>
                          )}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right px-3 py-3 sm:px-6 sm:py-4">
                      <div className="relative">
                        <button
                          onClick={() => toggleDropdown(submission.id)}
                          className="flex items-center gap-1 rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-2 text-xs font-medium text-foreground transition-all duration-300 hover:border-brand-primary hover:bg-brand-primary/5 hover:scale-105"
                        >
                          {t.admin.change}
                          <ChevronDown
                            className={`h-3 w-3 transition-transform ${
                              openDropdowns[submission.id] ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        <AnimatePresence>
                          {openDropdowns[submission.id] && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute right-0 top-full z-10 mt-2 w-48 rounded-card border border-foreground/10 bg-background p-2 shadow-soft"
                            >
                              {statusOptions.map((status) => (
                                <button
                                  key={status.value}
                                  type="button"
                                  onClick={() =>
                                    handleStatusChange(submission.id, status.value, submission.id)
                                  }
                                  className={`w-full rounded-card px-3 py-2 text-left text-xs transition-all duration-300 ${
                                    submission.status === status.value
                                      ? "bg-brand-primary/10 text-brand-primary"
                                      : "text-foreground hover:bg-foreground/5"
                                  }`}
                                >
                                  {status.label}
                                </button>
                              ))}
                              <div className="my-1 border-t border-foreground/10" />
                              <button
                                type="button"
                                onClick={() => handleDeleteSubmission(submission.id)}
                                disabled={isDeleting === submission.id}
                                className="flex w-full items-center gap-2 rounded-card px-3 py-2 text-left text-xs text-red-600 transition-all duration-300 hover:bg-red-500/10 disabled:opacity-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                {isDeleting === submission.id ? "…" : t.admin.deleteSubmission}
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
