"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useChatStorage } from "../../hooks/useChatStorage";

interface UserRef {
  id: string;
  name?: string | null;
  email: string;
  // Optional visibility for discover users list
  chatVisibility?: "PUBLIC" | "PRIVATE";
}

interface MessageDTO {
  id: string;
  conversationId: string;
  sender: UserRef;
  text: string;
  createdAt: string;
  attachments?: { id?: string; url: string; mimeType?: string | null; size?: number | null }[];
}

interface ConversationDTO {
  id: string;
  participants: { id: string; user: UserRef }[];
  messages: MessageDTO[]; // latest message only
  unreadCount?: number;
  // Server-side private gating
  status?: "ACTIVE" | "REQUEST_PENDING" | "REQUEST_DECLINED";
  requestInitiatorId?: string | null;
}

export default function ChatPage() {
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<ConversationDTO[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  

  const [messages, setMessages] = useState<(MessageDTO & { isMine?: boolean })[]>([]);
  // track message status for my messages: 'sent' | 'delivered' | 'read'
  const [messageStatus, setMessageStatus] = useState<Record<string, 'sent' | 'delivered' | 'read'>>({});
  const tempIdRef = useRef<number>(0);
  
  // keep latest messages for event handlers to avoid stale closures
  const messagesRef = useRef<(MessageDTO & { isMine?: boolean })[]>([]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  // Local cache of messages per conversation for instant switching
  const messageCacheRef = useRef<Record<string, (MessageDTO & { isMine?: boolean })[]>>({});
  const [threadLoading, setThreadLoading] = useState(false);
  const [composer, setComposer] = useState("");
  const [sending, setSending] = useState(false);
  // attachments composer state
  const [pendingAttachments, setPendingAttachments] = useState<{ url: string; mimeType?: string | null; size?: number | null }[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [me, setMe] = useState<UserRef | null>(null);
  
  // Initialize chat storage
  const chatStorage = useChatStorage({
    conversations,
    messages,
    activeConversationId: activeId,
    userId: me?.id || null
  });
  const listRef = useRef<HTMLDivElement>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [presenceUsers, setPresenceUsers] = useState<string[]>([]);
  // Reactions: messageId -> { emoji: userId[] }
  const [reactions, setReactions] = useState<Record<string, Record<string, string[]>>>({});
  const esRef = useRef<EventSource | null>(null);
  // Lightbox state for attachment previews
  const [lightbox, setLightbox] = useState<{ urls: string[]; index: number } | null>(null);
  // discover users state
  const [userQuery, setUserQuery] = useState("");
  const [discoverUsers, setDiscoverUsers] = useState<UserRef[]>([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [creatingConversation, setCreatingConversation] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [openReactionForMessage, setOpenReactionForMessage] = useState<string | null>(null);
  // Unread filter and pinned conversations
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  // My chat visibility setting
  const [myVisibility, setMyVisibility] = useState<"PUBLIC" | "PRIVATE" | null>(null);
  const [savingVisibility, setSavingVisibility] = useState(false);
  const [mobileListOpen, setMobileListOpen] = useState(false);
  const [mobileListSlide, setMobileListSlide] = useState(false);
  const touchStartXRef = useRef<number | null>(null);

  // Hide global site chrome (header/footer) for focused chat experience
  useEffect(() => {
    document.body.classList.add("hide-site-chrome");
    return () => { document.body.classList.remove("hide-site-chrome"); };
  }, []);

  // Animate mobile list sliding in when opened
  useEffect(() => {
    if (mobileListOpen) {
      const t = setTimeout(() => setMobileListSlide(true), 10);
      return () => clearTimeout(t);
    }
    setMobileListSlide(false);
  }, [mobileListOpen]);
  // Load pinned conversations from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("chat:pinned");
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setPinnedIds(arr.filter((x: any) => typeof x === "string"));
      }
    } catch {}
  }, []);
  // Persist pinned on change
  useEffect(() => {
    try {
      localStorage.setItem("chat:pinned", JSON.stringify(pinnedIds));
    } catch {}
  }, [pinnedIds]);
  function togglePin(conversationId: string) {
    setPinnedIds((prev) => {
      const isPinned = prev.includes(conversationId);
      if (isPinned) return prev.filter((id) => id !== conversationId);
      if (prev.length >= 3) return prev; // limit to 3 pinned
      return [...prev, conversationId];
    });
  }
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/session", { cache: "no-store" });
        const data = await res.json();
        if (data?.authenticated && data?.user) {
          setMe({ id: data.user.id, name: data.user.name, email: data.user.email });
        }
      } catch {}
    })();
  }, []);
  // Load my chat visibility
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/profile", { cache: "no-store" });
        if (!r.ok) return;
        const p = await r.json();
        if (p?.chatVisibility === "PUBLIC" || p?.chatVisibility === "PRIVATE") {
          setMyVisibility(p.chatVisibility);
        }
      } catch {}
    })();
  }, []);
  async function updateMyVisibility(next: "PUBLIC" | "PRIVATE") {
    try {
      setSavingVisibility(true);
      const r = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chatVisibility: next }) });
      if (!r.ok) throw new Error("Failed to update visibility");
      setMyVisibility(next);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingVisibility(false);
    }
  }
  // Load conversations list on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/chat/conversations?minimal=true", { cache: "no-store" });
        if (!res.ok) return;
        const list = await res.json();
        setConversations(Array.isArray(list) ? list : []);
        // Prefetch messages for top 3 recent conversations to speed up switching
        try {
          const prefetch = (Array.isArray(list) ? list : []).slice(0, 3);
          await Promise.all(
            prefetch.map((c: any) =>
              fetch(`/api/chat/messages?conversationId=${c.id}&take=20&noMarkRead=true`, { cache: "no-store" })
                .then((r) => r.ok ? r.json() : [])
                .then((msgs) => {
                  if (Array.isArray(msgs)) messageCacheRef.current[c.id] = msgs;
                })
                .catch(() => {})
            )
          );
        } catch {}
        // Auto-select the most recent conversation if none active
        if (!activeId && Array.isArray(list) && list.length > 0) {
          setActiveId(list[0].id);
        }
        // Background fetch full conversations (with unread counts) and merge
        try {
          const full = await fetch("/api/chat/conversations", { cache: "no-store" });
          if (full.ok) {
            const detailed = await full.json();
            if (Array.isArray(detailed)) {
              setConversations((prev) => {
                const prevById = Object.fromEntries(prev.map((c) => [c.id, c]));
                return detailed.map((c: any) => ({ ...prevById[c.id], ...c }));
              });
            }
          }
        } catch {}
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  useEffect(() => {
    if (!activeId) return;
    (async () => {
      try {
        const res = await fetch(`/api/chat/reactions?conversationId=${activeId}`);
        if (res.ok) {
          const initial = await res.json();
          setReactions(initial || {});
        }
      } catch (e) {
        console.error(e);
      }
    })();
    // Close any open per-message reaction picker when switching conversations
    setOpenReactionForMessage(null);
  }, [activeId]);

  // Load messages and subscribe to live updates when switching active conversation
  useEffect(() => {
    if (!activeId) return;
    setThreadLoading(true);
    // Show cached messages immediately for smoother UX
    const cachedInitial = messageCacheRef.current[activeId];
    if (cachedInitial) {
      setMessages(cachedInitial);
      setMessageStatus((prev) => {
        const next = { ...prev };
        cachedInitial.forEach((m) => { if (m.isMine && !next[m.id]) next[m.id] = 'sent'; });
        return next;
      });
      setTimeout(() => { listRef.current?.scrollTo({ top: listRef.current!.scrollHeight, behavior: "smooth" }); }, 10);
    }
  
    let cancelled = false;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/chat/messages?conversationId=${activeId}`, { cache: "no-store", signal: controller.signal });
        if (!res.ok) return;
        const list = await res.json();
        if (cancelled) return;
        setMessages(Array.isArray(list) ? list : []);
        // Update cache with fresh messages
        messageCacheRef.current[activeId] = Array.isArray(list) ? list : [];
        // Initialize status for my messages so ticks render at least as 'sent'
        setMessageStatus((prev) => {
          const next = { ...prev };
          (Array.isArray(list) ? list : []).forEach((m: any) => { if (m.isMine && !next[m.id]) next[m.id] = 'sent'; });
          return next;
        });
        setTimeout(() => { listRef.current?.scrollTo({ top: listRef.current!.scrollHeight, behavior: "smooth" }); }, 10);
      } catch (e) {
        if ((e as any)?.name !== 'AbortError') console.error(e);
      } finally {
        setThreadLoading(false);
      }
    })();
  
    // Reset and open EventSource stream for live updates
    try { esRef.current?.close(); } catch {}
    esRef.current = null;
    const es = new EventSource(`/api/chat/stream?conversationId=${activeId}`);
    
    es.onerror = (err) => {
      console.error('EventSource error:', err);
    };
  
    es.addEventListener('message:new', (ev: MessageEvent) => {
      try {
        const msg: any = JSON.parse(ev.data);
        setMessages((prev) => [...prev, { ...msg, isMine: msg?.sender?.id === me?.id }]);
        setConversations((prev) => prev.map((c) => (c.id === activeId ? { ...c, messages: [msg] } : c)));
        // Update cache with de-duplication (replace optimistic by clientId or skip if id exists)
        const cachePrev = messageCacheRef.current[activeId] || [];
        const optimisticIdx = cachePrev.findIndex((p: any) => p?.clientId && p.clientId === msg.clientId);
        const serverIdx = cachePrev.findIndex((p: any) => p.id === msg.id);
        let cacheNext = cachePrev;
        const asMine = msg?.sender?.id === me?.id;
        if (optimisticIdx !== -1) {
          cacheNext = [...cachePrev];
          cacheNext[optimisticIdx] = { ...msg, isMine: asMine };
          if (serverIdx !== -1 && serverIdx !== optimisticIdx) cacheNext.splice(serverIdx, 1);
        } else if (serverIdx === -1) {
          cacheNext = [...cachePrev, { ...msg, isMine: asMine }];
        }
        messageCacheRef.current[activeId] = cacheNext;
        // Do not downgrade existing delivered/read status; only set to 'sent' if not present
        setMessageStatus((prev) => { if (prev[msg.id]) return prev; return { ...prev, [msg.id]: 'sent' }; });
        setTimeout(() => { listRef.current?.scrollTo({ top: listRef.current!.scrollHeight, behavior: "smooth" }); }, 10);
      } catch (e) { console.error(e); }
    });
  
    es.addEventListener('receipt', (ev: MessageEvent) => {
      try {
        const payload: any = JSON.parse(ev.data);
        if (payload?.kind === 'delivered' && payload?.messageId) {
          setMessageStatus((prev) => { const current = prev[payload.messageId]; if (current === 'read') return prev; return { ...prev, [payload.messageId]: 'delivered' }; });
        }
        if (payload?.kind === 'read' && payload?.readUpTo) {
          const readTime = new Date(payload.readUpTo).getTime();
          setMessageStatus((prev) => {
            const next = { ...prev };
            messagesRef.current.forEach((m) => { if (m.isMine) { const mt = new Date(m.createdAt).getTime(); if (mt <= readTime) next[m.id] = 'read'; } });
            return next;
          });
        }
      } catch (e) { console.error(e); }
    });
  
    es.addEventListener('presence', (ev: MessageEvent) => {
      try { const d: any = JSON.parse(ev.data); if (Array.isArray(d?.userIds)) setPresenceUsers(d.userIds); } catch {}
    });
  
    es.addEventListener('typing', (ev: MessageEvent) => {
      try { const d: any = JSON.parse(ev.data); const userId: string | undefined = d?.userId; const typing: boolean = !!d?.typing; if (!userId || userId === me?.id) return; setTypingUsers((prev) => typing ? Array.from(new Set([...prev, userId])) : prev.filter((id) => id !== userId)); } catch {}
    });
  
    esRef.current = es;
  
    return () => { cancelled = true; controller.abort(); try { es.close(); } catch {}; esRef.current = null; setTypingUsers([]); };
  }, [activeId, me]);

  function otherParticipant(c: ConversationDTO): UserRef | null {
    if (!c || !Array.isArray(c.participants) || c.participants.length === 0) return null;
    // Prefer the first participant that has a valid user id
    const firstUser = (c.participants.find((p) => p?.user?.id)?.user) || c.participants[0]?.user || null;
    if (!me) return firstUser;
    const others = c.participants
      .map((p) => p?.user || null)
      .filter((u): u is UserRef => !!u && typeof u.id === "string" && u.id !== me.id);
    return others[0] || firstUser;
  }

  async function onSend() {
    const text = composer.trim();
    if (!activeId) return;
    if (!text && pendingAttachments.length === 0) return;
    // optimistic message push
    const clientId = `c-${Date.now()}-${tempIdRef.current++}`;
    const optimistic: any = {
      id: clientId,
      clientId,
      conversationId: activeId,
      sender: me!,
      text,
      createdAt: new Date().toISOString(),
      attachments: pendingAttachments,
    };
    const optimisticWithMine = { ...optimistic, isMine: true };
    setMessages((prev) => [...prev, optimisticWithMine]);
    // Update cache immediately with optimistic message
    messageCacheRef.current[activeId] = [...(messageCacheRef.current[activeId] || []), optimisticWithMine];
    setMessageStatus((prev) => ({ ...prev, [clientId]: 'sent' }));
    setComposer("");
    setPendingAttachments([]);
    setTimeout(() => { listRef.current?.scrollTo({ top: listRef.current!.scrollHeight, behavior: "smooth" }); }, 10);
    // Fire and reconcile without awaiting to keep UI snappy
    void fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: activeId, text, attachments: optimistic.attachments, clientId }),
    }).then(async (res) => {
      if (!res.ok) throw new Error("Failed to send message");
      const msg: any = await res.json();
      // Replace optimistic with actual if not yet replaced by SSE, and ensure no duplicates of same id remain
      setMessages((prev) => {
        const idx = prev.findIndex((p) => (p as any).clientId === clientId);
        const existingIdx = prev.findIndex((p) => p.id === msg.id);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = { ...msg, isMine: true };
          if (existingIdx !== -1 && existingIdx !== idx) next.splice(existingIdx, 1);
          return next;
        }
        if (existingIdx !== -1) return prev;
        return [...prev, { ...msg, isMine: true }];
      });
      // Preserve any existing status (delivered/read) and avoid downgrading to 'sent'
      setMessageStatus((prev) => {
        if (prev[msg.id] === 'delivered' || prev[msg.id] === 'read' || prev[msg.id] === 'sent') return prev;
        return { ...prev, [msg.id]: 'sent' };
      });
      setConversations((prev) => prev.map((c) => (c.id === activeId ? { ...c, messages: [msg] } : c)));
    }).catch((e) => {
      console.error(e);
      // optional: show error state or revert optimistic message
    });
  }

  // Fetch users for starting new chats
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setDiscoverLoading(true);
        const url = `/api/users?role=STUDENT${userQuery ? `&q=${encodeURIComponent(userQuery)}` : ""}`;
        const r = await fetch(url);
        if (!r.ok) throw new Error("Failed to load users");
        const users: UserRef[] = await r.json();
        if (active) setDiscoverUsers(users);
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setDiscoverLoading(false);
      }
    })();
    return () => { active = false; };
  }, [userQuery]);

  async function startConversationWith(userId: string) {
    try {
      setCreatingConversation(userId);
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantUserId: userId }),
      });
      if (!res.ok) throw new Error("Failed to create conversation");
      const created = await res.json();
      // refresh conversations and activate
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === created.id);
        const next = exists ? prev : [created, ...prev];
        return next;
      });
      setActiveId(created.id);
    } catch (e) {
      console.error(e);
    } finally {
      setCreatingConversation(null);
    }
  }
  // Remove separate private start; server decides based on recipient visibility
  async function startPrivateConversationWith(userId: string) {
    try {
      setCreatingConversation(userId);
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantUserId: userId }),
      });
      if (!res.ok) throw new Error("Failed to create conversation");
      const created = await res.json();
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === created.id);
        const next = exists ? prev : [created, ...prev];
        return next;
      });
      setActiveId(created.id);
      // Send private request as the first message
      void fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: created.id, text: "[PRIVATE_REQUEST]", clientId: `req-${Date.now()}` }),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setCreatingConversation(null);
    }
  }

  async function acceptPrivateRequest() {
    if (!activeId) return;
    try {
      const r = await fetch("/api/chat/conversations", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: activeId, action: "accept" }) });
      if (!r.ok) throw new Error("Failed to accept request");
      const updated = await r.json();
      setConversations((prev) => prev.map((c) => (c.id === updated.id ? { ...c, status: updated.status } : c)));
    } catch (e) {
      console.error(e);
    }
  }

  async function declinePrivateRequest() {
    if (!activeId) return;
    try {
      const r = await fetch("/api/chat/conversations", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: activeId, action: "decline" }) });
      if (!r.ok) throw new Error("Failed to decline request");
      const updated = await r.json();
      setConversations((prev) => prev.map((c) => (c.id === updated.id ? { ...c, status: updated.status } : c)));
    } catch (e) {
      console.error(e);
    }
  }

  const sidebar = (
    <div className="hidden md:block w-1/3 border-r border-gray-200 dark:border-gray-800 overflow-y-auto">
      <div className="p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Messages</h2>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1 text-sm">
            <input type="checkbox" checked={showUnreadOnly} onChange={(e) => setShowUnreadOnly(e.target.checked)} />
            <span>Unread</span>
          </label>
          <span className="text-xs text-gray-500">Pinned: {pinnedIds.length}/3</span>
          {/* My chat visibility control (separate from discover actions) */}
          <div className="flex items-center gap-1 text-xs">
            <span>Visibility:</span>
            <select
              className="border rounded px-1 py-0.5 text-xs dark:bg-gray-900 dark:border-gray-700"
              value={myVisibility ?? "PUBLIC"}
              onChange={(e) => updateMyVisibility(e.target.value as "PUBLIC" | "PRIVATE")}
              disabled={savingVisibility}
              title="Your chat visibility"
            >
              <option value="PUBLIC">Public</option>
              <option value="PRIVATE">Private</option>
            </select>
          </div>
          <Link href="/dashboard" className="text-sm text-blue-600">Back</Link>
        </div>
      </div>
      <ul>
        {(() => {
          const list = conversations
            .filter((c) => !showUnreadOnly || ((c.unreadCount || 0) > 0))
            .sort((a, b) => {
              const ap = pinnedIds.includes(a.id) ? 1 : 0;
              const bp = pinnedIds.includes(b.id) ? 1 : 0;
              if (ap !== bp) return bp - ap; // pinned first
              const at = new Date(a.messages?.[0]?.createdAt || 0).getTime();
              const bt = new Date(b.messages?.[0]?.createdAt || 0).getTime();
              return bt - at; // newest first
            });
          return list.map((c) => {
            const last = c.messages?.[0];
            const other = otherParticipant(c);
            const unread = c.unreadCount || 0;
            const isPinned = pinnedIds.includes(c.id);
            const isOtherOnline = other?.id ? presenceUsers.includes(other.id) : false;
            const lastPreview = (() => {
              if (!last) return "";
              const t = (last.text || "").trim();
              if (t) return t;
              const count = last.attachments?.length || 0;
              if (count > 0) return count === 1 ? "Photo" : `Photos (${count})`;
              return "";
            })();
            return (
              <li key={c.id} className="flex items-center justify-between">
                <button
                  className={`flex-1 text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900 ${activeId === c.id ? "bg-gray-100 dark:bg-gray-900" : ""}`}
                  onClick={() => setActiveId(c.id)}
                >
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gray-300 relative">
                      {unread > 0 && (
                        <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">{unread}</span>
                      )}
                      {isOtherOnline && (
                        <span className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white"></span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2">
                          {other?.name || other?.email}
                        </div>
                        {unread > 0 && <div className="text-xs text-blue-600 font-semibold">Unread</div>}
                      </div>
                      <div className={`text-sm truncate ${unread > 0 ? "font-semibold" : "text-gray-500"}`}>{lastPreview}</div>
                    </div>
                  </div>
                </button>
                <button
                  className={`px-2 text-xs ${isPinned ? "text-yellow-600" : "text-gray-500"}`}
                  title={isPinned ? "Unpin" : "Pin"}
                  onClick={() => togglePin(c.id)}
                >
                  {isPinned ? "★" : "☆"}
                </button>
              </li>
            );
          });
        })()}
      </ul>
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2 mb-2">
          <input
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder="Search dancers"
            className="flex-1 border rounded px-2 py-1 text-sm dark:bg-gray-900 dark:border-gray-700"
          />
        </div>
        <div className="text-xs text-gray-500 mb-2">Start a new chat</div>
        <div className="space-y-1">
          {discoverLoading && <div className="text-sm text-gray-500">Loading...</div>}
          {!discoverLoading && discoverUsers.length === 0 && (
            <div className="text-sm text-gray-500">No students found.</div>
          )}
          {discoverUsers.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-gray-300" />
                <div className="text-sm">
                  {u.name || u.email}
                  {u.chatVisibility && (
                    <span className="ml-2 text-[10px] px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600">{u.chatVisibility === "PRIVATE" ? "Private" : "Public"}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="text-xs px-2 py-1 rounded bg-blue-600 text-white disabled:opacity-50"
                  disabled={creatingConversation === u.id}
                  onClick={() => startConversationWith(u.id)}
                >
                  {creatingConversation === u.id ? "Starting..." : "Message"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const threadHeader = (() => {
    const c = conversations.find((x) => x.id === activeId);
    const other = c ? otherParticipant(c) : null;
    const otherOnline = other?.id ? presenceUsers.includes(other.id) : false;
    return (
      <div className="border-b border-gray-200 dark:border-gray-800 p-3 md:p-4 flex items-center gap-2 justify-between sticky top-0 md:bg-white md:text-inherit bg-[#075E54] text-white z-10">
        <div className="flex items-center gap-2">
          {/* Mobile: open chats list */}
          <button
            type="button"
            className="md:hidden mr-1 p-2 -ml-2 rounded-full hover:bg-white/10"
            onClick={() => setMobileListOpen(true)}
            aria-label="Open chats"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div className="h-8 w-8 rounded-full bg-gray-300 relative">
            {otherOnline && <span className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white"></span>}
          </div>
          <div className="font-semibold">{other?.name || other?.email || "Conversation"}</div>
        </div>
        <div className="text-xs md:text-gray-500 text-white/80 flex items-center gap-1">
          <span className={`inline-block h-2.5 w-2.5 rounded-full ${otherOnline ? "bg-green-500" : "bg-gray-400"}`}></span>
          {otherOnline ? "Online" : "Offline"}
        </div>
      </div>
    );
  })();

  const privateStatus = useMemo(() => {
    const c = conversations.find((x) => x.id === activeId);
    if (!c || !c.status || c.status === "ACTIVE") return { state: "none" as const };
    if (c.status === "REQUEST_DECLINED") return { state: "declined" as const, initiatorId: c.requestInitiatorId || undefined };
    if (c.status === "REQUEST_PENDING") return { state: "pending" as const, initiatorId: c.requestInitiatorId || undefined };
    return { state: "none" as const };
  }, [conversations, activeId]);

  // Group messages by day and consecutive sender
  const sections = useMemo(() => {
    const dayKey = (d: Date) => d.toISOString().slice(0, 10);
    const data = messages;
    const map: Record<string, (MessageDTO & { isMine?: boolean })[]> = {};
    for (const m of data) {
      const k = dayKey(new Date(m.createdAt));
      (map[k] ||= []).push(m);
    }
    const formatLabel = (k: string) => {
      const d = new Date(k);
      const today = new Date(); today.setHours(0,0,0,0);
      const yesterday = new Date(); yesterday.setDate(today.getDate() - 1); yesterday.setHours(0,0,0,0);
      const dk = new Date(d); dk.setHours(0,0,0,0);
      if (dk.getTime() === today.getTime()) return "Today";
      if (dk.getTime() === yesterday.getTime()) return "Yesterday";
      return d.toLocaleDateString();
    };
    return Object.entries(map).map(([k, items]) => {
      const groups: { isMine: boolean; items: MessageDTO[] }[] = [];
      for (const m of items) {
        const mine = !!m.isMine;
        const prev = groups[groups.length - 1];
        if (prev && prev.isMine === mine) prev.items.push(m);
        else groups.push({ isMine: mine, items: [m] });
      }
      return { dayKey: k, label: formatLabel(k), groups };
    });
  }, [messages]);

  const thread = (
    <div className="w-full md:w-2/3 flex flex-col h-screen md:h-full max-h-screen">
      {threadHeader}
      {privateStatus.state === "pending" && (
        <div className="bg-yellow-50 border-b border-yellow-200 text-yellow-800 text-sm px-4 py-2 flex items-center justify-between">
          <div>Private chat request pending.</div>
          {me && privateStatus.initiatorId && me.id !== privateStatus.initiatorId ? (
            <div className="flex gap-2">
              <button className="px-2 py-1 rounded bg-green-600 text-white" onClick={acceptPrivateRequest}>Accept</button>
              <button className="px-2 py-1 rounded bg-red-600 text-white" onClick={declinePrivateRequest}>Decline</button>
            </div>
          ) : (
            <div className="text-xs">Waiting for acceptance…</div>
          )}
        </div>
      )}
      {privateStatus.state === "declined" && (
        <div className="bg-red-50 border-b border-red-200 text-red-700 text-sm px-4 py-2">Private chat request was declined.</div>
      )}
      <div ref={listRef} className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 bg-[#ece5dd] min-h-0">
        {sections.map((section) => (
          <div key={section.dayKey}>
            <div className="text-center text-xs text-gray-500 my-2">{section.label}</div>
            {section.groups.map((g, idx) => (
              <div key={`${section.dayKey}-${idx}`} className={`flex ${g.isMine ? "justify-end" : "justify-start"} mb-2`}>
                <div className={`flex flex-col max-w-[80%] space-y-1 ${g.isMine ? "items-end" : "items-start"}`}>
                  {g.items.map((m) => (
                    <div key={m.id} className={`px-3 py-2 shadow ${g.isMine ? "bg-[#dcf8c6] text-black rounded-2xl rounded-tr-none" : "bg-white border border-gray-200 rounded-2xl rounded-tl-none"}`}>
                      {m.text && <div className="text-sm">{m.text}</div>}
                      {m.attachments && m.attachments.length > 0 && (
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {m.attachments.map((att, idx) => (
                            <button
                              key={att.url}
                              type="button"
                              className="block"
                              onClick={() => setLightbox({ urls: m.attachments!.map(a => a.url), index: idx })}
                            >
                              <img src={att.url} alt="attachment" className="rounded-lg max-h-40 object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                      {/* Reactions pills */}
                      {reactions[m.id] && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {Object.entries(reactions[m.id]).map(([emoji, userIds]) => (
                            <span
                              key={emoji}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${g.isMine ? "bg-white/20" : "bg-white"} ${userIds.includes(me?.id || "") ? "ring-1 ring-blue-400" : ""}`}
                            >
                              <span>{emoji}</span>
                              <span>{userIds.length}</span>
                            </span>
                          ))}
                        </div>
                      )}
                      {/* React button and emoji picker */}
                      <div className="mt-1 relative">
                        <button
                          type="button"
                          disabled={!me}
                          className={`text-xs ${g.isMine ? "text-white/80" : "text-gray-600"} hover:underline disabled:opacity-50`}
                          onClick={() => setOpenReactionForMessage((prev) => (prev === m.id ? null : m.id))}
                        >
                          React
                        </button>
                        {openReactionForMessage === m.id && (
                          <div className={`absolute ${g.isMine ? "right-0" : "left-0"} z-50`}>
                            {/* <Picker
                              data={data}
                              onEmojiSelect={(emoji: any) => {
                                const char = emoji.native || emoji.shortcodes || "";
                                const existing = reactions[m.id]?.[char] || [];
                                const mineId = me?.id || "";
                                const add = !existing.includes(mineId);
                                void fetch("/api/chat/reactions", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ conversationId: activeId, messageId: m.id, emoji: char, add }),
                                });
                                setOpenReactionForMessage(null);
                              }}
                              theme="light"
                            /> */}
                            <div>Emoji picker temporarily disabled</div>
                          </div>
                        )}
                      </div>
                      <div className={`${g.isMine ? "opacity-80" : "text-gray-500"} text-[11px] mt-1 flex items-center gap-1`}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {g.isMine && (
                          <span className="ml-1 inline-flex items-center">
                            {(() => {
                              const status = messageStatus[m.id];
                              if (status === "read") {
                                return (
                                  <span className="inline-flex items-center bg-orange-100 dark:bg-orange-900 rounded px-1" title="Read">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M1 14l4 4L14 5" stroke="#2563eb" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M8 14l4 4L21 5" stroke="#2563eb" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </span>
                                );
                              }
                              if (status === "delivered") {
                                return (
                                  <span className="inline-flex items-center" title="Delivered">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M1 14l4 4L14 5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M8 14l4 4L21 5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </span>
                                );
                              }
                              return (
                                <span className="inline-flex items-center" title="Sent">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 14l4 4L14 5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </span>
                              );
                            })()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="p-3 pb-[env(safe-area-inset-bottom)] border-t border-gray-200 dark:border-gray-800 bg-white shrink-0">
        {typingUsers.length > 0 && (
          <div className="px-2 pb-2 text-xs text-gray-500">{typingUsers.length === 1 ? "Typing..." : "Several people are typing..."}</div>
        )}
        {pendingAttachments.length > 0 && (
          <div className="px-2 pb-2 flex flex-wrap gap-2">
            {pendingAttachments.map((att, i) => (
              <div key={`${att.url}-${i}`} className="relative">
                <img src={att.url} alt="pending" className="h-16 w-16 object-cover rounded" />
                <button
                  type="button"
                  className="absolute -top-1 -right-1 bg-black/70 text-white text-xs rounded-full px-1"
                  onClick={() => setPendingAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-1 sm:gap-2 overflow-hidden">
          <button
            type="button"
            className="px-3 py-2 rounded-full border text-gray-600 shrink-0"
            onClick={() => setShowEmojiPicker((v) => !v)}
            title="Emoji"
          >
            😊
          </button>
          {showEmojiPicker && (
            <div className="relative">
              <div className="absolute bottom-12 right-0 z-40">
                {/* <Picker
                  data={data}
                  onEmojiSelect={(emoji: any) => {
                    const char = emoji.native || emoji.shortcodes || "";
                    setComposer((prev) => `${prev}${char}`);
                    setShowEmojiPicker(false);
                  }}
                  theme="light"
                /> */}
                <div className="bg-white border rounded p-4 shadow-lg">
                  Emoji picker temporarily disabled
                </div>
              </div>
            </div>
          )}
          <input
            value={composer}
            onChange={(e) => setComposer(e.target.value)}
            onFocus={() => activeId && fetch('/api/chat/stream', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversationId: activeId, typing: true }) })}
            onBlur={() => activeId && fetch('/api/chat/stream', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversationId: activeId, typing: false }) })}
            placeholder="Message..."
            className="flex-1 min-w-0 rounded-full px-4 py-2 bg-[#f0f0f0] border border-transparent focus:outline-none"
            disabled={privateStatus.state === "declined" || (privateStatus.state === "pending" && me && privateStatus.initiatorId && me.id !== privateStatus.initiatorId)}
          />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const files = e.target.files;
              if (!files || files.length === 0) return;
              if (!activeId) return;
              setUploading(true);
              try {
                const fd = new FormData();
                Array.from(files).forEach((f) => fd.append('files', f));
                const res = await fetch('/api/upload', { method: 'POST', body: fd });
                const data = await res.json();
                if (res.ok && Array.isArray(data.urls)) {
                  // Map urls to file metadata by order
                  const mapped = data.urls.map((url: string, idx: number) => {
                    const f = files.item(idx)!;
                    return { url, mimeType: f.type || null, size: f.size || null };
                  });
                  setPendingAttachments((prev) => [...prev, ...mapped]);
                }
                // reset input
                e.target.value = '';
              } catch (err) {
                console.error(err);
              } finally {
                setUploading(false);
              }
            }}
          />
          <button
            type="button"
            className="px-3 py-2 rounded-full border text-gray-600 shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            title="Attach images"
          >
            📎
          </button>
          <button
            onClick={onSend}
            disabled={
              uploading ||
              (!composer.trim() && pendingAttachments.length === 0) ||
              privateStatus.state === "declined" ||
              (privateStatus.state === "pending" && me && privateStatus.initiatorId && me.id !== privateStatus.initiatorId)
            }
            className="h-10 w-10 rounded-full bg-[#128C7E] text-white flex items-center justify-center disabled:opacity-50 shrink-0"
            title={(!composer.trim() && pendingAttachments.length === 0) ? "Voice" : "Send"}
          >
            {(!composer.trim() && pendingAttachments.length === 0) ? (
              <span>🎤</span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M3 20l18-8L3 4v6l12 2-12 2v6z"/></svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-dvh md:h-[calc(100vh-64px)] flex">
      {sidebar}
      {thread}
      {/* Mobile chats overlay */}
      {mobileListOpen && (
        <div
          className="fixed inset-0 z-50 bg-white"
          onClick={() => setMobileListOpen(false)}
        >
          <div
            className={`h-full w-full transform transition-transform duration-300 ease-out ${mobileListSlide ? "translate-x-0" : "-translate-x-full"}`}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => { touchStartXRef.current = e.touches[0]?.clientX ?? null; }}
            onTouchEnd={(e) => {
              const start = touchStartXRef.current;
              const endX = e.changedTouches[0]?.clientX ?? 0;
              if (start !== null && endX - start > 60) {
                setMobileListOpen(false);
              }
              touchStartXRef.current = null;
            }}
          >
            <div className="p-4 border-b bg-[#075E54] text-white flex items-center justify-between">
              <div className="font-semibold">Chats</div>
              <button className="p-2" onClick={() => setMobileListOpen(false)} aria-label="Close">✕</button>
            </div>
            <div className="overflow-y-auto">
              <ul>
                {conversations.map((c) => {
                  const last = c.messages?.[0];
                  const other = otherParticipant(c);
                  const lastPreview = (() => {
                    if (!last) return "";
                    const t = (last.text || "").trim();
                    if (t) return t;
                    const count = last.attachments?.length || 0;
                    if (count > 0) return count === 1 ? "Photo" : `Photos (${count})`;
                    return "";
                  })();
                  const time = last ? new Date(last.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";
                  return (
                    <li key={c.id}>
                      <button className="w-full text-left px-4 py-3 border-b hover:bg-gray-50" onClick={() => { setActiveId(c.id); setMobileListOpen(false); }}>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gray-300" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="font-medium truncate">{other?.name || other?.email}</div>
                              {time && <div className="text-[11px] text-gray-500 ml-2">{time}</div>}
                            </div>
                            <div className="text-xs text-gray-500 truncate">{lastPreview}</div>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}
      {lightbox && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setLightbox(null)}>
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.urls[lightbox.index]} alt="preview" className="max-h-[80vh] max-w-[80vw] object-contain" />
            <div className="absolute inset-x-0 -bottom-12 flex items-center justify-center gap-4">
              <button className="px-3 py-1 rounded bg-white/20 text-white" onClick={() => setLightbox((lb) => lb ? { ...lb, index: (lb.index - 1 + lb.urls.length) % lb.urls.length } : lb)}>Prev</button>
              <button className="px-3 py-1 rounded bg-white/20 text-white" onClick={() => setLightbox((lb) => lb ? { ...lb, index: (lb.index + 1) % lb.urls.length } : lb)}>Next</button>
              <button className="px-3 py-1 rounded bg-white/20 text-white" onClick={() => setLightbox(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}