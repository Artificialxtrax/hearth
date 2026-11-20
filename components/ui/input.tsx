import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-2xl border border-line bg-white/80 px-4 text-base text-ink outline-none placeholder:text-muted focus:border-ember focus:shadow-[0_0_0_4px_rgb(212_101_42_/_0.12)]",
        className,
      )}
      {...props}
    />
  );
}
