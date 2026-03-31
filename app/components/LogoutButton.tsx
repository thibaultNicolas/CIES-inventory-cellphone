"use client";

import { useRouter } from "next/navigation";
import { logout } from "../actions/login";
import { LogOut } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";
import { cn } from "@/lib/utils";

type LogoutButtonProps = {
  className?: string;
};

export function LogoutButton({ className }: LogoutButtonProps) {
  const router = useRouter();
  const { t } = useI18n();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={cn(
        "flex items-center gap-2 rounded-full border-2 border-brand-dark bg-background px-6 py-3 text-sm font-medium uppercase tracking-[0.15em] text-brand-dark transition-all duration-300 hover:bg-brand-dark hover:text-background",
        className,
      )}
    >
      <LogOut className="h-4 w-4 shrink-0" aria-hidden />
      {t.nav.logout}
    </button>
  );
}
