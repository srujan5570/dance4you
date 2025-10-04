"use client";

import { useState, useMemo } from "react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"STUDENT" | "STUDIO_OWNER">("STUDENT");
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"details" | "verify">("details");
  const [otp, setOtp] = useState("");

  const validEmail = useMemo(() => /.+@.+\..+/.test(email.trim()), [email]);
  const validPassword = useMemo(() => password.length >= 6, [password]);
  const canSubmit = useMemo(() => validEmail && validPassword, [validEmail, validPassword]);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setStatus(null);
    try {
      const res = await fetch("/api/auth/register/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || "Registration failed");
        return;
      }
      setStatus("We sent a 6-digit code to your email. Enter it below to verify.");
      setStep("verify");
    } catch (e) {
      setStatus("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  async function verifyOtp(e?: React.FormEvent) {
    e?.preventDefault();
    if (!otp || otp.length < 6) return;
    setSubmitting(true);
    setStatus(null);
    try {
      const res = await fetch("/api/auth/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || "Verification failed");
        return;
      }
      setStatus("Verified! Redirecting…");
      setTimeout(() => {
        if (role === "STUDIO_OWNER") {
          window.location.href = "/submit-event";
        } else {
          window.location.href = "/events";
        }
      }, 500);
    } catch (e) {
      setStatus("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground font-sans">
      <div className="w-full bg-gradient-to-b from-black via-orange-700 to-orange-400 text-white">
        <div className="max-w-4xl mx-auto px-6 py-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-wide">Create your account</h2>
          <p className="mt-1 text-sm sm:text-base opacity-95">Register as Student or Studio Owner</p>
        </div>
      </div>

      <section className="max-w-4xl mx-auto px-6 py-8">
        <form onSubmit={step === "details" ? submit : verifyOtp} className="rounded-2xl border bg-white shadow-sm p-6 space-y-4">
          {status && (
            <div className={`rounded border px-3 py-2 text-sm ${status.toLowerCase().includes("failed") || status.toLowerCase().includes("error") ? "bg-red-50 text-red-700 border-red-300" : "bg-green-50 text-green-700 border-green-300"}`}>
              {status}
            </div>
          )}

          {step === "details" ? (
            <>
              <div>
                <label className="text-xs opacity-70" htmlFor="name">Name (optional)</label>
                <input id="name" className="mt-1 w-full rounded border px-3 py-2" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div>
                <label className="text-xs opacity-70" htmlFor="email">Email*</label>
                <input id="email" className={`mt-1 w-full rounded border px-3 py-2 ${email && !validEmail ? "border-red-400" : ""}`} placeholder="you@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div>
                <label className="text-xs opacity-70" htmlFor="password">Password* (min 6 chars)</label>
                <input id="password" className={`mt-1 w-full rounded border px-3 py-2 ${password && !validPassword ? "border-red-400" : ""}`} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>

              <fieldset>
                <legend className="text-xs opacity-70">Role*</legend>
                <div className="mt-2 flex items-center gap-4">
                  <label className="inline-flex items-center gap-2">
                    <input type="radio" name="role" value="STUDENT" checked={role === "STUDENT"} onChange={() => setRole("STUDENT")} />
                    <span className="text-sm">Student</span>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="radio" name="role" value="STUDIO_OWNER" checked={role === "STUDIO_OWNER"} onChange={() => setRole("STUDIO_OWNER")} />
                    <span className="text-sm">Studio Owner</span>
                  </label>
                </div>
              </fieldset>

              <button className="mt-2 w-full rounded bg-[#f97316] text-white py-2 font-medium disabled:opacity-60" disabled={submitting || !canSubmit} type="submit">
                {submitting ? "Sending code…" : "Register"}
              </button>

              <div className="text-xs opacity-70 text-center">
                Already have an account? <a href="/auth/login" className="underline">Log in</a>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-xs opacity-70" htmlFor="otp">Enter 6-digit code*</label>
                <input id="otp" className="mt-1 w-full rounded border px-3 py-2 tracking-widest" placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} />
              </div>
              <button className="mt-2 w-full rounded bg-[#16a34a] text-white py-2 font-medium disabled:opacity-60" disabled={submitting || otp.length < 6} type="submit">
                {submitting ? "Verifying…" : "Verify & Continue"}
              </button>
              <div className="text-xs opacity-70 text-center">
                Didn’t receive the code? <button type="button" className="underline" onClick={submit} disabled={submitting}>Resend</button>
              </div>
            </>
          )}
        </form>
      </section>
    </main>
  );
}