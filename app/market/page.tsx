import { Suspense } from "react";
import { MarketBoard } from "@/components/market-board";
import { load } from "@/lib/load";
import { getMarket } from "@/lib/queries";

export const metadata = { title: "Market" };

export default function MarketPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="hero-pop max-w-3xl rounded-[2rem] px-6 py-8 text-white md:px-10 md:py-10">
        <p className="text-sm font-extrabold text-white/85">The live board</p>
        <h1 className="mt-2 font-display text-4xl leading-tight md:text-6xl">Premiums, neighborhood by neighborhood</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-white/95">
          Each tile is a ZIP asking for wildfire cover. The big number is the best premium divided by coverage. Demo
          rows are labeled, so a sample never looks like a real quote.
        </p>
      </header>
      <div className="mt-8 flex flex-wrap gap-2 text-xs">
        <Legend swatch="bg-bolt" label="Under 1.6%" />
        <Legend swatch="bg-ink" label="1.6–2.3%" />
        <Legend swatch="bg-ember" label="2.3–3.0%" />
        <Legend swatch="hero-pop" label="3.0% and up" />
      </div>
      <div className="mt-8">
        <Suspense fallback={<p className="text-sm text-muted">Pricing the board…</p>}>
          <Board />
        </Suspense>
      </div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 shadow-sm">
      <span className={`h-4 w-4 ${swatch}`} />
      {label}
    </span>
  );
}

async function Board() {
  const loaded = await load(() => getMarket());
  if (!loaded.ok) {
    return (
      <p role="alert" className="border border-danger px-4 py-6 text-sm text-danger">
        The desk can&apos;t reach the book right now.
      </p>
    );
  }
  const market = loaded.value;
  return <MarketBoard rows={market.rows} demoCount={market.demoCount} postedCount={market.postedCount} />;
}
