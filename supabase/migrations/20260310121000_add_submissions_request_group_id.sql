-- Add a request_group_id to group multiple devices under one business request.
-- Idempotent migration for existing environments.

ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS request_group_id UUID;

CREATE INDEX IF NOT EXISTS idx_submissions_request_group_id
  ON public.submissions(request_group_id);

