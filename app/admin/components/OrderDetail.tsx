"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/contexts/I18nContext";
import { updateSubmissionPrice } from "../../actions/update-submission-price";
import { updateCommissionPaid } from "../../actions/update-commission-paid";
import { deleteOrder } from "../../actions/delete-order";
import { updateOrderStatus } from "../../actions/update-order-status";
import { uploadShippingLabel } from "../actions/upload-shipping-label";
import type { SubmissionStatus } from "@/lib/submissions";
import { submissionLineTotal } from "@/lib/submissions";

export type OrderDetailSubmission = {
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
  customer_address?: string;
  brand_name: string;
  model_name: string;
  memory: string;
  condition: string;
  price: number;
  quantity: number;
  price_override_previous?: number | null;
  price_override_reason?: string | null;
  price_override_updated_at?: string | null;
  price_override_updated_by?: string | null;
  clickship_shipment_id?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
  shipping_label_url?: string | null;
  shipping_label_status?: string | null;
  shipping_label_error?: string | null;
  status: SubmissionStatus;
  commission_paid: boolean;
};

type OrderDetailProps = {
  orderId: string;
  submissions: OrderDetailSubmission[];
  /** Basculer payé / non payé : super_admin uniquement. */
  canManageCommissionPaid?: boolean;
};

