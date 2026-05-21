import { NextResponse, type NextRequest } from "next/server";

import { isAdminRequest } from "@/lib/admin-auth";
import { createServiceRoleClient, hasServiceRoleEnv } from "@/lib/supabase";
import type { Story } from "@/lib/types";

export const runtime = "nodejs";

const STORY_SELECT =
  "id,spot_id,headline,caption,published,created_at,updated_at";

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isMissingStoriesTable(error: { code?: string } | null) {
  return error?.code === "PGRST205";
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasServiceRoleEnv()) {
    return NextResponse.json({ stories: [] });
  }

  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("stories")
      .select(STORY_SELECT)
      .order("created_at", { ascending: false });

    if (error) {
      if (isMissingStoriesTable(error)) {
        return NextResponse.json({ stories: [] });
      }

      throw error;
    }

    return NextResponse.json({ stories: (data ?? []) as Story[] });
  } catch (error) {
    console.error("Failed to fetch stories", error);
    return NextResponse.json(
      { error: "Unable to fetch stories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasServiceRoleEnv()) {
    return NextResponse.json(
      { error: "Supabase service role is not configured" },
      { status: 500 }
    );
  }

  try {
    const body = (await request.json()) as {
      spot_id?: unknown;
      headline?: unknown;
      caption?: unknown;
      published?: unknown;
    };
    const spotId = cleanText(body.spot_id);
    const headline = cleanText(body.headline);
    const caption = cleanText(body.caption);

    if (!spotId || !headline || !caption) {
      return NextResponse.json(
        { error: "spot_id, headline, and caption are required" },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("stories")
      .upsert(
        {
          spot_id: spotId,
          headline,
          caption,
          published: Boolean(body.published)
        },
        { onConflict: "spot_id" }
      )
      .select(STORY_SELECT)
      .single();

    if (error || !data) {
      throw error ?? new Error("Story upsert failed");
    }

    return NextResponse.json({ story: data as Story });
  } catch (error) {
    console.error("Failed to save story", error);
    return NextResponse.json(
      { error: "Unable to save story" },
      { status: 500 }
    );
  }
}
