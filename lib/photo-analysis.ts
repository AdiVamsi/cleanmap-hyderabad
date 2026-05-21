import { GoogleGenerativeAI } from "@google/generative-ai";

import type { Severity } from "@/lib/types";

export type AnalysisConfidence = "high" | "medium" | "low";

export type PhotoAnalysisResult = {
  waste_type: string | null;
  severity: Severity | null;
  suggested_title: string | null;
  suggested_description: string | null;
  is_genuine: boolean;
  confidence: AnalysisConfidence;
};

export const EMPTY_PHOTO_ANALYSIS: PhotoAnalysisResult = {
  waste_type: null,
  severity: null,
  suggested_title: null,
  suggested_description: null,
  is_genuine: false,
  confidence: "low"
};

export const PHOTO_ANALYSIS_PROMPT = `Analyze this photo of a dirty spot in Hyderabad, India reported for community cleanup.

Respond with ONLY valid JSON — no markdown, no explanation, no code fences:
{
  "waste_type": "plastic|construction_debris|organic|mixed|other",
  "severity": "minor|noticeable|severe|critical",
  "suggested_title": "Short specific title, max 60 characters",
  "suggested_description": "1-2 sentences describing what you see, max 180 characters",
  "is_genuine": true,
  "confidence": "high|medium|low"
}

Validation rules:
- is_genuine: true if this clearly shows garbage, waste, illegal dumping,
  overflowing bins, construction debris, or an environmental mess in a public
  space.
- is_genuine: false if it shows a person, a meal, an interior of a building,
  a vehicle, nature with no visible waste, or anything unrelated to public
  cleanliness.
- confidence: "high" if clearly garbage or clearly not garbage.
- confidence: "medium" if uncertain.
- confidence: "low" if the image is too blurry, dark, cropped, or ambiguous.

Severity rules (Hyderabad context):
- critical: Urgent/dangerous health hazard, near water body, blocking drain
  or footpath, large pile affecting many people
- severe: Serious issue, large pile, needs urgent cleanup
- noticeable: Needs attention, moderate waste, noticeable problem for locals
- minor: Small issue, minor litter, small area, minimal public impact

If the image is unclear or not a waste spot, return your best guess with severity: "minor", is_genuine: false, and confidence: "low".`;

function parseJson(text: string) {
  const withoutFence = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI did not return JSON");
  }

  return JSON.parse(withoutFence.slice(start, end + 1)) as unknown;
}

export function normalizePhotoAnalysis(value: unknown): PhotoAnalysisResult {
  if (!value || typeof value !== "object") {
    return EMPTY_PHOTO_ANALYSIS;
  }

  const result = value as Record<string, unknown>;
  const severity = result.severity;
  const confidence = result.confidence;
  const validSeverities = ["minor", "noticeable", "severe", "critical"];
  const validConfidence: AnalysisConfidence[] = ["high", "medium", "low"];

  return {
    waste_type:
      typeof result.waste_type === "string" ? result.waste_type : null,
    severity: validSeverities.includes(String(severity))
      ? (severity as Severity)
      : null,
    suggested_title:
      typeof result.suggested_title === "string"
        ? result.suggested_title.slice(0, 60)
        : null,
    suggested_description:
      typeof result.suggested_description === "string"
        ? result.suggested_description.slice(0, 180)
        : null,
    is_genuine: result.is_genuine === true,
    confidence: validConfidence.includes(confidence as AnalysisConfidence)
      ? (confidence as AnalysisConfidence)
      : "low"
  };
}

export async function analyzePhotoWithGemini({
  base64,
  mimeType
}: {
  base64: string;
  mimeType: string;
}) {
  const apiKey = process.env.GEMINI_API_KEY ?? "";

  if (!apiKey) {
    return EMPTY_PHOTO_ANALYSIS;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json"
    }
  });
  const generated = await model.generateContent([
    {
      inlineData: {
        data: base64,
        mimeType
      }
    },
    { text: PHOTO_ANALYSIS_PROMPT }
  ]);

  return normalizePhotoAnalysis(parseJson(generated.response.text()));
}
