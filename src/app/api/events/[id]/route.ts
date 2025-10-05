import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readSessionCookie } from "@/lib/auth";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await readSessionCookie();
  const item = await prisma.event.findUnique({ where: { id: params.id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let canAccessContacts = false;
  if (session) {
    // Owner can always access their event's contact info
    if (item.ownerId && session.role === "STUDIO_OWNER" && item.ownerId === session.userId) {
      canAccessContacts = true;
    } else {
      // Check if the user has an active booking for this event
      const booking = await prisma.booking.findFirst({
        where: { eventId: params.id, userId: session.userId, status: { not: "CANCELLED" } },
        select: { id: true },
      });
      if (booking) canAccessContacts = true;
    }
  }

  const result: any = { ...item };
  if (!canAccessContacts) {
    delete result.contactPhone;
    delete result.contactEmail;
    delete result.venueAddress;
    delete result.venueMapUrl;
    delete result.contactNotes;
  }
  return NextResponse.json(result);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await readSessionCookie();
  if (!session || session.role !== "STUDIO_OWNER") {
    return NextResponse.json({ error: "Forbidden: Studio owner required" }, { status: 403 });
  }
  const event = await prisma.event.findUnique({ where: { id: params.id } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (event.ownerId !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.event.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true }, { status: 200 });
}