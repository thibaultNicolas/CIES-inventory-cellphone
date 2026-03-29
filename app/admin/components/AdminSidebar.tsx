"use client";

import { useMemo } from "react";
import { Users, ShoppingBag, Package, AlertTriangle, DollarSign } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";

type AdminSection = "comptes" | "demandes" | "produits" | "incidents" | "commissions";

type AdminSidebarProps = {
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  showAccountsSection?: boolean;
};

export function AdminSidebar({
  activeSection,
  onSectionChange,
  showAccountsSection = false,
}: AdminSidebarProps) {
  const { t } = useI18n();

  const menuItems = useMemo(
    () => [
      ...(showAccountsSection
        ? [{ id: "comptes" as const, label: t.admin.accounts, icon: Users }]
        : []),
      { id: "demandes" as const, label: t.admin.tradeInRequests, icon: ShoppingBag },
      { id: "commissions" as const, label: t.admin.commissions, icon: DollarSign },
      { id: "produits" as const, label: t.admin.products, icon: Package },
      { id: "incidents" as const, label: t.admin.incidents, icon: AlertTriangle },
    ],
    [t.admin, showAccountsSection]
  );

  return (
    <aside className="hidden w-64 shrink-0 border-r border-foreground/10 bg-background p-6 lg:block">
      <div className="mb-8">
        <h2 className="font-(family-name:--font-playfair) text-2xl font-light text-brand-dark">
          {t.admin.administration}
        </h2>
      </div>

      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center gap-3 rounded-card px-4 py-3 text-left transition-all ${
                isActive
                  ? "bg-brand-primary/10 text-brand-primary border-2 border-brand-primary"
                  : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground border-2 border-transparent"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
