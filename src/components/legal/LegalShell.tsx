import Link from "next/link";

const LEGAL_NAV = [
  { href: "/legal/mentions-legales", label: "Mentions légales" },
  { href: "/legal/cgu", label: "CGU" },
  { href: "/legal/cgv", label: "CGV" },
  { href: "/legal/confidentialite", label: "Confidentialité" },
];

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 style={{ fontSize: 18, margin: 0 }}>{title}</h2>
      <div
        style={{
          marginTop: 8,
          fontSize: 14,
          lineHeight: 1.7,
          color: "color-mix(in srgb, var(--color-text) 85%, transparent)",
        }}
      >
        {children}
      </div>
    </section>
  );
}

// Bloc bien visible pour toute info qu'on ne peut pas inventer (SIRET,
// forme juridique, médiateur...) : mieux vaut un placeholder franc qu'une
// mention légale inexacte, ce qui serait pire que rien.
export function ToComplete({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        marginTop: 8,
        padding: "10px 14px",
        borderRadius: 10,
        background: "color-mix(in srgb, var(--color-accent-2) 14%, transparent)",
        border: "1px dashed var(--color-accent-2)",
        fontSize: 13,
      }}
    >
      ⚠️ À compléter : {children}
    </div>
  );
}

export function LegalShell({
  tag,
  title,
  updated,
  children,
}: {
  tag: string;
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1">
      <nav className="nav mx-auto max-w-[1200px]">
        <Link href="/" className="nav-brand" style={{ textDecoration: "none", color: "inherit" }}>
          Stageio
        </Link>
      </nav>

      <div className="mx-auto max-w-[720px] px-5 py-10 sm:px-9">
        <div className="flex flex-wrap gap-3" style={{ marginBottom: 4 }}>
          {LEGAL_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                fontSize: 12.5,
                color: "color-mix(in srgb, var(--color-text) 60%, transparent)",
                textDecoration: "underline",
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <span className="tag tag-accent" style={{ marginTop: 16 }}>
          {tag}
        </span>
        <h1 style={{ fontSize: 32, margin: "16px 0 0" }}>{title}</h1>
        <p
          style={{
            fontSize: 13,
            color: "color-mix(in srgb, var(--color-text) 55%, transparent)",
            margin: "6px 0 0",
          }}
        >
          Dernière mise à jour : {updated}
        </p>

        {children}
      </div>
    </div>
  );
}
