# Project Summary

## Overview

This web application lets customers **sell their used cellphones** (buyback / _rachat_) to the business. Users select device brand/model, condition, and storage; get an instant price quote; add one or more devices to a cart; then submit their contact and shipping details. The platform handles submission storage, optional shipping labels (ClickShip), and an admin dashboard to manage requests, products, and users. Transactional email is not used; the team follows up outside the app.

**Business flow:** Customer → Select device(s) → Get price(s) → Enter contact/shipping → Submit → Admin processes request (status, PDF bordereau, contact for shipping, etc.).

---

## Tech Stack

| Layer              | Technology                                                       |
| ------------------ | ---------------------------------------------------------------- |
| **Framework**      | Next.js 16 (App Router)                                          |
| **UI**             | React 19, Tailwind CSS 4, shadcn-ui, Framer Motion, Lucide React |
| **Backend / Data** | Supabase (PostgreSQL, Auth, Storage, RLS)                        |
| **Email**          | _(none — no transactional email in app)_                        |
| **Shipping**       | ClickShip (Freightcom) API for Canadian shipping labels          |
| **Maps**           | Google Maps Places (address autocomplete)                        |
| **PDF**            | @react-pdf/renderer (shipping label / bordereau)                 |
| **i18n**           | Custom context (`I18nContext`) + `translations.ts` (FR/EN)       |

---

## Architecture

### App structure

- **Root:** `app/` (Next.js App Router), shared UI in `app/components/`, `src/` for libs, components, and global styles.
- **Public routes:**
  - `/` — French home (default)
  - `/en`, `/en/*` — English locale (e.g. `/en/rachat`, `/en/a-propos`)
  - `/rachat` — Buyback wizard (brand → model → condition/memory → cart + contact/shipping)
  - `/merci`, `/en/merci` — Thank-you page after submission (with optional summary)
  - `/a-propos`, `/politique-de-confidentialite`, `/termes-et-conditions`, `/contact`
- **Admin:** `/admin` — Dashboard (demandes, comptes, produits, incidents); `/login` for admin auth.
- **API:** `/api/admin/upload-image`, `/api/bordereau/[id]` (PDF), `/api/incidents` (Loi 25 incident log).

### Data flow

- **Read (public):** Server components use `createCachedClient()` (Supabase anon, no cookies) to fetch `brands`, `models`, `prices` (and derived min prices). RLS restricts direct access to `submissions`.
- **Write (submit):** Server Action `submitRachat` uses `createAdminClient()` (service role) to insert into `submissions`, optional ClickShip label. Path revalidation for `/` and `/en`.
- **Admin:** All submission/product/admin reads and writes use service role (or authenticated admin) and RLS so only admins see sensitive data.

---

## Features

### Public

1. **Home** — Hero, “how it works” (evaluate → ship → get paid), popular models, CTA, footer with legal and Loi 25 responsible contact.
2. **Rachat wizard (4 steps):**
   - **Step 1:** Choose brand (cards with logos).
   - **Step 2:** Choose model (filtered by brand, with min price).
   - **Step 3:** Condition (Comme neuf / Bon / Acceptable / Rayé), memory (from `prices`), instant price; add to cart; optional “add another device”.
   - **Step 4:** Cart summary, contact (name, email, phone), address (Google Places autocomplete if key set), privacy consent, optional insurance; submit.
3. **Thank-you page** — Confirmation message, optional submission summary, link to download shipping label if available.
4. **Legal & info** — Privacy policy, terms, about, contact; cookie banner (consent before non-essential scripts).

### Admin

1. **Demandes (submissions)** — List with status (pending, received, inspected, paid), filters, update status, delete (with storage cleanup), download bordereau PDF.
2. **Comptes (admin users)** — CRUD, active/inactive, notification toggle ; connexion via **Supabase Auth** avec rôle dans `app_metadata.role` ; la table `admin_users` peut tenir profil / préférences (ex. notifications).
3. **Produits** — Tabs: Brands, Models, Prices; CRUD; image upload to Supabase Storage.
4. **Incidents (Loi 25)** — Incident log for confidentiality incidents (table `incident_logs`, API route, admin-only).

### Integrations

- **ClickShip:** Canadian address parsing, create shipment, get tracking + label PDF (optional; failures don’t block submission).
- **Google Maps Places:** Address autocomplete on step 4 (requires `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`).
- **Supabase Storage:** `device-images` (product images), `device-photos` (submission photos); admin upload API.

---

## Data Model (Supabase / PostgreSQL)

| Table             | Purpose                                                                                                                     |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **brands**        | Brand name, slug, logo_url                                                                                                  |
| **models**        | brand_id, name, slug, image_url                                                                                             |
| **prices**        | model_id, condition, memory, price (one row per model/condition/memory)                                                     |
| **submissions**   | request*group_id, brand_id, model_id, brand_name, model_name, memory, condition, price, customer*\* , device_photos, status |
| **admin_users**   | email, name, password hash, is_active, notifications_enabled, last_login                                                    |
| **incident_logs** | Loi 25 incident register (admin-only)                                                                                       |

