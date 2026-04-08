-- Referentiel interne: employes et magasins
-- + champs de commande pour lier la demande au numero employe/magasin/compte client.

CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_number TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS employee_number TEXT,
  ADD COLUMN IF NOT EXISTS store_name TEXT,
  ADD COLUMN IF NOT EXISTS client_account_number TEXT;

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "employees_select_authenticated" ON public.employees;
CREATE POLICY "employees_select_authenticated"
ON public.employees
FOR SELECT
TO authenticated
USING (is_active = TRUE);

DROP POLICY IF EXISTS "stores_select_authenticated" ON public.stores;
CREATE POLICY "stores_select_authenticated"
ON public.stores
FOR SELECT
TO authenticated
USING (is_active = TRUE);
