-- Drop legacy columns from public.submissions now that canonical columns are in use.
-- Uses IF EXISTS guards; apply after migrations that introduced canonical submission columns.
-- Run in Supabase SQL editor or via supabase migration tooling.

BEGIN;

ALTER TABLE public.submissions
  DROP COLUMN IF EXISTS client_name,
  DROP COLUMN IF EXISTS client_email,
  DROP COLUMN IF EXISTS client_phone,
  DROP COLUMN IF EXISTS client_address,
  DROP COLUMN IF EXISTS email,
  DROP COLUMN IF EXISTS phone,
  DROP COLUMN IF EXISTS device_id,
  DROP COLUMN IF EXISTS declared_condition,
  DROP COLUMN IF EXISTS estimated_price,
  DROP COLUMN IF EXISTS marque,
  DROP COLUMN IF EXISTS modele,
  DROP COLUMN IF EXISTS memoire,
  DROP COLUMN IF EXISTS etat,
  DROP COLUMN IF EXISTS prix,
  DROP COLUMN IF EXISTS brand,
  DROP COLUMN IF EXISTS model;

COMMIT;

