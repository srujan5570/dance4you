"use client";

import { useEffect, useState } from "react";

export default function DesktopCityControl() {
  const [city, setCity] = useState<string>("Select City");

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

  function openCityModal() {
    window.dispatchEvent(new Event("open-city-selector"));
  }

  return (
    <button
      aria-label="Change city"
      className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-full border-2 border-[#167C36] text-[#167C36] hover:bg-[#167C36] hover:text-white transition-colors"
      onClick={openCityModal}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" />
      </svg>
      <span className="text-sm">{city}</span>
    </button>
  );
}