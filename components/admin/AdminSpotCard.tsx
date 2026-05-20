import Link from "next/link";

import {
  SEVERITY_LABELS,
  STATUS_COLORS,
  STATUS_LABELS
} from "@/lib/constants";
import type { AdminSpot } from "@/lib/types";

type AdminSpotCardProps = {
  spot: AdminSpot;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export function AdminSpotCard({ spot }: AdminSpotCardProps) {
  return (
    <article className="flex min-h-full flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="rounded-full px-3 py-1 text-xs font-bold text-white"
          style={{ backgroundColor: STATUS_COLORS[spot.status] }}
        >
          {STATUS_LABELS[spot.status]}
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
          {SEVERITY_LABELS[spot.severity]}
        </span>
      </div>

      <h2 className="mt-4 line-clamp-2 min-h-[3.5rem] text-xl font-bold tracking-normal text-ink">
        {spot.title}
      </h2>
      <p className="mt-2 text-sm font-semibold text-civic">{spot.ward}</p>
      <p className="mt-2 line-clamp-1 text-sm text-slate-600">
        {spot.address}
      </p>

      <div className="mt-5 grid gap-2 border-t border-slate-100 pt-4 text-sm">
        <p className="text-slate-600">
          <span className="font-semibold text-slate-800">Reporter:</span>{" "}
          {spot.reported_by_name}
        </p>
        <p className="text-slate-600">
          <span className="font-semibold text-slate-800">Phone:</span>{" "}
          {spot.reported_by_phone ? (
            <a
              href={`tel:${spot.reported_by_phone}`}
              className="font-semibold text-civic hover:underline"
            >
              {spot.reported_by_phone}
            </a>
          ) : (
            "No phone"
          )}
        </p>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          Reported {formatDate(spot.created_at)}
        </p>
      </div>

      <div className="mt-auto pt-5">
        <Link
          href={`/admin/spots/${spot.id}`}
          className="block w-full rounded-md bg-ink px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-slate-700"
        >
          Manage →
        </Link>
      </div>
    </article>
  );
}
