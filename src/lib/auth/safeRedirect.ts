// `next` arrive systématiquement depuis un paramètre d'URL (lien de
// connexion, redirection post-login, callback OAuth) -- donc contrôlable
// par quiconque forge le lien, jamais par le code de l'appli lui-même.
// Sans validation, un lien du type /login?next=https://evil.example ou
// /login?next=//evil.example renvoyait l'utilisateur, une fois bien
// connecté sur le vrai Stageio, directement vers un site externe -- un
// vecteur de phishing classique (open redirect). Bug réel trouvé à
// l'audit du 2026-09-25.
//
// Seul un chemin relatif à la racine ("/xxx", jamais "//xxx" qui est
// interprété par le navigateur comme protocol-relative vers un autre
// host) est autorisé ; toute autre valeur retombe sur `fallback`.
export function safeRedirectPath(next: string | null | undefined, fallback: string): string {
  if (!next) return fallback;
  // "//host" et "/\host" sont tous les deux interprétés comme une URL
  // protocol-relative par la plupart des navigateurs (le second est une
  // variante moins connue, mais un contournement classique d'une
  // validation naïve qui ne bloquerait que "//").
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
