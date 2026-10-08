# Être référencé partout : où en est Stageio

Mis à jour le 08/10/2026. Ce qui marche tout seul, et ce qui demande tes comptes (10 minutes chacun).

---

## 1. Déjà en place, automatique

| Où | Comment | Statut |
|---|---|---|
| **Google** (recherche, Google Emplois, Discover) | `sitemap.xml` (toutes les pages et offres), fiches offres France Travail balisées JobPosting, grands aperçus autorisés (image en grand, extrait complet) depuis le 08/10 | ✅ |
| **Bing**, et donc **DuckDuckGo, Yahoo, Ecosia, Qwant, Copilot, la recherche de ChatGPT** (ils utilisent l'index de Bing) | IndexNow chaque matin à 5 h 30 UTC : pages nouvelles ou modifiées envoyées à Bing | ✅ |
| **Yandex, Seznam, Naver, Yep** | Partagé automatiquement par le protocole IndexNow | ✅ |
| **Assistants IA** : ChatGPT, Claude, Perplexity, Gemini, Apple Intelligence, Meta AI, Mistral, DuckDuckGo Assist, Amazon | `robots.txt` les autorise nommément ; `llms.txt` et `llms-full.txt` leur résument le site | ✅ |
| **Common Crawl** (base d'entraînement de nombreux modèles d'IA) | CCBot autorisé | ✅ |
| **Apple** (Siri, Spotlight, Safari) | Applebot autorisé | ✅ |
| **Brave Search** (utilisé aussi par plusieurs assistants IA) | Pas d'outil de soumission : Brave découvre les pages par les liens. Les liens entrants (widget, comparatifs, presse) comptent | ⏳ |
| **Installation sur téléphone** | Manifeste d'appli complet (icônes Android, raccourcis Alternance / Stages / Guides) : « Ajouter à l'écran d'accueil » | ✅ |

---

## 2. À faire de ton côté (par ordre d'impact)

### a. Bing Webmaster Tools : le plus rentable pour les IA
ChatGPT, Copilot, DuckDuckGo, Qwant, Ecosia et Yahoo s'appuient sur Bing.
1. Va sur https://www.bing.com/webmasters et connecte-toi.
2. Choisis **« Importer depuis Google Search Console »** : le site et le sitemap sont repris en un clic.
3. Vérifie dans **Sitemaps** que `https://www.stageio.fr/sitemap.xml` apparaît.

### b. Google Search Console
1. Sur https://search.google.com/search-console, ouvre **Sitemaps** et vérifie que `https://www.stageio.fr/sitemap.xml` est soumis et lu sans erreur.
2. Dans **Inspection de l'URL**, colle chacune de ces adresses puis clique sur **« Demander l'indexation »** (une dizaine par jour au maximum) :
   - https://www.stageio.fr/alternance
   - https://www.stageio.fr/stage
   - https://www.stageio.fr/alternance/paris
   - https://www.stageio.fr/alternance/lyon
   - https://www.stageio.fr/alternance/secretaire-medical
   - https://www.stageio.fr/alternance/assistant-dentaire
   - https://www.stageio.fr/stage/business-developer
   - https://www.stageio.fr/stage/evenementiel
   - https://www.stageio.fr/guides/sites-pour-trouver-une-alternance
   - https://www.stageio.fr/barometre-alternance-stage

### c. Play Store (Android) : les étudiants cherchent aussi « appli alternance » dans le store
Stageio est une appli web : on la publie sans rien recoder, grâce à PWABuilder (outil gratuit de Microsoft).
1. Crée un compte Google Play Console (https://play.google.com/console, frais d'inscription unique de 25 $).
   ⚠️ Compte personnel : Google exige un test fermé avec au moins une douzaine de testeurs pendant 14 jours avant la publication. Vérifie les conditions actuelles dans la Play Console. Un compte d'entreprise (numéro D-U-N-S) en est dispensé.
2. Sur https://www.pwabuilder.com, entre `https://www.stageio.fr`, puis **Package for stores → Android**. Nom du paquet proposé : `fr.stageio.app`. Télécharge le paquet et garde précieusement la clé de signature fournie.
3. Dans Vercel → Settings → Environment Variables (Production), ajoute :
   - `ANDROID_PACKAGE_NAME` = le nom du paquet (ex. `fr.stageio.app`)
   - `ANDROID_SHA256_FINGERPRINTS` = l'empreinte SHA-256 donnée par PWABuilder (ou la Play Console, rubrique « Intégrité de l'application »)
   
   Puis redéploie. `https://www.stageio.fr/.well-known/assetlinks.json` les publie : l'appli s'ouvre alors en plein écran, sans barre d'adresse.
4. Fiche du store :
   - Titre : « Stageio : alternance et stage »
   - Description courte : « Les offres d'alternance et de stage de ta ville, à swiper. Gratuit. »
   - Captures d'écran : prends-les sur ton téléphone avec de vraies offres (pas de maquettes).

### d. Microsoft Store (Windows)
Même outil : PWABuilder → **Windows**. Il faut un compte développeur Microsoft (Partner Center) : vérifie le tarif sur la page d'inscription.

### e. Apple App Store
Pas possible avec une appli web seule (Apple demande une appli native). Sur iPhone : Safari → Partager → « Sur l'écran d'accueil » fonctionne déjà.

### f. Annuaires, comparatifs, presse
Liste des cibles et messages prêts dans `docs/citations-ia.md` (comparatifs « sites pour trouver une alternance », AlternativeTo, Product Hunt, universités, BDE) et `docs/kit-acquisition.md` (widget, presse). Chaque lien obtenu aide Google, Bing, Brave et les IA à la fois.

### g. Réseaux sociaux
Envoie-moi les liens de tes comptes LinkedIn (page entreprise), TikTok et Instagram Stageio : je les ajoute au site (bloc `sameAs`), ce qui aide Google et les IA à reconnaître la marque.
