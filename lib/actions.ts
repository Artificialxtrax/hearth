"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearSession, getCurrentUser, setSession } from "@/lib/auth";
import { findUserByEmail } from "@/lib/queries";
import { matchIntake } from "@/lib/quotes/build";
import type { Concern, Intake } from "@/lib/quotes/rank";
import { acceptBid as acceptStoredBid, findQuote, insertPhoto, insertRequest, insertUser, placeBid as placeStoredBid, requestDeskQuote, saveQuote, withdrawBid as withdrawStoredBid, withdrawRequest as withdrawStoredRequest } from "@/lib/store";
import type { ActionState } from "@/lib/types";
import { safeNext } from "@/lib/utils";
import { bidSchema, endOfPacificDay, personaSchema, photoSources, requestSchema, zodFieldErrors } from "@/lib/validators";

function refreshBook(requestId?: string) {
  revalidatePath("/");
  revalidatePath("/market");
  revalidatePath("/requests");
  revalidatePath("/account");
  if (requestId) revalidatePath(`/requests/${requestId}`);
}

export async function signInDemo(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const user = await findUserByEmail(email);
  const next = String(formData.get("next") ?? "");
  if (!user?.isDemo) {
    redirect(next ? `/sign-in?next=${encodeURIComponent(next)}&notice=unknown` : "/sign-in?notice=unknown");
  }
  await setSession(user.id);
  redirect(safeNext(formData.get("next"), user.role === "homeowner" ? "/requests/new" : "/requests"));
}

export async function signInNew(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = personaSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    desk: formData.get("desk"),
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };
  const existing = await findUserByEmail(parsed.data.email);
  if (existing) {
    return { error: "That email is already on the desk. Use a demo persona above, or a different email." };
  }
  const deskName = parsed.data.role === "underwriter" && parsed.data.desk ? parsed.data.desk : null;
  const created = insertUser({
    email: parsed.data.email,
    name: parsed.data.name,
    role: parsed.data.role,
    desk: deskName,
  });
  await setSession(created.id);
  redirect(safeNext(formData.get("next"), parsed.data.role === "homeowner" ? "/requests/new" : "/requests"));
}

export async function signOut() {
  await clearSession();
  redirect("/");
}

