// Entonnoir du dashboard (20/11, Nathan) : comptes créés sur la période et
// jusqu'où ils vont. Une barre par étape : largeur = part des inscrits, à
// droite la part gardée depuis l'étape d'avant (en rouge la plus grosse fuite).

export type FunnelData = {
  signups: number;
  onboarded: number;
  swiped: number;
  paywall: number;
  checkout: number;
  paid: number;
  revenue_cents: number;
  median_swipes: number;
  median_min_to_paywall: number | null;
  median_min_to_pay: number | null;
};

const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 1000) / 10} %` : "—");
const eur = (cents: number) => `${(cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const minutes = (m: number | null) => (m === null ? "—" : m < 60 ? `${Math.round(m)} min` : `${Math.round((m / 60) * 10) / 10} h`);

export function Funnel({ data, prev }: { data: FunnelData; prev: FunnelData | null }) {
  const steps = [
    { label: "Inscrits", n: data.signups, p: prev?.signups },
    { label: "Onboarding fini", n: data.onboarded, p: prev?.onboarded },
    { label: "Paywall vu", n: data.paywall, p: prev?.paywall },
    { label: "Page de paiement ouverte", n: data.checkout, p: prev?.checkout },
    { label: "Payé", n: data.paid, p: prev?.paid },
  ];
  // Plus grosse fuite : l'étape qui garde la plus petite part de la précédente.
  let worst = -1;
  let worstRate = 2;
  steps.forEach((s, i) => {
    if (i === 0 || steps[i - 1].n === 0) return;
    const r = s.n / steps[i - 1].n;
    if (r < worstRate) {
      worstRate = r;
      worst = i;
    }
  });
  const top = Math.max(1, data.signups);

  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="flex flex-col gap-2">
        {steps.map((s, i) => {
          const kept = i === 0 ? null : pct(s.n, steps[i - 1].n);
          const lost = i === 0 ? 0 : steps[i - 1].n - s.n;
          return (
            <div key={s.label}>
              <div className="flex items-baseline justify-between gap-2" style={{ fontSize: 13 }}>
                <span style={{ fontWeight: 800 }}>
                  {s.label} <span style={{ fontWeight: 600, opacity: 0.65 }}>· {s.n.toLocaleString("fr-FR")}</span>
                  {s.p !== undefined && s.p !== null && (
                    <span style={{ fontWeight: 600, opacity: 0.5 }}> (avant : {s.p.toLocaleString("fr-FR")})</span>
                  )}
                </span>
                {kept && (
                  <span style={{ fontWeight: 800, color: i === worst ? "#e5484d" : "inherit" }}>
                    {kept} restent{lost > 0 ? ` · ${lost.toLocaleString("fr-FR")} partent` : ""}
                  </span>
                )}
              </div>
              <div style={{ height: 22, borderRadius: 6, background: "color-mix(in srgb, currentColor 8%, transparent)", overflow: "hidden", marginTop: 4 }}>
                <div
                  style={{
                    width: `${Math.max(2, (s.n / top) * 100)}%`,
                    height: "100%",
                    borderRadius: 6,
                    background: i === worst ? "#e5484d" : "var(--color-accent, #22c55e)",
                    display: "flex",
                    alignItems: "center",
                    paddingLeft: 8,
                    color: "#fff",
                    fontSize: 11.5,
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                  }}
                >
                  {pct(s.n, data.signups)} des inscrits
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {worst > 0 && (
        <p style={{ margin: "12px 0 0", fontSize: 13, color: "#e5484d", fontWeight: 700 }}>
          Plus grosse fuite : « {steps[worst - 1].label} » → « {steps[worst].label} » ({pct(steps[worst].n, steps[worst - 1].n)} restent).
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" style={{ marginTop: 14, fontSize: 13 }}>
        <Stat label="Encaissé (ces inscrits)" value={eur(data.revenue_cents)} />
        <Stat label="Par inscrit" value={data.signups ? eur(Math.round(data.revenue_cents / data.signups)) : "—"} />
        <Stat label="Par paywall vu" value={data.paywall ? eur(Math.round(data.revenue_cents / data.paywall)) : "—"} />
        <Stat label="Paywall → payé" value={pct(data.paid, data.paywall)} />
        <Stat label="Paiement ouvert → payé" value={pct(data.paid, data.checkout)} />
        <Stat label="Panier moyen" value={data.paid ? eur(Math.round(data.revenue_cents / data.paid)) : "—"} />
        <Stat label="Ont swipé (au moins 1)" value={`${data.swiped.toLocaleString("fr-FR")} · ${pct(data.swiped, data.onboarded)} des onboardés`} />
        <Stat label="Swipes (médiane)" value={String(Math.round(data.median_swipes))} />
        <Stat label="Inscription → paywall (médiane)" value={minutes(data.median_min_to_paywall)} />
        <Stat label="Inscription → paiement (médiane)" value={minutes(data.median_min_to_pay)} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ opacity: 0.6, fontSize: 12 }}>{label}</div>
      <div style={{ fontWeight: 800 }}>{value}</div>
    </div>
  );
}
