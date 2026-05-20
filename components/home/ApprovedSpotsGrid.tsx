import { SpotCard } from "@/components/spots/SpotCard";
import type { PublicSpotWithPhoto } from "@/lib/types";

type ApprovedSpotsGridProps = {
  spots: PublicSpotWithPhoto[];
};

export function ApprovedSpotsGrid({ spots }: ApprovedSpotsGridProps) {
  const visibleSpots = spots.slice(0, 6);

  return (
    <section className="bg-[#f8faf7] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-civic">
              Approved spots
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-normal text-ink sm:text-4xl">
              Cleanup locations ready for action
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-slate-600">
            Public cards show only safe spot details and approved photo
            thumbnails.
          </p>
        </div>

        {visibleSpots.length > 0 ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleSpots.map((spot) => (
              <SpotCard key={spot.id} spot={spot} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-slate-500">
            Approved spots will appear here after seed data is added.
          </div>
        )}
      </div>
    </section>
  );
}
