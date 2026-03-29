-- Add ClickShip/Freightcom shipment bookkeeping columns to submissions.
-- Idempotent for existing environments.

ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS clickship_shipment_id TEXT;

ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS shipping_label_status TEXT;

ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS shipping_label_error TEXT;

CREATE INDEX IF NOT EXISTS idx_submissions_clickship_shipment_id
  ON public.submissions(clickship_shipment_id);

