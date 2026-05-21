"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        router.push("/admin");
        router.refresh();
        return;
      }

      if (response.status === 401) {
        setError("Incorrect password");
      } else {
        setError("Login failed — please try again");
      }
    } catch {
      setError("Login failed — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-parchment px-4 py-6 text-ink sm:px-6 lg:px-8">
      <Link
        href="/"
        className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-forest hover:text-forest"
      >
        ← Public site
      </Link>

      <section className="mx-auto flex min-h-[calc(100vh-96px)] max-w-md items-center justify-center">
        <form
          onSubmit={handleSubmit}
          className="w-full rounded-lg border border-warm-border bg-white p-6 shadow-soft"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-forest">
            Coordinator access
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-normal text-ink">
            Admin login
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            CleanMap Hyderabad — Coordinator access
          </p>

          <label className="mt-6 grid gap-2">
            <span className="text-sm font-bold text-slate-700">Password</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              className="rounded-md border border-slate-300 px-3 py-3 text-base outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/20"
              required
              autoComplete="current-password"
            />
          </label>

          {error ? (
            <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-md bg-ink px-5 py-3 text-base font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
