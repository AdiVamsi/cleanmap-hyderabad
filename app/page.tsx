import type { SupabaseClient } from "@supabase/supabase-js";

import { ActiveSpotsSection } from "@/components/home/ActiveSpotsSection";
import { CTAStrip } from "@/components/home/CTAStrip";
import { ImpactSection } from "@/components/home/ImpactSection";
import { MapHero } from "@/components/home/MapHero";
import { SiteNav } from "@/components/home/SiteNav";
import { StatsStrip } from "@/components/home/StatsStrip";
import { StoriesTeaser } from "@/components/home/StoriesTeaser";
import { PUBLIC_STATUSES } from "@/lib/constants";
import { createServiceRoleClient, hasServiceRoleEnv } from "@/lib/supabase";
import type {
  ImpactPair,
  Photo,
  PublicSpot,
  PublicSpotStatus,
  PublicSpotWithPhoto,
  PublicStoryWithDetails,
  Severity,
  SpotCounts,
  Story
} from "@/lib/types";

export const revalidate = 60;

const PUBLIC_SPOT_SELECT =
  "id,title,address,ward,latitude,longitude,severity,status,cleanup_date,created_at";

const EMPTY_COUNTS: SpotCounts = {
  reported: 0,
  approved: 0,
  planned: 0,
  cleaned: 0,
  wards: 0
};

type PublicSpotRow = {
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
};

type StorySpot = {
  id: string;
  title: string;
  ward: string;
  address: string;
  cleanup_date: string | null;
};

function mapPublicSpot(row: PublicSpotRow): PublicSpot {
  return {
    id: row.id,
    title: row.title,
    address: row.address,
    ward: row.ward,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    severity: row.severity,
    status: row.status,
    cleanup_date: row.cleanup_date,
    created_at: row.created_at
  };
}

function countRows(rows: Array<Pick<PublicSpot, "status" | "ward">>): SpotCounts {
  return {
    reported: rows.length,
    approved: rows.filter((spot) => spot.status === "approved").length,
    planned: rows.filter((spot) => spot.status === "cleanup_planned").length,
    cleaned: rows.filter((spot) => spot.status === "cleaned").length,
    wards: new Set(rows.map((spot) => spot.ward)).size
  };
}

function isMissingStoriesTable(error: { code?: string } | null) {
  return error?.code === "PGRST205";
}

async function withFallback<T>(
  label: string,
  task: Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await task;
  } catch (error) {
    console.error(`Failed to load ${label}`, error);
    return fallback;
  }
}

