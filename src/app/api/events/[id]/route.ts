import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readSessionCookie } from "@/lib/auth";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = await readSessionCookie();
  const item = await prisma.event.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let canAccessContacts = false;
  if (session) {
    // Owner can always access their event's contact info
    if (item.ownerId && session.role === "STUDIO_OWNER" && item.ownerId === session.userId) {
      canAccessContacts = true;
    } else {
      // Check if the user has an active booking for this event
      const booking = await prisma.booking.findFirst({
        where: { eventId: id, userId: session.userId, status: { not: "CANCELLED" } },
        select: { id: true },
      });
      if (booking) canAccessContacts = true;
    }
  }

  const plain: Record<string, unknown> = JSON.parse(JSON.stringify(item));
  if (!canAccessContacts) {
    delete plain["contactPhone"];
    delete plain["contactEmail"];
    delete plain["venueAddress"];
    delete plain["venueMapUrl"];
    delete plain["contactNotes"];
  }
  return NextResponse.json(plain);
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = await readSessionCookie();
  if (!session || session.role !== "STUDIO_OWNER") {
    return NextResponse.json({ error: "Forbidden: Studio owner required" }, { status: 403 });
  }
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (event.ownerId !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ ok: true }, { status: 200 });
}