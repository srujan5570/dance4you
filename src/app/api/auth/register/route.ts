// src/app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, commitSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role } = body || {};
    if (!email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields: email, password, role" }, { status: 400 });
    }
    if (role !== "STUDENT" && role !== "STUDIO_OWNER") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({ data: { email, name, passwordHash, role } });
    const expSeconds = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30; // 30 days persistent session
    const token = signToken({ userId: user.id, role: user.role as any, exp: expSeconds });
    const res = NextResponse.json({ id: user.id, email: user.email, role: user.role, name: user.name }, { status: 201 });
    commitSessionCookie(res, token, 60 * 60 * 24 * 30);
    return res;
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}