alter table public.submissions
  add column if not exists price_override_previous numeric,
  add column if not exists price_override_reason text,
  add column if not exists price_override_updated_at timestamptz,
  add column if not exists price_override_updated_by text;

