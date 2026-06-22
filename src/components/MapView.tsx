import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Toilet } from "../types/toilet";

interface MapViewProps {
  toilets: Toilet[];
  searchQuery: string;
  mapCenter: [number, number];
  setMapCenter: (center: [number, number]) => void;
}

const createCustomIcon = (isFree: boolean) => {
  const bgColor = isFree ? "#4A6B82" : "#5B7C93";
  return L.divIcon({
    html: `<div style="background-color: ${bgColor}; width: 32px; height: 32px; border-radius: 12px; border: 2px solid #F5F3E9; box-shadow: 0 2px 6px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; font-size: 16px;">🚽</div>`,
    className: "custom-toilet-icon",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const createUserLocationIcon = () => {
  return L.divIcon({
    html: `<div style="position: relative; width: 16px; height: 16px;"><div style="position: absolute; width: 100%; height: 100%; background-color: #1a73e8; border-radius: 50%; opacity: 0.4; animation: pulse 2s infinite ease-out;"></div><div style="position: absolute; top: 2px; left: 2px; width: 12px; height: 12px; background-color: #1a73e8; border: 2px solid #ffffff; border-radius: 50%; box-shadow: 0 0 6px rgba(0,0,0,0.3);"></div></div><style>@keyframes pulse { 0% { transform: scale(1); opacity: 0.4; } 100% { transform: scale(3); opacity: 0; } }</style>`,
    className: "user-location-icon",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

export function MapView({
  toilets,
  searchQuery,
  mapCenter,
  setMapCenter,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    leafletMap.current = L.map(mapRef.current, { zoomControl: false }).setView(
      mapCenter,
      14,
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(leafletMap.current);

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!leafletMap.current || searchQuery.trim().length < 3) return;

    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        );
        const data = await response.json();

        if (data && data.length > 0) {
          const latNum = parseFloat(data[0].lat);
          const lonNum = parseFloat(data[0].lon);

          leafletMap.current?.flyTo([latNum, lonNum], 15, { duration: 1.5 });
          setMapCenter([latNum, lonNum]);
        }
      } catch (err) {
        console.error("Geocoding Fehler:", err);
      }
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    if (!leafletMap.current) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    toilets.forEach((toilet) => {
      const priceBadge = toilet.is_free
        ? '<span style="background:#e6f4ea;color:#137333;padding:2px 6px;border-radius:6px;font-size:10px;font-weight:bold;">Kostenlos</span>'
        : `<span style="background:#fce8e6;color:#c5221f;padding:2px 6px;border-radius:6px;font-size:10px;font-weight:bold;">${toilet.price || "0.50"} €</span>`;

      const accessibilityBadge = toilet.is_accessible
        ? '<span style="background:#f3e8ff;color:#6b21a8;padding:2px 6px;border-radius:6px;font-size:10px;font-weight:bold;margin-left:4px;">♿ Barrierefrei</span>'
        : "";

      const commentBox = toilet.comment
        ? `<div style="background:#fffbeb;border:1px solid #fef3c7;color:#92400e;padding:6px;border-radius:8px;font-size:11px;margin-top:8px;">⚠️ ${toilet.comment}</div>`
        : "";

      const popupContent = `
        <div style="font-family:sans-serif;padding:2px;min-width:160px;">
          <h4 style="margin:0 0 4px 0;font-size:14px;font-weight:bold;color:#1f2937;">${toilet.name}</h4>
          <p style="margin:0 0 8px 0;font-size:11px;color:#6b7280;">${toilet.address || "Keine Adresse"}</p>
          <div style="display:flex;align-items:center;gap:4px;">${priceBadge}${accessibilityBadge}</div>
          ${commentBox}
        </div>
      `;

      const marker = L.marker([toilet.latitude, toilet.longitude], {
        icon: createCustomIcon(toilet.is_free),
      })
        .addTo(leafletMap.current!)
        .bindPopup(popupContent);

      markersRef.current.push(marker);
    });

    const userMarker = L.marker(mapCenter, { icon: createUserLocationIcon() })
      .addTo(leafletMap.current!)
      .bindPopup(
        '<b style="font-family: sans-serif; font-size: 12px;">Aktueller Suchfokus</b>',
      );

    markersRef.current.push(userMarker);
  }, [toilets, mapCenter]);

  return <div ref={mapRef} className="w-full h-full" />;
}
