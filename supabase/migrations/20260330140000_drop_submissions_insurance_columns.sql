-- Retrait de l’option « protection d’expédition » / assurance (UI + API).
ALTER TABLE public.submissions
  DROP COLUMN IF EXISTS with_insurance,
  DROP COLUMN IF EXISTS insurance_fee;
