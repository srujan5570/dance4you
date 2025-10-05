"use client";

import "leaflet/dist/leaflet.css";
-import { MapContainer, TileLayer, CircleMarker } from "react-leaflet";
+import { MapContainer, TileLayer, Marker } from "react-leaflet";
+import L from "leaflet";
+
+const pinIcon = L.icon({
+  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
+  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
+  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
+  iconSize: [25, 41],
+  iconAnchor: [12, 41],
+  popupAnchor: [1, -34],
+  shadowSize: [41, 41],
+});

export default function EventMap({ lat, lng, zoom = 14 }: { lat: number; lng: number; zoom?: number }) {
  const center: [number, number] = [lat, lng];
  return (
    <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
-      <CircleMarker center={center} radius={10} pathOptions={{ color: "#f97316" }} />
+      <Marker position={center} icon={pinIcon} />
    </MapContainer>
  );
}