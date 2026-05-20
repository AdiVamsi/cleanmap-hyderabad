import Link from "next/link";

import {
  SEVERITY_LABELS,
  STATUS_COLORS,
  STATUS_LABELS
} from "@/lib/constants";
import type { PublicSpotWithPhoto } from "@/lib/types";

type SpotCardProps = {
  spot: PublicSpotWithPhoto;
};

function fallbackImage() {
  return "/demo-photos/hyderabad-before-market-lane.jpg";
}

export function SpotCard({ spot }: SpotCardProps) {
  const cleanupDate = spot.cleanup_date
    ? new Intl.DateTimeFormat("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric"
      }).format(new Date(spot.cleanup_date))
    : null;

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={spot.before_photo_url ?? fallbackImage()}
          alt={spot.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="p-5">
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

        <h3 className="mt-4 line-clamp-2 min-h-[3.5rem] text-xl font-bold tracking-normal text-ink">
          {spot.title}
        </h3>
        <p className="mt-3 text-sm font-semibold text-civic">{spot.ward}</p>
        <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm leading-5 text-slate-600">
          {spot.address}
        </p>
        {cleanupDate ? (
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
            Cleanup {cleanupDate}
          </p>
        ) : null}

        <Link
          href={`/spots/${spot.id}`}
          className="mt-5 block w-full rounded-md border border-slate-200 px-4 py-3 text-center text-sm font-bold text-ink transition hover:bg-slate-50"
        >
          View Spot →
        </Link>
      </div>
    </article>
  );
}
