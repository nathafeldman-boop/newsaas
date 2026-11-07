---
name: videos-virales
description: Règles de Stageio pour les vidéos et carrousels TikTok, YouTube Shorts, Facebook et Pinterest (format, accroche, mention du produit, itération, pivot de la semaine). À lire avant de créer ou de programmer une vidéo ou un carrousel.
---

# Vidéos et carrousels Stageio : les règles

Règles tirées de la méthode de l'incubateur de Nathan (formats, lancement, pivot), adaptées à Stageio.

## Sujet du moment : CDI et CDD (du 7/11 à fin avril-mai)

Nathan, le 7/11 : « plus personne ne cherche d'alternance en ce moment » ; tous les posts passent sur les CDI et CDD, jusqu'à avril-mai.

- **Tous les posts** (TikTok, YouTube, Facebook, Pinterest) parlent du **premier emploi en CDI ou en CDD** : jeunes diplômés, débutants, reconversion, « moins d'un an d'expérience ».
- **L'alternance, une fois par semaine** : le **mercredi**, un seul créneau par réseau (rentrée décalée de janvier-février). Les autres jours, rien sur l'alternance.
- **Avant chaque post, vérifier que la fonction est en ligne** (Supabase rjakikheeyhyepzgsvlj) : `select count(*) from offers where is_active and contract_type in ('cdi','cdd')`, et la page https://www.stageio.fr/offres/cdi en 200. Tant que ce n'est pas le cas (Nathan n'a pas encore dit « lance »), garder l'ancienne ligne alternance et ne rien promettre sur les CDI.
- **Elliot et Yanis** sont maintenant diplômés et cherchent leur premier poste. Mêmes voix, même méthode (accroche, problème, résolution, CTA « Commente OFFRES »). Idées : Elliot envoie 50 CV pour un CDI, Yanis vise les offres « débutant accepté » ; « 3 ans d'expérience exigés » pour un poste junior ; CDD de 6 mois qui devient CDI ; l'entretien d'embauche raté contre préparé ; négocier son premier salaire ; postuler le jour où l'offre sort.
- **Chiffres** : uniquement ceux de la base du jour, sur `contract_type in ('cdi','cdd')` (nombre d'offres débutants, villes, métiers, arrivées en 24 h). Jamais inventés.
- **Liens** : https://www.stageio.fr/offres/cdi ou /offres/cdd (avec les utm habituels) ; /offres/alternance seulement le mercredi.
- **Pinterest (Zapier create_pin)** : le lien de l'épingle va dans le paramètre `source_url` (pas `link`, ignoré : épingle sans lien le 7/11).
- **Hashtags** : #premieremploi #cdi #jeunediplome #recherchedemploi #emploi (et #alternance le mercredi).

## Ce qu'on montre
- LE mécanisme cœur, jamais un gadget : les offres du jour près de chez toi → tu swipes → la lettre s'écrit toute seule → candidature envoyée.
- Contenu PROCESS plutôt que démo : on vend le BUT (décrocher son alternance), et Stageio est une étape du chemin.
- On part d'une douleur réelle (« 47 candidatures, 0 réponse », « les offres ont déjà 3 semaines »), puis on montre le mécanisme, puis le résultat.
- Le mécanisme se montre toujours avec la MÊME animation standard (un gabarit de quelques secondes). Seules les offres du jour changent : l'animation ne s'adapte pas au texte.

## Le format d'une vidéo (15 à 20 s)
- 0 à 3 s : l'accroche, sur le problème ou une tendance de l'alternance, jamais sur le produit. Texte à l'écran.
- 3 à 10 s : le mécanisme en accéléré.
- 10 à 15 s : le résultat zoomé, qui passe du flou au net.
- Texte à l'écran et musique ; voix off courte possible.
- Un seul format par vidéo : jamais deux formats mélangés.
- Mise en scène : jamais « juste un téléphone ». Toujours un vrai contexte : bureau avec CV imprimés, liste de candidatures barrées, bus, salle de cours. On utilise les vrais plans filmés par Nathan quand il y en a.

## Accroches qui marchent
- Problème ou tendance de la niche.
- Argent concret (« payée X € par mois pour apprendre », « à moins de 10 € »), seulement avec des montants vrais.
- « Imagine… » : histoire à la 2e personne.
- Situation forte ou incongrue (le contexte fait le hook).
- POV (mise en scène signalée comme telle).

## Le nom Stageio
- JAMAIS le nom en clair dans la vidéo ni sur le carrousel, et pas de « tape Stageio » en fin de vidéo : ça tue la conversion.
- Fin de vidéo : « Commente OFFRES » (un mot-clé). Nathan répond à 2 ou 3 commentaires « Stageio, tape-le sur Google » et épingle cette réponse. Les gens tapent le nom sur Google.
- Mention possible au MILIEU de la vidéo seulement, façon « technique secrète », sans écrire le nom.
- La légende TikTok ne contient pas le nom. Pour YouTube, Facebook et Pinterest, le lien tracé reste dans la description.

## Honnêteté (non négociable)
- Pas de faux témoignage, pas de faux avis, pas de faux commentaire « grâce à Stageio ».
- Pas de vraie marque ni de vraie personne mise en scène.
- Une mise en scène est signalée comme mise en scène.
- La mention « contenu promotionnel » TikTok reste activée.
- Aucun DM ni commentaire automatisé.

## Cadence et itération
- Jours 1 à 3 du compte : 1 vidéo par jour. Ensuite (compte TikTok lancé le 7/11, donc à partir du 10/11) : 2 vidéos par jour, plus le carrousel.
- Une vidéo perce : on fait des variantes refaites dans le même format. Jamais le même fichier reposté.
- Au plus 1/4 d'une ancienne vidéo réutilisé. L'accroche et la voix off peuvent revenir, le corps est refait.
- Un compte, une identité, un format principal.
- Commentaires : les lire tous. « C'est payant ?! » veut dire que l'acquisition marche. Noter les fonctions demandées et les objections.
- Viser 20 à 30 vidéos pour mesurer le RPM avant de payer des créateurs (environ 1 € pour 1 000 vues, plafonné, coût créateurs inférieur à 1/3 du chiffre d'affaires).

## Le pivot de la semaine (lundi)
- Préparer les chiffres AVANT :
  - RPM par vidéo et par format : euros encaissés ÷ (vues / 1 000), sur la même période. Lire vidéo par vidéo, pas seulement la moyenne.
  - CAC, ARPU, LTV, churn.
  - Les commentaires de la semaine.
- Lecture du RPM :
  - vers 1 : contenu recyclé ou angle mou → nouvelles vidéos, nouvelles accroches ;
  - 0,3 à 0,4 avec des vues : contenu démo sans intention d'achat → contenu process, revoir l'offre ;
  - très haut sur 2 jours : trop tôt, attendre une semaine ;
  - repères : 2 au minimum, 4 et plus c'est parfait.
- Règles :
  - une semaine complète de data avant de juger ;
  - un test A/B n'est lisible qu'à partir d'environ 1 000 à 2 000 par variante.
- 3 décisions, pas plus :
  - DOUBLER le gagnant ;
  - COUPER ce qui ne marche pas, même ce qu'on aime ;
  - TESTER 1 ou 2 nouveautés au plus.
- Engagements au format « Prénom livre CHIFFRE pour le DATE ». Un objectif daté pour la semaine.

## Ne pas faire
- Bricoler le produit ou fabriquer des outils internes au lieu de publier : le produit est bon, tout pour l'acquisition.
- Publier sur 5 comptes à la fois.
- Décider sur 2 jours de data.
- Tester 5 nouveautés en même temps.

## Tracking (3 métriques au démarrage)
- RPM = premier paiement ÷ (vues / 1 000), jamais la LTV. Lu vidéo par vidéo.
- Inscriptions pour 1 000 vues.
- Revenu par inscription.
- Vues et revenus toujours sur la même période.
- Repères :
  - visites → compte : 30 à 40 % ;
  - onboarding → paywall vu : 90 % ;
  - paywall → checkout : 60 à 70 % ;
  - paywall → paiement : 10 à 25 % ;
  - arrivée → paiement : 3 à 6 %.
- Events dans user_events : onboarding_step_*, paywall_viewed, checkout_opened, subscription_started. Il manque « arrivée sur la landing » pour toutes les visites (site_visits ne voit pas tout).

## Churn et rétention
- Lire le churn par cohorte (mêmes abonnés suivis mois par mois), jamais sur le seul 1er mois.
- Regarder les résiliations dans les 48 h qui suivent le paiement (cible : 20 à 30 % au plus) et les remboursements.
- Leviers :
  - pousser l'annuel ou l'accès à vie ;
  - un rendez-vous fixe (les nouvelles offres chaque matin, le plan de la semaine) ;
  - des e-mails J1, veille du rendez-vous et avant renouvellement ;
  - un panier du jour 1 plus élevé (order bump) ;
  - une offre de sortie sur le paywall.
- Pas de notification push : la rétention passe par l'e-mail. L'e-mail est un filet, pas un moteur d'acquisition.
