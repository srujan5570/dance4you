import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readSessionCookie } from "@/lib/auth";

export async function GET() {
  // Public list should not include contact fields
  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      city: true,
      date: true,
      style: true,
      image: true,
      description: true,
      createdAt: true,
      ownerId: true,
      // Include coordinates for client-side distance filtering
      locationLat: true,
      locationLng: true,
      // Contact fields are intentionally excluded
    },
  });
  return NextResponse.json(events);
}

export async function POST(req: Request) {
  try {
    const session = await readSessionCookie();
    if (!session || session.role !== "STUDIO_OWNER") {
      return NextResponse.json({ error: "Forbidden: Studio owner required" }, { status: 403 });
    }
    const body = await req.json();
    const {
      title,
      city,
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
    } = body || {};

    if (!title || !city || !date || !style) {
      return NextResponse.json(
        { error: "Missing required fields: title, city, date, style" },
        { status: 400 }
      );
    }
    if (style !== "Indian" && style !== "Western") {
      return NextResponse.json({ error: "Invalid style" }, { status: 400 });
    }
    const latNum = typeof locationLat === "number" ? locationLat : parseFloat(locationLat);
    const lngNum = typeof locationLng === "number" ? locationLng : parseFloat(locationLng);
    if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
      return NextResponse.json(
        { error: "Missing or invalid required fields: locationLat, locationLng" },
        { status: 400 }
      );
    }

    const created = await prisma.event.create({
      data: {
        title,
        city,
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
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}
