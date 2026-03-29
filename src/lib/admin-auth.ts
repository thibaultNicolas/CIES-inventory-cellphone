import { createServerActionClient } from "@/lib/supabase-server";
import {
  parseAppRole,
  hasMinRole,
  type AppRole,
} from "@/lib/app-role";

export type AuthenticatedStaff = {
  authUserId: string;
  email: string;
  adminId: string;
  name: string | null;
  role: AppRole;
};

/** @deprecated Utiliser AuthenticatedStaff — conservé pour compatibilité des imports. */
export type AuthenticatedAdmin = AuthenticatedStaff;

export async function getStaff(): Promise<AuthenticatedStaff | null> {
  const supabase = await createServerActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  const role = parseAppRole(user.app_metadata as Record<string, unknown>);
  if (!role) {
    return null;
  }

  const email = user.email.trim().toLowerCase();
  const name =
    typeof user.user_metadata?.name === "string" && user.user_metadata.name.trim()
      ? user.user_metadata.name.trim()
      : null;

  return {
    authUserId: user.id,
    email,
    adminId: user.id,
    name,
    role,
  };
}

export async function requireMinRole(
  minimum: AppRole
): Promise<AuthenticatedStaff | null> {
  const staff = await getStaff();
  if (!staff) return null;
  if (!hasMinRole(staff.role, minimum)) return null;
  return staff;
}

/** Admin panel + actions réservés aux rôles admin et super_admin. */
export async function requireAdmin(): Promise<AuthenticatedStaff | null> {
  return requireMinRole("admin");
}

/** Gestion des comptes (création / suppression) : super_admin uniquement. */
export async function requireSuperAdmin(): Promise<AuthenticatedStaff | null> {
  return requireMinRole("super_admin");
}
