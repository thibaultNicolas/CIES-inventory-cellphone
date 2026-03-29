-- Configuration des politiques RLS pour le bucket device-photos
-- Exécutez ce script dans le SQL Editor de Supabase

-- IMPORTANT : Assurez-vous que le bucket 'device-photos' existe et est configuré comme PUBLIC
-- dans le dashboard Supabase (Storage > device-photos > Settings > Public bucket: ON)

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Public can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can read photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can delete photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to device-photos" ON storage.objects;

-- Politique pour permettre l'INSERT (upload) - Public
CREATE POLICY "Public can upload photos"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'device-photos');

-- Politique pour permettre le SELECT (lecture) - Public
CREATE POLICY "Public can read photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'device-photos');

-- Politique pour permettre le UPDATE (mise à jour) - Public (optionnel)
CREATE POLICY "Public can update photos"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'device-photos')
WITH CHECK (bucket_id = 'device-photos');

-- Politique pour permettre le DELETE (suppression) - Public
CREATE POLICY "Public can delete photos"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'device-photos');
