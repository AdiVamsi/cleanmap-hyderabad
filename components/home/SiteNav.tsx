import Link from "next/link";

export function SiteNav() {
  return (
    <nav className="fixed left-0 right-0 top-0 z-50 bg-ink/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="text-base font-bold tracking-tight text-white"
        >
          CleanMap
          <span className="ml-1 text-saffron">Hyderabad</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/stories"
            className="hidden text-sm font-semibold text-white/70 transition hover:text-white sm:block"
          >
            Stories
          </Link>
          <Link
            href="/report"
            className="rounded-full bg-saffron px-4 py-2 text-sm font-bold text-white transition hover:bg-saffron-dark"
          >
            Report Spot
          </Link>
        </div>
      </div>
    </nav>
  );
}
