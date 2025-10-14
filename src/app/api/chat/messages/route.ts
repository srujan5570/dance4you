import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readSessionCookie } from "@/lib/auth";
import { chatHub } from "@/lib/chatHub";

export async function GET(req: Request) {
  const session = await readSessionCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("conversationId");
  const cursor = searchParams.get("cursor") || undefined;
  const take = Number(searchParams.get("take") || 30);
  const noMarkRead = searchParams.get("noMarkRead") === "true";
  if (!conversationId) return NextResponse.json({ error: "conversationId required" }, { status: 400 });

  // Verify user is participant
  const participant = await prisma.conversationParticipant.findFirst({
    where: { conversationId, userId: session.userId },
  });
  if (!participant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Mark as read (skip if explicitly requested for prefetch)
  if (!noMarkRead) {
    const now = new Date();
    await prisma.conversationParticipant.update({
      where: { id: participant.id },
      data: { lastReadAt: now },
    });

    // Broadcast read receipt to conversation
    chatHub.broadcast({ type: "receipt", conversationId, payload: { kind: "read", userId: session.userId!, readUpTo: now.toISOString() } });
  }

  const messages = await prisma.message.findMany({
    where: { conversationId },
    take,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { createdAt: "desc" },
    include: { sender: { select: { id: true, name: true, email: true } }, attachments: true },
  });

  const payload = messages.map((m) => ({
    ...m,
    isMine: m.sender.id === session.userId,
  }));

  return NextResponse.json(payload);
}

export async function POST(req: Request) {
  const session = await readSessionCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { conversationId, text, attachments, clientId } = body || {};
  if (!conversationId || (typeof text !== "string" && !Array.isArray(attachments)) || (!text?.trim() && (!attachments || attachments.length === 0))) {
    return NextResponse.json({ error: "conversationId and either non-empty text or attachments required" }, { status: 400 });
  }

  // Verify user is participant
  const participant = await prisma.conversationParticipant.findFirst({
    where: { conversationId, userId: session.userId },
  });
  if (!participant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Enforce private request gating
  const convo = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!convo) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  if (convo.status === "REQUEST_PENDING") {
    // Only initiator can send exactly one initial message (besides the "[PRIVATE_REQUEST]" marker if used by UI)
    const isInitiator = convo.requestInitiatorId === session.userId;
    if (!isInitiator) {
      return NextResponse.json({ error: "Chat request pending. Please wait for acceptance." }, { status: 403 });
    }
    // Block subsequent messages from initiator until accepted: allow only if no non-system message exists yet
    const nonSystemCount = await prisma.message.count({
      where: { conversationId, NOT: { text: { in: ["[PRIVATE_REQUEST]", "[PRIVATE_ACCEPT]", "[PRIVATE_DECLINE]"] } } },
    });
    if (nonSystemCount > 0) {
      return NextResponse.json({ error: "Only one message allowed until recipient accepts." }, { status: 403 });
    }
  }
  if (convo.status === "REQUEST_DECLINED") {
    return NextResponse.json({ error: "Chat request was declined. Messaging disabled." }, { status: 403 });
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: session.userId,
      text: text || "",
      ...(Array.isArray(attachments) && attachments.length > 0
        ? { attachments: { create: attachments.map((a: any) => ({ url: a.url, mimeType: a.mimeType || null, size: a.size || null })) } }
        : {}),
    },
    include: {
      sender: { select: { id: true, name: true, email: true } },
      attachments: true,
    },
  });

  // touch conversation updatedAt so lists order by recent activity
  await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });

  // broadcast new message (include clientId for optimistic UI replacement)
  const messageWithClientId = clientId ? { ...message, clientId } : message;
  chatHub.broadcast({ type: "message:new", conversationId, payload: messageWithClientId });

  // Do not automatically mark messages as delivered or read when created
  // Delivered status should only be set when recipient actually receives the message
  // Read status should only be set when recipient actually reads the message

  return NextResponse.json(messageWithClientId);
}