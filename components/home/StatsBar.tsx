import type { SpotCounts } from "@/lib/types";

type StatsBarProps = {
  counts: SpotCounts;
};

export function StatsBar({ counts }: StatsBarProps) {
  const stats = [
    { label: "Reports visible", value: counts.reported },
    { label: "Approved", value: counts.approved },
    { label: "Planned", value: counts.planned },
    { label: "Cleaned", value: counts.cleaned },
    { label: "Wards", value: counts.wards }
  ];

  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px px-4 py-4 sm:px-6 md:grid-cols-5 lg:px-8">
        {stats.map((stat) => (
          <div key={stat.label} className="px-3 py-4 text-center">
            <p className="text-3xl font-bold tracking-normal text-ink">
              {stat.value}
            </p>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
