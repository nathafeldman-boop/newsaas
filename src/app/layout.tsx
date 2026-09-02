import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  weight: "600",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
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
    images: ["/team-photo.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/team-photo.jpg"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${poppins.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-text">
        {children}
      </body>
    </html>
  );
}
