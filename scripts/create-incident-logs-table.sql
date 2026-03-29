-- Table pour le Registre des Incidents de Confidentialité (Loi 25)
-- Accessible uniquement par les administrateurs

CREATE TABLE IF NOT EXISTS incident_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  description TEXT NOT NULL,
  affected_count INTEGER NOT NULL DEFAULT 0,
  measures_taken TEXT,
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'resolved', 'closed'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id)
);

-- Index pour les recherches par date
CREATE INDEX IF NOT EXISTS idx_incident_logs_date ON incident_logs(incident_date DESC);

-- Index pour les recherches par statut
CREATE INDEX IF NOT EXISTS idx_incident_logs_status ON incident_logs(status);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_incident_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER trigger_update_incident_logs_updated_at
  BEFORE UPDATE ON incident_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_incident_logs_updated_at();

-- Activer RLS (Row Level Security)
ALTER TABLE incident_logs ENABLE ROW LEVEL SECURITY;

-- Politique : Seuls les admins peuvent lire les incidents
CREATE POLICY "Only admins can read incident logs"
  ON incident_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Politique : Seuls les admins peuvent créer des incidents
CREATE POLICY "Only admins can create incident logs"
  ON incident_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Politique : Seuls les admins peuvent modifier les incidents
CREATE POLICY "Only admins can update incident logs"
  ON incident_logs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Commentaire sur la table
COMMENT ON TABLE incident_logs IS 'Registre des incidents de confidentialité conforme à la Loi 25 du Québec';
