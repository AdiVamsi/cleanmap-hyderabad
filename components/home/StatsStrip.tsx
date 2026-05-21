import type { SpotCounts } from "@/lib/types";

type StatsStripProps = {
  counts: SpotCounts;
};

export function StatsStrip({ counts }: StatsStripProps) {
  const stats = [
    {
      value: counts.reported,
      label: "Active Reports",
      color: "text-saffron"
    },
    {
      value: counts.cleaned,
      label: "Spots Cleaned",
      color: "text-forest"
    },
    {
      value: counts.planned,
      label: "Cleanups Planned",
      color: "text-blue-600"
    },
    {
      value: counts.wards,
      label: "Wards Covered",
      color: "text-ink"
    }
  ];

  return (
    <section className="border-y border-warm-border bg-stone">
      <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-warm-border sm:grid-cols-4 sm:divide-y-0">
        {stats.map((stat) => (
          <div key={stat.label} className="px-6 py-6 text-center">
            <p className={`text-4xl font-extrabold ${stat.color}`}>
              {stat.value}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-slate-500">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
