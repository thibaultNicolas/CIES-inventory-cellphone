"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AppRole } from "@/lib/app-role";
import { hasMinRole } from "@/lib/app-role";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useI18n } from "@/contexts/I18nContext";
import { deleteOrder } from "../../actions/delete-order";
import { updateOrderStatus } from "../../actions/update-order-status";
import type { SubmissionStatus } from "@/lib/submissions";

export type OrderSummary = {
  /** request_group_id when available, otherwise fallback to submission id */
  orderId: string;
  created_at: string;
  model_summary: string;
  gross_total: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  client_city: string;
  device_imei: string;
  employee_full_name: string;
  store_name: string;
  client_account_number: string;
  status: SubmissionStatus;
  commission_employee_total?: number | null;
  commission_manager_total?: number | null;
  commission_owner_total?: number | null;
};

const STATUS_LABEL_KEY: Record<
  SubmissionStatus,
  "statusUnprocessed" | "statusLabelSent" | "statusPaid" | "statusCancelled"
> = {
  unprocessed: "statusUnprocessed",
  label_sent: "statusLabelSent",
  paid: "statusPaid",
  cancelled: "statusCancelled",
};

type OrdersTableProps = {
  orders: OrderSummary[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  viewerRole: AppRole;
  canManagePaymentsAndCommissions: boolean;
};

type EditableOrderRow = OrderSummary & {
  status: SubmissionStatus;
};

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

export function OrdersTable({
  orders,
  page,
  pageSize,
  total,
  totalPages,
  viewerRole,
  canManagePaymentsAndCommissions,
}: OrdersTableProps) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const canCancelOrder = hasMinRole(viewerRole, "admin");
  const canDeleteOrder = viewerRole === "super_admin";
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [ordersState, setOrdersState] = useState<EditableOrderRow[]>(() =>
    orders.map((o) => ({ ...o })),
  );
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<SubmissionStatus>("unprocessed");
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const sorted = useMemo(() => {
    return [...ordersState].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }, [ordersState]);

  /** Traitement par lot (super admin) : statuts modifiables depuis le détail ou ici. */
  const statusOptions = useMemo(
    () =>
      [
        { value: "unprocessed" as const, label: t.admin.statusPendingPayment },
        { value: "label_sent" as const, label: t.admin.statusLabelSent },
        { value: "paid" as const, label: t.admin.statusPaid },
        { value: "cancelled" as const, label: t.admin.statusCancelled },
      ] as const,
    [t.admin],
  );

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat(locale === "en" ? "en-CA" : "fr-CA", {
      style: "currency",
      currency: "CAD",
    }).format(Number.isFinite(amount) ? amount : 0);

  const handleStatusChange = async (orderId: string, newStatus: SubmissionStatus) => {
    const result = await updateOrderStatus({ orderId, status: newStatus });
    if (!result.success) {
      alert(
        result.error === "Forbidden"
          ? t.admin.forbiddenFinancialAction
          : result.error || t.admin.errorUpdateStatus,
      );
      return;
    }
    setOrdersState((prev) => prev.map((o) => (o.orderId === orderId ? { ...o, status: newStatus } : o)));
  };

  const handleMarkCancelled = async (orderId: string) => {
    if (!canCancelOrder) return;
    const ok = confirm(t.admin.orderMarkCancelledConfirm);
    if (!ok) return;
    await handleStatusChange(orderId, "cancelled");
  };

  const allSelected = sorted.length > 0 && selectedOrderIds.length === sorted.length;

  const toggleSelectAll = () => {
    setSelectedOrderIds(allSelected ? [] : sorted.map((o) => o.orderId));
  };

  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId],
    );
  };

  const handleBulkStatusChange = async () => {
    if (selectedOrderIds.length === 0) return;
    setIsBulkUpdating(true);
    const failures: string[] = [];

    for (const orderId of selectedOrderIds) {
      const result = await updateOrderStatus({ orderId, status: bulkStatus });
      if (!result.success) {
        failures.push(orderId);
      }
    }

    setIsBulkUpdating(false);

    if (failures.length > 0) {
      alert(t.admin.bulkUpdatePartialError);
    }

    setOrdersState((prev) =>
      prev.map((o) => (selectedOrderIds.includes(o.orderId) ? { ...o, status: bulkStatus } : o)),
    );
    setSelectedOrderIds([]);
  };

  const goToPage = (nextPage: number) => {
    if (typeof window === "undefined") return;
    const safe = Math.max(1, Math.min(totalPages, nextPage));
    const url = new URL(window.location.href);
    url.searchParams.set("section", "demandes");
    url.searchParams.set("ordersPage", String(safe));
    url.searchParams.set("ordersPageSize", String(pageSize));
    url.searchParams.delete("order");
    router.replace(
      url.pathname +
        (url.searchParams.toString() ? `?${url.searchParams.toString()}` : ""),
    );
  };

  return (
    <div className="w-full min-w-0 max-w-full rounded-card border border-foreground/10 bg-background shadow-soft">
      {canManagePaymentsAndCommissions ? (
        <div className="flex items-center justify-between gap-3 border-b border-foreground/10 px-3 py-3 sm:px-6">
          <label className="inline-flex items-center gap-2 text-xs text-foreground/70 sm:text-sm">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleSelectAll}
              className="h-4 w-4 rounded border-foreground/20"
            />
            {t.admin.selectAllOrders}
          </label>

          <div className="flex items-center gap-2">
            {selectedOrderIds.length > 0 ? (
              <span className="text-xs text-foreground/60 sm:text-sm">
                {selectedOrderIds.length} {t.admin.selectedOrders}
              </span>
            ) : null}
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as SubmissionStatus)}
              className="rounded-card border border-foreground/15 bg-background px-2 py-1 text-xs text-foreground sm:text-sm"
            >
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleBulkStatusChange}
              disabled={selectedOrderIds.length === 0 || isBulkUpdating}
              className="rounded-card border border-brand-primary/30 bg-brand-primary/10 px-3 py-1.5 text-xs font-medium text-brand-primary disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
            >
              {isBulkUpdating ? t.admin.save : t.admin.applyBulkStatus}
            </button>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto overflow-y-visible">
      <Table className="min-w-[1700px] whitespace-nowrap">
        <TableHeader>
          <TableRow>
            <TableHead className="w-10 px-3 sm:px-4">
              {canManagePaymentsAndCommissions ? (
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-foreground/20"
                  aria-label={t.admin.selectAllOrders}
                />
              ) : null}
            </TableHead>
            <TableHead className="px-3 sm:px-6">{t.admin.date}</TableHead>
            <TableHead className="px-3 sm:px-6">{t.admin.orderNumber}</TableHead>
            <TableHead className="px-3 sm:px-6">{t.admin.client}</TableHead>
            <TableHead className="px-3 sm:px-6">{t.admin.modelLabel}</TableHead>
            <TableHead className="text-right px-3 sm:px-6">{t.admin.grossBeforeCommission}</TableHead>
            <TableHead className="text-right px-3 sm:px-6">{t.admin.employeeCommission}</TableHead>
            <TableHead className="text-right px-3 sm:px-6">{t.admin.managerCommission}</TableHead>
            <TableHead className="text-right px-3 sm:px-6">{t.admin.ownerCommission}</TableHead>
            <TableHead className="text-right px-3 sm:px-6">{t.admin.totalLabel}</TableHead>
            <TableHead className="text-center px-3 sm:px-6">{t.admin.status}</TableHead>
            <TableHead className="text-right px-3 sm:px-6">{t.admin.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 ? (
            <TableRow>
              <TableCell colSpan={12} className="px-3 py-6 text-center text-foreground/60 sm:px-6">
                {t.admin.noSubmissions}
              </TableCell>
            </TableRow>
          ) : (
            sorted.map((order) => (
              <TableRow
                key={order.orderId}
                className="hover:bg-foreground/5"
              >
                <TableCell className="px-3 py-3 sm:px-4 sm:py-4" onClick={(e) => e.stopPropagation()}>
                  {canManagePaymentsAndCommissions ? (
                    <input
                      type="checkbox"
                      checked={selectedOrderIds.includes(order.orderId)}
                      onChange={() => toggleSelectOrder(order.orderId)}
                      className="h-4 w-4 rounded border-foreground/20"
                      aria-label={`select-${order.orderId}`}
                    />
                  ) : null}
                </TableCell>
                <TableCell className="whitespace-nowrap px-3 py-3 text-sm text-foreground/70 sm:px-6 sm:py-4">
                  {formatDate(order.created_at, locale)}
                </TableCell>
                <TableCell className="whitespace-nowrap px-3 py-3 text-sm sm:px-6 sm:py-4">
                  <span className="font-mono text-foreground/80">
                    {order.orderId.slice(0, 8).toUpperCase()}
                  </span>
                </TableCell>
                <TableCell className="px-3 py-3 sm:px-6 sm:py-4">
                  <div className="font-medium text-foreground">{order.customer_name}</div>
                </TableCell>
                <TableCell className="px-3 py-3 text-sm sm:px-6 sm:py-4">
                  {order.model_summary || "—"}
                </TableCell>
                <TableCell className="whitespace-nowrap px-3 py-3 text-right text-sm tabular-nums sm:px-6 sm:py-4">
                  {formatMoney(order.gross_total)}
                </TableCell>
                <TableCell className="px-3 py-3 text-right sm:px-6 sm:py-4" onClick={(e) => e.stopPropagation()}>
                  <span className="font-medium tabular-nums">
                    {formatMoney(Number(order.commission_employee_total ?? 0))}
                  </span>
                </TableCell>
                <TableCell className="px-3 py-3 text-right sm:px-6 sm:py-4" onClick={(e) => e.stopPropagation()}>
                  <span className="font-medium tabular-nums">
                    {formatMoney(Number(order.commission_manager_total ?? 0))}
                  </span>
                </TableCell>
                <TableCell className="px-3 py-3 text-right sm:px-6 sm:py-4" onClick={(e) => e.stopPropagation()}>
                  <span className="font-medium tabular-nums">
                    {formatMoney(Number(order.commission_owner_total ?? 0))}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap px-3 py-3 text-right text-sm font-semibold tabular-nums sm:px-6 sm:py-4">
                  {formatMoney(order.gross_total)}
                </TableCell>
                <TableCell
                  className="text-center px-3 py-3 sm:px-6 sm:py-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="inline-block min-w-[140px] rounded-card border border-foreground/15 bg-[#F5F5F4] px-3 py-2 text-xs font-medium text-foreground">
                    {t.admin[STATUS_LABEL_KEY[order.status]]}
                  </span>
                </TableCell>
                <TableCell className="text-right px-3 py-3 sm:px-6 sm:py-4">
                  <div className="inline-flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(
                          `/admin?section=demandes&order=${encodeURIComponent(order.orderId)}`,
                        );
                      }}
                      className="inline-flex items-center justify-center rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-2 text-xs font-medium text-foreground transition-all duration-300 hover:border-brand-primary hover:bg-brand-primary/5 hover:scale-105"
                    >
                      {t.admin.view}
                    </button>
                    {canCancelOrder ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleMarkCancelled(order.orderId);
                        }}
                        disabled={order.status === "cancelled"}
                        className="inline-flex items-center justify-center rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-2 text-xs font-medium text-foreground transition-all duration-300 hover:border-amber-500/50 hover:bg-amber-500/5 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        {t.admin.orderMarkCancelled}
                      </button>
                    ) : null}
                    {canDeleteOrder ? (
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const ok = confirm(t.admin.deleteOrderConfirm);
                          if (!ok) return;
                          setDeletingOrderId(order.orderId);
                          const result = await deleteOrder(order.orderId);
                          setDeletingOrderId(null);
                          if (!result.success) {
                            alert(result.error || t.admin.deleteError);
                            return;
                          }
                          router.refresh();
                        }}
                        disabled={deletingOrderId === order.orderId}
                        className="inline-flex items-center justify-center rounded-card border border-red-500/30 bg-red-500/5 px-4 py-2 text-xs font-medium text-red-700 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                        aria-label={t.admin.deleteOrder}
                      >
                        {deletingOrderId === order.orderId ? "…" : t.admin.deleteOrder}
                      </button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      </div>
      <div className="flex items-center justify-between border-t border-foreground/10 px-3 py-3 text-xs text-foreground/70 sm:px-6 sm:text-sm">
        <span>
          {total} {locale === "en" ? "orders" : "commandes"}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="rounded-card border border-foreground/15 px-3 py-1.5 disabled:opacity-50"
          >
            {locale === "en" ? "Previous" : "Précédent"}
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            className="rounded-card border border-foreground/15 px-3 py-1.5 disabled:opacity-50"
          >
            {locale === "en" ? "Next" : "Suivant"}
          </button>
        </div>
      </div>
    </div>
  );
}
