-- Table pour les comptes administrateurs
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Index pour la recherche par email
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- RLS (Row Level Security) - Les admins peuvent voir tous les comptes
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policy : Permettre la lecture pour tous (sera protégé par l'application)
CREATE POLICY "Allow read for authenticated" ON admin_users
  FOR SELECT
  USING (true);

-- Policy : Permettre l'insertion pour les admins authentifiés
CREATE POLICY "Allow insert for authenticated" ON admin_users
  FOR INSERT
  WITH CHECK (true);

-- Policy : Permettre la mise à jour pour les admins authentifiés
CREATE POLICY "Allow update for authenticated" ON admin_users
  FOR UPDATE
  USING (true);

-- Policy : Permettre la suppression pour les admins authentifiés
CREATE POLICY "Allow delete for authenticated" ON admin_users
  FOR DELETE
  USING (true);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_users_updated_at();
