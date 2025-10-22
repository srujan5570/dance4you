"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";

const pinIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Custom icon for user location
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

type EventItem = {
  id: string;
  title: string;
  city: string;
  date: string;
  style: "Indian" | "Western";
  image: string;
  poster4x3?: string;
  posterUrls?: string[];
  posterDetail?: string;
  locationLat?: number | null;
  locationLng?: number | null;
  _distanceKm?: number | null;
};

export default function EventsMap({ 
  events, 
  userLat, 
  userLng,
  selectedEventId,
  onSelectEvent
}: { 
  events: EventItem[];
  userLat: number | null;
  userLng: number | null;
  selectedEventId: string | null;
  onSelectEvent: (id: string) => void;
}) {
  // Find the selected event
  const selectedEvent = events.find(e => e.id === selectedEventId);
  
  // Calculate center of the map
  const center: [number, number] = userLat && userLng 
    ? [userLat, userLng] 
    : [17.3850, 78.4867]; // Default center if user location not available
  
  // Route coordinates for the selected event
  const routeCoordinates = selectedEvent && userLat && userLng && 
    selectedEvent.locationLat && selectedEvent.locationLng
    ? [
        [userLat, userLng],
        [selectedEvent.locationLat, selectedEvent.locationLng]
      ] as [number, number][]
    : null;

  return (
    <MapContainer center={center} zoom={10} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* User location marker */}
      {userLat && userLng && (
        <Marker position={[userLat, userLng]} icon={userIcon}>
          <Popup>Your location</Popup>
        </Marker>
      )}
      
      {/* Event markers */}
      {events.map((event) => {
        if (!event.locationLat || !event.locationLng) return null;
        
        return (
          <Marker 
            key={event.id} 
            position={[event.locationLat, event.locationLng]} 
            icon={pinIcon}
            eventHandlers={{
              click: () => onSelectEvent(event.id)
            }}
          >
            <Popup>
              <div className="min-w-[200px] max-w-[250px]">
                {/* Event Image */}
                <div className="relative h-24 w-full mb-3 rounded-lg overflow-hidden bg-gradient-to-br from-orange-400 to-pink-500">
                  <img 
                    src={event.poster4x3 || (Array.isArray(event.posterUrls) && event.posterUrls.length > 0 ? event.posterUrls[0] : event.image) || "/hero-placeholder.svg"} 
                    alt={event.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      // Try fallback images in order
                      if (target.src !== "/hero-placeholder.svg") {
                        target.src = "/hero-placeholder.svg";
                      }
                    }}
                  />
                  {/* Style badge */}
                  <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-medium">
                    {event.style}
                  </div>
                </div>
                
                {/* Event Details */}
                <div className="space-y-2">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base leading-tight">{event.title}</h3>
                    <div className="flex items-center gap-1 text-gray-600 text-sm mt-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      {event.city}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-gray-600">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      {new Date(event.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    {event._distanceKm && (
                      <div className="flex items-center gap-1 text-orange-600 font-medium">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        {event._distanceKm.toFixed(1)} km
                      </div>
                    )}
                  </div>
                  
                  <a 
                    href={`/events/${event.id}`}
                    className="block w-full text-center bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    View Details →
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
      
      {/* Route line between user and selected event */}
      {routeCoordinates && (
        <Polyline 
          positions={routeCoordinates}
          color="#f97316"
          weight={4}
          opacity={0.7}
          dashArray="10,10"
        />
      )}
    </MapContainer>
  );
}