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
    where.city = { contains: cityParam, mode: "insensitive" }
  }
  if (stateParam) {
    where.state = { contains: stateParam, mode: "insensitive" }
  }
  if (groupParam === "ADULT") {
    where.title = { contains: "adult", mode: "insensitive" }
  } else if (groupParam === "CHILDREN") {
    where.title = { contains: "children", mode: "insensitive" }
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

  return NextResponse.json(finalEvents)
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
    const body = await req.json()
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
      // Per-category data
      fee,
      instructor,
      recurrence,
      battleRules,
      prizes,
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

    // posterUrls sanitation: ensure array of strings
    const posterUrlsArray = Array.isArray(posterUrls)
      ? posterUrls.filter((p: unknown) => typeof p === "string")
      : []

    const created = await prisma.event.create({
      data: {
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
        category,
        startTime,
        endTime: endTime || null,
        venueName,
        posterUrls: posterUrlsArray,
        // Per-category fields
        fee,
        instructor,
        recurrence,
        battleRules,
        prizes,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
}
