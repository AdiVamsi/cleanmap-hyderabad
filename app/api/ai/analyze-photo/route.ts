import { NextRequest, NextResponse } from "next/server";

import {
  analyzePhotoWithGemini,
  EMPTY_PHOTO_ANALYSIS
} from "@/lib/photo-analysis";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: "Photo file is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY ?? "";

    if (!apiKey) {
      return NextResponse.json(EMPTY_PHOTO_ANALYSIS);
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const analysis = await analyzePhotoWithGemini({
      base64,
      mimeType: file.type || "image/jpeg"
    });

    return NextResponse.json(analysis);
  } catch {
    return NextResponse.json(EMPTY_PHOTO_ANALYSIS);
  }
}
