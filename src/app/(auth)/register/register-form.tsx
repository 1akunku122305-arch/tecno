"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { registerUser, type AuthFormState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { FormMessage, Input, Label } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { GraduationCap, Sparkles } from "lucide-react";
import { useState } from "react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" loading={pending}>
      {pending ? "Mendaftarkan…" : "Daftar"}
    </Button>
  );
}

export function RegisterForm() {
  const [state, action] = useActionState(
    async (_prev: AuthFormState, formData: FormData) => registerUser(formData),
    {} as AuthFormState
  );
  // Preselect the role from ?role=mentor (landing "Jadi Mentor" CTA).
  const searchParams = useSearchParams();
  const [role, setRole] = useState<"student" | "mentor">(
    searchParams.get("role") === "mentor" ? "mentor" : "student"
  );

  return (
    <form action={action} className="space-y-4 rounded-none border-2 border-ink-950 bg-white p-6 shadow-[4px_4px_0_0_rgba(12,12,10,0.12)]">
      {state.error && <FormMessage variant="error">{state.error}</FormMessage>}
      {state.info && <FormMessage variant="info">{state.info}</FormMessage>}

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink-800">Daftar sebagai</legend>
        <div className="grid grid-cols-2 gap-3">
          <label
            className={cn(
              "flex cursor-pointer flex-col items-center gap-1 rounded-none border-2 p-3 text-center transition-colors",
              role === "student" ? "border-brand-500 bg-brand-50" : "border-ink-200 hover:border-ink-300"
            )}
          >
            <input
              type="radio"
              name="role"
              value="student"
              checked={role === "student"}
              onChange={() => setRole("student")}
              className="sr-only"
            />
            <GraduationCap className="h-6 w-6 text-brand-600" aria-hidden />
            <span className="text-sm font-semibold text-ink-900">Mahasiswa</span>
            <span className="text-xs text-ink-500">Saya mencari mentor</span>
          </label>
          <label
            className={cn(
              "flex cursor-pointer flex-col items-center gap-1 rounded-none border-2 p-3 text-center transition-colors",
              role === "mentor" ? "border-brand-500 bg-brand-50" : "border-ink-200 hover:border-ink-300"
            )}
          >
            <input
              type="radio"
              name="role"
              value="mentor"
              checked={role === "mentor"}
              onChange={() => setRole("mentor")}
              className="sr-only"
            />
            <Sparkles className="h-6 w-6 text-brand-600" aria-hidden />
            <span className="text-sm font-semibold text-ink-900">Mentor</span>
            <span className="text-xs text-ink-500">Saya ingin membantu</span>
          </label>
        </div>
      </fieldset>

      <div>
        <Label htmlFor="fullName">Nama Lengkap</Label>
        <Input id="fullName" name="fullName" required minLength={2} placeholder="Nama lengkap kamu" />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" placeholder="nama@kampus.ac.id" />
      </div>
      <div>
        <Label htmlFor="password">Kata Sandi</Label>
        <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="Minimal 8 karakter" />
      </div>

      <SubmitButton />
      <p className="text-center text-xs leading-relaxed text-ink-400">
        Dengan mendaftar kamu menyetujui bahwa data hanya digunakan untuk layanan Mentora.
      </p>
    </form>
  );
}
