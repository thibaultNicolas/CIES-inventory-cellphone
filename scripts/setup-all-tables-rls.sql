-- ============================================================================
-- RLS sur toutes les tables métier — accès public minimal
-- ============================================================================
-- À exécuter dans Supabase : SQL Editor → Run.
--
-- Modèle de sécurité (aligné sur ce repo Next.js) :
-- - Clé anon (navigateur + createCachedClient) : SELECT sur brands, models, prices
--   uniquement (catalogue rachat).
-- - Aucune politique pour anon sur submissions, admin_users, incident_logs, devices
--   → lecture / écriture impossible via l’API publique.
-- - Clé service_role (SUPABASE_SERVICE_ROLE_KEY, jamais côté client) : contourne
--   le RLS — admin, submit-rachat, seed, merci/succès, storage côté serveur.
--
-- Prérequis : SUPABASE_SERVICE_ROLE_KEY dans .env.local côté serveur.
-- ============================================================================

-- Ancienne fonction utilisée par d’anciennes politiques « authenticated » (non
-- utilisées par l’auth admin cookie de cette app).
DROP FUNCTION IF EXISTS is_admin_user() CASCADE;

-- Supprimer toutes les politiques existantes sur ces tables (noms variables).
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

-- Activer RLS partout
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_logs ENABLE ROW LEVEL SECURITY;

-- Table optionnelle (inventaire « flat ») : ne pas faire échouer le script si absente
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'devices'
  ) THEN
    EXECUTE 'ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Catalogue public (wizard rachat + pages serveur en clé anon)
-- Écritures : uniquement via service_role (admin / seed / actions serveur)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Données sensibles : aucune politique pour anon / authenticated
-- → tout passe par service_role côté serveur (createAdminClient, etc.)
-- ---------------------------------------------------------------------------
-- submissions : pas de politique publique (Loi 25 / PII)
-- admin_users : pas de politique publique
-- incident_logs : pas de politique publique
-- devices : pas de politique publique

-- ---------------------------------------------------------------------------
-- Option : autoriser INSERT soumissions avec la clé anon (sans service role)
-- Décommentez seulement si vous changez submit-rachat pour utiliser l’anon key.
-- ---------------------------------------------------------------------------
-- CREATE POLICY "anon_insert_submissions"
--   ON public.submissions
--   FOR INSERT
--   TO anon
--   WITH CHECK (true);

-- ============================================================================
-- Vérification rapide
-- ============================================================================
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename IN ('brands','models','prices','submissions','admin_users','incident_logs','devices')
-- ORDER BY tablename;
--
-- SELECT tablename, policyname, roles, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN ('brands','models','prices','submissions','admin_users','incident_logs','devices')
-- ORDER BY tablename, policyname;
-- ============================================================================
