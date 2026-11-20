import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { findUserById } from "@/lib/store";
import type { Role, User } from "@/lib/types";
import "server-only";

export const SESSION_COOKIE = "hearth_session";

function secret(): string {
  return process.env.AUTH_SECRET || "hearth-local-dev-secret";
}

export function encodeSession(userId: string): string {
  const mac = createHmac("sha256", secret()).update(userId).digest("base64url");
  return `${userId}.${mac}`;
}

export function decodeSession(value: string | undefined): string | null {
  if (!value) return null;
  const splitAt = value.lastIndexOf(".");
  if (splitAt <= 0) return null;
  const userId = value.slice(0, splitAt);
  const mac = value.slice(splitAt + 1);
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return null;
  const expected = createHmac("sha256", secret()).update(userId).digest("base64url");
  const actualBuffer = Buffer.from(mac);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(actualBuffer, expectedBuffer)) return null;
  return userId;
}

function asRole(value: string): Role | null {
  if (value === "homeowner" || value === "underwriter") return value;
  return null;
}

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const jar = await cookies();
  const userId = decodeSession(jar.get(SESSION_COOKIE)?.value);
  if (!userId) return null;
  const row = findUserById(userId);
  if (!row) return null;
  const role = asRole(row.role);
  if (!role) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role,
    desk: row.desk,
    isDemo: row.isDemo,
  };
});

export async function setSession(userId: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, encodeSession(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
