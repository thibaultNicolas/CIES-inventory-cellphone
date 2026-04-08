"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { hasMinRole, type AppRole } from "@/lib/app-role";
import { LogoutButton } from "./LogoutButton";
import { useI18n } from "@/contexts/I18nContext";
import { Menu, X } from "lucide-react";
import { useStaffAppRole } from "@/hooks/use-staff-app-role";
import { useState } from "react";

function roleLabel(
  role: AppRole,
  t: { superAdmin: string; admin: string; employee: string },
) {
  if (role === "super_admin") return t.superAdmin;
  if (role === "admin") return t.admin;
  return t.employee;
}

const compactLogout =
  "h-9 border-brand-dark/35 px-4 py-0 text-[11px] tracking-[0.12em] sm:h-10 sm:px-5 sm:text-xs";

/**
 * Barre staff sur les pages publiques : visible seulement si l’utilisateur a un rôle app.
 * Lien « Administration » uniquement pour admin et super_admin (pas les employés).
 */
function isRachatSuccesPath(pathname: string): boolean {
  if (pathname === "/rachat/succes") return true;
  return /\/rachat\/succes$/.test(pathname);
}

export function AuthenticatedHeader() {
  const pathname = usePathname();
  const { t, locale } = useI18n();
  const staff = useStaffAppRole();
  const [menuOpen, setMenuOpen] = useState(false);

  if (isRachatSuccesPath(pathname)) {
    return null;
  }

  if (staff.status !== "ready" || !staff.role) {
    return null;
  }

  if (pathname === "/login" || pathname.startsWith("/admin")) {
    return null;
  }

  const { role } = staff;
  const showAdminTab = hasMinRole(role, "admin");
  const staffLabels = {
    superAdmin: locale === "en" ? "Super admin" : "Super admin",
    admin: locale === "en" ? "Admin" : "Admin",
    employee: locale === "en" ? "Staff" : "Employé",
  };

  return (
    <>
      <header className="print:hidden fixed inset-x-0 top-0 z-100 bg-secondary">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-3.5">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2 sm:gap-x-4">
            <span className="inline-flex items-center rounded-md border border-foreground/10 bg-foreground/5 px-2.5 py-1 text-[10px] font-semibold uppercase leading-none tracking-[0.16em] text-foreground/50">
              {roleLabel(role, staffLabels)}
            </span>
            {showAdminTab ? (
              <nav
                className="flex items-center"
                aria-label={locale === "en" ? "Staff" : "Personnel"}
              >
                <Link
                  href="/admin"
                  className="inline-flex items-center rounded-lg border border-brand-dark/35 bg-transparent px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-dark transition-colors hover:border-brand-primary/60 hover:bg-brand-primary/6 hover:text-brand-primary sm:px-3.5 sm:py-2 sm:text-xs sm:tracking-[0.12em]"
                >
                  {t.nav.adminDashboard}
                </Link>
              </nav>
            ) : null}
          </div>

          <div className="hidden shrink-0 items-center gap-2 sm:gap-3 sm:flex">
            <LogoutButton className={compactLogout} />
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:hidden">
            {showAdminTab ? (
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-foreground/12 text-foreground/80 transition-colors hover:bg-foreground/5 sm:h-10 sm:w-10"
                aria-expanded={menuOpen}
                aria-controls="staff-header-menu"
                aria-label={menuOpen ? t.nav.closeMenu : t.nav.openMenu}
              >
                {menuOpen ? (
                  <X className="h-5 w-5" aria-hidden />
                ) : (
                  <Menu className="h-5 w-5" aria-hidden />
                )}
              </button>
            ) : (
              <LogoutButton className={compactLogout} />
            )}
          </div>
        </div>

        {menuOpen && showAdminTab ? (
          <div
            id="staff-header-menu"
            className="border-t border-foreground/[0.07] bg-background/95 px-4 py-4 sm:hidden"
          >
            <Link
              href="/admin"
              className="mb-4 block rounded-lg border border-brand-dark/35 bg-transparent px-4 py-3 text-center text-sm font-semibold uppercase tracking-[0.12em] text-brand-dark transition-colors hover:bg-brand-primary/6"
              onClick={() => setMenuOpen(false)}
            >
              {t.nav.adminDashboard}
            </Link>
            <LogoutButton className="w-full justify-center py-3" />
          </div>
        ) : null}
      </header>
      {/* Réserve l’espace sous la barre fixe pour ne pas masquer les pages avec nav fixed */}
      <div className="print:hidden h-14 w-full shrink-0" aria-hidden />
    </>
  );
}
