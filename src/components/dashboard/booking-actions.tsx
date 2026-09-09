"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  acceptBookingAction,
  cancelBookingAction,
  rejectBookingAction,
} from "@/services/booking-actions";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form";

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function cancel() {
    if (!confirm("Batalkan booking ini?")) return;
    setError("");
    startTransition(async () => {
      const res = await cancelBookingAction(bookingId);
      if (!res.ok) setError(res.error ?? "Gagal membatalkan booking.");
      else router.refresh();
    });
  }

  return (
    <div>
      {error && <FormMessage variant="error">{error}</FormMessage>}
      <Button variant="outline" size="sm" onClick={cancel} loading={pending}>
        Batalkan Booking
      </Button>
    </div>
  );
}

export function AcceptRejectButtons({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function act(action: "accept" | "reject") {
    setError("");
    startTransition(async () => {
      const fn = action === "accept" ? acceptBookingAction : rejectBookingAction;
      const res = await fn(bookingId);
      if (!res.ok) setError(res.error ?? "Gagal memperbarui booking.");
      else router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      {error && <FormMessage variant="error">{error}</FormMessage>}
      <div className="flex gap-2">
        <Button variant="success" size="sm" onClick={() => act("accept")} loading={pending}>
          Terima
        </Button>
        <Button variant="outline" size="sm" onClick={() => act("reject")} disabled={pending}>
          Tolak
        </Button>
      </div>
    </div>
  );
}
