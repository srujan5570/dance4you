import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { readSessionCookie } from "@/lib/auth";
import { chatHub } from "@/lib/chatHub";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("conversationId");
  if (!conversationId) return new Response("Missing conversationId", { status: 400 });

  const session = await readSessionCookie();
  if (!session?.userId) return new Response("Unauthorized", { status: 401 });

  // verify membership
  const membership = await prisma.conversationParticipant.findFirst({
    where: { conversationId, userId: session.userId },
  });
  if (!membership) return new Response("Forbidden", { status: 403 });

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (event: { type: string; conversationId: string; payload: any }) => {
        controller.enqueue(encoder.encode(`event: ${event.type}\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event.payload)}\n\n`));
      };
      const client = {
        userId: session.userId!,
        conversationId,
        send,
        close: () => controller.close(),
      };
      chatHub.addClient(client);

      // Push immediate receipts on connect to speed up tick updates
      ;(async () => {
        try {
          // Immediately mark as read on connect
          const now = new Date();
          await prisma.conversationParticipant.updateMany({
            where: { conversationId, userId: session.userId! },
            data: { lastReadAt: now },
          });
          chatHub.broadcast({ type: "receipt", conversationId, payload: { kind: "read", userId: session.userId!, readUpTo: now.toISOString() } });
      
          // Broadcast delivered for recent messages from the other participant
          const recentFromOther = await prisma.message.findMany({
            where: { conversationId, senderId: { not: session.userId! } },
            orderBy: { createdAt: "asc" },
            select: { id: true },
            take: 50,
          });
          for (const m of recentFromOther) {
            chatHub.broadcast({ type: "receipt", conversationId, payload: { kind: "delivered", userId: session.userId!, messageId: m.id } });
          }
        } catch {}
      })();

      // initial presence push
      send({ type: "presence", conversationId, payload: { userIds: [session.userId] } });

      // heartbeat to keep connection alive (every 25s)
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`event: ping\n`));
        controller.enqueue(encoder.encode(`data: {}\n\n`));
      }, 25000);

      const close = () => {
        clearInterval(heartbeat);
        chatHub.removeClient(client);
        controller.close();
      };

      // Note: Next.js edge/server environment auto handles abort
      // Attach to the request signal to clean up
      const signal = req.signal;
      signal.addEventListener("abort", close);
    },
    cancel() {},
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export async function POST(req: NextRequest) {
  // Set typing state
  const body = await req.json().catch(() => null);
  const { conversationId, typing } = body || {};
  if (!conversationId || typeof typing !== "boolean") return new Response("Bad request", { status: 400 });

  const session = await readSessionCookie();
  if (!session?.userId) return new Response("Unauthorized", { status: 401 });

  const membership = await prisma.conversationParticipant.findFirst({
    where: { conversationId, userId: session.userId },
  });
  if (!membership) return new Response("Forbidden", { status: 403 });

  chatHub.setTyping(conversationId, session.userId, typing);
  return new Response("OK");
}