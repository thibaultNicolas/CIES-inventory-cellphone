"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { ChevronDown, Trash2 } from "lucide-react";
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
import { motion, AnimatePresence } from "framer-motion";

type BadgeVariant = NonNullable<BadgeProps["variant"]>;

export type OrderSummary = {
  /** request_group_id when available, otherwise fallback to submission id */
  orderId: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  client_city: string;
  device_imei: string;
  employee_full_name: string;
  status: SubmissionStatus;
};

type OrdersTableProps = {
  orders: OrderSummary[];
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

export function OrdersTable({ orders }: OrdersTableProps) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [openStatusDropdown, setOpenStatusDropdown] = useState<string | null>(null);
  const [ordersState, setOrdersState] = useState(orders);

  const sorted = useMemo(() => {
    return [...ordersState].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }, [ordersState]);

  const statusOptions = useMemo(
    () =>
      [
        {
          value: "unprocessed" as const,
          label: t.admin.statusUnprocessed,
          color: "unprocessed" as const,
        },
        {
          value: "label_sent" as const,
          label: t.admin.statusLabelSent,
          color: "label_sent" as const,
        },
        { value: "paid" as const, label: t.admin.statusPaid, color: "paid" as const },
        {
          value: "cancelled" as const,
          label: t.admin.statusCancelled,
          color: "cancelled" as const,
        },
      ] satisfies ReadonlyArray<{ value: SubmissionStatus; label: string; color: BadgeVariant }>,
    [t.admin],
  );

  const getStatusBadge = (status: SubmissionStatus) => {
    const statusOption = statusOptions.find((s) => s.value === status);
    if (!statusOption) return <Badge variant="unprocessed">{t.admin.statusUnprocessed}</Badge>;
    return <Badge variant={statusOption.color}>{statusOption.label}</Badge>;
  };

  const handleStatusChange = async (orderId: string, newStatus: SubmissionStatus) => {
    const result = await updateOrderStatus({ orderId, status: newStatus });
    if (!result.success) {
      alert(result.error || t.admin.errorUpdateStatus);
      return;
    }
    setOrdersState((prev) => prev.map((o) => (o.orderId === orderId ? { ...o, status: newStatus } : o)));
    setOpenStatusDropdown(null);
  };

  return (
    <div className="rounded-card border border-foreground/10 bg-background shadow-soft overflow-x-auto">
      <Table className="min-w-[800px]">
        <TableHeader>
          <TableRow>
            <TableHead className="px-3 sm:px-6">{t.admin.date}</TableHead>
            <TableHead className="px-3 sm:px-6">{t.admin.orderNumber}</TableHead>
            <TableHead className="px-3 sm:px-6">{t.admin.client}</TableHead>
            <TableHead className="text-center px-3 sm:px-6">{t.admin.status}</TableHead>
            <TableHead className="text-right px-3 sm:px-6">{t.admin.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="px-3 py-6 text-center text-foreground/60 sm:px-6">
                {t.admin.noSubmissions}
              </TableCell>
            </TableRow>
          ) : (
            sorted.map((order) => (
              <TableRow
                key={order.orderId}
                className="cursor-pointer hover:bg-foreground/5"
                onClick={() => router.push(`/admin?section=demandes&order=${encodeURIComponent(order.orderId)}`)}
              >
                <TableCell className="whitespace-nowrap px-3 py-3 text-sm text-foreground/70 sm:px-6 sm:py-4">
                  {formatDate(order.created_at, locale)}
                </TableCell>
                <TableCell className="whitespace-nowrap px-3 py-3 text-sm sm:px-6 sm:py-4">
                  <span className="font-mono text-foreground/80">
                    {order.orderId.slice(0, 8).toUpperCase()}
                  </span>
                </TableCell>
                <TableCell className="px-3 py-3 sm:px-6 sm:py-4">
                  <div>
                    <div className="font-medium text-foreground">{order.customer_name}</div>
                    {order.employee_full_name ? (
                      <div className="text-xs text-foreground/60">
                        {t.admin.employeeFullName}: {order.employee_full_name}
                      </div>
                    ) : null}
                    {order.customer_email ? (
                      <div className="text-xs text-foreground/60">{order.customer_email}</div>
                    ) : null}
                    <div className="text-xs text-foreground/50">{order.customer_phone}</div>
                    {order.client_city || order.device_imei ? (
                      <div className="text-xs text-foreground/50">
                        {order.client_city ? order.client_city : null}
                        {order.client_city && order.device_imei ? " · " : null}
                        {order.device_imei ? (
                          <span className="font-mono">
                            {t.admin.deviceImeiLabel}: {order.device_imei}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="text-center px-3 py-3 sm:px-6 sm:py-4">
                  <div className="relative inline-flex" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenStatusDropdown((prev) => (prev === order.orderId ? null : order.orderId))
                      }
                      className="inline-flex items-center gap-2 rounded-card border-2 border-transparent bg-[#F5F5F4] px-3 py-2 text-xs font-medium text-foreground transition-all duration-300 hover:border-brand-primary hover:bg-brand-primary/5"
                      aria-haspopup="menu"
                      aria-expanded={openStatusDropdown === order.orderId}
                    >
                      {getStatusBadge(order.status)}
                      <ChevronDown
                        className={`h-3 w-3 transition-transform ${
                          openStatusDropdown === order.orderId ? "rotate-180" : ""
                        }`}
                        aria-hidden
                      />
                    </button>

                    <AnimatePresence>
                      {openStatusDropdown === order.orderId && (
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
                              onClick={() => handleStatusChange(order.orderId, status.value)}
                              className={`w-full rounded-card px-3 py-2 text-left text-xs transition-all duration-300 ${
                                order.status === status.value
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
                <TableCell className="text-right px-3 py-3 sm:px-6 sm:py-4">
                  <div className="inline-flex items-center justify-end gap-2">
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
                      className="inline-flex h-9 w-9 items-center justify-center rounded-card border border-red-500/30 bg-red-500/5 text-red-700 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                      aria-label={t.admin.deleteOrder}
                      title={t.admin.deleteOrder}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
