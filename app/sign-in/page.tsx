import { Suspense } from "react";
import { NewDeskForm, PersonaList } from "@/components/sign-in-forms";
import { getCurrentUser } from "@/lib/auth";
import { load } from "@/lib/load";
import { listDemoUsers } from "@/lib/queries";
import { safeNext } from "@/lib/utils";

export const metadata = { title: "Sign in" };

export default function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; notice?: string }> }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="font-mono text-xs tracking-[0.18em] text-ember-deep uppercase">Demo sign-in</p>
      <h1 className="mt-2 max-w-3xl font-display text-4xl leading-tight md:text-6xl">Pick a side of the desk.</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-ink-soft">
        There is no password. The named people are fictional sample users so you can post a request and then bid on it.
        Anyone with this prototype can act as them. Don&apos;t use a real email you care about.
      </p>
      <Suspense fallback={<p className="mt-8 text-sm text-muted">Opening the roster…</p>}>
        <Roster searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Roster({ searchParams }: { searchParams: Promise<{ next?: string; notice?: string }> }) {
  const query = await searchParams;
  const next = safeNext(query.next, "");
  const loaded = await load(() => Promise.all([getCurrentUser(), listDemoUsers()]));
  if (!loaded.ok) {
    return (
      <p role="alert" className="mt-8 border border-danger px-4 py-6 text-sm text-danger">
        The roster is unreachable right now.
      </p>
    );
  }
  const [user, personas] = loaded.value;
  const homeowners = personas.filter((persona) => persona.role === "homeowner");
  const underwriters = personas.filter((persona) => persona.role === "underwriter");
  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-8">
        {query.notice === "unknown" ? (
          <p role="alert" className="border border-danger px-4 py-3 text-sm text-danger">
            That demo desk is not on the book.
          </p>
        ) : null}
        {user ? (
          <p className="border border-ink bg-card px-4 py-3 text-sm">
            You are on the desk as {user.name}
            {user.isDemo ? " (demo)" : ""}. Choosing another persona switches you.
          </p>
        ) : null}
        {personas.length === 0 ? (
          <p className="text-sm text-muted">No demo desks are loaded. Run the database setup, then refresh.</p>
        ) : (
          <>
            <PersonaList title="Homeowners" people={homeowners} next={next} />
            <PersonaList title="Underwriters" people={underwriters} next={next} />
          </>
        )}
      </div>
      <NewDeskForm next={next} />
    </div>
  );
}
