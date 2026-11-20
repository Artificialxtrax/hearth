import assert from "node:assert/strict";
import test from "node:test";
import { estimatePremium, rankMatches, type CarrierRecord, type Intake } from "./rank.ts";

const intake: Intake = {
  zip: "90272",
  state: "CA",
  homeType: "single-family",
  yearBuilt: 1978,
  roofAge: "6-15",
  coverageAmount: 1_000_000,
  concerns: ["fire"],
  claims: "none",
};

const carriers: CarrierRecord[] = [
  {
    id: "ca-fair-plan",
    name: "California FAIR Plan",
    states: ["CA"],
    risks: ["fire"],
    wildfireLimitedStates: [],
    quoteUrl: "https://www.cfpnet.com/",
    source: "California FAIR Plan public site",
    note: "Basic fire coverage.",
  },
  {
    id: "citizens",
    name: "Citizens",
    states: ["FL"],
    risks: ["wind"],
    wildfireLimitedStates: [],
    quoteUrl: "https://www.citizensfla.com/",
    source: "Citizens public site",
    note: "Florida only.",
  },
  {
    id: "neptune",
    name: "Neptune Flood",
    states: ["*"],
    risks: ["flood"],
    wildfireLimitedStates: [],
    quoteUrl: "https://neptuneflood.com/",
    source: "Neptune Flood public site",
    note: "Flood only.",
  },
];

test("a California fire intake keeps Florida wind and flood-only carriers out", () => {
  const matches = rankMatches(intake, carriers, []);
  assert.deepEqual(matches.map((match) => match.name), ["California FAIR Plan"]);
  assert.equal(matches[0]?.label, "Likely to quote");
});

test("a desk underwriter who opted in ranks as ready to quote", () => {
  const matches = rankMatches(intake, carriers, [
    {
      underwriterId: "june",
      name: "June Adler",
      desk: "Cedar Syndicate",
      optedIn: true,
      similarBids: 2,
      impliedRate: 0.03,
    },
  ]);
  assert.equal(matches[0]?.name, "Cedar Syndicate");
  assert.equal(matches[0]?.label, "Ready to quote");
  assert.ok(matches[0] && matches[0].score > (matches[1]?.score ?? 0));
});

test("premium estimate is a range around the coverage", () => {
  const range = estimatePremium(intake, 0.02);
  assert.ok(range.low < range.high);
  assert.ok(range.low > 10_000);
  assert.ok(range.high < 40_000);
});
