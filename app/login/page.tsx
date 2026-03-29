"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { login } from "../actions/login";
import { Lock } from "lucide-react";

function LoginPageInner() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.append("redirect", redirectTo);

    try {
      const result = await login(formData);
      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      }
    } catch {
      setError("Une erreur s'est produite. Veuillez réessayer.");
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md">
        <div className="mb-12 text-center">
          <div className="inline-block">
            <Image
              src="/logo.png"
              alt="AcheteTonCell"
              width={150}
              height={50}
              className="mx-auto h-12 w-auto"
              priority
            />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-card border border-foreground/10 bg-background p-8 shadow-soft"
        >
          <div className="mb-8 text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-brand-dark/10 p-3">
                <Lock className="h-6 w-6 text-brand-dark" strokeWidth={1.5} />
              </div>
            </div>
            <h1 className="mb-2 font-(family-name:--font-playfair) text-3xl font-light text-brand-dark">
              Connexion
            </h1>
            <p className="text-sm text-foreground/60">
              Accès réservé aux comptes autorisés
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Courriel
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                disabled={isLoading}
                className="w-full rounded-card border-2 border-transparent bg-[#F5F5F4] px-6 py-4 text-foreground transition-all placeholder:text-foreground/40 focus:border-brand-primary focus:bg-background focus:outline-none disabled:opacity-50"
                placeholder="vous@exemple.com"
                autoFocus
                autoComplete="email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Mot de passe
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                disabled={isLoading}
                className="w-full rounded-card border-2 border-transparent bg-[#F5F5F4] px-6 py-4 text-foreground transition-all placeholder:text-foreground/40 focus:border-brand-primary focus:bg-background focus:outline-none disabled:opacity-50"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-card border-2 border-red-200 bg-red-50 p-4 text-sm text-red-800"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full bg-brand-dark px-12 py-5 text-center text-sm font-medium uppercase tracking-[0.15em] text-background shadow-lg transition-all duration-300 hover:scale-105 hover:bg-brand-primary disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              {isLoading ? "Connexion…" : "Se connecter"}
            </button>
          </form>
        </motion.div>

        <p className="mt-8 text-center text-xs text-foreground/40">
          Authentification sécurisée via Supabase. Rôles : employé, admin, super
          admin.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginPageInner />
    </Suspense>
  );
}
