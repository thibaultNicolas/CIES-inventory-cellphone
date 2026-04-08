# Inventory cellphone

Application Next.js + Supabase (rachat, admin, auth par rôles).

## Démarrage

```bash
cp .env.example .env.local
# Renseigner NEXT_PUBLIC_SUPABASE_*, SUPABASE_SERVICE_ROLE_KEY

npm install
npm run dev
```

## Base de données & RLS

- Migrations versionnées : **`supabase/migrations/`**
- Scripts SQL manuels et ordre d’exécution : **`scripts/README.md`**
- RLS actuel : **`scripts/setup-all-tables-rls.sql`**

## Documentation produit / architecture

Voir **`Project.md`**.
