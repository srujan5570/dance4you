"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"STUDENT" | "STUDIO_OWNER">("STUDENT");
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const validEmail = useMemo(() => /.+@.+\..+/.test(email.trim()), [email]);
  const validPassword = useMemo(() => password.length >= 6, [password]);
  const canSubmit = useMemo(() => validEmail && validPassword, [validEmail, validPassword]);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setStatus(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || "Registration failed");
        return;
      }
      setStatus("Registered successfully. Redirecting…");
      // Redirect depending on role
      setTimeout(() => {
        if (role === "STUDIO_OWNER") {
          window.location.href = "/studio/setup";
        } else {
          window.location.href = "/events";
        }
      }, 500);
    } catch {
      setStatus("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background dark:bg-gray-900 text-foreground font-sans">
      <div className="w-full bg-gradient-to-b from-black via-orange-700 to-orange-400 dark:from-black dark:via-orange-900 dark:to-orange-700 text-white">
        <div className="max-w-4xl mx-auto px-6 py-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-wide">Create your account</h2>
          <p className="mt-1 text-sm sm:text-base opacity-95">Register as Dancer or Studio Owner</p>
        </div>
      </div>

      <section className="max-w-4xl mx-auto px-6 py-8">
        <form onSubmit={submit} className="rounded-3xl border border-black/10 dark:border-white/20 bg-white/80 dark:bg-gray-800/90 text-black dark:text-white backdrop-blur-md shadow-xl p-6 space-y-4">
          {status && (
            <div className={`rounded border px-3 py-2 text-sm ${status.toLowerCase().includes("failed") || status.toLowerCase().includes("error") ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700" : "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700"}`}>
              {status}
            </div>
          )}

          <div>
            <label className="text-xs opacity-70 dark:text-white dark:opacity-90" htmlFor="name">Name (optional)</label>
            <input id="name" className="mt-1 w-full rounded border px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <label className="text-xs opacity-70 dark:text-white dark:opacity-90" htmlFor="email">Email*</label>
            <input id="email" className={`mt-1 w-full rounded border px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${email && !validEmail ? "border-red-400 dark:border-red-500" : ""}`} placeholder="you@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div>
            <label className="text-xs opacity-70 dark:text-white dark:opacity-90" htmlFor="password">Password* (min 6 chars)</label>
            <input id="password" className={`mt-1 w-full rounded border px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${password && !validPassword ? "border-red-400 dark:border-red-500" : ""}`} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <fieldset>
            <legend className="text-xs opacity-70 dark:text-white dark:opacity-90">Role*</legend>
            <div className="mt-2 flex items-center gap-4">
              <label className="inline-flex items-center gap-2 dark:text-white">
                <input type="radio" name="role" value="STUDENT" checked={role === "STUDENT"} onChange={() => setRole("STUDENT")} className="dark:accent-orange-500" />
                <span className="text-sm">Dancer</span>
              </label>
              <label className="inline-flex items-center gap-2 dark:text-white">
                <input type="radio" name="role" value="STUDIO_OWNER" checked={role === "STUDIO_OWNER"} onChange={() => setRole("STUDIO_OWNER")} className="dark:accent-orange-500" />
                <span className="text-sm">Studio Owner</span>
              </label>
            </div>
          </fieldset>

          <button className="mt-2 w-full rounded bg-[#f97316] hover:bg-orange-600 text-white py-2 font-medium disabled:opacity-60" disabled={submitting || !canSubmit} type="submit">
            {submitting ? "Registering…" : `Register as ${role === "STUDENT" ? "Dancer" : "Studio Owner"}`}
          </button>

          <div className="text-xs opacity-70 dark:text-white dark:opacity-90 text-center">
            Already have an account? <Link href="/auth/login" className="underline text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300">Log in</Link>
          </div>
        </form>
      </section>
    </main>
  );
}