import type { Severity } from "@/lib/types";

const SEVERITY_ORDER = [
  "minor",
  "noticeable",
  "severe",
  "critical"
] as const;

type SeverityLevel = (typeof SEVERITY_ORDER)[number];

export function bumpSeverity(severity: SeverityLevel): SeverityLevel {
  const index = SEVERITY_ORDER.indexOf(severity);
  return SEVERITY_ORDER[Math.min(index + 1, SEVERITY_ORDER.length - 1)];
}

export function maxSeverity(): SeverityLevel {
  return "critical";
}

export function toSeverityLevel(severity: Severity): SeverityLevel {
  return severity as SeverityLevel;
}
