import Link from "next/link";
import { Suspense } from "react";
import { QuoteForm } from "@/components/quote-form";
import { getCurrentUser } from "@/lib/auth";
import { load } from "@/lib/load";
import type { Concern, Intake } from "@/lib/quotes/rank";
import { getRequest, listRequests } from "@/lib/queries";

export const metadata = { title: "Get my quotes" };

const DEFAULTS: Intake = {
  zip: "90272",
  state: "CA",
  homeType: "single-family",
  yearBuilt: 1978,
  roofAge: "6-15",
  coverageAmount: 1_500_000,
  concerns: ["fire"],
  claims: "none",
};

export default function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ request?: string }>;
}) {
  return (
    <div className="mx-auto max-w-xl px-4 py-8 md:py-12">
      <p className="text-sm font-extrabold text-bolt">One button</p>
      <h1 className="mt-2 font-display text-4xl leading-tight md:text-6xl">Get my quotes</h1>
      <p className="mt-3 text-base leading-7 text-ink-soft">
        A few facts about the house. Then we show who is actually ready on this desk, and which companies publicly say they write your state.
      </p>
      <div className="mt-6">
        <Suspense fallback={<p className="text-sm text-muted">Loading your house…</p>}>
          <ReadyForm searchParams={searchParams} />
        </Suspense>
      </div>
      <p className="mt-4 text-sm">
        <Link href="/requests" className="font-bold text-bolt underline underline-offset-4">
          Or start from a posted risk
        </Link>
      </p>
    </div>
  );
}

async function ReadyForm({ searchParams }: { searchParams: Promise<{ request?: string }> }) {
  const query = await searchParams;
  const user = await getCurrentUser();
  let initial = DEFAULTS;
  const requestedId = query.request;
  if (requestedId) {
    const loaded = await load(() => getRequest(requestedId));
    if (loaded.ok && loaded.value && (!user || loaded.value.request.homeownerId === user.id || loaded.value.request.isDemo)) {
      initial = fromRequest(loaded.value.request);
    }
  } else if (user?.role === "homeowner") {
    const mine = await load(() => listRequests({ status: "open" }));
    const own = mine.ok ? mine.value.requests.find((item) => item.homeownerId === user.id) : undefined;
    if (own) initial = fromRequest(own);
  }
  return <QuoteForm initial={initial} />;
}

function fromRequest(request: { zip: string; state: string; coverageAmount: number; peril: string }): Intake {
  const concern: Concern = request.peril === "flood" ? "flood" : request.peril === "wind" ? "wind" : "fire";
  return {
    ...DEFAULTS,
    zip: request.zip,
    state: request.state,
    coverageAmount: request.coverageAmount,
    concerns: [concern],
  };
}
