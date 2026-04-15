"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/contexts/I18nContext";
import { LogoutButton } from "../../components/LogoutButton";
import { AdminSidebar } from "./AdminSidebar";
import { AdminUsersTable } from "./AdminUsersTable";
import { OrdersTable, type OrderSummary } from "./OrdersTable";
import { OrderDetail } from "./OrderDetail";
import { ProductsManager, type ProductsPricesFiltersInit } from "./ProductsManager";
import { CommissionsDashboard } from "./CommissionsDashboard";
import { CommissionRulesManager } from "./CommissionRulesManager";
import { StaffReferenceManager } from "./StaffReferenceManager";
import { StoreCashflowPanel } from "./StoreCashflowPanel";
import type { CashflowOrphanRow, StoreCashflowRow } from "@/lib/petty-cash";
import {
  ArrowLeft,
  Menu,
  X,
  Users,
  ShoppingBag,
  Package,
  Building2,
  BarChart3,
  Wallet,
} from "lucide-react";
import type { SubmissionStatus } from "@/lib/submissions";
import type { AppRole } from "@/lib/app-role";
import { canManagePaymentsAndCommissions } from "@/lib/app-role";

type AdminSection =
  | "comptes"
  | "referentiel"
  | "demandes"
  | "produits"
  | "commissions"
  | "caisse";

type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  last_login: string | null;
  role: AppRole;
};

type Submission = {
  id: string;
  request_group_id: string | null;
  created_at: string;
  employee_full_name: string;
  store_name: string;
  client_full_name: string;
  client_account_number: string;
  client_city: string;
  device_imei: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
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
  commission_employee?: number | null;
  commission_manager?: number | null;
  commission_owner?: number | null;
};

type Brand = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_at: string;
};

type Model = {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
  image_url: string | null;
  created_at: string;
  brands: { name: string } | { name: string }[];
};

type Price = {
  id: string;
  model_id: string;
  condition: string;
  memory: string;
  price: number;
  created_at: string;
  models: {
    name: string;
    brands: { name: string } | { name: string }[];
  };
};

/** Statistiques agrégées sur toutes les lignes correspondant aux filtres du rapport (hors pagination). */
export type CommissionReportAggregates = {
  totalUnits: number;
  totalBuyback: number;
  totalCommissionEmployee: number;
  totalCommissionManager: number;
  totalCommissionOwner: number;
  totalCommission: number;
  salesByMonth: Array<{ monthKey: string; units: number; buyback: number }>;
  topModels: Array<{ label: string; units: number; buyback: number; commission: number }>;
};

export type CommissionsData = {
  submissions: Submission[];
  total: number;
  unpaidTotal: number;
  unpaidEmployeeTotal: number;
  unpaidManagerTotal: number;
  unpaidOwnerTotal: number;
  globalYearUnitsTotal: number;
  globalYearBuybackTotal: number;
  globalYearEmployeeCommissionTotal: number;
  globalYearManagerCommissionTotal: number;
  globalYearOwnerCommissionTotal: number;
  globalYearCommissionTotal: number;
  globalYearOwnerToReceive: number;
  globalYearOtherCommissionToReceive: number;
  globalYearTotalToReceive: number;
  page: number;
  pageSize: number;
  fromDate: string;
  toDate: string;
  commissionPaid: "all" | "paid" | "unpaid";
  employeeFullName: string;
  storeName: string;
};

type AdminLayoutProps = {
  submissions: Submission[];
  orders: OrderSummary[];
  ordersPage: number;
  ordersPageSize: number;
  totalOrders: number;
  totalOrdersPages: number;
  selectedOrder?: string | null;
  orderSubmissions?: Submission[];
  adminUsers: AdminUser[];
  brands: Brand[];
  models: Model[];
  prices: Price[];
  initialSection?: AdminSection;
  initialProductsTab?: "brands" | "models" | "prices";
  initialProductsPricesFilters?: ProductsPricesFiltersInit;
  commissionsData?: CommissionsData | null;
  commissionReportAggregates?: CommissionReportAggregates | null;
  employees: { id: string; full_name: string }[];
  stores: { id: string; name: string }[];
  cashflowSnapshot: { rows: StoreCashflowRow[]; orphans: CashflowOrphanRow[] };
  /** Section Comptes (création d’utilisateurs) : super_admin uniquement. */
  canManageStaffAccounts?: boolean;
  viewerRole?: AppRole;
};

