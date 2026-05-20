import { NextResponse, type NextRequest } from "next/server";

import { isAdminRequest } from "@/lib/admin-auth";
import { isPhotoType, uploadSpotPhoto } from "@/lib/upload-photo";

export const runtime = "nodejs";

function decodeJsonBuffer(value: unknown) {
  if (typeof value === "string") {
    return Buffer.from(value, "base64");
  }

  if (Array.isArray(value)) {
    return Buffer.from(value);
  }

  if (
    value &&
    typeof value === "object" &&
    "data" in value &&
    Array.isArray(value.data)
  ) {
    return Buffer.from(value.data);
  }

  return null;
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type") ?? "";
    let spotId = "";
    let type: unknown;
    let buffer: Buffer | null = null;
    let mimeType = "image/jpeg";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      spotId = String(formData.get("spot_id") ?? "");
      type = formData.get("type");

      if (file instanceof File) {
        buffer = Buffer.from(await file.arrayBuffer());
        mimeType = file.type || mimeType;
      }
    } else {
      const body = (await request.json()) as {
        spot_id?: string;
        type?: unknown;
        buffer?: unknown;
        content_type?: string;
      };

      spotId = body.spot_id ?? "";
      type = body.type;
      buffer = decodeJsonBuffer(body.buffer);
      mimeType = body.content_type ?? mimeType;
    }

    if (!buffer || !spotId || !isPhotoType(type)) {
      return NextResponse.json(
        { error: "spot_id, type, and file buffer are required" },
        { status: 400 }
      );
    }

    const result = await uploadSpotPhoto({
      buffer,
      spotId,
      type,
      contentType: mimeType
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Upload failed", error);
    return NextResponse.json(
      { error: "Photo upload failed" },
      { status: 500 }
    );
  }
}
