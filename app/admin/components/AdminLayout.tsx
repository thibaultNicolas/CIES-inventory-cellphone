"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/contexts/I18nContext";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";
import { LogoutButton } from "../../components/LogoutButton";
import { AdminSidebar } from "./AdminSidebar";
import { AdminUsersTable } from "./AdminUsersTable";
import { OrdersTable, type OrderSummary } from "./OrdersTable";
import { OrderDetail } from "./OrderDetail";
import { ProductsManager } from "./ProductsManager";
import { CommissionsDashboard } from "./CommissionsDashboard";
import {
  ArrowLeft,
  Menu,
  X,
  Users,
  ShoppingBag,
  Package,
  DollarSign,
} from "lucide-react";
import type { SubmissionStatus } from "@/lib/submissions";
import type { AppRole } from "@/lib/app-role";

type AdminSection = "comptes" | "demandes" | "produits" | "commissions";

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
  client_full_name: string;
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

export type CommissionsData = {
  submissions: Submission[];
  total: number;
  unpaidTotal: number;
  page: number;
  pageSize: number;
  fromDate: string;
  toDate: string;
  commissionPaid: "all" | "paid" | "unpaid";
};

type AdminLayoutProps = {
  submissions: Submission[];
  orders: OrderSummary[];
  selectedOrder?: string | null;
  orderSubmissions?: Submission[];
  adminUsers: AdminUser[];
  brands: Brand[];
  models: Model[];
  prices: Price[];
  initialSection?: AdminSection;
  initialProductsTab?: "brands" | "models" | "prices";
  commissionsData?: CommissionsData | null;
  /** Section Comptes (création d’utilisateurs) : super_admin uniquement. */
  canManageStaffAccounts?: boolean;
  viewerRole?: AppRole;
};

export function AdminLayout({
  submissions,
  orders,
  selectedOrder = null,
  orderSubmissions = [],
  adminUsers,
  brands,
  models,
  prices,
  initialSection = "demandes",
  initialProductsTab = "brands",
  commissionsData = null,
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

  const compactLang =
    "h-9 gap-1.5 border-foreground/15 px-3 py-0 text-[11px] tracking-[0.12em] sm:h-10 sm:px-3.5";
  const compactLogout =
    "h-9 border-brand-dark/35 px-4 py-0 text-[11px] tracking-[0.12em] sm:h-10 sm:px-5 sm:text-xs";
  const sectionFromServer = useMemo<AdminSection>(
    () =>
      !canManageStaffAccounts && initialSection === "comptes"
        ? "demandes"
        : initialSection,
    [canManageStaffAccounts, initialSection],
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
      { id: "demandes", label: t.admin.tradeInRequests, icon: ShoppingBag },
      { id: "commissions", label: t.admin.commissions, icon: DollarSign },
      { id: "produits", label: t.admin.products, icon: Package },
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
            <LanguageSwitcher triggerClassName={compactLang} />
            <LogoutButton className={compactLogout} />
          </div>
          <div className="flex shrink-0 items-center gap-2 md:hidden">
            <LanguageSwitcher triggerClassName={compactLang} />
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

      <div className="flex">
        <AdminSidebar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          showAccountsSection={canManageStaffAccounts}
        />

        <main className="flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-6 lg:py-12 lg:pl-8">
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

          {activeSection === "demandes" && (
            <div>
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
              </div>
              {selectedOrder ? (
                <OrderDetail
                  orderId={selectedOrder}
                  submissions={orderSubmissions}
                  canManageCommissionPaid={viewerRole === "super_admin"}
                />
              ) : (
                <OrdersTable orders={orders} />
              )}
            </div>
          )}

          {activeSection === "commissions" && (
            <div>
              <div className="mb-6 sm:mb-8">
                <h1 className="mb-2 font-(family-name:--font-playfair) text-2xl font-light text-brand-dark sm:text-3xl md:text-4xl lg:text-5xl">
                  {t.admin.commissionsTitle}
                </h1>
                <p className="text-foreground/60">
                  {t.admin.commissionsSubtitle}
                </p>
              </div>
              <CommissionsDashboard
                commissionsData={commissionsData}
                canManageCommissionPaid={viewerRole === "super_admin"}
              />
            </div>
          )}

          {activeSection === "produits" && (
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
              />
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
