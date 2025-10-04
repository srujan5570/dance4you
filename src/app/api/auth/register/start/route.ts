// src/app/api/auth/register/start/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { sendOtpEmail } from "@/lib/mailer";
import crypto from "node:crypto";

function generateOtp(): string {
  const num = crypto.randomInt(100000, 999999);
  return String(num);
}

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
    if (existing && existing.emailVerified) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    // generate OTP
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    let userId: string;
    if (!existing) {
      const user = await prisma.user.create({
        data: { email, name, passwordHash, role, emailVerified: false, otpHash, otpExpires: expiresAt },
        select: { id: true },
      });
      userId = user.id;
    } else {
      const updated = await prisma.user.update({
        where: { email },
        data: { name, passwordHash, role, emailVerified: false, otpHash, otpExpires: expiresAt },
        select: { id: true },
      });
      userId = updated.id;
    }

    await sendOtpEmail(email, otp, name);

    return NextResponse.json({ ok: true, userId }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}