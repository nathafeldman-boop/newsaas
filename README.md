# Alt — l'app Tinder de l'alternance et du stage

Trouve ton alternance ou ton stage en swipant les offres, comme sur une app
de rencontre. Onboarding rapide (compétences, ville, parcours, CV
facultatif), deck de swipe avec like/pass/postuler direct, favoris, suivi de
candidatures, et un système de parrainage.

## Stack

- **Next.js 16** (App Router, Turbopack) + TypeScript + Tailwind CSS 4
- **Supabase** : Auth, Postgres (RLS), Storage (CV)
- **Mistral AI** : ingestion/structuration des offres à partir d'une URL ou d'un texte collé
- **Framer Motion** : deck de swipe façon Tinder

## Setup

1. **Dépendances**

   ```bash
   npm install
   ```

2. **Supabase**

   - Crée un projet sur [supabase.com](https://supabase.com) (ou utilise-en un existant).
   - Applique les migrations dans `supabase/migrations/` (via `supabase db push`
     avec la CLI, ou en les collant dans le SQL Editor du dashboard, dans
     l'ordre des fichiers). Elles créent :
     - `20260901000000_init.sql` — tables, enums, trigger de création de profil/parrainage
     - `20260901000001_rls.sql` — Row Level Security + bucket Storage `cvs`
     - `20260901000002_seed_demo_offers.sql` — 12 offres de démo pour tester le swipe
   - Récupère l'URL du projet et les clés dans *Project Settings > API*.

3. **Variables d'environnement**

   Copie `.env.example` vers `.env.local` et renseigne :

   ```bash
   cp .env.example .env.local
   ```

   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `MISTRAL_API_KEY` (console.mistral.ai) pour l'ingestion d'offres
   - `INGEST_API_SECRET` pour appeler `/api/offers/ingest` depuis un script externe
   - `ADMIN_EMAILS` : emails autorisés à accéder à `/admin/offres`

4. **Lancer en local**

   ```bash
   npm run dev
   ```

## Ingestion d'offres

Deux façons d'ajouter des offres via Mistral :

- **Page admin** (`/admin/offres`, réservée aux emails listés dans
  `ADMIN_EMAILS`) : colle une URL d'offre ou son texte brut, Mistral
  structure les champs et l'offre est ajoutée au deck de swipe.
- **API** : `POST /api/offers/ingest` avec `Authorization: Bearer
  $INGEST_API_SECRET`, pour brancher un script ou un cron externe.

  ```bash
  curl -X POST https://ton-domaine/api/offers/ingest \
    -H "Authorization: Bearer $INGEST_API_SECRET" \
    -H "Content-Type: application/json" \
    -d '{"sourceUrl":"https://..."}'
  ```

## Structure

```
src/
  app/                  Pages (App Router)
    (app)/              Pages authentifiées avec nav (swipe, favoris, profil, ...)
    onboarding/          Wizard d'onboarding (hors nav)
    login/, inscription/ Auth
    api/offers/ingest/   Endpoint d'ingestion Mistral
  components/            Composants React par domaine
  lib/supabase/          Clients Supabase (browser, server, admin, middleware)
  lib/mistral/           Client Mistral + extraction/ingestion d'offres
  types/database.ts      Types Supabase (à remplacer par `supabase gen types` une fois le projet lié)
supabase/migrations/     Schéma SQL versionné
```
