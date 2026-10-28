import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAutoTier, isPremium } from "@/lib/subscription/isPremium";
import { normalizePhone, splitFullName } from "@/lib/laBonneAlternance/applicant";
import { parisMidnightIso } from "@/lib/applications/autoSend";
import { requestNow } from "@/lib/applications/status";
import { AUTO_SPONTANEOUS_PER_DAY, SPONTANEOUS_DAILY_LIMIT, contactedBy, loadTargets } from "@/lib/spontaneous/targets";
import { SpontaneousList } from "@/components/spontaneous/SpontaneousList";

// Candidatures spontanées (28/10) : les entreprises près de l'étudiant qui
// recrutent des alternants dans son métier sans annonce publiée (La bonne
// alternance). Premium : une candidature en un clic (lettre et CV joints).
// Auto : en plus, 20 entreprises contactées chaque jour sans rien faire.
// Réservé aux abonnés : on n'y arrive que depuis le tableau de bord.

const muted = { color: "color-mix(in srgb, var(--color-text) 66%, transparent)" } as const;

export default async function SpontaneesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/spontanees");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!profile || !isPremium(profile)) redirect("/dashboard");

  const auto = isAutoTier(profile);
  const [result, contacted] = await Promise.all([loadTargets(profile), contactedBy(createAdminClient(), user.id, parisMidnightIso(requestNow()))]);
  const fresh = result.status === "ok" ? result.targets.filter((t) => !contacted.ids.has(t.recipientId)) : [];

  return (
    <div className="mx-auto w-full max-w-[640px]">
      <h1 style={{ fontSize: 28, margin: 0 }}>Candidatures spontanées</h1>
      <p style={{ fontSize: 14, lineHeight: 1.5, margin: "6px 0 0", ...muted }}>
        Beaucoup de contrats se signent sans annonce. Voici les entreprises
        {result.status === "ok" ? ` autour de ${result.zone}` : ""} qui recrutent des alternants dans ton métier, d&apos;après La bonne alternance
        (service public). Ta candidature leur arrive par email, avec ta lettre et ton CV.
      </p>

      {auto && (
        <div className="card elev-sm mt-5" style={{ padding: "14px 16px", background: "color-mix(in srgb, var(--color-accent) 8%, var(--color-surface))" }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>⚡ Envoi automatique activé (Stageio Auto)</p>
          <p style={{ margin: "4px 0 0", fontSize: 13, lineHeight: 1.45, ...muted }}>
            Chaque jour, jusqu&apos;à {AUTO_SPONTANEOUS_PER_DAY} de ces entreprises reçoivent ta candidature sans que tu aies rien à faire.
            Aujourd&apos;hui : {contacted.auto} envoyée{contacted.auto > 1 ? "s" : ""} automatiquement.
          </p>
        </div>
      )}

      {result.status === "no_job" || result.status === "no_city" ? (
        <div className="card elev-sm mt-6" style={{ padding: "var(--space-6)" }}>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5 }}>
            {result.status === "no_job"
              ? "Indique le métier que tu vises dans ton profil (par exemple « commercial », « assistant RH », « développeur ») : c'est lui qui nous dit quelles entreprises te proposer."
              : "Indique ta ville dans ton profil : on te propose les entreprises proches de chez toi."}
          </p>
          <Link href="/profil" className="btn btn-primary" style={{ marginTop: 12, alignSelf: "flex-start" }}>
            Compléter mon profil
          </Link>
        </div>
      ) : result.status !== "ok" ? (
        <div className="card elev-sm mt-6" style={{ padding: "var(--space-6)" }}>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5 }}>
            La liste des entreprises n&apos;est pas disponible pour le moment. Réessaie dans quelques minutes.
          </p>
        </div>
      ) : (
        <SpontaneousList
          userId={user.id}
          targets={fresh.slice(0, 60)}
          totalFound={result.targets.length}
          alreadyContacted={contacted.ids.size}
          sentToday={contacted.manual}
          dailyLimit={SPONTANEOUS_DAILY_LIMIT}
          setup={{ hasCv: !!profile.cv_path, hasPhone: !!normalizePhone(profile.phone), hasFullName: !!splitFullName(profile.full_name) }}
        />
      )}
    </div>
  );
}
