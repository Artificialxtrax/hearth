import assert from "node:assert/strict";
import test from "node:test";
import { aggregateMarket, bookStats, discoverySeries, impliedRate, median } from "./book.ts";
import type { BookBid } from "./types.ts";

const now = Date.parse("2026-11-19T18:00:00.000Z");

function bid(partial: Partial<BookBid> & Pick<BookBid, "id" | "premiumAnnual" | "maxCoverage">): BookBid {
  return {
    status: "active",
    expiresAt: "2026-12-19T18:00:00.000Z",
    createdAt: "2026-11-01T18:00:00.000Z",
    ...partial,
  };
}

test("implied rate is premium divided by coverage", () => {
  assert.equal(impliedRate(75600, 2_400_000), 0.0315);
  assert.equal(impliedRate(0, 100), null);
  assert.equal(impliedRate(100, 0), null);
});

test("best bid is the lowest live full-cover premium", () => {
  const stats = bookStats(
    [
      bid({ id: "partial", premiumAnnual: 1000, maxCoverage: 50_000, createdAt: "2026-11-02T00:00:00.000Z" }),
      bid({ id: "high", premiumAnnual: 9000, maxCoverage: 200_000, createdAt: "2026-11-03T00:00:00.000Z" }),
      bid({ id: "best", premiumAnnual: 7000, maxCoverage: 200_000, createdAt: "2026-11-04T00:00:00.000Z" }),
      bid({
        id: "expired",
        premiumAnnual: 1000,
        maxCoverage: 200_000,
        expiresAt: "2026-11-01T00:00:00.000Z",
      }),
      bid({ id: "pulled", premiumAnnual: 500, maxCoverage: 200_000, status: "withdrawn" }),
    ],
    200_000,
    now,
  );
  assert.equal(stats.best?.id, "best");
  assert.equal(stats.spread, 2000);
  assert.equal(stats.implied, 0.035);
  assert.equal(stats.liveCount, 3);
  assert.equal(stats.partial[0]?.id, "partial");
  assert.equal(stats.resting.length, 2);
});

test("spread is empty when a second full-cover bid is missing", () => {
  const stats = bookStats([bid({ id: "only", premiumAnnual: 4000, maxCoverage: 100_000 })], 100_000, now);
  assert.equal(stats.spread, null);
  assert.equal(stats.best?.id, "only");
});

test("discovery series keeps the running best rate", () => {
  const points = discoverySeries(
    [
      bid({ id: "a", premiumAnnual: 3000, maxCoverage: 100_000, createdAt: "2026-11-01T00:00:00.000Z" }),
      bid({ id: "b", premiumAnnual: 5000, maxCoverage: 100_000, createdAt: "2026-11-02T00:00:00.000Z" }),
      bid({ id: "c", premiumAnnual: 2000, maxCoverage: 100_000, createdAt: "2026-11-03T00:00:00.000Z" }),
    ],
    100_000,
  );
  assert.deepEqual(
    points.map((point) => point.rate),
    [0.03, 0.03, 0.02],
  );
});

test("median and area aggregation", () => {
  assert.equal(median([]), null);
  assert.equal(median([0.02, 0.04]), 0.03);
  assert.equal(median([0.01, 0.02, 0.09]), 0.02);
  const rows = aggregateMarket([
    {
      zip: "90272",
      city: "Pacific Palisades",
      state: "CA",
      peril: "wildfire",
      coverageAmount: 1_000_000,
      isDemo: true,
      bestRate: 0.04,
      liveBids: 2,
    },
    {
      zip: "90272",
      city: "Pacific Palisades",
      state: "CA",
      peril: "wildfire",
      coverageAmount: 2_000_000,
      isDemo: false,
      bestRate: 0.02,
      liveBids: 1,
    },
  ]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.bestRate, 0.02);
  assert.equal(rows[0]?.medianRate, 0.03);
  assert.equal(rows[0]?.coverageSought, 3_000_000);
  assert.equal(rows[0]?.demoRequests, 1);
  assert.equal(rows[0]?.liveBids, 3);
});
