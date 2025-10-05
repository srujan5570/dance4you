"use client";

import "leaflet/dist/leaflet.css";
-import { MapContainer, TileLayer, CircleMarker, useMapEvents } from "react-leaflet";
+import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
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
-      {typeof lat === "number" && typeof lng === "number" && (
-        <CircleMarker center={[lat, lng]} radius={10} pathOptions={{ color: "#f97316" }} />
-      )}
+      {typeof lat === "number" && typeof lng === "number" && (
+        <Marker position={[lat, lng]} icon={pinIcon} />
+      )}
    </MapContainer>
  );
}