Submissions are grouped by `request_group_id` for multi-device orders. RLS unifié : catalogue en lecture publique, soumissions (insert anon), le reste via service role ou session admin — voir `scripts/setup-all-tables-rls.sql` et `scripts/README.md`.

---

## Security & Compliance

- **RLS:** Politiques centralisées dans `scripts/setup-all-tables-rls.sql` ; guide d’exécution dans `scripts/README.md`.
- **Loi 25 (Québec):** Registre d’incidents (`incident_logs`) ; consentement cookies ; mentions à la collecte ; suppression des données côté admin (soumissions + photos). Détail opérationnel : `scripts/README.md`.
- **Admin:** Service role uniquement côté serveur (Server Actions, routes API). Accès admin via Supabase Auth + `app_metadata.role` (`employee` \| `admin` \| `super_admin`).

---

## Scripts & Operations

| Script / doc                         | Purpose                                                          |
| ------------------------------------ | ---------------------------------------------------------------- |
| `npm run dev`                        | Next.js dev server                                               |
| `npm run build` / `start`            | Production build / run                                           |
| `npm run seed`                       | Seed brands, models, prices from `data.json` (and device-images) |
| `npm run create-admin`               | Create admin user (CLI, Auth + rôle)                             |
| `supabase/migrations/`               | Historique des changements de schéma                             |
| `scripts/schema.sql`                 | Bootstrap catalogue + storage de base                            |
| `scripts/setup-all-tables-rls.sql`   | RLS unifié                                                       |
| `scripts/setup-storage-policies.sql` | Politiques Storage                                               |
| `scripts/README.md`                  | Ordre d’exécution SQL et notes Loi 25                            |

---

## Environment Variables (typical)

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase client
- `SUPABASE_SERVICE_ROLE_KEY` — Server-side admin and submissions insert (never expose to client)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — Address autocomplete (optional)
- ClickShip: e.g. `CLICKSHIP_API_URL`, `CLICKSHIP_API_KEY` (or similar; see `src/lib/clickship.ts`)

---

## Implementation Notes (Senior Dev Summary)

**Strengths**

- Clear separation: server components for data (rachat page, admin page), client components for wizard and forms; Server Actions for submit and mutations.
- Single source of truth for submission shape (`src/lib/submissions.ts`: types, normalize, select lists); consistent use in admin and PDF.
- Resilient submit flow: ClickShip failures don’t block submission success; errors logged.
- Compliance taken seriously: RLS, Loi 25 docs, cookie banner, consent in wizard, deletion of submission + photos.
- Caching: `createCachedClient()` for read-only server data; revalidatePath after submit.
- Accessibility and UX: step indicator, scroll to top on step change, optional Google autocomplete, structured data (JSON-LD) on home/locale layout.

**Areas to consider**

- **Rachat wizard size:** `rachat-wizard.tsx` is large (~1.3k lines); could be split by step (e.g. Step1Brand, Step2Model, Step3ConditionCart, Step4Contact) or by feature (address autocomplete, cart summary) for maintainability and testing.
- **Price fetch:** Wizard uses Supabase client-side for memories and price; `app/actions/prices.ts` exists but wizard doesn’t use it. Unifying on server action (or server-loaded price for current selection) could simplify and secure pricing logic.
- **i18n:** Thank-you and some admin-facing strings are still hardcoded FR; extending `translations.ts` and `useI18n()` to all user-facing copy would complete FR/EN parity.
- **Admin auth:** Supabase Auth + rôles ; si besoin d’OAuth fournisseurs ou de claims plus riches, étendre `app_metadata` ou une table de permissions tout en gardant le middleware cohérent.
- **Errors in wizard:** User-facing error messages could be centralized (e.g. translation keys or a small error map) so API/validation errors are consistent and translatable.

---

## Quick Reference: Key Files

| Area                  | Files                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------ |
| **Rachat flow**       | `app/rachat/page.tsx`, `app/rachat/rachat-wizard.tsx`, `app/actions/submit-rachat.ts`                  |
| **Submissions**       | `src/lib/submissions.ts`, `app/admin/page.tsx`, `app/admin/components/SubmissionsTable.tsx`            |
| **Prices / products** | `app/actions/prices.ts`, `app/actions/products.ts`, `app/admin/components/ProductsManager.tsx`         |
| **Shipping**          | `src/lib/clickship.ts`; PDF: `app/api/bordereau/[id]/route.ts`, `src/components/pdf/ShippingLabel.tsx` |
| **Auth / Supabase**   | `middleware.ts`, `src/lib/supabase/*`, `src/lib/admin-auth.ts`, `app/login/page.tsx`                   |
| **i18n**              | `src/lib/translations.ts`, `src/lib/i18n.ts`, `contexts/I18nContext.tsx`                               |

---

_This document summarizes the current codebase as of the current implementation. Pour RLS, SQL manuel et notes Loi 25 : `scripts/README.md` et `README.md` à la racine._
