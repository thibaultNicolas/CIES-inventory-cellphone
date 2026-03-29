"use server";

import { redirect } from "next/navigation";
import { createServerActionClient } from "@/lib/supabase-server";
import { parseAppRole, hasMinRole } from "@/lib/app-role";

export async function login(formData: FormData) {
  const email = (formData.get("email") as string).trim().toLowerCase();
  const password = formData.get("password") as string;
  const redirectTo = formData.get("redirect") as string | null;

  const supabase = await createServerActionClient();
  const { error: signInError, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !data.user?.email) {
    return { error: "Email ou mot de passe incorrect" };
  }

  const role = parseAppRole(
    data.user.app_metadata as Record<string, unknown>
  );
  if (!role) {
    await supabase.auth.signOut();
    return {
      error:
        "Accès refusé. Votre compte n’a pas de rôle attribué (employee, admin ou super_admin).",
    };
  }

  let safeRedirect =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/";

  if (safeRedirect.startsWith("/admin") && !hasMinRole(role, "admin")) {
    safeRedirect = "/";
  }

  redirect(safeRedirect);
}

export async function logout() {
  const supabase = await createServerActionClient();
  await supabase.auth.signOut();
  redirect("/login");
}
