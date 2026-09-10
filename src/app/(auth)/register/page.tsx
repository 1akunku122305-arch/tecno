import type { Metadata } from "next";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Daftar" };

export default function RegisterPage() {
  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <Logo className="mb-4 justify-center" />
        <h1 className="text-2xl font-bold text-ink-950">Buat akun Mentora</h1>
        <p className="mt-1 text-sm text-ink-500">Pilih peranmu dan mulai perjalanan akademikmu.</p>
      </div>
      {/* Suspense required because RegisterForm reads ?role=mentor via useSearchParams */}
      <Suspense>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
