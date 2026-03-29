-- Policies for Supabase Storage bucket "shipping-labels" (Freightcom/ClickShip label PDFs).
-- 1. Create the bucket in Dashboard: Storage > New bucket > name: "shipping-labels", Public: ON.
-- 2. Run this script in Supabase SQL Editor.

-- Allow public read so confirmation page and email links work.
DROP POLICY IF EXISTS "Allow public read shipping labels" ON storage.objects;
CREATE POLICY "Allow public read shipping labels"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'shipping-labels');

-- Server-side uploads use service role (bypasses RLS). No INSERT policy required.
