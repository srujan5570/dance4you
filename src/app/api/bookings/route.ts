// src/app/api/bookings/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readSessionCookie } from "@/lib/auth";

export async function GET() {
  const session = await readSessionCookie();
  if (!session) {
    return NextResponse.json([], { status: 200 });
  }
  const list = await prisma.booking.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, eventId: true, name: true, email: true, tickets: true, note: true, createdAt: true, status: true },
  });
  return NextResponse.json(list, { status: 200 });
}

export async function POST(req: Request) {
  try {
    const session = await readSessionCookie();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { eventId, name, email, tickets, note } = body || {};

    if (!eventId || !name || !email) {
      return NextResponse.json({ error: "Missing required fields: eventId, name, email" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const created = await prisma.booking.create({
      data: {
        eventId,
        name,
        email,
        tickets: typeof tickets === "number" && tickets > 0 ? tickets : 1,
        note,
        userId: session.userId,
        status: "ACTIVE",
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}