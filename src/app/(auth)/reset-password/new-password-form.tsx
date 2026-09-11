"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updatePassword, type AuthFormState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { FormMessage, Input, Label } from "@/components/ui/form";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" loading={pending}>
      {pending ? "Menyimpan…" : "Simpan Kata Sandi Baru"}
    </Button>
  );
}

export function NewPasswordForm() {
  const [state, action] = useActionState(
    async (_prev: AuthFormState, formData: FormData) => updatePassword(formData),
    {} as AuthFormState
  );
  return (
    <form action={action} className="space-y-4 rounded-none border-2 border-ink-950 bg-white p-6 shadow-[4px_4px_0_0_rgba(12,12,10,0.12)]">
      {state.error && <FormMessage variant="error">{state.error}</FormMessage>}
      {state.info && <FormMessage variant="info">{state.info}</FormMessage>}
      <div>
        <Label htmlFor="password">Kata Sandi Baru</Label>
        <Input id="password" name="password" type="password" required minLength={8} placeholder="Minimal 8 karakter" />
      </div>
      <SubmitButton />
    </form>
  );
}
