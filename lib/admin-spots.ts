import { createServiceRoleClient, hasServiceRoleEnv } from "@/lib/supabase";
import type {
  AdminSpot,
  AdminSpotWithDetails,
  Photo,
  StatusHistory
} from "@/lib/types";

export const ADMIN_SPOT_SELECT =
  "id,title,description,address,ward,latitude,longitude,severity,status,reported_by_name,reported_by_phone,admin_note,cleanup_date,created_at,updated_at";

export async function getAdminSpots(): Promise<AdminSpot[]> {
  if (!hasServiceRoleEnv()) {
    return [];
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("spots")
    .select(ADMIN_SPOT_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as AdminSpot[];
}

export async function getAdminSpotWithDetails(
  id: string
): Promise<AdminSpotWithDetails | null> {
  if (!hasServiceRoleEnv()) {
    return null;
  }

  const supabase = createServiceRoleClient();
  const [spotResult, photosResult, historyResult] = await Promise.all([
    supabase.from("spots").select(ADMIN_SPOT_SELECT).eq("id", id).single(),
    supabase
      .from("photos")
      .select("*")
      .eq("spot_id", id)
      .order("uploaded_at", { ascending: true }),
    supabase
      .from("status_history")
      .select("*")
      .eq("spot_id", id)
      .order("changed_at", { ascending: true })
  ]);

  if (spotResult.error) {
    if (spotResult.error.code === "PGRST116") {
      return null;
    }

    throw spotResult.error;
  }

  if (!spotResult.data) {
    return null;
  }

  if (photosResult.error) {
    throw photosResult.error;
  }

  if (historyResult.error) {
    throw historyResult.error;
  }

  return {
    ...(spotResult.data as AdminSpot),
    photos: (photosResult.data ?? []) as Photo[],
    history: (historyResult.data ?? []) as StatusHistory[]
  };
}
