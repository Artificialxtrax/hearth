import type { BookBid, MarketRow, Peril } from "@/lib/types";

export function impliedRate(premium: number, coverage: number): number | null {
  if (!Number.isFinite(premium) || !Number.isFinite(coverage) || premium <= 0 || coverage <= 0) {
    return null;
  }
  return premium / coverage;
}

export function offeredCoverage(maxCoverage: number, requested: number): number {
  return Math.min(maxCoverage, requested);
}

export function isLiveBid(bid: Pick<BookBid, "status" | "expiresAt">, now: number): boolean {
  return bid.status === "active" && new Date(bid.expiresAt).getTime() > now;
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid] ?? null;
  const left = sorted[mid - 1];
  const right = sorted[mid];
  if (left === undefined || right === undefined) return null;
  return (left + right) / 2;
}

export type BookStats<T extends BookBid> = {
  full: T[];
  partial: T[];
  resting: T[];
  best: T | null;
  spread: number | null;
  implied: number | null;
  liveCount: number;
};

export function bookStats<T extends BookBid>(bids: T[], requested: number, now: number): BookStats<T> {
  const live = bids.filter((bid) => isLiveBid(bid, now));
  const resting = bids.filter((bid) => !isLiveBid(bid, now));
  const full = live
    .filter((bid) => bid.maxCoverage >= requested)
    .sort((a, b) => a.premiumAnnual - b.premiumAnnual || a.createdAt.localeCompare(b.createdAt));
  const partial = live
    .filter((bid) => bid.maxCoverage < requested)
    .sort((a, b) => {
      const aRate = a.premiumAnnual / offeredCoverage(a.maxCoverage, requested);
      const bRate = b.premiumAnnual / offeredCoverage(b.maxCoverage, requested);
      return aRate - bRate;
    });
  const best = full[0] ?? null;
  const next = full[1] ?? null;
  const spread = best && next ? next.premiumAnnual - best.premiumAnnual : null;
  const implied = best ? impliedRate(best.premiumAnnual, requested) : null;
  return {
    full,
    partial,
    resting,
    best,
    spread,
    implied,
    liveCount: full.length + partial.length,
  };
}

export function discoverySeries(bids: BookBid[], requested: number): { at: string; rate: number }[] {
  const relevant = bids
    .filter((bid) => bid.status !== "withdrawn" && bid.maxCoverage >= requested)
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  let best = Number.POSITIVE_INFINITY;
  const points: { at: string; rate: number }[] = [];
  for (const bid of relevant) {
    const rate = impliedRate(bid.premiumAnnual, requested);
    if (rate == null) continue;
    if (rate < best) best = rate;
    points.push({ at: bid.createdAt, rate: best });
  }
  return points;
}

export type OpenRequestForMarket = {
  zip: string;
  city: string;
  state: string;
  peril: Peril;
  coverageAmount: number;
  isDemo: boolean;
  bestRate: number | null;
  liveBids: number;
};

export function aggregateMarket(requests: OpenRequestForMarket[]): MarketRow[] {
  const groups = new Map<string, OpenRequestForMarket[]>();
  for (const request of requests) {
    const key = `${request.zip}:${request.peril}`;
    const list = groups.get(key);
    if (list) list.push(request);
    else groups.set(key, [request]);
  }

  const rows: MarketRow[] = [];
  for (const list of groups.values()) {
    const first = list[0];
    if (!first) continue;
    const rates = list.map((item) => item.bestRate).filter((rate): rate is number => rate != null);
    rows.push({
      zip: first.zip,
      city: first.city,
      state: first.state,
      peril: first.peril,
      openRequests: list.length,
      liveBids: list.reduce((sum, item) => sum + item.liveBids, 0),
      coverageSought: list.reduce((sum, item) => sum + item.coverageAmount, 0),
      bestRate: rates.length ? Math.min(...rates) : null,
      medianRate: median(rates),
      demoRequests: list.filter((item) => item.isDemo).length,
    });
  }

  return rows.sort((a, b) => {
    const aRate = a.bestRate ?? -1;
    const bRate = b.bestRate ?? -1;
    if (bRate !== aRate) return bRate - aRate;
    return a.zip.localeCompare(b.zip);
  });
}
