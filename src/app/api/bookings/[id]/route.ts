// src/app/api/bookings/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readSessionCookie } from "@/lib/auth";

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = await readSessionCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking || booking.userId !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.booking.update({ where: { id }, data: { status: "CANCELLED" } });
  return NextResponse.json({ ok: true }, { status: 200 });
}