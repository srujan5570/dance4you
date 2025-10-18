"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Role selection: STUDENT (Dancer) or STUDIO_OWNER (Studio)
  const [role, setRole] = useState<"STUDENT" | "STUDIO_OWNER">("STUDENT");

  const validEmail = useMemo(() => /.+@.+\..+/.test(email.trim()), [email]);
  const validPassword = useMemo(() => password.length >= 6, [password]);
  const canSubmit = useMemo(() => validEmail && validPassword, [validEmail, validPassword]);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setStatus(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || "Login failed");
        return;
      }
      setStatus("Logged in. Redirecting…");
      setTimeout(() => {
        // Redirect depending on actual account role
        if (data.role === "STUDIO_OWNER") {
          window.location.href = "/submit-event";
        } else {
          window.location.href = "/events";
        }
      }, 400);
    } catch  {
      setStatus("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background dark:bg-gray-900 text-foreground font-sans">
      <div className="w-full bg-gradient-to-b from-black via-orange-700 to-orange-400 dark:from-black dark:via-orange-900 dark:to-orange-700 text-white">
        <div className="max-w-4xl mx-auto px-6 py-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-wide">Welcome back</h2>
          <p className="mt-1 text-sm sm:text-base opacity-95">Log in to continue</p>
        </div>
      </div>

      <section className="max-w-4xl mx-auto px-6 py-8">
        <form onSubmit={submit} className="rounded-3xl border border-black/10 dark:border-white/20 bg-white/80 dark:bg-gray-800/90 text-black dark:text-white backdrop-blur-md shadow-xl p-6 space-y-4">
          {status && (
            <div className={`rounded border px-3 py-2 text-sm ${status.toLowerCase().includes("failed") || status.toLowerCase().includes("error") ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700" : "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700"}`}>
              {status}
            </div>
          )}

          {/* Role selection */}
          <fieldset>
            <legend className="text-xs opacity-70 dark:text-white dark:opacity-90">Login as</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("STUDENT")}
                className={`rounded border px-3 py-2 text-left dark:text-white ${role === "STUDENT" ? "border-[#f97316] bg-[#fff7ed] dark:bg-orange-900/40 dark:border-orange-500" : "dark:border-gray-600"}`}
                aria-pressed={role === "STUDENT"}
              >
                <div className="font-medium">Dancer</div>
                <div className="text-xs opacity-70 dark:opacity-90">Book events, view tickets</div>
              </button>
              <button
                type="button"
                onClick={() => setRole("STUDIO_OWNER")}
                className={`rounded border px-3 py-2 text-left dark:text-white ${role === "STUDIO_OWNER" ? "border-[#f97316] bg-[#fff7ed] dark:bg-orange-900/40 dark:border-orange-500" : "dark:border-gray-600"}`}
                aria-pressed={role === "STUDIO_OWNER"}
              >
                <div className="font-medium">Studio Owner</div>
                <div className="text-xs opacity-70 dark:opacity-90">Manage and post events</div>
              </button>
            </div>
            <p className="mt-2 text-[12px] opacity-70 dark:text-white dark:opacity-90">Choose the option that matches your account type. We&apos;ll verify this during login.</p>
          </fieldset>

          <div>
            <label className="text-xs opacity-70 dark:text-white dark:opacity-90" htmlFor="email">Email*</label>
            <input id="email" className={`mt-1 w-full rounded border px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${email && !validEmail ? "border-red-400 dark:border-red-500" : ""}`} placeholder="you@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div>
            <label className="text-xs opacity-70 dark:text-white dark:opacity-90" htmlFor="password">Password*</label>
            <input id="password" className={`mt-1 w-full rounded border px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${password && !validPassword ? "border-red-400 dark:border-red-500" : ""}`} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <div className="flex items-center gap-2 text-xs dark:text-white">
            <input id="remember" type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="dark:accent-orange-500" />
            <label htmlFor="remember">Remember me (30 days)</label>
          </div>

          <button className="mt-2 w-full rounded-xl bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white py-2 font-semibold shadow-lg hover:from-orange-600 hover:via-pink-600 hover:to-purple-700 transition-transform transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60" disabled={submitting || !canSubmit} type="submit">
            {submitting ? "Logging in…" : `Log in as ${role === "STUDENT" ? "Dancer" : "Studio Owner"}`}
          </button>

          <div className="text-xs opacity-70 dark:text-white dark:opacity-90 text-center">
            New here? <Link href="/auth/register" className="underline text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300">Create an account</Link>
          </div>
        </form>
      </section>
    </main>
  );
}