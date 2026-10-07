# SEO Stageio — audit & roadmap

_Dernière mise à jour : 06/10/2026 — Phase 1 terminée ; Phase 2 livrée (pages métier × ville, décision A appliquée) ; simulateur de salaire en ligne._

---

## 1. État des lieux (exploration du repo)

| Sujet | Constat |
|---|---|
| Stack | Next.js 16.3 App Router, React 19, Supabase (Postgres + RLS), Vercel Hobby. `src/proxy.ts` = middleware (runtime Node). |
| Rendu | Tout le contenu public est **rendu côté serveur** (Server Components) : titres, offres, FAQ et JSON-LD sont dans le HTML initial — vérifié en prod. Accueil en ISR (1 h), guides en SSG, listes `/offres*` dynamiques (searchParams), fiches offres désormais en ISR (1 h). |
| Source des offres | Crons quotidiens : **Adzuna** (4 330 actives) et **France Travail** (898 actives) ≈ **5 230 offres actives** (pas 7 000), réparties ~2 900 stages / ~2 350 alternances. Adzuna ne fournit qu'un **extrait de ~500 caractères** coupé par « … » ; France Travail fournit la description complète. |
| Domaine | `stageio.fr` → 308 → `https://www.stageio.fr` (OK, HSTS actif). Toutes les URLs absolues (canonical, sitemap, OG, JSON-LD) pointent déjà sur `www`. |
| Pages indexables | `/`, `/offres`, `/offres/alternance`, `/offres/stage`, `/offres/secteur/*`, `/offres/ville/*` (seuil 5 offres), `/offres/[slug]` (fiches), `/guides` + 4 guides, `/inscription`, `/legal/*`. |
| Métadonnées | `metadata` / `generateMetadata` partout, template `%s \| Stageio` dans le layout racine, OG + Twitter card par défaut (`/og-image.jpg`), favicon + icon + apple-icon présents. |
| Données structurées | Accueil : FAQPage, Organization, WebSite, SoftwareApplication (note seulement si vrais avis). Fiches : JobPosting + BreadcrumbList. Guides : Article + BreadcrumbList + FAQPage. |
| robots / llms | `robots.ts` propre (privé bloqué, crawlers IA autorisés), `public/llms.txt` présent. |

---

## 2. Audit technique — priorisé impact / effort

Légende statut : ✅ corrigé dans le commit Phase 1 · ❓ décision Nathan · 🔜 Phase 2+ · 🧑 action Nathan

