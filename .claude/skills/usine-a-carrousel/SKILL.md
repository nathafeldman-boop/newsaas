---
name: usine-a-carrousel
description: Génère des carrousels Instagram/TikTok Stageio (PNG 1080x1350, style « fiches » noir/jaune sur papier). À utiliser dès que Nathan écrit « usine à carrousel » ou demande des carrousels pour les réseaux.
---

# Usine à carrousel (Stageio)

Déclencheur : Nathan écrit « usine à carrousel » (ou demande des carrousels). Tu produis le ou les carrousels complets, prêts à poster, sans redemander le style.

## Étapes

1. **Sujet.** Alternance / stage / recherche d'emploi étudiante, utile et concret. Regarde l'actualité française du moment (WebSearch, mode « extended » si c'est récent : manifs, grèves, réformes, dates d'examens, aides à l'apprentissage, rentrée…) et rattache un carrousel à l'actu quand c'est pertinent. Tu peux t'inspirer des thèmes et accroches des comptes de la niche (alternance, révision, fiches, anglais), jamais copier leurs visuels, leur logo ou leurs textes.
2. **Faits.** Aucun chiffre, droit ou date inventé : chaque affirmation factuelle vient d'une source vérifiée, listée dans `sources` du JSON. Sujets juridiques : ajouter une `note` « Infos générales : vérifie ton contrat… ». Jamais de faux avis, faux témoignages ni faux chiffres d'utilisateurs.
3. **Écrire le JSON** dans `tools/carrousel/carrousels/<slug>.json` (voir les exemples du dossier) :
   - `cover` : photo sombre plein cadre, 2 lignes blanches en capitales + 1 ligne surlignée jaune (`title`, `highlight`, `titleSize` ~80-90 si le titre est long). Photo : URL Unsplash (`https://images.unsplash.com/photo-<id>?w=1600&q=85`, licence Unsplash = usage commercial libre), jamais une photo prise chez un concurrent.
   - `tip` (4 à 6) : titre en 2 blocs (noir puis jaune), une phrase avec `==mots surlignés==`, un intitulé (`Objectif`, `Objectifs`, `À retenir`, `Réflexe`…) et 1 à 3 `items` avec une icône Lucide (`icon`, nom exact sur lucide.dev) et un libellé court.
   - `cta` (dernière slide) : « Trouve ton alternance » + **« Va sur stageio.fr »** (tape-le sur Google). Jamais « lien en bio ».
4. **Rendre** : `node tools/carrousel/render.mjs tools/carrousel/carrousels/<slug>.json <dossier-scratchpad>/<slug>` puis regarder chaque PNG (Read) et corriger tout débordement (titre trop long → `titleSize` plus petit ou texte plus court).
5. **Livrer** : envoyer les PNG avec SendUserFile (dans l'ordre), plus une légende proposée et 3-5 hashtags. Committer le JSON (pas les PNG : `tools/carrousel/out` et `.cache` sont ignorés).

## Règles de style (ne pas dévier)

- Police Montserrat (800/900 pour les titres), capitales, jaune `#FFE14A`, noir `#111`, fond papier gris clair froissé, flèches jaunes, onglet jaune en bas à droite, « ● stageio.fr » en bas à gauche.
- Peu de texte par slide, tutoiement, ton direct 18-25 ans.
- Ne jamais publier soi-même ; ne jamais rien poster sur le compte TikTok « flirtcraft-tk4-emile ».
