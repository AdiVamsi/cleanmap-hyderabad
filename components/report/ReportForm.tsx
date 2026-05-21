"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState
} from "react";
import imageCompression from "browser-image-compression";

import {
  HYDERABAD_WARDS,
  SEVERITY_DESCRIPTIONS,
  SEVERITY_LABELS,
  SEVERITY_OPTIONS
} from "@/lib/constants";

type SubmitState = "idle" | "submitting" | "success";
type SeverityValue = "minor" | "noticeable" | "severe" | "critical";

type AnalysisResult = {
  waste_type: string | null;
  severity: SeverityValue | null;
  suggested_title: string | null;
  suggested_description: string | null;
  is_genuine: boolean;
  confidence: "high" | "medium" | "low";
};

const requiredFields = [
  ["ward", "Area/Ward"],
  ["address", "Address"]
] as const;

function toUploadFile(file: Blob, originalName: string) {
  const baseName = originalName.replace(/\.[^/.]+$/, "") || "spot-photo";
  return new File([file], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now()
  });
}

export function ReportForm() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const analysisRequestRef = useRef(0);
  const [state, setState] = useState<SubmitState>("idle");
  const [error, setError] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isCompressing, setIsCompressing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<SeverityValue | "">("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggested, setAiSuggested] = useState(false);
  const [autoApproved, setAutoApproved] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setError("");
    setAiSuggested(false);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }

    if (!file) {
      analysisRequestRef.current += 1;
      setPhoto(null);
      setIsAnalyzing(false);
      return;
    }

    try {
      analysisRequestRef.current += 1;
      setIsCompressing(true);
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
        fileType: "image/jpeg"
      });
      const uploadFile = toUploadFile(compressed, file.name);
      setPhoto(uploadFile);
      setPreviewUrl(URL.createObjectURL(uploadFile));
      setIsCompressing(false);

      const analysisRequestId = analysisRequestRef.current;
      setIsAnalyzing(true);
      try {
        const analysisForm = new FormData();
        analysisForm.append("file", uploadFile, uploadFile.name);
        const res = await fetch("/api/ai/analyze-photo", {
          method: "POST",
          body: analysisForm
        });

        if (res.ok) {
          const result = (await res.json()) as AnalysisResult;

          if (analysisRequestId !== analysisRequestRef.current) {
            return;
          }

          if (result.suggested_title) {
            setTitle(result.suggested_title);
          }

          if (result.suggested_description) {
            setDescription(result.suggested_description);
          }

          if (result.severity) {
            setSeverity(result.severity);
          }

          if (result.suggested_title || result.severity) {
            setAiSuggested(true);
          }
        }
      } catch {
        // AI failure must not block form submission.
      } finally {
        if (analysisRequestId === analysisRequestRef.current) {
          setIsAnalyzing(false);
        }
      }
    } catch {
      setPhoto(null);
      setIsAnalyzing(false);
      setError("Photo compression failed. Try another image.");
    } finally {
      setIsCompressing(false);
    }
  }

  function validate(formData: FormData) {
    if (!title.trim()) {
      return "Spot Title is required.";
    }

    if (!description.trim()) {
      return "Description is required.";
    }

    if (!severity) {
      return "Severity is required.";
    }

    for (const [field, label] of requiredFields) {
      const value = formData.get(field);
      const text = typeof value === "string" ? value.trim() : "";

      if (!text) {
        return `${label} is required.`;
      }
    }

    if (!SEVERITY_OPTIONS.includes(severity)) {
      return "Choose a valid severity.";
    }

    return "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (isCompressing) {
      setError("Photo is still being prepared.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    formData.set("severity", severity);
    formData.set("title", title);
    formData.set("description", description);
    const validationError = validate(formData);

    if (validationError) {
      setError(validationError);
      return;
    }

    formData.delete("photo");

    if (photo) {
      formData.append("photo", photo, photo.name);
    }

    try {
      setState("submitting");
      const response = await fetch("/api/spots", {
        method: "POST",
        body: formData
      });
      const body = (await response.json()) as {
        auto_approved?: boolean;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(body.error ?? "Unable to submit report.");
      }

      setAutoApproved(body.auto_approved === true);
      setState("success");
      formRef.current?.reset();
      setTitle("");
      setDescription("");
      setSeverity("");
      setPhoto(null);
      setPreviewUrl("");
      setAiSuggested(false);
    } catch (submitError) {
      setState("idle");
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit report."
      );
    }
  }

  if (state === "success") {
    return (
      <section
        className={`rounded-lg border bg-white p-8 shadow-sm ${
          autoApproved ? "border-green-200" : "border-amber-200"
        }`}
      >
        {autoApproved ? (
          <>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-forest">
              Live on the map
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-normal text-ink">
              Your report is live. The map is updated.
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Share it with your community.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
              Under Review
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-normal text-ink">
              Report submitted for review.
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Our team will verify and publish it shortly.
            </p>
          </>
        )}
      </section>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="rounded-lg border border-warm-border bg-white p-5 shadow-sm sm:p-6 lg:p-7"
    >
      <div className="grid gap-5">
        <div className="grid gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4">
          <p className="text-sm font-semibold text-orange-800">
            Photo will be reviewed by admin before going public.
          </p>
          <p className="text-xs font-semibold text-orange-700">
            Limit: 5 photo reports per device in 24 hours.
          </p>
          <label className="grid gap-2">
            <span className="text-sm font-bold text-slate-700">
              Before Photo
            </span>
            <input
              name="photo"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="rounded-md border border-slate-300 bg-white px-3 py-3 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-forest file:px-4 file:py-2 file:text-sm file:font-bold file:text-white"
            />
          </label>

          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Selected cleanup spot"
              className="h-28 w-28 rounded-md object-cover"
            />
          ) : null}

          {isAnalyzing ? (
            <p className="text-sm font-semibold text-forest">
              AI is reading your photo...
            </p>
          ) : null}

          {isCompressing ? (
            <p className="text-sm font-semibold text-slate-600">
              Preparing photo...
            </p>
          ) : null}
        </div>

        {aiSuggested && !isAnalyzing ? (
          <p className="rounded-md bg-forest/10 px-4 py-3 text-sm font-semibold text-forest">
            Fields filled based on your photo — review and edit before
            submitting.
          </p>
        ) : null}

        <label className="grid gap-2">
          <span className="text-sm font-bold text-slate-700">Spot Title</span>
          <input
            name="title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="rounded-md border border-slate-300 px-3 py-3 text-base outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/20"
            required
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-bold text-slate-700">Description</span>
          <textarea
            name="description"
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="rounded-md border border-slate-300 px-3 py-3 text-base outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/20"
            required
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-bold text-slate-700">Area/Ward</span>
            <select
              name="ward"
              className="rounded-md border border-slate-300 bg-white px-3 py-3 text-base outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/20"
              required
              defaultValue=""
            >
              <option value="" disabled>
                Select ward
              </option>
              {HYDERABAD_WARDS.map((ward) => (
                <option key={ward} value={ward}>
                  {ward}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-bold text-slate-700">Address</span>
            <input
              name="address"
              type="text"
              className="rounded-md border border-slate-300 px-3 py-3 text-base outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/20"
              required
            />
          </label>
        </div>

        <fieldset className="grid gap-3">
          <legend className="text-sm font-bold text-slate-700">Severity</legend>
          <p className="text-xs font-semibold text-slate-500">
            Pick the closest level. You can still submit if you are unsure.
          </p>
          <input type="hidden" name="severity" value={severity} />
          <div className="grid gap-3 sm:grid-cols-2">
            {SEVERITY_OPTIONS.map((severityValue) => (
              <label
                key={severityValue}
                className="grid min-h-[92px] cursor-pointer grid-cols-[auto_1fr] items-start gap-3 rounded-md border border-slate-300 bg-white p-4 text-sm font-semibold text-slate-700 transition hover:border-forest/60 hover:bg-slate-50 has-[:checked]:border-forest has-[:checked]:bg-forest/10 has-[:checked]:shadow-sm"
              >
                <input
                  name="severity"
                  type="radio"
                  value={severityValue}
                  checked={severity === severityValue}
                  onChange={() => setSeverity(severityValue)}
                  className="mt-1 h-4 w-4 shrink-0 accent-forest"
                  required
                />
                <div className="grid min-w-0 gap-1">
                  <span className="break-words font-bold leading-tight">
                    {SEVERITY_LABELS[severityValue]}
                  </span>
                  <span className="break-words text-xs leading-snug text-slate-500">
                    {SEVERITY_DESCRIPTIONS[severityValue]}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </fieldset>

        {error ? (
          <p className="rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={state === "submitting" || isCompressing}
          className="rounded-md bg-ink px-5 py-3 text-base font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {state === "submitting" ? "Submitting..." : "Submit report"}
        </button>
      </div>
    </form>
  );
}
