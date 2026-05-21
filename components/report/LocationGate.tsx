"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { ReportForm } from "@/components/report/ReportForm";

type LocationState = "checking" | "allowed" | "blocked" | "unavailable";

// GHMC outer boundary — generous to avoid false negatives on the edges
const GHMC_LAT_MIN = 17.18;
const GHMC_LAT_MAX = 17.62;
const GHMC_LON_MIN = 78.18;
const GHMC_LON_MAX = 78.65;

function isInsideHyderabad(lat: number, lon: number) {
  return (
    lat >= GHMC_LAT_MIN &&
    lat <= GHMC_LAT_MAX &&
    lon >= GHMC_LON_MIN &&
    lon <= GHMC_LON_MAX
  );
}

export function LocationGate() {
  const [state, setState] = useState<LocationState>("checking");

  useEffect(() => {
    if (!navigator.geolocation) {
      setState("unavailable");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setState(
          isInsideHyderabad(coords.latitude, coords.longitude)
            ? "allowed"
            : "blocked"
        );
      },
      () => {
        setState("unavailable");
      },
      { timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  if (state === "checking") {
    return (
      <div className="rounded-lg border border-warm-border bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-forest border-t-transparent" />
          <p className="text-sm font-semibold text-slate-600">
            Verifying your location...
          </p>
        </div>
      </div>
    );
  }

  if (state === "blocked") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-amber-700">
          Outside Hyderabad
        </p>
        <h2 className="mt-4 text-3xl font-bold text-ink">
          Reports are only for Greater Hyderabad.
        </h2>
        <p className="mt-4 text-base leading-7 text-slate-600">
          CleanMap is a civic initiative for GHMC-governed Hyderabad. Only people
          physically present in the city can submit garbage reports.
        </p>
        <p className="mt-3 text-sm text-slate-500">
          You can still browse the map, read cleanup stories, and share spots with
          anyone in the world.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-700"
        >
          ← Explore the map
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {state === "unavailable" ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          Location access not granted. Please submit only if you are physically
          in Hyderabad.
        </p>
      ) : null}
      <ReportForm />
    </div>
  );
}
