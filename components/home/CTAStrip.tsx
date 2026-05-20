import Link from "next/link";

export function CTAStrip() {
  return (
    <section className="bg-ink px-4 py-14 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-200">
            Add a report
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-normal">
            Know a spot that needs cleanup?
          </h2>
        </div>
        <Link
          href="/report"
          className="inline-flex w-fit rounded-full bg-clean px-5 py-3 text-sm font-bold text-ink transition hover:bg-green-300"
        >
          Submit for review
        </Link>
      </div>
    </section>
  );
}
