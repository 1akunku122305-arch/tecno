import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { NewPasswordForm } from "./new-password-form";

export const metadata: Metadata = { title: "Kata Sandi Baru" };

export default function ResetPasswordPage() {
  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <Logo className="mb-4 justify-center" />
        <h1 className="text-2xl font-bold text-ink-950">Atur kata sandi baru</h1>
        <p className="mt-1 text-sm text-ink-500">Buat kata sandi baru untuk akun kamu.</p>
      </div>
      <NewPasswordForm />
    </div>
  );
}
