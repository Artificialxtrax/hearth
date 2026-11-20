import { randomUUID } from "node:crypto";
import type { BidStatus, Peril, RequestStatus, Role } from "@/lib/types";

export type Appetite = {
  states: string[];
  concerns: Array<"fire" | "flood" | "wind">;
};

export type StoredUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  desk: string | null;
  isDemo: boolean;
  createdAt: string;
  appetite?: Appetite;
};

export type StoredRequest = {
  id: string;
  homeownerId: string;
  city: string;
  state: string;
  zip: string;
  coverageAmount: number;
  peril: Peril;
  deductible: number;
  startDate: string;
  notes: string | null;
  status: RequestStatus;
  acceptedBidId: string | null;
  isDemo: boolean;
  createdAt: string;
};

export type StoredBid = {
  id: string;
  requestId: string;
  underwriterId: string;
  premiumAnnual: number;
  maxCoverage: number;
  terms: string;
  expiresAt: string;
  status: BidStatus;
  isDemo: boolean;
  createdAt: string;
};

export type StoredPhoto = {
  id: string;
  requestId: string;
  src: string;
  createdAt: string;
};

export type StoredIntake = {
  zip: string;
  state: string;
  homeType: "single-family" | "condo" | "townhouse" | "mobile";
  yearBuilt: number;
  roofAge: "0-5" | "6-15" | "16-25" | "25+";
  coverageAmount: number;
  concerns: Array<"fire" | "flood" | "wind">;
  claims: "none" | "one" | "two-or-more";
};

