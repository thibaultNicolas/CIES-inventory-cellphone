-- RLS sur les tables métier — accès public minimal
-- Aligné sur scripts/setup-all-tables-rls.sql (adapté si certaines tables legacy ont été supprimées).
--
-- - Clé anon : SELECT sur brands, models, prices (catalogue rachat).
-- - submissions : RLS activé, aucune politique anon → accès via service_role côté serveur.

DROP FUNCTION IF EXISTS is_admin_user() CASCADE;

-- Supprimer les politiques existantes sur ces tables (si présentes).
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'brands',
        'models',
        'prices',
        'submissions',
        'admin_users',
        'incident_logs',
        'devices'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Tables legacy optionnelles (sinon déjà supprimées par une migration ultérieure)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'admin_users'
  ) THEN
    EXECUTE 'ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'incident_logs'
  ) THEN
    EXECUTE 'ALTER TABLE public.incident_logs ENABLE ROW LEVEL SECURITY';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'devices'
  ) THEN
    EXECUTE 'ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

CREATE POLICY "anon_authenticated_select_brands"
  ON public.brands
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "anon_authenticated_select_models"
  ON public.models
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "anon_authenticated_select_prices"
  ON public.prices
  FOR SELECT
  TO anon, authenticated
  USING (true);
