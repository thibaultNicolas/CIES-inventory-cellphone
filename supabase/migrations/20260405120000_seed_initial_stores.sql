-- Données initiales : magasins (référentiel formulaire rachat).
-- Idempotent : ne réinsère pas si le nom existe déjà.

INSERT INTO public.stores (name, is_active)
VALUES
  ('Victoriaville', TRUE),
  ('Jean23', TRUE),
  ('Thetford Mines', TRUE),
  ('Cap-de-la-Madelaine', TRUE),
  ('Centre Les Rivières', TRUE)
ON CONFLICT (name) DO NOTHING;
