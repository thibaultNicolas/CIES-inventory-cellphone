/**
 * Rôles applicatifs (stockés dans Supabase Auth → app_metadata.role).
 * Ne jamais faire confiance au client : vérifier côté serveur / middleware.
 */
export const APP_ROLES = ["employee", "admin", "super_admin"] as const;
export type AppRole = (typeof APP_ROLES)[number];

const ROLE_RANK: Record<AppRole, number> = {
  employee: 1,
  admin: 2,
  super_admin: 3,
};

export function isAppRole(value: unknown): value is AppRole {
  return (
    typeof value === "string" &&
    (APP_ROLES as readonly string[]).includes(value)
  );
}

/** Lit app_metadata.role sur le JWT Supabase. */
export function parseAppRole(
  appMetadata: Record<string, unknown> | null | undefined
): AppRole | null {
  const role = appMetadata?.role;
  return isAppRole(role) ? role : null;
}

export function hasMinRole(userRole: AppRole, minimum: AppRole): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[minimum];
}

/** Prix, statuts de rachat (sauf annulation), commission payée, règles — réservé au super_admin. */
export function canManagePaymentsAndCommissions(role: AppRole): boolean {
  return role === "super_admin";
}
