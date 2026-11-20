import type { BidDisplayStatus, BidStatus, Peril, RequestStatus, Role } from "@/lib/types";

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatRate(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

export function formatDay(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  }).format(date);
}

export function perilLabel(peril: Peril): string {
  switch (peril) {
    case "wildfire":
      return "Wildfire";
    case "earthquake":
      return "Earthquake";
    case "flood":
      return "Flood";
    case "wind":
      return "Wind";
    case "landslide":
      return "Landslide";
    default: {
      const unreachable: never = peril;
      return unreachable;
    }
  }
}

export function roleLabel(role: Role): string {
  switch (role) {
    case "homeowner":
      return "Homeowner";
    case "underwriter":
      return "Underwriter";
    default: {
      const unreachable: never = role;
      return unreachable;
    }
  }
}

export function requestStatusLabel(status: RequestStatus): string {
  switch (status) {
    case "open":
      return "Open";
    case "awarded":
      return "Indication accepted";
    case "withdrawn":
      return "Withdrawn";
    default: {
      const unreachable: never = status;
      return unreachable;
    }
  }
}

export function bidStatusLabel(status: BidDisplayStatus): string {
  switch (status) {
    case "active":
      return "Live";
    case "accepted":
      return "Accepted";
    case "closed":
      return "Closed";
    case "withdrawn":
      return "Withdrawn";
    case "expired":
      return "Expired";
    default: {
      const unreachable: never = status;
      return unreachable;
    }
  }
}

export function bidDisplayStatus(
  bid: { status: BidStatus; expiresAt: string },
  now: number,
): BidDisplayStatus {
  if (bid.status === "active" && new Date(bid.expiresAt).getTime() <= now) return "expired";
  return bid.status;
}

export type RateTone = "sage" | "ochre" | "ember" | "deep" | "empty";

export function rateTone(rate: number | null): RateTone {
  if (rate == null) return "empty";
  if (rate < 0.016) return "sage";
  if (rate < 0.023) return "ochre";
  if (rate < 0.03) return "ember";
  return "deep";
}
