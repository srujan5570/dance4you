import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readSessionCookie } from "@/lib/auth";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await prisma.event.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await readSessionCookie();
  if (!session || session.role !== "STUDIO_OWNER") {
    return NextResponse.json({ error: "Forbidden: Studio owner required" }, { status: 403 });
  }
  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (event.ownerId !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ ok: true }, { status: 200 });
}