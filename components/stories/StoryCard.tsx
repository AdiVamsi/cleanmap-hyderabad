import Link from "next/link";

import type { PublicStoryWithDetails } from "@/lib/types";

type StoryCardProps = {
  story: PublicStoryWithDetails;
};

export function StoryCard({ story }: StoryCardProps) {
  return (
    <article className="overflow-hidden rounded-lg border border-warm-border bg-white shadow-sm">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {story.before_photo_url ? (
          <img
            src={story.before_photo_url}
            alt={`${story.headline} before cleanup`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-500">
            Cleanup photo
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-ink/85 px-3 py-1 text-xs font-bold text-white">
          Before
        </span>
      </div>
      <div className="p-5">
        <span className="rounded-full bg-forest/10 px-3 py-1 text-xs font-bold text-forest">
          {story.spot.ward}
        </span>
        <h3 className="mt-4 line-clamp-2 text-xl font-bold tracking-normal text-ink">
          {story.headline}
        </h3>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
          {story.caption}
        </p>
        <Link
          href={`/stories/${story.id}`}
          className="mt-5 inline-flex text-sm font-bold text-forest hover:underline"
        >
          Read story →
        </Link>
      </div>
    </article>
  );
}
