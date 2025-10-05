"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type EventItem = {
  id: string;
  title: string;
  city: string;
  date: string; // ISO yyyy-mm-dd
  style: "Indian" | "Western";
  image: string; // public path to SVG
  locationLat?: number | null;
  locationLng?: number | null;
  _distanceKm?: number; // computed when nearMe is enabled
};

export default function EventsPage() {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const [style, setStyle] = useState<"All" | "Indian" | "Western">("All");

  // Fetch events from API instead of static list
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Near me state
  const [nearMe, setNearMe] = useState(false);
  const [radiusKm, setRadiusKm] = useState<number>(25);
  const [myLat, setMyLat] = useState<number | null>(null);
  const [myLng, setMyLng] = useState<number | null>(null);
  const [locError, setLocError] = useState<string | null>(null);

  // Request geolocation
  async function requestMyLocation() {
    setLocError(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocError("Geolocation is not supported in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMyLat(pos.coords.latitude);
        setMyLng(pos.coords.longitude);
      },
      (err) => {
        setLocError("Failed to get your location: " + (err?.message || "Unknown error"));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // Haversine formula for distance in km
  function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/events", { cache: "no-store" });
        const data = await res.json();
        setEvents(data || []);
      } catch {
        setError("Failed to load events");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const computeDistance = nearMe && typeof myLat === "number" && typeof myLng === "number";

    const augmented = events.map((ev) => {
      let dist: number | null = null;
      if (
        computeDistance &&
        typeof ev.locationLat === "number" &&
        typeof ev.locationLng === "number"
      ) {
        dist = haversineKm(myLat!, myLng!, ev.locationLat, ev.locationLng);
      }
      return { ...ev, _distanceKm: dist };
    });

      const res = augmented.filter((ev) => {
      const matchesQ = q ? ev.title.toLowerCase().includes(q.toLowerCase()) : true;
      const matchesCity = city ? ev.city.toLowerCase().includes(city.toLowerCase()) : true;
      const matchesDate = date ? ev.date === date : true;
      const matchesStyle = style === "All" ? true : ev.style === style;
      const withinRadius = !nearMe
        ? true
        : typeof ev._distanceKm === "number"
        ? ev._distanceKm <= radiusKm
        : false;

      return matchesQ && matchesCity && matchesDate && matchesStyle && withinRadius;
    });

    if (nearMe) {
      res.sort((a, b) => {
        const da = typeof a._distanceKm === "number" ? a._distanceKm : Infinity;
        const db = typeof b._distanceKm === "number" ? b._distanceKm : Infinity;
        return da - db;
      });
    }

    return res;
  }, [events, q, city, date, style, nearMe, radiusKm, myLat, myLng]);

  return (
    <main className="min-h-screen bg-background text-foreground font-sans">
      {/* Gradient banner */}
      <div className="w-full bg-gradient-to-b from-black via-orange-700 to-orange-400 text-white">
        <div className="max-w-6xl mx-auto px-6 py-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-wide">Find Dance Events</h2>
          <p className="mt-1 text-sm sm:text-base opacity-95">Search by city, date, and style.</p>
        </div>
      </div>

      {/* Filters */}
      <section className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title"
            className="md:col-span-2 rounded border px-3 py-2"
          />
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
            className="rounded border px-3 py-2"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded border px-3 py-2"
          />
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value as "Indian" | "Western" | "All")}
            className="rounded border px-3 py-2"
          >
            <option>All</option>
            <option>Indian</option>
            <option>Western</option>
          </select>
        </div>

        {/* Near me controls */}
        <div className="mt-3 grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={nearMe}
              onChange={(e) => {
                const v = e.target.checked;
                setNearMe(v);
                if (v && myLat == null && myLng == null) requestMyLocation();
              }}
            />
            Near me
          </label>
          <input
            type="number"
            min={1}
            max={200}
            step={1}
            value={radiusKm}
            onChange={(e) => setRadiusKm(Math.max(1, Math.min(200, parseFloat(e.target.value) || 0)))}
            className="rounded border px-3 py-2"
            placeholder="Radius (km)"
            aria-label="Radius in kilometers"
            disabled={!nearMe}
          />
          <button
            type="button"
            onClick={requestMyLocation}
            className="rounded border px-3 py-2 text-sm"
          >
            Use my location
          </button>
          {myLat != null && myLng != null && (
            <div className="text-xs opacity-70 md:col-span-2">
              My location: {myLat.toFixed(4)}, {myLng.toFixed(4)}
            </div>
          )}
          {locError && (
            <div className="text-xs text-red-600 md:col-span-2">{locError}</div>
          )}
        </div>
      </section>

      {/* Results */}
      <section className="max-w-6xl mx-auto px-6 pb-10">
        {loading ? (
          <div className="text-center text-sm opacity-70">Loading events…</div>
        ) : error ? (
          <div className="text-center text-sm text-red-600">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-sm opacity-70">No events found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {filtered.map((ev) => (
              <Link
                key={ev.id}
                href={`/events/${ev.id}`}
                className="block rounded-lg overflow-hidden border bg-white"
              >
                <div
                  className="h-40"
                  style={{
                    backgroundImage: `url(${ev.image || "/hero-placeholder.svg"})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                  aria-label={ev.title}
                />
                <div className="p-3">
                  <h3 className="font-semibold text-sm">{ev.title}</h3>
                  <p className="text-xs opacity-70">{ev.city}</p>
                  <p className="text-xs opacity-70">{ev.date}</p>
                  <span className="inline-block mt-2 text-xs px-2 py-1 rounded bg-[#fff2e5] text-[#d35400]">
                    {ev.style}
                  </span>
                  {typeof ev._distanceKm === "number" && (
                    <div className="mt-1 text-xs opacity-70">{ev._distanceKm.toFixed(1)} km away</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
