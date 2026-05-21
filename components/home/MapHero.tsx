"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

import type { PublicSpot, SpotCounts } from "@/lib/types";

const DynamicMapView = dynamic(
  () => import("@/components/map/MapView").then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-stone text-sm font-semibold text-slate-500">
        Loading map
      </div>
    )
  }
);

type MapHeroProps = {
  spots: PublicSpot[];
  counts: SpotCounts;
};

export function MapHero({ spots, counts }: MapHeroProps) {
  return (
    <section className="relative h-[85vh] min-h-[500px] w-full" id="map">
      <div className="absolute inset-0 [&>div]:h-full [&>div]:rounded-none [&>div]:border-0 [&>div]:shadow-none">
        <DynamicMapView spots={spots} />
      </div>

      <div className="absolute left-4 top-20 z-10 rounded-xl bg-ink/85 px-4 py-3 shadow-map backdrop-blur-sm sm:left-6">
        <div className="flex items-center gap-4 text-white">
          <div>
            <p className="text-2xl font-bold leading-none text-saffron">
              {counts.reported}
            </p>
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-white/60">
              Active
            </p>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div>
            <p className="text-2xl font-bold leading-none text-forest">
              {counts.cleaned}
            </p>
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-white/60">
              Cleaned
            </p>
          </div>
        </div>
      </div>

      <div className="absolute right-4 top-20 z-10 sm:right-6">
        <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-ink shadow-soft backdrop-blur-sm">
          Live Map
        </span>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
        <Link
          href="/report"
          className="flex items-center justify-center gap-2 rounded-2xl bg-saffron px-6 py-4 text-base font-bold text-white shadow-map transition hover:bg-saffron-dark active:scale-[0.98] sm:mx-auto sm:max-w-sm"
        >
          <span className="text-lg" aria-hidden="true">
            📍
          </span>
          Report Garbage
        </Link>
      </div>
    </section>
  );
}
