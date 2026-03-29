"use server";

import { requireSuperAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-server";
import { isAppRole } from "@/lib/app-role";

type CreateStaffUserData = {
  email: string;
  password: string;
  name: string;
  role: string;
};

export async function createAdminUser(data: CreateStaffUserData) {
  const current = await requireSuperAdmin();
  if (!current) {
    return { success: false, error: "Non autorisé (super admin requis)" };
  }

  const email = data.email.trim().toLowerCase();
  const password = data.password;
  const name = data.name.trim() || null;
  const roleRaw = typeof data.role === "string" ? data.role.trim() : "";

  if (!isAppRole(roleRaw)) {
    return { success: false, error: "Rôle invalide" };
  }
  const role = roleRaw;

  if (!email || !password || password.length < 8) {
    return {
      success: false,
      error: "Email invalide ou mot de passe trop court (minimum 8 caractères)",
    };
  }

  const supabase = createAdminClient();

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role },
    user_metadata: { name: name || "" },
  });

  if (authError || !authData.user) {
    return {
      success: false,
      error: authError?.message || "Impossible de créer l'utilisateur",
    };
  }

  return {
    success: true,
    user: {
      id: authData.user.id,
      email: authData.user.email || email,
      name,
      role,
      created_at: authData.user.created_at || new Date().toISOString(),
      last_login: authData.user.last_sign_in_at ?? null,
    },
  };
}

export async function deleteAdminUser(userId: string) {
  const current = await requireSuperAdmin();
  if (!current) {
    return { success: false, error: "Non autorisé (super admin requis)" };
  }

  if (userId === current.adminId || userId === current.authUserId) {
    return { success: false, error: "Vous ne pouvez pas supprimer votre propre compte" };
  }

  const supabase = createAdminClient();

  const { data: target, error: getErr } = await supabase.auth.admin.getUserById(
    userId
  );
  if (getErr || !target.user) {
    return { success: false, error: "Utilisateur introuvable" };
  }

  const targetRole = (target.user.app_metadata as Record<string, unknown>)?.role;
  if (targetRole === "super_admin") {
    let superAdminCount = 0;
    for (let page = 1; ; page += 1) {
      const { data: list } = await supabase.auth.admin.listUsers({
        page,
        perPage: 200,
      });
      const users = list?.users ?? [];
      for (const u of users) {
        if (
          (u.app_metadata as Record<string, unknown>)?.role === "super_admin"
        ) {
          superAdminCount += 1;
        }
      }
      if (users.length < 200) break;
    }
    if (superAdminCount <= 1) {
      return {
        success: false,
        error: "Impossible de supprimer le dernier super administrateur",
      };
    }
  }

  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
