import Link from "next/link";
import { Suspense } from "react";
import { DemoChip } from "@/components/chips";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth";
import { formatMoney, formatRate, perilLabel, requestStatusLabel, roleLabel } from "@/lib/format";
import { impliedRate } from "@/lib/book";
import { load } from "@/lib/load";
import { listMine } from "@/lib/queries";
import { quoteRequestsFor } from "@/lib/store";
import { connection } from "next/server";

export const metadata = { title: "Your desk" };

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Suspense fallback={<p className="text-sm text-muted">Opening your desk…</p>}>
        <Desk />
      </Suspense>
    </div>
  );
}

async function Desk() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div>
        <h1 className="font-display text-5xl">You&apos;re not on the desk.</h1>
        <p className="mt-3 text-ink-soft">Sign in with a demo persona to post or bid.</p>
        <Button asChild className="mt-6" variant="ember">
          <Link href="/sign-in?next=/account">Sign in</Link>
        </Button>
      </div>
    );
  }
  const loaded = await load(() => listMine(user));
  if (!loaded.ok) return <p className="text-sm text-danger">Your desk could not be loaded.</p>;
  const mine = loaded.value;
  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-xs tracking-[0.18em] text-ember-deep uppercase">{roleLabel(user.role)}</p>
        <h1 className="mt-2 font-display text-5xl">{user.name}</h1>
        <p className="mt-2 text-sm text-muted">
          {user.email}
          {user.desk ? ` · ${user.desk}` : ""}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {user.isDemo ? <DemoChip /> : null}
          <Link href="/sign-in" className="text-sm underline decoration-ember underline-offset-4">
            Switch desk
          </Link>
          <form action={signOut}>
            <button type="submit" className="text-sm underline underline-offset-4">
              Sign out
            </button>
          </form>
        </div>
      </header>
      {user.role === "homeowner" ? (
        <section>
          <h2 className="font-display text-3xl">Your requests</h2>
          {mine.requests.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              Nothing posted yet.{" "}
              <Link href="/quotes" className="underline decoration-ember underline-offset-4">
                Get my quotes
              </Link>
              {" · "}
              <Link href="/requests/new" className="underline decoration-ember underline-offset-4">
                Post a coverage request
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {mine.requests.map((request) => (
                <li key={request.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <Link href={`/requests/${request.id}`} className="font-medium underline decoration-ember underline-offset-4">
                      {request.city} {request.zip}
                    </Link>
                    <p className="text-sm text-muted">
                      {perilLabel(request.peril)} · {formatMoney(request.coverageAmount)} · {requestStatusLabel(request.status)}
                      {request.isDemo ? " · Demo" : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <section className="space-y-8">
          <IncomingQuotes underwriterId={user.id} />
          <div>
          <h2 className="font-display text-3xl">Your indications</h2>
          {mine.bids.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              No bids yet.{" "}
              <Link href="/requests" className="underline decoration-ember underline-offset-4">
                Read the open book
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {mine.bids.map((bid) => {
                const rate = impliedRate(bid.premiumAnnual, bid.maxCoverage);
                return (
                  <li key={bid.id} className="py-3">
                    <Link href={`/requests/${bid.requestId}`} className="font-medium underline decoration-ember underline-offset-4">
                      {bid.city} {bid.zip}
                    </Link>
                    <p className="text-sm text-muted">
                      {perilLabel(bid.peril)} · {formatMoney(bid.premiumAnnual)} / yr
                      {rate ? ` · ${formatRate(rate)}` : ""} · {bid.status} · request {requestStatusLabel(bid.requestStatus)}
                      {bid.isDemo ? " · Demo" : ""}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
          </div>
        </section>
      )}
    </div>
  );
}

async function IncomingQuotes({ underwriterId }: { underwriterId: string }) {
  await connection();
  const incoming = quoteRequestsFor(underwriterId);
  return (
    <div>
      <h2 className="font-display text-3xl">Quote requests</h2>
      {incoming.length === 0 ? (
        <p className="mt-3 text-sm text-muted">When a homeowner taps Request this quote, it shows up here.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {incoming.map((item) => (
            <li key={item.id} className="soft-card p-4">
              <p className="font-extrabold">{item.homeownerName}</p>
              <p className="mt-1 text-sm leading-6 text-ink-soft">{item.summary}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
