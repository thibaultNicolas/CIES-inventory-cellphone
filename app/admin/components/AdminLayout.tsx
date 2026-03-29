"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useI18n } from "@/contexts/I18nContext";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";
import { LogoutButton } from "../../components/LogoutButton";
import { AdminSidebar } from "./AdminSidebar";
import { AdminUsersTable } from "./AdminUsersTable";
import { SubmissionsTableWithFilters } from "./SubmissionsTableWithFilters";
import { OrdersTable, type OrderSummary } from "./OrdersTable";
import { OrderDetail } from "./OrderDetail";
import { ProductsManager } from "./ProductsManager";
import { IncidentLogsTable } from "./IncidentLogsTable";
import { CommissionsDashboard } from "./CommissionsDashboard";
import { Menu, X, Users, ShoppingBag, Package, AlertTriangle, DollarSign } from "lucide-react";
import type { SubmissionStatus } from "@/lib/submissions";
import type { AppRole } from "@/lib/app-role";

type AdminSection =
  | "comptes"
  | "demandes"
  | "produits"
  | "incidents"
  | "commissions";

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
  with_insurance: boolean;
  insurance_fee: number;
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
  const [activeSection, setActiveSection] =
    useState<AdminSection>(initialSection);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);

  const mobileSectionItems: { id: AdminSection; label: string; icon: typeof Users }[] =
    [
      ...(canManageStaffAccounts
        ? [{ id: "comptes" as const, label: t.admin.accounts, icon: Users }]
        : []),
      { id: "demandes", label: t.admin.tradeInRequests, icon: ShoppingBag },
      { id: "commissions", label: t.admin.commissions, icon: DollarSign },
      { id: "produits", label: t.admin.products, icon: Package },
      { id: "incidents", label: t.admin.incidents, icon: AlertTriangle },
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
    setActiveSection(section);
    updateUrl(section);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-foreground/10 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex shrink-0 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-4">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="AcheteTonCell"
              width={200}
              height={100}
              className="h-10 w-auto"
              priority
            />
          </Link>
          <span className="text-[10px] uppercase tracking-wider text-foreground/45">
            {viewerRole === "super_admin"
              ? "Super admin"
              : viewerRole === "admin"
                ? "Admin"
                : "Employé"}
          </span>
          </div>
          {/* Desktop: language + logout */}
          <div className="hidden items-center gap-6 md:flex lg:gap-8">
            <LanguageSwitcher />
            <LogoutButton />
          </div>
          {/* Mobile: hamburger */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              type="button"
              onClick={() => setHeaderMenuOpen((o) => !o)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-foreground/10 bg-background text-foreground transition-colors hover:bg-foreground/5"
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
          className={`border-t border-foreground/10 bg-background md:hidden ${
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
            <div className="flex items-center gap-2 border-t border-foreground/10 px-4 pt-3">
              <span className="text-xs uppercase tracking-wider text-foreground/50">
                {locale === "fr" ? "Langue" : "Language"}
              </span>
              <LanguageSwitcher />
            </div>
            <div className="mt-2 border-t border-foreground/10 pt-3">
              <LogoutButton />
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
                <OrderDetail orderId={selectedOrder} submissions={orderSubmissions} />
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
              <CommissionsDashboard commissionsData={commissionsData} />
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

          {activeSection === "incidents" && (
            <div>
              <div className="mb-6 sm:mb-8">
                <h1 className="mb-2 font-(family-name:--font-playfair) text-2xl font-light text-brand-dark sm:text-3xl md:text-4xl lg:text-5xl">
                  {t.admin.incidentsRegister}
                </h1>
                <p className="text-foreground/60">
                  {t.admin.incidentsSubtitle}
                </p>
              </div>
              <IncidentLogsTable />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
