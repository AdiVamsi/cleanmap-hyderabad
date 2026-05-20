import { createHash } from "crypto";
import type { NextRequest } from "next/server";

export const ADMIN_COOKIE_NAME = "cleanmap_admin";
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours

export function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export function getExpectedHash(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return hashPassword(password);
}

export function isValidCookieValue(value: string): boolean {
  const expected = getExpectedHash();
  if (!expected) return false;
  return value === expected;
}

// For use in API route handlers (NextRequest context)
export function isAdminRequest(request: NextRequest): boolean {
  const cookie = request.cookies.get(ADMIN_COOKIE_NAME);
  if (!cookie) return false;
  return isValidCookieValue(cookie.value);
}

export function hasAdminPasswordConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}
