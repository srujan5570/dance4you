import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readSessionCookie } from "@/lib/auth";

export async function GET() {
  const events = await prisma.event.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(events);
}

export async function POST(req: Request) {
  try {
    const session = await readSessionCookie();
    if (!session || session.role !== "STUDIO_OWNER") {
      return NextResponse.json({ error: "Forbidden: Studio owner required" }, { status: 403 });
    }
    const body = await req.json();
    const { title, city, date, style, image, description } = body || {};

    if (!title || !city || !date || !style) {
      return NextResponse.json(
        { error: "Missing required fields: title, city, date, style" },
        { status: 400 }
      );
    }
    if (style !== "Indian" && style !== "Western") {
      return NextResponse.json({ error: "Invalid style" }, { status: 400 });
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
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}