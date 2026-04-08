-- Employés : uniquement le nom complet (plus de numéro).
-- Soumissions : suppression de la colonne employee_number (remplacée par employee_full_name déjà présent).

ALTER TABLE public.submissions
  DROP COLUMN IF EXISTS employee_number;

ALTER TABLE public.employees
  DROP CONSTRAINT IF EXISTS employees_employee_number_key;

ALTER TABLE public.employees
  DROP COLUMN IF EXISTS employee_number;
