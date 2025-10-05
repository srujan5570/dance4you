"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker } from "react-leaflet";

export default function EventMap({ lat, lng, zoom = 14 }: { lat: number; lng: number; zoom?: number }) {
  const center: [number, number] = [lat, lng];
  return (
    <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <CircleMarker center={center} radius={10} pathOptions={{ color: "#f97316" }} />
    </MapContainer>
  );
}