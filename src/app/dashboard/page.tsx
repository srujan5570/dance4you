"use client";

import { useEffect, useMemo, useState } from "react";

export default function DashboardPage() {
  const [session, setSession] = useState<{ authenticated: boolean; user?: { id?: string; email?: string; name?: string; role?: string } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Array<{ id: string; eventId: string; name: string; email: string; tickets: number; note?: string; createdAt: string; status?: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  // New state for account management
  const [ownerEvents, setOwnerEvents] = useState<Array<{ id: string; title: string; city: string; date: string; style: string; image: string; createdAt: string }>>([]);
  const [ownerBookings, setOwnerBookings] = useState<Array<{ id: string; eventId: string; name: string; email: string; tickets: number; note?: string; createdAt: string; status?: string; event?: { title: string; date: string; city: string } }>>([]);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);
  // Add filters
  const [bookingsFilter, setBookingsFilter] = useState<"ALL" | "ACTIVE" | "CANCELLED">("ALL");
  const [ownerBookingsFilter, setOwnerBookingsFilter] = useState<"ALL" | "ACTIVE" | "CANCELLED">("ALL");
  const filteredBookings = useMemo(() => {
    if (bookingsFilter === "ALL") return bookings;
    if (bookingsFilter === "ACTIVE") return bookings.filter((b) => b.status !== "CANCELLED");
    return bookings.filter((b) => b.status === "CANCELLED");
  }, [bookings, bookingsFilter]);
  const filteredOwnerBookings = useMemo(() => {
    if (ownerBookingsFilter === "ALL") return ownerBookings;
    if (ownerBookingsFilter === "ACTIVE") return ownerBookings.filter((b) => b.status !== "CANCELLED");
    return ownerBookings.filter((b) => b.status === "CANCELLED");
  }, [ownerBookings, ownerBookingsFilter]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/session", { cache: "no-store" });
        const data = await res.json();
        setSession(data);
        // Fetch profile details when authenticated
        if (data?.authenticated) {
          const p = await fetch("/api/profile", { cache: "no-store" });
          if (p.ok) {
            const u = await p.json();
            setProfileName(u?.name || "");
            setProfileEmail(u?.email || "");
          }
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/bookings", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setBookings(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        setError("Failed to load bookings");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (session?.user?.role === "STUDIO_OWNER") {
        const res = await fetch("/api/owner/events", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setOwnerEvents(Array.isArray(data) ? data : []);
        }
        const ob = await fetch("/api/owner/bookings", { cache: "no-store" });
        if (ob.ok) {
          const d = await ob.json();
          setOwnerBookings(Array.isArray(d) ? d : []);
        }
      }
    })();
  }, [session?.user?.role]);

  // Handlers
  async function handleLogout() {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        window.location.href = "/";
      }
    } catch {}
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg(null);
    setProfileSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profileName, email: profileEmail }),
      });
      if (res.ok) {
        setProfileMsg("Profile updated");
      } else {
        const j = await res.json();
        setProfileMsg(j?.error || "Failed to update profile");
      }
    } catch {
      setProfileMsg("Network error");
    } finally {
      setProfileSaving(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdMsg(null);
    setPwdSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        setPwdMsg("Password changed");
        setCurrentPassword("");
        setNewPassword("");
      } else {
        const j = await res.json();
        setPwdMsg(j?.error || "Failed to change password");
      }
    } catch {
      setPwdMsg("Network error");
    } finally {
      setPwdSaving(false);
    }
  }

  async function cancelBooking(id: string) {
    if (!confirm("Cancel this booking?")) return;
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
      if (res.ok) {
        // Soft-cancel in UI: mark status as CANCELLED
        setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "CANCELLED" } : b)));
      }
    } catch {}
  }

  async function deleteEvent(id: string) {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (res.ok) {
        setOwnerEvents((prev) => prev.filter((e) => e.id !== id));
      } else {
        const j = await res.json();
        alert(j?.error || "Failed to delete event");
      }
    } catch {}
  }
  const isAuthed = useMemo(() => !!session?.authenticated, [session]);

  return (
    <main className="min-h-screen bg-background text-foreground font-sans">
      {/* Banner */}
      <div className="w-full bg-gradient-to-b from-black via-orange-700 to-orange-400 text-white">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-wide">Your Dashboard</h1>
          <p className="mt-1 text-sm sm:text-base opacity-95">Manage your account, bookings, and events.</p>
        </div>
      </div>

      <section className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Profile card */}
        <aside>
          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
            <div className="p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-black/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 opacity-70"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-3.33 0-10 1.67-10 5v1h20v-1c0-3.33-6.67-5-10-5Z" /></svg>
                </div>
                <div>
                  <div className="font-semibold text-sm">{session?.user?.name || session?.user?.email || "Guest"}</div>
                  <div className="text-xs opacity-70">Role: {session?.user?.role || "—"}</div>
                </div>
              </div>
              {!isAuthed && (
                <div className="mt-3 rounded bg-[#fff7ed] text-[#9a3412] px-3 py-2 text-xs">
                  Please <a href="/auth/login" className="underline">log in</a> or <a href="/auth/register" className="underline">register</a> to view your dashboard.
                </div>
              )}
              {isAuthed && (
                <div className="mt-4 flex flex-wrap gap-3 text-xs">
                  <a href="/submit-event" className="underline">Submit an event</a>
                  <a href="/events" className="underline">Browse events</a>
                  <a href="/" className="underline">Home</a>
                  <button onClick={handleLogout} className="ml-auto bg-black text-white px-3 py-1 rounded hover:opacity-90">Log out</button>
                </div>
              )}
            </div>
          </div>

          {/* Edit Profile */}
          {isAuthed && (
            <div className="mt-6 rounded-2xl border bg-white shadow-sm overflow-hidden">
              <div className="p-5">
                <h3 className="font-semibold text-sm">Edit Profile</h3>
                <form onSubmit={saveProfile} className="mt-3 space-y-3">
                  <div>
                    <label className="text-xs opacity-70">Name</label>
                    <input value={profileName} onChange={(e) => setProfileName(e.target.value)} className="mt-1 w-full border rounded px-2 py-1 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs opacity-70">Email</label>
                    <input value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} type="email" className="mt-1 w-full border rounded px-2 py-1 text-sm" />
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <button disabled={profileSaving} className="bg-black text-white px-3 py-1 rounded hover:opacity-90 disabled:opacity-50">Save</button>
                    {profileMsg && <span className="opacity-80">{profileMsg}</span>}
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Change Password */}
          {isAuthed && (
            <div className="mt-6 rounded-2xl border bg-white shadow-sm overflow-hidden">
              <div className="p-5">
                <h3 className="font-semibold text-sm">Change Password</h3>
                <form onSubmit={savePassword} className="mt-3 space-y-3">
                  <div>
                    <label className="text-xs opacity-70">Current password</label>
                    <input value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} type="password" className="mt-1 w-full border rounded px-2 py-1 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs opacity-70">New password</label>
                    <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" className="mt-1 w-full border rounded px-2 py-1 text-sm" />
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <button disabled={pwdSaving} className="bg-black text-white px-3 py-1 rounded hover:opacity-90 disabled:opacity-50">Change</button>
                    {pwdMsg && <span className="opacity-80">{pwdMsg}</span>}
                  </div>
                </form>
              </div>
            </div>
          )}
        </aside>

        {/* Right: Bookings list */}
        <div className="md:col-span-2">
          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-sm">Your Bookings</h2>
                {/* Filters for user bookings */}
                <div className="flex items-center gap-2 text-[11px]">
                  <button aria-pressed={bookingsFilter === "ALL"} onClick={() => setBookingsFilter("ALL")} className={`px-2 py-0.5 rounded border ${bookingsFilter === "ALL" ? "bg-black text-white border-black" : "bg-white text-black"}`}>All</button>
                  <button aria-pressed={bookingsFilter === "ACTIVE"} onClick={() => setBookingsFilter("ACTIVE")} className={`px-2 py-0.5 rounded border ${bookingsFilter === "ACTIVE" ? "bg-black text-white border-black" : "bg-white text-black"}`}>Active</button>
                  <button aria-pressed={bookingsFilter === "CANCELLED"} onClick={() => setBookingsFilter("CANCELLED")} className={`px-2 py-0.5 rounded border ${bookingsFilter === "CANCELLED" ? "bg-black text-white border-black" : "bg-white text-black"}`}>Cancelled</button>
                </div>
              </div>

              {loading ? (
                <div className="mt-4 text-sm opacity-70">Loading…</div>
              ) : error ? (
                <div className="mt-4 text-sm text-red-600">{error}</div>
              ) : filteredBookings.length === 0 ? (
                <div className="mt-4 text-sm opacity-70">No bookings yet.</div>
              ) : (
                <ul className="mt-4 divide-y">
                  {filteredBookings.map((b) => (
                    <li key={b.id} className="py-3 text-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Tickets: {b.tickets}</div>
                          <div className="text-xs opacity-70">Booked by {b.name} ({b.email})</div>
                          <div className="text-xs opacity-70">Ref: <span className="font-mono">{b.id}</span></div>
                          <span className={`inline-flex items-center text-[11px] mt-1 px-2 py-0.5 rounded ${b.status === "CANCELLED" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                            {b.status === "CANCELLED" ? "Cancelled" : "Active"}
                          </span>
                        </div>
                        <div className="text-xs opacity-70">{new Date(b.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-xs">
                        <a href={`/events/${b.eventId}`} className="underline">View event</a>
                        {b.status !== "CANCELLED" && (
                          <button onClick={() => cancelBooking(b.id)} className="text-red-600 hover:underline">Cancel booking</button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Owner tools */}
          {session?.user?.role === "STUDIO_OWNER" && (
            <div className="mt-6 rounded-2xl border bg-white shadow-sm overflow-hidden">
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-sm">Studio Owner Tools</h2>
                </div>
                <div className="mt-3 text-xs opacity-80">Submit and manage your events.</div>
                <div className="mt-3 flex items-center gap-3 text-xs">
                  <a href="/submit-event" className="underline">Submit event</a>
                </div>
                <div className="mt-4">
                  {ownerEvents.length === 0 ? (
                    <div className="text-xs opacity-70">No submitted events yet.</div>
                  ) : (
                    <ul className="divide-y">
                      {ownerEvents.map((ev) => (
                        <li key={ev.id} className="py-3 text-sm">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{ev.title}</div>
                              <div className="text-xs opacity-70">{ev.city} • {ev.date} • {ev.style}</div>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                              <a href={`/events/${ev.id}`} className="underline">View</a>
                              <button onClick={() => deleteEvent(ev.id)} className="text-red-600 hover:underline">Delete</button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Owner bookings */}
                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Event Bookings</h3>
                    {/* Filters for owner bookings */}
                    <div className="flex items-center gap-2 text-[11px]">
                      <button aria-pressed={ownerBookingsFilter === "ALL"} onClick={() => setOwnerBookingsFilter("ALL")} className={`px-2 py-0.5 rounded border ${ownerBookingsFilter === "ALL" ? "bg-black text-white border-black" : "bg-white text-black"}`}>All</button>
                      <button aria-pressed={ownerBookingsFilter === "ACTIVE"} onClick={() => setOwnerBookingsFilter("ACTIVE")} className={`px-2 py-0.5 rounded border ${ownerBookingsFilter === "ACTIVE" ? "bg-black text-white border-black" : "bg-white text-black"}`}>Active</button>
                      <button aria-pressed={ownerBookingsFilter === "CANCELLED"} onClick={() => setOwnerBookingsFilter("CANCELLED")} className={`px-2 py-0.5 rounded border ${ownerBookingsFilter === "CANCELLED" ? "bg-black text-white border-black" : "bg-white text-black"}`}>Cancelled</button>
                    </div>
                  </div>
                  {filteredOwnerBookings.length === 0 ? (
                    <div className="text-xs opacity-70 mt-2">No bookings yet.</div>
                  ) : (
                    <ul className="divide-y mt-2">
                      {filteredOwnerBookings.map((ob) => (
                        <li key={ob.id} className="py-3 text-sm">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{ob.event?.title} • Tickets: {ob.tickets}</div>
                              <div className="text-xs opacity-70">{ob.name} ({ob.email}) • {ob.event?.city} • {ob.event?.date}</div>
                              <div className="text-xs opacity-70">Ref: <span className="font-mono">{ob.id}</span></div>
                              <span className={`inline-flex items-center text-[11px] mt-1 px-2 py-0.5 rounded ${ob.status === "CANCELLED" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                                {ob.status === "CANCELLED" ? "Cancelled" : "Active"}
                              </span>
                            </div>
                            <div className="text-xs opacity-70">{new Date(ob.createdAt).toLocaleString()}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}