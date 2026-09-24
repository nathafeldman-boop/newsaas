# Audit rétention & implémentation — Stageio

Date : 2026-09-24. Contexte au moment de l'audit : ~700€ MRR après ~20 jours,
~400€ CA brut / ~370€ net sur la période, inscriptions nombreuses, abonnements
Premium actifs, churn jugé trop élevé. Mission : ne pas casser le funnel
actuel, améliorer la rétention par le cœur produit (offres, swipe, matching,
Jimmy) avant tout gadget.

Méthode : audit complet du repository (4 explorations parallèles couvrant
ingestion/lifecycle des offres, swipe/matching/boucle de rétention, IA/Jimmy,
schéma DB/analytics), puis implémentation directe. Rien n'a été supposé —
chaque affirmation ci-dessous est sourcée sur du code lu, pas déduite.

---

## 1. Problèmes détectés

### 1.1 Déduplication quasi inexistante
Seul mécanisme : contrainte unique `(source, external_id)`. Aucune
détection cross-source ni de quasi-doublon. Une même offre trouvée par
Adzuna ET par la découverte Mistral (ou republiée sous un nouvel
`external_id`) apparaissait deux fois dans le feed — cause plausible directe
du "j'ai déjà vu cette offre" que l'audit devait chercher.

### 1.2 Aucun signal de qualité d'offre
Le feed ne filtrait que sur `is_active` + `published_at`. Une offre
techniquement active mais vide (pas de description exploitable, pas de lien
pour postuler) avait la même place qu'une offre complète. Aucun moyen
d'exclure le "bruit" sans le supprimer.

### 1.3 Bug réel : `last_seen_at` jamais rafraîchi pour les offres Mistral
`ingestOffer.ts` (utilisé par `discover-offers` et l'admin) n'incluait
jamais `last_seen_at` dans son upsert, contrairement à `sync-adzuna`. Une
offre `mistral_ingest` redécouverte plus tard ne voyait donc jamais sa
fraîcheur mise à jour — sans conséquence sur l'expiration (qui se base sur
`published_at` pour cette source), mais un vrai bug de données dormant,
corrigé dans cette passe.

### 1.4 Volume d'offres : les chiffres du brief ne correspondent pas au code
Le brief demandait d'étudier un passage de ~300 à ~1000 offres/jour. La
réalité mesurée dans le code : **~11 appels Adzuna/jour** (9 requêtes
génériques + 2 ciblées ville), soit ~550 offres brutes fetchées au
maximum avant filtrage classification/âge — et le commentaire du code
lui-même chiffre le total mensuel à *"~330/mois"*, calibré sur un plan
Adzuna **Trial Access** dont le quota réel n'est pas connu. Côté Mistral
(`discover-offers`), le volume est *"volontairement modeste (coût
Mistral)"* : 4 requêtes de découverte/jour × 4 URLs = jusqu'à 16 tentatives
d'ingestion/jour. Au total, le système ingère aujourd'hui un ordre de
grandeur de quelques centaines d'offres brutes par jour, pas plusieurs
milliers — voir section 4 (offres) pour la décision prise.

### 1.5 Statut de candidature : impasse pour la majorité des utilisateurs
`ApplicationStatus` définit 5 valeurs (`envoyee`, `en_cours`, `entretien`,
`acceptee`, `refusee`), mais **3 des 5 conditions de recherche/objectif
produit ne sont jamais atteignables par le code** avant cette passe :
`en_cours` et `acceptee` n'étaient écrits par aucun chemin, et
`entretien`/`refusee` ne pouvaient être posés que par l'automatisation Gmail
(opt-in, Gmail uniquement). Un utilisateur sans Gmail connecté — la
majorité — n'avait **aucun moyen produit** de dire "j'ai eu un entretien"
ou "j'ai été accepté(e)", même en réalité. C'est un candidat sérieux à
l'impasse "postule → ne sait plus quoi faire → ne revient pas" (scénario C/D
du brief).

### 1.6 Aucune donnée de churn
Le webhook Stripe ne capture jamais de raison d'annulation, ni d'historique
(`subscription_status` est juste écrasé en place). Aucun `event_type`
churn/cancellation dans `user_events`. Impossible de savoir *pourquoi* les
Premium partent — seulement *qu'ils sont partis*.

