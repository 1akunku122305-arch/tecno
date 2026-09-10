"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ensureMentorProfile } from "@/services/mentor-onboarding.service";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/badge";
import { FormMessage } from "@/components/ui/form";
import { UserRoundPlus } from "lucide-react";

/**
 * Shown when Supabase IS connected but the signed-in mentor account has no
 * mentor_profiles row yet (e.g. the role was granted via raw SQL, or the
 * account registered before the migration ran). One click creates the row,
 * then the full profile editor appears after refresh.
 */
export function MissingMentorProfile() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function create() {
    setError("");
    startTransition(async () => {
      const res = await ensureMentorProfile();
      if (!res.ok) {
        setError(res.error ?? "Gagal membuat profil mentor.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <EmptyState
        icon={<UserRoundPlus className="h-10 w-10" aria-hidden />}
        title="Profil mentor belum dibuat."
        description="Akun ini ber-role mentor, tapi data profil mentornya belum ada di database. Buat sekarang, lalu lengkapi profil dan harga sebelum mengajukan verifikasi."
        action={
          <Button type="button" onClick={create} loading={pending}>
            {pending ? "Membuat…" : "Buat Profil Mentor"}
          </Button>
        }
      />
      {error && <FormMessage variant="error">{error}</FormMessage>}
    </div>
  );
}
