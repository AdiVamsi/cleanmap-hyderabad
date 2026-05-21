import type { Metadata } from "next";
import Link from "next/link";

import { StoryCard } from "@/components/stories/StoryCard";
import { createServiceRoleClient, hasServiceRoleEnv } from "@/lib/supabase";
import type { Photo, PublicStoryWithDetails, Story } from "@/lib/types";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Cleanup Stories — CleanMap Hyderabad",
  description: "Published cleanup success stories from CleanMap Hyderabad."
};

type StorySpot = {
  id: string;
  title: string;
  ward: string;
  address: string;
  cleanup_date: string | null;
};

function isMissingStoriesTable(error: { code?: string } | null) {
  return error?.code === "PGRST205";
}

async function getStories(): Promise<PublicStoryWithDetails[]> {
  if (!hasServiceRoleEnv()) {
    return [];
  }

  const supabase = createServiceRoleClient();
  const { data: storiesData, error: storiesError } = await supabase
    .from("stories")
    .select("id,spot_id,headline,caption,published,created_at,updated_at")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(12);

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
            (photo) =>
              photo.spot_id === story.spot_id && photo.type === "before"
          )?.public_url ?? null,
        after_photo_url:
          photos.find(
            (photo) =>
              photo.spot_id === story.spot_id && photo.type === "after"
          )?.public_url ?? null
      };
    })
    .filter((story): story is PublicStoryWithDetails => Boolean(story));
}

export default async function StoriesPage() {
  const stories = await getStories();

  return (
    <main className="min-h-screen bg-parchment text-ink">
      <nav className="mx-auto flex max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-forest hover:text-forest"
        >
          ← CleanMap Hyderabad
        </Link>
      </nav>

      <section className="mx-auto max-w-7xl px-4 pb-10 pt-4 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-forest">
          Volunteer impact
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-normal text-ink sm:text-5xl">
          Cleanup Stories
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          See how reported spots became cleaner, safer public spaces across
          Hyderabad wards.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        {stories.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              No stories published yet.
            </p>
          </div>
        )}
      </section>

      <section className="bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-normal text-ink">
              Know a dirty spot?
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Report it and help coordinators plan the next cleanup.
            </p>
          </div>
          <Link
            href="/report"
            className="inline-flex w-fit rounded-md bg-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-700"
          >
            Report a spot
          </Link>
        </div>
      </section>
    </main>
  );
}
