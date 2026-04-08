CREATE OR REPLACE FUNCTION public.replace_commission_rules(p_rules JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item JSONB;
  min_g NUMERIC;
  max_g NUMERIC;
  emp NUMERIC;
  mgr NUMERIC;
  own NUMERIC;
  idx INTEGER := 0;
  prev_max NUMERIC := NULL;
BEGIN
  IF jsonb_typeof(p_rules) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'p_rules must be a JSON array';
  END IF;
  IF jsonb_array_length(p_rules) = 0 THEN
    RAISE EXCEPTION 'At least one rule is required';
  END IF;

  FOR item IN
    SELECT value
    FROM jsonb_array_elements(p_rules)
  LOOP
    idx := idx + 1;
    min_g := GREATEST(COALESCE((item->>'minGross')::NUMERIC, 0), 0);
    max_g := CASE WHEN item ? 'maxGross' AND item->>'maxGross' IS NOT NULL AND item->>'maxGross' <> '' THEN GREATEST((item->>'maxGross')::NUMERIC, 0) ELSE NULL END;
    emp := GREATEST(COALESCE((item->>'employeeCommission')::NUMERIC, 0), 0);
    mgr := GREATEST(COALESCE((item->>'managerCommission')::NUMERIC, 0), 0);
    own := GREATEST(COALESCE((item->>'ownerCommission')::NUMERIC, 0), 0);

    IF max_g IS NOT NULL AND max_g < min_g THEN
      RAISE EXCEPTION 'Rule % has maxGross < minGross', idx;
    END IF;
    IF prev_max IS NOT NULL AND min_g <= prev_max THEN
      RAISE EXCEPTION 'Rule % overlaps previous rule', idx;
    END IF;
    IF prev_max IS NULL AND idx > 1 THEN
      RAISE EXCEPTION 'Open-ended rule must be last';
    END IF;

    prev_max := max_g;
  END LOOP;

  UPDATE public.commission_rules
  SET is_active = FALSE
  WHERE is_active = TRUE;

  idx := 0;
  FOR item IN
    SELECT value
    FROM jsonb_array_elements(p_rules)
  LOOP
    idx := idx + 1;
    INSERT INTO public.commission_rules (
      min_gross,
      max_gross,
      employee_commission,
      manager_commission,
      owner_commission,
      sort_order,
      is_active
    )
    VALUES (
      GREATEST(COALESCE((item->>'minGross')::NUMERIC, 0), 0),
      CASE WHEN item ? 'maxGross' AND item->>'maxGross' IS NOT NULL AND item->>'maxGross' <> '' THEN GREATEST((item->>'maxGross')::NUMERIC, 0) ELSE NULL END,
      GREATEST(COALESCE((item->>'employeeCommission')::NUMERIC, 0), 0),
      GREATEST(COALESCE((item->>'managerCommission')::NUMERIC, 0), 0),
      GREATEST(COALESCE((item->>'ownerCommission')::NUMERIC, 0), 0),
      idx,
      TRUE
    );
  END LOOP;
END;
$$;
