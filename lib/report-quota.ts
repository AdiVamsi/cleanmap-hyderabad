import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest, NextResponse } from "next/server";

const PHOTO_UPLOAD_QUOTA_COOKIE = "cleanmap_photo_quota";
const PHOTO_UPLOAD_LIMIT = 5;
const PHOTO_UPLOAD_WINDOW_MS = 24 * 60 * 60 * 1000;

type PhotoUploadQuotaState = {
  windowStart: number;
  uploads: number;
};

type PhotoUploadQuota = {
  exceeded: boolean;
  remaining: number;
  resetAt: Date;
  state: PhotoUploadQuotaState;
};

function getSecret() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.ADMIN_PASSWORD ??
    "cleanmap-local-quota"
  );
}

function sign(payload: string) {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function encodeState(state: PhotoUploadQuotaState) {
  const payload = Buffer.from(JSON.stringify(state)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decodeState(value: string | undefined) {
  if (!value) {
    return null;
  }

  const [payload, signature] = value.split(".");

  if (!payload || !signature || !safeEqual(sign(payload), signature)) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as Partial<PhotoUploadQuotaState>;

    if (
      typeof parsed.windowStart !== "number" ||
      typeof parsed.uploads !== "number"
    ) {
      return null;
    }

    return {
      windowStart: parsed.windowStart,
      uploads: parsed.uploads
    };
  } catch {
    return null;
  }
}

function normalizeState(state: PhotoUploadQuotaState | null) {
  const now = Date.now();

  if (!state || now - state.windowStart >= PHOTO_UPLOAD_WINDOW_MS) {
    return {
      windowStart: now,
      uploads: 0
    };
  }

  return state;
}

export function getPhotoUploadQuota(request: NextRequest): PhotoUploadQuota {
  const state = normalizeState(
    decodeState(request.cookies.get(PHOTO_UPLOAD_QUOTA_COOKIE)?.value)
  );
  const remaining = Math.max(PHOTO_UPLOAD_LIMIT - state.uploads, 0);

  return {
    exceeded: remaining === 0,
    remaining,
    resetAt: new Date(state.windowStart + PHOTO_UPLOAD_WINDOW_MS),
    state
  };
}

export function recordPhotoUpload(
  response: NextResponse,
  quota: PhotoUploadQuota
) {
  const state = {
    windowStart: quota.state.windowStart,
    uploads: Math.min(quota.state.uploads + 1, PHOTO_UPLOAD_LIMIT)
  };

  response.cookies.set(PHOTO_UPLOAD_QUOTA_COOKIE, encodeState(state), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: PHOTO_UPLOAD_WINDOW_MS / 1000,
    path: "/"
  });
}