function formatDate(dateString: string, locale: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(locale === "en" ? "en-CA" : "fr-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function normalizeOverallStatus(
  submissions: ReadonlyArray<{ status: SubmissionStatus }>,
) {
  if (submissions.length === 0) return "unprocessed" as const;
  const statuses = new Set(submissions.map((s) => s.status));
  if (statuses.size === 1) return submissions[0].status;
  if (statuses.has("cancelled")) return "cancelled" as const;
  if (statuses.has("unprocessed")) return "unprocessed" as const;
  if (statuses.has("label_sent")) return "label_sent" as const;
  if (statuses.has("paid")) return "paid" as const;
  return submissions[0].status;
}

const STATUS_LABEL_KEY: Record<
  SubmissionStatus,
  "statusUnprocessed" | "statusLabelSent" | "statusPaid" | "statusCancelled"
> = {
  unprocessed: "statusUnprocessed",
  label_sent: "statusLabelSent",
  paid: "statusPaid",
  cancelled: "statusCancelled",
};

export function OrderDetail({
  orderId,
  submissions,
  canManageCommissionPaid = false,
}: OrderDetailProps) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [isWorking, setIsWorking] = useState<Record<string, boolean>>({});
  const [isUploadingLabel, setIsUploadingLabel] = useState(false);
  const [isLabelDragActive, setIsLabelDragActive] = useState(false);
  const labelFileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUpdatingOrderStatus, setIsUpdatingOrderStatus] = useState(false);
  const [isDeletingOrder, setIsDeletingOrder] = useState(false);
  const [priceEditor, setPriceEditor] = useState<{
    submissionId: string;
    price: string;
    reason: string;
  } | null>(null);

  const summary = useMemo(() => {
    const sortedByDate = [...submissions].sort((a, b) =>
      a.created_at < b.created_at ? -1 : 1,
    );
    const first = sortedByDate[0];
    const overallStatus = normalizeOverallStatus(submissions);
    const devicesTotal = submissions.reduce(
      (sum, s) => sum + submissionLineTotal(s.price, s.quantity),
      0,
    );
    const orderUnitsTotal = submissions.reduce((sum, s) => sum + s.quantity, 0);
    const commissionPaidCount = submissions.filter(
      (s) => s.commission_paid,
    ).length;
    const netTotal = devicesTotal;

    return {
      first,
      overallStatus,
      devicesTotal,
      orderUnitsTotal,
      netTotal,
      commissionPaidCount,
    };
  }, [submissions]);

  const shipping = useMemo(() => {
    const withData =
      submissions.find(
        (s) =>
          s.clickship_shipment_id ||
          s.shipping_label_status ||
          s.tracking_number ||
          s.shipping_label_url,
      ) || submissions[0];
    return {
      shipmentId: withData?.clickship_shipment_id ?? null,
      trackingNumber: withData?.tracking_number ?? null,
      trackingUrl: withData?.tracking_url ?? null,
      shippingLabelUrl: withData?.shipping_label_url ?? null,
    };
  }, [submissions]);

  const displayOrder = orderId.slice(0, 8).toUpperCase();

  const customer = summary.first
    ? {
        employeeName: summary.first.employee_full_name,
        clientName: summary.first.client_full_name || summary.first.customer_name,
        phone: summary.first.customer_phone,
        city: summary.first.client_city || summary.first.customer_address || "",
        imei: summary.first.device_imei,
        email: summary.first.customer_email,
        legacyAddress: summary.first.customer_address ?? "",
      }
    : {
        employeeName: "",
        clientName: "—",
        phone: "—",
        city: "",
        imei: "",
        email: "",
        legacyAddress: "",
      };

  async function handleToggleCommissionPaid(
    submissionId: string,
    current: boolean,
  ) {
    setIsWorking((prev) => ({ ...prev, [submissionId]: true }));
    const result = await updateCommissionPaid({
      submissionId,
      commissionPaid: !current,
    });
    setIsWorking((prev) => ({ ...prev, [submissionId]: false }));
    if (!result.success) {
      alert(result.error || t.admin.errorUpdate);
      return;
    }
    router.refresh();
  }

  async function handleUploadLabel(file: File | null) {
    if (!file) return;
    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      alert(t.admin.shippingLabelPdfOnly);
      return;
    }
    setIsUploadingLabel(true);
    const result = await uploadShippingLabel({ requestGroupId: orderId, file });
    setIsUploadingLabel(false);
    if (!result.success) {
      alert(result.error || t.admin.errorUpdate);
      return;
    }
    router.refresh();
  }

  async function handleOrderStatusChange(newStatus: SubmissionStatus) {
    setIsUpdatingOrderStatus(true);
    const result = await updateOrderStatus({ orderId, status: newStatus });
    setIsUpdatingOrderStatus(false);
    if (!result.success) {
      alert(result.error || t.admin.errorUpdateStatus);
      return;
    }
    router.refresh();
  }

  async function handleDeleteOrder() {
    const ok = confirm(t.admin.deleteOrderConfirm);
    if (!ok) return;
    setIsDeletingOrder(true);
    const result = await deleteOrder(orderId);
    setIsDeletingOrder(false);
    if (!result.success) {
      alert(result.error || t.admin.deleteError);
      return;
    }
    router.push("/admin?section=demandes");
    router.refresh();
  }

  async function handleSavePrice() {
    if (!priceEditor) return;
    const value = Number(priceEditor.price);
    const reason = (priceEditor.reason || "").trim();
    if (!Number.isFinite(value) || value <= 0) {
      alert(t.admin.priceUpdateInvalidPrice);
      return;
    }
    if (!reason) {
      alert(t.admin.priceUpdateReasonRequired);
      return;
    }

    const submissionId = priceEditor.submissionId;
    setIsWorking((prev) => ({ ...prev, [submissionId]: true }));
    const result = await updateSubmissionPrice({
      submissionId,
      price: value,
      reason,
    });
    setIsWorking((prev) => ({ ...prev, [submissionId]: false }));

    if (!result.success) {
      alert(result.error || t.admin.priceUpdateError);
      return;
    }

    setPriceEditor(null);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => router.push("/admin?section=demandes")}
            className="inline-flex items-center justify-center rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-2 text-xs font-medium text-foreground transition-all duration-300 hover:border-brand-primary hover:bg-brand-primary/5 hover:scale-105"
          >
            {t.admin.back}
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-(family-name:--font-playfair) text-2xl font-light text-brand-dark sm:text-3xl">
              {t.admin.orderTitle} {displayOrder}
            </h2>
            <Badge variant={summary.overallStatus}>
              {t.admin[STATUS_LABEL_KEY[summary.overallStatus]]}
            </Badge>
          </div>
          <p className="text-sm text-foreground/60">
            {t.admin.placedAt}{" "}
            {summary.first ? formatDate(summary.first.created_at, locale) : "—"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={summary.overallStatus}
            disabled={isUpdatingOrderStatus}
            onChange={(e) =>
              void handleOrderStatusChange(e.target.value as SubmissionStatus)
            }
            className="rounded-card border border-foreground/10 bg-background px-3 py-2 text-xs text-foreground outline-none transition-colors focus:border-brand-primary disabled:opacity-60"
            aria-label={t.admin.status}
            title={t.admin.status}
          >
            <option value="unprocessed">{t.admin.statusUnprocessed}</option>
            <option value="label_sent">{t.admin.statusLabelSent}</option>
            <option value="paid">{t.admin.statusPaid}</option>
            <option value="cancelled">{t.admin.statusCancelled}</option>
          </select>
          <button
            type="button"
            onClick={() => void handleDeleteOrder()}
            disabled={isDeletingOrder}
            className="inline-flex items-center justify-center rounded-full border border-red-500/30 bg-red-500/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-red-700 transition-colors hover:bg-red-500/10 disabled:opacity-60"
          >
            {isDeletingOrder ? "…" : t.admin.deleteOrder}
          </button>
          <div className="rounded-card border border-foreground/10 bg-background px-4 py-2 text-xs text-foreground/70">
            {summary.orderUnitsTotal}{" "}
            {summary.orderUnitsTotal > 1 ? t.admin.itemsPlural : t.admin.items}
            <span className="ml-1 text-foreground/50">
              ({submissions.length}{" "}
              {submissions.length > 1 ? t.admin.linesPlural : t.admin.lines})
            </span>
          </div>
          <div className="rounded-card border border-foreground/10 bg-background px-4 py-2 text-xs text-foreground/70">
            {t.admin.totalLabel}{" "}
            <span className="font-semibold text-brand-primary">
              {summary.netTotal.toFixed(2)}$
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <div className="rounded-card border border-foreground/10 bg-background shadow-soft">
            <div className="border-b border-foreground/10 px-5 py-4">
              <h3 className="text-sm font-semibold text-foreground/80">
                {t.admin.orderItemsTitle}
              </h3>
            </div>
            <div className="divide-y divide-foreground/10">
              {submissions.map((s) => (
                <div key={s.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-[220px]">
                      <div className="font-medium text-foreground">
                        {s.brand_name} {s.model_name}
                      </div>
                      <div className="mt-1 text-xs text-foreground/60">
                        {s.memory} • {s.condition} • {t.admin.quantity}:{" "}
                        {s.quantity}
                      </div>
                      <div className="mt-2 text-sm font-semibold text-brand-primary">
                        <div className="flex flex-wrap items-center gap-2">
                          <span>
                            {t.admin.unitPrice} {s.price.toFixed(2)}$ ·{" "}
                            {t.admin.lineTotal}{" "}
                            {submissionLineTotal(
                              s.price,
                              s.quantity,
                            ).toFixed(2)}
                            $
                          </span>
                          <button
                            type="button"
                            disabled={isWorking[s.id]}
                            onClick={() =>
                              setPriceEditor({
                                submissionId: s.id,
                                price: String(s.price.toFixed(2)),
                                reason: s.price_override_reason ?? "",
                              })
                            }
                            className="rounded-full border border-foreground/15 bg-foreground/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/80 transition-all hover:bg-foreground/10 hover:scale-[1.02] disabled:opacity-60"
                          >
                            {t.admin.editPrice}
                          </button>
                        </div>
                      </div>
                      {s.price_override_reason ? (
                        <div className="mt-2 text-xs text-foreground/60">
                          <span className="font-medium">
                            {t.admin.priceUpdateReason}:
                          </span>{" "}
                          {s.price_override_reason}
                          {s.price_override_previous != null ? (
                            <span className="ml-2 text-foreground/50">
                              ({t.admin.priceUpdatePrevious}{" "}
                              {Number(s.price_override_previous).toFixed(2)}$)
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {canManageCommissionPaid ? (
                        <button
                          type="button"
                          disabled={isWorking[s.id]}
                          onClick={() =>
                            handleToggleCommissionPaid(s.id, s.commission_paid)
                          }
                          className={`inline-flex items-center gap-2 rounded-card border px-3 py-2 text-xs font-medium transition-colors ${
                            s.commission_paid
                              ? "border-green-500/40 bg-green-500/10 text-green-700"
                              : "border-foreground/15 bg-foreground/5 text-foreground/70 hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-700"
                          }`}
                        >
                          {t.admin.commissionPaid}:{" "}
                          {s.commission_paid ? t.admin.yes : t.admin.no}
                        </button>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-2 rounded-card border px-3 py-2 text-xs font-medium ${
                            s.commission_paid
                              ? "border-green-500/40 bg-green-500/10 text-green-700"
                              : "border-foreground/15 bg-foreground/5 text-foreground/70"
                          }`}
                        >
                          {t.admin.commissionPaid}:{" "}
                          {s.commission_paid ? t.admin.yes : t.admin.no}
                        </span>
                      )}
                    </div>
                  </div>

                  {priceEditor?.submissionId === s.id && (
                    <div className="mt-4 rounded-2xl border border-foreground/10 bg-secondary/40 p-4">
                      <div className="grid gap-3 sm:grid-cols-[160px_1fr] sm:items-center">
                        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground/60">
                          {t.admin.unitPrice} ({t.admin.price})
                        </label>
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min="0"
                          value={priceEditor.price}
                          onChange={(e) =>
                            setPriceEditor((prev) =>
                              prev ? { ...prev, price: e.target.value } : prev,
                            )
                          }
                          className="h-10 rounded-card border border-foreground/10 bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-brand-primary"
                        />

                        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground/60">
                          {t.admin.priceUpdateReason}
                        </label>
                        <input
                          type="text"
                          value={priceEditor.reason}
                          onChange={(e) =>
                            setPriceEditor((prev) =>
                              prev ? { ...prev, reason: e.target.value } : prev,
                            )
                          }
                          placeholder={t.admin.priceUpdateReasonPlaceholder}
                          className="h-10 rounded-card border border-foreground/10 bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/40 focus:border-brand-primary"
                        />
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setPriceEditor(null)}
                          className="inline-flex h-10 items-center justify-center rounded-full border border-foreground/15 bg-background px-5 text-xs font-semibold uppercase tracking-[0.12em] text-foreground transition-colors hover:bg-secondary"
                        >
                          {t.admin.cancel}
                        </button>
                        <button
                          type="button"
                          disabled={isWorking[s.id]}
                          onClick={() => void handleSavePrice()}
                          className="inline-flex h-10 items-center justify-center rounded-full bg-brand-dark px-5 text-xs font-semibold uppercase tracking-[0.12em] text-background shadow-sm transition-colors hover:bg-brand-primary disabled:opacity-60"
                        >
                          {isWorking[s.id] ? "…" : t.admin.save}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-card border border-foreground/10 bg-background shadow-soft">
            <div className="border-b border-foreground/10 px-5 py-4">
              <h3 className="text-sm font-semibold text-foreground/80">
                {t.admin.customerTitle}
              </h3>
            </div>
            <div className="space-y-3 px-5 py-4 text-sm">
              {customer.employeeName ? (
                <div>
                  <div className="text-xs font-medium uppercase tracking-[0.12em] text-foreground/60">
                    {t.admin.employeeFullName}
                  </div>
                  <div className="font-medium text-foreground">{customer.employeeName}</div>
                </div>
              ) : null}
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.12em] text-foreground/60">
                  {t.admin.clientFullNameLabel}
                </div>
                <div className="font-medium text-foreground">{customer.clientName}</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.12em] text-foreground/60">
                  {t.admin.clientPhoneLabel}
                </div>
                <div className="text-foreground/70">{customer.phone}</div>
              </div>
              {customer.city ? (
                <div>
                  <div className="text-xs font-medium uppercase tracking-[0.12em] text-foreground/60">
                    {t.admin.clientCityLabel}
                  </div>
                  <div className="text-foreground/70">{customer.city}</div>
                </div>
              ) : null}
              {customer.imei ? (
                <div>
                  <div className="text-xs font-medium uppercase tracking-[0.12em] text-foreground/60">
                    {t.admin.deviceImeiLabel}
                  </div>
                  <div className="font-mono text-sm text-foreground/80">{customer.imei}</div>
                </div>
              ) : null}
              {customer.email ? (
                <div className="text-foreground/70">{customer.email}</div>
              ) : null}
              {customer.legacyAddress &&
              customer.legacyAddress.trim() !== (customer.city ?? "").trim() ? (
                <div className="pt-1 text-foreground/70">
                  <div className="text-xs font-medium uppercase tracking-[0.12em] text-foreground/60">
                    {t.admin.address}
                  </div>
                  <div className="whitespace-pre-line">{customer.legacyAddress}</div>
                </div>
              ) : null}
            </div>
          </div>

          {shipping.shipmentId && (
            <div className="rounded-card border border-foreground/10 bg-background shadow-soft">
              <div className="border-b border-foreground/10 px-5 py-4">
                <h3 className="text-sm font-semibold text-foreground/80">
                  {t.admin.shippingTitle}
                </h3>
              </div>
              <div className="space-y-3 px-5 py-4 text-sm">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium uppercase tracking-[0.12em] text-foreground/60">
                    ClickShip shipment id
                  </span>
                  <span className="font-mono text-foreground/80">
                    {shipping.shipmentId}
                  </span>
                </div>
                {shipping.trackingNumber ? (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium uppercase tracking-[0.12em] text-foreground/60">
                      {t.admin.trackingNumber}
                    </span>
                    {shipping.trackingUrl ? (
                      <a
                        href={shipping.trackingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-brand-primary underline underline-offset-4"
                      >
                        {shipping.trackingNumber}
                      </a>
                    ) : (
                      <span className="font-medium text-foreground/80">
                        {shipping.trackingNumber}
                      </span>
                    )}
                  </div>
                ) : null}

                {shipping.shippingLabelUrl ? (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium uppercase tracking-[0.12em] text-foreground/60">
                      {t.admin.shippingLabel}
                    </span>
                    <a
                      href={shipping.shippingLabelUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-brand-primary underline underline-offset-4"
                    >
                      {t.admin.downloadShippingLabel}
                    </a>
                  </div>
                ) : null}

                <div className="rounded-2xl border border-foreground/10 bg-secondary/40 p-3">
                  <div className="text-xs font-medium uppercase tracking-[0.12em] text-foreground/60">
                    {t.admin.shippingLabel}
                  </div>
                  <div className="mt-2">
                    <div
                      onDragEnter={(e) => {
                        e.preventDefault();
                        setIsLabelDragActive(true);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsLabelDragActive(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setIsLabelDragActive(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsLabelDragActive(false);
                        const f = e.dataTransfer.files?.[0] ?? null;
                        void handleUploadLabel(f);
                      }}
                      className={`relative flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border-2 border-dashed bg-background px-4 py-3 text-left text-xs transition-all ${
                        isLabelDragActive
                          ? "border-brand-primary bg-brand-primary/5"
                          : "border-foreground/20 hover:border-brand-primary/60 hover:bg-secondary"
                      } overflow-hidden`}
                      role="button"
                      tabIndex={0}
                      aria-disabled={isUploadingLabel}
                      onKeyDown={(e) => {
                        if (isUploadingLabel) return;
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          labelFileInputRef.current?.click();
                        }
                      }}
                      onClick={() => {
                        if (isUploadingLabel) return;
                        labelFileInputRef.current?.click();
                      }}
                    >
                      <input
                        ref={labelFileInputRef}
                        type="file"
                        accept="application/pdf"
                        className="absolute inset-0 cursor-pointer opacity-0"
                        disabled={isUploadingLabel}
                        onChange={(e) => {
                          const f = e.target.files?.[0] ?? null;
                          e.currentTarget.value = "";
                          void handleUploadLabel(f);
                        }}
                      />
                      <div className="min-w-0">
                        <div className="truncate font-semibold uppercase tracking-[0.12em] text-foreground">
                          {isUploadingLabel ? "…" : t.admin.uploadShippingLabel}
                        </div>
                        <div className="mt-0.5 truncate text-foreground/60">
                          {t.admin.shippingLabelDropHint}
                        </div>
                      </div>
                      <div className="ml-auto shrink-0 rounded-full border border-foreground/15 bg-foreground/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/80">
                        PDF
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-foreground/60">
                    {t.admin.shippingLabelManualInfo}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-card border border-foreground/10 bg-background shadow-soft">
            <div className="border-b border-foreground/10 px-5 py-4">
              <h3 className="text-sm font-semibold text-foreground/80">
                {t.admin.summaryTitle}
              </h3>
            </div>
            <div className="space-y-3 px-5 py-4 text-sm">
              <div className="flex items-center justify-between text-foreground/70">
                <span>{t.admin.itemsLabel}</span>
                <span className="font-medium text-foreground">
                  {summary.orderUnitsTotal}
                </span>
              </div>
              <div className="flex items-center justify-between text-foreground/70">
                <span>{t.admin.subtotalLabel}</span>
                <span className="font-medium text-foreground">
                  {summary.devicesTotal.toFixed(2)}$
                </span>
              </div>
              <div className="my-2 border-t border-foreground/10" />
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">
                  {t.admin.totalLabel}
                </span>
                <span className="font-semibold text-brand-primary">
                  {summary.netTotal.toFixed(2)}$
                </span>
              </div>
              <div className="text-xs text-foreground/60">
                {t.admin.commissionPaidCount}:{" "}
                <span className="font-medium text-foreground">
                  {summary.commissionPaidCount}/{submissions.length}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
