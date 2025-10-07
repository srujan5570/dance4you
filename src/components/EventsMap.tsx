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
              <div className="text-sm">
                <div className="font-semibold">{event.title}</div>
                <div>{event.city}</div>
                {event._distanceKm && (
                  <div className="mt-1">{event._distanceKm.toFixed(1)} km away</div>
                )}
                <a 
                  href={`/events/${event.id}`}
                  className="block mt-2 text-center bg-orange-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-orange-600"
                >
                  View Details
                </a>
                <div>{event.date}</div>
                {event._distanceKm !== null && (
                  <div>{event._distanceKm?.toFixed(1)} km away</div>
                )}
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