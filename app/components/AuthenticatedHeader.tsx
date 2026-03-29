"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { hasMinRole, type AppRole } from "@/lib/app-role";
import { LanguageSwitcher } from "./LanguageSwitcher";
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

/**
 * Barre staff sur les pages publiques : visible seulement si l’utilisateur a un rôle app.
 * Lien « Administration » uniquement pour admin et super_admin (pas les employés).
 */
export function AuthenticatedHeader() {
  const pathname = usePathname();
  const { t, locale } = useI18n();
  const staff = useStaffAppRole();
  const [menuOpen, setMenuOpen] = useState(false);

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
    <header className="sticky top-0 z-50 border-b border-foreground/10 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3">
          <Link href="/" className="flex shrink-0 items-center">
            <Image
              src="/logo.png"
              alt="AcheteTonCell"
              width={200}
              height={100}
              className="h-9 w-auto sm:h-10"
              priority
            />
          </Link>
          <span className="hidden text-[10px] uppercase tracking-wider text-foreground/45 sm:inline">
            {roleLabel(role, staffLabels)}
          </span>
          {showAdminTab ? (
            <nav
              className="flex items-center gap-1 sm:ml-1"
              aria-label={locale === "en" ? "Staff" : "Personnel"}
            >
              <Link
                href="/admin"
                className="rounded-full border-2 border-brand-dark bg-brand-dark px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-background transition-colors hover:bg-brand-primary sm:px-4 sm:py-2 sm:text-sm"
              >
                {t.nav.adminDashboard}
              </Link>
            </nav>
          ) : null}
        </div>

        <div className="hidden items-center gap-4 md:flex md:gap-6">
          <LanguageSwitcher />
          <LogoutButton />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-foreground/10 bg-background text-foreground hover:bg-foreground/5"
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
        </div>
      </div>

      {menuOpen ? (
        <div
          id="staff-header-menu"
          className="border-t border-foreground/10 bg-background px-4 py-4 md:hidden"
        >
          {showAdminTab ? (
            <Link
              href="/admin"
              className="mb-4 block rounded-full border-2 border-brand-dark bg-brand-dark px-4 py-3 text-center text-sm font-semibold uppercase tracking-[0.12em] text-background"
              onClick={() => setMenuOpen(false)}
            >
              {t.nav.adminDashboard}
            </Link>
          ) : null}
          <LogoutButton />
        </div>
      ) : null}
    </header>
  );
}