### 1.7 Tracking analytics très partiel
Seuls 4 `event_type` existent dans `user_events` : `login`, `button_click`,
`onboarding_step_viewed`, `onboarding_step_completed`. Rien sur les
candidatures, l'audit CV, la génération de lettre, les abonnements. Les
swipes/candidatures/favoris existent bien en base (tables dédiées) mais
sans jamais être exploitables comme "événements" pour comprendre un
parcours dans l'ordre.

### 1.8 "Jimmy" n'existe pas
Recherche exhaustive (fichiers, composants, texte, commentaires) : aucune
trace. Aucune UI de chat/conversation nulle part dans le produit. Les deux
fonctionnalités IA existantes (lettre de motivation, audit CV) sont des
formulaires "générer → afficher", pas un copilote conversationnel.

### 1.9 Pas de sortie "positive" pour la recherche terminée
Rien dans le produit ne permettait de dire "j'ai trouvé mon alternance"
sans simplement... arrêter de revenir (= churn silencieux, indiscernable
d'un abandon).

### 1.10 Ce qui marche déjà bien (ne pas casser)
- Une vraie couche d'apprentissage comportemental existe déjà
  (`src/lib/matching/learning.ts`) : elle pondère sector/remote/mots-clés du
  titre à partir des likes/pass/candidatures réels, avec seuil de pertinence
  qui se resserre après 8 swipes. Il manquait seulement la décroissance
  temporelle (corrigé, section 3).
- Le feed exclut déjà systématiquement les offres swipées/postulées
  (jamais répétées au sein d'un même compte).
- Un score de match numérique est déjà utilisé pour trier/filtrer côté
  serveur, avec des raisons explicables (`computeMatchReasons`), et déjà
  affiché en `%` sur `/favoris` (mais pas encore sur `/swipe` avant cette
  passe — corrigé).
- Le funnel de checkout/paywall/onboarding est solide et n'a pas été
  touché.

---

## 2. Causes probables du churn (jamais présentées comme certaines)

| Scénario (brief, section 17) | Preuve trouvée | Statut |
|---|---|---|
| A. Pas assez d'offres | Volume réel très inférieur aux hypothèses du brief ; pas de garde-fou qualité | Corrigé partiellement (qualité + dédup), volume brut limité par un quota tiers non maîtrisable ici |
| B. Offres pas pertinentes | Matching déjà assez soigné (secteur, ville, compétences, apprentissage comportemental) mais pas de décroissance temporelle, pas de garde qualité | Corrigé (decay + filtre qualité) |
| C. Trouve une offre, ne sait pas quoi faire | Lettre IA + audit CV existent déjà ; rien de spécifique à UNE offre | Corrigé (CV↔offre, Jimmy) |
| D. Postule, ne revient pas | Statut de candidature bloqué (1.5) ; pas de plan d'action ; dashboard sans tendance | Corrigé (statut manuel, plan d'action) |
| E. Trouve son alternance | Aucun moyen de le dire proprement | Corrigé (clôture de recherche) |

Aucune de ces causes n'est confirmée par une vraie mesure (pas de données
churn historiques disponibles avant cette passe) — ce tableau croise les
scénarios du brief avec ce que le code permettait ou empêchait, pas une
analyse statistique. La section 8 ci-dessous liste les métriques à
surveiller maintenant que le tracking existe.

---

## 3. Ce qui a été implémenté

### 3.1 Offres — qualité, fraîcheur, déduplication (P0)
- **`src/lib/offers/quality.ts`** : score de qualité 0-100 calculé à
  l'ingestion (description, prérequis, salaire, durée, télétravail, date de
  début, niveau d'études, secteur, lien de candidature), stocké
  (`offers.quality_score`). Seuil `MIN_QUALITY_FOR_FEED = 30` sous lequel
  une offre sort du feed et des emails, sans jamais être supprimée.
- **`src/lib/offers/fingerprint.ts`** : empreinte de contenu
  (titre+entreprise normalisés, accents/casse/ponctuation/mentions H-F
  retirés), stockée (`offers.content_fingerprint`).
- **`src/lib/offers/dedupe.ts`** : nettoyage périodique (appelé depuis le
  cron `deactivate-expired-offers`, déjà quotidien) qui regroupe les offres
  actives à empreinte identique et désactive tout sauf la meilleure
  (qualité puis fraîcheur) — jamais de suppression, jamais de blocage à
  l'insertion (une offre légitimement republiée après expiration n'est
  jamais bloquée).
