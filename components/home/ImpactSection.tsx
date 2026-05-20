import { ImpactCard } from "@/components/spots/ImpactCard";
import type { ImpactPair } from "@/lib/types";

type ImpactSectionProps = {
  pairs: ImpactPair[];
};

export function ImpactSection({ pairs }: ImpactSectionProps) {
  if (pairs.length < 2) {
    return null;
  }

  return (
    <section className="bg-[#f8faf7] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-civic">
            Before and after
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-normal text-ink sm:text-4xl">
            Cleanups already completed
          </h2>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {pairs.slice(0, 4).map((pair) => (
            <ImpactCard key={pair.spot.id} pair={pair} />
          ))}
        </div>
      </div>
    </section>
  );
}
