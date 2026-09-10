// ---------------------------------------------------------------------------
// Small shared helpers (pure functions, no side effects)
// ---------------------------------------------------------------------------

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** "19:00:00" -> "19:00" */
export function timeHM(time: string | null | undefined): string {
  if (!time) return "";
  return time.slice(0, 5);
}

export function durationLabel(minutes: number): string {
  return `${minutes} menit`;
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export const DAY_NAMES = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
] as const;

export function dayName(dayOfWeek: number): string {
  return DAY_NAMES[dayOfWeek] ?? "-";
}

/**
 * Today's date in YYYY-MM-DD using the app's fixed timezone (Asia/Jakarta).
 * The app targets Indonesian users and stores naive date/time values, so we
 * deliberately do NOT rely on the server's local timezone (Vercel = UTC).
 */
export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Given day_of_week (0-6) return the next upcoming date >= today */
export function nextDateForDayOfWeek(dayOfWeek: number, from = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + ((dayOfWeek - d.getDay() + 7) % 7));
  return d.toISOString().slice(0, 10);
}

export function initials(name: string | null | undefined): string {
  if (!name) return "M";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "M";
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Map PostgREST/Postgres error codes to friendly Indonesian messages.
 * 42501  = row-level security policy violation (missing permission)
 * PGRST116 = "no rows returned" (e.g. an update/delete matched nothing,
 *            typically because RLS hid the row from the current user)
 */
export function friendlyDbError(
  error: { code?: string; message: string },
  fallback: string
): Error {
  if (error.code === "42501")
    return new Error("Aksi ditolak: kamu tidak memiliki izin untuk data ini.");
  if (error.code === "PGRST116") return new Error(fallback);
  return new Error(error.message);
}

/** Indonesian status labels */
export const BOOKING_STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu",
  confirmed: "Dikonfirmasi",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
  completed: "Selesai",
};

export const MENTOR_STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu Verifikasi",
  approved: "Terverifikasi",
  rejected: "Ditolak",
};

export const DAY_LABELS_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
