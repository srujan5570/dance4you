// src/app/api/auth/change-password/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readSessionCookie, verifyPassword, hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await readSessionCookie();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const { currentPassword, newPassword } = body || {};
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Missing required fields: currentPassword, newPassword" }, { status: 400 });
    }
    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const ok = await verifyPassword(currentPassword, user.passwordHash);
    if (!ok) return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}