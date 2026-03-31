-- Politiques Storage pour le bucket device-photos
-- Aligné sur scripts/setup-storage-policies.sql
--
-- Lecture publique uniquement (URLs dans les soumissions) ; pas d’upload/update/delete
-- anonymes — écritures via service_role (createAdminClient, uploadDevicePhotoForRachat).

DROP POLICY IF EXISTS "Public can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can read photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can update photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can delete photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to device-photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can read device-photos" ON storage.objects;

CREATE POLICY "Public can read device-photos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'device-photos');
