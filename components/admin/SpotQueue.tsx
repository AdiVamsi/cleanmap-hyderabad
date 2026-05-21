"use client";

import { useMemo, useState } from "react";

import { AdminSpotCard } from "@/components/admin/AdminSpotCard";
import { STATUS_LABELS } from "@/lib/constants";
import type { AdminSpot, SpotStatus } from "@/lib/types";

type SpotQueueProps = {
  spots: AdminSpot[];
};

const tabs: Array<{ status: SpotStatus; label: string }> = [
  { status: "pending", label: "Pending" },
  { status: "approved", label: "Approved" },
  { status: "cleanup_planned", label: "Planned" },
  { status: "cleaned", label: "Cleaned" },
  { status: "rejected", label: "Rejected" }
];

export function SpotQueue({ spots }: SpotQueueProps) {
  const [activeTab, setActiveTab] = useState<SpotStatus | "all">("pending");
  const counts = useMemo(() => {
    return tabs.reduce<Record<SpotStatus, number>>(
      (acc, tab) => {
        acc[tab.status] = spots.filter((spot) => spot.status === tab.status).length;
        return acc;
      },
      {
        pending: 0,
        approved: 0,
        cleanup_planned: 0,
        cleaned: 0,
        rejected: 0
      }
    );
  }, [spots]);

  const visibleSpots =
    activeTab === "all"
      ? spots
      : spots.filter((spot) => spot.status === activeTab);
  const aiCount = spots.filter(
    (spot) =>
      spot.status === "pending" && spot.admin_note?.includes("AI flagged")
  ).length;
  const emptyLabel =
    activeTab === "all" ? "all" : STATUS_LABELS[activeTab].toLowerCase();

  return (
    <section>
      <div className="mb-4 text-sm font-semibold text-slate-500">
        {spots.length} total spots in the admin queue
      </div>
      <div className="flex gap-1 overflow-x-auto border-b border-warm-border">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.status;

          return (
            <button
              key={tab.status}
              type="button"
              onClick={() => setActiveTab(tab.status)}
              className={`-mb-px inline-flex items-center gap-2 rounded-t-lg border px-4 py-3 text-sm font-bold transition ${
                isActive
                  ? "border-warm-border border-b-white bg-white text-ink"
                  : "border-transparent text-slate-500 hover:bg-white/70 hover:text-ink"
              }`}
            >
              {tab.label}
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  isActive
                    ? "bg-slate-100 text-slate-700"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {counts[tab.status]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="rounded-b-lg border border-t-0 border-warm-border bg-white/70 p-4">
        {activeTab === "pending" && aiCount > 0 ? (
          <p className="mb-3 rounded-md bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
            {aiCount} spot{aiCount !== 1 ? "s" : ""} need manual photo review
          </p>
        ) : null}

        {visibleSpots.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleSpots.map((spot) => (
              <AdminSpotCard key={spot.id} spot={spot} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-12 text-center text-sm font-semibold text-slate-500">
            No {emptyLabel} spots.
          </div>
        )}
      </div>
    </section>
  );
}