export function AdminLayout({
  submissions,
  orders,
  ordersPage,
  ordersPageSize,
  totalOrders,
  totalOrdersPages,
  selectedOrder = null,
  orderSubmissions = [],
  adminUsers,
  brands,
  models,
  prices,
  initialSection = "demandes",
  initialProductsTab = "brands",
  initialProductsPricesFilters,
  commissionsData = null,
  commissionReportAggregates = null,
  employees,
  stores,
  cashflowSnapshot,
  canManageStaffAccounts = false,
  viewerRole = "admin",
}: AdminLayoutProps) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const rachatHomeHref = locale === "en" ? "/en" : "/";

  const roleBadgeLabel =
    viewerRole === "super_admin"
      ? "Super admin"
      : viewerRole === "admin"
        ? "Admin"
        : locale === "en"
          ? "Staff"
          : "Employé";

  const compactLogout =
    "h-9 border-brand-dark/35 px-4 py-0 text-[11px] tracking-[0.12em] sm:h-10 sm:px-5 sm:text-xs";
  const canManageProducts = viewerRole === "super_admin";
  const canManageFinancials = canManagePaymentsAndCommissions(viewerRole);
  const sectionFromServer = useMemo<AdminSection>(
    () =>
      !canManageStaffAccounts && initialSection === "comptes"
        ? "demandes"
        : !canManageProducts && initialSection === "produits"
          ? "demandes"
          : initialSection,
    [canManageProducts, canManageStaffAccounts, initialSection],
  );
  const [activeSection, setActiveSection] =
    useState<AdminSection>(sectionFromServer);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);

  useEffect(() => {
    setActiveSection(sectionFromServer);
  }, [sectionFromServer]);

  const mobileSectionItems: { id: AdminSection; label: string; icon: typeof Users }[] =
    [
      ...(canManageStaffAccounts
        ? [{ id: "comptes" as const, label: t.admin.accounts, icon: Users }]
        : []),
      { id: "referentiel", label: t.admin.reference, icon: Building2 },
      { id: "demandes", label: t.admin.tradeInRequests, icon: ShoppingBag },
      { id: "commissions", label: t.admin.commissions, icon: BarChart3 },
      { id: "caisse", label: t.admin.pettyCashNav, icon: Wallet },
      ...(canManageProducts
        ? [{ id: "produits" as const, label: t.admin.products, icon: Package }]
        : []),
    ];

  const updateUrl = (section: AdminSection) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("section", section);
    url.searchParams.delete("order");
    if (section === "produits") {
      if (!url.searchParams.get("tab"))
        url.searchParams.set("tab", initialProductsTab);
    } else {
      url.searchParams.delete("tab");
    }
    if (section === "commissions") {
      url.searchParams.set("commissionPage", "1");
      url.searchParams.set("commissionPaid", "all");
      url.searchParams.delete("commissionFrom");
      url.searchParams.delete("commissionTo");
    } else {
           [
        "commissionPage",
        "commissionPageSize",
        "commissionFrom",
        "commissionTo",
        "commissionPaid",
        "commissionEmployee",
        "commissionStore",
      ].forEach((p) => url.searchParams.delete(p));
    }
    router.replace(
      url.pathname +
        (url.searchParams.toString() ? `?${url.searchParams.toString()}` : ""),
    );
  };

  const handleSectionChange = (section: AdminSection) => {
    if (section === "comptes" && !canManageStaffAccounts) {
      return;
    }
    if (section === "produits" && !canManageProducts) {
      return;
    }
    setActiveSection(section);
    updateUrl(section);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-foreground/[0.07] bg-background/85 backdrop-blur-xl supports-backdrop-filter:bg-background/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-3.5">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2 sm:gap-x-4">
            <span className="inline-flex items-center rounded-md border border-foreground/10 bg-foreground/5 px-2.5 py-1 text-[10px] font-semibold uppercase leading-none tracking-[0.16em] text-foreground/50">
              {roleBadgeLabel}
            </span>
            <Link
              href={rachatHomeHref}
              className="inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-lg border border-brand-dark/35 bg-transparent px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-dark transition-colors hover:border-brand-primary/60 hover:bg-brand-primary/6 hover:text-brand-primary sm:px-3.5 sm:py-2 sm:text-xs sm:tracking-[0.12em]"
            >
              <ArrowLeft className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
              <span className="truncate">{t.admin.backToRachatHome}</span>
            </Link>
          </div>
          <div className="hidden shrink-0 items-center gap-2 sm:gap-3 md:flex">
            <LogoutButton className={compactLogout} />
          </div>
          <div className="flex shrink-0 items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setHeaderMenuOpen((o) => !o)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-foreground/12 text-foreground/80 transition-colors hover:bg-foreground/5 sm:h-10 sm:w-10"
              aria-expanded={headerMenuOpen}
              aria-controls="admin-header-menu"
              aria-label={headerMenuOpen ? t.nav.closeMenu : t.nav.openMenu}
            >
              {headerMenuOpen ? (
                <X className="h-5 w-5" aria-hidden />
              ) : (
                <Menu className="h-5 w-5" aria-hidden />
              )}
            </button>
          </div>
        </div>

        {/* Mobile header menu */}
        <div
          id="admin-header-menu"
          className={`border-t border-foreground/[0.07] bg-background/95 md:hidden ${
            headerMenuOpen ? "visible block" : "hidden"
          }`}
          aria-hidden={!headerMenuOpen}
        >
          <nav className="flex flex-col gap-0 px-4 py-3 pb-4">
            <div className="border-b border-foreground/10 pb-2">
              {mobileSectionItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      handleSectionChange(item.id);
                      setHeaderMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-brand-primary/10 text-brand-primary"
                        : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </button>
                );
              })}
            </div>
            <div className="border-t border-foreground/[0.07] pt-3">
              <LogoutButton className="w-full justify-center py-3" />
            </div>
          </nav>
        </div>
      </header>

      <div className="flex min-w-0">
        <AdminSidebar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          showAccountsSection={canManageStaffAccounts}
          showProductsSection={canManageProducts}
        />

        <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-6 lg:py-12 lg:pl-8">
          {canManageStaffAccounts && activeSection === "comptes" && (
            <div>
              <div className="mb-6 sm:mb-8">
                <h1 className="mb-2 font-(family-name:--font-playfair) text-2xl font-light text-brand-dark sm:text-3xl md:text-4xl lg:text-5xl">
                  {t.admin.accountsManagement}
                </h1>
                <p className="text-foreground/60">
                  {adminUsers.length}{" "}
                  {adminUsers.length > 1
                    ? t.admin.accountsCountLabelPlural
                    : t.admin.accountsCountLabel}{" "}
                  administrateur{adminUsers.length > 1 ? "s" : ""}
                </p>
              </div>
              <AdminUsersTable
                users={adminUsers}
                canManageUsers={canManageStaffAccounts}
              />
            </div>
          )}

          {activeSection === "referentiel" && (
            <div>
              <div className="mb-6 sm:mb-8">
                <h1 className="mb-2 font-(family-name:--font-playfair) text-2xl font-light text-brand-dark sm:text-3xl md:text-4xl lg:text-5xl">
                  {t.admin.referenceTitle}
                </h1>
                <p className="text-foreground/60">{t.admin.referenceSubtitle}</p>
              </div>
              <StaffReferenceManager employees={employees} stores={stores} />
            </div>
          )}

          {activeSection === "demandes" && (
            <div className="min-w-0 w-full">
              <div className="mb-6 sm:mb-8">
                <h1 className="mb-2 font-(family-name:--font-playfair) text-2xl font-light text-brand-dark sm:text-3xl md:text-4xl lg:text-5xl">
                  {t.admin.tradeInRequestsTitle}
                </h1>
                <p className="text-foreground/60">
                  {orders.length}{" "}
                  {orders.length > 1
                    ? t.admin.tradeInRequestsCountLabelPlural
                    : t.admin.tradeInRequestsCountLabel}
                </p>
                {!canManageFinancials ? (
                  <p className="mt-2 max-w-2xl text-sm text-foreground/55">
                    {t.admin.adminReadOnlyFinancialsHint}
                  </p>
                ) : null}
              </div>
              {selectedOrder ? (
                <OrderDetail
                  orderId={selectedOrder}
                  submissions={orderSubmissions}
                  canManagePaymentsAndCommissions={canManageFinancials}
                  viewerRole={viewerRole}
                />
              ) : (
                <OrdersTable
                  orders={orders}
                  page={ordersPage}
                  pageSize={ordersPageSize}
                  total={totalOrders}
                  totalPages={totalOrdersPages}
                  viewerRole={viewerRole}
                  canManagePaymentsAndCommissions={canManageFinancials}
                />
              )}
            </div>
          )}

          {activeSection === "commissions" && (
            <div>
              <div className="mb-6 flex flex-col gap-4 sm:mb-8 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h1 className="mb-2 font-(family-name:--font-playfair) text-2xl font-light text-brand-dark sm:text-3xl md:text-4xl lg:text-5xl">
                    {t.admin.commissionsTitle}
                  </h1>
                  <p className="text-foreground/60">
                    {t.admin.commissionsSubtitle}
                  </p>
                  <p className="mt-2 max-w-2xl text-sm text-foreground/55">
                    {t.admin.reportPaymentActionsHint}
                  </p>
                </div>
                {commissionsData ? (
                  <div className="flex w-full flex-col gap-4 lg:max-w-none lg:flex-row lg:flex-wrap lg:justify-end lg:gap-4">
                    <section className="w-full max-w-[520px] shrink-0 rounded-card border border-foreground/10 bg-background p-4 shadow-soft lg:flex-1">
                      <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-foreground/70">
                        {t.admin.globalYearStatsTitle}
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-foreground/60">{t.admin.totalDevicesSoldLabel}</span>
                          <span className="font-semibold text-brand-dark">
                            {commissionsData.globalYearUnitsTotal}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-foreground/60">{t.admin.totalBuybackAmountLabel}</span>
                          <span className="font-semibold text-brand-dark">
                            {commissionsData.globalYearBuybackTotal.toFixed(2)} $
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-foreground/60">{t.admin.totalEmployeeCommissionLabel}</span>
                          <span className="font-semibold text-brand-dark">
                            {commissionsData.globalYearEmployeeCommissionTotal.toFixed(2)} $
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-foreground/60">{t.admin.totalManagerCommissionLabel}</span>
                          <span className="font-semibold text-brand-dark">
                            {commissionsData.globalYearManagerCommissionTotal.toFixed(2)} $
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-foreground/60">{t.admin.totalOwnerCommissionLabel}</span>
                          <span className="font-semibold text-brand-dark">
                            {commissionsData.globalYearOwnerCommissionTotal.toFixed(2)} $
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-t border-foreground/10 pt-2">
                          <span className="text-foreground/70">{t.admin.totalCommissionGlobalLabel}</span>
                          <span className="font-semibold text-brand-primary">
                            {commissionsData.globalYearCommissionTotal.toFixed(2)} $
                          </span>
                        </div>
                      </div>
                    </section>
                    <section className="w-full max-w-[520px] shrink-0 rounded-card border border-foreground/10 bg-background p-4 shadow-soft lg:flex-1">
                      <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-foreground/70">
                        {t.admin.globalYearToReceiveTitle}
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-foreground/60">
                            {t.admin.ownerCommissionToReceiveLabel}
                          </span>
                          <span className="font-semibold text-brand-dark">
                            {commissionsData.globalYearOwnerToReceive.toFixed(2)} $
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-foreground/60">
                            {t.admin.otherCommissionToReceiveLabel}
                          </span>
                          <span className="font-semibold text-brand-dark">
                            {commissionsData.globalYearOtherCommissionToReceive.toFixed(2)} $
                          </span>
                        </div>
                        <div className="border-t border-foreground/10 pt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-foreground/70">{t.admin.totalToReceiveLabel}</span>
                            <span className="font-semibold text-brand-primary">
                              {commissionsData.globalYearTotalToReceive.toFixed(2)} $
                            </span>
                          </div>
                          <p className="mt-1.5 text-[11px] leading-snug text-foreground/50">
                            {t.admin.totalToReceiveBuybackHint}
                          </p>
                        </div>
                      </div>
                    </section>
                  </div>
                ) : null}
              </div>
              <CommissionsDashboard
                commissionsData={commissionsData}
                commissionReportAggregates={commissionReportAggregates}
                employees={employees}
                stores={stores}
                canExportPdf={canManageFinancials}
              />
              {viewerRole === "super_admin" ? (
                <div className="mt-5">
                  <CommissionRulesManager />
                </div>
              ) : null}
            </div>
          )}

          {activeSection === "caisse" && (
            <div>
              <div className="mb-6 sm:mb-8">
                <h1 className="mb-2 font-(family-name:--font-playfair) text-2xl font-light text-brand-dark sm:text-3xl md:text-4xl lg:text-5xl">
                  {t.admin.pettyCashTitle}
                </h1>
              </div>
              <StoreCashflowPanel
                rows={cashflowSnapshot.rows}
                orphans={cashflowSnapshot.orphans}
                canEditOpening={viewerRole === "super_admin"}
              />
            </div>
          )}

          {canManageProducts && activeSection === "produits" && (
            <div>
              <div className="mb-6 sm:mb-8">
                <h1 className="mb-2 font-(family-name:--font-playfair) text-2xl font-light text-brand-dark sm:text-3xl md:text-4xl lg:text-5xl">
                  {t.admin.productsManagement}
                </h1>
                <p className="text-foreground/60">
                  {brands.length}{" "}
                  {brands.length > 1
                    ? t.admin.productsCountLabelPlural
                    : t.admin.productsCountLabel}
                  , {models.length}{" "}
                  {models.length > 1
                    ? t.admin.modelsLabelPlural
                    : t.admin.modelsLabel}
                  , {prices.length} {t.admin.pricesLabel}
                </p>
              </div>
              <ProductsManager
                initialBrands={brands}
                initialModels={models}
                initialPrices={prices}
                initialTab={initialProductsTab}
                initialPricesFilters={initialProductsPricesFilters}
              />
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
