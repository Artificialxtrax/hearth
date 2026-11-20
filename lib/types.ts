export const PERILS = ["wildfire", "earthquake", "flood", "wind", "landslide"] as const;
export const ROLES = ["homeowner", "underwriter"] as const;
export const REQUEST_STATUSES = ["open", "awarded", "withdrawn"] as const;
export const BID_STATUSES = ["active", "accepted", "closed", "withdrawn"] as const;

export type Peril = (typeof PERILS)[number];
export type Role = (typeof ROLES)[number];
export type RequestStatus = (typeof REQUEST_STATUSES)[number];
export type BidStatus = (typeof BID_STATUSES)[number];
export type BidDisplayStatus = BidStatus | "expired";

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  desk: string | null;
  isDemo: boolean;
};

export type BookBid = {
  id: string;
  premiumAnnual: number;
  maxCoverage: number;
  status: BidStatus;
  expiresAt: string;
  createdAt: string;
};

export type Bid = BookBid & {
  requestId: string;
  underwriterId: string;
  underwriterName: string;
  desk: string | null;
  terms: string;
  isDemo: boolean;
};

export type Photo = {
  id: string;
  src: string;
};

export type CoverageRequest = {
  id: string;
  homeownerId: string;
  homeownerName: string;
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
  photos: Photo[];
  bids: Bid[];
};

export type RequestSummary = Omit<CoverageRequest, "photos" | "notes" | "bids"> & {
  bids: BookBid[];
};

export type MarketRow = {
  zip: string;
  city: string;
  state: string;
  peril: Peril;
  openRequests: number;
  liveBids: number;
  coverageSought: number;
  bestRate: number | null;
  medianRate: number | null;
  demoRequests: number;
};

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};
