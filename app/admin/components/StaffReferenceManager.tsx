"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import {
  createEmployee,
  createStore,
  deleteEmployee,
  deleteStore,
} from "../../actions/staff-reference";

type Employee = {
  id: string;
  full_name: string;
};

type Store = {
  id: string;
  name: string;
};

type StaffReferenceManagerProps = {
  employees: Employee[];
  stores: Store[];
};

export function StaffReferenceManager({
  employees: initialEmployees,
  stores: initialStores,
}: StaffReferenceManagerProps) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [stores, setStores] = useState(initialStores);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCreateEmployee(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsBusy(true);
    const form = new FormData(e.currentTarget);
    const result = await createEmployee({
      fullName: String(form.get("fullName") || ""),
    });
    if (!result.success) {
      setError(result.error || "Erreur lors de l'ajout de l'employé.");
      setIsBusy(false);
      return;
    }
    window.location.reload();
  }

  async function onCreateStore(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsBusy(true);
    const form = new FormData(e.currentTarget);
    const result = await createStore({
      name: String(form.get("storeName") || ""),
    });
    if (!result.success) {
      setError(result.error || "Erreur lors de l'ajout du magasin.");
      setIsBusy(false);
      return;
    }
    window.location.reload();
  }

  async function onDeleteEmployee(id: string) {
    if (!confirm("Supprimer cet employé de la liste ?")) return;
    const result = await deleteEmployee(id);
    if (!result.success) {
      alert(result.error || "Suppression impossible.");
      return;
    }
    setEmployees((prev) => prev.filter((item) => item.id !== id));
  }

  async function onDeleteStore(id: string) {
    if (!confirm("Supprimer ce magasin de la liste ?")) return;
    const result = await deleteStore(id);
    if (!result.success) {
      alert(result.error || "Suppression impossible.");
      return;
    }
    setStores((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-8">
      {error ? (
        <div className="rounded-card border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-card border border-foreground/10 bg-background p-5 shadow-soft">
          <h3 className="text-lg font-medium text-brand-dark">Employés</h3>
          <form onSubmit={onCreateEmployee} className="grid gap-3">
            <input
              name="fullName"
              required
              placeholder="Nom complet"
              className="rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-3 text-sm focus:border-brand-primary focus:bg-background focus:outline-none"
            />
            <button
              type="submit"
              disabled={isBusy}
              className="rounded-full bg-brand-dark px-5 py-3 text-xs font-medium uppercase tracking-[0.14em] text-background"
            >
              Ajouter employé
            </button>
          </form>
          <div className="space-y-2">
            {employees.map((employee) => (
              <div
                key={employee.id}
                className="flex items-center justify-between rounded-card border border-foreground/10 p-3 text-sm"
              >
                <span>{employee.full_name}</span>
                <button
                  type="button"
                  onClick={() => onDeleteEmployee(employee.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-card border border-foreground/10 bg-background p-5 shadow-soft">
          <h3 className="text-lg font-medium text-brand-dark">Magasins</h3>
          <form onSubmit={onCreateStore} className="grid gap-3">
            <input
              name="storeName"
              required
              placeholder="Nom du magasin"
              className="rounded-card border-2 border-transparent bg-[#F5F5F4] px-4 py-3 text-sm focus:border-brand-primary focus:bg-background focus:outline-none"
            />
            <button
              type="submit"
              disabled={isBusy}
              className="rounded-full bg-brand-dark px-5 py-3 text-xs font-medium uppercase tracking-[0.14em] text-background"
            >
              Ajouter magasin
            </button>
          </form>
          <div className="space-y-2">
            {stores.map((store) => (
              <div
                key={store.id}
                className="flex items-center justify-between rounded-card border border-foreground/10 p-3 text-sm"
              >
                <span>{store.name}</span>
                <button
                  type="button"
                  onClick={() => onDeleteStore(store.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
