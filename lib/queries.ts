import { connection } from "next/server";
import { FIRE_ZONES } from "@/lib/areas";
import { aggregateMarket, bookStats } from "@/lib/book";
import { desk, findUserByEmail as findStoredUser } from "@/lib/store";
import type { Bid, BookBid, CoverageRequest, MarketRow, Peril, RequestStatus, RequestSummary, Role, User } from "@/lib/types";
import "server-only";

function asPeril(value: string): Peril | null {
  switch (value) {
    case "wildfire":
    case "earthquake":
    case "flood":
    case "wind":
    case "landslide":
      return value;
    default:
      return null;
  }
}

function asStatus(value: string): RequestStatus | null {
  switch (value) {
    case "open":
    case "awarded":
    case "withdrawn":
      return value;
    default:
      return null;
  }
}

function toUser(row: { id: string; email: string; name: string; role: Role; desk: string | null; isDemo: boolean }): User {
  return row;
}

function bidsFor(requestId: string): Bid[] {
  const book = desk();
  return book.bids
    .filter((bid) => bid.requestId === requestId)
    .map((bid) => {
      const underwriter = book.users.find((user) => user.id === bid.underwriterId);
      return {
        id: bid.id,
        requestId: bid.requestId,
        underwriterId: bid.underwriterId,
        underwriterName: underwriter?.name ?? "Underwriter",
        desk: underwriter?.desk ?? null,
        premiumAnnual: bid.premiumAnnual,
        maxCoverage: bid.maxCoverage,
        terms: bid.terms,
        expiresAt: bid.expiresAt,
        status: bid.status,
        isDemo: bid.isDemo,
        createdAt: bid.createdAt,
      } satisfies Bid;
    })
    .sort((a, b) => a.premiumAnnual - b.premiumAnnual || a.createdAt.localeCompare(b.createdAt));
}

function photosFor(requestId: string) {
  return desk()
    .photos.filter((photo) => photo.requestId === requestId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((photo) => ({ id: photo.id, src: photo.src }));
}

function toRequest(requestId: string): CoverageRequest | null {
  const book = desk();
  const row = book.requests.find((item) => item.id === requestId);
  if (!row) return null;
  const homeowner = book.users.find((user) => user.id === row.homeownerId);
  return {
    ...row,
    homeownerName: homeowner?.name ?? "Homeowner",
    photos: photosFor(row.id),
    bids: bidsFor(row.id),
  };
}

function toSummary(request: CoverageRequest): RequestSummary {
  const bids: BookBid[] = request.bids;
  return { ...request, bids };
}

export async function getServerNow(): Promise<number> {
  await connection();
  return Date.now();
}

export async function listDemoUsers(): Promise<User[]> {
  await connection();
  return desk()
    .users.filter((user) => user.isDemo)
    .sort((a, b) => a.role.localeCompare(b.role) || a.name.localeCompare(b.name))
    .map(toUser);
}

export async function findUserByEmail(email: string): Promise<User | null> {
  await connection();
  const user = findStoredUser(email);
  return user ? toUser(user) : null;
}

export async function getRequest(id: string): Promise<{ request: CoverageRequest; now: number } | null> {
  await connection();
  const request = toRequest(id);
  if (!request) return null;
  return { request, now: Date.now() };
}

export type RequestFilters = {
  peril?: string;
  zip?: string;
  status?: string;
  sort?: string;
};

export async function listRequests(filters: RequestFilters): Promise<{ requests: RequestSummary[]; now: number }> {
  const peril = asPeril(filters.peril ?? "");
  const status = asStatus(filters.status ?? "open") ?? "open";
  const showAll = filters.status === "all";
  const zip = filters.zip && /^\d{5}$/.test(filters.zip) ? filters.zip : null;
  await connection();
  const now = Date.now();
  const requests = desk()
    .requests.filter((request) => (showAll || request.status === status) && (!peril || request.peril === peril) && (!zip || request.zip === zip))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 100)
    .flatMap((row) => {
      const request = toRequest(row.id);
      return request ? [toSummary(request)] : [];
    });

  if (filters.sort === "rate") {
    requests.sort((a, b) => {
      const aRate = bookStats(a.bids, a.coverageAmount, now).implied ?? -1;
      const bRate = bookStats(b.bids, b.coverageAmount, now).implied ?? -1;
      return bRate - aRate;
    });
  }
  return { requests, now };
}

export async function getMarket(): Promise<{
  rows: MarketRow[];
  openCount: number;
  demoCount: number;
  postedCount: number;
  now: number;
}> {
  const { requests, now } = await listRequests({ status: "open" });
  const inputs = requests.map((request) => {
    const stats = bookStats(request.bids, request.coverageAmount, now);
    return {
      zip: request.zip,
      city: request.city,
      state: request.state,
      peril: request.peril,
      coverageAmount: request.coverageAmount,
      isDemo: request.isDemo,
      bestRate: stats.implied,
      liveBids: stats.liveCount,
    };
  });
  return {
    rows: aggregateMarket(inputs),
    openCount: requests.length,
    demoCount: requests.filter((request) => request.isDemo).length,
    postedCount: requests.filter((request) => !request.isDemo).length,
    now,
  };
}

export async function getFeaturedRequest(): Promise<{ request: CoverageRequest; now: number } | null> {
  await connection();
  const match = desk()
    .requests.filter((request) => request.status === "open" && request.zip === "90272" && request.peril === "wildfire")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
  if (!match) return null;
  return getRequest(match.id);
}

export async function listMine(user: User): Promise<{
  requests: RequestSummary[];
  bids: (Bid & { city: string; zip: string; peril: Peril; requestStatus: RequestStatus })[];
  now: number;
}> {
  await connection();
  const now = Date.now();
  if (user.role === "homeowner") {
    const requests = desk()
      .requests.filter((request) => request.homeownerId === user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .flatMap((row) => {
        const request = toRequest(row.id);
        return request ? [toSummary(request)] : [];
      });
    return { requests, bids: [], now };
  }

  const bids = desk()
    .bids.filter((bid) => bid.underwriterId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .flatMap((bid) => {
      const request = desk().requests.find((item) => item.id === bid.requestId);
      const full = bidsFor(bid.requestId).find((item) => item.id === bid.id);
      const peril = request ? asPeril(request.peril) : null;
      const requestStatus = request ? asStatus(request.status) : null;
      if (!request || !full || !peril || !requestStatus) return [];
      return [{ ...full, city: request.city, zip: request.zip, peril, requestStatus }];
    });
  return { requests: [], bids, now };
}

export function zoneByZip(zip: string) {
  return FIRE_ZONES.find((zone) => zone.zip === zip) ?? null;
}
