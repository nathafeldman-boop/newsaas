"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MIN_CHANNEL_SIGNUPS, planFor, simulate, type ChannelRow } from "@/lib/admin/goals";

// Simulateur (26/10, Nathan : « si je veux faire 10 000 € par mois, combien
// d'utilisateurs ? si je ramène 6 000 personnes de TikTok, combien d'argent ?
// pareil pour Instagram, Snap… je peux tout simuler »). Tout part des taux
// mesurés (30 derniers jours), modifiables à la main dans « Hypothèses » ;
// un canal avec trop peu d'inscrits prend le taux global, et le dit.

export type SimulatorRates = {
  windowDays: number;
  signups: number;
  payers: number;
  conversion: number | null;
  avgFirstPaymentCents: number | null;
  paywallRate: number | null;
  checkoutRate: number | null;
  signupsPer1000Views: number | null;
  monthlyShare: number | null;
  monthlyPriceCents: number | null;
  retention: number | null;
  /** Renouvellements attendus le mois prochain, abonnés actuels. */
  nextMonthRenewalsCents: number;
  channels: ChannelRow[];
};

const ALL = "Tous les canaux";
const CHANNEL_ORDER = ["TikTok", "Instagram", "Snapchat", "Google", "YouTube", "Bouche-à-oreille", "LinkedIn", "ChatGPT ou une IA", "École ou prof", "Autre"];

