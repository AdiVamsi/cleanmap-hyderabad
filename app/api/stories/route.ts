import { NextResponse, type NextRequest } from "next/server";

import { createServiceRoleClient, hasServiceRoleEnv } from "@/lib/supabase";
import type { Photo, PublicStoryWithDetails, Story } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StorySpot = {
  id: string;
  title: string;
  ward: string;
  address: string;
  cleanup_date: string | null;
};

function getLimit(searchParams: URLSearchParams) {
  const raw = Number(searchParams.get("limit") ?? 6);

  if (!Number.isFinite(raw)) {
    return 6;
  }

  return Math.min(Math.max(Math.floor(raw), 1), 12);
}

function isMissingStoriesTable(error: { code?: string } | null) {
  return error?.code === "PGRST205";
}

export async function GET(request: NextRequest) {
  if (!hasServiceRoleEnv()) {
    return NextResponse.json({ stories: [] });
  }

  try {
    const limit = getLimit(request.nextUrl.searchParams);
    const supabase = createServiceRoleClient();
    const { data: storiesData, error: storiesError } = await supabase
      .from("stories")
      .select("id,spot_id,headline,caption,published,created_at,updated_at")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (storiesError) {
      if (isMissingStoriesTable(storiesError)) {
        return NextResponse.json({ stories: [] });
      }

      throw storiesError;
    }

    const stories = (storiesData ?? []) as Story[];
    const spotIds = stories.map((story) => story.spot_id);

    if (spotIds.length === 0) {
      return NextResponse.json({ stories: [] });
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
    const publicStories = stories
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

    return NextResponse.json({ stories: publicStories });
  } catch (error) {
    console.error("Failed to fetch public stories", error);
    return NextResponse.json(
      { error: "Unable to fetch stories" },
      { status: 500 }
    );
  }
}
