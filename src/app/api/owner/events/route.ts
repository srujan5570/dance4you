// src/app/api/owner/events/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readSessionCookie } from "@/lib/auth";

export async function GET() {
  const session = await readSessionCookie();
  if (!session || session.role !== "STUDIO_OWNER") {
    return NextResponse.json([], { status: 200 });
  }
  const items = await prisma.event.findMany({
    where: { ownerId: session.userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, city: true, date: true, style: true, image: true, createdAt: true },
  });
  return NextResponse.json(items, { status: 200 });
}