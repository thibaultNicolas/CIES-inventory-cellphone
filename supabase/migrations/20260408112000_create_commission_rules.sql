CREATE TABLE IF NOT EXISTS public.commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  min_gross NUMERIC(10,2) NOT NULL,
  max_gross NUMERIC(10,2),
  employee_commission NUMERIC(10,2) NOT NULL DEFAULT 0,
  manager_commission NUMERIC(10,2) NOT NULL DEFAULT 0,
  owner_commission NUMERIC(10,2) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commission_rules_active_order
  ON public.commission_rules(is_active, sort_order, min_gross);

INSERT INTO public.commission_rules
  (min_gross, max_gross, employee_commission, manager_commission, owner_commission, sort_order, is_active)
SELECT * FROM (
  VALUES
    (0.00::numeric, 0.00::numeric, 0.00::numeric, 0.00::numeric, 0.00::numeric, 1, true),
    (0.01::numeric, 99.99::numeric, 5.00::numeric, 5.00::numeric, 20.00::numeric, 2, true),
    (100.00::numeric, 249.99::numeric, 5.00::numeric, 5.00::numeric, 30.00::numeric, 3, true),
    (250.00::numeric, 449.99::numeric, 5.00::numeric, 5.00::numeric, 40.00::numeric, 4, true),
    (450.00::numeric, 649.99::numeric, 5.00::numeric, 5.00::numeric, 50.00::numeric, 5, true),
    (650.00::numeric, NULL::numeric, 5.00::numeric, 5.00::numeric, 60.00::numeric, 6, true)
) AS seed(min_gross, max_gross, employee_commission, manager_commission, owner_commission, sort_order, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.commission_rules);