export async function createRequest(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in as a homeowner before posting." };
  if (user.role !== "homeowner") return { error: "Only a homeowner desk can post a coverage request." };

  const parsed = requestSchema.safeParse({
    city: formData.get("city"),
    state: formData.get("state"),
    zip: formData.get("zip"),
    coverageAmount: formData.get("coverageAmount"),
    peril: formData.get("peril"),
    deductible: formData.get("deductible"),
    startDate: formData.get("startDate"),
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  const photos = photoSources(formData);
  if ("error" in photos) return { error: photos.error };

  try {
    const created = insertRequest({
      homeownerId: user.id,
      city: parsed.data.city,
      state: parsed.data.state,
      zip: parsed.data.zip,
      coverageAmount: parsed.data.coverageAmount,
      peril: parsed.data.peril,
      deductible: parsed.data.deductible,
      startDate: parsed.data.startDate,
      notes: parsed.data.notes || null,
    });
    for (const src of photos.sources) insertPhoto(created.id, src);
    refreshBook(created.id);
    redirect(`/requests/${created.id}`);
  } catch (error) {
    if (typeof error === "object" && error && "digest" in error) throw error;
    console.error("createRequest failed", error instanceof Error ? error.message : "unknown");
    return { error: "Could not post the request. Try again in a moment." };
  }
}

export async function placeBid(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in as an underwriter to bid." };
  if (user.role !== "underwriter") return { error: "Switch to an underwriter desk to submit an indication." };

  const parsed = bidSchema.safeParse({
    requestId: formData.get("requestId"),
    premiumAnnual: formData.get("premiumAnnual"),
    maxCoverage: formData.get("maxCoverage"),
    terms: formData.get("terms"),
    expiresOn: formData.get("expiresOn"),
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };
  const expiresAt = endOfPacificDay(parsed.data.expiresOn);
  if (!expiresAt) return { fieldErrors: { expiresOn: "Use a real expiry date" } };

  try {
    const id = placeStoredBid({
      requestId: parsed.data.requestId,
      underwriterId: user.id,
      premiumAnnual: parsed.data.premiumAnnual,
      maxCoverage: parsed.data.maxCoverage,
      terms: parsed.data.terms,
      expiresAt: expiresAt.toISOString(),
    });
    if (!id) {
      return { error: "That request is not open for a new indication." };
    }
    refreshBook(parsed.data.requestId);
    redirect(`/requests/${parsed.data.requestId}`);
  } catch (error) {
    if (typeof error === "object" && error && "digest" in error) throw error;
    console.error("placeBid failed", error instanceof Error ? error.message : "unknown");
    return { error: "Could not submit the indication. Try again in a moment." };
  }
}

export async function acceptBid(formData: FormData) {
  const user = await getCurrentUser();
  const requestId = String(formData.get("requestId") ?? "");
  const bidId = String(formData.get("bidId") ?? "");
  if (!user || user.role !== "homeowner") redirect(`/sign-in?next=/requests/${requestId}`);

  const accepted = acceptStoredBid({ requestId, bidId, homeownerId: user.id });
  refreshBook(requestId);
  if (!accepted) {
    redirect(`/requests/${requestId}?notice=stale`);
  }
  redirect(`/requests/${requestId}?notice=accepted`);
}

export async function withdrawRequest(formData: FormData) {
  const user = await getCurrentUser();
  const requestId = String(formData.get("requestId") ?? "");
  if (!user) redirect(`/sign-in?next=/requests/${requestId}`);
  withdrawStoredRequest({ requestId, homeownerId: user.id });
  refreshBook(requestId);
  redirect(`/requests/${requestId}`);
}

export async function withdrawBid(formData: FormData) {
  const user = await getCurrentUser();
  const requestId = String(formData.get("requestId") ?? "");
  const bidId = String(formData.get("bidId") ?? "");
  if (!user) redirect(`/sign-in?next=/requests/${requestId}`);
  withdrawStoredBid({ requestId, bidId, underwriterId: user.id });
  refreshBook(requestId);
  redirect(`/requests/${requestId}`);
}

const CONCERNS: Concern[] = ["fire", "flood", "wind"];

function parseIntake(formData: FormData): Intake | { error: string } {
  const zip = String(formData.get("zip") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim().toUpperCase();
  const homeType = String(formData.get("homeType") ?? "");
  const yearBuilt = Number(formData.get("yearBuilt"));
  const roofAge = String(formData.get("roofAge") ?? "");
  const coverageAmount = Number(String(formData.get("coverageAmount") ?? "").replace(/[$,\s]/g, ""));
  const claims = String(formData.get("claims") ?? "");
  const concerns = formData
    .getAll("concern")
    .map(String)
    .filter((item): item is Concern => CONCERNS.includes(item as Concern));
  if (!/^\d{5}$/.test(zip)) return { error: "Use a 5-digit ZIP." };
  if (!/^[A-Z]{2}$/.test(state)) return { error: "Use a two-letter state." };
  if (homeType !== "single-family" && homeType !== "condo" && homeType !== "townhouse" && homeType !== "mobile") {
    return { error: "Choose a home type." };
  }
  if (!Number.isInteger(yearBuilt) || yearBuilt < 1850 || yearBuilt > new Date().getFullYear()) {
    return { error: "Enter the year the home was built." };
  }
  if (roofAge !== "0-5" && roofAge !== "6-15" && roofAge !== "16-25" && roofAge !== "25+") {
    return { error: "Choose a roof age." };
  }
  if (!Number.isFinite(coverageAmount) || coverageAmount < 50_000 || coverageAmount > 10_000_000) {
    return { error: "Coverage must be between $50,000 and $10,000,000." };
  }
  if (concerns.length === 0) return { error: "Pick at least one risk." };
  if (claims !== "none" && claims !== "one" && claims !== "two-or-more") return { error: "Choose a claims history." };
  return { zip, state, homeType, yearBuilt, roofAge, coverageAmount, concerns, claims };
}

export async function createQuoteMatch(_prev: { error?: string; id?: string }, formData: FormData) {
  const parsed = parseIntake(formData);
  if ("error" in parsed) return { error: parsed.error };
  const user = await getCurrentUser();
  const matches = await matchIntake(parsed);
  const quote = saveQuote({
    homeownerId: user?.role === "homeowner" ? user.id : null,
    intake: parsed,
    matches,
  });
  return { id: quote.id };
}

export async function requestThisQuote(formData: FormData) {
  const quoteId = String(formData.get("quoteId") ?? "");
  const underwriterId = String(formData.get("underwriterId") ?? "");
  const user = await getCurrentUser();
  if (!user || user.role !== "homeowner") redirect(`/sign-in?next=/quotes/${quoteId}`);
  const quote = findQuote(quoteId);
  const match = quote?.matches.find((item) => item.underwriterId === underwriterId && item.kind === "desk");
  if (!quote || !match) redirect(`/quotes/${quoteId}`);
  const summary = `${quote.intake.state} ${quote.intake.zip} · ${quote.intake.concerns.join(", ")} · $${quote.intake.coverageAmount.toLocaleString("en-US")} · ${user.name}`;
  requestDeskQuote({
    quoteId,
    underwriterId,
    homeownerId: user.id,
    homeownerName: user.name,
    summary,
  });
  refreshBook();
  redirect(`/quotes/${quoteId}?requested=${underwriterId}`);
}
