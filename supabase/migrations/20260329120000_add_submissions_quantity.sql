-- Nombre d'unités identiques (même modèle / mémoire / état) par ligne de soumission.
-- `price` reste le prix unitaire ; total ligne = price * quantity.

ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS quantity integer NOT NULL DEFAULT 1;

ALTER TABLE public.submissions
  DROP CONSTRAINT IF EXISTS submissions_quantity_check;

ALTER TABLE public.submissions
  ADD CONSTRAINT submissions_quantity_check
  CHECK (quantity >= 1 AND quantity <= 999);
