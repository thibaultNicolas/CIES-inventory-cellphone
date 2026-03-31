-- Bucket Storage "shipping-labels" (étiquettes ClickShip / PDF).
-- Créer le bucket dans le dashboard : Storage > New bucket > shipping-labels, Public: ON.
-- Aligné sur scripts/setup-shipping-labels-bucket.sql
--
-- Les uploads se font côté serveur (service role) ; lecture publique pour les liens de confirmation.

DROP POLICY IF EXISTS "Allow public read shipping labels" ON storage.objects;

CREATE POLICY "Allow public read shipping labels"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'shipping-labels');
