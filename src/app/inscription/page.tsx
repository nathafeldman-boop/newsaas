import { Suspense } from "react";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function InscriptionPage() {
  return (
    <div className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="text-xl font-bold text-brand-dark">
          Alt
        </Link>
        <h1 className="mt-6 text-2xl font-bold">Crée ton compte</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Deux minutes, puis on te montre des offres qui matchent.
        </p>
        <div className="mt-6">
          <Suspense>
            <RegisterForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
