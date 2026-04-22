-- Réf. linter Supabase : table publique sans RLS (accès direct anon/authentifié dangereux).
-- Toute lecture / écriture applicative passe par le service role ou la RPC replace_commission_rules (SECURITY DEFINER).
-- Aucune politique pour anon / authenticated = pas d'accès direct via clé API publique.

ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;
