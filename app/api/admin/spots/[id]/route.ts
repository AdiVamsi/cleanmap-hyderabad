import { NextResponse, type NextRequest } from "next/server";

import { isAdminRequest } from "@/lib/admin-auth";
import { ADMIN_SPOT_SELECT, getAdminSpotWithDetails } from "@/lib/admin-spots";
import { STATUS_LABELS } from "@/lib/constants";
import { createServiceRoleClient, hasServiceRoleEnv } from "@/lib/supabase";
import type {
  AdminSpot,
  SpotStatus,
  StatusTransitionPayload
} from "@/lib/types";

export const runtime = "nodejs";

type RouteContext = {
  params: {
    id: string;
  };
};

function isSpotStatus(value: unknown): value is SpotStatus {
  return (
    typeof value === "string" &&
    Object.keys(STATUS_LABELS).includes(value)
  );
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const spot = await getAdminSpotWithDetails(params.id);

    if (!spot) {
      return NextResponse.json({ error: "Spot not found" }, { status: 404 });
    }

    return NextResponse.json({ spot });
  } catch (error) {
    console.error("Failed to fetch admin spot", error);
    return NextResponse.json(
      { error: "Unable to fetch admin spot" },
      { status: 500 }
    );
  }
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
    const payload = (await request.json()) as StatusTransitionPayload;

    if (!isSpotStatus(payload.status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    if (payload.status === "cleanup_planned" && !payload.cleanup_date) {
      return NextResponse.json(
        { error: "cleanup_date is required" },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();
    const { data: current, error: currentError } = await supabase
      .from("spots")
      .select("id,status")
      .eq("id", params.id)
      .single();

    if (currentError || !current) {
      return NextResponse.json({ error: "Spot not found" }, { status: 404 });
    }

    const note = payload.note?.trim() || null;
    const update: Partial<AdminSpot> = {
      status: payload.status
    };

    if (payload.cleanup_date) {
      update.cleanup_date = payload.cleanup_date;
    }

    if (note) {
      update.admin_note = note;
    }

    const [updateResult, historyResult] = await Promise.all([
      supabase
        .from("spots")
        .update(update)
        .eq("id", params.id)
        .select(ADMIN_SPOT_SELECT)
        .single(),
      supabase.from("status_history").insert({
        spot_id: params.id,
        from_status: String(current.status),
        to_status: payload.status,
        note
      })
    ]);

    if (historyResult.error) {
      console.error("Failed to insert status history", historyResult.error);
    }

    if (updateResult.error || !updateResult.data) {
      console.error("Failed to update spot", updateResult.error);
      return NextResponse.json(
        { error: "Unable to update spot" },
        { status: 500 }
      );
    }

    return NextResponse.json({ spot: updateResult.data as AdminSpot });
  } catch (error) {
    console.error("Failed to transition spot", error);
    return NextResponse.json(
      { error: "Unable to update spot" },
      { status: 500 }
    );
  }
}
