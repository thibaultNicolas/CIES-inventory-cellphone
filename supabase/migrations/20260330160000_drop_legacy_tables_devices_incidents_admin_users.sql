-- Legacy tables no longer used by the Next.js app (auth = Supabase Auth only;
-- catalogue = brands / models / prices). Safe order: incident_logs FK -> admin_users.
BEGIN;

DROP TABLE IF EXISTS public.incident_logs;

DROP TABLE IF EXISTS public.devices;

DROP TABLE IF EXISTS public.admin_users;

COMMIT;
