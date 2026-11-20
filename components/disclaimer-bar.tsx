import Link from "next/link";

export function DisclaimerBar() {
  return (
    <div className="bg-ember text-ink">
      <p className="mx-auto max-w-6xl px-4 py-2.5 text-[13px] leading-5">
        <strong className="font-medium">Prototype only.</strong> Hearth does not sell or bind insurance. Bids are
        non-binding indications of interest. A real policy would be issued by a licensed carrier or broker. No payment
        is taken.{" "}
        <Link href="/legal" className="font-extrabold underline underline-offset-2">
          Read the notice
        </Link>
      </p>
    </div>
  );
}

export function DisclaimerNote({ className = "" }: { className?: string }) {
  return (
    <p className={`border-[3px] border-ink bg-white px-4 py-3 text-sm leading-6 text-ink ${className}`}>
      This does not create coverage. An acceptance records interest in a non-binding indication. Hearth does not issue
      policies or take payment.
    </p>
  );
}
