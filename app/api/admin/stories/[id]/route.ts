import { NextResponse, type NextRequest } from "next/server";

import { isAdminRequest } from "@/lib/admin-auth";
import { createServiceRoleClient, hasServiceRoleEnv } from "@/lib/supabase";
import type { Story } from "@/lib/types";

export const runtime = "nodejs";

type RouteContext = {
  params: {
    id: string;
  };
};

const STORY_SELECT =
  "id,spot_id,headline,caption,published,created_at,updated_at";

function cleanOptionalText(value: unknown) {
  return typeof value === "string" ? value.trim() : undefined;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
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
      headline?: unknown;
      caption?: unknown;
      published?: unknown;
    };
    const update: Partial<Pick<Story, "headline" | "caption" | "published">> =
      {};
    const headline = cleanOptionalText(body.headline);
    const caption = cleanOptionalText(body.caption);

    if (headline !== undefined) {
      update.headline = headline;
    }

    if (caption !== undefined) {
      update.caption = caption;
    }

    if (typeof body.published === "boolean") {
      update.published = body.published;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { error: "No story fields provided" },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("stories")
      .update(update)
      .eq("id", params.id)
      .select(STORY_SELECT)
      .single();

    if (error || !data) {
      throw error ?? new Error("Story update failed");
    }

    return NextResponse.json({ story: data as Story });
  } catch (error) {
    console.error("Failed to update story", error);
    return NextResponse.json(
      { error: "Unable to update story" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
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
    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from("stories")
      .delete()
      .eq("id", params.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete story", error);
    return NextResponse.json(
      { error: "Unable to delete story" },
      { status: 500 }
    );
  }
}
