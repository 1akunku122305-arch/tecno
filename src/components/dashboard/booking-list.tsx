import Link from "next/link";
import type { BookingWithDetails } from "@/types";
import { Avatar } from "@/components/avatar";
import { Badge, EmptyState } from "@/components/ui/badge";
import { BOOKING_STATUS_LABEL, formatPrice, timeHM } from "@/lib/utils";
import { Check, X } from "lucide-react";

const statusTone = (s: string) =>
  s === "confirmed"
    ? "green"
    : s === "completed"
      ? "brand"
      : s === "pending"
        ? "amber"
        : s === "rejected" || s === "cancelled"
          ? "red"
          : "gray";

export function BookingList({
  bookings,
  emptyTitle = "Belum ada booking.",
  emptyDescription,
  mentorActions = false,
  onAccept,
  onReject,
  pending,
}: {
  bookings: BookingWithDetails[];
  emptyTitle?: string;
  emptyDescription?: string;
  mentorActions?: boolean;
  onAccept?: (bookingId: string) => void;
  onReject?: (bookingId: string) => void;
  pending?: boolean;
}) {
  if (bookings.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <ul className="space-y-3">
      {bookings.map((b) => (
        <li
          key={b.id}
          className="flex flex-col gap-3 rounded-none border border-ink-200/80 bg-white p-4 sm:flex-row sm:items-center"
        >
          {b.mentor ? (
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar src={b.mentor.avatar_url} name={b.mentor.full_name} size={42} />
              <div className="min-w-0">
                <Link
                  href={`/mentors/${b.mentor.mentor_id}`}
                  className="block truncate text-sm font-bold text-ink-950 hover:text-brand-700"
                >
                  {b.mentor.full_name ?? "Mentor"}
                </Link>
                <p className="truncate text-xs text-ink-500">
                  {b.subject?.name} · {b.topic}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 text-sm text-ink-500">
              {b.subject?.name} · {b.topic}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-ink-600">
            <span>{b.date}</span>
            <span>·</span>
            <span>
              {timeHM(b.start_time)}–{timeHM(b.end_time)} ({b.duration_minutes} mnt)
            </span>
            <span>·</span>
            <span className="font-semibold">{formatPrice(b.price)}</span>
          </div>

          <div className="flex items-center gap-2">
            <Badge tone={statusTone(b.status) as "gray"}>{BOOKING_STATUS_LABEL[b.status]}</Badge>
            {b.status === "pending" && mentorActions && (
              <>
                <button
                  onClick={() => onAccept?.(b.id)}
                  disabled={pending}
                  className="inline-flex h-8 items-center gap-1 rounded-none bg-ink-600 px-3 text-xs font-semibold text-white hover:bg-ink-700 disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" aria-hidden /> Terima
                </button>
                <button
                  onClick={() => onReject?.(b.id)}
                  disabled={pending}
                  className="inline-flex h-8 items-center gap-1 rounded-none border border-ink-200 px-3 text-xs font-semibold text-ink-600 hover:bg-ink-50 disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" aria-hidden /> Tolak
                </button>
              </>
            )}
            {(b.status === "confirmed" ||
              b.status === "pending" ||
              b.status === "completed") && (
              <Link
                href={`/student/bookings/${b.id}`}
                className="text-xs font-semibold text-brand-600 hover:underline"
              >
                Detail
              </Link>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
