import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="text-xl font-bold text-brand-dark">
          Alt
        </Link>
        <h1 className="mt-6 text-2xl font-bold">Content de te revoir</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Connecte-toi pour continuer à swiper.
        </p>
        <div className="mt-6">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
