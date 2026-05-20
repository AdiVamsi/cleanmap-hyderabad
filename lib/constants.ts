export const HYDERABAD_WARDS = [
  "Banjara Hills",
  "KPHB Colony",
  "Secunderabad",
  "Kukatpally",
  "Himayatnagar",
  "Jubilee Hills",
  "LB Nagar",
  "Madhapur"
] as const;

export type HyderabadWard = (typeof HYDERABAD_WARDS)[number];

export const WARD_COORDINATES: Record<
  HyderabadWard,
  { latitude: number; longitude: number }
> = {
  "Banjara Hills": { latitude: 17.4126, longitude: 78.4483 },
  "KPHB Colony": { latitude: 17.4933, longitude: 78.3996 },
  Secunderabad: { latitude: 17.4399, longitude: 78.4983 },
  Kukatpally: { latitude: 17.4948, longitude: 78.3925 },
  Himayatnagar: { latitude: 17.4031, longitude: 78.484 },
  "Jubilee Hills": { latitude: 17.4326, longitude: 78.4071 },
  "LB Nagar": { latitude: 17.3475, longitude: 78.548 },
  Madhapur: { latitude: 17.4483, longitude: 78.3915 }
};

export const PUBLIC_STATUSES = [
  "approved",
  "cleanup_planned",
  "cleaned"
] as const;

export const STATUS_COLORS = {
  pending: "#9CA3AF",
  approved: "#F97316",
  cleanup_planned: "#3B82F6",
  cleaned: "#22C55E",
  rejected: "#EF4444"
} as const;

export const STATUS_LABELS = {
  pending: "Pending",
  approved: "Approved",
  cleanup_planned: "Cleanup planned",
  cleaned: "Cleaned",
  rejected: "Rejected"
} as const;

export const SEVERITY_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High"
} as const;

export const SEVERITY_OPTIONS = ["low", "medium", "high"] as const;
