-- Update submissions.status allowed values to:
-- unprocessed | label_sent | paid | cancelled
-- Also updates the default from 'pending' to 'unprocessed' (if present).
-- Idempotent migration for existing environments.

BEGIN;

-- Drop legacy constraint (pending/received/inspected/paid/cancelled)
ALTER TABLE public.submissions
  DROP CONSTRAINT IF EXISTS submissions_status_check;

-- Normalize legacy values so existing rows comply with the new constraint.
UPDATE public.submissions
SET status = CASE
  WHEN lower(status) = 'pending' THEN 'unprocessed'
  WHEN lower(status) IN ('received', 'inspected') THEN 'label_sent'
  ELSE status
END
WHERE status IS NOT NULL
  AND lower(status) IN ('pending', 'received', 'inspected');

-- Update default for new inserts (some deployments had DEFAULT 'pending').
ALTER TABLE public.submissions
  ALTER COLUMN status SET DEFAULT 'unprocessed';

-- Re-add constraint with the new allowed statuses.
ALTER TABLE public.submissions
  ADD CONSTRAINT submissions_status_check
  CHECK (status IN ('unprocessed', 'label_sent', 'paid', 'cancelled'));

COMMIT;

