import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Lupa Kata Sandi" };

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <Logo className="mb-4 justify-center" />
        <h1 className="text-2xl font-bold text-ink-950">Reset kata sandi</h1>
        <p className="mt-1 text-sm text-ink-500">
          Masukkan email kamu dan kami akan mengirim tautan reset.
        </p>
      </div>
      <ResetForm />
    </div>
  );
}
