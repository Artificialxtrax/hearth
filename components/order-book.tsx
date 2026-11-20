import Link from "next/link";
import { BidForm } from "@/components/bid-form";
import { CountUp } from "@/components/count-up";
import { BidChip, DemoChip, PerilChip, StatusChip } from "@/components/chips";
import { LiveRefresh } from "@/components/live-refresh";
import { Button } from "@/components/ui/button";
import { acceptBid, withdrawBid, withdrawRequest } from "@/lib/actions";
import { bookStats, discoverySeries, impliedRate, offeredCoverage } from "@/lib/book";
import { bidDisplayStatus, formatDay, formatMoney, formatRate, formatWhen, perilLabel } from "@/lib/format";
import type { Bid, CoverageRequest, User } from "@/lib/types";

export function OrderBook({
  request,
  user,
  now,
  notice,
  confirmId,
}: {
  request: CoverageRequest;
  user: User | null;
  now: number;
  notice?: string;
  confirmId?: string;
}) {
  const stats = bookStats(request.bids, request.coverageAmount, now);
  const series = discoverySeries(request.bids, request.coverageAmount);
  const owner = user?.id === request.homeownerId;
  const expiryDefault = new Date(now + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const accepted = request.bids.find((bid) => bid.id === request.acceptedBidId) ?? null;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <LiveRefresh />
      <section className="space-y-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <PerilChip peril={request.peril} />
            <StatusChip status={request.status} />
            {request.isDemo ? <DemoChip /> : null}
          </div>
          <h1 className="mt-3 font-display text-4xl leading-tight text-ink md:text-5xl">
            {perilLabel(request.peril)} in {request.city}
          </h1>
          <p className="mt-2 font-mono text-sm text-muted">
            {request.city}, {request.state} {request.zip}
          </p>
          <Button asChild className="mt-4" variant="ember">
            <Link href={`/quotes?request=${request.id}`}>Get my quotes</Link>
          </Button>
        </div>
        {notice === "accepted" ? (
          <p className="border-[3px] border-ink bg-ember px-4 py-3 text-sm font-bold text-ink">
            Acceptance recorded. No policy was issued and no money moved.
          </p>
        ) : null}
        {confirmId ? <ConfirmAcceptance request={request} confirmId={confirmId} user={user} now={now} /> : null}
        {notice === "stale" ? (
          <p role="alert" className="border border-danger px-3 py-2 text-sm text-danger">
            That indication is no longer open. The book may have moved.
          </p>
        ) : null}
        {request.status === "awarded" && accepted ? (
          <p className="soft-card px-4 py-3 text-sm leading-6">
            Indication accepted from {accepted.desk ?? accepted.underwriterName} at{" "}
            {formatMoney(accepted.premiumAnnual)} a year. This is still not coverage.
          </p>
        ) : null}
        <dl className="grid grid-cols-2 gap-3">
          <Fact label="Coverage" value={formatMoney(request.coverageAmount)} animate={{ n: request.coverageAmount, kind: "money" }} />
          <Fact label="Deductible" value={formatMoney(request.deductible)} animate={{ n: request.deductible, kind: "money" }} />
          <Fact label="Starts" value={formatDay(request.startDate)} />
          <Fact label="Posted" value={formatWhen(request.createdAt)} />
        </dl>
        <p className="text-sm leading-6 text-ink-soft">
          Posted by {request.homeownerName}
          {request.isDemo ? ", a demo homeowner" : ""}.
        </p>
        {request.notes ? <p className="border-l-2 border-ember pl-4 text-base leading-7 text-ink">{request.notes}</p> : null}
        {request.photos.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {request.photos.map((photo, index) => (
              <figure key={photo.id} className="border border-line bg-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.src}
                  alt={
                    request.isDemo
                      ? `Demo photograph ${index + 1} for the ${request.city} example. Not a picture of a real submission.`
                      : `Photo ${index + 1} attached to this coverage request`
                  }
                  className="aspect-[4/3] w-full object-cover"
                />
                {request.isDemo ? (
                  <figcaption className="px-2 py-1 font-mono text-[10px] tracking-wide text-muted uppercase">
                    Demo image
                  </figcaption>
                ) : null}
              </figure>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No photos attached.</p>
        )}
        {owner && request.status === "open" ? (
          <form action={withdrawRequest}>
            <input type="hidden" name="requestId" value={request.id} />
            <Button type="submit" variant="danger" size="sm">
              Withdraw request
            </Button>
          </form>
        ) : null}
      </section>

      <section className="space-y-5" aria-live="polite">
        <div className="flex items-center justify-between gap-3">
          <p className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.16em] text-sage uppercase">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping bg-sage opacity-60" />
              <span className="relative h-2 w-2 bg-sage" />
            </span>
            Live book
          </p>
          <p className="text-xs text-muted">Refreshes while this page is open</p>
        </div>
        <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Fact label="Best bid" value={stats.best ? formatMoney(stats.best.premiumAnnual) : "—"} hint={stats.best ? (stats.best.desk ?? "Full cover") : "Waiting for a full price"} animate={stats.best ? { n: stats.best.premiumAnnual, kind: "money" } : null} />
          <Fact label="Bids" value={String(stats.liveCount)} hint="Live, friendly prices" animate={{ n: stats.liveCount, kind: "count" }} />
          <Fact label="Spread" value={stats.spread == null ? "—" : formatMoney(stats.spread)} hint="Room between the top two" animate={stats.spread == null ? null : { n: stats.spread, kind: "money" }} />
          <Fact label="Implied risk" value={stats.implied == null ? "—" : formatRate(stats.implied)} hint="Premium ÷ coverage" animate={stats.implied == null ? null : { n: stats.implied, kind: "rate" }} />
        </dl>
        <RateChart bids={[...stats.full, ...stats.partial]} requested={request.coverageAmount} bestId={stats.best?.id ?? null} />
        <DiscoveryChart points={series} />
        <BidList
          title="Full cover"
          empty="No one has priced the full amount yet. A partial offer can still be a kind start."
          bids={stats.full}
          request={request}
          user={user}
          now={now}
          bestId={stats.best?.id ?? null}
        />
        <BidList
          title="Partial capacity"
          empty=""
          intro="These desks would write less than the amount requested. The rate is premium divided by the coverage they offered."
          bids={stats.partial}
          request={request}
          user={user}
          now={now}
          bestId={null}
        />
        {stats.resting.length > 0 ? (
          <details className="border border-line px-4 py-3">
            <summary className="cursor-pointer text-sm">Expired, withdrawn, and closed ({stats.resting.length})</summary>
            <ul className="mt-3 space-y-3">
              {stats.resting.map((bid) => (
                <BidRow key={bid.id} bid={bid} request={request} user={user} now={now} best={false} />
              ))}
            </ul>
          </details>
        ) : null}
        {request.status === "open" && user?.role === "underwriter" ? (
          <BidForm requestId={request.id} defaultCoverage={request.coverageAmount} defaultExpiry={expiryDefault} />
        ) : null}
        {request.status === "open" && !user ? (
          <p className="text-sm leading-6">
            <Link href={`/sign-in?next=/requests/${request.id}`} className="underline decoration-ember underline-offset-4">
              Sign in as an underwriter
            </Link>{" "}
            to put a price on this book, or as the homeowner to accept one.
          </p>
        ) : null}
        {request.status === "open" && user && !owner && user.role === "homeowner" ? (
          <p className="text-sm leading-6 text-ink-soft">You can read this book. Only the homeowner who posted it can accept.</p>
        ) : null}
        {request.status !== "open" ? (
          <p className="text-sm leading-6 text-ink-soft">The request is closed, so the desk is not taking new indications.</p>
        ) : null}
      </section>
    </div>
  );
}

function Fact({
  label,
  value,
  hint,
  animate = null,
}: {
  label: string;
  value: string;
  hint?: string;
  animate?: { n: number; kind: "money" | "rate" | "count" } | null;
}) {
  return (
    <div className="soft-card px-4 py-3">
      <dt className="font-mono text-[10px] tracking-[0.14em] text-muted uppercase">{label}</dt>
      <dd className="mt-1 font-mono text-xl text-ink md:text-2xl">
        {animate ? <CountUp value={animate.n} kind={animate.kind} /> : value}
      </dd>
      {hint ? <p className="mt-1 text-[11px] leading-4 text-muted">{hint}</p> : null}
    </div>
  );
}

function RateChart({ bids, requested, bestId }: { bids: Bid[]; requested: number; bestId: string | null }) {
  if (bids.length === 0) {
    return (
      <div className="soft-card px-5 py-8">
        <p className="font-display text-2xl">No prices yet, and that is okay.</p>
        <p className="mt-2 text-sm leading-6 text-muted">
          When an underwriter names a premium, the implied rate will glow in right here. Premium divided by coverage.
        </p>
      </div>
    );
  }
  const rates = bids.map((bid) => impliedRate(bid.premiumAnnual, offeredCoverage(bid.maxCoverage, requested)) ?? 0);
  const max = Math.max(...rates, 0.01);
  return (
    <figure>
      <figcaption className="mb-3 font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
        Implied annual risk by indication
      </figcaption>
      <ul className="space-y-2">
        {bids.map((bid, index) => {
          const rate = rates[index] ?? 0;
          const width = `${Math.max(6, (rate / max) * 100)}%`;
          const best = bid.id === bestId;
          return (
            <li key={bid.id} className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-3">
              <span className="truncate text-sm">{bid.desk ?? bid.underwriterName}</span>
              <span className="h-3 overflow-hidden rounded-full bg-paper-2" aria-hidden="true">
                <span className={`block h-3 rounded-full ${best ? "bg-ember" : "bg-bolt"}`} style={{ width }} />
              </span>
              <span className="font-mono text-sm">{formatRate(rate)}</span>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}

function DiscoveryChart({ points }: { points: { at: string; rate: number }[] }) {
  if (points.length === 0) return null;
  const width = 640;
  const height = 150;
  const pad = 18;
  const max = Math.max(...points.map((point) => point.rate)) * 1.08;
  const min = Math.min(...points.map((point) => point.rate)) * 0.92;
  const span = Math.max(max - min, 0.002);
  const coords = points.map((point, index) => {
    const x = pad + (points.length === 1 ? (width - pad * 2) / 2 : (index / (points.length - 1)) * (width - pad * 2));
    const y = pad + (1 - (point.rate - min) / span) * (height - pad * 2);
    return { x, y, rate: point.rate };
  });
  const first = coords[0];
  if (!first) return null;
  let path = `M ${first.x} ${first.y}`;
  for (let index = 1; index < coords.length; index += 1) {
    const point = coords[index];
    if (!point) continue;
    path += ` H ${point.x} V ${point.y}`;
  }
  const last = coords[coords.length - 1];
  return (
    <figure>
      <figcaption className="mb-2 font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
        Best full-cover rate since the request opened
      </figcaption>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" className="w-full rounded-3xl bg-white/70" aria-label="Step chart of the best implied rate over time">
        <path d={path} fill="none" stroke="#5B21E6" strokeWidth="3" />
        {coords.map((point, index) => (
          <circle key={`${point.x}-${index}`} cx={point.x} cy={point.y} r="4" fill="#1c1915" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between font-mono text-[11px] text-muted">
        <span>{formatRate(first.rate)}</span>
        {last && last !== first ? <span>{formatRate(last.rate)}</span> : null}
      </div>
    </figure>
  );
}

function BidList({
  title,
  intro,
  empty,
  bids,
  request,
  user,
  now,
  bestId,
}: {
  title: string;
  intro?: string;
  empty: string;
  bids: Bid[];
  request: CoverageRequest;
  user: User | null;
  now: number;
  bestId: string | null;
}) {
  if (bids.length === 0) {
    return empty ? <p className="text-sm text-muted">{empty}</p> : null;
  }
  return (
    <div>
      <h2 className="font-display text-2xl">{title}</h2>
      {intro ? <p className="mt-1 text-sm leading-6 text-muted">{intro}</p> : null}
      <ul className="mt-3 divide-y divide-line border-y border-line">
        {bids.map((bid) => (
          <BidRow key={bid.id} bid={bid} request={request} user={user} now={now} best={bid.id === bestId} />
        ))}
      </ul>
    </div>
  );
}

function ConfirmAcceptance({
  request,
  confirmId,
  user,
  now,
}: {
  request: CoverageRequest;
  confirmId: string;
  user: User | null;
  now: number;
}) {
  const bid = request.bids.find((item) => item.id === confirmId);
  const live = bid != null && bid.status === "active" && new Date(bid.expiresAt).getTime() > now;
  if (!bid || user?.id !== request.homeownerId || request.status !== "open" || !live) {
    return (
      <p role="alert" className="border border-danger px-3 py-2 text-sm text-danger">
        That indication can&apos;t be accepted from this desk.
      </p>
    );
  }
  const partial = bid.maxCoverage < request.coverageAmount;
  return (
    <form action={acceptBid} className="soft-card glow-ring p-5">
      <h2 className="font-display text-3xl">Accept this indication?</h2>
      <p className="mt-2 text-sm leading-6 text-ink-soft">
        {bid.desk ?? bid.underwriterName} at {formatMoney(bid.premiumAnnual)} a year, up to {formatMoney(bid.maxCoverage)}.
        This records a non-binding indication of interest. It does not bind coverage, issue a policy, or move money. A
        real policy would be written by a licensed carrier or broker.
        {partial ? " This indication does not cover the full amount you requested." : ""}
      </p>
      <input type="hidden" name="requestId" value={request.id} />
      <input type="hidden" name="bidId" value={bid.id} />
      <div className="mt-4 flex flex-wrap gap-3">
        <Button type="submit" variant="ember">
          Record acceptance
        </Button>
        <Button asChild variant="outline">
          <Link href={`/requests/${request.id}`}>Not now</Link>
        </Button>
      </div>
    </form>
  );
}

function BidRow({
  bid,
  request,
  user,
  now,
  best,
}: {
  bid: Bid;
  request: CoverageRequest;
  user: User | null;
  now: number;
  best: boolean;
}) {
  const live = bid.status === "active" && new Date(bid.expiresAt).getTime() > now;
  const rate = impliedRate(bid.premiumAnnual, offeredCoverage(bid.maxCoverage, request.coverageAmount));
  const owner = user?.id === request.homeownerId;
  return (
    <li className={`py-4 ${best ? "border-l-4 border-l-ember pl-3" : ""}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="font-medium text-ink">{bid.desk ?? bid.underwriterName}</p>
          <p className="text-sm text-muted">
            {bid.underwriterName}
            {bid.isDemo ? " · Demo desk" : ""}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-xl">{formatMoney(bid.premiumAnnual)}<span className="text-sm text-muted"> / yr</span></p>
          <p className="font-mono text-sm text-ember-deep">{rate == null ? "—" : formatRate(rate)}</p>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-soft">
        <BidChip status={bidDisplayStatus(bid, now)} />
        {best ? <span className="font-mono tracking-wide text-ember-deep uppercase">Best</span> : null}
        <span>Up to {formatMoney(bid.maxCoverage)}</span>
        <span>Expires {formatWhen(bid.expiresAt)}</span>
      </div>
      <p className="mt-2 text-sm leading-6 text-ink-soft">{bid.terms}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {owner && request.status === "open" && live ? (
          <Button asChild size="sm" variant="ember">
            <Link href={`/requests/${request.id}?confirm=${bid.id}`}>Accept indication</Link>
          </Button>
        ) : null}
        {user?.id === bid.underwriterId && live ? (
          <form action={withdrawBid}>
            <input type="hidden" name="requestId" value={request.id} />
            <input type="hidden" name="bidId" value={bid.id} />
            <Button type="submit" size="sm" variant="outline">
              Withdraw indication
            </Button>
          </form>
        ) : null}
      </div>
    </li>
  );
}
