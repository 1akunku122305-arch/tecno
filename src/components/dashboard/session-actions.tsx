"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeSessionAction, startSessionAction } from "@/services/booking-actions";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form";

export function SessionActions({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function start() {
    setError("");
    startTransition(async () => {
      const res = await startSessionAction(bookingId);
      if (!res.ok) setError(res.error ?? "Gagal memulai sesi.");
      else router.refresh();
    });
  }

  function complete() {
    setError("");
    startTransition(async () => {
      const res = await completeSessionAction(bookingId);
      if (!res.ok) setError(res.error ?? "Gagal menyelesaikan sesi.");
      else router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      {error && <FormMessage variant="error">{error}</FormMessage>}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={start} loading={pending}>
          Mulai Sesi
        </Button>
        <Button size="sm" variant="success" onClick={complete} loading={pending}>
          Selesaikan Sesi
        </Button>
      </div>
    </div>
  );
}
