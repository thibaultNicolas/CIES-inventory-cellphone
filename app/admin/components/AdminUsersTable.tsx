"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createAdminUser, deleteAdminUser } from "../../actions/admin-users";
import type { AppRole } from "@/lib/app-role";
import { Trash2, UserPlus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  last_login: string | null;
  role: AppRole;
};

type AdminUsersTableProps = {
  users: AdminUser[];
  canManageUsers?: boolean;
};

function roleLabelFr(role: AppRole): string {
  switch (role) {
    case "employee":
      return "Employé";
    case "admin":
      return "Admin";
    case "super_admin":
      return "Super admin";
    default:
      return role;
  }
}

export function AdminUsersTable({
  users: initialUsers,
  canManageUsers = false,
}: AdminUsersTableProps) {
  const [users, setUsers] = useState(initialUsers);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreateUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;
    const role = formData.get("role") as AppRole;

    const result = await createAdminUser({ email, password, name, role });

    if (result.success) {
      window.location.reload();
    } else {
      setError(result.error || "Erreur lors de la création du compte");
      setIsSubmitting(false);
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce compte ?")) {
      return;
    }

    const result = await deleteAdminUser(userId);
    if (result.success) {
      setUsers(users.filter((u) => u.id !== userId));
    } else {
      alert(result.error || "Erreur lors de la suppression");
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return "Jamais";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-(family-name:--font-playfair) text-2xl font-light text-brand-dark sm:text-3xl">
            Comptes équipe
          </h2>
          <p className="mt-1 text-sm text-foreground/60">
            {users.length} compte{users.length > 1 ? "s" : ""} au total
          </p>
        </div>
        {canManageUsers && (
          <button
            type="button"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex shrink-0 items-center justify-center gap-2 rounded-full bg-brand-dark px-6 py-3 text-sm font-medium uppercase tracking-[0.15em] text-background shadow-lg transition-all duration-300 hover:bg-brand-primary hover:scale-105 sm:self-center"
          >
            <UserPlus className="h-4 w-4" />
            Créer un compte
          </button>
        )}
      </div>

      <AnimatePresence>
        {canManageUsers && showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-card border border-foreground/10 bg-background p-6 shadow-soft"
          >
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-brand-dark">
                  Nouvel utilisateur
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="text-foreground/60 hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {error && (
                <div className="rounded-card border-2 border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-soft">
                  {error}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Nom (optionnel)
                  </label>
                  <input
                    type="text"
                    name="name"
                    className="w-full rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-3 text-foreground transition-all placeholder:text-foreground/40 focus:border-brand-primary focus:bg-background focus:outline-none"
                    placeholder="Jean Dupont"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-3 text-foreground transition-all placeholder:text-foreground/40 focus:border-brand-primary focus:bg-background focus:outline-none"
                    placeholder="user@example.com"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Rôle *
                  </label>
                  <select
                    name="role"
                    required
                    defaultValue="employee"
                    className="w-full rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-3 text-foreground focus:border-brand-primary focus:bg-background focus:outline-none"
                  >
                    <option value="employee">Employé</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super admin</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Mot de passe *
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={8}
                    className="w-full rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-3 text-foreground transition-all placeholder:text-foreground/40 focus:border-brand-primary focus:bg-background focus:outline-none"
                    placeholder="Minimum 8 caractères"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-full bg-brand-dark px-6 py-3 text-sm font-medium uppercase tracking-[0.15em] text-background shadow-lg transition-all duration-300 hover:bg-brand-primary hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isSubmitting ? "Création..." : "Créer le compte"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setError(null);
                  }}
                  className="rounded-full border-2 border-brand-dark bg-background px-6 py-3 text-sm font-medium uppercase tracking-[0.15em] text-brand-dark shadow-lg transition-all duration-300 hover:scale-105 hover:bg-brand-dark hover:text-background"
                >
                  Annuler
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="overflow-x-auto rounded-card border border-foreground/10 bg-background shadow-soft">
        <Table className="min-w-[760px]">
          <TableHeader>
            <TableRow>
              <TableHead className="px-3 sm:px-6">Nom</TableHead>
              <TableHead className="px-3 sm:px-6">Email</TableHead>
              <TableHead className="px-3 sm:px-6">Rôle</TableHead>
              <TableHead className="whitespace-nowrap px-3 sm:px-6">
                Créé le
              </TableHead>
              <TableHead className="whitespace-nowrap px-3 sm:px-6">
                Dernière connexion
              </TableHead>
              {canManageUsers && (
                <TableHead className="px-3 text-right sm:px-6">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={canManageUsers ? 6 : 5}
                  className="h-24 px-3 text-center text-foreground/50 sm:px-6"
                >
                  Aucun compte
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="px-3 py-3 font-medium sm:px-6 sm:py-4">
                    {user.name || "—"}
                  </TableCell>
                  <TableCell className="px-3 py-3 sm:px-6 sm:py-4">
                    {user.email}
                  </TableCell>
                  <TableCell className="px-3 py-3 text-sm sm:px-6 sm:py-4">
                    {roleLabelFr(user.role)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-3 text-sm sm:px-6 sm:py-4">
                    {formatDate(user.created_at)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-3 text-sm text-foreground/60 sm:px-6 sm:py-4">
                    {formatDate(user.last_login)}
                  </TableCell>
                  {canManageUsers && (
                    <TableCell className="px-3 py-3 text-right sm:px-6 sm:py-4">
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(user.id)}
                        className="rounded-card p-2 text-red-500 transition-all hover:scale-105 hover:bg-red-50"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
