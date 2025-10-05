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
    <main className="min-h-screen bg-background text-foreground font-sans">
      <div className="w-full bg-gradient-to-b from-black via-orange-700 to-orange-400 text-white">
        <div className="max-w-4xl mx-auto px-6 py-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-wide">Welcome back</h2>
          <p className="mt-1 text-sm sm:text-base opacity-95">Log in to continue</p>
        </div>
      </div>

      <section className="max-w-4xl mx-auto px-6 py-8">
        <form onSubmit={submit} className="rounded-2xl border bg-white shadow-sm p-6 space-y-4">
          {status && (
            <div className={`rounded border px-3 py-2 text-sm ${status.toLowerCase().includes("failed") || status.toLowerCase().includes("error") ? "bg-red-50 text-red-700 border-red-300" : "bg-green-50 text-green-700 border-green-300"}`}>
              {status}
            </div>
          )}

          {/* Role selection */}
          <fieldset>
            <legend className="text-xs opacity-70">Login as</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("STUDENT")}
                className={`rounded border px-3 py-2 text-left ${role === "STUDENT" ? "border-[#f97316] bg-[#fff7ed]" : ""}`}
                aria-pressed={role === "STUDENT"}
              >
                <div className="font-medium">Dancer</div>
                <div className="text-xs opacity-70">Book events, view tickets</div>
              </button>
              <button
                type="button"
                onClick={() => setRole("STUDIO_OWNER")}
                className={`rounded border px-3 py-2 text-left ${role === "STUDIO_OWNER" ? "border-[#f97316] bg-[#fff7ed]" : ""}`}
                aria-pressed={role === "STUDIO_OWNER"}
              >
                <div className="font-medium">Studio Owner</div>
                <div className="text-xs opacity-70">Manage and post events</div>
              </button>
            </div>
            <p className="mt-2 text-[12px] opacity-70">Choose the option that matches your account type. We&apos;ll verify this during login.</p>
          </fieldset>

          <div>
            <label className="text-xs opacity-70" htmlFor="email">Email*</label>
            <input id="email" className={`mt-1 w-full rounded border px-3 py-2 ${email && !validEmail ? "border-red-400" : ""}`} placeholder="you@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div>
            <label className="text-xs opacity-70" htmlFor="password">Password*</label>
            <input id="password" className={`mt-1 w-full rounded border px-3 py-2 ${password && !validPassword ? "border-red-400" : ""}`} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <input id="remember" type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            <label htmlFor="remember">Remember me (30 days)</label>
          </div>

          <button className="mt-2 w-full rounded bg-[#f97316] text-white py-2 font-medium disabled:opacity-60" disabled={submitting || !canSubmit} type="submit">
            {submitting ? "Logging in…" : `Log in as ${role === "STUDENT" ? "Dancer" : "Studio Owner"}`}
          </button>

          <div className="text-xs opacity-70 text-center">
            New here? <Link href="/auth/register" className="underline">Create an account</Link>
          </div>
        </form>
      </section>
    </main>
  );
}