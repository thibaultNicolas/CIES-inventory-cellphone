-- Exemple : ajouter des employés au référentiel (nom complet uniquement).
-- Copiez ce fichier, renommez-le (ex. seed-employees-custom.sql) ou exécutez les INSERT dans le SQL Editor Supabase.
--
-- Table : public.employees (full_name, is_active)

INSERT INTO public.employees (full_name, is_active)
SELECT v.full_name, TRUE
FROM (VALUES ('Nom Prénom exemple'), ('Autre employé')) AS v(full_name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.employees e WHERE e.full_name = v.full_name
);