export type StoredMatch = {
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

export type StoredQuote = {
  id: string;
  homeownerId: string | null;
  intake: StoredIntake;
  matches: StoredMatch[];
  createdAt: string;
};

export type StoredQuoteRequest = {
  id: string;
  quoteId: string;
  homeownerId: string;
  homeownerName: string;
  underwriterId: string;
  summary: string;
  createdAt: string;
};

type Desk = {
  version: 2;
  users: StoredUser[];
  requests: StoredRequest[];
  bids: StoredBid[];
  photos: StoredPhoto[];
  quotes: StoredQuote[];
  quoteRequests: StoredQuoteRequest[];
};

const legal =
  "Non-binding indication of interest only. Not a binder, not a policy, and not an offer of insurance. Any real contract would be issued by a licensed carrier or broker. No premium is payable on Hearth.";

function terms(line: string) {
  return `${line} ${legal}`;
}

function ago(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function ahead(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

const photo = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80`;

function createDesk(): Desk {
  const elena = "a1000000-0000-4000-8000-000000000001";
  const david = "a1000000-0000-4000-8000-000000000002";
  const priya = "a1000000-0000-4000-8000-000000000003";
  const lena = "a1000000-0000-4000-8000-000000000004";
  const andre = "a1000000-0000-4000-8000-000000000005";
  const sofia = "a1000000-0000-4000-8000-000000000006";
  const jonah = "a1000000-0000-4000-8000-000000000007";
  const ruth = "a1000000-0000-4000-8000-000000000008";
  const chris = "a1000000-0000-4000-8000-000000000009";
  const maya = "a1000000-0000-4000-8000-000000000010";
  const paul = "a1000000-0000-4000-8000-000000000011";
  const june = "a1000000-0000-4000-8000-000000000021";
  const tomas = "a1000000-0000-4000-8000-000000000022";
  const naomi = "a1000000-0000-4000-8000-000000000023";
  const leo = "a1000000-0000-4000-8000-000000000024";

  const people: Array<[string, string, string, Role, string | null]> = [
    [elena, "elena.voss@demo.hearth", "Elena Voss", "homeowner", null],
    [david, "david.okonkwo@demo.hearth", "David Okonkwo", "homeowner", null],
    [priya, "priya.shah@demo.hearth", "Priya Shah", "homeowner", null],
    [lena, "lena.morales@demo.hearth", "Lena Morales", "homeowner", null],
    [andre, "andre.brooks@demo.hearth", "Andre Brooks", "homeowner", null],
    [sofia, "sofia.ellin@demo.hearth", "Sofia Ellin", "homeowner", null],
    [jonah, "jonah.keller@demo.hearth", "Jonah Keller", "homeowner", null],
    [ruth, "ruth.abebe@demo.hearth", "Ruth Abebe", "homeowner", null],
    [chris, "chris.hale@demo.hearth", "Chris Hale", "homeowner", null],
    [maya, "maya.lin@demo.hearth", "Maya Lin", "homeowner", null],
    [paul, "paul.ike@demo.hearth", "Paul Ike", "homeowner", null],
    [june, "june.adler@demo.hearth", "June Adler", "underwriter", "Cedar Syndicate"],
    [tomas, "tomas.reeve@demo.hearth", "Tomás Reeve", "underwriter", "Westwind Capacity"],
    [naomi, "naomi.chen@demo.hearth", "Naomi Chen", "underwriter", "Ash Line Re"],
    [leo, "leo.park@demo.hearth", "Leo Park", "underwriter", "Private desk"],
  ];
  const appetites: Record<string, Appetite> = {
    [june]: { states: ["CA"], concerns: ["fire", "wind"] },
    [tomas]: { states: ["CA"], concerns: ["fire"] },
    [naomi]: { states: ["CA"], concerns: ["fire", "flood"] },
    [leo]: { states: ["CA"], concerns: ["fire"] },
  };
  const users: StoredUser[] = people.map(([id, email, name, role, personDesk]) => ({
    id,
    email,
    name,
    role,
    desk: personDesk,
    isDemo: true,
    createdAt: ago(30),
    appetite: appetites[id],
  }));

  const requests: StoredRequest[] = [
    req("b1000000-0000-4000-8000-000000000001", elena, "Pacific Palisades", "90272", 2_400_000, "wildfire", 50_000, "2026-12-15", 16, "Hillside ranch above Via de la Paz. Composition roof, Class A, brush clearance done this spring. The admitted carrier non-renewed in March. This request is for the dwelling, not a full homeowners package."),
    req("b1000000-0000-4000-8000-000000000002", david, "Altadena", "91001", 1_150_000, "wildfire", 25_000, "2027-01-01", 14, "1924 bungalow on the east edge of Altadena, still standing after the Eaton fire. New defensible space, stucco exterior. Admitted markets will not quote the street."),
    req("b1000000-0000-4000-8000-000000000003", priya, "Malibu", "90265", 3_800_000, "wildfire", 100_000, "2026-12-01", 18, "Bluff house, concrete and stucco, hydrant within 200 feet. Contents are not requested. Wildfire and brush only."),
    req("b1000000-0000-4000-8000-000000000004", lena, "Topanga", "90290", 1_680_000, "wildfire", 35_000, "2027-01-15", 12, "Canyon lot with a single access road. Metal roof, 2021. Looking for dwelling coverage the FAIR Plan does not replace."),
    req("b1000000-0000-4000-8000-000000000005", andre, "La Cañada Flintridge", "91011", 2_100_000, "wildfire", 40_000, "2027-02-01", 9, "North of Foothill Boulevard. Tile roof, irrigated zone to the street. The carrier sent a non-renewal effective January."),
    req("b1000000-0000-4000-8000-000000000006", sofia, "Montecito", "93108", 2_750_000, "wildfire", 75_000, "2026-12-20", 11, "Above East Valley Road. The parcel is also in a debris-flow zone. This request is wildfire only."),
    req("b1000000-0000-4000-8000-000000000007", jonah, "Santa Rosa", "95404", 920_000, "wildfire", 15_000, "2027-01-10", 8, "Fountaingrove-adjacent. Rebuilt in 2019 after Tubbs with hardened eaves and enclosed soffits."),
    req("b1000000-0000-4000-8000-000000000008", ruth, "Lake Arrowhead", "92352", 1_340_000, "wildfire", 30_000, "2026-12-05", 15, "Primary home, wood siding, composition roof, community hydrant. Wildfire only."),
    req("b1000000-0000-4000-8000-000000000009", chris, "La Crescenta", "91214", 1_480_000, "wildfire", 25_000, "2027-02-15", 6, "Hillside above Honolulu Avenue. Stucco, Class A roof, ember-resistant vents replaced last year."),
    req("b1000000-0000-4000-8000-000000000010", maya, "Brentwood", "90049", 3_200_000, "wildfire", 50_000, "2027-01-05", 5, "North of Sunset, at the edge of the Palisades brush. Posted to see the spread against that book."),
    req("b1000000-0000-4000-8000-000000000011", paul, "Calabasas", "91302", 1_900_000, "wildfire", 40_000, "2027-03-01", 1, "Stokes Canyon side. Just posted. No inspection yet. Dwelling limit only."),
    req("b1000000-0000-4000-8000-000000000012", elena, "Pacific Palisades", "90272", 1_600_000, "earthquake", 80_000, "2026-12-15", 4, "Same Palisades dwelling. Earthquake only, a difference-in-conditions style limit, not a homeowners package."),
    {
      ...req("b1000000-0000-4000-8000-000000000013", lena, "Topanga", "90290", 640_000, "wildfire", 15_000, "2026-11-01", 22, "Guest house on the same Topanga parcel. In this demo, an indication has already been accepted. Nothing was bound."),
      status: "awarded",
      acceptedBidId: "c1000000-0000-4000-8000-000000000031",
    },
  ];

  const bids: StoredBid[] = [
    bid("c1000000-0000-4000-8000-000000000001", requests[0].id, june, 82800, 2_400_000, terms("Wildfire only. Ordinance or law excluded."), 14, 20),
    bid("c1000000-0000-4000-8000-000000000002", requests[0].id, tomas, 75600, 2_400_000, terms("Dwelling limit only. Extended replacement is not in this premium."), 9, 16),
    bid("c1000000-0000-4000-8000-000000000003", requests[0].id, naomi, 91200, 2_400_000, terms("Capacity behind a licensed fronting carrier."), 6, 12),
    bid("c1000000-0000-4000-8000-000000000004", requests[0].id, leo, 60000, 1_500_000, terms("Personal capacity. I would not write the full limit."), 2, 8),
    bid("c1000000-0000-4000-8000-000000000005", requests[1].id, naomi, 41400, 1_150_000, terms("Post-fire street. Inspection required before any real form."), 10, 14),
    bid("c1000000-0000-4000-8000-000000000006", requests[1].id, june, 45400, 1_150_000, terms("Wildfire only. Brush warranty would be a condition of a real policy."), 7, 11),
    bid("c1000000-0000-4000-8000-000000000007", requests[1].id, tomas, 48300, 1_150_000, terms("Higher rate for the Eaton scar."), 3, 9),
    bid("c1000000-0000-4000-8000-000000000008", requests[2].id, june, 102600, 3_800_000, terms("Bluff exposure. Dwelling only, no contents."), 15, 18),
    bid("c1000000-0000-4000-8000-000000000009", requests[2].id, tomas, 112100, 3_800_000, terms("Wildfire. Hydrant distance noted, not credited."), 8, 15),
    bid("c1000000-0000-4000-8000-000000000010", requests[2].id, naomi, 121600, 3_800_000, terms("Full limit available."), 4, 10),
    bid("c1000000-0000-4000-8000-000000000011", requests[2].id, leo, 77500, 2_500_000, terms("Partial limit. I stop at $2.5 million."), 1, 7),
    bid("c1000000-0000-4000-8000-000000000012", requests[3].id, tomas, 42840, 1_680_000, terms("Single-access canyon. Evacuation route is a pricing factor."), 9, 13),
    bid("c1000000-0000-4000-8000-000000000013", requests[3].id, june, 47040, 1_680_000, terms("Wildfire only. Metal roof noted."), 5, 12),
    bid("c1000000-0000-4000-8000-000000000014", requests[3].id, naomi, 51240, 1_680_000, terms("Full limit. A current brush report would be needed on a real file."), 2, 8),
    bid("c1000000-0000-4000-8000-000000000015", requests[4].id, tomas, 38850, 2_100_000, terms("Foothill exposure, irrigated setback noted."), 6, 14),
    bid("c1000000-0000-4000-8000-000000000016", requests[4].id, june, 43050, 2_100_000, terms("Wildfire. Tile roof credited in the rate."), 3, 11),
    bid("c1000000-0000-4000-8000-000000000017", requests[4].id, naomi, 48300, 2_100_000, terms("Full limit behind a fronting carrier."), 1, 9),
    bid("c1000000-0000-4000-8000-000000000018", requests[5].id, june, 56100, 2_750_000, terms("Wildfire only. Debris flow is excluded from this indication."), 8, 15),
    bid("c1000000-0000-4000-8000-000000000019", requests[5].id, naomi, 63250, 2_750_000, terms("Montecito brush. Full dwelling limit."), 4, 12),
    bid("c1000000-0000-4000-8000-000000000020", requests[5].id, leo, 70100, 2_750_000, terms("Personal capacity for the full limit, short expiry."), 2, 6),
    bid("c1000000-0000-4000-8000-000000000021", requests[6].id, tomas, 13340, 920_000, terms("Hardened rebuild. Rate reflects Tubbs-area history."), 6, 16),
    bid("c1000000-0000-4000-8000-000000000022", requests[6].id, june, 15640, 920_000, terms("Wildfire. Enclosed soffits noted."), 2, 10),
    bid("c1000000-0000-4000-8000-000000000023", requests[7].id, tomas, 38190, 1_340_000, terms("Mountain community. Seasonal access is acceptable here."), 11, 14),
    bid("c1000000-0000-4000-8000-000000000024", requests[7].id, june, 41540, 1_340_000, terms("Wildfire only. Wood siding is in the rate."), 6, 11),
    bid("c1000000-0000-4000-8000-000000000025", requests[7].id, naomi, 45560, 1_340_000, terms("Full limit."), 3, 9),
    bid("c1000000-0000-4000-8000-000000000026", requests[8].id, june, 33300, 1_480_000, terms("Foothill stucco. Vents noted."), 4, 13),
    bid("c1000000-0000-4000-8000-000000000027", requests[8].id, naomi, 37000, 1_480_000, terms("Full limit at a wider rate."), 1, 8),
    bid("c1000000-0000-4000-8000-000000000028", requests[9].id, tomas, 36800, 3_200_000, terms("Edge of the Palisades brush, not in 90272."), 4, 15),
    bid("c1000000-0000-4000-8000-000000000029", requests[9].id, june, 43200, 3_200_000, terms("Wildfire. Would still want a fuel map."), 2, 12),
    bid("c1000000-0000-4000-8000-000000000030", requests[9].id, naomi, 49600, 3_200_000, terms("Full limit. Priced as Westside edge, not canyon."), 1, 9),
    bid("c1000000-0000-4000-8000-000000000032", requests[11].id, june, 8800, 1_600_000, terms("Earthquake difference-in-conditions. Shake only."), 3, 20),
    bid("c1000000-0000-4000-8000-000000000033", requests[11].id, naomi, 11520, 1_600_000, terms("Earthquake capacity. Higher retention than the fire book."), 1, 12),
    { ...bid("c1000000-0000-4000-8000-000000000031", requests[12].id, june, 16640, 640_000, terms("Guest house. This demo indication is the one marked accepted."), 18, 30), status: "accepted" },
    { ...bid("c1000000-0000-4000-8000-000000000034", requests[12].id, tomas, 18560, 640_000, terms("Guest house, full limit. Closed after another indication was accepted."), 12, 20), status: "closed" },
  ];

  const photos: StoredPhoto[] = [
    ["b1000000-0000-4000-8000-000000000001", "photo-1564013799919-ab600027ffc6"],
    ["b1000000-0000-4000-8000-000000000002", "photo-1570129477492-45c003edd2be"],
    ["b1000000-0000-4000-8000-000000000003", "photo-1613490493576-7fde63acd811"],
    ["b1000000-0000-4000-8000-000000000004", "photo-1600585154340-be6161a56a0c"],
    ["b1000000-0000-4000-8000-000000000005", "photo-1600596542815-ffad4c1539a9"],
    ["b1000000-0000-4000-8000-000000000006", "photo-1600607687939-ce8a6c25118c"],
    ["b1000000-0000-4000-8000-000000000008", "photo-1449844908441-8829872d2607"],
    ["b1000000-0000-4000-8000-000000000010", "photo-1512917774080-9991f1c4c750"],
  ].map(([requestId, image], index) => ({
    id: `d1000000-0000-4000-8000-0000000000${String(index + 1).padStart(2, "0")}`,
    requestId,
    src: photo(image),
    createdAt: ago(10),
  }));

  return { version: 2, users, requests, bids, photos, quotes: [], quoteRequests: [] };
}

function req(
  id: string,
  homeownerId: string,
  city: string,
  zip: string,
  coverageAmount: number,
  peril: Peril,
  deductible: number,
  startDate: string,
  daysAgo: number,
  notes: string,
): StoredRequest {
  return {
    id,
    homeownerId,
    city,
    state: "CA",
    zip,
    coverageAmount,
    peril,
    deductible,
    startDate,
    notes,
    status: "open",
    acceptedBidId: null,
    isDemo: true,
    createdAt: ago(daysAgo),
  };
}

function bid(
  id: string,
  requestId: string,
  underwriterId: string,
  premiumAnnual: number,
  maxCoverage: number,
  bidTerms: string,
  createdDays: number,
  expiresDays: number,
): StoredBid {
  return {
    id,
    requestId,
    underwriterId,
    premiumAnnual,
    maxCoverage,
    terms: bidTerms,
    expiresAt: ahead(expiresDays),
    status: "active",
    isDemo: true,
    createdAt: ago(createdDays),
  };
}

const globalDesk = globalThis as typeof globalThis & { __hearthDesk?: Desk };

export function desk(): Desk {
  if (!globalDesk.__hearthDesk || globalDesk.__hearthDesk.version !== 2) globalDesk.__hearthDesk = createDesk();
  return globalDesk.__hearthDesk;
}

export function findUserById(id: string) {
  return desk().users.find((user) => user.id === id) ?? null;
}

export function findUserByEmail(email: string) {
  const needle = email.trim().toLowerCase();
  return desk().users.find((user) => user.email.toLowerCase() === needle) ?? null;
}

export function insertUser(input: { email: string; name: string; role: Role; desk: string | null }) {
  const user: StoredUser = {
    id: randomUUID(),
    email: input.email,
    name: input.name,
    role: input.role,
    desk: input.desk,
    isDemo: false,
    createdAt: new Date().toISOString(),
  };
  desk().users.push(user);
  return user;
}

export function insertRequest(input: Omit<StoredRequest, "id" | "status" | "acceptedBidId" | "isDemo" | "createdAt">) {
  const request: StoredRequest = {
    ...input,
    id: randomUUID(),
    status: "open",
    acceptedBidId: null,
    isDemo: false,
    createdAt: new Date().toISOString(),
  };
  desk().requests.push(request);
  return request;
}

export function insertPhoto(requestId: string, src: string) {
  desk().photos.push({
    id: randomUUID(),
    requestId,
    src,
    createdAt: new Date().toISOString(),
  });
}

export function placeBid(input: {
  requestId: string;
  underwriterId: string;
  premiumAnnual: number;
  maxCoverage: number;
  terms: string;
  expiresAt: string;
}) {
  const request = desk().requests.find((item) => item.id === input.requestId);
  if (!request || request.status !== "open" || request.homeownerId === input.underwriterId) return null;
  const id = randomUUID();
  for (const existing of desk().bids) {
    if (
      existing.requestId === request.id &&
      existing.underwriterId === input.underwriterId &&
      existing.status === "active"
    ) {
      existing.status = "withdrawn";
    }
  }
  desk().bids.push({
    id,
    requestId: request.id,
    underwriterId: input.underwriterId,
    premiumAnnual: input.premiumAnnual,
    maxCoverage: input.maxCoverage,
    terms: input.terms,
    expiresAt: input.expiresAt,
    status: "active",
    isDemo: false,
    createdAt: new Date().toISOString(),
  });
  return id;
}

export function acceptBid(input: { requestId: string; bidId: string; homeownerId: string }) {
  const now = Date.now();
  const request = desk().requests.find((item) => item.id === input.requestId);
  const bid = desk().bids.find((item) => item.id === input.bidId);
  if (!request || !bid) return false;
  if (request.homeownerId !== input.homeownerId || request.status !== "open") return false;
  if (bid.requestId !== request.id || bid.status !== "active") return false;
  if (new Date(bid.expiresAt).getTime() <= now) return false;
  request.status = "awarded";
  request.acceptedBidId = bid.id;
  bid.status = "accepted";
  for (const other of desk().bids) {
    if (other.requestId === request.id && other.id !== bid.id && other.status === "active") {
      other.status = "closed";
    }
  }
  return true;
}

export function withdrawRequest(input: { requestId: string; homeownerId: string }) {
  const request = desk().requests.find((item) => item.id === input.requestId);
  if (!request || request.homeownerId !== input.homeownerId || request.status !== "open") return false;
  request.status = "withdrawn";
  return true;
}

export function saveQuote(input: { homeownerId: string | null; intake: StoredIntake; matches: StoredMatch[] }) {
  const quote: StoredQuote = {
    id: randomUUID(),
    homeownerId: input.homeownerId,
    intake: input.intake,
    matches: input.matches,
    createdAt: new Date().toISOString(),
  };
  desk().quotes.push(quote);
  return quote;
}

export function findQuote(id: string) {
  return desk().quotes.find((quote) => quote.id === id) ?? null;
}

export function requestDeskQuote(input: {
  quoteId: string;
  underwriterId: string;
  homeownerId: string;
  homeownerName: string;
  summary: string;
}) {
  const existing = desk().quoteRequests.find(
    (item) => item.quoteId === input.quoteId && item.underwriterId === input.underwriterId && item.homeownerId === input.homeownerId,
  );
  if (existing) return existing;
  const created: StoredQuoteRequest = {
    id: randomUUID(),
    quoteId: input.quoteId,
    homeownerId: input.homeownerId,
    homeownerName: input.homeownerName,
    underwriterId: input.underwriterId,
    summary: input.summary,
    createdAt: new Date().toISOString(),
  };
  desk().quoteRequests.unshift(created);
  return created;
}

export function quoteRequestsFor(underwriterId: string) {
  return desk().quoteRequests.filter((item) => item.underwriterId === underwriterId);
}

export function withdrawBid(input: { requestId: string; bidId: string; underwriterId: string }) {
  const bid = desk().bids.find((item) => item.id === input.bidId);
  if (!bid || bid.requestId !== input.requestId || bid.underwriterId !== input.underwriterId || bid.status !== "active") {
    return false;
  }
  bid.status = "withdrawn";
  return true;
}
