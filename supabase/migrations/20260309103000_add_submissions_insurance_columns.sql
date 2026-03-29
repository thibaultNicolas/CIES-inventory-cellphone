-- Persist optional shipping protection selection on trade-in submissions.
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS with_insurance BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS insurance_fee NUMERIC(10, 2) DEFAULT 0 NOT NULL;

