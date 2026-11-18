import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SCHOOL_STAGES, SCHOOL_STAGE_IDS, ageOn, waitsForParent } from "@/lib/schoolStage/levels";
import { SCHOOL_SECTORS, loadSchoolCompanies, schoolSector } from "@/lib/schoolStage/companies";
import { SchoolLetter } from "@/components/schoolStage/SchoolLetter";
import { resendParentConsentAction, saveSchoolStageAction } from "./actions";

// Stages scolaires (18/11) : 3e, seconde, 1re, bac pro. Gratuit. 1) le
// profil (niveau, date de naissance, ville, e-mail d'un parent sous 15 ans),
// 2) l'accord du parent si besoin, 3) les entreprises proches par secteur
// avec une lettre prête à envoyer ou à déposer.

export const metadata: Metadata = { title: "Ton stage de 3e, de seconde, de 1re ou de bac pro", robots: { index: false } };

const muted = { color: "color-mix(in srgb, var(--color-text) 66%, transparent)" } as const;
const input = {
  width: "100%",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-divider)",
  padding: "10px 12px",
  fontSize: 14,
  fontFamily: "inherit",
  background: "var(--color-surface)",
} as const;

const ERRORS: Record<string, string> = {
  niveau: "Choisis ta classe.",
  naissance: "Indique ta vraie date de naissance.",
  naissance_fixe: "Ta date de naissance ne peut plus être changée. Écris-nous si elle est fausse.",
  champs: "Indique ton prénom, ton nom et ta ville.",
  parent: "Tu as moins de 15 ans : indique l'adresse e-mail d'un de tes parents.",
  parent_meme: "L'adresse du parent doit être différente de la tienne.",
  base: "L'enregistrement n'a pas marché, réessaie.",
};

type Search = { secteur?: string; modifier?: string; erreur?: string; renvoi?: string };

