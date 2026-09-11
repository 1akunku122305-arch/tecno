"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  approveMentorAction,
  rejectMentorAction,
  resetMentorStatusAction,
} from "@/services/admin-actions";

export function MentorStatusButtons({
  mentorId,
  status,
}: {
  mentorId: string;
  status: "pending" | "approved" | "rejected";
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function act(action: "approve" | "reject" | "reset") {
    setError("");
    startTransition(async () => {
      const res =
        action === "approve"
          ? await approveMentorAction(mentorId)
          : action === "reject"
            ? await rejectMentorAction(mentorId)
            : await resetMentorStatusAction(mentorId, "pending");
      if (!res.ok) setError(res.error ?? "Gagal memperbarui status.");
      else router.refresh();
    });
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button
        onClick={() => act("approve")}
        disabled={pending}
        className="rounded-none bg-ink-600 px-4 py-2 text-xs font-bold text-white hover:bg-ink-700 disabled:opacity-50"
      >
        ✓ Approve
      </button>
      {status === "rejected" ? (
        <button
          onClick={() => act("reset")}
          disabled={pending}
          className="rounded-none border border-ink-200 px-4 py-2 text-xs font-bold text-ink-600 hover:bg-ink-50 disabled:opacity-50"
        >
          Kembalikan ke Pending
        </button>
      ) : (
        <button
          onClick={() => act("reject")}
          disabled={pending}
          className="rounded-none border border-ink-200 px-4 py-2 text-xs font-bold text-ink-600 hover:bg-ink-50 disabled:opacity-50"
        >
          ✕ Tolak
        </button>
      )}
      {error && <p className="self-center text-xs text-ink-600">{error}</p>}
    </div>
  );
}
