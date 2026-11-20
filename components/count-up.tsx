"use client";

import { useEffect, useState } from "react";
import { formatMoney, formatRate } from "@/lib/format";

type Kind = "money" | "rate" | "count";

export function CountUp({ value, kind }: { value: number; kind: Kind }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 720;
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setShown(value * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  if (kind === "money") return <>{formatMoney(shown)}</>;
  if (kind === "rate") return <>{formatRate(shown)}</>;
  return <>{Math.round(shown).toLocaleString("en-US")}</>;
}
