"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, useMapEvents } from "react-leaflet";

export default function MapPicker({
  center,
  lat,
  lng,
  onPick,
}: {
  center: [number, number];
  lat: number | null;
  lng: number | null;
  onPick: (lat: number, lng: number) => void;
}) {
  const ClickCapture = () => {
    useMapEvents({
      click(e) {
        onPick(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  };

  return (
    <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickCapture />
      {typeof lat === "number" && typeof lng === "number" && (
        <CircleMarker center={[lat, lng]} radius={10} pathOptions={{ color: "#f97316" }} />
      )}
    </MapContainer>
  );
}