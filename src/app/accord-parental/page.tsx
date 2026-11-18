import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyConsentParams } from "@/lib/schoolStage/parentConsent";
import { SCHOOL_STAGES } from "@/lib/schoolStage/levels";
import { giveParentConsentAction } from "./actions";

// Page du lien envoyé au parent (élève de moins de 15 ans, 18/11). Sans
// connexion : la signature du lien suffit. On ne montre que le prénom de
// l'élève et ce que fait Stageio.

export const metadata: Metadata = { title: "Accord parental", robots: { index: false, follow: false } };

const muted = { color: "color-mix(in srgb, var(--color-text) 65%, transparent)" } as const;

type Search = { u?: string; e?: string; s?: string; merci?: string; erreur?: string };

export default async function ParentConsentPage({ searchParams }: { searchParams: Promise<Search> }) {
  const q = await searchParams;
  const params = { u: q.u ?? "", e: q.e ?? "", s: q.s ?? "" };
  const { data: p } = /^[0-9a-f-]{36}$/i.test(params.u)
    ? await createAdminClient().from("profiles").select("full_name, school_stage, parent_email, parent_consent_at").eq("id", params.u).maybeSingle()
    : { data: null };
  const valid = !!p && verifyConsentParams(params, p.parent_email);
  const firstName = p?.full_name?.split(" ")[0] || "Votre enfant";

  return (
    <div className="mx-auto flex max-w-md flex-1 items-center px-5 py-10">
      <div className="card elev-sm w-full" style={{ padding: "var(--space-6)" }}>
        {!valid ? (
          <>
            <h1 style={{ fontSize: 21, margin: 0 }}>Lien expiré ou incomplet</h1>
            <p style={{ fontSize: 14, lineHeight: 1.5, margin: "8px 0 0", ...muted }}>
              Demandez à votre enfant de vous renvoyer l&apos;e-mail depuis Stageio, ou répondez à notre e-mail.
            </p>
          </>
        ) : q.merci || p!.parent_consent_at ? (
          <>
            <p className="text-4xl" style={{ margin: 0 }}>
              ✅
            </p>
            <h1 style={{ fontSize: 21, margin: "10px 0 0" }}>Merci, c&apos;est enregistré</h1>
            <p style={{ fontSize: 14, lineHeight: 1.5, margin: "8px 0 0", ...muted }}>
              {firstName} peut maintenant voir les entreprises près de chez vous et préparer sa lettre. Pour supprimer le compte, répondez simplement à
              notre e-mail.
            </p>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 21, margin: 0 }}>{firstName} cherche son {p!.school_stage ? SCHOOL_STAGES[p!.school_stage].label.toLowerCase() : "stage"}</h1>
            <p style={{ fontSize: 14, lineHeight: 1.5, margin: "8px 0 0", ...muted }}>
              Stageio montre à votre enfant des offres de stage près de chez vous (plateforme 1élève1stage de l&apos;Éducation nationale pour la 3e et
              la seconde) et des entreprises proches à contacter, et prépare ses lettres. Votre enfant postule lui-même : Stageio ne contacte aucune
              entreprise à sa place. Certaines fonctions sont payantes : c&apos;est vous qui paierez si besoin.
            </p>
            <p style={{ fontSize: 13, lineHeight: 1.5, margin: "8px 0 0", ...muted }}>
              Données gardées : prénom et nom, date de naissance, ville, classe, et votre adresse e-mail.
            </p>
            {q.erreur && <p style={{ fontSize: 13, color: "#b42318", margin: "10px 0 0" }}>L&apos;enregistrement n&apos;a pas marché, réessayez.</p>}
            <form action={giveParentConsentAction} className="mt-5">
              <input type="hidden" name="u" value={params.u} />
              <input type="hidden" name="e" value={params.e} />
              <input type="hidden" name="s" value={params.s} />
              <button type="submit" className="btn btn-primary w-full">
                Je donne mon accord
              </button>
            </form>
            <p style={{ fontSize: 12.5, margin: "10px 0 0", ...muted }}>Vous refusez ? Ne cliquez pas : le compte reste bloqué.</p>
          </>
        )}
      </div>
    </div>
  );
}
