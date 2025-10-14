"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<{ authenticated: boolean; user?: { role?: string } } | null>(null);
  const [city, setCity] = useState<string>("Select City");
  const [mounted, setMounted] = useState(false);

  // Load session to determine role
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/session", { cache: "no-store" });
        const data = await res.json();
        setSession(data);
      } catch {}
    })();
  }, []);

  // Mark component mounted for safe portal rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Track saved city
  useEffect(() => {
    try {
      const raw = localStorage.getItem("userRegion");
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj?.city) setCity(String(obj.city));
      }
    } catch {}
    function onChange(e: Event) {
      try {
        const detail = (e as CustomEvent).detail as any;
        if (detail?.city) setCity(String(detail.city));
      } catch {}
    }
    window.addEventListener("user-region-changed", onChange);
    return () => window.removeEventListener("user-region-changed", onChange);
  }, []);

  // Close on ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Lock body scroll when menu is open (mobile UX improvement)
  useEffect(() => {
    const body = document.body;
    if (open) {
      body.style.overflow = "hidden";
      body.style.touchAction = "none";
    } else {
      body.style.overflow = "";
      body.style.touchAction = "";
    }
    return () => {
      body.style.overflow = "";
      body.style.touchAction = "";
    };
  }, [open]);

  // Close when route changes (optional enhancement)
  // We simply close on link click handlers below to keep it lightweight.

  function openCityModal() {
    window.dispatchEvent(new Event("open-city-selector"));
  }

  return (
    <div className="md:hidden relative flex items-center gap-2">
      <button
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="mobile-nav-drawer"
        className="p-2 border rounded-full"
        onClick={() => setOpen((v) => !v)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
          <path d="M3 6h18v2H3Zm0 5h18v2H3Zm0 5h18v2H3Z" />
        </svg>
      </button>

      {/* Location change button */}
      <button
        aria-label="Change city"
        className="px-3 py-2 rounded-full border-2 border-[#167C36] text-[#167C36] inline-flex items-center gap-2 hover:bg-[#167C36] hover:text-white transition-colors"
        onClick={openCityModal}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
          <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" />
        </svg>
        <span className="text-sm">{city}</span>
      </button>

      {/* Backdrop + Drawer via portal: ensures full-viewport coverage and reliable outside tap close */}
      {open && (mounted ? createPortal(
        <div
          className="fixed inset-0 z-[1000] pointer-events-auto"
          onClick={() => setOpen(false)}
          onTouchStart={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div
            id="mobile-nav-drawer"
            role="dialog"
            aria-modal="true"
            className={`absolute top-0 right-0 h-dvh w-72 max-w-[90vw] bg-white border-l border-black/10 shadow-2xl transform transition-transform duration-200 ${open ? "translate-x-0" : "translate-x-full"}`}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-black/10 flex items-center justify-between bg-white">
              <span className="text-sm font-semibold" style={{ color: "#167C36" }}>Menu</span>
              <button aria-label="Close" className="p-2" onClick={() => setOpen(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
                  <path d="M6.225 4.811 4.811 6.225 10.586 12l-5.775 5.775 1.414 1.414L12 13.414l5.775 5.775 1.414-1.414L13.414 12l5.775-5.775-1.414-1.414L12 10.586z" />
                </svg>
              </button>
            </div>
            <nav className="flex flex-col p-4 text-sm text-gray-800 bg-white h-full overflow-y-auto" style={{ maxHeight: "calc(100dvh - 56px)" }}>
              <button className="py-2 text-left hover:underline inline-flex items-center gap-2" onClick={() => { setOpen(false); openCityModal(); }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z"/></svg>
                Change City ({city})
              </button>
              <Link href="/" className="py-2 hover:underline" onClick={() => setOpen(false)} style={{ color: "#167C36" }}>Home</Link>
              {session && session.authenticated && (
                <Link href="/chat" className="py-2 hover:underline" onClick={() => setOpen(false)} style={{ color: "#167C36" }}>Chat</Link>
              )}
              <Link href="/learn-live" className="py-2 hover:underline" onClick={() => setOpen(false)} style={{ color: "#167C36" }}>Learn &amp; Live</Link>
              <Link href="/events" className="py-2 hover:underline" onClick={() => setOpen(false)} style={{ color: "#167C36" }}>Book Online</Link>
              {session && session.user?.role === "STUDIO_OWNER" && (
                <Link href="/submit-event" className="py-2 hover:underline" onClick={() => setOpen(false)} style={{ color: "#167C36" }}>Submit Event</Link>
              )}
            </nav>
          </div>
        </div>, document.body) : null)}
    </div>
  );
}