"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20">
      <h1 className="font-display text-5xl">The desk hit a snag.</h1>
      <p className="mt-4 text-ink-soft">The page could not finish loading. Nothing was bound, and no payment was attempted.</p>
      <button type="button" onClick={reset} className="mt-6 h-11 border border-ink bg-ink px-4 text-sm text-paper">
        Try again
      </button>
    </div>
  );
}
