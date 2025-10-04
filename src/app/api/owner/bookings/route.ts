// src/app/api/owner/bookings/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readSessionCookie } from "@/lib/auth";

export async function GET() {
  const session = await readSessionCookie();
  if (!session || session.role !== "STUDIO_OWNER") {
    return NextResponse.json([], { status: 200 });
  }
  // List bookings for events owned by this owner
  const bookings = await prisma.booking.findMany({
    where: { event: { ownerId: session.userId } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      eventId: true,
      name: true,
      email: true,
      tickets: true,
      note: true,
      createdAt: true,
      status: true,
      event: { select: { title: true, date: true, city: true } },
    },
  });
  return NextResponse.json(bookings, { status: 200 });
}