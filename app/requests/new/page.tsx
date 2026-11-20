import Link from "next/link";
import { Suspense } from "react";
import { RequestForm } from "@/components/request-form";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Post a request" };

export default function NewRequestPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="font-mono text-xs tracking-[0.18em] text-ember-deep uppercase">Homeowner desk</p>
      <h1 className="mt-2 font-display text-4xl leading-tight md:text-6xl">Post the coverage you need</h1>
      <p className="mt-4 text-base leading-7 text-ink-soft">
        Tell the desk where the house is, how much structure you want covered, and which peril. Underwriters will bid
        a premium. You are not buying a policy.
      </p>
      <div className="mt-8">
        <Suspense fallback={<p className="text-sm text-muted">Checking the desk…</p>}>
          <Gate />
        </Suspense>
      </div>
    </div>
  );
}

async function Gate() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="border border-ink bg-card p-5">
        <p className="font-display text-3xl">Sign in to post.</p>
        <p className="mt-2 text-sm leading-6 text-ink-soft">Use a demo homeowner, or open your own homeowner desk. No password.</p>
        <Button asChild className="mt-4" variant="ember">
          <Link href="/sign-in?next=/requests/new">Sign in</Link>
        </Button>
      </div>
    );
  }
  if (user.role !== "homeowner") {
    return (
      <div className="border border-ink bg-card p-5">
        <p className="font-display text-3xl">This side of the desk bids.</p>
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          You are signed in as {user.name}, an underwriter. Switch to a homeowner persona to post a request.
        </p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/sign-in?next=/requests/new">Switch desk</Link>
        </Button>
      </div>
    );
  }
  return <RequestForm />;
}
