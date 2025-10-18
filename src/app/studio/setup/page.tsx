"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import MapPicker from "@/components/MapPicker";

export default function StudioSetupPage() {
  const [session, setSession] = useState<{ authenticated: boolean; user?: { id?: string; role?: string } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateNm, setStateNm] = useState("");
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/session", { cache: "no-store" });
        const data = await res.json();
        setSession(data);
        if (data?.authenticated && data?.user?.role === "STUDIO_OWNER") {
          const sp = await fetch("/api/studio-profile", { cache: "no-store" });
          if (sp.ok) {
            const profile = await sp.json();
            setName(profile?.name || "");
            setAddressLine1(profile?.addressLine1 || "");
            setAddressLine2(profile?.addressLine2 || "");
            setCity(profile?.city || "");
            setStateNm(profile?.state || "");
            setCountry(profile?.country || "");
            setPostalCode(profile?.postalCode || "");
            setPhone(profile?.phone || "");
            setEmail(profile?.email || "");
            setWebsite(profile?.website || "");
            setDescription(profile?.description || "");
            setLat(typeof profile?.locationLat === "number" ? profile.locationLat : null);
            setLng(typeof profile?.locationLng === "number" ? profile.locationLng : null);
          }
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const validName = useMemo(() => name.trim().length >= 2, [name]);
  const validCoords = useMemo(() => typeof lat === "number" && typeof lng === "number", [lat, lng]);
  const canSave = useMemo(() => validName && validCoords, [validName, validCoords]);

  async function saveProfile(e?: React.FormEvent) {
    e?.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/studio-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          addressLine1,
          addressLine2,
          city,
          state: stateNm,
          country,
          postalCode,
          phone,
          email,
          website,
          description,
          locationLat: lat,
          locationLng: lng,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || "Save failed");
        return;
      }
      setStatus("Studio details saved successfully.");
    } catch {
      setStatus("Network error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background text-foreground"><div className="max-w-4xl mx-auto px-6 py-8">Loading…</div></main>
    );
  }

  if (!session?.authenticated) {
    return (
      <main className="min-h-screen bg-background text-foreground"><div className="max-w-4xl mx-auto px-6 py-8">Please <Link className="underline" href="/auth/login">log in</Link> to continue.</div></main>
    );
  }

  if (session?.user?.role !== "STUDIO_OWNER") {
    return (
      <main className="min-h-screen bg-background text-foreground"><div className="max-w-4xl mx-auto px-6 py-8">Only Studio Owners can access this page.</div></main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground dark:bg-gray-900 dark:text-gray-100 font-sans">
      <div className="w-full bg-gradient-to-b from-black via-orange-700 to-orange-400 text-white">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <h2 className="text-2xl sm:text-3xl font-bold">Set up your Studio</h2>
          <p className="mt-1 text-sm sm:text-base opacity-95">Add your studio details and pin your location on the map. You&apos;ll need this to list events.</p>
        </div>
      </div>

      <section className="max-w-4xl mx-auto px-6 py-8">
        <form onSubmit={saveProfile} className="rounded-3xl border border-black/10 bg-white/80 dark:bg-gray-800/90 dark:border-white/10 backdrop-blur-md shadow-xl p-6 space-y-4">
          {status && (
            <div className={`rounded border px-3 py-2 text-sm ${status.toLowerCase().includes("failed") || status.toLowerCase().includes("error") ? "bg-red-50 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800" : "bg-green-50 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"}`}>
              {status}
            </div>
          )}

          <div>
            <label className="text-xs opacity-70 dark:opacity-90 dark:text-gray-300" htmlFor="name">Studio Name*</label>
            <input id="name" className={`mt-1 w-full rounded-xl border border-black/10 bg-white/60 dark:bg-gray-700 dark:border-white/10 dark:text-gray-200 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition ${name && !validName ? "border-red-400 dark:border-red-500" : ""}`} placeholder="e.g. Rhythm Dance Studio" value={name} onChange={(e) => setName(e.target.value)} />
            {name && !validName && (
              <div className="text-[11px] text-red-600 dark:text-red-400 mt-1">Enter at least 2 characters.</div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs opacity-70 dark:opacity-90 dark:text-gray-300" htmlFor="address1">Address line 1</label>
              <input id="address1" className="mt-1 w-full rounded-xl border border-black/10 bg-white/60 dark:bg-gray-700 dark:border-white/10 dark:text-gray-200 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} />
            </div>
            <div>
              <label className="text-xs opacity-70 dark:opacity-90 dark:text-gray-300" htmlFor="address2">Address line 2</label>
              <input id="address2" className="mt-1 w-full rounded-xl border border-black/10 bg-white/60 dark:bg-gray-700 dark:border-white/10 dark:text-gray-200 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs opacity-70 dark:opacity-90 dark:text-gray-300" htmlFor="city">City</label>
              <input id="city" className="mt-1 w-full rounded-xl border border-black/10 bg-white/60 dark:bg-gray-700 dark:border-white/10 dark:text-gray-200 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div>
              <label className="text-xs opacity-70 dark:opacity-90 dark:text-gray-300" htmlFor="state">State</label>
              <input id="state" className="mt-1 w-full rounded-xl border border-black/10 bg-white/60 dark:bg-gray-700 dark:border-white/10 dark:text-gray-200 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition" value={stateNm} onChange={(e) => setStateNm(e.target.value)} />
            </div>
            <div>
              <label className="text-xs opacity-70 dark:opacity-90 dark:text-gray-300" htmlFor="postal">Postal code</label>
              <input id="postal" className="mt-1 w-full rounded-xl border border-black/10 bg-white/60 dark:bg-gray-700 dark:border-white/10 dark:text-gray-200 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs opacity-70 dark:opacity-90 dark:text-gray-300" htmlFor="country">Country</label>
              <input id="country" className="mt-1 w-full rounded-xl border border-black/10 bg-white/60 dark:bg-gray-700 dark:border-white/10 dark:text-gray-200 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition" value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>
            <div>
              <label className="text-xs opacity-70 dark:opacity-90 dark:text-gray-300" htmlFor="phone">Phone</label>
              <input id="phone" className="mt-1 w-full rounded-xl border border-black/10 bg-white/60 dark:bg-gray-700 dark:border-white/10 dark:text-gray-200 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="text-xs opacity-70 dark:opacity-90 dark:text-gray-300" htmlFor="email">Contact email</label>
              <input id="email" className="mt-1 w-full rounded-xl border border-black/10 bg-white/60 dark:bg-gray-700 dark:border-white/10 dark:text-gray-200 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs opacity-70 dark:opacity-90 dark:text-gray-300" htmlFor="website">Website</label>
              <input id="website" className="mt-1 w-full rounded-xl border border-black/10 bg-white/60 dark:bg-gray-700 dark:border-white/10 dark:text-gray-200 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>
            <div>
              <label className="text-xs opacity-70 dark:opacity-90 dark:text-gray-300" htmlFor="description">Description</label>
              <input id="description" className="mt-1 w-full rounded-xl border border-black/10 bg-white/60 dark:bg-gray-700 dark:border-white/10 dark:text-gray-200 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-xs opacity-70 dark:opacity-90 dark:text-gray-300">Map location*</label>
            <div className="mt-2 h-[300px] w-full rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 shadow-lg ring-1 ring-white/20 relative z-0">
              <MapPicker
                center={[12.9716, 77.5946]}
                lat={lat}
                lng={lng}
                onPick={(la, ln) => {
                  setLat(la);
                  setLng(ln);
                }}
              />
            </div>
            {!validCoords && (
              <div className="text-[11px] text-red-600 mt-1">Please pick a location on the map.</div>
            )}
            <p className="text-xs opacity-70 mt-1">Click on the map to drop a pin at your studio location.</p>
          </div>

          <button
            className="w-full rounded-xl bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white py-2 font-semibold shadow-lg hover:from-orange-600 hover:via-pink-600 hover:to-purple-700 transition-transform transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60"
            disabled={saving || !canSave}
            title="Save studio details"
          >
            {saving ? "Saving…" : "Save"}
          </button>

          <div className="text-xs opacity-70 text-center">
            Once saved, you can <Link href="/submit-event" className="underline">list your events</Link>.
          </div>
        </form>
      </section>
    </main>
  );
}