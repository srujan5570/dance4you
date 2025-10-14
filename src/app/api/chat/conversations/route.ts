import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readSessionCookie } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await readSessionCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const minimal = searchParams.get("minimal") === "true";

  const conversations = await prisma.conversation.findMany({
    where: { participants: { some: { userId: session.userId } } },
    include: {
      participants: { include: { user: { select: { id: true, name: true, email: true } } } },
      messages: {
        take: 1,
        orderBy: { createdAt: "desc" },
        include: { sender: { select: { id: true, name: true, email: true } } },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  if (minimal) {
    return NextResponse.json(conversations);
  }

  const withUnread = await Promise.all(
    conversations.map(async (c) => {
      const meParticipant = c.participants.find((p: any) => p.userId === session.userId);
      const lastReadAt: Date | null = meParticipant?.lastReadAt || null;
      const unreadCount = await prisma.message.count({
        where: {
          conversationId: c.id,
          NOT: { senderId: session.userId },
          ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
        },
      });
      return { ...c, unreadCount } as any;
    })
  );

  return NextResponse.json(withUnread);
}

export async function POST(req: Request) {
  const session = await readSessionCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { participantUserId } = body || {};
  if (!participantUserId || typeof participantUserId !== "string") {
    return NextResponse.json({ error: "participantUserId required" }, { status: 400 });
  }
  if (participantUserId === session.userId) {
    return NextResponse.json({ error: "Cannot create conversation with yourself" }, { status: 400 });
  }

  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: session.userId } } },
        { participants: { some: { userId: participantUserId } } },
      ],
    },
    include: {
      participants: { include: { user: { select: { id: true, name: true, email: true } } } },
      messages: {
        take: 1,
        orderBy: { createdAt: "desc" },
        include: { sender: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  if (existing && existing.participants.length === 2) {
    return NextResponse.json(existing);
  }

  // Get recipient visibility
  const recipient = await prisma.user.findUnique({ where: { id: participantUserId }, select: { id: true, chatVisibility: true } });
  if (!recipient) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const isPrivate = recipient.chatVisibility === "PRIVATE";

  const created = await prisma.conversation.create({
    data: {
      status: isPrivate ? "REQUEST_PENDING" : "ACTIVE",
      requestInitiatorId: isPrivate ? session.userId : null,
      participants: {
        create: [
          { userId: session.userId },
          { userId: participantUserId },
        ],
      },
    },
    include: {
      participants: { include: { user: { select: { id: true, name: true, email: true } } } },
      messages: {
        take: 1,
        orderBy: { createdAt: "desc" },
        include: { sender: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  return NextResponse.json(created, { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await readSessionCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { conversationId, action } = body || {};
  if (!conversationId || !action) return NextResponse.json({ error: "conversationId and action required" }, { status: 400 });

  const convo = await prisma.conversation.findUnique({ where: { id: conversationId }, include: { participants: true } });
  if (!convo) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const isMember = convo.participants.some((p) => p.userId === session.userId);
  if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (convo.status !== "REQUEST_PENDING") {
    return NextResponse.json({ error: "No pending request" }, { status: 400 });
  }

  // Only recipient (not initiator) can accept/decline
  const otherUserId = convo.participants.find((p) => p.userId !== session.userId)?.userId;
  if (session.userId === convo.requestInitiatorId) {
    return NextResponse.json({ error: "Initiator cannot accept/decline" }, { status: 403 });
  }

  if (action === "accept") {
    const updated = await prisma.conversation.update({ where: { id: conversationId }, data: { status: "ACTIVE" } });
    return NextResponse.json(updated, { status: 200 });
  }
  if (action === "decline") {
    const updated = await prisma.conversation.update({ where: { id: conversationId }, data: { status: "REQUEST_DECLINED" } });
    return NextResponse.json(updated, { status: 200 });
  }
  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}