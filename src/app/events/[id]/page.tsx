import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import EventMap from "@/components/EventMap";

async function getEvent(id: string, baseUrl?: string) {
  const url = `${baseUrl ?? ""}/api/events/${id}`;
  const res = await fetch(url, {
    // Ensure server-side fetch (no cache)
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function EventDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  const runtimeBase = `${proto}://${host}`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? runtimeBase;

  const event = await getEvent(id, baseUrl);
  if (!event) return notFound();

  const hasContacts = !!(event.contactPhone || event.contactEmail || event.venueAddress || event.venueMapUrl || event.contactNotes);

  return (
    <main className="min-h-screen bg-background text-foreground font-sans">
      {/* Gradient banner */}
      <div className="w-full bg-gradient-to-b from-black via-orange-700 to-orange-400 text-white">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-wide">{event.title}</h1>
          <p className="mt-1 text-sm sm:text-base opacity-95">
            {event.city} • {event.date} • {event.style}
          </p>
        </div>
      </div>

      {/* Hero image */}
      <section
        className="relative w-full"
        style={{
          backgroundImage: `url(${event.image || "/hero-placeholder.svg"})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="h-[360px]" />
        <div className="absolute top-0 left-0 right-0 h-8 bg-black/30" />
      </section>

      {/* Details */}
      <section className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <h2 className="text-lg font-semibold mb-2">About this event</h2>
          <p className="text-sm leading-6 opacity-85">{event.description}</p>
        </div>
        <aside className="md:col-span-1">
          <div className="rounded border p-4 bg-white">
            <div className="text-sm opacity-80">City</div>
            <div className="font-medium">{event.city}</div>
            <div className="mt-3 text-sm opacity-80">Date</div>
            <div className="font-medium">{event.date}</div>
            <div className="mt-3 text-sm opacity-80">Style</div>
            <div className="font-medium">{event.style}</div>
            <Link href={`/events/${event.id}/book`} className="block mt-4">
              <button className="w-full rounded bg-[#f97316] text-white py-2 font-medium">
                Book Now
              </button>
            </Link>
          </div>

          {/* Contact details (visible after booking or for owner) */}
          <div className="mt-6 rounded border p-4 bg-white">
            <div className="font-semibold text-sm">Contact & Venue</div>
            {hasContacts ? (
              <div className="mt-2 space-y-2 text-sm">
                {event.contactPhone && (
                  <div>
                    <div className="opacity-80">Phone</div>
                    <div className="font-medium">{event.contactPhone}</div>
                  </div>
                )}
                {event.contactEmail && (
                  <div>
                    <div className="opacity-80">Email</div>
                    <a href={`mailto:${event.contactEmail}`} className="underline">{event.contactEmail}</a>
                  </div>
                )}
                {event.venueAddress && (
                  <div>
                    <div className="opacity-80">Venue Address</div>
                    <div className="font-medium whitespace-pre-line">{event.venueAddress}</div>
                  </div>
                )}
                {event.venueMapUrl && (
                  <div className="mt-2">
                    <a href={event.venueMapUrl} target="_blank" rel="noopener noreferrer" className="underline">View location</a>
                  </div>
                )}
                {typeof event.locationLat === "number" && typeof event.locationLng === "number" && (
                  <div className="mt-3">
                    <div className="text-xs opacity-70">Precise coordinates</div>
                    <div className="font-medium">Lat: {event.locationLat.toFixed(6)}, Lng: {event.locationLng.toFixed(6)}</div>
                    <div className="mt-2 h-48 w-full rounded overflow-hidden border">
                      <EventMap lat={event.locationLat} lng={event.locationLng} />
                    </div>
                    <div className="mt-2">
                      <a
                        className="underline"
                        href={`https://www.google.com/maps?q=${event.locationLat},${event.locationLng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open in Google Maps
                      </a>
                    </div>
                  </div>
                )}
                {event.contactNotes && (
                  <div>
                    <div className="opacity-80">Notes</div>
                    <div className="font-medium whitespace-pre-line">{event.contactNotes}</div>
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-2 text-xs opacity-70">Book this event to view the organizer&apos;s contact details and venue information.</p>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}