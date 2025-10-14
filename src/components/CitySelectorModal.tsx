"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getUserLocation } from "../lib/geolocation";

type Region = {
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
};

function saveUserRegion(region: Region) {
  try {
    localStorage.setItem("userRegion", JSON.stringify(region));
    // notify other parts of app
    window.dispatchEvent(new CustomEvent("user-region-changed", { detail: region }));
  } catch {}
}

function getSavedRegion(): Region | null {
  try {
    const raw = localStorage.getItem("userRegion");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function reverseGeocode(lat: number, lon: number): Promise<Region> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const res = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!res.ok) throw new Error("reverse geocode failed");
    const data = await res.json();
    const city = data?.address?.city || data?.address?.town || data?.address?.village || data?.address?.county;
    const state = data?.address?.state;
    const country = data?.address?.country;
    return { city, state, country, latitude: lat, longitude: lon };
  } catch {
    return { latitude: lat, longitude: lon };
  }
}

const POPULAR_CITIES: Array<{ label: string }> = [
  { label: "Mumbai" },
  { label: "Delhi-NCR" },
  { label: "Bengaluru" },
  { label: "Hyderabad" },
  { label: "Ahmedabad" },
  { label: "Chandigarh" },
  { label: "Chennai" },
  { label: "Pune" },
  { label: "Kolkata" },
  { label: "Kochi" },
];

// City icon components
function CityIcon({ name }: { name: string }) {
  switch (name) {
    case "Mumbai":
      // Gateway of India
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="h-8 w-8 text-black/60">
          <path d="M8 48h48v4H8z" fill="currentColor" />
          <path d="M16 48V34h8v14m16 0V34h8v14" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M24 34c0-6 4-10 8-10s8 4 8 10" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M28 40h8v8h-8z" fill="currentColor" />
        </svg>
      );
    case "Delhi-NCR":
      // India Gate stylized
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="h-8 w-8 text-black/60">
          <path d="M20 48h24v4H20z" fill="currentColor" />
          <path d="M24 48V24h16v24" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M22 24h20l-4-6H26l-4 6z" fill="currentColor" />
          <circle cx="32" cy="32" r="4" fill="currentColor" />
        </svg>
      );
    case "Bengaluru":
      // Vidhana Soudha-esque dome
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="h-8 w-8 text-black/60">
          <path d="M16 48h32v4H16z" fill="currentColor" />
          <path d="M20 48V36h24v12" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M24 36c0-5 4-8 8-8s8 3 8 8" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="32" cy="26" r="3" fill="currentColor" />
        </svg>
      );
    case "Hyderabad":
      // Charminar stylized
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="h-8 w-8 text-black/60">
          <path d="M14 48h36v4H14z" fill="currentColor" />
          <path d="M18 48V30h8v18M38 48V30h8v18" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M26 36h12v12H26z" fill="currentColor" />
          <path d="M18 28l8-4 8 4 8-4 4 2" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      );
    case "Ahmedabad":
      // Sabarmati Ashram motif
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="h-8 w-8 text-black/60">
          <path d="M12 48h40v4H12z" fill="currentColor" />
          <path d="M16 48V34l16-10 16 10v14" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M24 40h8v8h-8zM36 40h8v8h-8z" fill="currentColor" />
        </svg>
      );
    case "Chandigarh":
      // Open Hand monument stylized
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="h-8 w-8 text-black/60">
          <path d="M32 16c6 0 10 4 10 8s-4 6-8 6h-2v10h-4V30c-6-1-10-4-10-8s6-6 14-6z" fill="currentColor" />
          <path d="M30 40v12" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case "Chennai":
      // Temple gopuram
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="h-8 w-8 text-black/60">
          <path d="M16 48h32v4H16z" fill="currentColor" />
          <path d="M20 48V40h24v8M22 40v-6h20v6M24 34v-6h16v6M26 28v-6h12v6" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      );
    case "Pune":
      // Fort/arch
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="h-8 w-8 text-black/60">
          <path d="M16 48h32v4H16z" fill="currentColor" />
          <path d="M20 48V34h8v6h8v-6h8v14" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M28 34a4 4 0 0 1 8 0" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      );
    case "Kolkata":
      // Victoria Memorial dome
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="h-8 w-8 text-black/60">
          <path d="M14 48h36v4H14z" fill="currentColor" />
          <path d="M18 48V36h28v12" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M24 36c0-5 4-8 8-8s8 3 8 8" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="32" cy="26" r="3" fill="currentColor" />
        </svg>
      );
    case "Kochi":
      // Chinese fishing nets
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="h-8 w-8 text-black/60">
          <path d="M12 48h40v4H12z" fill="currentColor" />
          <path d="M16 48l12-20 12 20M28 28l16-6" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      );
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-8 w-8 text-black/60" fill="currentColor">
          <path d="M12 3c4.971 0 9 4.029 9 9s-4.029 9-9 9-9-4.029-9-9 4.029-9 9-9Z" />
        </svg>
      );
  }
}

