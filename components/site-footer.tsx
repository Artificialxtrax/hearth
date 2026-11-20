import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm leading-6 text-muted md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-display text-xl text-ink">Hearth</p>
          <p className="mt-1 max-w-md">
            A prototype desk for pricing home coverage in the open. Seeded rows are fiction. Nothing here is a policy.
          </p>
        </div>
        <div className="flex gap-4">
          <Link href="/legal" className="underline underline-offset-2">
            Legal notice
          </Link>
          <Link href="/market" className="underline underline-offset-2">
            Market
          </Link>
          <Link href="/sign-in" className="underline underline-offset-2">
            Demo sign-in
          </Link>
        </div>
      </div>
    </footer>
  );
}
