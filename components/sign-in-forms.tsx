"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInDemo, signInNew } from "@/lib/actions";
import type { ActionState, User } from "@/lib/types";

const initial: ActionState = {};

export function PersonaList({ title, people, next }: { title: string; people: User[]; next: string }) {
  return (
    <section>
      <h2 className="font-display text-3xl">{title}</h2>
      <ul className="mt-3 divide-y divide-line border-y border-line">
        {people.map((person) => (
          <li key={person.id} className="flex items-center justify-between gap-3 py-3">
            <div>
              <p className="font-medium">{person.name}</p>
              <p className="text-sm text-muted">{person.desk ?? person.email}</p>
            </div>
            <form action={signInDemo}>
              <input type="hidden" name="email" value={person.email} />
              {next ? <input type="hidden" name="next" value={next} /> : null}
              <Button type="submit" size="sm" variant="outline">
                Enter
              </Button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function NewDeskForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signInNew, initial);
  return (
    <form action={action} className="soft-card h-fit space-y-4 p-6">
      <h2 className="font-display text-3xl">Open your own desk</h2>
      <p className="text-sm leading-6 text-ink-soft">
        A name and an email are enough. This stays in the prototype database. It is not an account at an insurer.
      </p>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {state.error ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required autoComplete="name" />
        {state.fieldErrors?.name ? <p className="text-sm text-danger">{state.fieldErrors.name}</p> : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
        {state.fieldErrors?.email ? <p className="text-sm text-danger">{state.fieldErrors.email}</p> : null}
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Side</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="role" value="homeowner" defaultChecked /> Homeowner, posting a request
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="role" value="underwriter" /> Underwriter, bidding a premium
        </label>
        {state.fieldErrors?.role ? <p className="text-sm text-danger">{state.fieldErrors.role}</p> : null}
      </fieldset>
      <div className="space-y-1.5">
        <Label htmlFor="desk">Desk name, if you underwrite</Label>
        <Input id="desk" name="desk" placeholder="Optional syndicate or personal desk" />
      </div>
      <Button type="submit" variant="ember" disabled={pending}>
        {pending ? "Opening…" : "Enter the desk"}
      </Button>
    </form>
  );
}
