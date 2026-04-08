"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

export async function createEmployee(input: { fullName: string }) {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Unauthorized" };

  const fullName = input.fullName.trim();
  if (!fullName) {
    return { success: false, error: "Nom complet requis." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("employees").insert({
    full_name: fullName,
    is_active: true,
  });

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true, error: null };
}

export async function deleteEmployee(employeeId: string) {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Unauthorized" };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("employees")
    .update({ is_active: false })
    .eq("id", employeeId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true, error: null };
}

export async function createStore(input: { name: string }) {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Unauthorized" };

  const name = input.name.trim();
  if (!name) return { success: false, error: "Nom du magasin requis." };

  const supabase = createAdminClient();
  const { error } = await supabase.from("stores").insert({ name, is_active: true });

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true, error: null };
}

export async function deleteStore(storeId: string) {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Unauthorized" };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("stores")
    .update({ is_active: false })
    .eq("id", storeId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true, error: null };
}
