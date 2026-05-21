import { SEVERITY_COLORS, SEVERITY_LABELS } from "@/lib/constants";
import type { Severity } from "@/lib/types";

export function SeverityBadge({ severity }: { severity: Severity }) {
  const label = SEVERITY_LABELS[severity];
  const color = SEVERITY_COLORS[severity];
  const isPulsing = severity === "critical";

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white"
      style={{ backgroundColor: color }}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full bg-white/70 ${
          isPulsing ? "animate-pulse" : ""
        }`}
      />
      {label}
    </span>
  );
}
