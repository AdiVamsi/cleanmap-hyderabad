import Link from "next/link";

import { DeleteStoryButton } from "@/components/admin/DeleteStoryButton";
import { createServiceRoleClient, hasServiceRoleEnv } from "@/lib/supabase";
import type { Story } from "@/lib/types";

export const dynamic = "force-dynamic";

type AdminStoryListItem = Story & {
  spot_title: string;
  ward: string;
};

type StorySpot = {
  id: string;
  title: string;
  ward: string;
};

function isMissingStoriesTable(error: { code?: string } | null) {
  return error?.code === "PGRST205";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

async function getStories(): Promise<AdminStoryListItem[]> {
  if (!hasServiceRoleEnv()) {
    return [];
  }

  const supabase = createServiceRoleClient();
  const { data: storiesData, error: storiesError } = await supabase
    .from("stories")
    .select("id,spot_id,headline,caption,published,created_at,updated_at")
    .order("created_at", { ascending: false });

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

  const { data: spotsData, error: spotsError } = await supabase
    .from("spots")
    .select("id,title,ward")
    .in("id", spotIds);

  if (spotsError) {
    throw spotsError;
  }

  const spots = (spotsData ?? []) as StorySpot[];

  return stories.map((story) => {
    const spot = spots.find((item) => item.id === story.spot_id);

    return {
      ...story,
      spot_title: spot?.title ?? "Unknown spot",
      ward: spot?.ward ?? "Unknown ward"
    };
  });
}

export default async function AdminStoriesPage() {
  const stories = await getStories();

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-normal text-ink">
            Cleanup stories
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Review published and draft stories created from cleaned spots.
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm font-bold text-forest hover:underline"
        >
          Back to queue →
        </Link>
      </div>

      <div className="mt-8 overflow-hidden rounded-lg border border-warm-border bg-white shadow-sm">
        {stories.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Headline</th>
                  <th className="px-4 py-3">Ward</th>
                  <th className="px-4 py-3">Published</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stories.map((story) => (
                  <tr key={story.id} className="align-top">
                    <td className="max-w-md px-4 py-4">
                      <p className="font-bold text-ink">{story.headline}</p>
                      <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                        {story.spot_title}
                      </p>
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-600">
                      {story.ward}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          story.published
                            ? "bg-green-100 text-forest"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {story.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-500">
                      {formatDate(story.created_at)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/spots/${story.spot_id}`}
                          className="rounded-md bg-ink px-3 py-2 text-sm font-bold text-white transition hover:bg-slate-700"
                        >
                          Edit spot
                        </Link>
                        <DeleteStoryButton id={story.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-semibold text-slate-500">
              No cleanup stories yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
