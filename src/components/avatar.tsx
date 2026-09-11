"use client";

import Image from "next/image";
import { useState } from "react";
import { cn, initials } from "@/lib/utils";

/**
 * Avatar with graceful fallback — works with remote Supabase storage URLs
 * and never breaks the layout if the image fails.
 */
export function Avatar({
  src,
  name,
  size = 40,
  className,
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-none border border-ink-900 bg-ink-100 font-bold text-ink-950",
        className
      )}
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.38) }}
      aria-label={name ?? "Pengguna"}
    >
      {showImage ? (
        <Image
          src={src}
          alt={name ?? "Foto profil"}
          fill
          sizes={`${size}px`}
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}
