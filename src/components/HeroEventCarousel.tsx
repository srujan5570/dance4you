"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { cleanCity } from "@/lib/cityUtils";

type EventItem = {
  id: string;
  title: string;
  city: string;
  date: string;
  category: string;
  image: string;
  poster4x3?: string;
  posterUrls?: string[];
  posterDetail?: string;
  locationLat?: number | null;
  locationLng?: number | null;
  description?: string;
  venue?: string;
};

type Region = {
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
};

function getSavedRegion(): Region | null {
  try {
    const raw = localStorage.getItem("userRegion");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function HeroEventCarousel() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Track user's selected city
  useEffect(() => {
    const saved = getSavedRegion();
    if (saved?.city) setSelectedCity(cleanCity(saved.city));
    
    function onRegionChanged(e: Event) {
      try {
        const detail = (e as CustomEvent).detail as Region;
        if (detail?.city) setSelectedCity(cleanCity(detail.city));
      } catch {}
    }
    
    window.addEventListener("user-region-changed", onRegionChanged as EventListener);
    return () => window.removeEventListener("user-region-changed", onRegionChanged as EventListener);
  }, []);

  // Fetch events based on selected city
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        
        if (selectedCity) {
          // If city is selected, get events from that city
          params.set("city", selectedCity);
          params.set("cityExact", "true");
        }
        // If no city selected, we'll get events from multiple cities (default API behavior)
        
        const url = `/api/events${params.toString() ? `?${params.toString()}` : ""}`;
        const res = await fetch(url, { cache: "no-store" });
        const data = await res.json();
        
        // Get upcoming events (future dates) and limit to 6 for carousel
        const today = new Date().toISOString().split('T')[0];
        const upcomingEvents = (data || [])
          .filter((event: EventItem) => event.date >= today)
          .sort((a: EventItem, b: EventItem) => a.date.localeCompare(b.date))
          .slice(0, 6);
          
        setEvents(upcomingEvents);
      } catch (error) {
        console.error("Failed to load events:", error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedCity]);

  // Auto-slide functionality
  useEffect(() => {
    if (events.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % events.length);
    }, 5000); // Change slide every 5 seconds
    
    return () => clearInterval(interval);
  }, [events.length]);

  const getEventImage = (event: EventItem) => {
    return event.posterDetail || 
           (event.posterUrls && event.posterUrls.length > 0 ? event.posterUrls[1] : null) || 
           event.poster4x3 || 
           event.image || 
           "/hero-placeholder.svg";
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % events.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + events.length) % events.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  if (loading) {
    return (
      <div className="relative h-[500px] bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading events...</p>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="relative h-[500px] bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 flex items-center justify-center">
        <div className="text-white text-center max-w-2xl mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Dance Events {selectedCity && `in ${selectedCity}`}
          </h1>
          <p className="text-xl mb-8 opacity-90">
            {selectedCity 
              ? `No upcoming events found in ${selectedCity}. Try selecting a different city or check back later.`
              : "Discover amazing dance events happening around you"
            }
          </p>
          <Link
            href="/events"
            className="inline-block bg-white text-orange-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
          >
            Browse All Events
          </Link>
        </div>
      </div>
    );
  }

  const currentEvent = events[currentSlide];

  return (
    <div className="relative h-[300px] overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-in-out"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url(${getEventImage(currentEvent)})`
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl text-white">
            {/* City Badge */}
            {selectedCity && (
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20ZM11 6h2v6h-2V6Zm0 8h2v2h-2v-2Z"/>
                </svg>
                <span className="text-sm font-medium">Events in {selectedCity}</span>
              </div>
            )}
            
            {/* Event Title */}
            <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
              {currentEvent.title}
            </h1>
            
            {/* Event Details */}
            <div className="flex flex-wrap items-center gap-4 mb-6 text-lg">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20ZM11 6h2v6h-2V6Zm0 8h2v2h-2v-2Z"/>
                </svg>
                <span>{currentEvent.city}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                </svg>
                <span>{new Date(currentEvent.date).toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })}</span>
              </div>
              
              <div className="bg-orange-500 px-3 py-1 rounded-full text-sm font-medium">
                {currentEvent.category.replace('_', ' ')}
              </div>
            </div>
            
            {/* Description */}
            {currentEvent.description && (
              <p className="text-lg mb-8 opacity-90 line-clamp-2">
                {currentEvent.description}
              </p>
            )}
            
            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <Link
                href={`/events/${currentEvent.id}`}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full font-semibold transition-colors"
              >
                View Details
              </Link>
              <Link
                href={`/events/${currentEvent.id}/book`}
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border border-white/30 px-8 py-3 rounded-full font-semibold transition-colors"
              >
                Book Now
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation Arrows */}
      {events.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-3 rounded-full transition-colors"
            aria-label="Previous event"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-3 rounded-full transition-colors"
            aria-label="Next event"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
              <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
            </svg>
          </button>
        </>
      )}
      
      {/* Dots Indicator */}
      {events.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {events.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide 
                  ? 'bg-white' 
                  : 'bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
      
      {/* Event Counter */}
      {events.length > 1 && (
        <div className="absolute top-6 right-6 z-20 bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
          {currentSlide + 1} / {events.length}
        </div>
      )}
    </div>
  );
}