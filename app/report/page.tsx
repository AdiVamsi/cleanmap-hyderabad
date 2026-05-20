"use client";

import Link from "next/link";

import { ReportForm } from "@/components/report/ReportForm";

export default function ReportPage() {
  return (
    <main className="min-h-screen bg-[#f8faf7] px-4 py-6 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-civic hover:text-civic"
          >
            CleanMap Hyderabad
          </Link>
          <span className="text-sm font-medium text-slate-500">
            Community report
          </span>
        </header>

        <section className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="pt-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-civic">
              Report a spot
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-normal text-ink sm:text-5xl">
              Put a cleanup location on the review list.
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-slate-600">
              Share the address, ward, severity, and an optional before photo.
              New reports stay private until an admin approves them.
            </p>
          </div>

          <ReportForm />
        </section>
      </div>
    </main>
  );
}
