import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative isolate min-h-[620px] overflow-hidden bg-ink text-white">
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(17,24,39,0.86) 0%, rgba(17,24,39,0.64) 48%, rgba(17,24,39,0.24) 100%), url('https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1800&q=80')"
        }}
      />
      <div className="mx-auto flex min-h-[620px] w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="text-lg font-bold tracking-normal">
            CleanMap Hyderabad
          </Link>
          <Link
            href="/report"
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-orange-100"
          >
            Report spot
          </Link>
        </header>

        <div className="flex flex-1 items-center">
          <div className="max-w-3xl pb-10 pt-16">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-200">
              Community cleanup tracker
            </p>
            <h1 className="mt-5 max-w-3xl text-5xl font-bold tracking-normal sm:text-6xl lg:text-7xl">
              CleanMap Hyderabad
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-100 sm:text-xl">
              A public map of approved cleanup spots, planned drives, and
              cleaned locations across Hyderabad wards.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/report"
                className="rounded-full bg-saffron px-5 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-orange-600"
              >
                Report a cleanup spot
              </Link>
              <a
                href="#map"
                className="rounded-full border border-white/50 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                View map
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
