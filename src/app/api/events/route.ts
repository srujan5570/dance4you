import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { readSessionCookie } from "@/lib/auth"

export async function GET(req: Request) {
  // Support server-side filtering via query params
  const { searchParams } = new URL(req.url)
  const categoryParam = searchParams.get("category") || undefined
  const cityParam = searchParams.get("city") || undefined
  const cityExact = searchParams.get("cityExact") === "true"
  const stateParam = searchParams.get("state") || undefined
  const stateExact = searchParams.get("stateExact") === "true"
  const groupParam = searchParams.get("group") || undefined // "ADULT" | "CHILDREN"

  const where: any = {}
  if (categoryParam) {
    where.category = categoryParam
  }
  if (cityParam) {
    // Use broad contains for DB filtering; we'll apply exact match server-side if requested
    where.city = { contains: cityParam }
  }
  if (stateParam) {
    where.state = { contains: stateParam }
  }
  if (groupParam === "ADULT") {
    where.title = { contains: "adult" }
  } else if (groupParam === "CHILDREN") {
    where.title = { contains: "children" }
  }

  // Public list should not include contact fields
  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    where,
    select: {
      id: true,
      title: true,
      city: true,
      state: true,
      date: true,
      style: true,
      image: true,
      description: true,
      createdAt: true,
      ownerId: true,
      // Include coordinates for client-side distance filtering
      locationLat: true,
      locationLng: true,
      // New fields for richer listings
      category: true,
      startTime: true,
      endTime: true,
      venueName: true,
      posterUrls: true,
      poster4x3: true,
      posterDetail: true,
      // Per-category fields
      fee: true,
      instructor: true,
      recurrence: true,
      battleRules: true,
      prizes: true,
      // Contact fields are intentionally excluded
    },
  })

  // If exact match requested, apply strict case-insensitive equality on city/state
  let finalEvents = events
  if (cityParam && cityExact) {
    finalEvents = finalEvents.filter(e => (e.city || "").trim().toLowerCase() === cityParam.trim().toLowerCase())
  }
  if (stateParam && stateExact) {
    finalEvents = finalEvents.filter(e => (e as any).state && ((e as any).state as string).trim().toLowerCase() === stateParam.trim().toLowerCase())
  }

  // Parse posterUrls JSON string back to array for frontend compatibility
  const eventsWithParsedPosterUrls = finalEvents.map(event => ({
    ...event,
    posterUrls: event.posterUrls ? JSON.parse(event.posterUrls) : []
  }))

  return NextResponse.json(eventsWithParsedPosterUrls)
}

export async function POST(req: Request) {
  try {
    const session = await readSessionCookie()
    if (!session || session.role !== "STUDIO_OWNER") {
      return NextResponse.json({ error: "Forbidden: Studio owner required" }, { status: 403 })
    }
    // Enforce studio setup completion before allowing event creation
    const studio = await prisma.studioProfile.findUnique({ where: { ownerId: session.userId } })
    if (!studio) {
      return NextResponse.json({ error: "Studio setup required: Please complete your studio profile before listing events." }, { status: 403 })
    }
    let body
    try {
      body = await req.json()
    } catch (error) {
      console.error("JSON parsing error:", error)
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }
    
    const {
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
      locationLat,
      locationLng,
      // New fields
      category,
      startTime,
      endTime,
      venueName,
      posterUrls,
      poster4x3,
      posterDetail,
      // Per-category data
      fee,
      instructor,
      recurrence,
      battleRules,
      prizes,
      // Drop-in class enablement
      enableDropInClass,
    } = body || {}

    if (!title || !city || !date || typeof style !== "string" || !String(style).trim()) {
      return NextResponse.json(
        { error: "Missing required fields: title, city, date, style" },
        { status: 400 }
      )
    }

    // Validate category
    const allowedCategories = [
      "DROP_IN_CLASS",
      "DANCE_WORKSHOP",
      "REGULAR_CLASS",
      "BATTLE_COMPETITION",
    ] as const
    const isValidCategory = allowedCategories.includes(category)
    if (!isValidCategory) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 })
    }

    // Validate time (require startTime, endTime optional)
    const timeRe = /^\d{2}:\d{2}$/
    if (!startTime || !timeRe.test(startTime)) {
      return NextResponse.json({ error: "Missing or invalid startTime (HH:MM)" }, { status: 400 })
    }
    if (endTime && !timeRe.test(endTime)) {
      return NextResponse.json({ error: "Invalid endTime (HH:MM)" }, { status: 400 })
    }

    const latNum = typeof locationLat === "number" ? locationLat : parseFloat(locationLat)
    const lngNum = typeof locationLng === "number" ? locationLng : parseFloat(locationLng)
    if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
      return NextResponse.json(
        { error: "Missing or invalid required fields: locationLat, locationLng" },
        { status: 400 }
      )
    }

    // posterUrls sanitation: ensure array of strings, then convert to JSON string for SQLite
    const posterUrlsArray = Array.isArray(posterUrls)
      ? posterUrls.filter((p: unknown) => typeof p === "string")
      : []
    const posterUrlsJson = JSON.stringify(posterUrlsArray)

    // Common event data
    const eventData = {
      title,
      city,
      state,
      date,
      style,
      image: image || "/hero-placeholder.svg",
      description,
      ownerId: session.userId,
      // Contact fields
      contactPhone,
      contactEmail,
      venueAddress,
      venueMapUrl,
      contactNotes,
      // Coordinates
      locationLat: latNum,
      locationLng: lngNum,
      // New rich listing fields
      startTime,
      endTime: endTime || null,
      venueName,
      posterUrls: posterUrlsJson,
      poster4x3: poster4x3 || null,
      posterDetail: posterDetail || null,
      // Per-category fields
      fee,
      instructor,
      recurrence,
      battleRules,
      prizes,
    }

    // Check if we need to create events in both categories
    if (category === "REGULAR_CLASS" && enableDropInClass) {
      // Create two events: one for Regular Class and one for Drop-In Class
      const [regularClassEvent, dropInClassEvent] = await Promise.all([
        prisma.event.create({
          data: {
            ...eventData,
            category: "REGULAR_CLASS",
          },
        }),
        prisma.event.create({
          data: {
            ...eventData,
            category: "DROP_IN_CLASS",
          },
        }),
      ])

      return NextResponse.json({
        regularClassEvent,
        dropInClassEvent,
        message: "Events created in both Regular Class and Drop-In Class categories"
      }, { status: 201 })
    } else {
      // Create single event with specified category
      const created = await prisma.event.create({
        data: {
          ...eventData,
          category,
        },
      })

      return NextResponse.json(created, { status: 201 })
    }
  } catch (error) {
    console.error("Error creating event:", error)
    
    // Check if it's a JSON parsing error
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }
    
    // Check if it's a database connection error
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = (error as Error).message
      if (errorMessage.includes("Can't reach database server")) {
        return NextResponse.json({ 
          error: "Database connection failed. Please try again later." 
        }, { status: 503 })
      }
    }
    
    // Generic server error for other cases
    return NextResponse.json({ 
      error: "Internal server error. Please try again." 
    }, { status: 500 })
  }
}