- **`src/lib/offers/freshness.ts`** : badge "Nouvelle offre" / "Publiée il y
  a X jours" calculé à la volée (jamais stocké), affiché sur la carte swipe
  uniquement quand fiable (≤7 jours).
- Bug corrigé : `last_seen_at` maintenant rafraîchi pour les offres
  `mistral_ingest` (voir 1.3).
- `/swipe`, `/dashboard` (plan d'action) et le digest email
  `notify-new-offers` filtrent maintenant sur `quality_score`, et le pool
  de candidats est trié qualité d'abord.

**Volume brut (300→1000/jour) : pas augmenté dans cette passe.** Le code
lui-même documente que 11 appels Adzuna/jour ≈ 330/mois est calibré sur un
plan **Trial Access** dont le quota réel n'est pas connu (page "Stats" du
dashboard Adzuna à vérifier). Augmenter ce nombre sans connaître le vrai
plafond risque de faire échouer le sync entier (quota dépassé = 0 offre ce
jour-là) plutôt que d'en ramener plus. Le volume Mistral est *délibérément*
modeste pour le coût. Ce sont des décisions produit/business (upgrade de
plan payant), pas des bugs techniques — je ne les ai pas prises
unilatéralement. Ce qui a été fait à la place, conforme à la consigne
"architecture scalable, priorité fraîcheur+pertinence > quantité brute" :
qualité et déduplication pour que chaque offre existante compte vraiment,
et les deux compteurs (`fetched`/`mapped`/`upserted` par sync, `dedupe`
groupes/désactivations) sont déjà retournés par les crons pour être
surveillés avant toute décision d'augmenter les quotas.

### 3.2 Algorithme de recommandation (P0)
- **Décroissance temporelle** ajoutée à `learning.ts` (absente avant) :
  un swipe d'il y a 3 semaines pèse desormais 0.3× un swipe d'hier (paliers
  ≤3j → ×1.3, ≤14j → ×1, ≤30j → ×0.6, au-delà → ×0.3). Permet à un profil
  qui change d'orientation de voir son feed s'adapter en quelques jours au
  lieu de semaines.
- Score de qualité intégré comme filtre/tri SQL (pas dans la formule de
  score de matching elle-même — séparation volontaire "cette offre est-elle
  bonne" vs "correspond-elle à CE profil", voir 3.1).
- Match % maintenant affiché explicitement sur les cartes `/swipe` (déjà
  présent sur `/favoris`), avec les raisons déjà existantes
  (`computeMatchReasons`) juste en dessous — répond à la demande d'un score
  explicable sans réinventer ce qui marchait déjà.

**Non fait, et pourquoi** : pondération par `experience_level`. Les offres
n'ont pas de champ "niveau d'expérience requis" structuré (seulement du
texte libre dans `requirements`) — une heuristique regex sur "expérience
confirmée"/"débutant accepté" aurait un taux de faux positifs trop élevé
pour un score qui doit rester explicable et digne de confiance. Signal trop
faible pour le risque ajouté.

### 3.3 Déduplication / non-répétition (P0)
Voir 3.1 — le feed excluait déjà les offres swipées par le même compte ;
la nouveauté est la déduplication **cross-source/cross-republication**, le
vrai trou identifié à l'audit.

### 3.4 Boucle swipe → candidature → suivi (P0)
- **`src/app/(app)/mes-candidatures/actions.ts` +
  `ApplicationStatusControl.tsx`** : statut de candidature éditable
  manuellement (les 5 valeurs, y compris `en_cours`/`acceptee` désormais
  atteignables). Une correction manuelle de l'utilisateur peut toujours
  s'appliquer, contrairement à l'automatisation Gmail qui protège les
  statuts terminaux d'un écrasement automatisé ambigu — les deux
  logiques coexistent sans se contredire.
- **`/favoris`** : libellés enrichis (❤️ À regarder / 📨 Envoyée / 📝 En
  cours / 💬 Entretien / ✅ Acceptée / ❌ Refusée) — sans nouvelle table,
  juste la jointure déjà existante vers `applications`.
