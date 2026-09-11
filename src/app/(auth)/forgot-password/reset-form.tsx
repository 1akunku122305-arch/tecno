"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { forgotPassword, type AuthFormState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { FormMessage, Input, Label } from "@/components/ui/form";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" loading={pending}>
      {pending ? "Mengirim…" : "Kirim Tautan Reset"}
    </Button>
  );
}

export function ResetForm() {
  const [state, action] = useActionState(
    async (_prev: AuthFormState, formData: FormData) => forgotPassword(formData),
    {} as AuthFormState
  );
  return (
    <form action={action} className="space-y-4 rounded-none border-2 border-ink-950 bg-white p-6 shadow-[4px_4px_0_0_rgba(12,12,10,0.12)]">
      {state.error && <FormMessage variant="error">{state.error}</FormMessage>}
      {state.info && <FormMessage variant="info">{state.info}</FormMessage>}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required placeholder="nama@kampus.ac.id" />
      </div>
      <SubmitButton />
      <p className="text-center text-sm text-ink-500">
        Ingat kata sandimu?{" "}
        <Link href="/login" className="font-semibold text-brand-600 hover:underline">
          Login
        </Link>
      </p>
    </form>
  );
}
