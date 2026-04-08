-- Plus d’association employé ↔ magasin (retirer store_id si présent).

DROP INDEX IF EXISTS public.employees_store_id_idx;

ALTER TABLE public.employees
  DROP COLUMN IF EXISTS store_id;
