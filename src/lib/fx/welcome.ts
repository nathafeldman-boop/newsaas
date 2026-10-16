// Cookie court posé à la connexion (LoginForm côté navigateur,
// auth/callback côté serveur) : l'écran de bienvenue (WelcomeSplash) le lit
// une fois puis l'efface. Pas de donnée personnelle dedans.
export const WELCOME_COOKIE = "stageio_welcome";
export const WELCOME_COOKIE_MAX_AGE = 120;
