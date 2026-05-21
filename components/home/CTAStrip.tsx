import Link from "next/link";

export function CTAStrip() {
  return (
    <section className="bg-ink px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-bold uppercase tracking-widest text-saffron">
          Take action
        </p>
        <h2 className="mt-4 text-4xl font-extrabold text-white sm:text-5xl">
          Spotted something?
          <br />
          Report it in 30 seconds.
        </h2>
        <p className="mt-6 text-lg text-white/60">
          No login. No account. Just a photo and a location. Your report goes
          live on the map immediately when verified.
        </p>
        <Link
          href="/report"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-saffron px-8 py-4 text-base font-bold text-white shadow-map transition hover:bg-saffron-dark"
        >
          Report a Garbage Spot
        </Link>
      </div>
    </section>
  );
}
