"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamically import the map component to avoid SSR issues
const EventsMap = dynamic(() => import("@/components/EventsMap"), { ssr: false });

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
  const [nearMe, setNearMe] = useState(true); // Default to true for automatic distance sorting
  const [radiusKm, setRadiusKm] = useState<number>(25);
  const [myLat, setMyLat] = useState<number | null>(null);
  const [myLng, setMyLng] = useState<number | null>(null);
  const [locError, setLocError] = useState<string | null>(null);
  
  // Map view state
  const [showMap, setShowMap] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Get saved location from localStorage
  useEffect(() => {
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      try {
        const { latitude, longitude } = JSON.parse(savedLocation);
        setMyLat(latitude);
        setMyLng(longitude);
      } catch (err) {
        console.error('Error parsing saved location:', err);
        requestMyLocation(); // Fallback to requesting location
      }
    } else {
      requestMyLocation(); // No saved location, request it
    }
  }, []);

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
        // Save to localStorage for future use
        localStorage.setItem('userLocation', JSON.stringify({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        }));
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
    // Always compute distance if we have user location, regardless of nearMe setting
    const hasUserLocation = typeof myLat === "number" && typeof myLng === "number";

    const augmented = events.map((ev) => {
      let dist: number | null = null;
      if (
        hasUserLocation &&
        typeof ev.locationLat === "number" &&
        typeof ev.locationLng === "number"
      ) {
        dist = haversineKm(myLat!, myLng!, ev.locationLat, ev.locationLng);
      }
      return { ...ev, _distanceKm: dist };
    });

    // Sort by distance if nearMe is enabled and we have user location
    const sorted = [...augmented];
    if (hasUserLocation) {
      sorted.sort((a, b) => {
        // Handle null distances (put them at the end)
        if (a._distanceKm === null && b._distanceKm === null) return 0;
        if (a._distanceKm === null) return 1;
        if (b._distanceKm === null) return -1;
        // Sort by distance
        return a._distanceKm - b._distanceKm;
      });
    }

    const res = sorted.filter((ev) => {
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
        
        {/* Map view toggle */}
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => setShowMap(!showMap)}
            className={`flex items-center gap-2 rounded px-4 py-2 text-sm font-medium ${
              showMap ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-800"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M8.161 2.58a1.875 1.875 0 011.678 0l4.993 2.498c.106.052.23.052.336 0l3.869-1.935A1.875 1.875 0 0121.75 4.82v12.485c0 .71-.401 1.36-1.037 1.677l-4.875 2.437a1.875 1.875 0 01-1.676 0l-4.994-2.497a.375.375 0 00-.336 0l-3.868 1.935A1.875 1.875 0 012.25 19.18V6.695c0-.71.401-1.36 1.036-1.677l4.875-2.437zM9 6a.75.75 0 01.75.75V15a.75.75 0 01-1.5 0V6.75A.75.75 0 019 6zm6.75 3a.75.75 0 00-1.5 0v8.25a.75.75 0 001.5 0V9z" clipRule="evenodd" />
            </svg>
            {showMap ? "Hide Map" : "Show on Map"}
          </button>
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
        ) : showMap ? (
          <div className="h-[600px] w-full rounded-lg overflow-hidden border mb-6">
            <EventsMap 
              events={filtered} 
              userLat={myLat} 
              userLng={myLng}
              selectedEventId={selectedEventId}
              onSelectEvent={(id) => setSelectedEventId(id)}
            />
          </div>
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
