import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, CircleAlert, Info, Loader2, XCircle } from "lucide-react";

const tones = {
  gray: "bg-ink-100 text-ink-900",
  brand: "bg-ink-950 text-white",
  green: "bg-white text-ink-950 border border-ink-950",
  amber: "bg-white text-ink-950 border border-ink-950",
  red: "bg-ink-950 text-white",
} as const;

export function Badge({
  tone = "gray",
  className,
  children,
}: {
  tone?: keyof typeof tones;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-none px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Spinner({ label = "Memuat…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-ink-500" role="status">
      <Loader2 className="h-5 w-5 animate-spin text-ink-950" aria-hidden />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-none border border-dashed border-ink-400 bg-ink-50/50 px-6 py-12 text-center",
        className
      )}
    >
      {icon && <div className="mb-3 text-ink-500">{icon}</div>}
      <h3 className="text-base font-bold uppercase tracking-wide text-ink-950">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-600">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Alert({
  tone,
  title,
  children,
}: {
  tone: "error" | "success" | "info";
  title?: string;
  children?: ReactNode;
}) {
  const Icon =
    tone === "error" ? XCircle : tone === "success" ? CheckCircle2 : Info;
  const cls =
    tone === "error"
      ? "border-ink-950 bg-white text-ink-950"
      : tone === "success"
        ? "border-ink-950 bg-white text-ink-950"
        : "border-ink-950 bg-ink-50 text-ink-950";
  return (
    <div role="alert" className={cn("flex items-start gap-2.5 rounded-none border px-4 py-3 text-sm font-medium", cls)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="mt-0.5 font-normal">{children}</div>}
      </div>
    </div>
  );
}
