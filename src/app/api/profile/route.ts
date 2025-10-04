// src/app/api/profile/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readSessionCookie } from "@/lib/auth";

export async function GET() {
  const session = await readSessionCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true, email: true, role: true, name: true, createdAt: true } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(user, { status: 200 });
}

export async function PATCH(req: Request) {
  try {
    const session = await readSessionCookie();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const { name, email } = body || {};
    const data: { name?: string; email?: string } = {};
    if (typeof name === "string") {
      const trimmed = name.trim();
      if (trimmed.length > 0 && trimmed.length <= 100) data.name = trimmed;
    }
    if (typeof email === "string") {
      const trimmed = email.trim();
      const valid = /.+@.+\..+/.test(trimmed);
      if (!valid) return NextResponse.json({ error: "Invalid email" }, { status: 400 });
      // If changing email, ensure not taken by someone else
      const existing = await prisma.user.findUnique({ where: { email: trimmed } });
      if (existing && existing.id !== session.userId) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 });
      }
      data.email = trimmed;
    }
    if (!data.name && !data.email) {
      return NextResponse.json({ error: "No changes" }, { status: 400 });
    }
    const updated = await prisma.user.update({ where: { id: session.userId }, data, select: { id: true, email: true, role: true, name: true } });
    return NextResponse.json(updated, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}