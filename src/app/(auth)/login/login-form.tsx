"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginUser, type AuthFormState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { FieldError, FormMessage, Input, Label } from "@/components/ui/form";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" loading={pending}>
      {pending ? "Memproses…" : "Masuk"}
    </Button>
  );
}

export function LoginForm() {
  const [state, action] = useActionState(
    async (_prev: AuthFormState, formData: FormData) => loginUser(formData),
    {} as AuthFormState
  );
  const next = useSearchParams().get("next") ?? "";

  return (
    <form action={action} className="space-y-4 rounded-none border-2 border-ink-950 bg-white p-6 shadow-[4px_4px_0_0_rgba(12,12,10,0.12)]">
      <input type="hidden" name="next" value={next} />
      {state.error && <FormMessage variant="error">{state.error}</FormMessage>}
      {state.info && <FormMessage variant="info">{state.info}</FormMessage>}

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="nama@kampus.ac.id" />
        <FieldError />
      </div>
      <div>
        <Label htmlFor="password">Kata Sandi</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required placeholder="••••••••" />
        <FieldError />
      </div>

      <div className="flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="font-medium text-brand-600 hover:underline">
          Lupa kata sandi?
        </Link>
      </div>

      <SubmitButton />
      <p className="text-center text-sm text-ink-500">
        Belum punya akun?{" "}
        <Link href="/register" className="font-semibold text-brand-600 hover:underline">
          Daftar sekarang
        </Link>
      </p>
    </form>
  );
}
