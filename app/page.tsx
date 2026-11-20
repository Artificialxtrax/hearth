import Link from "next/link";
import { Suspense } from "react";
import { DemoChip, PerilChip } from "@/components/chips";
import { MarketBoard } from "@/components/market-board";
import { Button } from "@/components/ui/button";
import { bookStats } from "@/lib/book";
import { formatMoney, formatRate, perilLabel } from "@/lib/format";
import { load } from "@/lib/load";
import { getFeaturedRequest, getMarket } from "@/lib/queries";
import type { CoverageRequest } from "@/lib/types";

const steps = [
  {
    n: "01",
    title: "Tell us about the house",
    body: "Share the city, the ZIP, how much coverage you need, and the peril you are worried about. A photo helps, and it is optional.",
  },
  {
    n: "02",
    title: "Underwriters compete on price",
    body: "People who would cover the risk name the annual premium they would charge, in the open, with terms you can read.",
  },
  {
    n: "03",
    title: "See a fair premium",
    body: "The best price, the spread, and the implied rate (premium divided by coverage) sit on one page. You choose. Nothing is bound here.",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="hero-pop rise mt-4 grid items-center gap-8 rounded-[2rem] px-6 py-10 md:px-12 md:py-14 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-sm font-extrabold tracking-wide text-white/90">Prices, out loud</p>
          <h1 className="mt-3 max-w-xl text-5xl leading-[0.95] text-white md:text-7xl">
            Your home. A fair price.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-white/95">
            Post the risk. Underwriters compete on the yearly premium. You see the best price in the open, before anyone
            calls it a policy.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" variant="outline" className="border-white bg-white text-ink hover:bg-ink hover:text-white">
              <Link href="/requests/new">Post a risk</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white bg-transparent text-white hover:bg-white hover:text-ink">
              <Link href="/market">See the market</Link>
            </Button>
          </div>
          <p className="mt-6 max-w-xl text-sm leading-6 text-white/85">
            Try both sides with a sample sign-in. Demo prices are labeled so they never pretend to be real quotes.{" "}
            <Link href="/quotes" className="font-extrabold underline underline-offset-4">
              Get my quotes
            </Link>
          </p>
        </div>
        <Suspense fallback={<SlipSkeleton />}>
          <HeroSlip />
        </Suspense>
      </section>

      <section className="py-16">
        <h2 className="font-display text-4xl text-ink md:text-5xl">How it works</h2>
        <p className="mt-3 max-w-2xl text-ink-soft">Three steps. The price stays visible the whole way.</p>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.n} className="soft-card lift rise p-6" style={{ animationDelay: `${index * 80}ms` }}>
              <span className="font-mono text-sm text-ember-deep">{step.n}</span>
              <h3 className="mt-3 font-display text-3xl">{step.title}</h3>
              <p className="mt-2 text-base leading-7 text-ink-soft">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="py-6 pb-16">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-4xl text-ink md:text-5xl">Where the price runs hot</h2>
            <p className="mt-2 max-w-xl text-ink-soft">Neighborhoods asking for wildfire cover. A higher rate means a pricier premium.</p>
          </div>
          <Link href="/market" className="text-sm font-semibold text-ember-deep underline decoration-ember/40 underline-offset-4">
            Open the full market
          </Link>
        </div>
        <Suspense fallback={<p className="text-sm text-muted">Loading the desk…</p>}>
          <MarketPreview />
        </Suspense>
      </section>
    </div>
  );
}

async function HeroSlip() {
  const loaded = await load(() => getFeaturedRequest());
  if (!loaded.ok || !loaded.value) return <SlipSkeleton empty />;
  return <SlipCard request={loaded.value.request} now={loaded.value.now} />;
}

function SlipCard({ request, now }: { request: CoverageRequest; now: number }) {
  const stats = bookStats(request.bids, request.coverageAmount, now);
  const top = stats.full.slice(0, 3);
  return (
    <article className="soft-card floaty p-6 text-ink">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] tracking-[0.16em] text-muted uppercase">Sample slip</p>
        <DemoChip />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <PerilChip peril={request.peril} />
        <span className="font-mono text-sm">
          {request.city} {request.zip}
        </span>
      </div>
      <h2 className="mt-3 font-display text-3xl leading-tight">
        {formatMoney(request.coverageAmount)} of {perilLabel(request.peril).toLowerCase()} cover
      </h2>
      <p className="mt-2 text-sm leading-6 text-ink-soft">{request.notes}</p>
      <dl className="mt-5 grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-ink px-3 py-3 text-white">
          <dt className="font-mono text-[10px] tracking-widest text-white/70 uppercase">Best</dt>
          <dd className="font-mono text-sm">{stats.best ? formatMoney(stats.best.premiumAnnual) : "—"}</dd>
        </div>
        <div className="rounded-2xl bg-paper-2 px-3 py-3">
          <dt className="font-mono text-[10px] tracking-widest text-muted uppercase">Spread</dt>
          <dd className="font-mono text-sm">{stats.spread == null ? "—" : formatMoney(stats.spread)}</dd>
        </div>
        <div className="rounded-2xl bg-paper-2 px-3 py-3">
          <dt className="font-mono text-[10px] tracking-widest text-muted uppercase">Risk</dt>
          <dd className="font-mono text-sm">{stats.implied == null ? "—" : formatRate(stats.implied)}</dd>
        </div>
      </dl>
      <ol className="mt-4 divide-y divide-line border-y border-line">
        {top.map((bid) => (
          <li key={bid.id} className="flex items-baseline justify-between gap-3 py-2 text-sm">
            <span>{bid.desk ?? bid.underwriterName}</span>
            <span className="font-mono">
              {formatMoney(bid.premiumAnnual)}
              <span className="text-muted"> · {formatRate(bid.premiumAnnual / request.coverageAmount)}</span>
            </span>
          </li>
        ))}
      </ol>
      <Link href={`/requests/${request.id}`} className="mt-4 inline-block text-sm underline decoration-ember underline-offset-4">
        Open this order book
      </Link>
    </article>
  );
}

function SlipSkeleton({ empty = false }: { empty?: boolean }) {
  return (
    <div className="soft-card min-h-80 p-6">
      <p className="font-mono text-xs tracking-[0.16em] text-muted uppercase">{empty ? "Book unavailable" : "Opening the slip"}</p>
      <p className="mt-4 font-display text-3xl">{empty ? "The desk could not load the sample book." : "Loading a live request…"}</p>
    </div>
  );
}

async function MarketPreview() {
  const loaded = await load(() => getMarket());
  if (!loaded.ok) return <p className="text-sm text-danger">The market desk is unreachable right now.</p>;
  const market = loaded.value;
  return <MarketBoard rows={market.rows} demoCount={market.demoCount} postedCount={market.postedCount} variant="strip" />;
}
