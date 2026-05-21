import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createServiceRoleClient, hasServiceRoleEnv } from "@/lib/supabase";
import type { Photo, PublicStoryWithDetails, Story } from "@/lib/types";

export const revalidate = 60;

type StoryPageProps = {
  params: {
    id: string;
  };
};

type StorySpot = {
  id: string;
  title: string;
  ward: string;
  address: string;
  cleanup_date: string | null;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(value));
}

function publicUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}${path}`;
}

function isMissingStoriesTable(error: { code?: string } | null) {
  return error?.code === "PGRST205";
}

async function getStory(id: string): Promise<PublicStoryWithDetails | null> {
  if (!hasServiceRoleEnv()) {
    return null;
  }

  const supabase = createServiceRoleClient();
  const { data: storyData, error: storyError } = await supabase
    .from("stories")
    .select("id,spot_id,headline,caption,published,created_at,updated_at")
    .eq("id", id)
    .eq("published", true)
    .maybeSingle();

  if (storyError) {
    if (isMissingStoriesTable(storyError)) {
      return null;
    }

    throw storyError;
  }

  if (!storyData) {
    return null;
  }

  const story = storyData as Story;
  const [spotResult, photosResult] = await Promise.all([
    supabase
      .from("public_spots")
      .select("id,title,ward,address,cleanup_date")
      .eq("id", story.spot_id)
      .maybeSingle(),
    supabase
      .from("photos")
      .select("id,spot_id,type,storage_path,public_url,uploaded_at")
      .eq("spot_id", story.spot_id)
      .in("type", ["before", "after"])
      .order("uploaded_at", { ascending: true })
  ]);

  if (spotResult.error || !spotResult.data) {
    return null;
  }

  if (photosResult.error) {
    throw photosResult.error;
  }

  const spot = spotResult.data as StorySpot;
  const photos = (photosResult.data ?? []) as Photo[];

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
      photos.find((photo) => photo.type === "before")?.public_url ?? null,
    after_photo_url:
      photos.find((photo) => photo.type === "after")?.public_url ?? null
  };
}

export async function generateMetadata({
  params
}: StoryPageProps): Promise<Metadata> {
  const story = await getStory(params.id);

  if (!story) {
    return {
      title: "Cleanup Stories — CleanMap Hyderabad"
    };
  }

  const title = `${story.headline} — CleanMap Hyderabad`;
  const description = story.caption;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: story.before_photo_url ? [{ url: story.before_photo_url }] : [],
      type: "article"
    },
    twitter: {
      card: "summary_large_image",
      title,
      description
    }
  };
}

export default async function StoryDetailPage({ params }: StoryPageProps) {
  const story = await getStory(params.id);

  if (!story) {
    notFound();
  }

  const shareText = `${story.headline}\n${publicUrl(`/stories/${story.id}`)}`;

  return (
    <main className="min-h-screen bg-parchment px-4 py-6 text-ink sm:px-6 lg:px-8">
      <article className="mx-auto max-w-4xl">
        <nav className="mb-8">
          <Link
            href="/"
            className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-forest hover:text-forest"
          >
            ← CleanMap Hyderabad
          </Link>
        </nav>

        {story.before_photo_url ? (
          <figure className="overflow-hidden rounded-lg border border-warm-border bg-white shadow-sm">
            <img
              src={story.before_photo_url}
              alt={`${story.headline} before cleanup`}
              className="max-h-96 w-full object-cover"
            />
            <figcaption className="px-4 py-3 text-sm font-bold text-slate-600">
              Before cleanup
            </figcaption>
          </figure>
        ) : null}

        {story.after_photo_url ? (
          <figure className="mt-5 overflow-hidden rounded-lg border border-warm-border bg-white shadow-sm">
            <img
              src={story.after_photo_url}
              alt={`${story.headline} after cleanup`}
              className="max-h-96 w-full object-cover"
            />
            <figcaption className="px-4 py-3 text-sm font-bold text-slate-600">
              After cleanup
            </figcaption>
          </figure>
        ) : null}

        <section className="mt-6 rounded-lg border border-warm-border bg-white p-6 shadow-sm">
          <h1 className="text-4xl font-bold tracking-normal text-ink sm:text-5xl">
            {story.headline}
          </h1>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-forest/10 px-3 py-1 text-xs font-bold text-forest">
              {story.spot.ward}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              {story.spot.address}
            </span>
          </div>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            {story.caption}
          </p>
          {story.spot.cleanup_date ? (
            <p className="mt-5 rounded-md bg-forest/10 px-4 py-3 text-sm font-bold text-forest">
              Cleaned on {formatDate(story.spot.cleanup_date)}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/spots/${story.spot_id}`}
              className="inline-flex rounded-md border border-warm-border px-5 py-3 text-sm font-bold text-ink transition hover:bg-slate-50"
            >
              View original spot →
            </Link>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
            >
              Share on WhatsApp
            </a>
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-warm-border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-bold tracking-normal text-ink">
              Report another spot
            </h2>
            <Link
              href="/report"
              className="inline-flex w-fit rounded-md bg-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-700"
            >
              Report a spot
            </Link>
          </div>
        </section>
      </article>
    </main>
  );
}
