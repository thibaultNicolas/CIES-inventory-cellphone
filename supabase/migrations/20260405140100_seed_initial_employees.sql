-- Référentiel employés (nom complet uniquement). Dédupliqué (Maika* / Xavier* en double retirés).
-- Idempotent : n’insère pas si ce nom existe déjà.

INSERT INTO public.employees (full_name, is_active)
SELECT v.full_name, TRUE
FROM (
  VALUES
    ('Marc-Antoine Angers'),
    ('Jacob Lessard'),
    ('Kelly Gouin'),
    ('Roseline Grégoire-Desrochers'),
    ('Brandon Houle-Tardif'),
    ('Mathias Labrie'),
    ('Mariane Noiseaux'),
    ('Éthan Pinard'),
    ('Constant Renard'),
    ('Cassandra Riopel'),
    ('Jaoua Seguin'),
    ('Maika* Beriau'),
    ('Felix-Antoine Gauthier'),
    ('Elisabeth Houle'),
    ('Sabrina Michaud Ouellette'),
    ('Rachel Cournoyer'),
    ('Mathieu Mailhot'),
    ('Dominic Saint-Laurent'),
    ('Tommy Belanger'),
    ('Xavier* Charbonneau'),
    ('Myriam Cloutier'),
    ('Julio Couture'),
    ('Vickie Houde'),
    ('Gabriel Pellerin'),
    ('Anthony Toupin'),
    ('William Choquette'),
    ('Nicolas Dumulong'),
    ('Jeremy Verret')
) AS v(full_name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.employees e WHERE e.full_name = v.full_name
);
