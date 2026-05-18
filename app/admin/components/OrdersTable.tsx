"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Filter, Trash2 } from "lucide-react";
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
import { updateOrderStore } from "../../actions/update-order-store";
import { orderGrandTotal, type SubmissionStatus } from "@/lib/submissions";
import {
  ORDER_STATUS_BADGE_CLASS,
  orderStatusUiToDb,
  serializeOrdersStoresParam,
  toOrderStatusUi,
  type OrderStatusUi,
} from "@/lib/order-status";
import { cn } from "@/lib/utils";

export type OrderSummary = {
  /** request_group_id when available, otherwise fallback to submission id */
  orderId: string;
  created_at: string;
  model_summary: string;
  gross_total: number;
  /** Prix de rachat + toutes les commissions. */
  grand_total: number;
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

const ORDERS_PAGE_SIZE_OPTIONS = [20, 50, 100, 500, 1000] as const;

const thCompact = "h-9 px-2 py-1.5 text-xs font-medium sm:px-3";
const tdCompact = "px-2 py-1.5 text-xs sm:px-3";
const tdMoney = cn(tdCompact, "text-right tabular-nums whitespace-nowrap");
const stickyLeadBase =
  "sticky z-10 bg-background group-hover:bg-foreground/5";
const stickyCheckboxCol = cn(stickyLeadBase, "left-0");
const stickyStatusCol = cn(
  stickyLeadBase,
  "left-8 shadow-[4px_0_10px_-6px_rgba(0,0,0,0.08)]",
);
const stickyActionsCol = cn(
  stickyLeadBase,
  "left-[7.75rem] shadow-[4px_0_10px_-6px_rgba(0,0,0,0.08)]",
);
const actionBtn =
  "inline-flex items-center justify-center rounded-card border border-transparent bg-[#F5F5F4] px-2 py-1 text-[11px] font-medium leading-tight text-foreground transition-colors hover:border-brand-primary/40 hover:bg-brand-primary/5";

const ORDER_STATUS_LABEL_KEY: Record<
  OrderStatusUi,
  "orderStatusPending" | "orderStatusPaid" | "orderStatusCancelled"
> = {
  pending: "orderStatusPending",
  paid: "orderStatusPaid",
  cancelled: "orderStatusCancelled",
};

export type OrdersSort = "date-desc" | "date-asc" | "store-asc" | "store-desc";

type OrdersTableProps = {
  orders: OrderSummary[];
  page: number;
  pageSize: number;
  total: number;
  totalAll: number;
  totalPages: number;
  storesFilter: string[];
  statusFilter: OrderStatusUi | null;
  sort: string;
  stores: { id: string; name: string }[];
  viewerRole: AppRole;
  canManagePaymentsAndCommissions: boolean;
};

const filterSelectClass =
  "rounded-card border border-foreground/15 bg-[#F5F5F4] px-2.5 py-1.5 text-xs text-foreground sm:text-sm focus:border-brand-primary focus:bg-background focus:outline-none";

type EditableOrderRow = OrderSummary & {
  status: SubmissionStatus;
};

function OrderStatusBadge({ ui, label }: { ui: OrderStatusUi; label: string }) {
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold leading-tight",
        ORDER_STATUS_BADGE_CLASS[ui],
      )}
    >
      {label}
    </span>
  );
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

