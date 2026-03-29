-- Champs magasin / employé pour le flux rachat (étape 4).
-- Les anciennes colonnes customer_* restent pour l’historique ; email et adresse peuvent être NULL.

ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS employee_full_name TEXT;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS client_full_name TEXT;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS client_city TEXT;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS device_imei TEXT;

ALTER TABLE public.submissions ALTER COLUMN customer_email DROP NOT NULL;
ALTER TABLE public.submissions ALTER COLUMN customer_address DROP NOT NULL;
