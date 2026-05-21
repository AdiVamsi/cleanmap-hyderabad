import { STATUS_LABELS } from "@/lib/constants";
import type { SpotStatus, StatusHistory } from "@/lib/types";

type StatusTimelineProps = {
  history: StatusHistory[];
};

const statusIcons: Record<SpotStatus, string> = {
  pending: "⏳",
  approved: "✓",
  cleanup_planned: "📅",
  cleaned: "✅",
  rejected: "✗"
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(value));
}

function isSpotStatus(value: string): value is SpotStatus {
  return value in STATUS_LABELS;
}

export function StatusTimeline({ history }: StatusTimelineProps) {
  return (
    <ol className="grid gap-0">
      {history.map((entry, index) => {
        const status = isSpotStatus(entry.to_status)
          ? entry.to_status
          : "pending";
        const isLast = index === history.length - 1;

        return (
          <li key={`${entry.changed_at}-${index}`} className="relative flex gap-4">
            {!isLast ? (
              <span className="absolute left-5 top-10 h-[calc(100%-1rem)] w-px bg-slate-200" />
            ) : null}
            <span className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-warm-border bg-white text-base shadow-sm">
              {statusIcons[status]}
            </span>
            <div className="pb-6">
              <p className="text-sm font-bold text-ink">
                {STATUS_LABELS[status]}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {formatDate(entry.changed_at)}
              </p>
              {entry.note ? (
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {entry.note}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
