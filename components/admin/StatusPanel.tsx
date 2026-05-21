"use client";

import imageCompression from "browser-image-compression";
import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";

import {
  SEVERITY_COLORS,
  SEVERITY_LABELS,
  STATUS_COLORS,
  STATUS_LABELS
} from "@/lib/constants";
import type {
  AdminSpotWithDetails,
  Photo,
  SpotStatus,
  StatusTransitionPayload
} from "@/lib/types";

type StatusPanelProps = {
  spot: AdminSpotWithDetails;
};

type ActionDefinition = {
  key: string;
  label: string;
  nextStatus: SpotStatus;
  noteLabel: string;
  requiresDate?: boolean;
  variant: "primary" | "danger" | "secondary";
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function statusLabel(status: string) {
  return status in STATUS_LABELS
    ? STATUS_LABELS[status as SpotStatus]
    : status;
}

function statusColor(status: string) {
  return status in STATUS_COLORS
    ? STATUS_COLORS[status as SpotStatus]
    : "#9CA3AF";
}

function getActions(status: SpotStatus): ActionDefinition[] {
  if (status === "pending") {
    return [
      {
        key: "approve",
        label: "Approve",
        nextStatus: "approved",
        noteLabel: "Approval note",
        variant: "primary"
      },
      {
        key: "reject",
        label: "Reject",
        nextStatus: "rejected",
        noteLabel: "Reason for rejection",
        variant: "danger"
      }
    ];
  }

  if (status === "approved") {
    return [
      {
        key: "schedule",
        label: "Schedule cleanup",
        nextStatus: "cleanup_planned",
        noteLabel: "Scheduling note",
        requiresDate: true,
        variant: "primary"
      },
      {
        key: "reject",
        label: "Reject",
        nextStatus: "rejected",
        noteLabel: "Reason for rejection",
        variant: "danger"
      }
    ];
  }

  if (status === "cleanup_planned") {
    return [
      {
        key: "cleaned",
        label: "Mark as cleaned",
        nextStatus: "cleaned",
        noteLabel: "Cleanup note",
        variant: "primary"
      },
      {
        key: "back-approved",
        label: "Back to approved",
        nextStatus: "approved",
        noteLabel: "Status note",
        variant: "secondary"
      }
    ];
  }

  return [];
}

function actionClass(variant: ActionDefinition["variant"]) {
  if (variant === "danger") {
    return "bg-red-600 text-white hover:bg-red-700";
  }

  if (variant === "secondary") {
    return "border border-slate-300 bg-white text-ink hover:bg-slate-50";
  }

  return "bg-civic text-white hover:bg-teal-700";
}

function PhotoSlot({
  photo,
  type
}: {
  photo?: Photo;
  type: "before" | "after";
}) {
  const label = type === "before" ? "Before" : "After";

  if (!photo) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-100 text-sm font-semibold text-slate-500">
        No {type} photo yet
      </div>
    );
  }

  return (
    <figure className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
      <div className="aspect-video">
        <img
          src={photo.public_url}
          alt={`${label} cleanup photo`}
          className="h-full w-full object-cover"
        />
      </div>
      <figcaption className="px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </figcaption>
    </figure>
  );
}

