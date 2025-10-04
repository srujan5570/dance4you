"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  // Close on ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Close when route changes (optional enhancement)
  // We simply close on link click handlers below to keep it lightweight.

  return (
    <div className="md:hidden relative">
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

      {/* Overlay */}
      {open && (
        <button
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/50"
        />
      )}

      {/* Drawer */}
      <div
        id="mobile-nav-drawer"
        role="dialog"
        aria-modal="true"
        className={`fixed top-0 right-0 z-50 h-full w-64 bg-white border-l shadow-xl transform transition-transform duration-200 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <span className="text-sm font-semibold" style={{ color: "#167C36" }}>Menu</span>
          <button aria-label="Close" className="p-2" onClick={() => setOpen(false)}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
              <path d="M6.225 4.811 4.811 6.225 10.586 12l-5.775 5.775 1.414 1.414L12 13.414l5.775 5.775 1.414-1.414L13.414 12l5.775-5.775-1.414-1.414L12 10.586z" />
            </svg>
          </button>
        </div>
        <nav className="flex flex-col p-4 text-sm italic" style={{ color: "#167C36" }}>
          <Link href="/" className="py-2 hover:underline" onClick={() => setOpen(false)}>Home</Link>
          <Link href="/learn-live" className="py-2 hover:underline" onClick={() => setOpen(false)}>Learn &amp; Live</Link>
          <Link href="/events" className="py-2 hover:underline" onClick={() => setOpen(false)}>Book Online</Link>
          <Link href="/submit-event" className="py-2 hover:underline" onClick={() => setOpen(false)}>Submit Event</Link>
        </nav>
      </div>
    </div>
  );
}