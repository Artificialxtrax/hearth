import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-2xl border border-line bg-white/80 px-4 py-3 text-base leading-6 text-ink outline-none placeholder:text-muted focus:border-ember focus:shadow-[0_0_0_4px_rgb(212_101_42_/_0.12)]",
        className,
      )}
      {...props}
    />
  );
}
