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
};

export default function EventsPage() {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const [style, setStyle] = useState<"All" | "Indian" | "Western">("All");

  // fetch events from API
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    return events.filter((ev) => {
      const matchesQ = q ? ev.title.toLowerCase().includes(q.toLowerCase()) : true;
      const matchesCity = city ? ev.city.toLowerCase().includes(city.toLowerCase()) : true;
      const matchesDate = date ? ev.date === date : true;
      const matchesStyle = style === "All" ? true : ev.style === style;
      return matchesQ && matchesCity && matchesDate && matchesStyle;
    });
  }, [events, q, city, date, style]);

  return (
    <main className="min-h-screen bg-background text-foreground font-sans">
      {/* Gradient banner */}
      <div className="w-full bg-gradient-to-b from-black via-orange-700 to-orange-400 text-white">
        <div className="max-w-6xl mx-auto px-6 py-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-wide">Find Dance Events</h2>
          <p className="mt-1 text-sm sm:text-base opacity-95">
            Search by city, date, and style.
          </p>
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
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStyle(e.target.value as "All" | "Indian" | "Western")}
            className="rounded border px-3 py-2"
          >
            <option value="All">All</option>
            <option value="Indian">Indian</option>
            <option value="Western">Western</option>
          </select>
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
              <Link key={ev.id} href={`/events/${ev.id}`} className="block rounded-lg overflow-hidden border bg-white">
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
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}