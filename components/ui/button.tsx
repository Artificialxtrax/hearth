"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold transition duration-200 hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 disabled:hover:translate-y-0",
  {
    variants: {
      variant: {
        default: "bg-ink text-white hover:bg-bolt",
        ember: "punch border-0 hover:text-white",
        outline: "border-2 border-ink bg-white text-ink hover:bg-ink hover:text-white",
        ghost: "bg-transparent text-ink hover:bg-paper-2",
        danger: "border-[3px] border-danger bg-white text-danger hover:bg-danger hover:text-white",
      },
      size: {
        sm: "h-9 px-3.5",
        default: "h-11 px-5",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  type,
  ...props
}: ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} type={asChild ? type : (type ?? "button")} {...props} />;
}
