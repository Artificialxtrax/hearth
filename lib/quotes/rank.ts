export type Concern = "fire" | "flood" | "wind";
export type HomeType = "single-family" | "condo" | "townhouse" | "mobile";
export type RoofAge = "0-5" | "6-15" | "16-25" | "25+";
export type Claims = "none" | "one" | "two-or-more";

export type Intake = {
  zip: string;
  state: string;
  homeType: HomeType;
  yearBuilt: number;
  roofAge: RoofAge;
  coverageAmount: number;
  concerns: Concern[];
  claims: Claims;
};

export type CarrierRecord = {
  id: string;
  name: string;
  states: string[];
  risks: Concern[];
  wildfireLimitedStates: string[];
  quoteUrl: string;
  source: string;
  note: string;
};

export type DeskCandidate = {
  underwriterId: string;
  name: string;
  desk: string | null;
  optedIn: boolean;
  similarBids: number;
  impliedRate: number | null;
};

export type RankedMatch = {
  id: string;
  kind: "desk" | "carrier";
  name: string;
  label: "Ready to quote" | "Likely to quote";
  reason: string;
  premiumLow: number;
  premiumHigh: number;
  score: number;
  underwriterId?: string;
  quoteUrl?: string;
  source: string;
};

const BASE_RATE: Record<Concern, number> = {
  fire: 0.018,
  wind: 0.012,
  flood: 0.008,
};

function writesState(carrier: CarrierRecord, state: string) {
  return carrier.states.includes("*") || carrier.states.includes(state);
}

function concernRate(concerns: Concern[], state: string) {
  if (concerns.length === 0) return 0.006;
  const rates = concerns.map((concern) => {
    if (concern === "fire" && state === "CA") return 0.028;
    if (concern === "wind" && (state === "FL" || state === "LA" || state === "TX")) return 0.02;
    return BASE_RATE[concern];
  });
  return Math.max(...rates);
}

function roofFactor(roofAge: RoofAge) {
  switch (roofAge) {
    case "0-5":
      return 0.9;
    case "6-15":
      return 1;
    case "16-25":
      return 1.15;
    case "25+":
      return 1.35;
    default: {
      const unreachable: never = roofAge;
      return unreachable;
    }
  }
}

function claimsFactor(claims: Claims) {
  switch (claims) {
    case "none":
      return 1;
    case "one":
      return 1.12;
    case "two-or-more":
      return 1.35;
    default: {
      const unreachable: never = claims;
      return unreachable;
    }
  }
}

function homeFactor(homeType: HomeType) {
  switch (homeType) {
    case "single-family":
      return 1;
    case "townhouse":
      return 0.9;
    case "condo":
      return 0.72;
    case "mobile":
      return 1.2;
    default: {
      const unreachable: never = homeType;
      return unreachable;
    }
  }
}

export function estimatePremium(intake: Intake, rate: number) {
  const adjusted =
    rate *
    roofFactor(intake.roofAge) *
    claimsFactor(intake.claims) *
    homeFactor(intake.homeType) *
    (intake.yearBuilt < 1970 ? 1.08 : 1);
  const mid = Math.round((intake.coverageAmount * adjusted) / 50) * 50;
  const low = Math.max(250, Math.round((mid * 0.85) / 50) * 50);
  const high = Math.round((mid * 1.2) / 50) * 50;
  return { low, high };
}

function concernLabel(concern: Concern) {
  switch (concern) {
    case "fire":
      return "fire";
    case "flood":
      return "flood";
    case "wind":
      return "wind";
    default: {
      const unreachable: never = concern;
      return unreachable;
    }
  }
}

function deskReason(candidate: DeskCandidate, intake: Intake) {
  const place = `${intake.state} ${intake.zip}`;
  if (candidate.similarBids > 0 && candidate.optedIn) {
    return `${candidate.desk ?? candidate.name} already prices this kind of risk in ${place}, and they opted in. They are on the Hearth desk, so a request reaches them directly.`;
  }
  if (candidate.similarBids > 0) {
    return `${candidate.desk ?? candidate.name} has bid on similar ${intake.concerns.map(concernLabel).join(" and ")} risks in ${intake.state}. That is a real willingness on this desk, not a guess.`;
  }
  return `${candidate.desk ?? candidate.name} opted in to ${intake.concerns.map(concernLabel).join(" and ")} in ${intake.state}. They have not been asked to bind anything.`;
}

function carrierReason(carrier: CarrierRecord, intake: Intake) {
  const risks = carrier.risks.filter((risk) => intake.concerns.includes(risk));
  const limited = intake.concerns.includes("fire") && carrier.wildfireLimitedStates.includes(intake.state);
  const focus = risks.length ? risks.map(concernLabel).join(" and ") : "homeowners";
  const limitSentence = limited
    ? ` New ${intake.state} wildfire business is sometimes limited, so this is only a place to ask.`
    : "";
  return `${carrier.name} publicly offers ${focus} coverage for ${intake.state}. ${carrier.note}${limitSentence} Hearth has not been told they will take this home.`;
}

export function rankMatches(intake: Intake, carriers: CarrierRecord[], deskCandidates: DeskCandidate[]): RankedMatch[] {
  const deskMatches: RankedMatch[] = deskCandidates.map((candidate) => {
    let score = 58;
    if (candidate.optedIn) score += 18;
    if (candidate.similarBids > 0) score += Math.min(16, candidate.similarBids * 6);
    if (intake.claims === "two-or-more") score -= 6;
    const rate = candidate.impliedRate ?? concernRate(intake.concerns, intake.state);
    const premium = estimatePremium(intake, rate);
    return {
      id: `desk-${candidate.underwriterId}`,
      kind: "desk",
      name: candidate.desk ?? candidate.name,
      label: "Ready to quote",
      reason: deskReason(candidate, intake),
      premiumLow: premium.low,
      premiumHigh: premium.high,
      score: Math.max(1, Math.min(99, score)),
      underwriterId: candidate.underwriterId,
      source: "Hearth desk bid or opt-in",
    };
  });

  const carrierMatches: RankedMatch[] = carriers
    .filter((carrier) => writesState(carrier, intake.state))
    .filter((carrier) => carrier.risks.some((risk) => intake.concerns.includes(risk)))
    .map((carrier) => {
      const overlap = carrier.risks.filter((risk) => intake.concerns.includes(risk)).length;
      let score = 46 + overlap * 8;
      if (carrier.states.length === 1) score += 6;
      if (intake.concerns.includes("fire") && carrier.wildfireLimitedStates.includes(intake.state)) score -= 12;
      if (intake.claims === "two-or-more") score -= 8;
      if (intake.roofAge === "25+") score -= 4;
      if (intake.concerns.includes("fire") && intake.state === "CA" && carrier.id === "ca-fair-plan") score += 14;
      if (intake.concerns.includes("fire") && intake.state === "CA" && carrier.id === "bamboo") score += 10;
      if (intake.concerns.includes("wind") && intake.state === "FL" && carrier.id === "citizens") score += 10;
      const premium = estimatePremium(intake, concernRate(intake.concerns, intake.state));
      return {
        id: `carrier-${carrier.id}`,
        kind: "carrier" as const,
        name: carrier.name,
        label: "Likely to quote" as const,
        reason: carrierReason(carrier, intake),
        premiumLow: premium.low,
        premiumHigh: premium.high,
        score: Math.max(1, Math.min(99, score)),
        quoteUrl: carrier.quoteUrl,
        source: carrier.source,
      };
    });

  return [...deskMatches, ...carrierMatches].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)).slice(0, 8);
}
