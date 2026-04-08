
-- Persist commission amounts per submission line.
ALTER TABLE public.submissions
ADD COLUMN IF NOT EXISTS commission_employee NUMERIC(10,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS commission_manager NUMERIC(10,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS commission_owner NUMERIC(10,2) NOT NULL DEFAULT 0;

-- Backfill existing rows based on current payout rules.
WITH base AS (
  SELECT
    id,
    (COALESCE(price, 0)::numeric * GREATEST(COALESCE(quantity, 1), 1)::numeric) AS gross
  FROM public.submissions
)
UPDATE public.submissions s
SET
  commission_employee = CASE WHEN b.gross <= 0 THEN 0 ELSE 5 END,
  commission_manager = CASE WHEN b.gross <= 0 THEN 0 ELSE 5 END,
  commission_owner = CASE
    WHEN b.gross <= 0 THEN 0
    WHEN b.gross < 100 THEN 20
    WHEN b.gross < 250 THEN 30
    WHEN b.gross < 450 THEN 40
    WHEN b.gross < 650 THEN 50
    ELSE 60
  END
FROM base b
WHERE b.id = s.id;
