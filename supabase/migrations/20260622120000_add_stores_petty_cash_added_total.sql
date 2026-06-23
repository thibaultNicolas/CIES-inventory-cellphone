-- Petite caisse : montants ajoutés cumulés (en plus de la caisse au départ).

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS petty_cash_added_total NUMERIC(14, 2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.stores.petty_cash_added_total IS
  'Somme des montants ajoutés à la petite caisse (caisse au départ + ce total = entrées avant déductions rachat).';

CREATE OR REPLACE FUNCTION public.add_store_petty_cash_amount(p_store_id uuid, p_amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  UPDATE public.stores
  SET petty_cash_added_total = petty_cash_added_total + p_amount
  WHERE id = p_store_id AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Store not found or inactive';
  END IF;
END;
$$;
