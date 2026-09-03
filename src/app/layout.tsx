import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

// Même famille pour titres et corps (Plus Jakarta Sans), mais deux
// instances à poids fixe distinct plutôt qu'une police variable : ~50
// endroits dans l'app appliquent `fontFamily: var(--font-heading)` en
// inline sans jamais déclarer de font-weight, en comptant sur le fait
// qu'un seul poids est chargé pour que le navigateur l'utilise quel que
// soit le poids hérité/par défaut (400). Une police variable casserait
// silencieusement ce rendu sur tous ces endroits.
const jakartaHeading = Plus_Jakarta_Sans({
  variable: "--font-jakarta-heading",
  weight: "700",
  subsets: ["latin"],
});

const jakartaBody = Plus_Jakarta_Sans({
  variable: "--font-jakarta-body",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Stageio — trouve ton alternance ou ton stage",
    template: "%s | Stageio",
  },
  description:
    "Swipe les offres d'alternance et de stage qui te correspondent, postule en un geste.",
  openGraph: {
    siteName: "Stageio",
    type: "website",
    locale: "fr_FR",
    images: ["/og-image.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${jakartaHeading.variable} ${jakartaBody.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-text">
        {children}
      </body>
    </html>
  );
}
