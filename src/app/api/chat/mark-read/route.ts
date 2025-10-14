import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readSessionCookie } from "@/lib/auth";
import { chatHub } from "@/lib/chatHub";

export async function POST(req: Request) {
  try {
    const session = await readSessionCookie();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { conversationId } = await req.json();
    if (!conversationId) return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });

    // Verify user is participant in this conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId, userId: session.userId },
    });
    if (!participant) return NextResponse.json({ error: "Not a participant" }, { status: 403 });

    // Update lastReadAt to current time
    const now = new Date();
    await prisma.conversationParticipant.update({
      where: { id: participant.id },
      data: { lastReadAt: now },
    });

    // Broadcast read receipt
    chatHub.broadcast({ 
      type: "receipt", 
      conversationId, 
      payload: { 
        kind: "read", 
        userId: session.userId!, 
        readUpTo: now.toISOString() 
      } 
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}