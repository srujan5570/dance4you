import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readSessionCookie } from "@/lib/auth";

export async function GET() {
  const session = await readSessionCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, role: true, name: true, createdAt: true, chatVisibility: true },
  });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(user, { status: 200 });
}

export async function PATCH(req: Request) {
  try {
    const session = await readSessionCookie();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, email, chatVisibility } = body || {};
    const data: { name?: string; email?: string; chatVisibility?: "PUBLIC" | "PRIVATE" } = {};

    if (typeof name === "string") {
      const trimmed = name.trim();
      if (trimmed.length > 0 && trimmed.length <= 100) data.name = trimmed;
    }

    if (typeof email === "string") {
      const trimmed = email.trim();
      const valid = /.+@.+\..+/.test(trimmed);
      if (!valid) return NextResponse.json({ error: "Invalid email" }, { status: 400 });

      // Check if email is already used by another user
      const existing = await prisma.user.findUnique({ where: { email: trimmed } });
      if (existing && existing.id !== session.userId) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 });
      }
      data.email = trimmed;
    }

    if (chatVisibility && (chatVisibility === "PUBLIC" || chatVisibility === "PRIVATE")) {
      data.chatVisibility = chatVisibility;
    }

    if (!data.name && !data.email && !data.chatVisibility) {
      return NextResponse.json({ error: "No changes" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: session.userId },
      data,
      select: { id: true, email: true, role: true, name: true, chatVisibility: true },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}
