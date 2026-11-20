import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { requestThisQuote } from "@/lib/actions";
import { formatMoney } from "@/lib/format";
import { load } from "@/lib/load";
import { findQuote } from "@/lib/store";
import { connection } from "next/server";

export const metadata = { title: "Your matches" };

export default function QuoteResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ requested?: string }>;
}) {
  return (
    <Suspense fallback={<p className="px-4 py-10 text-sm text-muted">Lining up your matches…</p>}>
      <Results params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Results({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ requested?: string }>;
}) {
  await connection();
  const { id } = await params;
  const query = await searchParams;
  const loaded = await load(() => Promise.resolve(findQuote(id)));
  if (!loaded.ok) return <p className="px-4 py-10 text-sm text-danger">The match book is unavailable.</p>;
  const quote = loaded.value;
  if (!quote) notFound();
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <p className="text-sm font-extrabold text-bolt">
        {quote.intake.state} {quote.intake.zip}
      </p>
      <h1 className="mt-2 font-display text-4xl leading-tight md:text-6xl">Companies that can take a look</h1>
      <p className="mt-3 text-base leading-7 text-ink-soft">
        Ready to quote means someone on this desk already opted in. Likely to quote means a real company publicly writes this state. Those premiums are estimates, not their price.
      </p>
      <p className="mt-3 text-sm leading-6 text-ink">
        Hearth is not a licensed insurance agent. Nothing here is an offer, a binder, or a guarantee of coverage.
      </p>
      <ol className="mt-8 space-y-4">
        {quote.matches.map((match, index) => {
          const requested = query.requested === match.underwriterId;
          return (
            <li key={match.id} className="soft-card lift p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-extrabold text-muted">#{index + 1}</p>
                  <h2 className="font-display text-3xl">{match.name}</h2>
                  <p className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${match.kind === "desk" ? "tab-on" : "bg-paper-2 text-ink"}`}>
                    {match.label}
                  </p>
                </div>
                <p className="text-right">
                  <span className="block font-mono text-3xl font-bold text-bolt">{match.score}</span>
                  <span className="text-xs font-bold uppercase tracking-wide text-muted">Match</span>
                </p>
              </div>
              <p className="mt-4 text-base leading-7">{match.reason}</p>
              <p className="mt-3 font-mono text-lg">
                {formatMoney(match.premiumLow)}–{formatMoney(match.premiumHigh)}
                <span className="ml-2 font-sans text-sm text-muted">/ yr · estimate</span>
              </p>
              <p className="mt-1 text-xs text-muted">Source: {match.source}</p>
              <div className="mt-4">
                {match.kind === "desk" && match.underwriterId ? (
                  requested ? (
                    <p className="text-sm font-extrabold text-bolt">Request sent. It is on their desk.</p>
                  ) : (
                    <form action={requestThisQuote}>
                      <input type="hidden" name="quoteId" value={quote.id} />
                      <input type="hidden" name="underwriterId" value={match.underwriterId} />
                      <Button type="submit" variant="ember">
                        Request this quote
                      </Button>
                    </form>
                  )
                ) : (
                  <Button asChild variant="outline">
                    <a href={match.quoteUrl} target="_blank" rel="noopener noreferrer">
                      Request this quote
                    </a>
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {quote.matches.length === 0 ? (
        <p className="soft-card mt-6 p-6 text-ink-soft">No public writer in this directory fits that state and risk yet. Try another concern, or post the risk on the desk.</p>
      ) : null}
      <p className="mt-8">
        <Link href="/quotes" className="font-bold text-bolt underline underline-offset-4">
          Edit the house
        </Link>
      </p>
    </div>
  );
}
