import { NextResponse, type NextRequest } from "next/server";

import { isAdminRequest } from "@/lib/admin-auth";
import { hasServiceRoleEnv } from "@/lib/supabase";
import { uploadSpotPhoto } from "@/lib/upload-photo";

export const runtime = "nodejs";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function POST(request: NextRequest, { params }: RouteContext) {
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
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: "After photo file is required" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadSpotPhoto({
      buffer,
      spotId: params.id,
      type: "after",
      contentType: file.type || "image/jpeg"
    });

    return NextResponse.json({ ok: true, public_url: result.public_url });
  } catch (error) {
    console.error("After photo upload failed", error);
    return NextResponse.json(
      { error: "After photo upload failed" },
      { status: 500 }
    );
  }
}
