import type {
  PUBLIC_STATUSES,
  SEVERITY_OPTIONS,
  STATUS_LABELS
} from "@/lib/constants";

export type Severity = (typeof SEVERITY_OPTIONS)[number];
export type SpotStatus = keyof typeof STATUS_LABELS;
export type PublicSpotStatus = (typeof PUBLIC_STATUSES)[number];
export type PhotoType = "before" | "after";

export interface PublicSpot {
  id: string;
  title: string;
  address: string;
  ward: string;
  latitude: number;
  longitude: number;
  severity: Severity;
  status: PublicSpotStatus;
  cleanup_date: string | null;
  created_at: string;
}

export interface Photo {
  id: string;
  spot_id: string;
  type: PhotoType;
  storage_path: string;
  public_url: string;
  uploaded_at: string;
}

export interface StatusHistory {
  spot_id: string;
  from_status?: string | null;
  to_status: string;
  changed_at: string;
  note: string | null;
}

export interface PublicSpotWithPhoto extends PublicSpot {
  before_photo_url?: string;
}

export interface ImpactPair {
  spot: PublicSpot;
  before: Photo;
  after: Photo;
}

export interface SpotCounts {
  reported: number;
  approved: number;
  planned: number;
  cleaned: number;
  wards: number;
}

// Admin-only types — never returned from public API routes
export interface AdminSpot {
  id: string;
  title: string;
  description: string;
  address: string;
  ward: string;
  latitude: number;
  longitude: number;
  severity: Severity;
  status: SpotStatus;
  reported_by_name: string;
  reported_by_phone: string | null;
  admin_note: string | null;
  cleanup_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminSpotWithDetails extends AdminSpot {
  photos: Photo[];
  history: StatusHistory[];
  story: Story | null;
}

export interface StatusTransitionPayload {
  status: SpotStatus;
  cleanup_date?: string | null;
  note?: string;
}

export interface Story {
  id: string;
  spot_id: string;
  headline: string;
  caption: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface PublicStoryWithDetails {
  id: string;
  spot_id: string;
  headline: string;
  caption: string;
  created_at: string;
  spot: {
    title: string;
    ward: string;
    address: string;
    cleanup_date: string | null;
  };
  before_photo_url: string | null;
  after_photo_url: string | null;
}
