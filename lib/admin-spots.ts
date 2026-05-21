import { createServiceRoleClient, hasServiceRoleEnv } from "@/lib/supabase";
import type {
  AdminSpot,
  AdminSpotWithDetails,
  Photo,
  Story,
  StatusHistory
} from "@/lib/types";

export const ADMIN_SPOT_SELECT =
  "id,title,description,address,ward,latitude,longitude,severity,status,reported_by_name,reported_by_phone,admin_note,cleanup_date,created_at,updated_at";

function isMissingStoriesTable(error: { code?: string } | null) {
  return error?.code === "PGRST205";
}

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
  const [spotResult, photosResult, historyResult, storyResult] = await Promise.all([
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
      .order("changed_at", { ascending: true }),
    supabase
      .from("stories")
      .select("id,spot_id,headline,caption,published,created_at,updated_at")
      .eq("spot_id", id)
      .maybeSingle()
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

  if (
    storyResult.error &&
    storyResult.error.code !== "PGRST116" &&
    !isMissingStoriesTable(storyResult.error)
  ) {
    throw storyResult.error;
  }

  return {
    ...(spotResult.data as AdminSpot),
    photos: (photosResult.data ?? []) as Photo[],
    history: (historyResult.data ?? []) as StatusHistory[],
    story: (storyResult.data ?? null) as Story | null
  };
}
