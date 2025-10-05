import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readSessionCookie } from "@/lib/auth";

export async function GET() {
  const session = await readSessionCookie();
  if (!session || session.role !== "STUDIO_OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const studio = await prisma.studioProfile.findUnique({ where: { ownerId: session.userId } });
  if (!studio) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(studio, { status: 200 });
}

export async function PATCH(req: Request) {
  try {
    const session = await readSessionCookie();
    if (!session || session.role !== "STUDIO_OWNER") {
      return NextResponse.json({ error: "Forbidden: Studio owner required" }, { status: 403 });
    }
    const body = await req.json();
    const {
      name,
      addressLine1,
      addressLine2,
      city,
      state,
      country,
      postalCode,
      phone,
      email,
      website,
      description,
      locationLat,
      locationLng,
    } = body || {};

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ error: "Studio name is required" }, { status: 400 });
    }
    const latNum = typeof locationLat === "number" ? locationLat : parseFloat(locationLat);
    const lngNum = typeof locationLng === "number" ? locationLng : parseFloat(locationLng);
    if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
      return NextResponse.json({ error: "Valid map location (lat/lng) is required" }, { status: 400 });
    }

    const saved = await prisma.studioProfile.upsert({
      where: { ownerId: session.userId },
      create: {
        ownerId: session.userId,
        name: name.trim(),
        addressLine1: addressLine1?.trim() || null,
        addressLine2: addressLine2?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        country: country?.trim() || null,
        postalCode: postalCode?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        website: website?.trim() || null,
        description: description?.trim() || null,
        locationLat: latNum,
        locationLng: lngNum,
      },
      update: {
        name: name.trim(),
        addressLine1: addressLine1?.trim() || null,
        addressLine2: addressLine2?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        country: country?.trim() || null,
        postalCode: postalCode?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        website: website?.trim() || null,
        description: description?.trim() || null,
        locationLat: latNum,
        locationLng: lngNum,
      },
      select: {
        id: true,
        ownerId: true,
        name: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        country: true,
        postalCode: true,
        phone: true,
        email: true,
        website: true,
        description: true,
        locationLat: true,
        locationLng: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(saved, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}