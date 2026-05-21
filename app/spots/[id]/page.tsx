import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusTimeline } from "@/components/spots/StatusTimeline";
import {
  SEVERITY_COLORS,
  SEVERITY_LABELS,
  STATUS_COLORS,
  STATUS_LABELS
} from "@/lib/constants";
import { createServiceRoleClient, hasServiceRoleEnv } from "@/lib/supabase";
import type { Photo, PublicSpot, StatusHistory } from "@/lib/types";

export const revalidate = 60;

type SpotDetailPageProps = {
  params: {
    id: string;
  };
};

const PUBLIC_SPOT_SELECT =
  "id,title,address,ward,latitude,longitude,severity,status,cleanup_date,created_at";

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

function PhotoFigure({
  photo,
  label,
  title
}: {
  photo: Photo;
  label: string;
  title: string;
}) {
  return (
    <figure className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="aspect-video overflow-hidden bg-slate-100">
        <img
          src={photo.public_url}
          alt={`${title} ${label.toLowerCase()} cleanup photo`}
          className="h-full w-full object-cover"
        />
      </div>
      <figcaption className="px-4 py-3 text-sm font-bold text-slate-600">
        {label}
      </figcaption>
    </figure>
  );
}

async function getPublicSpotDetails(id: string) {
  if (!hasServiceRoleEnv()) {
    return null;
  }

  const supabase = createServiceRoleClient();
  const [spotResult, photosResult, historyResult] = await Promise.all([
    supabase
      .from("public_spots")
      .select(PUBLIC_SPOT_SELECT)
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("photos")
      .select("id,spot_id,type,storage_path,public_url,uploaded_at")
      .eq("spot_id", id)
      .order("uploaded_at", { ascending: true }),
    supabase
      .from("public_status_history")
      .select("spot_id,to_status,changed_at,note")
      .eq("spot_id", id)
      .order("changed_at", { ascending: true })
  ]);

  if (spotResult.error || !spotResult.data) {
    return null;
  }

  if (photosResult.error || historyResult.error) {
    throw photosResult.error ?? historyResult.error;
  }

  return {
    spot: spotResult.data as PublicSpot,
    photos: (photosResult.data ?? []) as Photo[],
    history: (historyResult.data ?? []) as StatusHistory[]
  };
}

export async function generateMetadata({
  params
}: SpotDetailPageProps): Promise<Metadata> {
  const details = await getPublicSpotDetails(params.id);

  if (!details) {
    return {
      title: "CleanMap Hyderabad"
    };
  }

  const beforePhotoUrl = details.photos.find(
    (photo) => photo.type === "before"
  )?.public_url;
  const title = `${details.spot.title} — CleanMap Hyderabad`;
  const description = `${STATUS_LABELS[details.spot.status]} cleanup spot in ${details.spot.ward}. ${details.spot.address}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: beforePhotoUrl ? [{ url: beforePhotoUrl }] : [],
      type: "article"
    },
    twitter: {
      card: "summary_large_image",
      title,
      description
    }
  };
}

export default async function SpotDetailPage({ params }: SpotDetailPageProps) {
  const details = await getPublicSpotDetails(params.id);

  if (!details) {
    notFound();
  }

  const { spot, photos, history } = details;
  const before = photos.find((photo) => photo.type === "before");
  const after = photos.find((photo) => photo.type === "after");
  const hasCleanedPair = spot.status === "cleaned" && before && after;
  const cleanupDate =
    (spot.status === "cleanup_planned" || spot.status === "cleaned") &&
    spot.cleanup_date
      ? spot.cleanup_date
      : null;

  return (
    <main className="min-h-screen bg-[#f8faf7] px-4 py-6 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <nav className="mb-8">
          <Link
            href="/"
            className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-civic hover:text-civic"
          >
            ← CleanMap Hyderabad
          </Link>
        </nav>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap gap-2">
            <span
              className="rounded-full px-3 py-1 text-xs font-bold text-white"
              style={{ backgroundColor: STATUS_COLORS[spot.status] }}
            >
              {STATUS_LABELS[spot.status]}
            </span>
            <span
              className="rounded-full px-3 py-1 text-xs font-bold text-white"
              style={{ backgroundColor: SEVERITY_COLORS[spot.severity] }}
            >
              {SEVERITY_LABELS[spot.severity]}
            </span>
            <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-civic">
              {spot.ward}
            </span>
          </div>

          <h1 className="mt-5 text-4xl font-bold tracking-normal text-ink sm:text-5xl">
            {spot.title}
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            {spot.address}
          </p>

          {cleanupDate ? (
            <p className="mt-5 rounded-md bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
              Cleanup scheduled: {formatDate(cleanupDate)}
            </p>
          ) : null}

          {spot.status === "cleaned" ? (
            <p className="mt-4 rounded-md bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
              This spot has been cleaned! Thanks to our volunteers.
            </p>
          ) : null}
        </section>

        {hasCleanedPair ? (
          <section className="mt-6 grid gap-4 sm:grid-cols-2">
            <PhotoFigure photo={before} label="Before" title={spot.title} />
            <PhotoFigure photo={after} label="After" title={spot.title} />
          </section>
        ) : before ? (
          <section className="mt-6 sm:max-w-md">
            <PhotoFigure photo={before} label="Before" title={spot.title} />
          </section>
        ) : null}

        {history.length > 0 ? (
          <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold tracking-normal text-ink">
              Activity
            </h2>
            <div className="mt-5">
              <StatusTimeline history={history} />
            </div>
          </section>
        ) : null}

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-bold tracking-normal text-ink">
              Know another dirty spot?
            </h2>
            <Link
              href="/report"
              className="inline-flex w-fit rounded-md bg-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-700"
            >
              Report a spot
            </Link>
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-ink">Share this spot</h2>
              <p className="mt-1 text-sm text-slate-500">
                Spread the word in your community.
              </p>
            </div>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `${spot.title} — CleanMap Hyderabad\n${publicUrl(
                  `/spots/${spot.id}`
                )}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
            >
              Share on WhatsApp
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
