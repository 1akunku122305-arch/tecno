import * as React from "react";
import { cn } from "@/lib/utils";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-bold uppercase tracking-wide text-ink-950", className)}
      {...props}
    />
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-none border border-ink-900 bg-white px-3.5 text-sm text-ink-950",
        "placeholder:text-ink-400 hover:border-ink-950 focus:border-ink-950 focus:outline-none",
        "focus:ring-2 focus:ring-ink-950/20 disabled:bg-ink-100 disabled:text-ink-500",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-none border border-ink-900 bg-white px-3.5 py-2.5 text-sm text-ink-950",
        "placeholder:text-ink-400 hover:border-ink-950 focus:border-ink-950 focus:outline-none",
        "focus:ring-2 focus:ring-ink-950/20 disabled:bg-ink-100 disabled:text-ink-500",
        "min-h-[96px]",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 w-full appearance-none rounded-none border border-ink-900 bg-white px-3.5 pr-9 text-sm text-ink-950",
        "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%231a1916%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0.75rem_center] bg-no-repeat",
        "hover:border-ink-950 focus:border-ink-950 focus:outline-none focus:ring-2 focus:ring-ink-950/20",
        "disabled:bg-ink-100 disabled:text-ink-500",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1.5 text-xs font-medium text-ink-600">
      {message}
    </p>
  );
}

export function FormMessage({
  variant,
  children,
}: {
  variant: "error" | "success" | "info";
  children: React.ReactNode;
}) {
  const styles = {
    error: "border-ink-950 bg-white text-ink-950",
    success: "border-ink-950 bg-white text-ink-950",
    info: "border-ink-950 bg-ink-50 text-ink-950",
  } as const;
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn("rounded-none border px-4 py-3 text-sm font-medium", styles[variant])}
    >
      {children}
    </div>
  );
}
