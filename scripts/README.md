# Scripts SQL & base de données

## Ordre recommandé (nouveau projet Supabase)

1. **`schema.sql`** — Tables `brands`, `models`, `prices`, bucket `device-images`, politiques de base.
2. **`schema-admin-users.sql`** — Table `admin_users` (optionnel si vous ne synchronisez que via Auth).
3. **`create-incident-logs-table.sql`** — Registre d’incidents (Loi 25).
4. **`setup-shipping-labels-bucket.sql`** — Bucket étiquettes (si utilisé).
5. **`setup-storage-policies.sql`** — Politiques Storage pour `device-photos` (adapter si besoin).
6. **`setup-all-tables-rls.sql`** — RLS unifié (catalogue public en lecture, reste via service role).

Tout cela peut être exécuté dans **Supabase → SQL Editor**. Les évolutions incrémentales sont versionnées dans **`supabase/migrations/`** (`supabase db push` ou copie manuelle).

## Autres commandes

- `npm run seed` — `scripts/seed-database.ts`
- `npm run create-admin` (alias `create-admin-user`) — `scripts/create-admin-user.ts`  
  Recommandé : `npm run create-admin -- --email x@y.com --password '...' [--name "Prénom"] [--role super_admin]`  
  Forme positionnelle : 2ᵉ arg = mot de passe, 3ᵉ = **nom affiché** (pas un second mot de passe).
- `npm run migrate-images` — `scripts/migrate-brand-model-images.ts` : télécharge les `logo_url` / `image_url` encore hébergées sur un **autre** projet Supabase (ou autre host) et les réupload dans le bucket `device-images` du projet défini dans `.env.local`, puis met à jour les lignes en base.  
  `npm run migrate-images -- --dry-run` pour simuler. Optionnel dans `.env.local` : `IMAGE_MIGRATE_ONLY_HOST=ancien-ref.supabase.co` pour ne traiter que ce domaine.

## Conformité (Loi 25, Québec)

- Registre des incidents : table `incident_logs` + section admin.
- Politique de confidentialité, consentement cookies, suppression des données côté admin : voir l’app et la doc métier dans `Project.md`.
