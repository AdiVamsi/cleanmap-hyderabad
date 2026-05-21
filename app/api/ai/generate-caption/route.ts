import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse, type NextRequest } from "next/server";

import { isAdminRequest } from "@/lib/admin-auth";
import { createServiceRoleClient, hasServiceRoleEnv } from "@/lib/supabase";

export const runtime = "nodejs";

type CaptionResult = {
  headline: string;
  caption: string;
};

type CaptionSpot = {
  title: string;
  description: string;
  address: string;
  ward: string;
  severity: string;
  cleanup_date: string | null;
};

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function buildFallbackCaption(spot: CaptionSpot): CaptionResult {
  return {
    headline: truncate(`${spot.ward} cleanup makes a clear difference`, 80),
    caption: truncate(
      `Volunteers cleaned ${spot.address} in ${spot.ward}, turning a reported ${spot.severity} spot into a safer public space. Report more spots to keep CleanMap moving.`,
      280
    )
  };
}

function parseGeminiJson(text: string) {
  const trimmed = text.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Gemini did not return JSON");
  }

  return JSON.parse(withoutFence.slice(start, end + 1)) as unknown;
}

function normalizeCaption(value: unknown): CaptionResult {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid caption response");
  }

  const result = value as Record<string, unknown>;

  if (
    typeof result.headline !== "string" ||
    typeof result.caption !== "string"
  ) {
    throw new Error("Invalid caption response");
  }

  return {
    headline: result.headline.trim(),
    caption: result.caption.trim()
  };
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
    const body = (await request.json()) as { spot_id?: unknown };
    const spotId = typeof body.spot_id === "string" ? body.spot_id : "";

    if (!spotId) {
      return NextResponse.json(
        { error: "spot_id is required" },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();
    const { data: spot, error: spotError } = await supabase
      .from("spots")
      .select("title,description,address,ward,severity,cleanup_date")
      .eq("id", spotId)
      .single();

    if (spotError || !spot) {
      return NextResponse.json({ error: "Spot not found" }, { status: 404 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const prompt = `You are writing a civic cleanup success story for CleanMap Hyderabad —
a community volunteer initiative in Hyderabad, India.

Cleaned spot:
- Title: ${spot.title}
- Location: ${spot.address}, ${spot.ward} ward
- Severity: ${spot.severity} (minor=small issue, noticeable=needs attention,
  severe=serious issue, critical=urgent/dangerous)
- Description: ${spot.description}
- Cleaned on: ${spot.cleanup_date ?? "recently"}

Write a short, powerful success post. Respond with ONLY valid JSON:
{
  "headline": "Celebratory headline under 80 chars. Mention the ward.",
  "caption": "2-3 sentences. Celebrate the volunteers, name the exact location,
  invite others to report more spots. Under 280 chars. No hashtags."
}`;

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
          responseMimeType: "application/json"
        }
      });
      const generated = await model.generateContent(prompt);
      const parsed = parseGeminiJson(generated.response.text());

      return NextResponse.json(normalizeCaption(parsed));
    } catch (captionError) {
      console.error("Gemini caption generation failed", captionError);
      return NextResponse.json(buildFallbackCaption(spot as CaptionSpot));
    }
  } catch (error) {
    console.error("Failed to generate story caption", error);
    return NextResponse.json(
      { error: "Unable to generate caption" },
      { status: 500 }
    );
  }
}
