import Link from "next/link";
import { FIRE_ZONES } from "@/lib/areas";
import { formatMoney, formatRate, perilLabel, rateTone, type RateTone } from "@/lib/format";
import type { MarketRow, Peril } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DemoChip } from "@/components/chips";

function toneClass(tone: RateTone): string {
  switch (tone) {
    case "sage":
      return "bg-white text-ink";
    case "ochre":
      return "bg-white text-ink";
    case "ember":
      return "bg-white text-ink";
    case "deep":
      return "hero-pop text-white";
    case "empty":
      return "bg-paper-2 text-ink";
    default: {
      const unreachable: never = tone;
      return unreachable;
    }
  }
}

export function MarketBoard({
  rows,
  demoCount,
  postedCount,
  variant = "full",
}: {
  rows: MarketRow[];
  demoCount: number;
  postedCount: number;
  variant?: "full" | "strip";
}) {
  const wildfire = rows.filter((row) => row.peril === "wildfire");
  const hottest = wildfire.filter((row) => row.bestRate != null).slice(0, 4);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="max-w-2xl text-sm leading-6 text-ink-soft">
          Seeded demo indications: {demoCount}. Posted in this prototype: {postedCount}. Color is the best full-cover
          implied rate, premium divided by coverage. It is a price on the desk, not a forecast of loss.
        </p>
        <p className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">Demo data · not quotes</p>
      </div>

      {variant === "strip" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {hottest.map((row) => (
            <ZoneTile key={`${row.zip}-${row.peril}`} row={row} city={row.city} region={row.state} />
          ))}
        </div>
      ) : (
        <>
          <div className="zone-board">
            {FIRE_ZONES.map((zone) => {
              const row = wildfire.find((item) => item.zip === zone.zip) ?? null;
              const also = rows.filter((item) => item.zip === zone.zip && item.peril !== "wildfire");
              return (
                <div key={zone.zip} className="zone-tile" style={{ ["--col" as string]: zone.col, ["--row" as string]: zone.row }}>
                  <ZoneTile row={row} city={zone.city} region={zone.region} zip={zone.zip} also={also.map((item) => item.peril)} />
                </div>
              );
            })}
            <div className="soft-card zone-tile hidden p-5 md:block" style={{ ["--col" as string]: 4, ["--row" as string]: 3 }}>
              <p className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">Open ground</p>
              <p className="mt-3 font-display text-2xl leading-tight text-ink">Post a ZIP that is not on this board.</p>
              <Link href="/requests/new" className="mt-4 inline-block text-sm underline decoration-ember underline-offset-4">
                Post a request
              </Link>
            </div>
          </div>
          <p className="text-xs leading-5 text-muted">
            Tiles run west to east, from the Santa Monica Mountains toward the San Gabriels, then out to the mountains
            and the North Bay. This is a desk layout, not a map.
          </p>
          <MarketTable rows={rows} />
        </>
      )}
    </section>
  );
}

function ZoneTile({
  row,
  city,
  region,
  zip,
  also = [],
}: {
  row: MarketRow | null;
  city: string;
  region: string;
  zip?: string;
  also?: Peril[];
}) {
  const tone = toneClass(rateTone(row?.bestRate ?? null));
  const href = row ? `/requests?zip=${row.zip}&peril=${row.peril}` : `/requests?zip=${zip ?? ""}`;
  return (
    <Link href={href} className={cn("lift flex h-full min-h-40 flex-col justify-between rounded-3xl p-4 shadow-sm", tone)}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-[11px] tracking-[0.14em] uppercase">{row?.zip ?? zip}</p>
          <p className="mt-1 font-display text-2xl leading-none">{city}</p>
        </div>
        {row && row.demoRequests === row.openRequests ? <DemoChip /> : null}
        {row && row.demoRequests > 0 && row.demoRequests < row.openRequests ? (
          <span className="font-mono text-[10px] tracking-wide uppercase">Mixed</span>
        ) : null}
      </div>
      <div>
        <p className="font-mono text-2xl">{row?.bestRate != null ? formatRate(row.bestRate) : "No bid"}</p>
        <p className="mt-1 text-xs opacity-80">
          {row ? `${row.openRequests} open · ${formatMoney(row.coverageSought)} sought` : "No open wildfire book"}
          {also.length ? ` · also ${also.map((peril) => perilLabel(peril).toLowerCase()).join(", ")}` : ""}
        </p>
        <p className="mt-1 text-[11px] opacity-70">{region}</p>
      </div>
    </Link>
  );
}

function MarketTable({ rows }: { rows: MarketRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="soft-card px-6 py-10 text-sm leading-6 text-ink-soft">
        The desk is quiet right now. When a homeowner posts a request, a friendly price will show up here.
      </p>
    );
  }
  return (
    <div className="soft-card overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <caption className="bg-ink px-4 py-3 text-left text-xs font-bold tracking-wide text-white">
          Implied annual risk by ZIP and peril. Demo rows are seeded and labeled. They are not quotes.
        </caption>
        <thead className="bg-paper-2 font-mono text-[11px] tracking-[0.12em] text-muted uppercase">
          <tr>
            <th className="px-3 py-2 font-medium">ZIP</th>
            <th className="px-3 py-2 font-medium">Area</th>
            <th className="px-3 py-2 font-medium">Peril</th>
            <th className="px-3 py-2 font-medium">Open</th>
            <th className="px-3 py-2 font-medium">Bids</th>
            <th className="px-3 py-2 font-medium">Coverage sought</th>
            <th className="px-3 py-2 font-medium">Best rate</th>
            <th className="px-3 py-2 font-medium">Median rate</th>
            <th className="px-3 py-2 font-medium">Source</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.zip}-${row.peril}`} className="border-t border-line">
              <td className="px-3 py-3 font-mono">
                <Link href={`/requests?zip=${row.zip}&peril=${row.peril}`} className="underline decoration-ember underline-offset-4">
                  {row.zip}
                </Link>
              </td>
              <td className="px-3 py-3">
                {row.city}, {row.state}
              </td>
              <td className="px-3 py-3">{perilLabel(row.peril)}</td>
              <td className="px-3 py-3 font-mono">{row.openRequests}</td>
              <td className="px-3 py-3 font-mono">{row.liveBids}</td>
              <td className="px-3 py-3 font-mono">{formatMoney(row.coverageSought)}</td>
              <td className="px-3 py-3 font-mono">{row.bestRate == null ? "—" : formatRate(row.bestRate)}</td>
              <td className="px-3 py-3 font-mono">{row.medianRate == null ? "—" : formatRate(row.medianRate)}</td>
              <td className="px-3 py-3">
                {row.demoRequests === row.openRequests ? (
                  <DemoChip />
                ) : row.demoRequests === 0 ? (
                  "Posted here"
                ) : (
                  `${row.demoRequests} demo`
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
