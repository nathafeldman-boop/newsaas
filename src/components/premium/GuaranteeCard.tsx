import { requestRefundAction } from "@/app/(app)/premium/guarantee-actions";
import type { GuaranteeStatus } from "@/lib/premium/refundGuarantee";
import { GUARANTEE_MIN_LIKES, GUARANTEE_REFUND_DAYS, formatParis } from "@/lib/premium/guaranteeTerms";

export type GuaranteePhase = "before" | "open" | "closed";

const REFUND_MESSAGES: Record<string, string> = {
  confirm_required: "Coche la case pour certifier que tu n'as obtenu aucun entretien.",
  outside_window: "La demande n'est possible que pendant ta fenêtre de 12 h (dates ci-dessous).",
  not_enough_likes: `Il faut au moins ${GUARANTEE_MIN_LIKES} offres likées pendant tes 3 mois.`,
  unavailable: "Aucune garantie n'est associée à ton achat.",
  error: "Un souci est survenu, réessaie dans une minute ou écris à contact@stageio.fr.",
};

const muted = "color-mix(in srgb, var(--color-text) 62%, transparent)";

// Garantie remboursé côté Premium : dates exactes de la fenêtre de 12 h dès
// l'achat, offres likées, puis le formulaire de demande pendant la fenêtre.
export function GuaranteeCard({
  status,
  phase,
  refund,
}: {
  status: GuaranteeStatus;
  phase: GuaranteePhase;
  refund: string | null;
}) {
  const enoughLikes = status.likes >= GUARANTEE_MIN_LIKES;
  const period = `du ${formatParis(status.opensAt)} au ${formatParis(status.closesAt)} (heure de Paris)`;
  return (
    <div
      className="card"
      style={{ marginTop: 24, width: "100%", padding: "16px 16px", textAlign: "left", fontSize: 13.5, lineHeight: 1.5 }}
    >
      <p style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>🛡️ Ta garantie remboursé</p>
      {status.requestedAt ? (
        <p style={{ margin: "6px 0 0" }}>
          ✅ Demande reçue le {formatParis(new Date(status.requestedAt))}. On te rembourse sous {GUARANTEE_REFUND_DAYS} jours
          sur ta carte.
        </p>
      ) : phase === "closed" ? (
        <p style={{ margin: "6px 0 0", color: muted }}>La période de demande s&apos;est terminée le {formatParis(status.closesAt)}.</p>
      ) : (
        <>
          <p style={{ margin: "6px 0 0" }}>
            Aucun entretien après 3 mois ? Demande ton remboursement <strong>{period}</strong>. On t&apos;envoie un rappel par
            email la veille.
          </p>
          <p style={{ margin: "8px 0 0", color: muted }}>
            Offres likées depuis ton achat : <strong>{Math.min(status.likes, 9999)}</strong> / {GUARANTEE_MIN_LIKES} minimum
          </p>
          <div aria-hidden style={{ marginTop: 6, height: 6, borderRadius: 99, background: "var(--color-divider)", overflow: "hidden" }}>
            <div
              style={{
                width: `${Math.min(100, (status.likes / GUARANTEE_MIN_LIKES) * 100)}%`,
                height: "100%",
                background: "var(--color-accent)",
              }}
            />
          </div>
          {phase === "open" &&
            (enoughLikes ? (
              <form action={requestRefundAction} style={{ marginTop: 12 }}>
                <label className="flex items-start gap-2" style={{ fontSize: 13, cursor: "pointer" }}>
                  <input type="checkbox" name="no_interview" required style={{ marginTop: 3 }} />
                  <span>Je certifie sur l&apos;honneur n&apos;avoir obtenu aucun entretien depuis mon passage Premium.</span>
                </label>
                <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 12, height: 46, borderRadius: 999, fontWeight: 700 }}>
                  Demander mon remboursement
                </button>
              </form>
            ) : (
              <p style={{ margin: "10px 0 0", color: muted }}>
                Il fallait au moins {GUARANTEE_MIN_LIKES} offres likées pendant tes 3 mois : la garantie ne s&apos;applique pas.
              </p>
            ))}
        </>
      )}
      {refund && refund !== "requested" && REFUND_MESSAGES[refund] && (
        <p style={{ margin: "10px 0 0", fontSize: 12.5, fontWeight: 600, color: "var(--color-danger, #c0392b)" }}>
          {REFUND_MESSAGES[refund]}
        </p>
      )}
    </div>
  );
}
