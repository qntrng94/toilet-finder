import {
  Accessibility,
  Baby,
  Navigation,
  Heart,
  AlertTriangle,
} from "lucide-react";
import type { Toilet } from "../types/toilet";

interface ListViewProps {
  toilets: Toilet[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onReportToilet: (id: string, comment: string) => void;
  mapCenter: [number, number];
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

function getReportInfo(createdAt: string | null) {
  if (!createdAt) return null;

  const ageMs = Date.now() - new Date(createdAt).getTime();
  const hoursAgo = Math.floor(ageMs / (60 * 60 * 1000));
  const hoursLeft = Math.max(0, 12 - hoursAgo);

  return { hoursAgo, hoursLeft };
}

export function ListView({
  toilets,
  favorites,
  onToggleFavorite,
  onReportToilet,
  mapCenter,
}: ListViewProps) {
  const handleReportClick = (toiletId: string) => {
    const text = window.prompt(
      "Was möchtest du melden? (z.B. 'Geschlossen', 'Aktuell extrem dreckig')",
    );
    if (text && text.trim()) {
      onReportToilet(toiletId, text.trim());
    }
  };

  const sortedToilets = [...toilets].sort((a, b) => {
    const distA = getDistance(
      mapCenter[0],
      mapCenter[1],
      a.latitude,
      a.longitude,
    );
    const distB = getDistance(
      mapCenter[0],
      mapCenter[1],
      b.latitude,
      b.longitude,
    );
    return distA - distB;
  });

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-4 px-1">
        <span className="text-xs font-semibold text-[#4A6B82] uppercase tracking-wider">
          Toiletten in der Nähe
        </span>
        <span className="text-xs text-gray-500 bg-white/80 px-2 py-1 rounded-md border border-gray-100">
          Live-Daten (Supabase)
        </span>
      </div>

      {sortedToilets.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100/50 p-6">
          📍{" "}
          <span className="font-semibold text-gray-700 block mt-2">
            Keine Einträge
          </span>
          Im ausgewählten Umkreis wurden keine Toiletten gefunden.
        </div>
      ) : (
        sortedToilets.map((toilet) => {
          const distance = getDistance(
            mapCenter[0],
            mapCenter[1],
            toilet.latitude,
            toilet.longitude,
          );

          const isFavorite = favorites.includes(toilet.id);
          const reportInfo = toilet.comment
            ? getReportInfo(toilet.comment_created_at)
            : null;

          return (
            <div
              key={toilet.id}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100/50 flex flex-col justify-between gap-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-800 text-base">
                    {toilet.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {toilet.address || "Keine Adresse hinterlegt"}
                  </p>
                </div>
                <span className="text-sm font-bold text-[#4A6B82] bg-[#4A6B82]/10 px-2.5 py-1 rounded-xl whitespace-nowrap">
                  {distance >= 1000
                    ? `${(distance / 1000).toFixed(1)} km`
                    : `${distance} m`}
                </span>
              </div>

              {/* Geofencing-Warnmeldung, im Stil des Mockups */}
              {toilet.comment && reportInfo && (
                <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-2.5 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-800 leading-tight">
                    Meldung vor {reportInfo.hoursAgo} Std:{" "}
                    <span className="font-semibold">{toilet.comment}</span>.
                    Automatische Löschung in {reportInfo.hoursLeft} Std.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                <div className="flex gap-2 text-gray-400">
                  {toilet.is_accessible && (
                    <Accessibility className="w-4 h-4 text-[#4A6B82]" />
                  )}
                  {toilet.has_changing_table && (
                    <Baby className="w-4 h-4 text-[#4A6B82]" />
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span className="text-xs font-medium text-green-600">
                    Geöffnet •{" "}
                    {toilet.is_free
                      ? "Kostenlos"
                      : `${toilet.price || "0.50"} €`}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 mt-1">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${toilet.latitude},${toilet.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 bg-[#4A6B82] hover:bg-[#3D5A6E] text-white text-xs font-medium py-2 px-3 rounded-xl transition"
                >
                  <Navigation className="w-3.5 h-3.5" /> Google Maps
                </a>

                <button
                  onClick={() => handleReportClick(toilet.id)}
                  title="Etwas an dieser Toilette melden"
                  className="p-2 rounded-xl transition border flex items-center justify-center bg-amber-50 border-amber-100 text-amber-600 hover:bg-amber-100"
                >
                  <AlertTriangle className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onToggleFavorite(toilet.id)}
                  className={`p-2 rounded-xl transition border flex items-center justify-center ${
                    isFavorite
                      ? "bg-red-50 border-red-100 text-red-500"
                      : "bg-gray-50 border-gray-100 text-gray-400 hover:text-red-500 hover:bg-gray-100"
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`}
                  />
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
