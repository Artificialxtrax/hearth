import Link from "next/link";
import { Suspense } from "react";
import { DemoChip, PerilChip, StatusChip } from "@/components/chips";
import { bookStats } from "@/lib/book";
import { formatDay, formatMoney, formatRate, perilLabel } from "@/lib/format";
import { load } from "@/lib/load";
import { listRequests, type RequestFilters } from "@/lib/queries";
import { PERILS } from "@/lib/types";

export const metadata = { title: "Requests" };

export default function RequestsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="max-w-3xl">
        <p className="font-mono text-xs tracking-[0.18em] text-ember-deep uppercase">The book</p>
        <h1 className="mt-2 font-display text-4xl leading-tight md:text-6xl">Homes looking for a fair price</h1>
        <p className="mt-4 text-base leading-7 text-ink-soft">
          Each card is a homeowner asking for coverage. Open one to see the prices, the spread, and the implied rate
          in plain numbers.
        </p>
      </header>
      <Suspense fallback={<p className="mt-8 text-sm text-muted">Loading requests…</p>}>
        <RequestList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function RequestList({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  const filters: RequestFilters = {
    peril: one(raw.peril),
    zip: one(raw.zip),
    status: one(raw.status) || "open",
    sort: one(raw.sort) || "new",
  };
  const loaded = await load(() => listRequests(filters));
  if (!loaded.ok) {
    return (
      <p role="alert" className="mt-8 border border-danger px-4 py-6 text-sm text-danger">
        The book is unreachable right now.
      </p>
    );
  }
  const { requests, now } = loaded.value;
  return (
    <div className="mt-8 space-y-6">
      <form className="grid gap-3 border border-line bg-card p-4 md:grid-cols-[1fr_8rem_9rem_8rem_auto]" method="get">
        <select name="peril" defaultValue={filters.peril ?? ""} className="h-11 border border-line bg-paper px-3 text-base" aria-label="Peril">
          <option value="">All perils</option>
          {PERILS.map((peril) => (
            <option key={peril} value={peril}>
              {perilLabel(peril)}
            </option>
          ))}
        </select>
        <input
          name="zip"
          defaultValue={filters.zip ?? ""}
          inputMode="numeric"
          placeholder="ZIP"
          aria-label="ZIP"
          className="h-11 border border-line bg-paper px-3 text-base"
        />
        <select name="status" defaultValue={filters.status ?? "open"} className="h-11 border border-line bg-paper px-3 text-base" aria-label="Status">
          <option value="open">Open</option>
          <option value="awarded">Accepted</option>
          <option value="withdrawn">Withdrawn</option>
          <option value="all">All</option>
        </select>
        <select name="sort" defaultValue={filters.sort ?? "new"} className="h-11 border border-line bg-paper px-3 text-base" aria-label="Sort">
          <option value="new">Newest</option>
          <option value="rate">Highest rate</option>
        </select>
        <button type="submit" className="h-12 rounded-full bg-ink px-5 text-sm font-semibold text-paper">
          Filter
        </button>
      </form>
      {requests.length === 0 ? (
        <div className="soft-card px-6 py-10">
          <p className="font-display text-3xl">Nothing here yet.</p>
          <p className="mt-2 text-sm text-muted">Clear the filter, or post the request the market is missing.</p>
          <Link href="/requests/new" className="mt-4 inline-block text-sm underline decoration-ember underline-offset-4">
            Post a request
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {requests.map((request) => {
            const stats = bookStats(request.bids, request.coverageAmount, now);
            return (
              <li key={request.id}>
                <Link href={`/requests/${request.id}`} className="soft-card lift flex h-full flex-col p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <PerilChip peril={request.peril} />
                    <StatusChip status={request.status} />
                    {request.isDemo ? <DemoChip /> : null}
                  </div>
                  <h2 className="mt-3 font-display text-3xl leading-tight">
                    {request.city} {request.zip}
                  </h2>
                  <p className="mt-2 font-mono text-sm text-ink-soft">
                    {formatMoney(request.coverageAmount)} · deductible {formatMoney(request.deductible)} · starts {formatDay(request.startDate)}
                  </p>
                  <p className="mt-4 font-mono text-2xl">
                    {stats.implied == null ? "No full-cover bid" : formatRate(stats.implied)}
                    <span className="ml-2 font-sans text-sm text-muted">
                      {stats.best ? `${formatMoney(stats.best.premiumAnnual)} / yr · ${stats.liveCount} live` : `${stats.liveCount} live`}
                    </span>
                  </p>
                  <p className="mt-2 text-sm text-muted">Posted by {request.homeownerName}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
