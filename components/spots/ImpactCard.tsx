import { SEVERITY_COLORS, SEVERITY_LABELS } from "@/lib/constants";
import type { ImpactPair } from "@/lib/types";

type ImpactCardProps = {
  pair: ImpactPair;
};

export function ImpactCard({ pair }: ImpactCardProps) {
  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-2">
        <figure className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          <img
            src={pair.before.public_url}
            alt={`${pair.spot.title} before cleanup`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <figcaption className="absolute left-3 top-3 rounded-full bg-ink/85 px-3 py-1 text-xs font-bold text-white">
            Before
          </figcaption>
        </figure>
        <figure className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          <img
            src={pair.after.public_url}
            alt={`${pair.spot.title} after cleanup`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <figcaption className="absolute left-3 top-3 rounded-full bg-clean px-3 py-1 text-xs font-bold text-ink">
            After
          </figcaption>
        </figure>
      </div>
      <div className="p-5">
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <span className="rounded-full bg-green-100 px-3 py-1 text-green-700">
            Cleaned
          </span>
          <span
            className="rounded-full px-3 py-1 text-white"
            style={{ backgroundColor: SEVERITY_COLORS[pair.spot.severity] }}
          >
            {SEVERITY_LABELS[pair.spot.severity]}
          </span>
        </div>
        <h3 className="mt-4 text-xl font-bold tracking-normal text-ink">
          {pair.spot.title}
        </h3>
        <p className="mt-2 text-sm font-semibold text-civic">
          {pair.spot.ward}
        </p>
      </div>
    </article>
  );
}
