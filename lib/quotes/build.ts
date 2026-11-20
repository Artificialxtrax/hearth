import carriers from "@/data/carriers.json";
import { explainMatches } from "@/lib/ai/explain";
import { rankMatches, type CarrierRecord, type Concern, type DeskCandidate, type Intake } from "@/lib/quotes/rank";
import { desk, type StoredBid, type StoredRequest } from "@/lib/store";

const PERIL_CONCERN: Record<string, Concern | null> = {
  wildfire: "fire",
  flood: "flood",
  wind: "wind",
  earthquake: null,
  landslide: null,
};

function concernForPeril(peril: string): Concern | null {
  return PERIL_CONCERN[peril] ?? null;
}

function similarBids(underwriterId: string, intake: Intake) {
  const book = desk();
  const bids = book.bids.filter((bid) => bid.underwriterId === underwriterId && bid.status !== "withdrawn");
  const relevant: Array<{ bid: StoredBid; request: StoredRequest }> = [];
  for (const bid of bids) {
    const request = book.requests.find((item) => item.id === bid.requestId);
    if (!request || request.state !== intake.state) continue;
    const concern = concernForPeril(request.peril);
    if (!concern || !intake.concerns.includes(concern)) continue;
    relevant.push({ bid, request });
  }
  if (relevant.length === 0) return { count: 0, rate: null as number | null };
  const rates = relevant
    .map((item) => (item.request.coverageAmount > 0 ? item.bid.premiumAnnual / item.request.coverageAmount : null))
    .filter((rate): rate is number => rate != null && rate > 0);
  const rate = rates.length ? rates.reduce((sum, value) => sum + value, 0) / rates.length : null;
  return { count: relevant.length, rate };
}

export function deskCandidatesFor(intake: Intake): DeskCandidate[] {
  return desk()
    .users.filter((user) => user.role === "underwriter")
    .flatMap((user) => {
      const similar = similarBids(user.id, intake);
      const optedIn = Boolean(
        user.appetite?.states.includes(intake.state) && user.appetite.concerns.some((concern) => intake.concerns.includes(concern)),
      );
      if (!optedIn && similar.count === 0) return [];
      return [
        {
          underwriterId: user.id,
          name: user.name,
          desk: user.desk,
          optedIn,
          similarBids: similar.count,
          impliedRate: similar.rate,
        },
      ];
    });
}

export async function matchIntake(intake: Intake) {
  const ranked = rankMatches(intake, carriers as CarrierRecord[], deskCandidatesFor(intake));
  return explainMatches(intake, ranked);
}
