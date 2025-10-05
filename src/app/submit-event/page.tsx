"use client";

import { useMemo, useState, useEffect } from "react";
import dynamic from "next/dynamic";
// removed leaflet/react-leaflet imports to avoid SSR issues; MapPicker loads them client-side

export default function SubmitEventPage() {
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const [style, setStyle] = useState<"Indian" | "Western">("Indian");
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");
  // Contact fields (collected but not publicly shown)
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [venueMapUrl, setVenueMapUrl] = useState("");
  const [contactNotes, setContactNotes] = useState("");
  // Precise location coordinates (optional)
-  const [locationLat, setLocationLat] = useState<string>("");
-  const [locationLng, setLocationLng] = useState<string>("");
+  const [locationLat, setLocationLat] = useState<string>("17.3850");
+  const [locationLng, setLocationLng] = useState<string>("78.4867");
  // Client-only map state
-  const [isClient, setIsClient] = useState(false);
-  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]);
+  const [isClient, setIsClient] = useState(false);
+  const [mapCenter, setMapCenter] = useState<[number, number]>([17.3850, 78.4867]);
  useEffect(() => {
    setIsClient(true);
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setMapCenter([pos.coords.latitude, pos.coords.longitude]),
        () => {}
      );
    }
  }, []);
  useEffect(() => {
    const lat = parseFloat(locationLat);
    const lng = parseFloat(locationLng);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      setMapCenter([lat, lng]);
    }
  }, [locationLat, locationLng]);

  // Dynamically import client-only MapPicker (react-leaflet)
  const MapPicker = dynamic(() => import("@/components/MapPicker"), { ssr: false });

  // Search & pin state (Nominatim)
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ display_name: string; lat: string; lon: string }[]>([]);
  const [searching, setSearching] = useState(false);
  async function searchPlaces() {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      setSearching(true);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=8`,
        { headers: { Accept: "application/json" } }
      );
      const data = await res.json();
      setSearchResults(Array.isArray(data) ? data.slice(0, 8) : []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  // Map click handled within MapPicker component
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [session, setSession] = useState<{ authenticated: boolean; user?: { role?: string } } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/session", { cache: "no-store" });
        const data = await res.json();
        setSession(data);
      } catch {}
    })();
  }, []);

  const validTitle = useMemo(() => title.trim().length >= 3, [title]);
  const validCity = useMemo(() => city.trim().length >= 2, [city]);
  const validDate = useMemo(() => !!date, [date]);
  const validStyle = useMemo(() => style === "Indian" || style === "Western", [style]);
  const validCoords = useMemo(() => {
    const latNum = parseFloat(locationLat);
    const lngNum = parseFloat(locationLng);
    return !Number.isNaN(latNum) && !Number.isNaN(lngNum);
  }, [locationLat, locationLng]);
  const canSubmit = useMemo(
    () =>
      validTitle &&
      validCity &&
      validDate &&
      validStyle &&
      validCoords &&
      session?.authenticated &&
      session?.user?.role === "STUDIO_OWNER",
    [validTitle, validCity, validDate, validStyle, validCoords, session?.authenticated, session?.user?.role]
  );

  async function submit() {
    setStatus(null);
    setSubmitting(true);
    setCreatedId(null);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          city,
          date,
          style,
          image,
          description,
          contactPhone,
          contactEmail,
          venueAddress,
          venueMapUrl,
          contactNotes,
          locationLat: parseFloat(locationLat),
          locationLng: parseFloat(locationLng),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to submit" }));
        setStatus(err.error || "Failed to submit");
        return;
      }
      const item = await res.json();
      setStatus("Event submitted successfully");
      setCreatedId(item?.id || null);
      setTitle("");
      setCity("");
      setDate("");
      setStyle("Indian");
      setImage("");
      setDescription("");
      setContactPhone("");
      setContactEmail("");
      setVenueAddress("");
      setVenueMapUrl("");
      setContactNotes("");
      setLocationLat("");
      setLocationLng("");
    } catch {
      setStatus("Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  const previewImage = image || "/hero-placeholder.svg";

  return (
    <main className="min-h-screen bg-background text-foreground font-sans">
      {/* Gradient banner */}
      <div className="w-full bg-gradient-to-b from-black via-orange-700 to-orange-400 text-white">
        <div className="max-w-6xl mx-auto px-6 py-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-wide">Submit Your Event</h2>
          <p className="mt-1 text-sm sm:text-base opacity-95">Add a listing with city, date, and style.</p>
        </div>
      </div>

      {/* Content */}
      <section className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Form card */}
          <div className="md:col-span-2">
            <div className="rounded-2xl border bg-white shadow-sm">
              <div className="px-5 py-4 border-b flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Event details</h3>
                  <p className="text-xs opacity-70">Provide the core information for your event. Fields marked with * are required.</p>
                  {!session?.authenticated && (
                    <div className="mt-2 rounded border border-yellow-300 bg-yellow-50 text-yellow-700 px-3 py-2 text-xs">
                      Please <a href="/auth/login" className="underline">log in</a> or <a href="/auth/register" className="underline">register</a> as a Studio Owner to submit events.
                    </div>
                  )}
                  {session?.authenticated && session?.user?.role !== "STUDIO_OWNER" && (
                    <div className="mt-2 rounded border border-red-300 bg-red-50 text-red-700 px-3 py-2 text-xs">
                      You must be a Studio Owner to submit events. Current role: {session?.user?.role || "Unknown"}.
                    </div>
                  )}
                </div>
                <div className="hidden sm:flex items-center gap-2 text-xs opacity-70">
                  <span className="inline-flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path d="M4 3a2 2 0 00-2 2v9.5A2.5 2.5 0 004.5 17H16a2 2 0 002-2V7l-5-4H4z" /></svg> Draft safe</span>
                  <span className="inline-flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path d="M10 18a8 8 0 100-16 8 8 0 000 16z" /></svg> Secure</span>
                </div>
              </div>
              <div className="p-5 space-y-5">
                {/* Title */}
                <div>
                  <label className="text-xs opacity-70 flex items-center gap-1" title="Enter a clear event title (min 3 characters)">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3"><path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v1H2V6zm0 3h16v5a2 2 0 01-2 2H4a2 2 0 01-2-2V9z" /></svg>
                    Title*
                  </label>
                  <input
                    className={`mt-1 w-full rounded border px-3 py-2 ${title && !validTitle ? "border-red-400" : ""}`}
                    placeholder="e.g., Bollywood Night"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    aria-invalid={!!(title && !validTitle)}
                  />
                  {title && !validTitle && (
                    <div className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 7a1 1 0 012 0v4a1 1 0 11-2 0V7zm2 6a1 1 0 10-2 0 1 1 0 002 0z" clipRule="evenodd" /></svg>
                      Enter at least 3 characters.
                    </div>
                  )}
                </div>

                {/* City & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs opacity-70 flex items-center gap-1" title="City where the event is hosted">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3"><path d="M10 2a6 6 0 00-6 6c0 4.418 6 10 6 10s6-5.582 6-10a6 6 0 00-6-6zm0 8a2 2 0 110-4 2 2 0 010 4z" /></svg>
                      City*
                    </label>
                    <input
                      className={`mt-1 w-full rounded border px-3 py-2 ${city && !validCity ? "border-red-400" : ""}`}
                      placeholder="e.g., Hyderabad"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      aria-invalid={!!(city && !validCity)}
                    />
                    {city && !validCity && (
                      <div className="text-[11px] text-red-600 mt-1">Enter at least 2 characters.</div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs opacity-70 flex items-center gap-1" title="Event date">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3"><path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1z" /><path d="M18 8H2v7a2 2 0 002 2h12a2 2 0 002-2V8z" /></svg>
                      Date*
                    </label>
                    <input
                      className={`mt-1 w-full rounded border px-3 py-2 ${!validDate && date ? "border-red-400" : ""}`}
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      aria-invalid={!!(!validDate && date)}
                    />
                  </div>
                </div>

                {/* Style */}
                <div>
                  <label className="text-xs opacity-70 flex items-center gap-1" title="Select the style">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3"><path d="M4 6h12v2H4zm0 4h12v2H4zm0 4h12v2H4z" /></svg>
                    Style*
                  </label>
                  <select
                    className="mt-1 w-full rounded border px-3 py-2"
                    value={style}
                    onChange={(e) => setStyle(e.target.value as any)}
                  >
                    <option>Indian</option>
                    <option>Western</option>
                  </select>
                </div>

                {/* Image URL */}
                <div>
                  <label className="text-xs opacity-70 flex items-center gap-1" title="Optional image URL for the event poster (SVG recommended)">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3"><path d="M4 3a2 2 0 00-2 2v9.5A2.5 2.5 0 004.5 17H16a2 2 0 002-2V7l-5-4H4z" /></svg>
                    Image URL (optional)
                  </label>
                  <input
                    className="mt-1 w-full rounded border px-3 py-2"
                    placeholder="https://example.com/your-image.svg"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                  />
                  <div className="text-[11px] opacity-70 mt-1">If omitted, we’ll use a placeholder.</div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs opacity-70 flex items-center gap-1" title="Optional details or notes">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3"><path d="M4 3a2 2 0 00-2 2v9.5A2.5 2.5 0 004.5 17H16a2 2 0 002-2V7l-5-4H4z" /></svg>
                    Description (optional)
                  </label>
                  <textarea
                    className="mt-1 w-full rounded border px-3 py-2"
                    placeholder="Describe your event…"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* Location coordinates */}
                <div>
                  <label className="text-xs opacity-70 flex items-center gap-1" title="Precise latitude and longitude (required)">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3"><path d="M10 2a6 6 0 00-6 6c0 4.418 6 10 6 10s6-5.582 6-10a6 6 0 00-6-6zm0 8a2 2 0 110-4 2 2 0 010 4z" /></svg>
                    Precise map location*
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      className={`mt-1 w-full rounded border px-3 py-2 ${!validCoords ? "border-red-400" : ""}`}
                      placeholder="Latitude (e.g., 17.3850)"
                      value={locationLat}
                      onChange={(e) => setLocationLat(e.target.value)}
                      inputMode="decimal"
                      aria-invalid={!validCoords}
                    />
                    <input
                      className={`mt-1 w-full rounded border px-3 py-2 ${!validCoords ? "border-red-400" : ""}`}
                      placeholder="Longitude (e.g., 78.4867)"
                      value={locationLng}
                      onChange={(e) => setLocationLng(e.target.value)}
                      inputMode="decimal"
                      aria-invalid={!validCoords}
                    />
                  </div>
                  {!validCoords && (
                    <div className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 7a1 1 0 012 0v4a1 1 0 11-2 0V7zm2 6a1 1 0 10-2 0 1 1 0 002 0z" clip-rule="evenodd" /></svg>
                      Please pick a location on the map or enter valid latitude and longitude.
                    </div>
                  )}
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-6 gap-2">
                    <input
                      className="sm:col-span-4 rounded border px-3 py-2"
                      placeholder="Search place or address (e.g., Charminar Hyderabad)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); searchPlaces(); } }}
                    />
                    <button
                      className="sm:col-span-2 rounded bg-[#f97316] text-white py-2 text-sm disabled:opacity-60"
                      type="button"
                      onClick={searchPlaces}
                      disabled={searching}
                    >
                      {searching ? "Searching…" : "Search & Pin"}
                    </button>
                  </div>
                  {searchResults.length > 0 && (
                    <div className="mt-2 rounded border bg-white text-sm">
                      {searchResults.map((r, idx) => (
                        <button
                          key={`${r.lat}-${r.lon}-${idx}`}
                          type="button"
                          className="block w-full text-left px-3 py-2 hover:bg-[#fff7ed]"
                          onClick={() => {
                            setLocationLat(r.lat);
                            setLocationLng(r.lon);
                            const latNum = parseFloat(r.lat);
                            const lonNum = parseFloat(r.lon);
                            if (!Number.isNaN(latNum) && !Number.isNaN(lonNum)) {
                              setMapCenter([latNum, lonNum]);
                            }
                            setSearchResults([]);
                          }}
                        >
                          {r.display_name}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="text-[11px] opacity-70 mt-1">Tap on the map to set precise coordinates, search to pin a location, or paste coordinates from a map app.</div>
                  {isClient && (
                    <div className="mt-2 h-64 w-full rounded overflow-hidden border">
                      <MapPicker
                        center={mapCenter}
                        lat={!Number.isNaN(parseFloat(locationLat)) ? parseFloat(locationLat) : null}
                        lng={!Number.isNaN(parseFloat(locationLng)) ? parseFloat(locationLng) : null}
                        onPick={(lat, lng) => {
                          setLocationLat(String(lat));
                          setLocationLng(String(lng));
                          setMapCenter([lat, lng]);
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Submit */}
                <button
                  className="mt-2 w-full rounded bg-[#f97316] text-white py-2 font-medium disabled:opacity-60"
                  onClick={submit}
                  disabled={submitting || !canSubmit}
                  title={!canSubmit ? "Log in as Studio Owner to submit" : "Submit your event"}
                >
                  {submitting ? "Submitting…" : "Submit"}
                </button>

                {/* Status alerts */}
                {status && (
                  <div className={`mt-3 rounded-xl border p-3 text-sm ${status.toLowerCase().includes("failed") || status.toLowerCase().includes("invalid") ? "bg-[#fee2e2] text-[#7f1d1d] border-red-200" : "bg-[#ecfdf5] text-[#065f46] border-green-200"}`}>
                    <div className="flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 flex-shrink-0">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <div className="font-semibold">{status}</div>
                        {createdId && (
                          <div className="text-xs mt-1">
                            <a href={`/events/${createdId}`} className="underline">View event</a>
                            <span className="mx-2 opacity-50">•</span>
                            <a href="/events" className="underline">Browse all events</a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-[11px] opacity-70 mt-3 text-center">By submitting, you agree to our terms and policies.</div>
              </div>
            </div>

            {/* Preview card */}
            <aside className="md:col-span-1">
              <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                <div
                  className="h-40 w-full"
                  style={{
                    backgroundImage: `url(${previewImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                  aria-label={title || "Event image"}
                />
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">Preview</h4>
                    <span className="text-[11px] opacity-70">Live</span>
                  </div>
                  <div className="mt-2 text-sm font-medium">{title || "Event title"}</div>
                  <div className="text-xs opacity-70">{city || "City"}</div>
                  <div className="text-xs opacity-70">{date || "Date"}</div>
                  <span className="inline-block mt-2 text-xs px-2 py-1 rounded bg-[#fff2e5] text-[#d35400]">{style}</span>
                  <div className="mt-3 text-xs opacity-70">{description || "Description will appear here."}</div>
                  <div className="mt-4 rounded bg-[#fff7ed] text-[#9a3412] px-3 py-2 text-xs">
                    For best results, use an SVG image. If omitted, a placeholder is shown.
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <a href="/events" className="text-xs underline">Explore events</a>
                    <span className="hidden sm:inline text-xs opacity-50">•</span>
                    <a href="/" className="text-xs underline">Home</a>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}