// Distinct du gate par code d'accès de /admin (lib/admin/accessCode.ts) :
// sert uniquement à faire passer le fondateur au-dessus du paywall quand il
// navigue l'appli consommateur avec son propre compte Supabase.
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase());
}
