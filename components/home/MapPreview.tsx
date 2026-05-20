"use client";

import dynamic from "next/dynamic";

import type { PublicSpot } from "@/lib/types";

const DynamicMapView = dynamic(
  () => import("@/components/map/MapView").then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[520px] items-center justify-center rounded-lg bg-slate-100 text-sm font-medium text-slate-500">
        Loading map
      </div>
    )
  }
);

type MapPreviewProps = {
  spots: PublicSpot[];
};

export function MapPreview({ spots }: MapPreviewProps) {
  return (
    <section id="map" className="bg-white px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-civic">
              Live public map
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-normal text-ink sm:text-4xl">
              Status-colored spots across Hyderabad
            </h2>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
            <span className="rounded-full bg-orange-100 px-3 py-1 text-orange-700">
              Approved
            </span>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">
              Planned
            </span>
            <span className="rounded-full bg-green-100 px-3 py-1 text-green-700">
              Cleaned
            </span>
          </div>
        </div>

        <DynamicMapView spots={spots} />
      </div>
    </section>
  );
}