/* Removed duplicate top-level handlers; these are defined inside the component scope below. */
export default function CitySelectorModal() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ city: string; state?: string; lat?: number; lon?: number }>>([]);

  // Show on first visit if region not saved
  useEffect(() => {
    const saved = getSavedRegion();
    if (!saved) setOpen(true);
  }, []);

  // Keep track of saved city and react to changes
  useEffect(() => {
    const saved = getSavedRegion();
    if (saved?.city) setSelectedCity(saved.city);
    function onRegionChanged(e: Event) {
      try {
        const detail = (e as CustomEvent).detail as Region;
        if (detail?.city) setSelectedCity(detail.city);
      } catch {}
    }
    window.addEventListener("user-region-changed", onRegionChanged as EventListener);
    return () => window.removeEventListener("user-region-changed", onRegionChanged as EventListener);
  }, []);

  // Listen for external open requests
  useEffect(() => {
    function onOpen() { setOpen(true); }
    window.addEventListener("open-city-selector", onOpen as EventListener);
    return () => window.removeEventListener("open-city-selector", onOpen as EventListener);
  }, []);

  const filteredPopular = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return POPULAR_CITIES;
    return POPULAR_CITIES.filter((c) => c.label.toLowerCase().includes(q));
  }, [search]);

  // Legacy suggestions effect removed. Using fast city+state suggestions below.
  // Fast debounced suggestions (city + state) while typing
  useEffect(() => {
    const q = search.trim();
    if (q.length < 1) { setSuggestions([]); return; }

    // Quick local suggestions (India-only) shown immediately
    const lower = q.toLowerCase();
    const QUICK = Array.from(new Set([
      ...POPULAR_CITIES.map((c) => c.label),
      "Bengaluru","Bangalore","Delhi","Hyderabad","Chennai","Kolkata","Pune","Ahmedabad","Kochi","Noida","Gurugram","Coimbatore","Indore","Jaipur","Lucknow","Surat","Vadodara","Nagpur","Visakhapatnam","Vijayawada","Mysuru","Mangalore","Thiruvananthapuram","Madurai","Varanasi","Patna","Bhopal","Ranchi","Raipur","Siliguri","Guwahati","Agra","Kanpur","Meerut","Warangal","Kozhikode","Thrissur"
    ]));
    const localMatches = QUICK
      .filter((name) => name.toLowerCase().includes(lower))
      .map((name) => ({ city: name.toLowerCase() === "bangalore" ? "Bengaluru" : name }));
    if (localMatches.length > 0) {
      setSuggestions(localMatches.slice(0, 8));
    }

    const controller = new AbortController();
    const handle = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?countrycodes=IN&q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=8`,
          { headers: { Accept: "application/json" }, signal: controller.signal }
        );
        const data = await res.json();
        const unique = new Map<string, { city: string; state?: string; lat?: number; lon?: number }>();
        if (Array.isArray(data)) {
          for (const item of data) {
            const addr = (item as any)?.address || {};
            const type = (item as any)?.type;
            const cls = (item as any)?.class;
            const countryCode = addr.country_code || "";
            if (countryCode && countryCode.toLowerCase() !== "in") continue;
            const city = addr.city || addr.town || addr.village || (item as any)?.name || String((item as any)?.display_name || "").split(",")[0].trim();
            const state = addr.state || addr.county;
            if (!city) continue;
            if (cls === "place" && (type === "city" || type === "town" || type === "village")) {
              const key = `${String(city).toLowerCase()}|${String(state || "").toLowerCase()}`;
              if (!unique.has(key)) {
                unique.set(key, { city: String(city), state: state ? String(state) : undefined, lat: parseFloat((item as any)?.lat), lon: parseFloat((item as any)?.lon) });
              }
            }
          }
        }
        // Merge with local matches while preserving order and uniqueness
        const merged = [...localMatches, ...Array.from(unique.values())];
        const seen = new Set<string>();
        const final = merged.filter((s) => {
          const k = `${s.city.toLowerCase()}|${(s.state || "").toLowerCase()}`;
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        }).slice(0, 8);
        setSuggestions(final);
      } catch {
        // ignore aborts/errors
      } finally {
        setSearching(false);
      }
    }, 100);
    return () => { controller.abort(); clearTimeout(handle); };
  }, [search]);

  async function onDetect() {
    setError(null);
    setDetecting(true);
    try {
      const coords = await getUserLocation();
      const region = await reverseGeocode(coords.latitude, coords.longitude);
      saveUserRegion(region);
      if (region.city) setSelectedCity(region.city);
      setOpen(false);
    } catch (e: any) {
      setError(e?.message || "Unable to detect location");
    } finally {
      setDetecting(false);
    }
  }

  async function onSearch() {
    const q = search.trim();
    if (!q) { setSearchResults([]); return; }
    try {
      setSearching(true);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?countrycodes=IN&q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=8`, { headers: { Accept: "application/json" } });
      const data = await res.json();
      setSearchResults(Array.isArray(data) ? data.slice(0, 8) : []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  function chooseCity(label: string) {
    saveUserRegion({ city: label, country: "India" });
    setSelectedCity(label);
    setOpen(false);
  }

  async function chooseSearchResult(item: { display_name: string; lat: string; lon: string }) {
    const lat = parseFloat(item.lat); const lon = parseFloat(item.lon);
    const region = await reverseGeocode(lat, lon);
    if (!region.city) {
      // try to infer city from display_name
      const cityCandidate = item.display_name.split(",")[0].trim();
      region.city = cityCandidate;
    }
    saveUserRegion(region);
    if (region.city) setSelectedCity(region.city);
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* modal */}
      <div className="absolute left-1/2 top-20 -translate-x-1/2 w-[95%] sm:w-[820px] max-h-[80vh] rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-[#f97316]"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20ZM11 6h2v6h-2V6Zm0 8h2v2h-2v-2Z"/></svg>
          <div className="font-semibold">Select your city</div>
          <button className="ml-auto p-2 cursor-pointer hover:opacity-80" aria-label="Close" onClick={() => setOpen(false)}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M6.225 4.811 4.811 6.225 10.586 12l-5.775 5.775 1.414 1.414L12 13.414l5.775 5.775 1.414-1.414L13.414 12l5.775-5.775-1.414-1.414L12 10.586z"/></svg>
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          {/* search input */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") onSearch(); }}
                placeholder="Search for your city"
                className="w-full rounded-xl border border-black/10 bg-white/60 px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              {search && (
                <button
                  onClick={() => { setSearch(""); setSuggestions([]); setSearchResults([]); }}
                  aria-label="Clear"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-gray-600 hover:bg-black/5 cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M6.225 4.811 4.811 6.225 10.586 12l-5.775 5.775 1.414 1.414L12 13.414l5.775 5.775 1.414-1.414L13.414 12l5.775-5.775-1.414-1.414L12 10.586z"/></svg>
                </button>
              )}
              {suggestions.length > 0 && (
                <div className="absolute z-10 left-0 right-0 mt-2 rounded-xl border border-black/10 bg-white shadow-lg">
                  <ul className="py-1">
                    {suggestions.map((s) => (
                      <li key={`${s.city}-${s.state || ""}`}>
                        <button onClick={() => chooseCity(s.city)} className="w-full text-left px-3 py-2 text-sm hover:bg-black/5 cursor-pointer">
                          {s.city}{s.state ? `, ${s.state}` : ""}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* detect my location */}
          <div className="mt-3">
            <button onClick={onDetect} disabled={detecting} className="inline-flex items-center gap-2 text-[#f97316] hover:text-[#ea580c] text-sm font-medium cursor-pointer disabled:opacity-60">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12 2a1 1 0 0 1 1 1v2.062a7 7 0 0 1 6.938 6.938H22a1 1 0 1 1 0 2h-2.062A7 7 0 0 1 13 18.938V21a1 1 0 1 1-2 0v-2.062A7 7 0 0 1 4.062 12H2a1 1 0 1 1 0-2h2.062A7 7 0 0 1 11 5.062V3a1 1 0 0 1 1-1Zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z"/></svg>
              Detect my location
              {detecting && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#f97316" strokeWidth="2" opacity="0.25"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="#f97316" strokeWidth="2" />
                </svg>
              )}
            </button>
            {error && <div className="mt-2 text-xs text-red-600">{error}</div>}
          </div>

          {/* search results */}
          {searchResults.length > 0 && (
            <div className="mt-4">
              <div className="text-xs opacity-70 mb-2">Search results</div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {searchResults.map((item, idx) => (
                  <li key={idx}>
                    <button onClick={() => chooseSearchResult(item)} className="w-full text-left px-3 py-2 rounded-lg border border-black/10 hover:bg-black/5 text-sm">
                      {item.display_name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* popular cities */}
          <div className="mt-6">
            <div className="text-center font-semibold">Popular Cities</div>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-4">
              {filteredPopular.map((c) => {
                const isSelected = selectedCity?.toLowerCase() === c.label.toLowerCase();
                return (
                  <button key={c.label} onClick={() => chooseCity(c.label)} className={`group flex flex-col items-center p-3 rounded-xl border cursor-pointer ${isSelected ? "border-[#167C36] bg-[#167C36]/5" : "border-black/10 hover:border-[#f97316] hover:bg-black/5"}`}>
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center mb-2 ${isSelected ? "bg-[#167C36]/10 ring-2 ring-[#167C36]" : "bg-black/5"}`}>
                      <CityIcon name={c.label} />
                    </div>
                    <div className={`text-sm ${isSelected ? "text-[#167C36] font-semibold" : ""}`}>{c.label}</div>
                  </button>
                );
              })}
            </div>
            {/* toggle all cities list */}
            <div className="mt-4 text-center">
              <AllCitiesToggle onSelect={chooseCity} selectedCity={selectedCity} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Collapsible list of many other cities (basic sample list)
function AllCitiesToggle({ onSelect, selectedCity }: { onSelect: (label: string) => void; selectedCity?: string | null }) {
  const [show, setShow] = useState(false);
  const OTHER = useMemo(
    () => [
      "Aalo","Adalaj","Adilabad","Agartala","Agra","Ahmedgarh","Ajmer","Akola","Alibaug","Allahabad","Alappuzha","Alwar","Ambala","Amethi","Amritsar","Anand","Anantapur","Aurangabad","Badami","Balasore","Ballari","Bareilly","Bathinda","Belagavi","Berhampur","Bhagalpur","Bharuch","Bhopal","Bhubaneswar","Bijapur","Bilaspur","Bokaro","Calicut","Chamba","Chandrapur","Coimbatore","Cuttack","Darjeeling","Dehradun","Dhanbad","Dharwad","Dibrugarh","Durg","Erode","Faridabad","Gandhinagar","Gaya","Ghaziabad","Gorakhpur","Guntur","Guwahati","Gwalior","Haldwani","Hazaribagh","Hisar","Howrah","Imphal","Indore","Itanagar","Jabalpur","Jaipur","Jalandhar","Jammu","Jamshedpur","Jhansi","Jodhpur","Junagadh","Kadapa","Kakinada","Kalaburagi","Kanpur","Karimnagar","Karnal","Katihar","Kavaratti","Khammam","Kharagpur","Kochi","Kodaikanal","Kohima","Kolhapur","Kolkata","Kollam","Korba","Kota","Kottayam","Kozhikode","Kurnool","Kurukshetra","Latur","Lucknow","Ludhiana","Madurai","Mahabubnagar","Mangalore","Mathura","Meerut","Moradabad","Muzaffarpur","Mysuru","Nadiad","Nagpur","Nainital","Nanded","Nashik","Navi Mumbai","Noida","Ongole","Palakkad","Panaji","Patiala","Patna","Pondicherry","Prayagraj","Pune","Puri","Raipur","Rajahmundry","Rajkot","Ranchi","Rourkela","Sagar","Salem","Sangli","Satara","Secunderabad","Shillong","Shimla","Sikar","Siliguri","Solapur","Srinagar","Surat","Thane","Thanjavur","Thiruvananthapuram","Thrissur","Tiruchirappalli","Tirunelveli","Tirupati","Tumakuru","Udaipur","Udupi","Ujjain","Vadodara","Varanasi","Vijayawada","Visakhapatnam","Warangal","Yamunanagar"
    ],
    []
  );
  return (
    <div>
      {!show ? (
        <button className="text-[#f97316] text-sm" onClick={() => setShow(true)}>View All Cities</button>
      ) : (
        <div>
          <div className="text-center font-medium mb-3">Other Cities</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-gray-700">
            {OTHER.map((name) => (
              <button key={name} onClick={() => onSelect(name)} className={`text-left hover:text-[#f97316] cursor-pointer ${selectedCity && selectedCity.toLowerCase() === name.toLowerCase() ? "text-[#167C36] font-semibold" : ""}`}>{name}</button>
            ))}
          </div>
          <button className="mt-3 text-[#f97316] text-sm" onClick={() => setShow(false)}>Hide all cities</button>
        </div>
      )}
    </div>
  );
}