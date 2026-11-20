import { bidStatusLabel, perilLabel, requestStatusLabel } from "@/lib/format";
import type { BidDisplayStatus, Peril, RequestStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function DemoChip({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-white/70 px-2 py-0.5 font-mono text-[10px] tracking-[0.14em] uppercase",
        className,
      )}
    >
      Demo
    </span>
  );
}

export function PerilChip({ peril }: { peril: Peril }) {
  return (
    <span className="inline-flex items-center rounded-full bg-ink px-2.5 py-0.5 font-mono text-[10px] tracking-[0.14em] text-paper uppercase">
      {perilLabel(peril)}
    </span>
  );
}

export function StatusChip({ status }: { status: RequestStatus }) {
  return (
    <span className="inline-flex items-center rounded-full bg-paper-2 px-2.5 py-0.5 text-xs text-ink-soft">
      {requestStatusLabel(status)}
    </span>
  );
}

export function BidChip({ status }: { status: BidDisplayStatus }) {
  return (
    <span className="inline-flex items-center rounded-full bg-white/80 px-2.5 py-0.5 font-mono text-[10px] tracking-wide text-ink-soft uppercase">
      {bidStatusLabel(status)}
    </span>
  );
}
