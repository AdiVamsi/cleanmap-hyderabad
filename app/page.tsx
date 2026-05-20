import { ApprovedSpotsGrid } from "@/components/home/ApprovedSpotsGrid";
import { CTAStrip } from "@/components/home/CTAStrip";
import { HeroSection } from "@/components/home/HeroSection";
import { ImpactSection } from "@/components/home/ImpactSection";
import { MapPreview } from "@/components/home/MapPreview";
import { StatsBar } from "@/components/home/StatsBar";
import type {
  ImpactPair,
  PublicSpot,
  PublicSpotWithPhoto,
  SpotCounts
} from "@/lib/types";

export const revalidate = 60;

const EMPTY_COUNTS: SpotCounts = {
  reported: 0,
  approved: 0,
  planned: 0,
  cleaned: 0,
  wards: 0
};

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return "http://localhost:3000";
}

async function fetchJson<T>(path: string, fallback: T): Promise<T> {
  const baseUrl = getBaseUrl();

  if (!baseUrl) {
    return fallback;
  }

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      return fallback;
    }

    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

export default async function HomePage() {
  const [statsResponse, approvedResponse, mapResponse, impactResponse] =
    await Promise.all([
      fetchJson<{ counts: SpotCounts }>("/api/spots?counts=true", {
        counts: EMPTY_COUNTS
      }),
      fetchJson<{ spots: PublicSpotWithPhoto[] }>(
        "/api/spots?status=approved&limit=6&includePhotos=before",
        { spots: [] }
      ),
      fetchJson<{ spots: PublicSpot[] }>(
        "/api/spots?status=approved,cleanup_planned,cleaned&limit=100",
        { spots: [] }
      ),
      fetchJson<{ impactPairs: ImpactPair[] }>(
        "/api/spots?status=cleaned&limit=4&impact=true",
        { impactPairs: [] }
      )
    ]);

  return (
    <main className="min-h-screen bg-[#f8faf7] text-ink">
      <HeroSection />
      <StatsBar counts={statsResponse.counts} />
      <ApprovedSpotsGrid spots={approvedResponse.spots} />
      <MapPreview spots={mapResponse.spots} />
      <ImpactSection pairs={impactResponse.impactPairs} />
      <CTAStrip />
    </main>
  );
}
