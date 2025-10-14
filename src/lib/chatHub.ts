import type { Prisma } from "@prisma/client";

export type HubEvent =
  | { type: "message:new"; conversationId: string; payload: any }
  | { type: "typing"; conversationId: string; payload: { userId: string; typing: boolean } }
  | { type: "presence"; conversationId: string; payload: { userIds: string[] } }
  | { type: "receipt"; conversationId: string; payload: ({ kind: "delivered"; userId: string; messageId: string } | { kind: "read"; userId: string; readUpTo: string }) }
  | { type: "reaction"; conversationId: string; payload: { messageId: string; emoji: string; userId: string; op: "add" | "remove" } };

type SSEClient = {
  userId: string;
  conversationId: string;
  send: (event: HubEvent) => void;
  close: () => void;
};

class ChatHub {
  private clients: Map<string, Set<SSEClient>> = new Map(); // key: conversationId
  private typingMap: Map<string, Set<string>> = new Map(); // key: conversationId -> set of typing userIds
  // reactions: conversationId -> messageId -> emoji -> set of userIds
  private reactions: Map<string, Map<string, Map<string, Set<string>>>> = new Map();

  addClient(client: SSEClient) {
    const set = this.clients.get(client.conversationId) ?? new Set<SSEClient>();
    set.add(client);
    this.clients.set(client.conversationId, set);
    this.broadcastPresence(client.conversationId);
  }

  removeClient(client: SSEClient) {
    const set = this.clients.get(client.conversationId);
    if (set) {
      set.delete(client);
      if (set.size === 0) this.clients.delete(client.conversationId);
    }
    this.broadcastPresence(client.conversationId);
  }

  broadcast(event: HubEvent) {
    const set = this.clients.get(event.conversationId);
    if (!set || set.size === 0) return;
    for (const client of set) {
      try {
        client.send(event);
      } catch (e) {
        // best effort
        try { client.close(); } catch {}
      }
    }
  }

  setTyping(conversationId: string, userId: string, typing: boolean) {
    const set = this.typingMap.get(conversationId) ?? new Set<string>();
    if (typing) set.add(userId); else set.delete(userId);
    if (set.size === 0) this.typingMap.delete(conversationId); else this.typingMap.set(conversationId, set);
    this.broadcast({ type: "typing", conversationId, payload: { userId, typing } });
  }

  broadcastPresence(conversationId: string) {
    const set = this.clients.get(conversationId);
    const userIds = set ? Array.from(new Set(Array.from(set).map((c) => c.userId))) : [];
    this.broadcast({ type: "presence", conversationId, payload: { userIds } });
  }

  // Provide current presence userIds to enable delivered receipts
  getPresence(conversationId: string): string[] {
    const set = this.clients.get(conversationId);
    return set ? Array.from(new Set(Array.from(set).map((c) => c.userId))) : [];
  }

  // Reactions management
  setReaction(conversationId: string, messageId: string, userId: string, emoji: string, add: boolean) {
    const byMessage = this.reactions.get(conversationId) ?? new Map<string, Map<string, Set<string>>>();
    const byEmoji = byMessage.get(messageId) ?? new Map<string, Set<string>>();
    const users = byEmoji.get(emoji) ?? new Set<string>();
    if (add) {
      users.add(userId);
      byEmoji.set(emoji, users);
      byMessage.set(messageId, byEmoji);
      this.reactions.set(conversationId, byMessage);
      this.broadcast({ type: "reaction", conversationId, payload: { messageId, emoji, userId, op: "add" } });
    } else {
      users.delete(userId);
      if (users.size === 0) byEmoji.delete(emoji); else byEmoji.set(emoji, users);
      if (byEmoji.size === 0) byMessage.delete(messageId); else byMessage.set(messageId, byEmoji);
      if (byMessage.size === 0) this.reactions.delete(conversationId); else this.reactions.set(conversationId, byMessage);
      this.broadcast({ type: "reaction", conversationId, payload: { messageId, emoji, userId, op: "remove" } });
    }
  }

  getReactions(conversationId: string): Record<string, Record<string, string[]>> {
    const byMessage = this.reactions.get(conversationId);
    const out: Record<string, Record<string, string[]>> = {};
    if (!byMessage) return out;
    for (const [messageId, byEmoji] of byMessage.entries()) {
      out[messageId] = {};
      for (const [emoji, users] of byEmoji.entries()) {
        out[messageId][emoji] = Array.from(users);
      }
    }
    return out;
  }
}

const g = globalThis as unknown as { __chatHub?: ChatHub };
if (!g.__chatHub) {
  g.__chatHub = new ChatHub();
}
export const chatHub = g.__chatHub;