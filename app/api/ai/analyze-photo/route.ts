import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type AnalysisResult = {
  waste_type: string | null;
  severity: "low" | "medium" | "high" | null;
  suggested_title: string | null;
  suggested_description: string | null;
};

const EMPTY_RESULT: AnalysisResult = {
  waste_type: null,
  severity: null,
  suggested_title: null,
  suggested_description: null
};

const PROMPT = `Analyze this photo of a dirty spot in Hyderabad, India reported for community cleanup.

Respond with ONLY valid JSON — no markdown, no explanation, no code fences:
{
  "waste_type": "plastic|construction_debris|organic|mixed|other",
  "severity": "low|medium|high",
  "suggested_title": "Short specific title, max 60 characters",
  "suggested_description": "1-2 sentences describing what you see, max 180 characters"
}

Severity rules:
- high: large pile, blocks footpaths or drains, near water body, health hazard
- medium: moderate waste, inconvenience but not blocking critical access
- low: minor scattered litter, small area, minimal public impact

If the image is unclear or not a waste spot, still return your best guess with severity: "low".`;

function normalizeAnalysis(value: unknown): AnalysisResult {
  if (!value || typeof value !== "object") {
    return EMPTY_RESULT;
  }

  const result = value as Record<string, unknown>;
  const severity = result.severity;

  return {
    waste_type:
      typeof result.waste_type === "string" ? result.waste_type : null,
    severity:
      severity === "low" || severity === "medium" || severity === "high"
        ? severity
        : null,
    suggested_title:
      typeof result.suggested_title === "string"
        ? result.suggested_title
        : null,
    suggested_description:
      typeof result.suggested_description === "string"
        ? result.suggested_description
        : null
  };
}

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
      return NextResponse.json(EMPTY_RESULT);
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const generated = await model.generateContent([
      {
        inlineData: {
          data: base64,
          mimeType: file.type || "image/jpeg"
        }
      },
      { text: PROMPT }
    ]);
    const text = generated.response.text();
    const parsed = JSON.parse(text) as unknown;

    return NextResponse.json(normalizeAnalysis(parsed));
  } catch {
    return NextResponse.json(EMPTY_RESULT);
  }
}
