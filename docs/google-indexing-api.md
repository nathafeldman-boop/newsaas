# Activer la Google Indexing API (10 minutes, une seule fois)

But : chaque nouvelle offre de Stageio est signalée à Google le jour même, et peut apparaître dans Google Jobs en quelques heures au lieu de quelques jours. Le code est en place (cron quotidien `google-indexing`) : il ne manque que la clé.

## 1. Créer le compte de service (Google Cloud)

1. Va sur https://console.cloud.google.com, avec le même compte Google que Search Console.
2. En haut, crée un projet : « Nouveau projet », nom `stageio-indexing`, puis « Créer ».
3. Dans le menu, choisis « API et services », puis « Bibliothèque ». Cherche **Web Search Indexing API** et clique sur « Activer ».
4. Dans le menu, choisis « IAM et administration », puis « Comptes de service », puis « Créer un compte de service ».
   - Nom : `stageio-indexing`.
   - Clique sur « Créer et continuer », puis « OK » (aucun rôle n'est nécessaire).
5. Clique sur le compte créé, puis sur l'onglet « Clés » → « Ajouter une clé » → « Créer une clé » → **JSON** → « Créer ». Un fichier `.json` se télécharge.
6. Copie l'adresse email du compte : elle ressemble à `stageio-indexing@stageio-indexing.iam.gserviceaccount.com`.

## 2. Donner l'accès dans Search Console

Va dans Search Console → « Paramètres » → « Utilisateurs et autorisations » → « Ajouter un utilisateur ».
- Colle l'email du compte de service.
- Choisis l'autorisation **Propriétaire**. Google l'exige pour cette API.

Si l'option « Propriétaire » n'apparaît pas, passe par « Gérer les propriétaires de la propriété » → « Ajouter un propriétaire ».

## 3. Coller la clé dans Vercel

Va dans Vercel → projet `newsaas` → « Settings » → « Environment Variables » → « Add ».
- **Nom** : `GOOGLE_INDEXING_SERVICE_ACCOUNT`.
- **Valeur** : tout le contenu du fichier `.json` (ouvre-le avec le Bloc-notes, copie tout, colle).
- **Environnement** : Production.

Enregistre, puis relance le dernier déploiement : « Deployments » → « ⋯ » → « Redeploy ».

**Ne m'envoie jamais ce fichier** : c'est une clé privée. Elle ne doit aller que dans Vercel.

## Ensuite

C'est automatique : chaque matin vers 7 h 50 (heure de Paris), les nouvelles offres de la nuit sont envoyées à Google, les plus récentes d'abord (200 par jour, le quota gratuit). Je surveille les résultats dans les logs.
