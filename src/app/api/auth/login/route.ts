// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken, commitSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, remember } = body || {};
    if (!email || !password) {
      return NextResponse.json({ error: "Missing required fields: email, password" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    // 30 days if remember me checked, else default 7 days
    const expSeconds = Math.floor(Date.now() / 1000) + (remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7);
    const token = signToken({ userId: user.id, role: user.role as "STUDENT" | "STUDIO_OWNER", exp: expSeconds });
    const res = NextResponse.json({ id: user.id, email: user.email, role: user.role, name: user.name }, { status: 200 });
    commitSessionCookie(res, token, remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7);
    return res;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}