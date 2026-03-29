-- Add Freightcom/ClickShip shipping fields and commission_paid to submissions.
-- Safe to re-run on existing DB: ADD COLUMN IF NOT EXISTS.

ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS tracking_url TEXT;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS shipping_label_url TEXT;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS commission_paid BOOLEAN DEFAULT false NOT NULL;
