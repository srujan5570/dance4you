import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readSessionCookie } from "@/lib/auth";

// List users for starting new chats. Defaults to STUDENT role and excludes the current user.
export async function GET(req: Request) {
  const session = await readSessionCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const role = (searchParams.get("role") || "STUDENT").toUpperCase();
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10) || 50, 100);

  const where: any = {
    id: { not: session.userId },
  };
  if (role === "STUDENT" || role === "STUDIO_OWNER") {
    where.role = role;
  }
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    select: { id: true, name: true, email: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json(users);
}