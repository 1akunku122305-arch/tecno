"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setUserRoleAction } from "@/services/admin-actions";
import type { UserRole } from "@/types";

export function UserRoleSelect({ userId, role }: { userId: string; role: UserRole }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function change(e: React.ChangeEvent<HTMLSelectElement>) {
    if (role === "admin") {
      setError("Role admin tidak dapat diubah dari UI.");
      return;
    }
    setError("");
    startTransition(async () => {
      const res = await setUserRoleAction(userId, e.target.value as UserRole);
      if (!res.ok) setError(res.error ?? "Gagal mengubah peran.");
      else router.refresh();
    });
  }

  return (
    <div>
      <select
        value={role}
        onChange={change}
        disabled={role === "admin" || pending}
        className="rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink-800 disabled:opacity-60"
      >
        <option value="student">Mahasiswa</option>
        <option value="mentor">Mentor</option>
      </select>
      {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
