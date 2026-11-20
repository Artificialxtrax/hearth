export const metadata = { title: "Legal notice" };

export default function LegalPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <p className="font-mono text-xs tracking-[0.18em] text-ember-deep uppercase">Read this first</p>
      <h1 className="mt-2 font-display text-5xl leading-tight">Hearth is a prototype. It does not sell insurance.</h1>
      <div className="mt-8 space-y-6 text-base leading-8 text-ink-soft">
        <p>
          Hearth is a demonstration marketplace. It shows how a homeowner might post a coverage request and how an
          underwriter might answer with a price. The interface borrows the shape of an order book. It is not an
          exchange, not a broker, and not an insurer.
        </p>
        <p>
          No binding insurance is offered or sold here. A bid is a non-binding indication of interest. Accepting a bid
          records that interest in this prototype. It does not create a contract, bind coverage, or start a policy
          period.
        </p>
        <p>
          A real policy would be written through a licensed carrier or broker, on that carrier&apos;s form, subject to
          underwriting, inspection, and the law of the state. Hearth is not licensed to transact insurance. It does
          not collect premium and it does not process payments.
        </p>
        <p>
          The Pacific Palisades, Malibu, Altadena, and other seeded rows are labeled demo. The people, houses, photos,
          premiums, and rates are fictional illustrations so the desk is not empty. They are not quotes, not loss
          estimates, and not a statement about any real property or insurer.
        </p>
        <p>
          Demo sign-in has no password. Do not post information you need to keep private. Photos you upload are stored
          so other people using this prototype can see them.
        </p>
        <p>If you need coverage, talk to a licensed insurance professional. Do not rely on a number you see on Hearth.</p>
      </div>
    </article>
  );
}
