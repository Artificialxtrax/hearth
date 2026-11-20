"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createQuoteMatch } from "@/lib/actions";
import type { Concern, Intake } from "@/lib/quotes/rank";

const STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

export function QuoteForm({ initial }: { initial: Intake }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [matching, setMatching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function matchQuotes() {
    const form = formRef.current;
    if (!form) return;
    setMatching(true);
    setError(null);
    const started = Date.now();
    const result = await createQuoteMatch({}, new FormData(form));
    if (!result.id) {
      setMatching(false);
      setError(result.error ?? "Something got in the way. Try once more.");
      return;
    }
    const remaining = 2400 - (Date.now() - started);
    if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
    router.push(`/quotes/${result.id}`);
  }

  return (
    <>
      <form ref={formRef} onSubmit={(event) => event.preventDefault()} className="soft-card space-y-5 p-5 md:p-8">
        {error ? (
          <p role="alert" className="text-sm font-bold text-danger">
            {error}
          </p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="ZIP" htmlFor="zip">
            <Input id="zip" name="zip" required inputMode="numeric" maxLength={5} defaultValue={initial.zip} />
          </Field>
          <Field label="State" htmlFor="state">
            <select id="state" name="state" defaultValue={initial.state} className="h-12 w-full rounded-2xl border border-line bg-white px-4 text-base">
              {STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Home type" htmlFor="homeType">
            <Select id="homeType" name="homeType" defaultValue={initial.homeType} options={[
              ["single-family", "Single family"],
              ["townhouse", "Townhouse"],
              ["condo", "Condo"],
              ["mobile", "Mobile home"],
            ]} />
          </Field>
          <Field label="Year built" htmlFor="yearBuilt">
            <Input id="yearBuilt" name="yearBuilt" required inputMode="numeric" defaultValue={String(initial.yearBuilt)} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Roof age" htmlFor="roofAge">
            <Select id="roofAge" name="roofAge" defaultValue={initial.roofAge} options={[
              ["0-5", "0–5 years"],
              ["6-15", "6–15 years"],
              ["16-25", "16–25 years"],
              ["25+", "Over 25 years"],
            ]} />
          </Field>
          <Field label="Coverage amount" htmlFor="coverageAmount">
            <Input id="coverageAmount" name="coverageAmount" required inputMode="decimal" defaultValue={String(initial.coverageAmount)} />
          </Field>
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-extrabold">What worries you?</legend>
          <ConcernBox name="fire" label="Fire" defaultChecked={initial.concerns.includes("fire")} />
          <ConcernBox name="flood" label="Flood" defaultChecked={initial.concerns.includes("flood")} />
          <ConcernBox name="wind" label="Wind" defaultChecked={initial.concerns.includes("wind")} />
        </fieldset>
        <Field label="Claims in the last 5 years" htmlFor="claims">
          <Select id="claims" name="claims" defaultValue={initial.claims} options={[
            ["none", "None"],
            ["one", "One"],
            ["two-or-more", "Two or more"],
          ]} />
        </Field>
        <p className="text-sm leading-6 text-ink-soft">
          Hearth is not a licensed insurance agent. Estimates are not offers. One tap checks who on this desk is ready, then who publicly writes your state.
        </p>
        <Button type="button" variant="ember" size="lg" className="w-full" data-testid="get-my-quotes" onClick={() => void matchQuotes()}>
          Get my quotes
        </Button>
      </form>
      {matching ? <MatchingMoment /> : null}
    </>
  );
}

function MatchingMoment() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 px-6" data-testid="matching-animation" role="status">
      <div className="hero-pop w-full max-w-md rounded-[2rem] px-8 py-10 text-center text-white">
        <p className="text-sm font-extrabold">One moment</p>
        <h2 className="mt-2 text-4xl font-extrabold leading-tight">AI is matching you</h2>
        <p className="mt-3 text-white/90">Checking the desk, then carriers that publicly write your state.</p>
        <div className="mt-6 flex justify-center gap-2" aria-hidden="true">
          <span className="h-3 w-3 animate-bounce rounded-full bg-white [animation-delay:0ms]" />
          <span className="h-3 w-3 animate-bounce rounded-full bg-white [animation-delay:120ms]" />
          <span className="h-3 w-3 animate-bounce rounded-full bg-white [animation-delay:240ms]" />
        </div>
      </div>
    </div>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function Select({
  id,
  name,
  defaultValue,
  options,
}: {
  id: string;
  name: string;
  defaultValue: string;
  options: Array<[string, string]>;
}) {
  return (
    <select id={id} name={name} defaultValue={defaultValue} className="h-12 w-full rounded-2xl border border-line bg-white px-4 text-base">
      {options.map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}

function ConcernBox({ name, label, defaultChecked }: { name: Concern; label: string; defaultChecked: boolean }) {
  return (
    <label className="flex min-h-11 items-center gap-3 text-base font-semibold">
      <input type="checkbox" name="concern" value={name} defaultChecked={defaultChecked} className="h-5 w-5 accent-[#5B21E6]" />
      {label}
    </label>
  );
}

