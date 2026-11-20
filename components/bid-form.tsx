"use client";

import { useActionState } from "react";
import { DisclaimerNote } from "@/components/disclaimer-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { placeBid } from "@/lib/actions";
import type { ActionState } from "@/lib/types";

const initial: ActionState = {};

export function BidForm({
  requestId,
  defaultCoverage,
  defaultExpiry,
}: {
  requestId: string;
  defaultCoverage: number;
  defaultExpiry: string;
}) {
  const [state, action, pending] = useActionState(placeBid, initial);
  return (
    <form action={action} className="soft-card space-y-4 p-5">
      <div>
        <h3 className="font-display text-2xl">Name a premium</h3>
        <p className="mt-1 text-sm leading-6 text-ink-soft">
          One live indication per desk. Submitting again withdraws your previous price on this request.
        </p>
      </div>
      <input type="hidden" name="requestId" value={requestId} />
      {state.error ? (
        <p role="alert" className="border border-danger px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="premiumAnnual">Annual premium (USD)</Label>
          <Input id="premiumAnnual" name="premiumAnnual" inputMode="decimal" required placeholder="75600" />
          {state.fieldErrors?.premiumAnnual ? (
            <p className="text-sm text-danger">{state.fieldErrors.premiumAnnual}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="maxCoverage">Max coverage (USD)</Label>
          <Input
            id="maxCoverage"
            name="maxCoverage"
            inputMode="decimal"
            required
            defaultValue={String(defaultCoverage)}
          />
          {state.fieldErrors?.maxCoverage ? <p className="text-sm text-danger">{state.fieldErrors.maxCoverage}</p> : null}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="expiresOn">Indication expires, end of day Pacific</Label>
        <Input id="expiresOn" name="expiresOn" type="date" required defaultValue={defaultExpiry} />
        {state.fieldErrors?.expiresOn ? <p className="text-sm text-danger">{state.fieldErrors.expiresOn}</p> : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="terms">Terms</Label>
        <Textarea
          id="terms"
          name="terms"
          required
          placeholder="Wildfire only. Dwelling limit. What you would and would not cover."
        />
        {state.fieldErrors?.terms ? <p className="text-sm text-danger">{state.fieldErrors.terms}</p> : null}
      </div>
      <DisclaimerNote />
      <Button type="submit" variant="ember" disabled={pending}>
        {pending ? "Submitting…" : "Submit non-binding indication"}
      </Button>
    </form>
  );
}
