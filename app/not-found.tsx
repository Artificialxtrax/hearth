import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20">
      <p className="font-mono text-xs tracking-[0.18em] text-ember-deep uppercase">404</p>
      <h1 className="mt-2 font-display text-5xl">That slip is not on the desk.</h1>
      <p className="mt-4 text-ink-soft">The request may have been withdrawn, or the link is wrong.</p>
      <Link href="/requests" className="mt-6 inline-block underline decoration-ember underline-offset-4">
        Back to the book
      </Link>
    </div>
  );
}
