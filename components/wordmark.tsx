import { cn } from "@/lib/utils";

export function HearthMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("h-7 w-7", className)}>
      <defs>
        <linearGradient id="hearth-mark" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E1063A" />
          <stop offset="1" stopColor="#5B21E6" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#hearth-mark)" />
      <path d="M16 7 L24 14 V25 H8 V14 Z" fill="#FFFFFF" />
      <path d="M14 25 V18 H18 V25" fill="#5B21E6" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-2xl font-extrabold tracking-tight text-ink", className)}>
      <HearthMark />
      Hearth
    </span>
  );
}
