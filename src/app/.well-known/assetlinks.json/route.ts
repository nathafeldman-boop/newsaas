// Digital Asset Links : prouve à Android que l'appli Play Store (paquet TWA
// généré par PWABuilder, voir docs/referencement-partout.md) appartient bien
// à www.stageio.fr, pour qu'elle s'ouvre en plein écran sans barre
// d'adresse. Rien à publier tant que l'appli n'existe pas : liste vide.
// Nathan renseigne dans Vercel ANDROID_PACKAGE_NAME (ex. fr.stageio.app) et
// ANDROID_SHA256_FINGERPRINTS (empreinte(s) SHA-256 de la clé de signature,
// séparées par des virgules), données par PWABuilder / la Play Console.

export const dynamic = "force-dynamic";

export function GET() {
  const packageName = process.env.ANDROID_PACKAGE_NAME?.trim();
  const fingerprints = (process.env.ANDROID_SHA256_FINGERPRINTS ?? "")
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);
  const statements =
    packageName && fingerprints.length > 0
      ? [
          {
            relation: ["delegate_permission/common.handle_all_urls"],
            target: { namespace: "android_app", package_name: packageName, sha256_cert_fingerprints: fingerprints },
          },
        ]
      : [];
  return Response.json(statements, { headers: { "Cache-Control": "public, max-age=3600" } });
}
