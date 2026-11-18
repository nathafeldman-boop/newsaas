import { redirect } from "next/navigation";

// Ancienne page des stages scolaires (18/11) : tout passe maintenant par
// l'onboarding de base et le swipe (paquet de stages scolaires, paywall).
export default function Page() {
  redirect("/swipe");
}
