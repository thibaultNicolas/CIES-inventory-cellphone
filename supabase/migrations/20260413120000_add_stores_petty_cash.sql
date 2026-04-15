-- Petite caisse : montant de départ par magasin (les sorties sont dérivées des rachats dans submissions).

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS petty_cash_opening_balance NUMERIC(14, 2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.stores.petty_cash_opening_balance IS
  'Caisse au départ pour le suivi cashflow (les déductions = somme prix×qté des rachats liés à store_name, hors commissions).';
