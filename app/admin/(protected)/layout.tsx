import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/admin/LogoutButton";
import { ADMIN_COOKIE_NAME, isValidCookieValue } from "@/lib/admin-auth";

export default function AdminProtectedLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookie = cookies().get(ADMIN_COOKIE_NAME);

  if (!cookie || !isValidCookieValue(cookie.value)) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-ink">
      <nav className="border-b border-warm-border bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/"
              className="font-semibold text-slate-500 transition hover:text-ink"
            >
              ← Public site
            </Link>
            <span className="text-slate-300">/</span>
            <Link href="/admin" className="font-bold text-ink">
              Admin
            </Link>
            <span className="text-slate-300">/</span>
            <Link
              href="/admin/stories"
              className="font-semibold text-slate-500 transition hover:text-ink"
            >
              Stories
            </Link>
          </div>
          <LogoutButton />
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
