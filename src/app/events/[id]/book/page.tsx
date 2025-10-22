"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ButtonLoader } from "@/components/ButtonLoader";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function BookEventPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const eventId = (params?.id as string) || "";
  const bookingType = searchParams.get("type") || "regular"; // "regular" or "dropin"
  const isDropInBooking = bookingType === "dropin";
  
  const [event, setEvent] = useState<{
    id?: string;
    title: string;
    city: string;
    date: string;
    style?: string;
    image?: string;
    category?: string;
    enableDropInClass?: boolean;
    dropInFee?: string;
    dropInDescription?: string;
    fee?: string;
  } | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [tickets, setTickets] = useState<number>(1);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<string | null>(null); // error/info messages
  const [bookingRef, setBookingRef] = useState<string | null>(null); // success reference id
  const [submitting, setSubmitting] = useState(false);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [session, setSession] = useState<{ authenticated: boolean; user?: { role?: string } } | null>(null);

  // Price per ticket - use drop-in fee if booking drop-in, otherwise regular fee
  const getEventPrice = () => {
    if (!event) return 499;
    if (isDropInBooking && event.dropInFee) {
      // Extract numeric value from drop-in fee string
      const match = event.dropInFee.match(/\d+/);
      return match ? parseInt(match[0]) : 499;
    }
    if (event.fee) {
      const match = event.fee.match(/\d+/);
      return match ? parseInt(match[0]) : 499;
    }
    return 499;
  };
  
  const pricePerTicket = getEventPrice();
  const subtotal = useMemo(() => tickets * pricePerTicket, [tickets, pricePerTicket]);

  useEffect(() => {
    if (!eventId) return;
    setLoadingEvent(true);
    (async () => {
      try {
        const res = await fetch(`/api/events/${eventId}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setEvent({ 
            id: data.id, 
            title: data.title, 
            city: data.city, 
            date: data.date, 
            style: data.style, 
            image: data.image,
            category: data.category,
            enableDropInClass: data.enableDropInClass,
            dropInFee: data.dropInFee,
            dropInDescription: data.dropInDescription,
            fee: data.fee
          });
        }
      } catch {
        // ignore
      } finally {
        setLoadingEvent(false);
      }
    })();
  }, [eventId]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/session", { cache: "no-store" });
        const data = await res.json();
        setSession(data);
      } catch {}
    })();
  }, []);

  // Validation helpers
  const validName = useMemo(() => name.trim().length >= 2, [name]);
  const validEmail = useMemo(() => /.+@.+\..+/.test(email.trim()), [email]);
  const canSubmit = useMemo(() => validName && validEmail && tickets > 0 && !!eventId && session?.authenticated, [validName, validEmail, tickets, eventId, session?.authenticated]);

  function decTickets() {
    setTickets((t) => Math.max(1, t - 1));
  }
  function incTickets() {
    setTickets((t) => t + 1);
  }

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!canSubmit) return;
    setStatus(null);
    setBookingRef(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          eventId, 
          name, 
          email, 
          tickets: Number(tickets), 
          note,
          isDropInBooking,
          dropInFee: isDropInBooking ? event?.dropInFee : undefined
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || "Failed to book");
        return;
      }
      setBookingRef(data.id);
      setStatus(null);
      // Reset form after success
      setName("");
      setEmail("");
      setTickets(1);
      setNote("");
    } catch {
      setStatus("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground font-sans">
      {/* Gradient banner */}
      <div className="w-full bg-gradient-to-b from-black via-orange-700 to-orange-400 text-white">
        <div className="max-w-6xl mx-auto px-6 py-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-wide">
            {isDropInBooking ? "Book Drop-in Class" : "Book Tickets"}
          </h2>
          {event ? (
            <p className="mt-1 text-sm sm:text-base opacity-95">
              {event.title} • {event.city} • {event.date}
              {isDropInBooking && (
                <span className="block text-xs mt-1 opacity-80">
                  Drop-in Class Booking
                </span>
              )}
            </p>
          ) : (
            <div className="flex justify-center py-4">
              <LoadingSpinner size="sm" color="white" text="Loading event details..." />
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <section className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left: Event Summary */}
          <aside className="md:col-span-1">
            <div className="rounded-xl border bg-white dark:bg-gray-800 dark:border-white/10 dark:text-gray-100 shadow-sm overflow-hidden">
              {/* Event image */}
              <div
                className="h-40 w-full"
                style={{
                  backgroundImage: `url(${event?.image || "/hero-placeholder.svg"})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }}
                aria-label={event?.title || "Event image"}
              />
              <div className="p-4">
                <div className="text-sm opacity-80 dark:text-gray-300">Event</div>
                <div className="font-semibold">{event?.title || "—"}</div>
                <div className="mt-3 text-sm opacity-80 dark:text-gray-300">City</div>
                <div className="font-medium">{event?.city || "—"}</div>
                <div className="mt-3 text-sm opacity-80 dark:text-gray-300">Date</div>
                <div className="font-medium">{event?.date || "—"}</div>
                {event?.style && (
                  <>
                    <div className="mt-3 text-sm opacity-80 dark:text-gray-300">Style</div>
                    <div className="font-medium">{event.style}</div>
                  </>
                )}
                
                {/* Show drop-in specific information */}
                {isDropInBooking && event?.enableDropInClass && (
                  <>
                    <div className="mt-3 text-sm opacity-80 dark:text-gray-300">Booking Type</div>
                    <div className="font-medium text-orange-600 dark:text-orange-400">Drop-in Class</div>
                    {event.dropInDescription && (
                      <>
                        <div className="mt-3 text-sm opacity-80 dark:text-gray-300">Description</div>
                        <div className="text-sm">{event.dropInDescription}</div>
                      </>
                    )}
                    {event.dropInFee && (
                      <>
                        <div className="mt-3 text-sm opacity-80 dark:text-gray-300">Drop-in Fee</div>
                        <div className="font-medium">{event.dropInFee}</div>
                      </>
                    )}
                  </>
                )}
                
                <Link href={`/events/${eventId}`} className="block mt-4 text-xs underline dark:text-gray-300">
                  View event details
                </Link>
              </div>
            </div>
            <div className="mt-6 rounded-xl border bg-white dark:bg-gray-800 dark:border-white/10 dark:text-gray-100 shadow-sm p-4">
              <div className="text-sm font-semibold">Need help?</div>
              <p className="text-xs opacity-80 dark:text-gray-300 mt-1">Contact us for assistance with your booking.</p>
              <a href="mailto:itsforyou.dance4you@gmail.com" className="inline-block mt-2 text-xs text-[#167C36] dark:text-green-400 underline">
                itsforyou.dance4you@gmail.com
              </a>
            </div>
          </aside>

          {/* Right: Booking form */}
          <div className="md:col-span-2">
            {/* Confirmation panel */}
            {bookingRef && (
              <div className="mb-6 rounded-xl border bg-[#ecfdf5] text-[#065f46] p-4">
                <div className="flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 flex-shrink-0">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <div className="font-semibold">Booking confirmed</div>
                    <div className="text-sm mt-1">Reference: <span className="font-mono">{bookingRef}</span></div>
                    <div className="text-xs mt-2 opacity-80">We’ve sent a confirmation email. Keep the reference for any support.</div>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <a href={`/events/${eventId}`} className="text-xs underline">View event details</a>
                      <span className="hidden sm:inline text-xs opacity-50">•</span>
                      <a
                        className="text-xs underline"
                        href={`mailto:itsforyou.dance4you@gmail.com?subject=Cancel Booking ${bookingRef}&body=Please cancel my booking ${bookingRef} for event ${event?.title}.`}
                      >
                        Cancel booking
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={submit} className="rounded-xl border bg-white dark:bg-gray-800 dark:border-white/10 dark:text-gray-100 shadow-sm p-6">
              <h3 className="text-lg font-semibold">Secure your spot</h3>
              {!session?.authenticated && (
                <div className="mt-3 rounded border border-yellow-300 bg-yellow-50 text-yellow-700 px-3 py-2 text-sm dark:bg-yellow-900/30 dark:border-yellow-700/50 dark:text-yellow-200">
                  Please <Link href="/auth/login" className="underline">log in</Link> or <Link href="/auth/register" className="underline">register</Link> to book.
                </div>
              )}
              <p className="text-xs opacity-70 dark:text-gray-300 mt-1">Fill in your details and confirm your booking.</p>

              {/* Status messages (errors/info) */}
              {status && (
                <div className="mt-4 rounded border border-red-300 bg-red-50 text-red-700 px-3 py-2 text-sm">
                  <div className="flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 mt-0.5">
                      <path fillRule="evenodd" d="M18 10A8 8 0 112 10a8 8 0 0116 0zM9 7a1 1 0 012 0v4a1 1 0 11-2 0V7zm2 6a1 1 0 10-2 0 1 1 0 002 0z" clipRule="evenodd" />
                    </svg>
                    <span>{status}</span>
                  </div>
                </div>
              )}

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs opacity-70 flex items-center gap-1" title="Enter your full name">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                      <path d="M10 12a5 5 0 100-10 5 5 0 000 10z" /><path fillRule="evenodd" d="M.458 16.042A8 8 0 0110 12a8 8 0 019.542 4.042.75.75 0 01-.666 1.041H1.124a.75.75 0 01-.666-1.041z" clipRule="evenodd" />
                    </svg>
                    Your Name
                  </label>
                  <input
                    className={`mt-1 w-full rounded border px-3 py-2 ${name && !validName ? "border-red-400" : ""}`}
                    placeholder="e.g., Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    aria-invalid={!!(name && !validName)}
                  />
                  {name && !validName && (
                    <div className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 7a1 1 0 012 0v4a1 1 0 11-2 0V7zm2 6a1 1 0 10-2 0 1 1 0 002 0z" clipRule="evenodd" /></svg>
                      Enter at least 2 characters.
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs opacity-70 flex items-center gap-1" title="We’ll send your ticket to this email">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                      <path d="M2.94 6.34A2 2 0 014.5 5h11a2 2 0 011.56.66L10 11.5 2.94 6.34z" /><path d="M18 8.5l-8 6-8-6V15a2 2 0 002 2h12a2 2 0 002-2V8.5z" />
                    </svg>
                    Email
                  </label>
                  <input
                    className={`mt-1 w-full rounded border px-3 py-2 ${email && !validEmail ? "border-red-400" : ""}`}
                    placeholder="you@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={!!(email && !validEmail)}
                  />
                  {email && !validEmail && (
                    <div className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 7a1 1 0 012 0v4a1 1 0 11-2 0V7zm2 6a1 1 0 10-2 0 1 1 0 002 0z" clipRule="evenodd" /></svg>
                      Enter a valid email address.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label className="text-xs opacity-70 flex items-center gap-1" title="Select how many tickets you want">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3"><path d="M6 10a2 2 0 012-2h4a2 2 0 012 2v5H6v-5z" /><path d="M4 7a2 2 0 012-2h8a2 2 0 012 2v1H4V7z" /></svg>
                  Tickets
                </label>
                <div className="mt-1 flex flex-wrap items-center gap-4 justify-between">
                  <div className="inline-flex items-center gap-2">
                    <button type="button" onClick={decTickets} className="h-9 w-9 rounded border bg-white dark:bg-gray-700 dark:border-white/10 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600" aria-label="Decrease tickets">−</button>
                    <input
                      className="w-20 text-center rounded border px-3 py-2 dark:bg-gray-700 dark:border-white/10 dark:text-gray-200"
                      placeholder="1"
                      type="number"
                      min={1}
                      value={tickets}
                      onChange={(e) => setTickets(Math.max(1, Number(e.target.value) || 1))}
                      aria-describedby="ticket-help"
                    />
                    <button type="button" onClick={incTickets} className="h-9 w-9 rounded border bg-white dark:bg-gray-700 dark:border-white/10 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600" aria-label="Increase tickets">+</button>
                  </div>

                  {/* Price + Subtotal */}
                  <div className="flex items-center gap-6">
                    <div className="text-sm"><span className="opacity-70">Price:</span> <span className="font-medium">₹{pricePerTicket}</span></div>
                    <div className="text-sm"><span className="opacity-70">Subtotal:</span> <span className="font-semibold">₹{subtotal}</span></div>
                  </div>
                </div>
                <div id="ticket-help" className="text-[11px] opacity-70 mt-1">Minimum 1 ticket.</div>
              </div>

              <div className="mt-4">
                <label className="text-xs opacity-70 flex items-center gap-1" title="Add any special requests or information">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3"><path d="M4 3a2 2 0 00-2 2v9.5A2.5 2.5 0 004.5 17H16a2 2 0 002-2V7l-5-4H4z" /></svg>
                  Note (optional)
                </label>
                <textarea
                  className="mt-1 w-full rounded border px-3 py-2"
                  placeholder="Any special requests or information"
                  rows={4}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <ButtonLoader
                loading={submitting}
                disabled={!canSubmit}
                type="submit"
                variant="secondary"
                loadingText="Booking..."
                className="mt-6 w-full"
                title={!canSubmit ? "Fill required details to proceed" : "Confirm your booking"}
              >
                Confirm Booking
              </ButtonLoader>

              <div className="text-[11px] opacity-70 mt-3 text-center">By booking, you agree to our terms and policies.</div>
            </form>

            {/* Loading skeleton for event */}
            {loadingEvent && (
              <div className="mt-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="mt-2 h-4 bg-gray-200 rounded w-1/2" />
              </div>
            )}

            {/* Secondary actions */}
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
              <Link href={`/events/${eventId}`} className="text-xs underline">Back to event</Link>
               <span className="hidden sm:inline text-xs opacity-50">•</span>
              <Link href="/events" className="text-xs underline">Explore more events</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}