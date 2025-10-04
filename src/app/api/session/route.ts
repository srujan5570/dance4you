// src/app/api/session/route.ts
import { NextResponse } from "next/server";
import { readSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await readSessionCookie();
  if (!session) return NextResponse.json({ authenticated: false }, { status: 200 });
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true, email: true, role: true, name: true } });
  if (!user) return NextResponse.json({ authenticated: false }, { status: 200 });
  return NextResponse.json({ authenticated: true, user }, { status: 200 });
}