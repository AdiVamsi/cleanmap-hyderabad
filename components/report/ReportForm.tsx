"use client";

import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import imageCompression from "browser-image-compression";

import {
  HYDERABAD_WARDS,
  SEVERITY_LABELS,
  SEVERITY_OPTIONS
} from "@/lib/constants";

type SubmitState = "idle" | "submitting" | "success";

const requiredFields = [
  ["title", "Spot Title"],
  ["description", "Description"],
  ["ward", "Area/Ward"],
  ["address", "Address"],
  ["severity", "Severity"],
  ["reported_by_name", "Your Name"]
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
  const [state, setState] = useState<SubmitState>("idle");
  const [error, setError] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isCompressing, setIsCompressing] = useState(false);

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

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }

    if (!file) {
      setPhoto(null);
      return;
    }

    try {
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
    } catch {
      setPhoto(null);
      setError("Photo compression failed. Try another image.");
    } finally {
      setIsCompressing(false);
    }
  }

  function validate(formData: FormData) {
    for (const [field, label] of requiredFields) {
      const value = formData.get(field);
      const text = typeof value === "string" ? value.trim() : "";

      if (!text) {
        return `${label} is required.`;
      }
    }

    if (!SEVERITY_OPTIONS.includes(formData.get("severity") as never)) {
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
      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(body.error ?? "Unable to submit report.");
      }

      setState("success");
      formRef.current?.reset();
      setPhoto(null);
      setPreviewUrl("");
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
      <section className="rounded-lg border border-green-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
          Submitted
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-normal text-ink">
          Your report is submitted and under review. We&apos;ll clean it up
          soon.
        </h2>
      </section>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="grid gap-5">
        <label className="grid gap-2">
          <span className="text-sm font-bold text-slate-700">Spot Title</span>
          <input
            name="title"
            type="text"
            className="rounded-md border border-slate-300 px-3 py-3 text-base outline-none transition focus:border-civic focus:ring-2 focus:ring-civic/20"
            required
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-bold text-slate-700">Description</span>
          <textarea
            name="description"
            rows={4}
            className="rounded-md border border-slate-300 px-3 py-3 text-base outline-none transition focus:border-civic focus:ring-2 focus:ring-civic/20"
            required
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-bold text-slate-700">Area/Ward</span>
            <select
              name="ward"
              className="rounded-md border border-slate-300 bg-white px-3 py-3 text-base outline-none transition focus:border-civic focus:ring-2 focus:ring-civic/20"
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
              className="rounded-md border border-slate-300 px-3 py-3 text-base outline-none transition focus:border-civic focus:ring-2 focus:ring-civic/20"
              required
            />
          </label>
        </div>

        <fieldset className="grid gap-3">
          <legend className="text-sm font-bold text-slate-700">Severity</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {SEVERITY_OPTIONS.map((severity) => (
              <label
                key={severity}
                className="flex cursor-pointer items-center gap-3 rounded-md border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-700 transition has-[:checked]:border-civic has-[:checked]:bg-teal-50"
              >
                <input
                  name="severity"
                  type="radio"
                  value={severity}
                  className="h-4 w-4 accent-civic"
                  required
                />
                {SEVERITY_LABELS[severity]}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-bold text-slate-700">Your Name</span>
            <input
              name="reported_by_name"
              type="text"
              className="rounded-md border border-slate-300 px-3 py-3 text-base outline-none transition focus:border-civic focus:ring-2 focus:ring-civic/20"
              required
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-bold text-slate-700">Your Phone</span>
            <span className="text-xs font-medium text-slate-500">
              for coordinator to contact you &mdash; not shown publicly
            </span>
            <input
              name="reported_by_phone"
              type="tel"
              className="rounded-md border border-slate-300 px-3 py-3 text-base outline-none transition focus:border-civic focus:ring-2 focus:ring-civic/20"
            />
          </label>
        </div>

        <div className="grid gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4">
          <p className="text-sm font-semibold text-orange-800">
            Photo will be reviewed by admin before going public.
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
              className="rounded-md border border-slate-300 bg-white px-3 py-3 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-civic file:px-4 file:py-2 file:text-sm file:font-bold file:text-white"
            />
          </label>

          {isCompressing ? (
            <p className="text-sm font-semibold text-slate-600">
              Preparing photo...
            </p>
          ) : null}

          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Selected cleanup spot"
              className="h-28 w-28 rounded-md object-cover"
            />
          ) : null}
        </div>

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
