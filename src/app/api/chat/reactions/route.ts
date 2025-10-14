import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readSessionCookie } from "@/lib/auth";
import { chatHub } from "@/lib/chatHub";

export async function GET(req: Request) {
  const session = await readSessionCookie();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("conversationId");
  if (!conversationId) return NextResponse.json({ error: "conversationId required" }, { status: 400 });

  // Verify user is participant
  const participant = await prisma.conversationParticipant.findFirst({
    where: { conversationId, userId: session.userId },
  });
  if (!participant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const reactions = chatHub.getReactions(conversationId);
  return NextResponse.json({ reactions });
}

export async function POST(req: Request) {
  const session = await readSessionCookie();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const { conversationId, messageId, emoji, add } = body || {};
  if (!conversationId || !messageId || !emoji || typeof add !== "boolean") {
    return NextResponse.json({ error: "conversationId, messageId, emoji, add required" }, { status: 400 });
  }

  // Verify user is participant
  const participant = await prisma.conversationParticipant.findFirst({
    where: { conversationId, userId: session.userId },
  });
  if (!participant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Optional: ensure message belongs to conversation
  const msg = await prisma.message.findFirst({ where: { id: messageId, conversationId }, select: { id: true } });
  if (!msg) return NextResponse.json({ error: "Message not found in conversation" }, { status: 404 });

  chatHub.setReaction(conversationId, messageId, session.userId!, emoji, !!add);
  return NextResponse.json({ ok: true });
}