async function getPhotosBySpotIds(
  supabase: SupabaseClient,
  spotIds: string[],
  types?: Array<Photo["type"]>
) {
  if (spotIds.length === 0) {
    return [] as Photo[];
  }

  let query = supabase
    .from("photos")
    .select("id,spot_id,type,storage_path,public_url,uploaded_at")
    .in("spot_id", spotIds)
    .order("uploaded_at", { ascending: false });

  if (types && types.length > 0) {
    query = query.in("type", types);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as Photo[];
}

async function getCounts(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("public_spots")
    .select("status,ward");

  if (error) {
    throw error;
  }

  return countRows((data ?? []) as Array<Pick<PublicSpot, "status" | "ward">>);
}

async function getSpots(
  supabase: SupabaseClient,
  statuses: PublicSpotStatus[],
  limit: number
): Promise<PublicSpot[]> {
  const { data, error } = await supabase
    .from("public_spots")
    .select(PUBLIC_SPOT_SELECT)
    .in("status", statuses)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return ((data ?? []) as PublicSpotRow[]).map(mapPublicSpot);
}

async function getApprovedSpotsWithPhotos(
  supabase: SupabaseClient
): Promise<PublicSpotWithPhoto[]> {
  const spots = await getSpots(supabase, ["approved"], 6);
  const photos = await getPhotosBySpotIds(
    supabase,
    spots.map((spot) => spot.id),
    ["before"]
  );

  return spots.map((spot) => ({
    ...spot,
    before_photo_url:
      photos.find((photo) => photo.spot_id === spot.id)?.public_url ?? undefined
  }));
}

async function getImpactPairs(
  supabase: SupabaseClient,
  limit: number
): Promise<ImpactPair[]> {
  const spots = await getSpots(supabase, ["cleaned"], limit * 2);
  const photos = await getPhotosBySpotIds(
    supabase,
    spots.map((spot) => spot.id),
    ["before", "after"]
  );

  const pairs = spots
    .map((spot) => {
      const before = photos.find(
        (photo) => photo.spot_id === spot.id && photo.type === "before"
      );
      const after = photos.find(
        (photo) => photo.spot_id === spot.id && photo.type === "after"
      );

      return before && after ? { spot, before, after } : null;
    })
    .filter((pair): pair is ImpactPair => Boolean(pair));

  return pairs.slice(0, limit);
}

async function getStories(
  supabase: SupabaseClient,
  limit: number
): Promise<PublicStoryWithDetails[]> {
  const { data: storiesData, error: storiesError } = await supabase
    .from("stories")
    .select("id,spot_id,headline,caption,published,created_at,updated_at")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (storiesError) {
    if (isMissingStoriesTable(storiesError)) {
      return [];
    }

    throw storiesError;
  }

  const stories = (storiesData ?? []) as Story[];
  const spotIds = stories.map((story) => story.spot_id);

  if (spotIds.length === 0) {
    return [];
  }

  const [spotsResult, photosResult] = await Promise.all([
    supabase
      .from("public_spots")
      .select("id,title,ward,address,cleanup_date")
      .in("id", spotIds),
    supabase
      .from("photos")
      .select("id,spot_id,type,storage_path,public_url,uploaded_at")
      .in("spot_id", spotIds)
      .in("type", ["before", "after"])
      .order("uploaded_at", { ascending: true })
  ]);

  if (spotsResult.error) {
    throw spotsResult.error;
  }

  if (photosResult.error) {
    throw photosResult.error;
  }

  const spots = (spotsResult.data ?? []) as StorySpot[];
  const photos = (photosResult.data ?? []) as Photo[];

  return stories
    .map((story): PublicStoryWithDetails | null => {
      const spot = spots.find((item) => item.id === story.spot_id);

      if (!spot) {
        return null;
      }

      return {
        id: story.id,
        spot_id: story.spot_id,
        headline: story.headline,
        caption: story.caption,
        created_at: story.created_at,
        spot: {
          title: spot.title,
          ward: spot.ward,
          address: spot.address,
          cleanup_date: spot.cleanup_date
        },
        before_photo_url:
          photos.find(
            (photo) => photo.spot_id === story.spot_id && photo.type === "before"
          )?.public_url ?? null,
        after_photo_url:
          photos.find(
            (photo) => photo.spot_id === story.spot_id && photo.type === "after"
          )?.public_url ?? null
      };
    })
    .filter((story): story is PublicStoryWithDetails => Boolean(story));
}

export default async function HomePage() {
  if (!hasServiceRoleEnv()) {
    return (
      <main className="min-h-screen bg-parchment text-ink">
        <SiteNav />
        <MapHero spots={[]} counts={EMPTY_COUNTS} />
        <StatsStrip counts={EMPTY_COUNTS} />
        <ActiveSpotsSection spots={[]} />
        <ImpactSection pairs={[]} />
        <StoriesTeaser stories={[]} />
        <CTAStrip />
      </main>
    );
  }

  const supabase = createServiceRoleClient();
  const [counts, approvedSpots, mapSpots, impactPairs, stories] =
    await Promise.all([
      withFallback("home counts", getCounts(supabase), EMPTY_COUNTS),
      withFallback(
        "approved spots",
        getApprovedSpotsWithPhotos(supabase),
        [] as PublicSpotWithPhoto[]
      ),
      withFallback(
        "map spots",
        getSpots(supabase, [...PUBLIC_STATUSES], 100),
        [] as PublicSpot[]
      ),
      withFallback(
        "impact pairs",
        getImpactPairs(supabase, 4),
        [] as ImpactPair[]
      ),
      withFallback(
        "stories teaser",
        getStories(supabase, 2),
        [] as PublicStoryWithDetails[]
      )
    ]);

  return (
    <main className="min-h-screen bg-parchment text-ink">
      <SiteNav />
      <MapHero spots={mapSpots} counts={counts} />
      <StatsStrip counts={counts} />
      <ActiveSpotsSection spots={approvedSpots} />
      <ImpactSection pairs={impactPairs} />
      <StoriesTeaser stories={stories} />
      <CTAStrip />
    </main>
  );
}
