"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getUserLocation, saveUserLocation } from "@/lib/geolocation";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function RegularClassesPage() {
  // Replace static content with dynamic regular classes listing with filters
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<"today" | "upcoming" | "latest">("today");

  // Geolocation state
  const [myLat, setMyLat] = useState<number | null>(null);
  const [myLng, setMyLng] = useState<number | null>(null);
  const [locError, setLocError] = useState<string | null>(null);

  useEffect(() => {
    // Load saved location if available
    const saved = getSavedLocation();
    if (saved) {
      setMyLat(saved.latitude);
      setMyLng(saved.longitude);
    }
  }, []);

  async function requestMyLocation() {
    setLocError(null);
    try {
      const loc = await getUserLocation();
      setMyLat(loc.latitude);
      setMyLng(loc.longitude);
    } catch (e: any) {
      setLocError(e?.message || "Failed to get your location");
    }
  }

  const [city, setCity] = useState<string>("");
  const [group, setGroup] = useState<"ALL" | "ADULT" | "CHILDREN">("ALL");

  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams();
        params.set("category", "REGULAR_CLASS");
        if (city.trim()) params.set("city", city.trim());
        if (group !== "ALL") params.set("group", group);
        const url = `/api/events?${params.toString()}`;
        const res = await fetch(url, { cache: "no-store" });
        const data = await res.json();
        setEvents(Array.isArray(data) ? data : []);
      } catch (e) {
        setError("Failed to load events");
      } finally {
        setLoading(false);
      }
    })();
  }, [city, group]);

  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  const regularClasses = useMemo(() => {
    const onlyRegular = events.filter((ev) => ev.category === "REGULAR_CLASS");

    // Augment with distance if possible
    const augmented = onlyRegular.map((ev) => {
      let _distanceKm: number | null = null;
      if (
        typeof myLat === "number" &&
        typeof myLng === "number" &&
        typeof ev.locationLat === "number" &&
        typeof ev.locationLng === "number"
      ) {
        _distanceKm = calculateDistance(myLat, myLng, ev.locationLat, ev.locationLng);
      }
      return { ...ev, _distanceKm };
    });

    let filtered = augmented;
    if (filterMode === "today") {
      filtered = augmented.filter((ev) => ev.date === todayStr);
      // Sort by distance if available
      filtered.sort((a, b) => {
        const da = typeof a._distanceKm === "number" ? a._distanceKm : Infinity;
        const db = typeof b._distanceKm === "number" ? b._distanceKm : Infinity;
        return da - db;
      });
    } else if (filterMode === "upcoming") {
      filtered = augmented.filter((ev) => typeof ev.date === "string" && ev.date > todayStr);
      filtered.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    } else {
      // latest: show all regular classes sorted by createdAt desc
      filtered = [...augmented].sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return bTime - aTime;
      });
    }

    return filtered;
  }, [events, filterMode, myLat, myLng, todayStr]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Gradient headline band */}
      <div className="w-full bg-gradient-to-b from-black via-orange-700 to-orange-400 text-white">
        <div className="max-w-6xl mx-auto px-6 py-5 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-wide">Regular Classes</h1>
          <p className="mt-1 text-sm sm:text-base opacity-95">
            Browse regular class posts. Default view shows today9s classes. Use filters for upcoming and latest.
          </p>
        </div>
      </div>

      {/* Filters */}
      <section className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Filter mode buttons */}
          <div className="inline-flex rounded-xl overflow-hidden border border-black/10 bg-white/80 shadow-sm">
            <button
              type="button"
              onClick={() => setFilterMode("today")}
              className={`px-4 py-2 text-sm font-semibold transition cursor-pointer ${
                filterMode === "today" ? "bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white" : "bg-white text-gray-800"
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("upcoming")}
              className={`px-4 py-2 text-sm font-semibold transition cursor-pointer ${
                filterMode === "upcoming" ? "bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white" : "bg-white text-gray-800"
              }`}
            >
              Upcoming
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("latest")}
              className={`px-4 py-2 text-sm font-semibold transition cursor-pointer ${
                filterMode === "latest" ? "bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white" : "bg-white text-gray-800"
              }`}
            >
              Latest
            </button>
          </div>

          {/* City input */}
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
            className="rounded-xl border border-black/10 bg-white/80 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
          />

          {/* Group select: Adult vs Children */}
          <select
            value={group}
            onChange={(e) => setGroup(e.target.value as "ALL" | "ADULT" | "CHILDREN")}
            className="rounded-xl border border-black/10 bg-white/80 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition cursor-pointer"
          >
            <option value="ALL">All Groups</option>
            <option value="ADULT">Adult Dance Classes (Batch)</option>
            <option value="CHILDREN">Children Dance Classes (Batch)</option>
          </select>

          {/* Geolocation */}
          <button
            type="button"
            onClick={requestMyLocation}
            className="rounded-xl bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white px-4 py-2 text-sm font-semibold shadow-lg hover:from-orange-600 hover:via-pink-600 hover:to-purple-700 transition-transform transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            Use my location
          </button>
          {myLat != null && myLng != null && (
            <div className="text-xs opacity-70">My location: {myLat.toFixed(4)}, {myLng.toFixed(4)}</div>
          )}
          {locError && <div className="text-xs text-red-600">{locError}</div>}
        </div>
      </section>

      {/* Results */}
      <section className="max-w-6xl mx-auto px-6 pb-10">
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" color="orange" text="Loading classes..." />
          </div>
        ) : error ? (
          <div className="text-center text-sm text-red-600">{error}</div>
        ) : regularClasses.length === 0 ? (
          <div className="text-center text-sm opacity-70">No regular classes found for {filterMode}.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {regularClasses.map((ev) => {
              const poster = ev.poster4x3 || (Array.isArray(ev.posterUrls) && ev.posterUrls.length > 0 ? ev.posterUrls[0] : ev.image) || "/hero-placeholder.svg";
              return (
                <Link
                  key={ev.id}
                  href={`/events/${ev.id}`}
                  className="block group rounded-2xl overflow-hidden border border-black/10 bg-white/80 backdrop-blur-lg shadow-lg hover:shadow-xl transition cursor-pointer"
                >
                  <div
                    className="relative h-40 transform transition-transform duration-300 group-hover:scale-105"
                    style={{
                      backgroundImage: `url(${poster})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                    }}
                    aria-label={ev.title}
                  >
                    {/* Distance badge overlay on poster */}
                    {typeof ev._distanceKm === "number" && (
                      <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                        {ev._distanceKm.toFixed(1)} km away
                      </div>
                    )}
                    {/* Title overlay at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white p-2">
                      <h3 className="font-semibold text-sm line-clamp-2">{ev.title}</h3>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Back to home */}
        <div className="mt-10 text-center">
          <Link href="/" className="text-[#f97316] hover:underline">
            Back to Home
          </Link>
        </div>
      </section>
    </div>
  );
}