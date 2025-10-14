"use client"

import { useMemo, useState, useEffect } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
// removed leaflet/react-leaflet imports to avoid SSR issues; MapPicker loads them client-side

export default function SubmitEventPage() {
  const [title, setTitle] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [country, setCountry] = useState("")
  const [date, setDate] = useState("")
  const [style, setStyle] = useState<string>("General")
  const [image, setImage] = useState("")
  const [description, setDescription] = useState("")
  // Contact fields (collected but not publicly shown)
  const [contactPhone, setContactPhone] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [venueAddress, setVenueAddress] = useState("")
  const [venueMapUrl, setVenueMapUrl] = useState("")
  const [contactNotes, setContactNotes] = useState("")
  // Precise location coordinates (optional)
  const [locationLat, setLocationLat] = useState<string>("17.3850")
  const [locationLng, setLocationLng] = useState<string>("78.4867")
  // Category and timing
  type Category = "DROP_IN_CLASS" | "DANCE_WORKSHOP" | "REGULAR_CLASS" | "BATTLE_COMPETITION"
  const [category, setCategory] = useState<Category>("DROP_IN_CLASS")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [venueName, setVenueName] = useState("")
  // Add per-category fields
  const [fee, setFee] = useState("")
  const [instructor, setInstructor] = useState("")
  const [recurrence, setRecurrence] = useState("")
  const [battleRules, setBattleRules] = useState("")
  const [prizes, setPrizes] = useState("")
  // Poster gallery
  const [posterUrls, setPosterUrls] = useState<string[]>([])
  const [posterUrlInput, setPosterUrlInput] = useState("")
  const [step, setStep] = useState<number>(1)
  const [uploading, setUploading] = useState(false)
  async function handlePosterUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    try {
      setUploading(true)
      const form = new FormData()
      Array.from(files).forEach((f) => form.append("files", f))
      const res = await fetch("/api/upload", { method: "POST", body: form })
      const data = await res.json()
      if (res.ok && Array.isArray(data.urls)) {
        setPosterUrls((prev) => [...prev, ...data.urls])
      } else {
        setStatus((data && data.error) || "Upload failed")
      }
    } catch {
      setStatus("Upload failed")
    } finally {
      setUploading(false)
    }
  }

  // Client-only map state
  const [isClient, setIsClient] = useState(false)
  const [mapCenter, setMapCenter] = useState<[number, number]>([17.3850, 78.4867])
  useEffect(() => {
    setIsClient(true)
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          setMapCenter([lat, lng])
          setLocationLat(String(lat))
          setLocationLng(String(lng))
        },
        () => {}
      )
    }
  }, [])
  useEffect(() => {
    const lat = parseFloat(locationLat)
    const lng = parseFloat(locationLng)
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      setMapCenter([lat, lng])
    }
  }, [locationLat, locationLng])

  // Preselect category from URL query
  const searchParams = useSearchParams()
  useEffect(() => {
    const cat = searchParams?.get("category")
    const allowed = ["DROP_IN_CLASS", "DANCE_WORKSHOP", "REGULAR_CLASS", "BATTLE_COMPETITION"]
    if (cat && allowed.includes(cat)) {
      setCategory(cat as Category)
    }
  }, [searchParams])

  // Dynamically import client-only MapPicker (react-leaflet)
  const MapPicker = dynamic(() => import("@/components/MapPicker"), { ssr: false })

  // Search & pin state (Nominatim)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<{ display_name: string; lat: string; lon: string }[]>([])
  const [searching, setSearching] = useState(false)
  async function searchPlaces() {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }
    try {
      setSearching(true)
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=8`,
        { headers: { Accept: "application/json" } }
      )
      const data = await res.json()
      setSearchResults(Array.isArray(data) ? data.slice(0, 8) : [])
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  // Map click handled within MapPicker component
  const [status, setStatus] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [session, setSession] = useState<{ authenticated: boolean; user?: { role?: string; id?: string } } | null>(null)
  const [studioProfile, setStudioProfile] = useState<{ name?: string } | null>(null)
  const [sessionChecked, setSessionChecked] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/session", { cache: "no-store" })
        const data = await res.json()
        setSession(data)
        if (data?.authenticated && data?.user?.role === "STUDIO_OWNER") {
          const sp = await fetch("/api/studio-profile", { cache: "no-store" })
          if (sp.ok) {
            const profile = await sp.json()
            setStudioProfile(profile)
          } else {
            setStudioProfile(null)
          }
        } else {
          setStudioProfile(null)
        }
      } catch {}
      finally {
        setSessionChecked(true)
      }
    })()
  }, [])

  const validTitle = useMemo(() => title.trim().length >= 3, [title])
  const validCity = useMemo(() => city.trim().length >= 2, [city])
  const validState = useMemo(() => state.trim().length >= 2, [state])
  const validCountry = useMemo(() => country.trim().length >= 2, [country])
  const validDate = useMemo(() => !!date, [date])
  // Style is optional in UI; default to a generic value
  const validStyle = useMemo(() => typeof style === "string" && style.trim().length > 0, [style])
  const validCoords = useMemo(() => {
    const latNum = parseFloat(locationLat)
    const lngNum = parseFloat(locationLng)
    return !Number.isNaN(latNum) && !Number.isNaN(lngNum)
  }, [locationLat, locationLng])
  const validStartTime = useMemo(() => /^\d{2}:\d{2}$/.test(startTime), [startTime])
  // Per-category validations
  const validInstructor = useMemo(() => category !== "DANCE_WORKSHOP" || instructor.trim().length >= 2, [category, instructor])
  const validFee = useMemo(() => category !== "DANCE_WORKSHOP" || fee.trim().length >= 1, [category, fee])
  const validRecurrence = useMemo(() => category !== "REGULAR_CLASS" || recurrence.trim().length >= 3, [category, recurrence])
  const validBattleRules = useMemo(() => category !== "BATTLE_COMPETITION" || battleRules.trim().length >= 3, [category, battleRules])
  const validPrizes = useMemo(() => category !== "BATTLE_COMPETITION" || prizes.trim().length >= 2, [category, prizes])
  // Wizard step gating
  const canStep1 = useMemo(() => validTitle && validDate && validCity, [validTitle, validDate, validCity])
  const canStep2 = useMemo(() => validCity && validState && validCoords, [validCity, validState, validCoords])
  const canStep3 = true
  const canStep4 = useMemo(() => (
    (category !== "DANCE_WORKSHOP" || (validInstructor && validFee)) &&
    (category !== "REGULAR_CLASS" || validRecurrence) &&
    (category !== "BATTLE_COMPETITION" || (validBattleRules && validPrizes))
  ), [category, validInstructor, validFee, validRecurrence, validBattleRules, validPrizes])
  // Error summary
  const errors = useMemo(() => {
    const out: string[] = []
    if (!validTitle) out.push("Title must be at least 3 characters")
    if (!validCity) out.push("City must be at least 2 characters")
    // state optional for now
    if (!validDate) out.push("Date is required")
    // style no longer required from user; default is applied
    if (!validState) out.push("State is required")
    if (!validCountry) out.push("Country is required")
    if (!validCoords) out.push("Valid map coordinates required")
    if (!validStartTime) out.push("Start time must be HH:MM")
    if (!validInstructor) out.push("Instructor is required for workshops")
    if (!validFee) out.push("Fee is required for workshops")
    if (!validRecurrence) out.push("Recurring schedule required for regular classes")
    if (!validBattleRules) out.push("Rules required for battles")
    if (!validPrizes) out.push("Prizes required for battles")
    if (!(session?.authenticated)) out.push("Please log in")
    if (session?.user?.role !== "STUDIO_OWNER") out.push("Role must be Studio Owner")
    if (!studioProfile) out.push("Studio profile required")
    return out
  }, [validTitle, validCity, validDate, validStyle, validCoords, validStartTime, validInstructor, validFee, validRecurrence, validBattleRules, validPrizes, session?.authenticated, session?.user?.role, studioProfile])
  const canSubmit = useMemo(
    () =>
      validTitle &&
      validCity &&
      validDate &&
      validCoords &&
      validStartTime &&
      validInstructor &&
      validFee &&
      validRecurrence &&
      validBattleRules &&
      validPrizes &&
      session?.authenticated &&
      session?.user?.role === "STUDIO_OWNER" &&
      !!studioProfile &&
      validState &&
      validCountry,
    [validTitle, validCity, validDate, validCoords, validStartTime, validInstructor, validFee, validRecurrence, validBattleRules, validPrizes, session?.authenticated, session?.user?.role, studioProfile, validState, validCountry]
  )

  async function submit() {
    setStatus(null)
    setSubmitting(true)
    setCreatedId(null)
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          city,
          state,
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
          // New rich fields
          category,
          startTime,
          endTime,
          venueName,
          posterUrls,
          fee,
          instructor,
          recurrence,
          battleRules,
          prizes,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to submit" }))
        setStatus(err.error || "Failed to submit")
        return
      }
      const item = await res.json()
      setStatus("Event submitted successfully")
      setCreatedId(item?.id || null)
      setTitle("")
      setCity("")
      setDate("")
      setStyle("General")
      setImage("")
      setDescription("")
      setContactPhone("")
      setContactEmail("")
      setVenueAddress("")
      setVenueMapUrl("")
      setContactNotes("")
      setLocationLat("")
      setLocationLng("")
      setCategory("DROP_IN_CLASS")
      setStartTime("")
      setEndTime("")
      setVenueName("")
      setPosterUrls([])
    } catch {
      setStatus("Failed to submit")
    } finally {
      setSubmitting(false)
    }
  }

  const previewImage = (posterUrls[0] && posterUrls[0].trim()) ? posterUrls[0] : (image || "/hero-placeholder.svg")

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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {/* Form card */}
          <div className="md:col-span-2">
            <div className="md:flex md:flex-row md:items-start md:gap-6">
              <div className="rounded-3xl border border-black/10 bg-white/80 backdrop-blur-md shadow-xl md:flex-1">
                <div className="px-5 py-4 border-b border-black/10 backdrop-blur-xl flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Event details</h3>
                  <p className="text-xs opacity-70">Provide the core information for your event. Fields marked with * are required.</p>
                  {!session?.authenticated && (
                    <div className="mt-2 rounded border border-yellow-300 bg-yellow-50 text-yellow-700 px-3 py-2 text-xs">
                      Please <Link href="/auth/login" className="underline">log in</Link> or <Link href="/auth/register" className="underline">register</Link> as a Studio Owner to submit events.
                    </div>
                  )}
                  {session?.authenticated && session?.user?.role !== "STUDIO_OWNER" && (
                    <div className="mt-2 rounded border border-red-300 bg-red-50 text-red-700 px-3 py-2 text-xs">
                      You must be a Studio Owner to submit events. Current role: {session?.user?.role || "Unknown"}.
                    </div>
                  )}
                 {session?.authenticated && session?.user?.role === "STUDIO_OWNER" && !studioProfile && (
                    <div className="mt-2 rounded border border-blue-300 bg-blue-50 text-blue-700 px-3 py-2 text-xs">
                      Studio profile required. Please <Link href="/studio/setup" className="underline">complete your studio details</Link> before listing events.
                    </div>
                  )}
                </div>
                <div className="hidden sm:flex items-center gap-2 text-xs opacity-70">
                  <span className="inline-flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path d="M4 3a2 2 0 00-2 2v9.5A2.5 2.5 0 004.5 17H16a2 2 0 002-2V7l-5-4H4z" /></svg> Draft safe</span>
                  <span className="inline-flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path d="M10 18a8 8 0 100-16 8 8 0 000-16z" /></svg> Secure</span>
                </div>
              </div>
              <div className="p-5 space-y-5">
                {/* Wizard steps indicator */}
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  {["Basics", "Location", "Media", "Details", "Review"].map((label, i) => {
                    const idx = i + 1
                    const active = step === idx
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setStep(idx)}
                        className={`px-3 py-1 rounded-full text-[11px] transition-transform transform hover:-translate-y-0.5 active:translate-y-0 ${active ? "bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white" : "border border-black/10 bg-white/60"}`}
                      >
                        {idx}. {label}
                      </button>
                    )
                  })}
                </div>

                {/* Step 1: Basics */}
                <div className={step === 1 ? "" : "hidden"}>
                {/* Title */}
                <div>
                  <label className="text-xs opacity-70 flex items-center gap-1" title="Enter a clear event title (min 3 characters)">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3"><path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v1H2V6zm0 3h16v5a2 2 0 01-2 2H4a2 2 0 01-2-2V9z" /></svg>
                    Title*
                  </label>
                  <input
                    className={`mt-1 w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition ${title && !validTitle ? "border-red-400" : ""}`}
                    placeholder="e.g., Bollywood Night"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    aria-invalid={!!(title && !validTitle)}
                  />
                  {title && !validTitle && (
                    <div className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16z" clipRule="evenodd" /></svg>
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
                      className={`mt-1 w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition ${city && !validCity ? "border-red-400" : ""}`}
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
                      className={`mt-1 w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition ${!validDate && date ? "border-red-400" : ""}`}
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      aria-invalid={!!(!validDate && date)}
                    />
                  </div>
                </div>
                {/* State */}
                <div>
                  <label className="text-xs opacity-70 flex items-center gap-1" title="State (optional)">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3"><path d="M4 3a2 2 0 00-2 2v9.5A2.5 2.5 0 004.5 17H16a2 2 0 002-2V7l-5-4H4z" /></svg>
                    State (optional)
                  </label>
                  <input
                    className="mt-1 w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                    placeholder="e.g., Telangana"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </div>

                {/* Style removed from Basics; using a default generic value */}
                {/* Step 1 nav */}
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setStep(2)} disabled={!canStep1} className="rounded-xl bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white px-4 py-2 text-sm font-semibold shadow-lg disabled:opacity-60">Continue</button>
                </div>
                </div>

                {/* Step 3: Media & Description */}
                <div className={step === 3 ? "" : "hidden"}>
                {/* Image URL */}
                <div>
                  <label className="text-xs opacity-70 flex items-center gap-1" title="Optional image URL for the event poster (SVG recommended)">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3"><path d="M4 3a2 2 0 00-2 2v9.5A2.5 2.5 0 004.5 17H16a2 2 0 002-2V7l-5-4H4z" /></svg>
                    Image URL (optional)
                  </label>
                  <input
                    className="mt-1 w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition"
                    placeholder="https://example.com/your-image.svg"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                  />
                  <div className="text-[11px] opacity-70 mt-1">If omitted, we&apos;ll use a placeholder.</div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs opacity-70 flex items-center gap-1" title="Optional details or notes">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3"><path d="M4 3a2 2 0 00-2 2v9.5A2.5 2.5 0 004.5 17H16a2 2 0 002-2V7l-5-4H4z" /></svg>
                    Description (optional)
                  </label>
                  <textarea
                    className="mt-1 w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                    placeholder="Describe your event…"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* Posters */}
                <div>
                  <label className="text-xs opacity-70 flex items-center gap-1" title="Upload poster images (PNG, JPG, WEBP, SVG)">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3"><path d="M4 3a2 2 0 00-2 2v9.5A2.5 2.5 0 004.5 17H16a2 2 0 002-2V7l-5-4H4z" /></svg>
                    Posters
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handlePosterUpload(e.target.files)}
                    className="mt-1 w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition"
                  />
                  <div className="text-[11px] opacity-70 mt-1">You can upload multiple images. Max size 10MB each.</div>
                  {uploading && <div className="text-[11px] text-blue-600 mt-1">Uploading…</div>}
                  {posterUrls.length > 0 && (
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {posterUrls.map((u, idx) => (
                        <div key={u + idx} className="relative">
                          <img src={u} alt={"Poster " + (idx + 1)} className="w-full aspect-[4/3] object-cover rounded-lg border border-black/10" />
                          <button
                            type="button"
                            className="absolute top-1 right-1 text-xs bg-red-600 text-white rounded px-2 py-0.5"
                            onClick={() => setPosterUrls((prev) => prev.filter((x) => x !== u))}
                            title="Remove"
                          >Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Step 3 nav */}
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setStep(2)} className="rounded-xl border border-black/10 bg-white/60 px-4 py-2 text-sm">Back</button>
                  <button type="button" onClick={() => setStep(4)} className="rounded-xl bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white px-4 py-2 text-sm font-semibold shadow-lg">Continue</button>
                </div>
                </div>

                {/* Step 4: Details */}
                <div className={step === 4 ? "" : "hidden"}>
                {/* Category & Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs opacity-70 flex items-center gap-1" title="Select category">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3"><path d="M4 6h12v2H4zm0 4h12v2H4zm0 4h12v2H4z" /></svg>
                      Category*
                    </label>
                    <select
                      className="mt-1 w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                    >
                      <option value="DROP_IN_CLASS">Drop-In Class</option>
                      <option value="DANCE_WORKSHOP">Dance Workshop</option>
                      <option value="REGULAR_CLASS">Regular Class</option>
                      <option value="BATTLE_COMPETITION">Battle/Competition</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs opacity-70 flex items-center gap-1" title="Start time (HH:MM)">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3"><path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1z" /><path d="M18 8H2v7a2 2 0 002 2h12a2 2 0 002-2V8z" /></svg>
                      Start Time*
                    </label>
                    <input
                      className={`mt-1 w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition ${startTime && !validStartTime ? "border-red-400" : ""}`}
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                    {startTime && !validStartTime && (
                      <div className="text-[11px] text-red-600 mt-1">Enter time as HH:MM.</div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-xs opacity-70 flex items-center gap-1" title="End time (HH:MM optional)">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3"><path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1z" /><path d="M18 8H2v7a2 2 0 002 2h12a2 2 0 002-2V8z" /></svg>
                    End Time (optional)
                  </label>
                  <input
                    className="mt-1 w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>

                {/* Conditional fields by category */}
                <div className="mt-2 space-y-3">
                  {category === "DANCE_WORKSHOP" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs opacity-70 flex items-center gap-1">Instructor</label>
                        <input className="mt-1 w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition" value={instructor} onChange={(e) => setInstructor(e.target.value)} placeholder="Instructor name" />
                        {!validInstructor && (
                          <div className="text-[11px] text-red-600 mt-1">Instructor is required for workshops.</div>
                        )}
                      </div>
                      <div>
                        <label className="text-xs opacity-70 flex items-center gap-1">Fee</label>
                        <input className="mt-1 w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition" value={fee} onChange={(e) => setFee(e.target.value)} placeholder="e.g., ₹500" />
                        {!validFee && (
                          <div className="text-[11px] text-red-600 mt-1">Fee is required for workshops.</div>
                        )}
                      </div>
                    </div>
                  )}
                  {category === "REGULAR_CLASS" && (
                    <div>
                      <label className="text-xs opacity-70 flex items-center gap-1">Recurring Schedule</label>
                      <input className="mt-1 w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition" value={recurrence} onChange={(e) => setRecurrence(e.target.value)} placeholder="e.g., Every Tue & Thu" />
                      {!validRecurrence && (
                        <div className="text-[11px] text-red-600 mt-1">Recurring schedule required.</div>
                      )}
                    </div>
                  )}
                  {category === "BATTLE_COMPETITION" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs opacity-70 flex items-center gap-1">Rules</label>
                        <input className="mt-1 w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition" value={battleRules} onChange={(e) => setBattleRules(e.target.value)} placeholder="Rules summary" />
                        {!validBattleRules && (
                          <div className="text-[11px] text-red-600 mt-1">Rules are required for battles.</div>
                        )}
                      </div>
                      <div>
                        <label className="text-xs opacity-70 flex items-center gap-1">Prizes</label>
                        <input className="mt-1 w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition" value={prizes} onChange={(e) => setPrizes(e.target.value)} placeholder="Prizes summary" />
                        {!validPrizes && (
                          <div className="text-[11px] text-red-600 mt-1">Prizes are required for battles.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {/* Step 4 nav */}
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setStep(3)} className="rounded-xl border border-black/10 bg-white/60 px-4 py-2 text-sm">Back</button>
                  <button type="button" onClick={() => setStep(5)} disabled={!canStep4} className="rounded-xl bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white px-4 py-2 text-sm font-semibold shadow-lg disabled:opacity-60">Continue</button>
                </div>
                </div>

                {/* Step 2: Location */}
                <div className={step === 2 ? "" : "hidden"}>
                {/* Location coordinates */}
                <div>
                  <label className="text-xs opacity-70 flex items-center gap-1" title="Precise latitude and longitude (required)">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3"><path d="M10 2a6 6 0 00-6 6c0 4.418 6 10 6 10s6-5.582 6-10a6 6 0 00-6-6zm0 8a2 2 0 110-4 2 2 0 010 4z" /></svg>
                    Precise map location*
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      className={`mt-1 w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition ${!validCoords ? "border-red-400" : ""}`}
                      placeholder="Latitude (e.g., 17.3850)"
                      value={locationLat}
                      onChange={(e) => setLocationLat(e.target.value)}
                      inputMode="decimal"
                      aria-invalid={!validCoords}
                    />
                    <input
                      className={`mt-1 w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition ${!validCoords ? "border-red-400" : ""}`}
                      placeholder="Longitude (e.g., 78.4867)"
                      value={locationLng}
                      onChange={(e) => setLocationLng(e.target.value)}
                      inputMode="decimal"
                      aria-invalid={!validCoords}
                    />
                  </div>
                  {!validCoords && (
                    <div className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16z" clipRule="evenodd" /></svg>
                      Please pick a location on the map or enter valid latitude and longitude.
                    </div>
                  )}
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-6 gap-2">
                    <input
                      className="sm:col-span-4 rounded-xl border border-black/10 bg-white/60 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition"
                      placeholder="Search place or address (e.g., Charminar Hyderabad)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); searchPlaces(); } }}
                    />
                    <button
                      className="sm:col-span-2 rounded-xl bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white py-2 text-sm font-semibold shadow-lg hover:from-orange-600 hover:via-pink-600 hover:to-purple-700 transition-transform transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60"
                      type="button"
                      onClick={searchPlaces}
                      disabled={searching}
                    >
                      {searching ? "Searching…" : "Search & Pin"}
                    </button>
                  </div>
                  {searchResults.length > 0 && (
                    <div className="mt-2 rounded-2xl border border-black/10 bg-white/80 backdrop-blur-md shadow-lg text-sm overflow-hidden">
                      {searchResults.map((r, idx) => (
                        <button
                          key={`${r.lat}-${r.lon}-${idx}`}
                          type="button"
                          className="block w-full text-left px-4 py-2 hover:bg-[#fff7ed] transition-colors"
                          onClick={async () => {
                            setLocationLat(r.lat);
                            setLocationLng(r.lon);
                            const latNum = parseFloat(r.lat);
                            const lonNum = parseFloat(r.lon);
                            if (!Number.isNaN(latNum) && !Number.isNaN(lonNum)) {
                              setMapCenter([latNum, lonNum]);
                            }
                            setVenueAddress(r.display_name);
                            // Try to parse city name
                            const cityFromDisplay = r.display_name.split(",")[0];
                            if (cityFromDisplay) setCity(cityFromDisplay);
                            // try to parse state from display_name segments
                            const parts = r.display_name.split(",").map(s => s.trim());
                            if (parts.length >= 2) setState(parts[1]);
                            // try to infer country from last segment
                            if (parts.length >= 3) setCountry(parts[parts.length - 1]);
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
                    <div className="mt-2 h-64 w-full rounded-2xl overflow-hidden border border-black/10 shadow-lg ring-1 ring-white/20 relative z-0">
                      <MapPicker
                        center={mapCenter}
                        lat={!Number.isNaN(parseFloat(locationLat)) ? parseFloat(locationLat) : null}
                        lng={!Number.isNaN(parseFloat(locationLng)) ? parseFloat(locationLng) : null}
                        onPick={async (lat, lng) => {
                          setLocationLat(String(lat));
                          setLocationLng(String(lng));
                          setMapCenter([lat, lng]);
                          // Reverse geocode to fill address and city
                          try {
                            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
                            const data = await res.json()
                            const addr = data?.display_name || ""
                            setVenueAddress(addr)
                            const cityCandidate = data?.address?.city || data?.address?.town || data?.address?.village || ""
                            if (cityCandidate) setCity(cityCandidate)
                            const stateCandidate = data?.address?.state || ""
                            if (stateCandidate) setState(stateCandidate)
                            const countryCandidate = data?.address?.country || ""
                            if (countryCandidate) setCountry(countryCandidate)
                          } catch {}
                        }}
                      />
                    </div>
                  )}
                  {/* Manual correction for city/state/country */}
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs opacity-70" htmlFor="auto-city">City*</label>
                      <input id="auto-city" className={`mt-1 w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition ${!validCity ? "border-red-400" : ""}`} value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
                    </div>
                    <div>
                      <label className="text-xs opacity-70" htmlFor="auto-state">State*</label>
                      <input id="auto-state" className={`mt-1 w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition ${!validState ? "border-red-400" : ""}`} value={state} onChange={(e) => setState(e.target.value)} placeholder="State" />
                    </div>
                    <div>
                      <label className="text-xs opacity-70" htmlFor="auto-country">Country*</label>
                      <input id="auto-country" className={`mt-1 w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition ${!validCountry ? "border-red-400" : ""}`} value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" />
                    </div>
                  </div>
                </div>
                {/* Step 2 nav */}
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setStep(1)} className="rounded-xl border border-black/10 bg-white/60 px-4 py-2 text-sm">Back</button>
                  <button type="button" onClick={() => setStep(3)} disabled={!canStep2} className="rounded-xl bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white px-4 py-2 text-sm font-semibold shadow-lg disabled:opacity-60">Continue</button>
                </div>
                </div>

                {/* Step 5: Review & Submit */}
                <div className={step === 5 ? "" : "hidden"}>
                  {/* Submit */}
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setStep(4)} className="rounded-xl border border-black/10 bg-white/60 px-4 py-2 text-sm">Back</button>
                    <button
                      className="rounded-xl bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white px-4 py-2 text-sm font-semibold shadow-lg disabled:opacity-60"
                      onClick={submit}
                      disabled={submitting || !canSubmit}
                      title={!canSubmit ? "Complete required fields before submitting" : "Submit your event"}
                    >
                      {submitting ? "Submitting…" : "Submit"}
                    </button>
                  </div>

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
                              <Link href={`/events/${createdId}`} className="underline">View event</Link>
                              <span className="mx-2 opacity-50">•</span>
                              <Link href="/events" className="underline">Browse all events</Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {errors.length > 0 && (
                    <div className="mt-2 rounded border border-yellow-300 bg-yellow-50 text-yellow-700 px-3 py-2 text-xs">
                      <div className="font-semibold">Please fix {errors.length} issue{errors.length > 1 ? "s" : ""} before submitting:</div>
                      <ul className="mt-1 list-disc list-inside">
                        {errors.slice(0, 6).map((e, i) => (<li key={i}>{e}</li>))}
                        {errors.length > 6 && (<li>…and {errors.length - 6} more</li>)}
                      </ul>
                    </div>
                  )}

                  <div className="text-[11px] opacity-70 mt-3 text-center">By submitting, you agree to our terms and policies.</div>
                </div>
              </div>
            </div>
            
          </div>

            {/* Preview card */}
            <aside className="sm:col-span-1 sm:col-start-2 md:col-span-1 md:col-start-3 md:flex-none md:w-[22rem]">
              <div className="rounded-3xl border border-black/10 bg-white/80 backdrop-blur-lg shadow-xl overflow-hidden">
                <div
                  className="w-full aspect-[4/3]"
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
                  <div className="text-xs opacity-70">{date || "Date"} {startTime && (<span className="ml-1">• {startTime}{endTime ? ` - ${endTime}` : ""}</span>)}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-block text-[10px] px-2 py-1 rounded-full bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white shadow-sm">{style}</span>
                    <span className="inline-block text-[10px] px-2 py-1 rounded-full bg-[#fff7ed] text-[#9a3412] shadow-sm">{category.replace("_", " ")}</span>
                  </div>
                  <div className="mt-3 text-xs opacity-70">{description || "Description will appear here."}</div>
                  <div className="mt-1 text-[11px] opacity-70">{venueName || "Venue"}{venueAddress ? ` • ${venueAddress}` : ""}</div>
                  <div className="mt-4 rounded bg-[#fff7ed] text-[#9a3412] px-3 py-2 text-xs">
                    For best results, use an SVG image. If omitted, a placeholder is shown.
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <Link href="/events" className="text-xs underline">Explore events</Link>
                    <span className="hidden sm:inline text-xs opacity-50">•</span>
                    <Link href="/" className="text-xs underline">Home</Link>
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