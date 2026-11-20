import { Wordmark } from "@/components/wordmark";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20">
      <Wordmark />
      <h1 className="mt-8 font-display text-5xl leading-tight">You&apos;re offline.</h1>
      <p className="mt-4 text-lg leading-8 text-ink-soft">
        Hearth can stay on your home screen. The order book, the bids, and the area desk need a connection. When you
        are back online, open a request and the prices will be there.
      </p>
      <p className="mt-6 border border-ink bg-card px-3 py-3 text-sm leading-6">
        Prototype only. Hearth does not sell or bind insurance, and it does not take payment.
      </p>
    </div>
  );
}
