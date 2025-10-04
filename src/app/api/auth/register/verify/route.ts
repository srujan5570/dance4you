// src/app/api/auth/register/verify/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "node:crypto";
import { signToken, commitSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, otp } = body || {};
    if (!email || !otp) {
      return NextResponse.json({ error: "Missing required fields: email, otp" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (!user.otpHash || !user.otpExpires) {
      return NextResponse.json({ error: "No OTP pending" }, { status: 400 });
    }
    if (user.otpExpires < new Date()) {
      return NextResponse.json({ error: "OTP expired" }, { status: 400 });
    }

    const otpHash = crypto.createHash("sha256").update(String(otp)).digest("hex");
    if (otpHash !== user.otpHash) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    // Mark email verified and clear OTP
    const updated = await prisma.user.update({
      where: { email },
      data: { emailVerified: true, otpHash: null, otpExpires: null },
      select: { id: true, role: true, name: true, email: true },
    });

    const expSeconds = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30; // 30 days session
    const token = signToken({ userId: updated.id, role: updated.role as "STUDENT" | "STUDIO_OWNER", exp: expSeconds });
    const res = NextResponse.json({ id: updated.id, email: updated.email, role: updated.role, name: updated.name }, { status: 200 });
    commitSessionCookie(res, token, 60 * 60 * 24 * 30);
    return res;
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}