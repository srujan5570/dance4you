"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamically import the map component to avoid SSR issues
const EventsMap = dynamic(() => import("@/components/EventsMap"), { ssr: false });

type EventItem = {
  id: string;
  title: string;
  city: string;
  date: string; // ISO yyyy-mm-dd
  // style removed; using date-based filters (Today, Upcoming, Latest)
  image: string; // public path to SVG
  locationLat?: number | null;
  locationLng?: number | null;
  _distanceKm?: number; // computed when nearMe is enabled
};

export default function EventsPage() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category") || "";
  const [q, setQ] = useState("");
  const [date, setDate] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "today" | "upcoming" | "latest">("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

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
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);

  // Helper to normalize city names from navbar (strip state, fix common aliases)
  function cleanCity(name: string | null | undefined): string {
    const raw = String(name || "").trim();
    if (!raw) return "";
    // Use the segment before comma (drop ", State" suffixes)
    let base = raw.split(",")[0].trim();
    // Normalize common alias
    if (base.toLowerCase() === "bangalore") base = "Bengaluru";
    return base;
  }

  // Get saved location or region from localStorage
  useEffect(() => {
    try {
      const rawRegion = localStorage.getItem("userRegion");
      const region = rawRegion ? JSON.parse(rawRegion) : null;
      if (region?.city) setSelectedCity(cleanCity(region.city));
      if (region?.state) setSelectedState(region.state);
      if (rawRegion) {
        const region = JSON.parse(rawRegion);
        if (region?.city) setSelectedCity(cleanCity(region.city));
        if (typeof region?.latitude === "number" && typeof region?.longitude === "number") {
          setMyLat(region.latitude);
          setMyLng(region.longitude);
          return; // we have region coords, no need to request geolocation
        }
      }
      // fallback to previously saved geolocation
      const savedLocation = localStorage.getItem("userLocation");
      if (savedLocation) {
        const { latitude, longitude } = JSON.parse(savedLocation);
        setMyLat(latitude);
        setMyLng(longitude);
      } else {
        // request geolocation if nothing saved
        requestMyLocation();
      }
    } catch (err) {
      console.error("Error initializing location/region:", err);
      requestMyLocation();
    }
  }, []);

  // Listen for city selection changes from navbar/modal
  useEffect(() => {
    function onRegionChanged(e: Event) {
      try {
        const detail = (e as CustomEvent).detail as any;
        if (detail?.city) setSelectedCity(cleanCity(detail.city));
        if (detail?.state) setSelectedState(detail.state);
      } catch {}
    }
    window.addEventListener("user-region-changed", onRegionChanged as EventListener);
    return () => window.removeEventListener("user-region-changed", onRegionChanged as EventListener);
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
        setLoading(true);
        const normalizedCity = selectedCity ? cleanCity(selectedCity) : "";
        const normalizedState = selectedState ? selectedState.trim() : "";
        const params = new URLSearchParams();
        if (normalizedCity) {
          params.set("city", normalizedCity);
          params.set("cityExact", "true");
        }
        if (normalizedState) {
          params.set("state", normalizedState);
          params.set("stateExact", "true");
        }
        if (categoryParam) {
          params.set("category", categoryParam);
        }
        const url = `/api/events${params.toString() ? `?${params.toString()}` : ""}`;
        const res = await fetch(url, { cache: "no-store" });
        const data = await res.json();
        setEvents(data || []);
      } catch {
        setError("Failed to load events");
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedCity, selectedState, categoryParam]);

  const todayStr = useMemo(() => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
    if (hasUserLocation && nearMe) {
      sorted.sort((a, b) => {
        // Handle null distances (put them at the end)
        if (a._distanceKm === null && b._distanceKm === null) return 0;
        if (a._distanceKm === null) return 1;
        if (b._distanceKm === null) return -1;
        // Sort by distance
        return (a._distanceKm as number) - (b._distanceKm as number);
      });
    } else if (filterMode === "latest") {
      // Sort by newest date when "Latest" is selected
      sorted.sort((a, b) => b.date.localeCompare(a.date));
    }

  const res = sorted.filter((ev) => {
  const matchesQ = q ? ev.title.toLowerCase().includes(q.toLowerCase()) : true;
  // City filter removed; matchesCity no longer used
  const matchesDate = date ? ev.date === date : true;
  const matchesSelectedCity = selectedCity 
    ? cleanCity(ev.city).toLowerCase() === cleanCity(selectedCity).toLowerCase()
    : true;
  const matchesSelectedState = selectedState
    ? ((ev as any).state ? String((ev as any).state).trim().toLowerCase() === selectedState.trim().toLowerCase() : true)
    : true;
  const matchesFilterMode =
    filterMode === "today"
      ? ev.date === todayStr
      : filterMode === "upcoming"
      ? ev.date > todayStr
      : /* all or latest (latest handled in sort) */ true;
  const withinRadius = !nearMe || !hasUserLocation
  ? true
  : typeof ev._distanceKm === "number"
  ? ev._distanceKm <= radiusKm
  : true;

        return matchesQ && matchesDate && matchesFilterMode && matchesSelectedCity && matchesSelectedState && withinRadius;
  });

  if (nearMe) {
  res.sort((a, b) => {
  const da = typeof a._distanceKm === "number" ? a._distanceKm : Infinity;
  const db = typeof b._distanceKm === "number" ? b._distanceKm : Infinity;
  return da - db;
  });
  }

  return res;
  }, [events, q, date, filterMode, nearMe, radiusKm, myLat, myLng, selectedCity, selectedState]);

  return (
    <main className="min-h-screen bg-background text-foreground font-sans">
      {/* Gradient banner */}
      <div className="w-full bg-gradient-to-b from-black via-orange-700 to-orange-400 text-white">
        <div className="max-w-6xl mx-auto px-6 py-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-wide">Find Dance Events</h2>
          <p className="mt-1 text-sm sm:text-base opacity-95">Search by title and date; filter by Today, Upcoming, or Latest.</p>
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
            className="md:col-span-1 rounded-xl border border-black/10 bg-white/60 px-2 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
          />
          {/* City filter removed; relying on user location and navbar selection */}
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-black/10 bg-white/60 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
          />
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center justify-between gap-2 rounded-xl border border-black/10 bg-white/60 px-4 py-2 text-sm font-semibold shadow-sm hover:bg-white transition cursor-pointer"
            >
              <span>{filterMode === "all" ? "All" : filterMode === "today" ? "Today" : filterMode === "upcoming" ? "Upcoming" : "Latest"}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 opacity-80" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.29a.75.75 0 01-.02-1.08z" clipRule="evenodd" />
              </svg>
            </button>
            {showFilterMenu && (
              <div className="absolute mt-2 w-40 rounded-xl border border-black/10 bg-white z-10 shadow-lg">
                <button type="button" onClick={() => { setFilterMode("all"); setShowFilterMenu(false); }} className="block w-full text-left px-3 py-2 text-sm hover:bg-orange-50">All</button>
                <button type="button" onClick={() => { setFilterMode("today"); setShowFilterMenu(false); }} className="block w-full text-left px-3 py-2 text-sm hover:bg-orange-50">Today</button>
                <button type="button" onClick={() => { setFilterMode("upcoming"); setShowFilterMenu(false); }} className="block w-full text-left px-3 py-2 text-sm hover:bg-orange-50">Upcoming</button>
                <button type="button" onClick={() => { setFilterMode("latest"); setShowFilterMenu(false); }} className="block w-full text-left px-3 py-2 text-sm hover:bg-orange-50">Latest</button>
              </div>
            )}
          </div>
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
            className="rounded-xl border border-black/10 bg-white/60 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
            placeholder="Radius (km)"
            aria-label="Radius in kilometers"
            disabled={!nearMe}
          />
          <button
            type="button"
            onClick={requestMyLocation}
            className="rounded-xl bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white px-4 py-2 text-sm font-semibold shadow-lg hover:from-orange-600 hover:via-pink-600 hover:to-purple-700 transition-transform transform hover:-translate-y-0.5 active:translate-y-0"
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
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-lg transition-transform transform hover:-translate-y-0.5 active:translate-y-0 ${
              showMap ? "bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white" : "bg-white/80 border border-black/10 text-gray-800 hover:bg-white"
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
          <div className="h-[600px] w-full rounded-2xl overflow-hidden border border-black/10 shadow-lg ring-1 ring-white/20 mb-6">
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
                className="block group rounded-2xl overflow-hidden border border-black/10 bg-white/80 backdrop-blur-lg shadow-lg hover:shadow-xl transition"
              >
                <div
                  className="w-full transform transition-transform duration-300 group-hover:scale-105"
                  style={{
                    aspectRatio: "4 / 3",
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
                  {/* Removed style badge since filters are date-based */}
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
