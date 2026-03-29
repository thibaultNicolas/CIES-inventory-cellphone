-- Allow status 'cancelled' on submissions (idempotent).
-- Drop existing CHECK and re-add with 'cancelled'.

ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submissions_status_check;
ALTER TABLE public.submissions ADD CONSTRAINT submissions_status_check
  CHECK (status IN ('pending', 'received', 'inspected', 'paid', 'cancelled'));
