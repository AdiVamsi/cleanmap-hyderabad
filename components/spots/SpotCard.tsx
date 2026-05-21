import Link from "next/link";

import { SeverityBadge } from "@/components/spots/SeverityBadge";
import type { PublicSpotWithPhoto } from "@/lib/types";

type SpotCardProps = {
  spot: PublicSpotWithPhoto;
};

export function SpotCard({ spot }: SpotCardProps) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-warm-border bg-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-map">
      {spot.before_photo_url ? (
        <div className="aspect-[16/9] overflow-hidden bg-stone">
          <img
            src={spot.before_photo_url}
            alt={spot.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-stone to-warm-border">
          <span className="text-3xl opacity-30" aria-hidden="true">
            📍
          </span>
        </div>
      )}

      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={spot.severity} />
          <span className="rounded-full bg-stone px-2.5 py-1 text-xs font-semibold text-slate-600">
            {spot.ward}
          </span>
        </div>

        <h3 className="mt-3 line-clamp-2 text-lg font-bold leading-snug text-ink">
          {spot.title}
        </h3>
        <p className="mt-1.5 line-clamp-1 text-sm text-slate-500">
          {spot.address}
        </p>

        <Link
          href={`/spots/${spot.id}`}
          className="mt-4 block w-full rounded-xl bg-ink px-4 py-2.5 text-center text-sm font-bold text-white transition hover:bg-slate-700"
        >
          View Spot →
        </Link>
      </div>
    </article>
  );
}
