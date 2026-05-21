import { NextResponse, type NextRequest } from "next/server";

import {
  HYDERABAD_WARDS,
  PUBLIC_STATUSES,
  WARD_COORDINATES,
  type HyderabadWard
} from "@/lib/constants";
import { createServiceRoleClient, hasServiceRoleEnv } from "@/lib/supabase";
import type {
  ImpactPair,
  Photo,
  PublicSpot,
  PublicSpotStatus,
  PublicSpotWithPhoto,
  Severity,
  SpotCounts
} from "@/lib/types";
import { uploadSpotPhoto } from "@/lib/upload-photo";

export const runtime = "nodejs";

const PUBLIC_SPOT_SELECT =
  "id,title,address,ward,latitude,longitude,severity,status,cleanup_date,created_at";

const ZERO_COUNTS: SpotCounts = {
  reported: 0,
  approved: 0,
  planned: 0,
  cleaned: 0,
  wards: 0
};

function isSeverity(value: unknown): value is Severity {
  return ["minor", "noticeable", "severe", "critical"].includes(
    value as string
  );
}

function isPublicStatus(value: string): value is PublicSpotStatus {
  return PUBLIC_STATUSES.includes(value as PublicSpotStatus);
}

function cleanText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function getStatuses(searchParams: URLSearchParams) {
  const raw = searchParams.get("status") ?? PUBLIC_STATUSES.join(",");
  const statuses = raw
    .split(",")
    .map((status) => status.trim())
    .filter(isPublicStatus);

  return statuses.length > 0 ? statuses : [...PUBLIC_STATUSES];
}

function getLimit(searchParams: URLSearchParams) {
  const raw = Number(searchParams.get("limit") ?? 50);

  if (!Number.isFinite(raw)) {
    return 50;
  }

  return Math.min(Math.max(Math.floor(raw), 1), 100);
}

function mapPublicSpot(row: Record<string, unknown>): PublicSpot {
  return {
    id: String(row.id),
    title: String(row.title),
    address: String(row.address),
    ward: String(row.ward),
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    severity: row.severity as Severity,
    status: row.status as PublicSpotStatus,
    cleanup_date:
      typeof row.cleanup_date === "string" ? row.cleanup_date : null,
    created_at: String(row.created_at)
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

async function getPhotosBySpotIds(spotIds: string[], types?: Array<Photo["type"]>) {
  if (spotIds.length === 0) {
    return [] as Photo[];
  }

  const supabase = createServiceRoleClient();
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

async function getCounts() {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("public_spots")
    .select("status,ward");

  if (error) {
    throw error;
  }

  return countRows((data ?? []) as Array<Pick<PublicSpot, "status" | "ward">>);
}

async function getSpots(
  statuses: PublicSpotStatus[],
  limit: number
): Promise<PublicSpot[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("public_spots")
    .select(PUBLIC_SPOT_SELECT)
    .in("status", statuses)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapPublicSpot(row as Record<string, unknown>));
}

async function getImpactPairs(limit: number): Promise<ImpactPair[]> {
  const spots = await getSpots(["cleaned"], limit * 2);
  const photos = await getPhotosBySpotIds(
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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  if (!hasServiceRoleEnv()) {
    if (searchParams.get("counts") === "true") {
      return NextResponse.json({ counts: ZERO_COUNTS });
    }

    if (searchParams.get("impact") === "true") {
      return NextResponse.json({ impactPairs: [] });
    }

    return NextResponse.json({ spots: [] });
  }

  try {
    if (searchParams.get("counts") === "true") {
      const counts = await getCounts();
      return NextResponse.json({ counts });
    }

    const limit = getLimit(searchParams);

    if (searchParams.get("impact") === "true") {
      const impactPairs = await getImpactPairs(limit);
      return NextResponse.json({ impactPairs });
    }

    const statuses = getStatuses(searchParams);
    const spots = await getSpots(statuses, limit);
    const includePhotos = searchParams.get("includePhotos");

    if (includePhotos === "before") {
      const photos = await getPhotosBySpotIds(
        spots.map((spot) => spot.id),
        ["before"]
      );
      const spotsWithPhotos: PublicSpotWithPhoto[] = spots.map((spot) => ({
        ...spot,
        before_photo_url: photos.find((photo) => photo.spot_id === spot.id)
          ?.public_url
      }));

      return NextResponse.json({ spots: spotsWithPhotos });
    }

    return NextResponse.json({ spots });
  } catch (error) {
    console.error("Failed to fetch spots", error);
    return NextResponse.json(
      { error: "Unable to fetch public spots" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!hasServiceRoleEnv()) {
    return NextResponse.json(
      { error: "Supabase service role is not configured" },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const title = cleanText(formData.get("title"));
    const description = cleanText(formData.get("description"));
    const address = cleanText(formData.get("address"));
    const ward = cleanText(formData.get("ward"));
    const severity = cleanText(formData.get("severity"));
    const reportedByName =
      cleanText(formData.get("reported_by_name")) || "Anonymous";
    const reportedByPhone = cleanText(formData.get("reported_by_phone"));

    if (
      !title ||
      !description ||
      !address ||
      !ward ||
      !severity
    ) {
      return NextResponse.json(
        { error: "Please fill out all required fields" },
        { status: 400 }
      );
    }

    if (
      !HYDERABAD_WARDS.includes(ward as HyderabadWard) ||
      !isSeverity(severity)
    ) {
      return NextResponse.json(
        { error: "Invalid ward or severity value" },
        { status: 400 }
      );
    }

    const coordinates = WARD_COORDINATES[ward as HyderabadWard];
    const supabase = createServiceRoleClient();
    const { data: spot, error: spotError } = await supabase
      .from("spots")
      .insert({
        title,
        description,
        address,
        ward,
        severity,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        status: "pending",
        reported_by_name: reportedByName,
        reported_by_phone: reportedByPhone || null
      })
      .select("id")
      .single();

    if (spotError || !spot) {
      throw spotError ?? new Error("Spot insert failed");
    }

    const { error: historyError } = await supabase
      .from("status_history")
      .insert({
        spot_id: spot.id,
        from_status: null,
        to_status: "pending",
        note: "Submitted through public report form"
      });

    if (historyError) {
      throw historyError;
    }

    const photo = formData.get("photo");

    if (photo instanceof File && photo.size > 0) {
      await uploadSpotPhoto({
        buffer: Buffer.from(await photo.arrayBuffer()),
        spotId: spot.id,
        type: "before",
        contentType: photo.type || "image/jpeg"
      });
    }

    return NextResponse.json({
      id: spot.id,
      message: "Report submitted"
    });
  } catch (error) {
    console.error("Failed to submit spot", error);
    return NextResponse.json(
      { error: "Unable to submit report" },
      { status: 500 }
    );
  }
}