export function OrdersTable({
  orders,
  page,
  pageSize,
  total,
  totalAll,
  totalPages,
  storesFilter,
  statusFilter,
  sort,
  stores,
  viewerRole,
  canManagePaymentsAndCommissions,
}: OrdersTableProps) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const canCancelOrder = hasMinRole(viewerRole, "admin");
  const canEditStore = hasMinRole(viewerRole, "admin");
  const canDeleteOrder = viewerRole === "super_admin";
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [updatingStoreOrderId, setUpdatingStoreOrderId] = useState<string | null>(null);
  const [ordersState, setOrdersState] = useState<EditableOrderRow[]>(() =>
    orders.map((o) => ({ ...o })),
  );

  useEffect(() => {
    setOrdersState(orders.map((o) => ({ ...o })));
  }, [orders]);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<OrderStatusUi>("pending");
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const sorted = ordersState;

  const hasActiveFilters = Boolean(
    storesFilter.length > 0 || statusFilter || sort !== "date-desc",
  );

  /** Traitement par lot (super admin) : statuts modifiables depuis le détail ou ici. */
  const statusOptions = useMemo(
    () =>
      [
        { value: "pending" as const, label: t.admin.orderStatusPending },
        { value: "paid" as const, label: t.admin.orderStatusPaid },
        { value: "cancelled" as const, label: t.admin.orderStatusCancelled },
      ] as const,
    [t.admin],
  );

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat(locale === "en" ? "en-CA" : "fr-CA", {
      style: "currency",
      currency: "CAD",
    }).format(Number.isFinite(amount) ? amount : 0);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatusUi) => {
    const result = await updateOrderStatus({
      orderId,
      status: orderStatusUiToDb(newStatus),
    });
    if (!result.success) {
      alert(
        result.error === "Forbidden"
          ? t.admin.forbiddenFinancialAction
          : result.error || t.admin.errorUpdateStatus,
      );
      return;
    }
    const dbStatus = orderStatusUiToDb(newStatus);
    setOrdersState((prev) =>
      prev.map((o) => (o.orderId === orderId ? { ...o, status: dbStatus } : o)),
    );
    router.refresh();
  };

  const handleStoreChange = async (orderId: string, storeName: string) => {
    if (!canEditStore || !storeName) return;
    setUpdatingStoreOrderId(orderId);
    const result = await updateOrderStore({ orderId, storeName });
    setUpdatingStoreOrderId(null);
    if (!result.success) {
      alert(result.error || t.admin.errorUpdateStore);
      return;
    }
    setOrdersState((prev) =>
      prev.map((o) =>
        o.orderId === orderId ? { ...o, store_name: result.storeName ?? storeName } : o,
      ),
    );
    router.refresh();
  };

  const handleMarkCancelled = async (orderId: string) => {
    if (!canCancelOrder) return;
    const ok = confirm(t.admin.orderMarkCancelledConfirm);
    if (!ok) return;
    await handleStatusChange(orderId, "cancelled" satisfies OrderStatusUi);
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

    const bulkDbStatus = orderStatusUiToDb(bulkStatus);
    for (const orderId of selectedOrderIds) {
      const result = await updateOrderStatus({ orderId, status: bulkDbStatus });
      if (!result.success) {
        failures.push(orderId);
      }
    }

    setIsBulkUpdating(false);

    if (failures.length > 0) {
      alert(t.admin.bulkUpdatePartialError);
    }

    setOrdersState((prev) =>
      prev.map((o) =>
        selectedOrderIds.includes(o.orderId) ? { ...o, status: bulkDbStatus } : o,
      ),
    );
    setSelectedOrderIds([]);
    router.refresh();
  };

  const pushOrdersListUrl = (updates: {
    page?: number;
    pageSize?: number;
    stores?: string[];
    status?: OrderStatusUi | null;
    sort?: OrdersSort;
  }) => {
    if (typeof window === "undefined") return;
    const nextPage = updates.page ?? page;
    const nextPageSize = updates.pageSize ?? pageSize;
    const nextStores = updates.stores !== undefined ? updates.stores : storesFilter;
    const nextStatus = updates.status !== undefined ? updates.status : statusFilter;
    const nextSort = (updates.sort ?? sort) as OrdersSort;

    const safePage = Math.max(1, nextPage);
    const url = new URL(window.location.href);
    url.searchParams.set("section", "demandes");
    url.searchParams.set("ordersPage", String(safePage));
    url.searchParams.set("ordersPageSize", String(nextPageSize));

    url.searchParams.delete("ordersStore");
    if (nextStores.length > 0) {
      url.searchParams.set("ordersStores", serializeOrdersStoresParam(nextStores));
    } else {
      url.searchParams.delete("ordersStores");
    }

    if (nextStatus) url.searchParams.set("ordersStatus", nextStatus);
    else url.searchParams.delete("ordersStatus");

    if (nextSort && nextSort !== "date-desc") url.searchParams.set("ordersSort", nextSort);
    else url.searchParams.delete("ordersSort");

    url.searchParams.delete("order");

    startTransition(() => {
      router.replace(
        url.pathname +
          (url.searchParams.toString() ? `?${url.searchParams.toString()}` : ""),
      );
    });
  };

  const toggleStoreFilter = (storeName: string) => {
    const next = storesFilter.includes(storeName)
      ? storesFilter.filter((name) => name !== storeName)
      : [...storesFilter, storeName];
    pushOrdersListUrl({ page: 1, stores: next });
  };

  const goToPage = (nextPage: number) => {
    pushOrdersListUrl({ page: nextPage });
  };

  const changePageSize = (nextPageSize: number) => {
    pushOrdersListUrl({ page: 1, pageSize: nextPageSize });
  };

  const resetFilters = () => {
    pushOrdersListUrl({ page: 1, stores: [], status: null, sort: "date-desc" });
  };

  return (
    <div className="w-full min-w-0 max-w-full rounded-card border border-foreground/10 bg-background shadow-soft">
      <section className="space-y-3 border-b border-foreground/10 px-3 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-foreground/70 sm:text-sm">
            <Filter className="h-4 w-4 shrink-0" />
            {t.admin.filters}
          </h3>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={resetFilters}
              disabled={isPending}
              className="text-xs font-medium text-brand-primary hover:underline disabled:opacity-50"
            >
              {t.admin.resetFilters}
            </button>
          ) : null}
        </div>
        <div className="w-full space-y-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium text-foreground/70">
                {t.admin.filterStoresSelection}
              </span>
              {storesFilter.length > 0 ? (
                <button
                  type="button"
                  onClick={() => pushOrdersListUrl({ page: 1, stores: [] })}
                  disabled={isPending}
                  className="text-xs font-medium text-brand-primary hover:underline disabled:opacity-50"
                >
                  {t.admin.allStoresFilter}
                </button>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {stores.map((store) => {
                const checked = storesFilter.includes(store.name);
                return (
                  <label
                    key={store.id}
                    className={cn(
                      "inline-flex cursor-pointer items-center gap-1.5 rounded-card border px-2.5 py-1.5 text-xs transition-colors",
                      checked
                        ? "border-brand-primary/40 bg-brand-primary/10 font-medium text-brand-primary"
                        : "border-foreground/15 bg-[#F5F5F4] text-foreground/80 hover:border-foreground/25",
                      isPending && "pointer-events-none opacity-60",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={isPending}
                      onChange={() => toggleStoreFilter(store.name)}
                      className="h-3.5 w-3.5 rounded border-foreground/25"
                    />
                    {store.name}
                  </label>
                );
              })}
            </div>
            {storesFilter.length > 0 ? (
              <p className="text-xs text-foreground/55">
                {storesFilter.length} {t.admin.storesSelectedCount}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <label className="flex items-center gap-1.5 text-xs text-foreground/70">
            <span className="font-medium">{t.admin.filterByOrderStatus}</span>
            <select
              value={statusFilter ?? "all"}
              onChange={(e) =>
                pushOrdersListUrl({
                  page: 1,
                  status:
                    e.target.value === "all" ? null : (e.target.value as OrderStatusUi),
                })
              }
              disabled={isPending}
              className={filterSelectClass}
              aria-label={t.admin.filterByOrderStatus}
            >
              <option value="all">{t.admin.allStatuses}</option>
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-xs text-foreground/70">
            <span className="font-medium">{t.admin.ordersSortBy}</span>
            <select
              value={sort}
              onChange={(e) =>
                pushOrdersListUrl({ page: 1, sort: e.target.value as OrdersSort })
              }
              disabled={isPending}
              className={filterSelectClass}
              aria-label={t.admin.ordersSortBy}
            >
              <option value="date-desc">{t.admin.sortDateDesc}</option>
              <option value="date-asc">{t.admin.sortDateAsc}</option>
              <option value="store-asc">{t.admin.sortStoreAsc}</option>
              <option value="store-desc">{t.admin.sortStoreDesc}</option>
            </select>
          </label>
          </div>
        </div>
        <p className="text-xs text-foreground/55">
          {total} {t.admin.ordersFilteredCount}
          {total !== totalAll ? ` (${totalAll} ${locale === "en" ? "total" : "au total"})` : null}
        </p>
        {isPending ? (
          <p className="text-xs font-medium text-brand-primary">{t.admin.reportLoading}</p>
        ) : null}
      </section>

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
              onChange={(e) => setBulkStatus(e.target.value as OrderStatusUi)}
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

      <div className="min-w-0 max-w-full">
      <Table className="min-w-[1360px] whitespace-nowrap text-xs [&_td]:py-1.5 [&_th]:h-9">
        <TableHeader>
          <TableRow>
            <TableHead className={cn(thCompact, "w-8", stickyCheckboxCol)}>
              {canManagePaymentsAndCommissions ? (
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="h-3.5 w-3.5 rounded border-foreground/20"
                  aria-label={t.admin.selectAllOrders}
                />
              ) : null}
            </TableHead>
            <TableHead className={cn(thCompact, stickyStatusCol, "text-center")}>
              {t.admin.status}
            </TableHead>
            <TableHead className={cn(thCompact, stickyActionsCol, "text-right")}>
              {t.admin.actions}
            </TableHead>
            <TableHead className={thCompact}>{t.admin.date}</TableHead>
            <TableHead className={thCompact}>{t.admin.storeNameLabel}</TableHead>
            <TableHead className={thCompact}>{t.admin.orderNumber}</TableHead>
            <TableHead className={thCompact}>{t.admin.client}</TableHead>
            <TableHead className={thCompact}>{t.admin.modelLabel}</TableHead>
            <TableHead className={cn(thCompact, "text-right")}>{t.admin.colPrice}</TableHead>
            <TableHead className={cn(thCompact, "text-right")}>{t.admin.colEmployee}</TableHead>
            <TableHead className={cn(thCompact, "text-right")}>{t.admin.colManager}</TableHead>
            <TableHead className={cn(thCompact, "text-right")}>{t.admin.colOwner}</TableHead>
            <TableHead className={cn(thCompact, "text-right")}>{t.admin.totalLabel}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 ? (
            <TableRow>
              <TableCell colSpan={13} className="px-3 py-4 text-center text-foreground/60">
                {t.admin.noSubmissions}
              </TableCell>
            </TableRow>
          ) : (
            sorted.map((order) => (
              <TableRow key={order.orderId} className="group hover:bg-foreground/5">
                <TableCell
                  className={cn(tdCompact, stickyCheckboxCol)}
                  onClick={(e) => e.stopPropagation()}
                >
                  {canManagePaymentsAndCommissions ? (
                    <input
                      type="checkbox"
                      checked={selectedOrderIds.includes(order.orderId)}
                      onChange={() => toggleSelectOrder(order.orderId)}
                      className="h-3.5 w-3.5 rounded border-foreground/20"
                      aria-label={`select-${order.orderId}`}
                    />
                  ) : null}
                </TableCell>
                <TableCell
                  className={cn(tdCompact, stickyStatusCol, "text-center")}
                  onClick={(e) => e.stopPropagation()}
                >
                  <OrderStatusBadge
                    ui={toOrderStatusUi(order.status)}
                    label={t.admin[ORDER_STATUS_LABEL_KEY[toOrderStatusUi(order.status)]]}
                  />
                </TableCell>
                <TableCell className={cn(tdCompact, stickyActionsCol, "text-right")}>
                  <div className="inline-flex flex-nowrap items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(
                          `/admin?section=demandes&order=${encodeURIComponent(order.orderId)}`,
                        );
                      }}
                      className={actionBtn}
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
                        className={cn(
                          actionBtn,
                          "hover:border-amber-500/50 hover:bg-amber-500/5 disabled:cursor-not-allowed disabled:opacity-45",
                        )}
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
                        className={cn(
                          actionBtn,
                          "h-7 w-7 shrink-0 border-red-500/30 bg-red-500/5 px-0 text-red-700 hover:border-red-500/40 hover:bg-red-500/10",
                        )}
                        aria-label={t.admin.deleteOrder}
                        title={t.admin.deleteOrder}
                      >
                        {deletingOrderId === order.orderId ? (
                          <span className="text-xs">…</span>
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        )}
                      </button>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className={cn(tdCompact, "whitespace-nowrap text-foreground/70")}>
                  {formatDate(order.created_at, locale)}
                </TableCell>
                <TableCell
                  className={cn(tdCompact, "max-w-[140px]")}
                  onClick={(e) => e.stopPropagation()}
                >
                  {canEditStore ? (
                    <select
                      value={order.store_name || ""}
                      disabled={updatingStoreOrderId === order.orderId}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v) void handleStoreChange(order.orderId, v);
                      }}
                      className={cn(
                        filterSelectClass,
                        "max-w-full font-medium text-brand-primary",
                        !order.store_name && "border-amber-300 bg-amber-50",
                      )}
                      aria-label={t.admin.assignStore}
                    >
                      <option value="" disabled>
                        {t.admin.selectStore}
                      </option>
                      {order.store_name &&
                      !stores.some((s) => s.name === order.store_name) ? (
                        <option value={order.store_name}>{order.store_name}</option>
                      ) : null}
                      {stores.map((store) => (
                        <option key={store.id} value={store.name}>
                          {store.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="font-medium text-brand-primary">
                      {order.store_name || "—"}
                    </span>
                  )}
                </TableCell>
                <TableCell className={cn(tdCompact, "whitespace-nowrap")}>
                  <span className="font-mono text-foreground/80">
                    {order.orderId.slice(0, 8).toUpperCase()}
                  </span>
                </TableCell>
                <TableCell className={cn(tdCompact, "max-w-[130px] truncate font-medium")}>
                  {order.customer_name}
                </TableCell>
                <TableCell className={cn(tdCompact, "max-w-[110px] truncate")}>
                  {order.model_summary || "—"}
                </TableCell>
                <TableCell className={tdMoney}>{formatMoney(order.gross_total)}</TableCell>
                <TableCell className={tdMoney} onClick={(e) => e.stopPropagation()}>
                  {formatMoney(Number(order.commission_employee_total ?? 0))}
                </TableCell>
                <TableCell className={tdMoney} onClick={(e) => e.stopPropagation()}>
                  {formatMoney(Number(order.commission_manager_total ?? 0))}
                </TableCell>
                <TableCell className={tdMoney} onClick={(e) => e.stopPropagation()}>
                  {formatMoney(Number(order.commission_owner_total ?? 0))}
                </TableCell>
                <TableCell className={cn(tdMoney, "font-semibold")}>
                  {formatMoney(orderGrandTotal(order))}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-foreground/10 px-3 py-3 text-xs text-foreground/70 sm:px-6 sm:text-sm">
        <span>
          {total} {locale === "en" ? "orders" : "commandes"}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={pageSize}
            onChange={(e) => changePageSize(Number(e.target.value))}
            className="rounded-card border border-foreground/15 bg-background px-2 py-1.5 text-xs text-foreground sm:px-3 sm:text-sm"
            aria-label={locale === "en" ? "Rows per page" : "Lignes par page"}
          >
            {ORDERS_PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}/page
              </option>
            ))}
          </select>
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
