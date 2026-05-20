import { NextResponse, type NextRequest } from "next/server";

import { isAdminRequest } from "@/lib/admin-auth";
import { getAdminSpots } from "@/lib/admin-spots";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const spots = await getAdminSpots();
    return NextResponse.json({ spots });
  } catch (error) {
    console.error("Failed to fetch admin spots", error);
    return NextResponse.json(
      { error: "Unable to fetch admin spots" },
      { status: 500 }
    );
  }
}