export function StatusPanel({ spot }: StatusPanelProps) {
  const router = useRouter();
  const actions = getActions(spot.status);
  const [activeAction, setActiveAction] = useState<ActionDefinition | null>(null);
  const [note, setNote] = useState("");
  const [cleanupDate, setCleanupDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);

  const photos = useMemo(() => {
    return {
      before: spot.photos.find((photo) => photo.type === "before"),
      after: spot.photos.find((photo) => photo.type === "after")
    };
  }, [spot.photos]);

  const today = new Date().toISOString().slice(0, 10);

  function toggleAction(action: ActionDefinition) {
    setError("");
    setUploadError("");
    setNote("");
    setCleanupDate("");
    setPhotoFile(null);
    setActiveAction((current) =>
      current?.key === action.key ? null : action
    );
  }

  async function uploadAfterPhoto(file: File) {
    const compressed = await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1800,
      useWebWorker: true
    });
    const formData = new FormData();
    formData.append("file", compressed, compressed.name);

    const response = await fetch(`/api/admin/spots/${spot.id}/photo`, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      throw new Error(body.error ?? "Upload failed");
    }
  }

  async function handleStandalonePhotoUpload() {
    if (!photoFile) {
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      await uploadAfterPhoto(photoFile);
      setPhotoFile(null);
      router.refresh();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activeAction) {
      return;
    }

    if (activeAction.requiresDate && !cleanupDate) {
      setError("cleanup_date is required");
      return;
    }

    const payload: StatusTransitionPayload = {
      status: activeAction.nextStatus,
      note
    };

    if (activeAction.requiresDate) {
      payload.cleanup_date = cleanupDate;
    }

    setLoading(true);
    setError("");
    setUploadError("");

    try {
      if (activeAction.nextStatus === "cleaned" && photoFile) {
        setUploading(true);

        try {
          await uploadAfterPhoto(photoFile);
        } catch (uploadPhotoError) {
          setUploadError(
            uploadPhotoError instanceof Error
              ? uploadPhotoError.message
              : "Upload failed"
          );
          return;
        } finally {
          setUploading(false);
        }
      }

      const response = await fetch(`/api/admin/spots/${spot.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(body.error ?? "Unable to update spot");
      }

      setActiveAction(null);
      setNote("");
      setCleanupDate("");
      setPhotoFile(null);
      setUploadError("");
      router.refresh();
    } catch (transitionError) {
      setError(
        transitionError instanceof Error
          ? transitionError.message
          : "Unable to update spot"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-3">
      <div className="grid gap-6 lg:col-span-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-3 py-1 text-xs font-bold text-white"
              style={{ backgroundColor: STATUS_COLORS[spot.status] }}
            >
              {STATUS_LABELS[spot.status]}
            </span>
            <span
              className="rounded-full px-3 py-1 text-xs font-bold text-white"
              style={{ backgroundColor: SEVERITY_COLORS[spot.severity] }}
            >
              {SEVERITY_LABELS[spot.severity]}
            </span>
          </div>

          <h1 className="mt-4 text-4xl font-bold tracking-normal text-ink">
            {spot.title}
          </h1>
          <p className="mt-3 text-base font-semibold text-civic">{spot.ward}</p>
          <p className="mt-2 text-base leading-7 text-slate-600">
            {spot.address}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-ink">Description</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
            {spot.description}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-ink">Photos</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <PhotoSlot photo={photos.before} type="before" />
            <PhotoSlot photo={photos.after} type="after" />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-ink">Status history</h2>
          {spot.history.length > 0 ? (
            <ol className="mt-4 grid gap-3">
              {spot.history.map((entry, index) => (
                <li
                  key={`${entry.changed_at}-${index}`}
                  className="rounded-md border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-full px-3 py-1 text-xs font-bold text-white"
                      style={{ backgroundColor: statusColor(entry.to_status) }}
                    >
                      {statusLabel(entry.to_status)}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      {formatDate(entry.changed_at)}
                    </span>
                  </div>
                  {entry.note ? (
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {entry.note}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-sm text-slate-500">
              No status changes recorded yet.
            </p>
          )}
        </div>
      </div>

      <aside className="grid gap-6 self-start">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-ink">Reporter</h2>
          <div className="mt-4 grid gap-3 text-sm text-slate-600">
            <p>
              <span className="font-semibold text-slate-800">Name:</span>{" "}
              {spot.reported_by_name}
            </p>
            <p>
              <span className="font-semibold text-slate-800">Phone:</span>{" "}
              {spot.reported_by_phone ? (
                <a
                  href={`tel:${spot.reported_by_phone}`}
                  className="font-semibold text-civic hover:underline"
                >
                  {spot.reported_by_phone}
                </a>
              ) : (
                "No phone"
              )}
            </p>
            <p>
              <span className="font-semibold text-slate-800">Reported:</span>{" "}
              {formatDate(spot.created_at)}
            </p>
            {spot.cleanup_date ? (
              <p className="rounded-md bg-blue-50 px-3 py-2 font-semibold text-blue-700">
                Cleanup date: {formatDate(spot.cleanup_date)}
              </p>
            ) : null}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-ink">Actions</h2>
          {actions.length > 0 ? (
            <div className="mt-4 grid gap-3">
              <div className="grid gap-2">
                {actions.map((action) => (
                  <button
                    key={action.key}
                    type="button"
                    onClick={() => toggleAction(action)}
                    className={`rounded-md px-4 py-3 text-sm font-bold transition ${actionClass(
                      action.variant
                    )}`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>

              {activeAction ? (
                <form
                  onSubmit={handleSubmit}
                  className="mt-2 grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  {activeAction.requiresDate ? (
                    <label className="grid gap-2">
                      <span className="text-sm font-bold text-slate-700">
                        Cleanup date
                      </span>
                      <input
                        value={cleanupDate}
                        onChange={(event) => setCleanupDate(event.target.value)}
                        type="date"
                        min={today}
                        required
                        className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-civic focus:ring-2 focus:ring-civic/20"
                      />
                    </label>
                  ) : null}

                  {activeAction.nextStatus === "cleaned" ? (
                    <label className="grid gap-2">
                      <span className="text-sm font-bold text-slate-700">
                        After photo{" "}
                        <span className="font-normal text-slate-400">
                          (optional)
                        </span>
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(event) => {
                          setPhotoFile(event.target.files?.[0] ?? null);
                          setUploadError("");
                        }}
                        className="rounded-md border border-slate-300 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-sm file:font-semibold"
                      />
                    </label>
                  ) : null}

                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-slate-700">
                      {activeAction.noteLabel}
                    </span>
                    <textarea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      rows={4}
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-civic focus:ring-2 focus:ring-civic/20"
                    />
                  </label>

                  {error ? (
                    <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                      {error}
                    </p>
                  ) : null}

                  {uploadError ? (
                    <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                      {uploadError}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-md bg-ink px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {loading && uploading
                      ? "Uploading photo..."
                      : loading
                        ? "Saving..."
                        : `Confirm: ${activeAction.label}`}
                  </button>
                </form>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 text-sm font-semibold text-slate-500">
              No further actions available.
            </p>
          )}
        </div>

        {spot.status === "cleaned" && !photos.after ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-ink">After photo</h2>
            <p className="mt-2 text-sm text-slate-500">
              Upload an after photo to complete the impact record.
            </p>
            <label className="mt-4 grid gap-2">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(event) => {
                  setPhotoFile(event.target.files?.[0] ?? null);
                  setUploadError("");
                }}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-sm file:font-semibold"
              />
            </label>
            {uploadError ? (
              <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                {uploadError}
              </p>
            ) : null}
            <button
              type="button"
              disabled={!photoFile || uploading}
              onClick={handleStandalonePhotoUpload}
              className="mt-4 w-full rounded-md bg-civic px-4 py-3 text-sm font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {uploading ? "Uploading..." : "Upload after photo"}
            </button>
          </div>
        ) : null}
      </aside>
    </section>
  );
}
