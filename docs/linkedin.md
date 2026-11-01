# LinkedIn : préparer les publications en quelques minutes

Page : `/admin/linkedin` (menu Acquisition > Publications LinkedIn). Rien n'est publié automatiquement : l'outil prépare le texte et le visuel, tu relis, tu copies, tu publies à la main.

## Une étape avant la première utilisation

Colle dans Supabase > SQL Editor > Run (la page l'affiche aussi tant que la table n'existe pas) :

```sql
create table if not exists public.linkedin_posts (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), kind text not null, label text not null, body text not null, comment text, offer_ids uuid[] not null default array[]::uuid[], published boolean not null default false, published_at timestamptz, linkedin_url text);
alter table public.linkedin_posts enable row level security;
```

Sans cette table, l'outil marche mais ne se souvient pas des offres déjà préparées.

## Routine : 5 minutes par jour

1. **Tous les jours** : onglet « Les alternances du jour » > « Générer les offres du jour ». L'outil propose les 5 offres d'alternance les plus récentes, contrôlées une par une (lien encore en ligne). Décoche/coche, « Mettre à jour l'aperçu ».
2. Relis le texte (modifiable), « Copier le texte », « Télécharger le visuel », publie sur LinkedIn avec l'image.
3. « Enregistrer dans l'historique » : ces offres ne seront plus proposées pendant 60 jours. Tu peux supprimer l'entrée si tu ne publies pas finalement.
4. **Rythme conseillé** : lundi à jeudi, un jour une publication « du jour », un jour un secteur (6 secteurs), un jour une ville ; **vendredi** : le récap de la semaine (10 offres).
5. Option « Liens dans le premier commentaire » : LinkedIn montre moins un post qui contient des liens. Cochée, le post n'a aucun lien et l'outil prépare un commentaire à publier juste après.

## Les 4 formats

| Format | Contenu | Page vers laquelle renvoie la fin du post |
|---|---|---|
| A. Du jour | les 5 offres les plus récentes | `/alternance` |
| B. Par secteur | 5 offres d'un des 6 secteurs : marketing et communication, commerce et business development, ressources humaines, informatique et développement, finance et gestion, administration | `/alternance/<métier>` (pages SEO déjà existantes) |
| C. Par ville | 5 offres d'une des 13 villes de l'inscription (Paris, Lyon, Marseille, Toulouse, Bordeaux, Lille…) | `/alternance/<ville>` |
| D. Récap | les 10 offres les mieux renseignées de la semaine (une par entreprise, 3 par ville au plus) | `/alternance` |

Le secteur d'une offre est déterminé par son intitulé, comme sur les pages du site (`lib/seo/metiers.ts`).

## Ce qui est publié, et pourquoi c'est exact

- **Uniquement des faits** de la base : poste, entreprise, ville, contrat (et durée quand elle est écrite proprement) + un lien vers la fiche Stageio. Jamais la description de l'offre, jamais un contact du recruteur.
- **Alternance seulement**, hors annonces d'écoles et de centres de formation (même filtre que le deck des abonnés), hors entreprises non communiquées.
- **Offres fraîches** : pour France Travail et La bonne alternance, revues par la synchro depuis moins de 48 h ; pour les offres ajoutées à la main, moins de 30 jours.
- **Lien contrôlé à chaque aperçu** : France Travail par son API, les autres par leur page. Une offre « plus en ligne » est retirée d'office ; « lien non vérifiable » est signalé pour que tu regardes toi-même.
- **Une offre par entreprise** dans une publication, et une même annonce reprise par deux sources n'apparaît qu'une fois.
- **Chiffres** (« 412 offres d'alternance en marketing… ») : ceux des pages du site, sinon la phrase est omise.
- **Source citée** dans chaque post, avec la date : « Sources des offres : France Travail, La bonne alternance. » et « en ligne au 6 novembre ».
- Liens avec `?utm_source=linkedin&utm_campaign=<format>-<date>` : les visites et inscriptions apparaissent dans « Trafic et sources » et « Revenus par canal » (source LinkedIn).

## Droits de réutilisation (vérifiés le 1/11/2026)

| Source | Ce qu'on peut faire | Décision |
|---|---|---|
| **France Travail** (API Offres d'emploi) | Offres mises à disposition des partenaires qui adhèrent à la licence de réutilisation : « pour tout usage », y compris sur des sites tiers, hors coordonnées de contact. Citer la source et la date de mise à jour. Pas de fichier de candidatures hors recrutement. | Publiable, source citée |
| **La bonne alternance** | Contenus du site sous licence Etalab 2.0 (source à citer). Les CGU de l'API ne disent rien de plus. | Publiable, source citée. **À confirmer** par écrit auprès de l'équipe La bonne alternance si tu veux une certitude |
| **Adzuna** | Label « Adzuna » obligatoire sur chaque annonce affichée ; au-delà de 14 jours d'essai, « tout produit ou service qui génère des revenus ou des pistes » exige une licence ; rien n'est dit sur les réseaux sociaux. | **Exclue de LinkedIn** |
| **Offres ajoutées à la main / depuis un site carrière** | Faits non protégés (poste, entreprise, ville) + lien vers l'offre. | Publiables, sans description |

Sources : [conditions d'Adzuna](https://developer.adzuna.com/docs/terms_of_service), [CGU France Travail](https://www.francetravail.fr/informations/informations-legales-et-conditio/conditions-generales-dutilisatio.html), [jeu de données Offres d'emploi diffusées à France Travail](https://www.data.gouv.fr/fr/datasets/offres-demploi-diffusees-a-france-travail) (Licence Ouverte), [CGU API La bonne alternance](https://api.apprentissage.beta.gouv.fr/en/cgu).

**À vérifier de ton côté** : Stageio utilise déjà Adzuna dans un produit payant ; leurs conditions demandent une licence au-delà de l'essai (voir `SEO_ROADMAP.md`, décision F). Et, pour France Travail, relis la licence de réutilisation que tu as acceptée sur francetravail.io : le texte exact de la mention de source (je cite « France Travail » et la date) y figure.

## SEO : ce qui existe déjà

Aucune page à créer pour ce que tu demandais : `/alternance/marketing`, `/alternance/commercial`, `/alternance/informatique`, `/alternance/rh`, `/alternance/finance`, `/alternance/assistant-administratif`, `/alternance/<ville>` (dès 3 offres), `/alternance/<métier>/<ville>`, départements, régions, entreprises, guides, sitemaps et IndexNow. Les publications LinkedIn par secteur et par ville renvoient vers ces pages : chaque clic y apporte un visiteur qualifié (et un lien depuis LinkedIn).

Pistes si tu veux aller plus loin : une page « alternance administration » plus large que « assistant administratif » ; une newsletter LinkedIn (« Les alternances de la semaine ») qui reprend le récap du vendredi.

## Fichiers

- `src/lib/linkedin/rules.ts` : ce qui peut être publié (sources, fraîcheur, filtres).
- `src/lib/linkedin/format.ts` : textes, secteurs, villes, liens suivis.
- `src/lib/linkedin/pick.ts` : choix des offres (récentes, sans doublon, une par entreprise).
- `src/lib/linkedin/data.ts` : lectures Supabase, historique, SQL.
- `src/lib/linkedin/visual.tsx` + `src/app/admin/linkedin/visuel/route.ts` : l'image 1080 × 1350.
- `src/app/admin/linkedin/` : la page, l'éditeur et les actions.
- `tests/linkedin.test.ts`.
