import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken, commitSessionCookie, hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role } = body || {};
    if (!email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields: email, password, role" }, { status: 400 });
    }
    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }
    if (role !== "STUDENT" && role !== "STUDIO_OWNER") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }
    const passwordHash = await hashPassword(password);
    const created = await prisma.user.create({
      data: { email, passwordHash, role, name: typeof name === "string" ? name : undefined },
      select: { id: true, email: true, role: true, name: true },
    });
    const token = signToken({ userId: created.id, role: created.role });
    const res = NextResponse.json(created, { status: 201 });
    commitSessionCookie(res, token);
    return res;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}