export default async function StagesScolairesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/stages-scolaires");
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  const q = await searchParams;
  const error = q.erreur ? ERRORS[q.erreur] : null;

  // 1) Profil à remplir.
  if (!profile?.school_stage || q.modifier) {
    const locked = !!profile?.school_stage && !!profile.birth_date;
    return (
      <div className="mx-auto w-full max-w-[560px]">
        <h1 style={{ fontSize: 26, margin: 0 }}>Ton stage de collège ou de lycée</h1>
        <p style={{ fontSize: 14, lineHeight: 1.5, margin: "6px 0 0", ...muted }}>
          Stageio te montre les entreprises près de chez toi et t&apos;écrit ta lettre de demande de stage. C&apos;est gratuit.
        </p>
        {error && <p style={{ fontSize: 13.5, color: "#b42318", margin: "12px 0 0" }}>{error}</p>}
        <form action={saveSchoolStageAction} className="card elev-sm mt-5 flex flex-col gap-3" style={{ padding: "var(--space-6)" }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>Ta classe</p>
          {SCHOOL_STAGE_IDS.map((id) => (
            <label key={id} className="card flex-row items-center gap-2.5" style={{ padding: "10px 12px", cursor: "pointer", fontSize: 14 }}>
              <input type="radio" name="level" value={id} required defaultChecked={profile?.school_stage === id} />
              {SCHOOL_STAGES[id].label}
            </label>
          ))}
          <label style={{ fontSize: 14, fontWeight: 700, marginTop: 6 }}>
            Prénom et nom
            <input name="full_name" required defaultValue={profile?.full_name ?? ""} autoComplete="name" style={{ ...input, marginTop: 6, fontWeight: 400 }} />
          </label>
          <label style={{ fontSize: 14, fontWeight: 700 }}>
            Date de naissance
            <input
              name="birth_date"
              type="date"
              required
              defaultValue={profile?.birth_date ?? ""}
              readOnly={locked}
              style={{ ...input, marginTop: 6, fontWeight: 400 }}
            />
          </label>
          <label style={{ fontSize: 14, fontWeight: 700 }}>
            Ta ville
            <input name="city" required defaultValue={profile?.city ?? ""} placeholder="Par exemple Orléans" style={{ ...input, marginTop: 6, fontWeight: 400 }} />
          </label>
          <label style={{ fontSize: 14, fontWeight: 700 }}>
            E-mail d&apos;un parent <span style={{ fontWeight: 400, ...muted }}>(obligatoire si tu as moins de 15 ans)</span>
            <input name="parent_email" type="email" defaultValue={profile?.parent_email ?? ""} autoComplete="off" style={{ ...input, marginTop: 6, fontWeight: 400 }} />
          </label>
          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.45, ...muted }}>
            Moins de 15 ans : la loi demande l&apos;accord d&apos;un parent. On lui envoie un lien, et tu vois les entreprises dès qu&apos;il a cliqué.
          </p>
          <button type="submit" className="btn btn-primary mt-2">
            Continuer
          </button>
        </form>
      </div>
    );
  }

  const info = SCHOOL_STAGES[profile.school_stage];

  // 2) En attente de l'accord d'un parent.
  if (waitsForParent(profile)) {
    return (
      <div className="mx-auto w-full max-w-[560px]">
        <div className="card elev-sm" style={{ padding: "var(--space-6)" }}>
          <p className="text-3xl" style={{ margin: 0 }}>
            📩
          </p>
          <h1 style={{ fontSize: 22, margin: "10px 0 0" }}>On attend l&apos;accord de ton parent</h1>
          <p style={{ fontSize: 14, lineHeight: 1.5, margin: "8px 0 0", ...muted }}>
            Tu as moins de 15 ans : on a envoyé un lien à <b>{profile.parent_email}</b>. Dès qu&apos;il ou elle clique sur « Je donne mon accord »,
            tu vois les entreprises près de chez toi et ta lettre. Pense à regarder dans les spams.
          </p>
          {q.renvoi === "ok" && <p style={{ fontSize: 13.5, margin: "10px 0 0" }}>✅ E-mail renvoyé.</p>}
          {q.renvoi === "attends" && <p style={{ fontSize: 13.5, margin: "10px 0 0" }}>Attends quelques minutes avant de le renvoyer.</p>}
          {q.renvoi === "erreur" && <p style={{ fontSize: 13.5, color: "#b42318", margin: "10px 0 0" }}>L&apos;e-mail n&apos;est pas parti, réessaie plus tard.</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <form action={resendParentConsentAction}>
              <button type="submit" className="btn btn-primary">
                Renvoyer l&apos;e-mail
              </button>
            </form>
            <Link href="/stages-scolaires?modifier=1" className="btn">
              Changer l&apos;adresse
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3) Entreprises proches et lettre.
  const sector = q.secteur ? schoolSector(q.secteur) : undefined;
  const result = sector ? await loadSchoolCompanies(profile.city, sector.id) : null;
  const age = ageOn(profile.birth_date);

  return (
    <div className="mx-auto w-full max-w-[680px]">
      <h1 style={{ fontSize: 26, margin: 0 }}>{info.label} : trouve ton entreprise</h1>
      <p style={{ fontSize: 14, lineHeight: 1.5, margin: "6px 0 0", ...muted }}>
        Choisis un secteur : on te montre les entreprises autour de {profile.city}. Envoie ou dépose ta lettre dans plusieurs d&apos;entre elles, c&apos;est
        comme ça qu&apos;on trouve le plus vite. Ton établissement te donne la convention à faire signer.
      </p>
      <p style={{ fontSize: 12.5, margin: "6px 0 0", ...muted }}>
        <Link href="/stages-scolaires?modifier=1">Modifier ma classe ou ma ville</Link>
        {age !== null && age < 15 ? " · Accord parental reçu ✅" : ""}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {SCHOOL_SECTORS.map((s) => (
          <Link
            key={s.id}
            href={`/stages-scolaires?secteur=${s.id}`}
            className={`tag ${sector?.id === s.id ? "tag-accent" : ""}`}
            style={{ fontSize: 13.5, padding: "7px 12px", textDecoration: "none" }}
          >
            {s.emoji} {s.label}
          </Link>
        ))}
      </div>

      {!sector && <p style={{ fontSize: 14, margin: "18px 0 0", ...muted }}>👆 Choisis un secteur pour voir les entreprises.</p>}
      {result?.status === "no_city" && (
        <p style={{ fontSize: 14, margin: "18px 0 0" }}>
          On ne reconnaît pas ta ville. <Link href="/stages-scolaires?modifier=1">Corrige-la</Link> (une ville ou un numéro de département).
        </p>
      )}
      {result?.status === "error" && <p style={{ fontSize: 14, margin: "18px 0 0" }}>L&apos;annuaire des entreprises ne répond pas, réessaie dans quelques minutes.</p>}
      {result?.status === "ok" && result.companies.length === 0 && (
        <p style={{ fontSize: 14, margin: "18px 0 0" }}>Aucune entreprise trouvée dans ce secteur près de {result.zone}. Essaie un autre secteur.</p>
      )}
      {result?.status === "ok" && result.companies.length > 0 && (
        <SchoolLetter
          level={profile.school_stage}
          fullName={profile.full_name}
          companies={result.companies}
          zone={result.zone}
        />
      )}
      <p style={{ fontSize: 12, margin: "20px 0 0", ...muted }}>
        Entreprises : annuaire public des entreprises (Insee), établissements ouverts avec des salariés. Offres de stage publiées par l&apos;État :{" "}
        <a href="https://1eleve1stage.education.gouv.fr" target="_blank" rel="noreferrer">
          1élève1stage
        </a>
        .
      </p>
    </div>
  );
}
