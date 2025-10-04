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
  const canSubmit = useMemo(() => name.trim().length >= 2 && validEmail && validPassword, [name, validEmail, validPassword]);

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
      setStatus("Registered. Redirecting…");
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    } catch {
      setStatus("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground font-sans">
      <div className="w-full bg-gradient-to-b from-black via-orange-700 to-orange-400 text-white">
        <div className="max-w-4xl mx-auto px-6 py-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-wide">Create an account</h2>
          <p className="mt-1 text-sm sm:text-base opacity-95">Join Dance 4 You</p>
        </div>
      </div>

      <section className="max-w-4xl mx-auto px-6 py-8">
        <form onSubmit={submit} className="rounded-2xl border bg-white shadow-sm p-6 space-y-4">
          {status && (
            <div className={`rounded border px-3 py-2 text-sm ${status.toLowerCase().includes("failed") || status.toLowerCase().includes("error") ? "bg-red-50 text-red-700 border-red-300" : "bg-green-50 text-green-700 border-green-300"}`}>
              {status}
            </div>
          )}

          <div>
            <label className="text-xs opacity-70" htmlFor="name">Full name*</label>
            <input id="name" className="mt-1 w-full rounded border px-3 py-2" placeholder="Alex Johnson" type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <label className="text-xs opacity-70" htmlFor="email">Email*</label>
            <input id="email" className={`mt-1 w-full rounded border px-3 py-2 ${email && !validEmail ? "border-red-400" : ""}`} placeholder="you@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div>
            <label className="text-xs opacity-70" htmlFor="password">Password*</label>
            <input id="password" className={`mt-1 w-full rounded border px-3 py-2 ${password && !validPassword ? "border-red-400" : ""}`} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <div>
            <label className="text-xs opacity-70" htmlFor="role">Role*</label>
            <select id="role" className="mt-1 w-full rounded border px-3 py-2" value={role} onChange={(e) => setRole(e.target.value as "STUDENT" | "STUDIO_OWNER") }>
              <option value="STUDENT">Student</option>
              <option value="STUDIO_OWNER">Studio Owner</option>
            </select>
          </div>

          <button className="mt-2 w-full rounded bg-[#f97316] text-white py-2 font-medium disabled:opacity-60" disabled={submitting || !canSubmit} type="submit">
            {submitting ? "Creating account…" : "Create account"}
          </button>

          <div className="text-xs opacity-70 text-center">
            Already have an account? <Link href="/auth/login" className="underline">Log in</Link>
          </div>
        </form>
      </section>
    </main>
  );
}