// Espace insécable classique : la police en graisse 800 n'a pas l'espace fine de toLocaleString.
const num = (n: number) => Math.round(n).toLocaleString("fr-FR").replace(/\u202f/g, "\u00a0");
const eur = (cents: number) => `${num(cents / 100)} €`;
const pctText = (r: number) => `${(r * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const parse = (raw: string) => {
  const n = Number(raw.replace(/[\s €%]/g, "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

type Hyp = { conversion: number; avgFirst: number; monthlyShare: number; monthlyPrice: number; retention: number; per1000: number | null };
type HypKey = keyof Hyp;
const KINDS: Record<HypKey, "pct" | "eur" | "num"> = { conversion: "pct", avgFirst: "eur", monthlyShare: "pct", monthlyPrice: "eur", retention: "pct", per1000: "num" };

/** Valeur affichée dans le champ (« 3,13 » pour 3,13 %, « 38,05 » pour 38,05 €). */
function toText(h: Hyp): Record<HypKey, string> {
  const out = {} as Record<HypKey, string>;
  for (const key of Object.keys(KINDS) as HypKey[]) {
    const v = h[key];
    out[key] = v === null ? "" : (KINDS[key] === "pct" ? +(v * 100).toFixed(2) : KINDS[key] === "eur" ? +(v / 100).toFixed(2) : +v.toFixed(1)).toLocaleString("fr-FR");
  }
  return out;
}

function fromText(text: Record<HypKey, string>): Hyp {
  const value = (key: HypKey) => {
    const v = parse(text[key]);
    return KINDS[key] === "pct" ? v / 100 : KINDS[key] === "eur" ? Math.round(v * 100) : v;
  };
  return {
    conversion: value("conversion"),
    avgFirst: value("avgFirst"),
    monthlyShare: value("monthlyShare"),
    monthlyPrice: value("monthlyPrice"),
    retention: value("retention"),
    per1000: text.per1000.trim() === "" ? null : value("per1000") || null,
  };
}

function measuredHyp(r: SimulatorRates): Hyp {
  return {
    conversion: r.conversion ?? 0,
    avgFirst: r.avgFirstPaymentCents ?? 0,
    monthlyShare: r.monthlyShare ?? 0,
    monthlyPrice: r.monthlyPriceCents ?? 0,
    retention: r.retention ?? 0,
    per1000: r.signupsPer1000Views,
  };
}

function Big({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div>
      <motion.div key={value} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="sim-big">
        {value}
      </motion.div>
      <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--color-neutral-600)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "7px 0", borderTop: "1px solid var(--color-neutral-200)", fontSize: 13 }}>
      <span>
        {label}
        {hint && <span style={{ display: "block", fontSize: 11.5, color: "var(--color-neutral-600)" }}>{hint}</span>}
      </span>
      <b style={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{value}</b>
    </div>
  );
}

export function Simulator({ rates }: { rates: SimulatorRates }) {
  const measured = useMemo(() => measuredHyp(rates), [rates]);
  // Le texte saisi est gardé tel quel (« 3, » en cours de frappe), les calculs lisent sa valeur.
  const [hypText, setHypText] = useState(() => toText(measured));
  const hyp = fromText(hypText);
  const [target, setTarget] = useState("10000");
  const [withBase, setWithBase] = useState(true);
  const [signups, setSignups] = useState("6000");
  const [channel, setChannel] = useState(ALL);
  const [months, setMonths] = useState(6);

  const channelRows = useMemo(() => {
    const byName = new Map(rates.channels.map((c) => [c.channel, c]));
    const names = [...CHANNEL_ORDER, ...rates.channels.map((c) => c.channel).filter((n) => !CHANNEL_ORDER.includes(n))];
    return names.map((name) => {
      const c = byName.get(name) ?? { channel: name, signups: 0, payers: 0, cents: 0 };
      const reliable = c.signups >= MIN_CHANNEL_SIGNUPS && c.payers > 0;
      return { ...c, reliable, conversion: reliable ? c.payers / c.signups : hyp.conversion };
    });
  }, [rates.channels, hyp.conversion]);

  // 1. Objectif → ce qu'il faut
  const targetCents = parse(target) * 100;
  const base = withBase ? rates.nextMonthRenewalsCents : 0;
  const plan = planFor(targetCents, base, {
    conversion: hyp.conversion || null,
    avgFirstPaymentCents: hyp.avgFirst || null,
    paywallRate: rates.paywallRate,
    checkoutRate: rates.checkoutRate,
    signupsPer1000Views: hyp.per1000,
  });

  // 2. Inscrits → argent
  const n = parse(signups);
  const selected = channelRows.find((c) => c.channel === channel);
  const conv = channel === ALL ? hyp.conversion : (selected?.conversion ?? hyp.conversion);
  const sim = simulate({ signups: n, conversion: conv, avgFirstPaymentCents: hyp.avgFirst, monthlyShare: hyp.monthlyShare, monthlyPriceCents: hyp.monthlyPrice, retention: hyp.retention, months });
  const maxMonth = Math.max(...sim.byMonth, 1);

  const hypField = (key: HypKey, label: string, hint: string) => (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 600 }}>
      {label}
      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input
          className="input"
          inputMode="decimal"
          value={hypText[key]}
          placeholder={KINDS[key] === "num" ? "ex. 2,5" : undefined}
          onChange={(e) => setHypText((t) => ({ ...t, [key]: e.target.value }))}
          style={{ width: 110 }}
        />
        <span style={{ color: "var(--color-neutral-600)" }}>{KINDS[key] === "pct" ? "%" : KINDS[key] === "eur" ? "€" : ""}</span>
      </span>
      <span style={{ fontSize: 11, fontWeight: 500, color: "var(--color-neutral-600)" }}>{hint}</span>
    </label>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="sim-grid">
        {/* 1. Objectif → inscrits */}
        <div className="cockpit-card">
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>🎯 Je veux encaisser…</h2>
          <label style={{ display: "block", marginTop: 10, fontSize: 12, fontWeight: 600, color: "var(--color-neutral-600)" }}>
            par mois
            <input className="sim-input" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Objectif par mois en euros" style={{ marginTop: 4 }} />
          </label>
          <div className="sim-chips" style={{ marginTop: 8 }}>
            {[3000, 5000, 10000, 20000, 50000].map((v) => (
              <button key={v} type="button" className={`sim-chip${parse(target) === v ? " is-active" : ""}`} onClick={() => setTarget(String(v))}>
                {v.toLocaleString("fr-FR")} €
              </button>
            ))}
          </div>
          <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10, fontSize: 12.5 }}>
            <input type="checkbox" checked={withBase} onChange={(e) => setWithBase(e.target.checked)} />
            Compter les renouvellements des abonnés actuels (≈ {eur(rates.nextMonthRenewalsCents)} le mois prochain)
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14, marginTop: 16 }}>
            <Big value={plan.signups === null ? "—" : num(plan.signups)} label="inscrits par mois" sub={plan.signups === null ? "conversion à renseigner" : `≈ ${num(plan.signups / 30)} par jour`} />
            <Big value={plan.payers === null ? "—" : num(plan.payers)} label="nouveaux payants par mois" sub={plan.payers === null ? undefined : `≈ ${num(plan.payers / 30)} par jour`} />
          </div>
          <div style={{ marginTop: 12 }}>
            <Row label="Nouveau chiffre à faire" value={eur(plan.newRevenueCents)} hint={withBase ? "objectif − renouvellements attendus" : undefined} />
            <Row label="Vues nécessaires" value={plan.views === null ? "—" : num(plan.views)} hint={hyp.per1000 ? `${hyp.per1000.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} inscrits pour 1 000 vues` : "renseigne « inscrits pour 1 000 vues » dans les hypothèses"} />
            <Row label="Voient le paywall" value={plan.paywallViews === null ? "—" : num(plan.paywallViews)} hint={rates.paywallRate !== null ? `${pctText(rates.paywallRate)} des inscrits (mesuré)` : undefined} />
            <Row label="Ouvrent le paiement" value={plan.checkouts === null ? "—" : num(plan.checkouts)} hint={rates.checkoutRate !== null ? `${pctText(rates.checkoutRate)} des inscrits (mesuré)` : undefined} />
          </div>
          <details style={{ marginTop: 10 }}>
            <summary style={{ fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Si tout venait d&apos;un seul canal</summary>
            <div className="cockpit-scroll" style={{ marginTop: 8 }}>
              <table className="cockpit-table">
                <thead>
                  <tr>
                    <th>Canal</th>
                    <th>Conversion</th>
                    <th>Inscrits / mois</th>
                    <th>Par jour</th>
                  </tr>
                </thead>
                <tbody>
                  {channelRows.map((c) => {
                    const need = c.conversion > 0 && plan.payers !== null ? Math.ceil(plan.payers / c.conversion) : null;
                    return (
                      <tr key={c.channel}>
                        <td style={{ fontWeight: 700 }}>
                          {c.channel} {!c.reliable && <span className="cockpit-pill is-warn">taux global</span>}
                        </td>
                        <td>{pctText(c.conversion)}</td>
                        <td>{need === null ? "—" : num(need)}</td>
                        <td>{need === null ? "—" : num(need / 30)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        </div>

        {/* 2. Inscrits → argent */}
        <div className="cockpit-card">
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>💸 Si je ramène…</h2>
          <label style={{ display: "block", marginTop: 10, fontSize: 12, fontWeight: 600, color: "var(--color-neutral-600)" }}>
            inscrits
            <input className="sim-input" inputMode="numeric" value={signups} onChange={(e) => setSignups(e.target.value)} aria-label="Nombre d'inscrits" style={{ marginTop: 4 }} />
          </label>
          <div className="sim-chips" style={{ marginTop: 8 }} role="radiogroup" aria-label="Canal">
            {[ALL, ...channelRows.map((c) => c.channel)].map((name) => (
              <button key={name} type="button" role="radio" aria-checked={channel === name} className={`sim-chip${channel === name ? " is-active" : ""}`} onClick={() => setChannel(name)}>
                {name}
              </button>
            ))}
          </div>
          {selected && !selected.reliable && channel !== ALL && (
            <p className="cockpit-pill is-warn" style={{ marginTop: 8 }}>
              {selected.channel} : {selected.signups} inscrit(s) et {selected.payers} payant(s) sur {rates.windowDays} jours, trop peu pour un taux fiable : taux global utilisé.
            </p>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14, marginTop: 16 }}>
            <Big value={eur(sim.byMonth[0] ?? 0)} label="le 1er mois" sub={`${num(sim.payers)} payants (${pctText(conv)})`} />
            <Big value={eur(sim.byMonth.slice(0, 3).reduce((a, b) => a + b, 0))} label="sur 3 mois" sub="avec les renouvellements" />
            <Big value={eur(sim.totalCents)} label={`sur ${months} mois`} sub={`${num(sim.monthlyPayers)} abonnés au départ`} />
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120, marginTop: 18 }} role="img" aria-label="Encaissé mois par mois">
            {sim.byMonth.map((v, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end" }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--color-neutral-700)" }}>{eur(v)}</span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(2, (v / maxMonth) * 80)}%` }}
                  transition={{ type: "spring", stiffness: 200, damping: 24, delay: i * 0.04 }}
                  style={{ width: "100%", borderRadius: "8px 8px 3px 3px", background: i === 0 ? "linear-gradient(180deg, #2fbf7f, #0f9c56)" : "linear-gradient(180deg, #8fd9b4, #4cc08a)" }}
                />
                <span style={{ fontSize: 10.5, color: "var(--color-neutral-600)" }}>M{i + 1}</span>
              </div>
            ))}
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, fontSize: 12.5 }}>
            Durée
            <input type="range" min={1} max={12} value={months} onChange={(e) => setMonths(Number(e.target.value))} className="sim-range" style={{ maxWidth: 220 }} />
            <b>{months} mois</b>
          </label>

          <div className="cockpit-scroll" style={{ marginTop: 12 }}>
            <table className="cockpit-table">
              <thead>
                <tr>
                  <th>{num(n)} inscrits de…</th>
                  <th>Conversion</th>
                  <th>Payants</th>
                  <th>1er mois</th>
                  <th>3 mois</th>
                </tr>
              </thead>
              <tbody>
                {channelRows.map((c) => {
                  const s = simulate({ signups: n, conversion: c.conversion, avgFirstPaymentCents: hyp.avgFirst, monthlyShare: hyp.monthlyShare, monthlyPriceCents: hyp.monthlyPrice, retention: hyp.retention, months: 3 });
                  return (
                    <tr key={c.channel} style={c.channel === channel ? { background: "#e3f4ea" } : undefined}>
                      <td style={{ fontWeight: 700 }}>
                        {c.channel} {!c.reliable && <span className="cockpit-pill is-warn">taux global</span>}
                      </td>
                      <td>{pctText(c.conversion)}</td>
                      <td>{num(s.payers)}</td>
                      <td>{eur(s.byMonth[0])}</td>
                      <td style={{ fontWeight: 700 }}>{eur(s.totalCents)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. Hypothèses */}
      <div className="cockpit-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>⚙️ Hypothèses</h2>
          <button type="button" className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => setHypText(toText(measured))}>
            Revenir aux chiffres mesurés
          </button>
        </div>
        <p style={{ fontSize: 12, color: "var(--color-neutral-600)", margin: "4px 0 12px" }}>
          Pré-remplies avec ce qui s&apos;est vraiment passé sur les {rates.windowDays} derniers jours ({num(rates.signups)} inscrits, {num(rates.payers)} payants). Change-les
          pour tester un scénario (meilleure conversion, prix différent…). Les canaux gardent leur propre conversion mesurée.
        </p>
        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))" }}>
          {hypField("conversion", "Conversion inscrit → payant", `mesuré : ${pctText(measured.conversion)}`)}
          {hypField("avgFirst", "Premier paiement moyen", `mesuré : ${eur(measured.avgFirst)}`)}
          {hypField("monthlyShare", "Part en abonnement mensuel", `mesuré : ${pctText(measured.monthlyShare)} (le reste : accès à vie)`)}
          {hypField("monthlyPrice", "Prix mensuel moyen", `mesuré : ${eur(measured.monthlyPrice)}`)}
          {hypField("retention", "Abonnés qui restent chaque mois", `mesuré : ${pctText(measured.retention)}`)}
          {hypField("per1000", "Inscrits pour 1 000 vues", measured.per1000 ? `mesuré (RPM) : ${measured.per1000.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}` : "pas de vues saisies dans RPM : à toi de le renseigner")}
        </div>
      </div>
    </div>
  );
}