- **Clôture de recherche** ("j'ai trouvé mon alternance", section 17E) :
  `profiles.search_completed_at/reason`, point d'entrée sur `/profil`
  (`SearchCompletedToggle`), état de félicitations sur `/swipe`
  (`SearchCompletedCard`) au lieu du deck, réversible en un clic, et les 3
  crons de relance (`notify-new-offers`, `notify-no-swipe`,
  `send-swipe-relance`) excluent désormais ces profils. Jamais traité comme
  un échec produit.

### 3.5 Jimmy — copilote IA (P0)
N'existait pas du tout (voir 1.8) — construit de zéro sur l'infrastructure
Gemini déjà en place (`src/lib/gemini/client.ts`, utilisée par la lettre de
motivation et l'audit CV) :
- **`src/lib/jimmy/buildContext.ts`** : reconstruit à CHAQUE message (jamais
  mis en cache) un contexte réel — profil complet (mêmes champs que l'algo
  de matching, demande explicite), candidatures récentes avec statut, CV
  (texte tronqué), favoris non encore postulés, et les **meilleures offres
  actuellement disponibles pour ce profil** (calculées avec le même
  `computeMatchScore` que le feed).
- **`src/lib/jimmy/chat.ts`** : prompt système avec règles strictes —
  jamais d'offre/entreprise inventée hors de la liste fournie, distinction
  explicite donnée réelle / recommandation / hypothèse, honnêteté quand
  l'info manque.
- **`jimmy_messages`** (nouvelle table, RLS scoping strict à l'utilisateur) :
  historique persistant, capé à 40 messages par compte côté application
  (`trimJimmyHistory`).
- **Pas de repli statique** en cas d'échec Gemini (contrairement à la
  lettre/l'audit CV) : une conversation libre n'a pas d'équivalent
  statique crédible — un faux "Jimmy" qui bafouille des réponses figées
  serait pire qu'un message d'erreur honnête. Page + action gèrent
  proprement l'absence de config et les erreurs.
- Accessible via `/jimmy`, ajouté à la nav desktop et mobile, gating
  Premium identique à `/dashboard` (pas d'aperçu gratuit, contexte réel
  nécessaire pour être utile).

### 3.6 CV ↔ offre (P2, mais forte synergie avec Jimmy)
**`CvOfferMatchPanel`** sur la page candidature : "Analyser mon CV pour
cette offre", distinct de l'audit CV général (qui note le CV dans
l'absolu). Compare explicitement le CV à l'offre consultée (score, ce qui
matche, ce qui manque, un conseil), hybride Gemini + repli statique par
recoupement de mots-clés (même doctrine que le reste de l'IA du produit —
jamais un point de défaillance unique).

### 3.7 Dashboard — plan d'action (P1)
Carte "🎯 Aujourd'hui" ajoutée en haut de `/dashboard`, purement construite
à partir de vraies données (`src/lib/dashboard/actionPlan.ts`) : nombre
d'offres du jour au-dessus du seuil de pertinence, offres sauvegardées sans
candidature, candidatures sans réponse depuis +7 jours. N'affiche **aucune**
ligne si le compteur est à 0 — jamais de texte générique/motivant sans
contenu réel derrière.

### 3.8 Feedback d'annulation (P1/P3)
**`/premium/annuler`** : étape courte (raison + détail optionnel) avant le
vrai portail Stripe, jamais bloquante (bouton "Passer" toujours visible,
mène directement au portail). Stocké dans `subscription_cancellations`,
consultable sur `/admin/annulations` (comptage par raison + liste
détaillée), avec rappel explicite que c'est un signal directionnel, pas un
taux de churn exhaustif (une partie des annulations n'auront jamais de
réponse).

### 3.9 Analytics — événements ajoutés (P3)
Réutilisation de la table `user_events` existante (`event_type` + `metadata
jsonb`), pas de nouvelle table. Événements ajoutés, tous côté serveur donc
fiables (jamais perdus si l'onglet se ferme) :
`offer_applied`, `cover_letter_generated` (avec source gemini/static),
`cv_analyzed` (avec source + score), `cv_offer_fit_analyzed`,
`application_status_changed`, `search_completed`/`search_resumed`,
`subscription_started`, `subscription_cancellation_feedback`,
`jimmy_message`.

**Volontairement pas ajouté** : un événement par swipe individuel
(`swipe_right`/`swipe_left`). La table `swipes` EST déjà le journal
exhaustif des swipes (avec direction et horodatage) — dupliquer chaque
swipe dans `user_events` doublerait l'écriture sur le chemin le plus chaud
de l'app pour un bénéfice analytique nul (tout ce qu'on voudrait en tirer
est déjà interrogeable directement sur `swipes`). Même raisonnement pour
les vues de page (`dashboard_view`, `daily_offers_view` etc.) :
`site_visits` capture déjà le chemin visité par visiteur, y compris
connecté, à moindre coût — ajouter un événement authentifié par navigation
aurait été redondant.

---

## 4. Ce qui n'a pas été implémenté, et pourquoi

| Idée du brief | Décision | Raison |
|---|---|---|
| Passer à ~1000 offres/jour | Non — architecture qualité/dédup prête à absorber plus, volume brut inchangé | Dépend d'un quota Adzuna (plan payant) et d'un budget Mistral non décidables depuis le code ; augmenter à l'aveugle risque de casser le sync plutôt que d'aider (voir 3.1) |
| États NEW/FRESH/AGING/EXPIRED/FILLED/DUPLICATE/INVALID (state machine complète) | Non — freshness calculée à la volée, qualité en filtre SQL, dédup en désactivation | `published_at`/`last_seen_at`/`is_active`/`quality_score` couvrent déjà tous les cas utiles sans dupliquer un état dérivable ; une state machine à 7 valeurs aurait été de la complexité sans bénéfice utilisateur mesurable |
| Notifications push web temps réel | Non | Aucune infra push existante (email Resend uniquement) ; en ajouter une aurait dépassé le périmètre "cœur produit d'abord" et n'était pas dans le P0/P1 explicite |
| Cohortes de rétention J1/J7/J14/J30 complètes | Non — seulement les raisons d'annulation (3.8) | P3 explicite dans le brief lui-même ; le tracking nécessaire (3.9) vient tout juste d'être posé, il faut d'abord accumuler des données avant qu'une analyse de cohorte ait du sens |
| Pondération `experience_level` dans le matching | Non | Voir 3.2 — pas de champ structuré côté offre, risque de faux signal trop élevé |
| Streak/gamification supplémentaire | Non | Un système de streak existe déjà (candidatures) ; le brief demande explicitement d'éviter la gamification artificielle, pas d'en ajouter davantage |

---

## 5. Priorité / impact attendu / risque — résumé

| Item | Priorité | Impact attendu | Risque technique |
|---|---|---|---|
| Qualité + dédup offres | P0 | Feed perçu comme plus propre/renouvelé, sans changer le volume | Faible — additif, seuil bas (30), rien de supprimé |
| Decay comportemental | P0 | Feed qui s'adapte plus vite à un changement de préférence | Faible — fonction pure, testée par lecture de code |
| Statut candidature manuel + clôture recherche | P0/P1 | Débloque le suivi pour tous les utilisateurs (pas que Gmail), sortie positive au lieu de churn silencieux | Faible — nouvelles colonnes nullables, aucune migration destructive |
| Jimmy | P0 | Nouvelle raison forte de revenir ; risque de coût Gemini si usage élevé | Moyen — dépend de Gemini (pas de repli statique possible pour du chat libre), gating Premium + timeout 15s limitent l'exposition |
| CV↔offre | P2 | Complète la boucle "je regarde une offre → je sais si je suis armé pour postuler" | Faible — même doctrine hybride que le reste |
| Plan d'action dashboard | P1 | Raison de revenir quotidienne, basée sur du réel | Faible — lecture seule, aucune écriture |
| Feedback annulation | P1/P3 | Première donnée qualitative sur le churn | Faible — jamais bloquant, n'affecte pas le flux d'annulation réel |
| Analytics étendus | P3 | Rend possible une vraie analyse de churn dans le futur | Faible — insertions best-effort, jamais bloquantes |

---

## 6. Données nécessaires pour aller plus loin

- **Quota Adzuna réel** (page "Stats" du dashboard Adzuna) : seule donnée
  bloquante pour une vraie décision volume 300→1000/jour.
- Quelques semaines d'accumulation des nouveaux événements (3.9) avant
  qu'une analyse de cohorte/corrélation ait un sens statistique.
- Volume réel de réponses sur `/premium/annuler` avant de tirer une
  conclusion sur LA cause principale de churn (actuellement zéro donnée,
  la fonctionnalité vient d'être créée).

---

## 7. Fichiers importants touchés ou créés

**Migration** : `supabase/migrations/20260925000000_retention_v2.sql`
(**non appliquée** — voir avertissement ci-dessous).

**Offres/qualité/dédup** : `src/lib/offers/{fingerprint,quality,dedupe,freshness}.ts`,
`src/app/api/cron/sync-adzuna/route.ts`, `src/lib/mistral/ingestOffer.ts`,
`src/app/api/cron/deactivate-expired-offers/route.ts`.

**Matching** : `src/lib/matching/learning.ts`,
`src/app/(app)/swipe/page.tsx`, `src/components/swipe/OfferCard.tsx`.

**Candidatures/favoris/clôture** :
`src/app/(app)/mes-candidatures/{page,actions}.tsx`,
`src/components/candidature/ApplicationStatusControl.tsx`,
`src/components/offers/OfferListCard.tsx`,
`src/app/(app)/profil/search-actions.ts`,
`src/components/swipe/SearchCompletedCard.tsx`,
`src/components/profile/SearchCompletedToggle.tsx`.

**Jimmy** : `src/lib/jimmy/{buildContext,chat}.ts`,
`src/app/(app)/jimmy/{page,actions}.tsx`,
`src/components/jimmy/JimmyChat.tsx`,
`src/components/nav/{NavLinks,BottomNav}.tsx`.

**CV↔offre** : `src/lib/cvAudit/{offerFitSchema,generateOfferFitWithGemini,staticOfferFit}.ts`,
`src/app/(app)/candidature/[offerId]/cv-match-actions.ts`,
`src/components/candidature/CvOfferMatchPanel.tsx`.

**Dashboard** : `src/lib/dashboard/actionPlan.ts`,
`src/app/(app)/dashboard/page.tsx`.

**Annulation/feedback** : `src/app/(app)/premium/annuler/{page,actions}.tsx`,
`src/app/(app)/premium/page.tsx`, `src/app/admin/annulations/page.tsx`,
`src/app/admin/premium/page.tsx`.

**Analytics** : `src/lib/analytics/logServerEvent.ts`, plus les points
d'appel listés en 3.9 (`candidature/actions.ts`, `cv-audit-actions.ts`,
`stripe/webhook/route.ts`).

**Types** : `src/types/database.ts` (nouveaux champs + tables).

---

## 8. Métriques à surveiller maintenant

- `dedupe.groupsFound`/`deactivated` (retour JSON de
  `deactivate-expired-offers`) : combien de doublons cross-source existent
  réellement — donnée qu'on n'avait jamais avant.
- Distribution de `quality_score` sur les offres actives (`/admin/offres`
  n'affiche pas encore cette répartition — à ajouter si le chiffre
  intéresse).
- Volume de réponses sur `/premium/annuler` + répartition des raisons
  (`/admin/annulations`).
- Fréquence d'usage de `application_status_changed` (le statut
  manuel est-il utilisé, ou les utilisateurs laissent-ils tout à
  "envoyée" ?).
- Adoption de Jimmy (`jimmy_message` par utilisateur Premium/semaine) et
  taux d'erreur (Gemini indisponible/timeout).
- `search_completed` vs churn Stripe réel : combien de "j'ai trouvé mon
  alternance" par rapport aux annulations totales — donne une vraie mesure
  du scénario E (jamais un échec produit).

---

## ⚠️ Avertissement bloquant : migration non appliquée

La migration `supabase/migrations/20260925000000_retention_v2.sql` a été
écrite et validée syntaxiquement (cohérente avec les 32 migrations
précédentes) mais **n'a pas pu être appliquée au projet Supabase de
production depuis cette session** : le connecteur Supabase MCP disponible
ici pointe vers un projet Supabase totalement différent et sans rapport
(`menopause-app`), pas celui de Stageio. Toutes les nouvelles
fonctionnalités de cette passe (qualité/dédup offres, clôture de
recherche, feedback d'annulation, Jimmy) **dépendent de colonnes/tables
qui n'existent pas encore en production**. Avant que ce déploiement ne
soit utile, il faut appliquer cette migration manuellement (SQL Editor
Supabase, ou `supabase db push` en CLI) — exactement comme pour toute
migration précédente de ce projet.
