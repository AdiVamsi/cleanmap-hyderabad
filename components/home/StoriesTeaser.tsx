import Link from "next/link";

import { StoryCard } from "@/components/stories/StoryCard";
import type { PublicStoryWithDetails } from "@/lib/types";

type StoriesTeaserProps = {
  stories: PublicStoryWithDetails[];
};

export function StoriesTeaser({ stories }: StoriesTeaserProps) {
  if (stories.length === 0) {
    return null;
  }

  return (
    <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-forest">
              Cleanup Stories
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-normal text-ink sm:text-4xl">
              Recent volunteer wins
            </h2>
          </div>
          <Link
            href="/stories"
            className="text-sm font-bold text-forest hover:underline"
          >
            See all →
          </Link>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {stories.slice(0, 2).map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      </div>
    </section>
  );
}