| # | Problème | Impact | Effort | Statut |
|---|---|---|---|---|
| 1 | **Sitemap tronqué à 1 000 offres sur ~5 230** : Supabase (PostgREST « Max Rows ») plafonne chaque réponse à 1 000 lignes, le `.limit(45000)` était ignoré en silence → ~80 % des offres invisibles pour Google via le sitemap. | Très fort | Faible | ✅ Pagination par tranches de 1 000 + sitemap index segmenté |
| 2 | **Soft 404 massif** : toute URL inconnue/supprimée (`/nimporte-quoi`) faisait une redirection 307 vers `/login` (middleware en « liste blanche »). Google classe ça en soft 404 et `/login` absorbait des signaux. | Fort | Faible | ✅ Le middleware ne protège plus que les pages membres ; le reste reçoit un vrai 404 |
| 3 | **Titres dupliqués « \| Stageio \| Stageio »** sur les ~5 230 fiches offres (+ pages légales « — Stageio \| Stageio »). | Fort | Faible | ✅ |
| 4 | **Pagination** : `?page=N` avait un canonical vers la page 1 et un titre identique (120 pages « Offres de stage \| Stageio »), et chaque page affichait 120 liens de pagination. `?page=999` répondait 200 avec une liste vide (soft 404). | Fort | Faible | ✅ Canonical auto-référent, titre « – page N », pagination fenêtrée, 404 hors limites |
| 5 | **JobPosting non éligible** sur les 4 330 offres Adzuna : Google for Jobs exige la description complète, or l'extrait Adzuna est tronqué. Risque d'action manuelle « données structurées » sur tout le site. | Fort (risque) | Faible | ✅ JobPosting conservé uniquement pour les offres à description complète (France Travail) |
| 6 | **Pages villes fausses** : la normalisation concaténait « Annemasse, Saint-Julien-en-Genevois » en une ville inexistante, ignorait le format France Travail (« 75 - PARIS 08 »), et les comptages tournaient sur 1 000 lignes seulement. | Fort | Faible | ✅ Nouvelle normalisation (testée sur 16 formats réels) + comptage sur tout le catalogue + filtre SQL |
| 7 | **Fiches Adzuna = contenu fin et dupliqué** : ~4 330 pages avec le même extrait de 500 caractères que sur Adzuna et des dizaines d'agrégateurs. Risque « scaled content » qui peut tirer tout le domaine vers le bas (signal site-wide). | Très fort (risque) | Faible à moyen | ❓ Voir décision A |
| 8 | **Doublon `newsaas-seven.vercel.app`** : le site entier y répond en 200, indexable. | Moyen | Faible | ✅ `X-Robots-Tag: noindex` sur `*.vercel.app` (🧑 redirection Vercel en plus, optionnel) |
| 9 | **Fiches offres non mises en cache** (`no-store`, 1 requête Supabase par passage de Googlebot) → TTFB. | Moyen (CWV + budget de crawl) | Faible | ✅ ISR 1 h + client Supabase sans cookies |
| 10 | Meta description des fiches = 155 premiers caractères bruts (souvent le même texte d'entreprise, coupé en plein mot). | Moyen | Faible | ✅ « Stage chez X à Ville (durée). » + extrait coupé proprement |
| 11 | URL de fiche non canonique servie en 200 (`/offres/autre-texte-<uuid>`). | Faible | Faible | ✅ 308 vers l'URL canonique |
| 12 | `SearchAction` du JSON-LD WebSite vers `/offres?q=` qui n'existe pas (et Google a retiré la sitelinks search box). | Faible | Faible | ✅ Retiré (+ `alternateName` pour le nom du site) |
| 13 | `/login` indexable, dans le sitemap, titre identique à l'accueil. `/inscription` et `/desabonnement` sans titre propre. | Faible | Faible | ✅ `/login` et `/desabonnement` en noindex, `/inscription` titrée + canonical |
| 14 | Pas de 404 globale en français (page anglaise Next par défaut). | Faible | Faible | ✅ `src/app/not-found.tsx` avec liens vers offres et guides |
| 15 | `llms.txt` pointait sur l'apex (redirection à chaque lien). | Faible | Faible | ✅ |
| 16 | **Faux témoignages** : si moins de 3 vrais avis, l'accueil affiche 3 citations inventées (« Léa, alternante… ») présentées comme réelles. Pratique commerciale trompeuse (Code de la consommation) + signal de confiance négatif. | Fort (juridique) | Faible | ❓ Voir décision E |
| 17 | Core Web Vitals : ~175 Ko JS gzip sur une page liste (socle Next/React), + framer-motion sur l'accueil (HTML 147 Ko). Pas de mesure terrain disponible ici. | Moyen | Moyen | 🔜 Charger `SwipeDemo` en différé ; 🧑 vérifier PageSpeed/CrUX |
| 18 | Aucun maillage depuis une fiche offre vers sa ville / son métier / des offres proches. | Fort | Moyen | ✅ Fil d'Ariane visible + JSON-LD (type › ville), 6 offres similaires (même ville, sinon même secteur), liens ville/secteur/simulateur |
| 19 | Pages légales sans `<h1>` ni meta description. | Faible | Faible | 🔜 |
| 20 | Offres hors cible (ex. « Stage découverte 3ème ») dans le catalogue public. | Faible | Faible | 🔜 Filtre à l'import |
| 21 | `Organization.sameAs` vide. | Faible | Faible | 🧑 Donner les URLs TikTok / Instagram / LinkedIn |
| 22 | FAQPage : Google n'affiche plus ce rich result que pour les sites gouvernementaux/santé. Le balisage reste utile aux moteurs IA, aucun gain SERP à en attendre. | — | — | Info |

### Vérifications OK (rien à faire)
- HTTPS + HSTS, apex → www en 308, `lang="fr"`, viewport, un seul `<h1>` sur les pages publiques principales.
- Contenu présent dans le HTML initial (pas de rendu client pour le contenu indexable).
- Polices via `next/font` (auto-hébergées, preload, `size-adjust` → pas de CLS de police).
- Aucune `<img>` brute dans le code ; `team-photo.jpg` (154 Ko) n'est utilisée nulle part, `logo.png` (205 Ko) seulement dans le JSON-LD.
- Offres expirées : vrai 404 (pas de soft 404), page « Cette offre n'est plus disponible » en noindex.

---

## 3. Ce qui a changé dans le commit Phase 1

- `src/lib/supabase/public.ts` — client Supabase anonyme **sans cookies** (pages publiques cachables) + `fetchAllRows()` qui pagine au-delà du plafond de 1 000 lignes.
- **Sitemaps** : `/sitemap.xml` devient un **index** → `/sitemap-pages.xml`, `/sitemap-offres-alternance.xml`, `/sitemap-offres-stage.xml` (cache CDN 1 h). L'URL déjà déclarée ne change pas.
- `src/lib/supabase/middleware.ts` — liste des pages **protégées** au lieu d'une liste de pages publiques. ⚠️ Toute nouvelle page membre doit y être ajoutée.
- `src/app/offres/[slug]/page.tsx` — titre sans doublon, meta description contextualisée, JobPosting conditionnel, ISR 1 h, 308 vers le slug canonique, une panne Supabase donne une 500 (et plus jamais un 404 qui ferait sortir la page de l'index).
- Listes `/offres*`, secteur, ville — canonical et titre par page, 404 hors limites, pagination fenêtrée (`src/lib/seo/pagination.ts`).
- `src/lib/offers/segments.ts` — comptages sur tout le catalogue (cache 1 h), nouvelle normalisation des villes. **Les slugs de certaines pages villes changent** (pages créées le 02/10, encore quasi pas indexées) : par exemple, l'ancienne « annemasse-saint-julien-en-genevois » devient « annemasse ».
- `src/app/not-found.tsx`, metadata `/login`, `/inscription`, `/desabonnement`, titres légaux, JSON-LD WebSite, `robots.ts`, `llms.txt`, `X-Robots-Tag` sur `*.vercel.app`.

---

## 4. Décisions Phase 2 — statut (Nathan : « fais comme tu veux », 06/10)

- **A — appliquée** : fiches Adzuna en `noindex, follow` et retirées des sitemaps ; seules les fiches France Travail (texte complet) restent indexables.
- **B — appliquée sans redirection** : nouvelles pages `/alternance/...` et `/stage/...` ; les anciennes `/offres/secteur/*` et `/offres/ville/*` sont conservées telles quelles (pages mixtes alternance + stage), aucune URL supprimée ni redirigée.
- **C — pas nécessaire pour l'instant** : métier et ville calculés à la volée et mis en cache 1 h (`src/lib/seo/programmaticIndex.ts`) au lieu d'une migration. À reconsidérer si le catalogue dépasse ~20 000 offres.
- **D — appliquée** : seuils 10 / 3 (404 sous 3 offres ; pas de 410, Next ne le permet qu'au niveau du middleware et Google traite 404 et 410 presque pareil).
- **E, F — toujours en attente** (faux témoignages, CGU des sources).
- **G — appliquée** : pas de « candidats par offre ». Pas de « durée moyenne » non plus : ni Adzuna ni France Travail ne remplissent la durée aujourd'hui.

### Texte d'origine des décisions

**A. Les ~4 330 fiches Adzuna (contenu tronqué et dupliqué).** Recommandation : les passer en `noindex, follow` et les sortir du sitemap. Elles restent visibles pour les utilisateurs et continuent d'alimenter les pages programmatiques (listes, compteurs, stats). Seules les fiches France Travail (texte complet) restent indexables. Sans ça, on publie 4 000+ pages quasi identiques à celles d'Adzuna : c'est exactement le profil visé par la politique anti-spam « scaled content abuse », et la sanction touche tout le domaine.

**B. Architecture d'URL.** Proposition :
- `/alternance/[metier]/[ville]`, `/stage/[metier]/[ville]` (le cœur du trafic longue traîne) ;
- `/alternance/[metier]`, `/stage/[metier]`, `/alternance/[ville]`, `/stage/[ville]` ;
- `/entreprises/[entreprise]`.

Conflit : `/alternance/[x]` doit distinguer un métier d'une ville. On le résout avec une liste fermée de métiers (≈ 60) et de villes (≈ 150), sans collision possible. Les pages `/offres/secteur/*` et `/offres/ville/*` (4 jours d'existence) seraient redirigées en 308 vers leurs équivalents. **Redirection = ta validation.**

**C. Migration base.** Les « secteurs » actuels (40 mots-clés) ne sont pas des métiers. Proposition :
- ajouter à `offers` les colonnes `job_slug` (métier normalisé, déduit du titre), `city_slug`, `department` et `company_slug` ;
- les remplir à l'import et faire un backfill ;
- créer une vue agrégée (comptes, salaire médian, durée médiane, entreprises) par combinaison.

Sans cette migration, chaque page recalcule tout en mémoire, ce qui ne tiendra pas sur Vercel Hobby. **Migration = ta validation.**

**D. Seuil N.** Proposition :

| Offres actives sur la page | Traitement |
|---|---|
| ≥ 10 | page indexable, dans le sitemap |
| 3 à 9 | page accessible mais `noindex, follow`, hors sitemap |
| < 3 | pas de page (404) |
| tombée à 0 alors qu'elle était publiée | 410 |

Pourquoi 10 : en dessous, salaire et durée « moyens » reposent sur 2–3 valeurs et ne veulent rien dire, et la page ressemble à une page vide aux yeux de Google.

**E. Faux témoignages de l'accueil.** Recommandation : les retirer et afficher les vrais avis, ou rien.

**F. Conditions d'utilisation Adzuna / France Travail.** À vérifier de ton côté :
- l'attribution obligatoire (« Jobs by Adzuna ») ;
- le droit d'afficher et d'indexer leurs offres sur nos propres pages ;
- l'obligation de fraîcheur.

**G. « Candidats par offre ».** On n'a que les likes et candidatures faits via Stageio, donc des chiffres petits, souvent 0. Recommandation : ne pas l'afficher tant que le volume n'est pas significatif.

---

## 5. Plan Phase 2 (après décisions)

1. Migration + backfill (`job_slug`, `city_slug`, `department`, `company_slug`) et dictionnaire métiers/villes.
2. Une page programmatique contient :
   - les offres réelles, paginées proprement ;
   - le nombre d'offres, le salaire observé (médiane, n = …) mis à côté de la grille légale de l'apprentissage, la durée médiane et le top des entreprises qui recrutent ;
   - un bloc éditorial généré à partir des données de la page (jamais un texte à trous identique) ;
   - une FAQ (JSON-LD), un fil d'Ariane (JSON-LD), des liens vers les villes proches et les métiers liés.
3. Fiches offres : liens vers la page métier×ville, 4 offres similaires, statut clair si l'offre a expiré.
4. Pages entreprise (≥ 3 offres).
5. Seuils N, 410 sur les pages vidées, sitemaps par famille.
6. JobPosting : uniquement les offres éligibles (déjà en place).

## 6. Phases 3 et 4 (rappel)

- **Phase 3** (simulateur de salaire ✅ livré le 06/10 — barèmes dans `src/lib/salary/legalRates.ts`, à mettre à jour à chaque revalorisation du SMIC) :
  - plan de 40 guides, dont les 10 premiers rédigés au format « featured snippet » ;
  - outils gratuits, chacun avec sa page SEO : audit de CV (aperçu du score, détail après inscription), générateur de lettre (1 essai), calculateur de salaire d'alternance, simulateur d'entretien.
- **Phase 4** :
  - hubs de maillage ;
  - baromètre annuel « salaires et offres d'alternance » (aimant à backlinks) ;
  - Search Console, suivi de 100 mots-clés cibles, dashboard.

---

## 7. Estimations de trafic organique (honnêtes)

Hypothèses :
- domaine créé en septembre 2026, quasi aucun backlink ;
- concurrence très forte : Indeed, HelloWork, Welcome to the Jungle, L'Etudiant, La bonne alternance, 1jeune1solution… ;
- Phase 2 livrée d'ici fin octobre, Phase 3 d'ici décembre ;
- saisonnalité : la recherche de stage monte d'octobre à février, celle d'alternance de mars à septembre.

| Horizon | Visites organiques / mois | D'où elles viennent |
|---|---|---|
| 3 mois (janv. 2027) | **500 – 2 000** | Marque, longue traîne métier×ville de villes moyennes, premiers guides |
| 6 mois (avr. 2027) | **3 000 – 10 000** | Pages programmatiques indexées, calculateur de salaire, début de la saison alternance |
| 12 mois (oct. 2027) | **10 000 – 35 000** | Si 30+ backlinks de qualité (écoles, CFA, BDE, presse étudiante) et baromètre publié ; sans backlinks, plutôt le bas de la fourchette |

Ce qui fait passer du bas au haut de la fourchette : les backlinks (aucun code ne les remplace), la décision A (qualité perçue du domaine), et les outils gratuits, qui attirent des liens naturels.

---

## 8. Actions à faire par Nathan

1. ✅ **Search Console** : en place depuis le lancement (site validé, sitemap envoyé, plus de 2 000 clics au 07/10). À faire : vérifier dans « Sitemaps » que les 7 sous-sitemaps sont lus, et suivre Requêtes / Pages (positions 5 à 20).
2. **Bing Webmaster Tools** : importer depuis Search Console (Bing alimente ChatGPT Search et Copilot).
3. Vercel → Domains : rediriger `newsaas-seven.vercel.app` vers `www.stageio.fr` (optionnel, il est déjà en noindex).
4. M'envoyer les URLs des comptes sociaux (TikTok, Instagram, LinkedIn) pour `Organization.sameAs`.
5. Répondre aux décisions A à G (section 4).
6. Relire les CGU API d'Adzuna et de France Travail (décision F).
7. Après déploiement : PageSpeed Insights sur `/`, `/offres/stage` et une fiche offre, puis activer Vercel Speed Insights pour les Core Web Vitals terrain.
8. Le connecteur Supabase de cette session ne voit que le projet « menopause-app ». Connecter le projet Stageio me permettrait de calibrer la Phase 2 sur les vraies données. Sinon, je te donnerai les requêtes SQL à lancer.
9. Backlinks : lister 20 écoles, CFA et BDE à contacter (partenariat ou page « offres pour vos étudiants »). C'est le levier n° 1 à 12 mois.
10. Search Console → Inspection d'URL → « Demander l'indexation » : une dizaine d'URLs par jour (le quota de Google), les plus fortes d'abord. Commencer par `/alternance`, `/stage`, `/barometre-alternance-stage`, `/outils/simulateur-salaire-alternance`, `/entreprises`, puis les grandes villes (`/alternance/paris`, `/alternance/lyon`...).
11. Envoyer le baromètre à 5-10 médias étudiants ou emploi (L'Étudiant, Studyrama, blogs de CFA, BDE) : chiffres exclusifs et reprise libre avec lien. C'est le moyen le plus rapide d'obtenir des backlinks.
12. Parrainage : aujourd'hui il ne rapporte rien au parrain (badges seulement). Décider d'une vraie récompense (par ex. 1 semaine Premium offerte par ami inscrit) : décision de prix, je ne l'ai pas codée.
13. Avis / témoignages (décision E) : uniquement de vrais utilisateurs, avec leur accord. Jamais de faux avis : c'est une pratique commerciale trompeuse (art. L121-2 du code de la consommation).

---

## 9. Suivi d'avancement

- [x] Phase 1 — audit technique
- [x] Phase 1 — correctifs rapides (commit « SEO phase 1 »)
- [x] Maillage interne des fiches offres (fil d'Ariane, offres similaires, liens ville/secteur)
- [x] Outil n°1 : simulateur de salaire alternance/contrat pro/stage (`/outils/simulateur-salaire-alternance`), lié depuis l'accueil, les guides, `/offres/alternance` et chaque fiche
- [x] Décisions A, B (sans redirection), C (sans migration), D, G
- [x] Phase 2 — pages `/alternance`, `/stage`, `/[type]/[metier]`, `/[type]/[ville]`, `/[type]/[metier]/[ville]` : offres réelles paginées, stats (offres, entreprises, publiées cette semaine, salaire médian France Travail), bloc éditorial calculé, FAQ + fil d'Ariane en JSON-LD, villes proches, métiers liés, lien alternance ↔ stage ; sitemap `sitemap-metiers-villes.xml` (pages ≥ 10 offres)
- [x] Fiches offres reliées à leur page métier × ville (fil d'Ariane + liens)
- [x] IndexNow (Bing / ChatGPT Search) : bouton « Envoyer le site à Bing » sur `/admin`
- [ ] Décisions E, F
- [x] Pages `/entreprises` + `/entreprises/[entreprise]` (≥ 3 offres, indexées à partir de 10 ; écoles exclues — voir `src/lib/seo/schools.ts`)
- [x] Baromètre 2026 `/barometre-alternance-stage` (métiers, villes, salaires indiqués, entreprises ; recalculé chaque heure, reprise libre avec lien = aimant à backlinks)
- [x] Bloc « Explorer les offres » sur l'accueil (métiers, villes, entreprises) : découverte rapide des nouvelles pages par Google
- [x] IndexNow opérationnel (1 257 puis 1 334 URLs acceptées par Bing le 06/10)
- [x] Phase 3 : 10 guides en ligne (6 ajoutés le 06/10), chacun relié aux autres guides, aux offres et au simulateur ; plan des 40 en section 10
- [x] Nuit du 06 au 07/10 : 28 guides de plus (38 au total), classés en 5 rubriques sur /guides. Les 6 guides juridiques ont été revérifiés sur service-public.gouv.fr / code du travail : rupture, aides 2026, congés, âge limite, convention de stage, apprentissage ou contrat pro.
- [x] Mesure : la source des visites est déduite du site d'origine (Google, Bing, ChatGPT, Perplexity, TikTok, Instagram, WhatsApp...) quand il n'y a pas d'utm. Le tableau « par source » de l'admin montre enfin le trafic SEO (`src/lib/analytics/referrerSource.ts`).
- [x] Partage : boutons WhatsApp / « Envoyer à un pote » / copier le lien sur les offres, pages métier × ville, entreprises, guides, baromètre et simulateur (`utm_source=partage`). Aperçus dynamiques (image avec titre et vrais chiffres) pour WhatsApp, LinkedIn et iMessage (`src/lib/seo/ogImage.tsx`).
- [x] IndexNow automatique : cron quotidien `/api/cron/indexnow` (5 h 30 UTC). Il envoie les hubs, les pages métier / ville / entreprise et les offres et guides nouveaux. Le bouton admin ne sert plus qu'à forcer un envoi complet.
- [x] JobPosting (Google for Jobs) réservé aux offres avec description complète (≥ 200 caractères, non tronquée) ; `addressLocality` = vraie ville.
- [x] 07/10 : 20 métiers de plus (plombier, artisan du bâtiment, paysagiste, boucher, sécurité, relation client, transport, environnement, laboratoire...). Avant, 36 % des offres d'alternance et 29 % des offres de stage n'avaient aucune page métier.
- [x] 07/10 : pages département (`/alternance/departement/[dep]`, `/[dep]/[metier]`) et région (`/alternance/region/[region]`, `/[region]/[metier]`), idem pour `/stage`. Pas de page quand une seule ville ou un seul département concentre au moins 90 % des offres (anti-doublon). Environ 150 pages indexables de plus en production rien qu'avec les métiers et les départements (sitemap métiers-villes : ~340 URLs), avant les régions.
- [x] 07/10 : une entreprise n'est plus comptée deux fois quand la casse diffère (« Alticome » / « ALTICOME »).
- [x] 07/10 : `lastmod` réel dans les sitemaps (date de la dernière offre publiée sur la page, plus l'heure de génération pour toutes). Le cron IndexNow n'envoie plus que les pages qui ont reçu une offre depuis la veille. Les pages métier France entière renvoient vers leurs pages région × métier, et chaque fiche offre vers sa page département (métier × département quand elle existe).
- [x] 07/10 : synchro France Travail découpée par département (cron `sync-france-travail-departements`, 6 passages par nuit de 22 h à 3 h UTC, tout le pays chaque jour). Avant : ~1 000 offres d'alternance France Travail seulement (plafond de l'API à ~1 150 résultats par recherche) contre ~3 100 offres Adzuna non indexables. Index SEO compacté pour tenir sous la limite de 2 Mo du cache (~1,1 Mo pour 19 000 offres). ⚠️ À surveiller : taille de la base Supabase si elle est sur l'offre gratuite (500 Mo).
- [ ] Filtrer les annonces d'écoles du catalogue lui-même (décision produit)
- [x] Phase 3 — 47 guides rédigés (faits juridiques vérifiés sur sources officielles) + 4 outils (1 en ligne : le simulateur)
- [ ] Phase 4 — hubs, baromètre, Search Console, suivi 100 mots-clés, dashboard

---

## 10. Plan des 40 guides

✅ = en ligne. Les sujets avec des chiffres légaux (⚖️) doivent être revérifiés sur service-public.gouv.fr avant publication.

**Alternance**
1. ✅ Alternance ou stage : les différences ⚖️
2. ✅ Trouver une alternance rapidement
3. ✅ CV pour une alternance
4. ✅ Lettre de motivation pour une alternance
5. ✅ Entretien d'alternance : questions et réponses
6. ✅ Candidature spontanée en alternance (modèle de mail)
7. ✅ Contrat d'apprentissage ou contrat de professionnalisation ⚖️
8. ✅ Rupture d'un contrat d'apprentissage ⚖️
9. ✅ Aides financières pour les alternants (logement, transport, prime d'activité ; l'aide au permis de 500 € est supprimée en 2026) ⚖️
10. ✅ Congés et jours d'école d'un alternant ⚖️
11. ✅ Période d'essai en alternance ⚖️
12. ✅ Alternance jusqu'à quel âge ? ⚖️
13. ✅ Trouver une école en alternance (et dans quel ordre chercher)
14. ✅ BTS, bachelor, master en alternance : lequel choisir
15. ✅ Alternance et chômage : tes droits à la fin du contrat ⚖️
16. ✅ Trouver une alternance avec LinkedIn
17. ✅ Calendrier : quand chercher son alternance mois par mois
18. ✅ Alternance sans avoir trouvé d'entreprise à la rentrée : que faire

**Stage**
19. ✅ Trouver un stage rapidement ⚖️
20. ✅ Lettre de motivation pour un stage
21. ✅ Rapport de stage : plan type
22. ✅ Convention de stage : ce qu'elle doit contenir ⚖️
23. ✅ CV pour un stage
24. ✅ Mail de candidature de stage ou d'alternance (modèles)
25. ✅ Stage de fin d'études : comment le choisir
26. ✅ Stage à l'étranger : démarches
27. ✅ Gratification de stage : calcul et droits ⚖️
28. ✅ Année de césure : comment l'organiser
29. ✅ Entretien de stage : questions et réponses
30. ✅ Soutenance de stage : plan et conseils

**Transversal**
31. ✅ Relancer une candidature (modèles de mail)
32. ✅ Se présenter en 1 minute (pitch)
33. ✅ Questions à poser au recruteur
34. ✅ Soft skills à mettre sur son CV
35. ✅ Premier jour en entreprise : les bons réflexes
36. ✅ Utiliser l'IA (ChatGPT) pour sa lettre de motivation, sans texte générique
37. ✅ Profil LinkedIn d'étudiant : la checklist
38. ✅ Logement pendant l'alternance ou le stage ⚖️
39. ✅ Gérer deux villes (école et entreprise)
40. ✅ Refuser une offre poliment (modèle de mail)

**Ajouts hors plan**
41. ✅ Impôts en alternance : déclarer son salaire d'apprenti (21 622 € exonérés sur les revenus 2025) ⚖️
42. ✅ Alternance dans la fonction publique (majoration de 10 ou 20 points facultative depuis 2020) ⚖️
43. ✅ Bourse du Crous et alternance (pas de bourse en alternance, maintenue en stage) ⚖️
44. ✅ Rythme de l'alternance (25 % de formation minimum en apprentissage, 15 à 25 % en contrat pro) ⚖️
45. ✅ Transport : 50 % de l'abonnement remboursé aux alternants et aux stagiaires ⚖️
46. ✅ Mail de remerciement après un entretien ou un stage (3 modèles)
47. ✅ Attestation de stage (obligatoire, validation de 2 trimestres de retraite dans les 2 ans) ⚖️

---

## 11. Audit SEO du 07/10 (document de Nathan) : où on en est

| Point de l'audit | Statut |
|---|---|
| Architecture hub / métier / ville / métier × ville / entreprise / offre / guides | ✅ déjà en place, plus départements, régions et diplômes |
| P0 JobPosting | ✅ uniquement descriptions complètes, employeur nommé, `validThrough` = date de retrait réelle, `addressRegion`, `directApply` |
| P0 Offres expirées | ✅ page « Offre expirée » en noindex, sans JobPosting, avec offres similaires ; retirée du sitemap. Google Indexing API : à faire par Nathan (compte de service Google) |
| P0 URL indexables | ✅ canonical sans paramètres, pages < 10 offres en noindex, fiches Adzuna en noindex, pages hors limites en 404, *.vercel.app en noindex, pas de filtres ni de recherche interne indexables |
| P0 Search Console | ✅ en place depuis le lancement (plus de 2 000 clics au 07/10). Reste : exploiter Requêtes / Pages (positions 5–20) pour choisir les pages à renforcer |
| P1 métier × ville | ✅ créées automatiquement dès 3 offres, indexées à partir de 10 (pas de liste figée de 50 pages : une page n'existe que si les offres existent) |
| P1 pages entreprise | ✅ villes, métiers, entreprises similaires, salaires ; pas de présentation inventée (aucune donnée fiable) |
| P1 maillage | ✅ hubs, ville ↔ métier ↔ département ↔ région, offres → métier × ville, guides par type, accueil |
| P1 baromètre | ✅ `/barometre-alternance-stage` |
| P2 formation × ville | ✅ 14 diplômes détectés dans l'intitulé (BTS MCO, NDRC, BUT, bachelor, master, CAP...) |
| Titles / H1 | ✅ titres naturels avec le nombre d'offres ; fiches offre « intitulé à Ville – Entreprise » |
| Sitemaps par type | ✅ pages, guides, métiers-villes, territoires, entreprises, offres alternance, offres stage |
| Performance (LCP, INP, CLS) | ✅ Lighthouse mobile (build de production local, 07/10) : accueil 65 → 97 (LCP 3,8 s → 2,6 s, titre plus masqué par l'animation), autres types de pages 98-100, SEO 100 partout, CLS 0. ⏳ Nathan : Vercel Speed Insights pour les données réelles. Accessibilité 94-95 : contraste du vert #0f9c56 sur fond clair (3,2 au lieu de 4,5), décision de design |
| KPI revenu par source | ✅ tableau admin « Revenu par source » (inscrits 30 j, payants, revenu, revenu / inscrit) |
| Autorité / backlinks | ⏳ envoyer le baromètre aux médias étudiants et aux CFA |

