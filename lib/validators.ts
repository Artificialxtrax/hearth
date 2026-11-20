import { z } from "zod";
import { PERILS, ROLES } from "@/lib/types";

const dayPattern = /^\d{4}-\d{2}-\d{2}$/;

export function parseDay(value: string): Date | null {
  if (!dayPattern.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return date;
}

function utcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function endOfPacificDay(isoDay: string): Date | null {
  const parsed = parseDay(isoDay);
  if (!parsed) return null;
  return new Date(`${isoDay}T23:59:00-08:00`);
}

const moneyField = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .transform((value) => Number(value.replace(/[$,\s]/g, "")))
    .refine((value) => Number.isFinite(value), `${label} must be a number`);

export const requestSchema = z
  .object({
    city: z
      .string()
      .trim()
      .min(2, "Enter a city")
      .max(60)
      .regex(/^[A-Za-z][A-Za-z .'-]*$/, "Use letters in the city name"),
    state: z
      .string()
      .trim()
      .regex(/^[A-Za-z]{2}$/, "Use a two-letter state")
      .transform((value) => value.toUpperCase()),
    zip: z.string().trim().regex(/^\d{5}$/, "Use a 5-digit ZIP"),
    coverageAmount: moneyField("Coverage"),
    peril: z.enum(PERILS, { error: "Choose a peril" }),
    deductible: moneyField("Deductible"),
    startDate: z.string().trim().refine((value) => parseDay(value) != null, "Use a real start date"),
    notes: z.string().trim().max(1000, "Keep notes under 1,000 characters").optional().default(""),
  })
  .superRefine((value, ctx) => {
    if (value.coverageAmount < 50_000 || value.coverageAmount > 10_000_000) {
      ctx.addIssue({
        code: "custom",
        path: ["coverageAmount"],
        message: "Coverage must be between $50,000 and $10,000,000",
      });
    }
    if (value.deductible < 0 || value.deductible >= value.coverageAmount) {
      ctx.addIssue({
        code: "custom",
        path: ["deductible"],
        message: "Deductible must be zero or more, and less than the coverage",
      });
    }
    const start = parseDay(value.startDate);
    if (!start) return;
    const today = utcDay(new Date());
    const min = today - 30 * 24 * 60 * 60 * 1000;
    const max = today + 548 * 24 * 60 * 60 * 1000;
    const startMs = start.getTime();
    if (startMs < min || startMs > max) {
      ctx.addIssue({
        code: "custom",
        path: ["startDate"],
        message: "Start date must be within the past month or the next 18 months",
      });
    }
  });

export const bidSchema = z
  .object({
    requestId: z.string().uuid("Missing request"),
    premiumAnnual: moneyField("Premium"),
    maxCoverage: moneyField("Max coverage"),
    terms: z.string().trim().min(12, "Add a short statement of terms").max(800, "Keep terms under 800 characters"),
    expiresOn: z.string().trim().refine((value) => parseDay(value) != null, "Use a real expiry date"),
  })
  .superRefine((value, ctx) => {
    if (value.premiumAnnual < 100 || value.premiumAnnual > 2_000_000) {
      ctx.addIssue({
        code: "custom",
        path: ["premiumAnnual"],
        message: "Annual premium must be between $100 and $2,000,000",
      });
    }
    if (value.maxCoverage < 10_000 || value.maxCoverage > 20_000_000) {
      ctx.addIssue({
        code: "custom",
        path: ["maxCoverage"],
        message: "Max coverage must be between $10,000 and $20,000,000",
      });
    }
    const expiry = endOfPacificDay(value.expiresOn);
    if (!expiry) return;
    const tomorrow = utcDay(new Date()) + 24 * 60 * 60 * 1000;
    const horizon = utcDay(new Date()) + 90 * 24 * 60 * 60 * 1000;
    const expiryDay = utcDay(expiry);
    if (expiryDay < tomorrow || expiryDay > horizon) {
      ctx.addIssue({
        code: "custom",
        path: ["expiresOn"],
        message: "Expiry must be tomorrow through the next 90 days",
      });
    }
  });

export const personaSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.string().trim().email("Enter a valid email").max(160),
  role: z.enum(ROLES, { error: "Choose a side of the desk" }),
  desk: z.string().trim().max(80).optional().default(""),
});

export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const flat = error.flatten().fieldErrors;
  const fieldErrors: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flat)) {
    if (!Array.isArray(messages)) continue;
    const first = messages.find((message): message is string => typeof message === "string");
    if (first) fieldErrors[key] = first;
  }
  return fieldErrors;
}

export function photoSources(formData: FormData): { sources: string[] } | { error: string } {
  const sources = formData
    .getAll("photo")
    .map((value) => String(value))
    .filter((value) => value.length > 0);
  if (sources.length > 3) return { error: "Attach up to 3 photos." };
  for (const source of sources) {
    if (!source.startsWith("data:image/jpeg;base64,")) {
      return { error: "Photos must be JPEG or PNG, compressed in the browser." };
    }
    if (source.length > 500_000) return { error: "A photo is still too large. Try a smaller image." };
  }
  return { sources };
}
