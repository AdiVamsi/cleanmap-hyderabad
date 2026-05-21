import { SpotCard } from "@/components/spots/SpotCard";
import type { PublicSpotWithPhoto } from "@/lib/types";

type ActiveSpotsSectionProps = {
  spots: PublicSpotWithPhoto[];
};

export function ActiveSpotsSection({ spots }: ActiveSpotsSectionProps) {
  const visibleSpots = spots.slice(0, 6);

  return (
    <section className="bg-parchment px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-saffron">
              Active spots
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-extrabold text-ink sm:text-5xl">
              Cleanup locations ready for action
            </h2>
          </div>
          <p className="max-w-md text-sm font-medium leading-6 text-slate-600">
            Public cards show approved reports only, with safe spot details and
            reviewed photo thumbnails.
          </p>
        </div>

        {visibleSpots.length > 0 ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleSpots.map((spot) => (
              <SpotCard key={spot.id} spot={spot} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-warm-border bg-white px-5 py-10 text-center font-semibold text-slate-500">
            Approved spots will appear here after seed data is added.
          </div>
        )}
      </div>
    </section>
  );
}
