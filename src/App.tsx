import { useEffect, useRef, useState } from "react";
import { supabase } from "./utils/supabaseClient";
import { MapView } from "./components/MapView";
import { SearchHeader } from "./components/SearchHeader";
import type { ToiletFilters } from "./components/SearchHeader";
import { BottomNav } from "./components/BottomNav";
import type { Toilet } from "./types/toilet";
import { ListView } from "./components/ListView";
import { ProfileView } from "./components/ProfileView";
import { AddToiletModal } from "./components/AddToiletModal";

const COVERAGE_RADIUS_DEG = 0.15; // ca. 15 km um den Suchpunkt — deckt ganze Bezirke ab
const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

function isNearby(toilet: Toilet, lat: number, lon: number): boolean {
  return (
    Math.abs(toilet.latitude - lat) < COVERAGE_RADIUS_DEG &&
    Math.abs(toilet.longitude - lon) < COVERAGE_RADIUS_DEG
  );
}

// Blendet Kommentare aus, die älter als 12 Stunden sind — ohne sie aus der DB zu löschen
function withEffectiveComment(toilet: Toilet): Toilet {
  if (!toilet.comment || !toilet.comment_created_at) return toilet;

  const ageMs = Date.now() - new Date(toilet.comment_created_at).getTime();
  if (ageMs > TWELVE_HOURS_MS) {
    return { ...toilet, comment: null };
  }
  return toilet;
}

async function fetchOverpassToilets(
  lat: number,
  lon: number,
): Promise<Toilet[]> {
  const minLat = lat - COVERAGE_RADIUS_DEG;
  const maxLat = lat + COVERAGE_RADIUS_DEG;
  const minLon = lon - COVERAGE_RADIUS_DEG;
  const maxLon = lon + COVERAGE_RADIUS_DEG;

  const query = `
    [out:json][timeout:10];
    node["amenity"="toilets"](${minLat},${minLon},${maxLat},${maxLon});
    out body 50;
  `;

  const fetchPromise = fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: query,
  });

  const timeoutPromise = new Promise<Response>((_, reject) => {
    setTimeout(() => reject(new Error("Overpass Timeout")), 6000);
  });

  try {
    const response = await Promise.race([fetchPromise, timeoutPromise]);

    if (!response.ok) {
      console.error("Overpass antwortete mit Status:", response.status);
      return [];
    }

    const data = await response.json();

    return data.elements.map((el: any) => ({
      id: `osm-${el.id}`,
      name: el.tags?.name || "Öffentliche Toilette",
      address: el.tags?.["addr:street"]
        ? `${el.tags["addr:street"]} ${el.tags["addr:housenumber"] || ""}`.trim()
        : null,
      latitude: el.lat,
      longitude: el.lon,
      is_free: el.tags?.fee !== "yes",
      price: el.tags?.fee === "yes" ? "0.50" : "0.00",
      is_accessible: el.tags?.wheelchair === "yes",
      has_changing_table: el.tags?.changing_table === "yes",
      comment: null,
      comment_created_at: null,
      is_approved: true,
    })) as Toilet[];
  } catch (err) {
    console.error("Overpass Fehler:", err);
    return [];
  }
}

async function saveToiletsToSupabase(newToilets: Toilet[]) {
  if (newToilets.length === 0) return;

  const payload = newToilets.map((t) => ({
    name: t.name,
    address: t.address,
    latitude: t.latitude,
    longitude: t.longitude,
    is_free: t.is_free,
    price: t.price,
    is_accessible: t.is_accessible,
    has_changing_table: t.has_changing_table,
    is_approved: true,
  }));

  const { error } = await supabase.from("toilets").insert(payload);

  if (error) {
    console.error("Fehler beim Zwischenspeichern in Supabase:", error.message);
  } else {
    console.log(
      `${payload.length} neue Toiletten dauerhaft in Supabase gespeichert`,
    );
  }
}

function App() {
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [activeTab, setActiveTab] = useState<string>("karte");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [mapCenter, setMapCenter] = useState<[number, number]>([52.6, 12.875]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const isFirstMount = useRef(true);

  const [filters, setFilters] = useState<ToiletFilters>({
    free: false,
    accessible: false,
    changingTable: false,
  });

  const toggleFilter = (key: keyof ToiletFilters) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem("toilet_favorites");
    return saved ? JSON.parse(saved) : [];
  });

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id],
    );
  };

  useEffect(() => {
    localStorage.setItem("toilet_favorites", JSON.stringify(favorites));
  }, [favorites]);

  // Einmaliges Laden aller bereits bekannten Toiletten beim Start
  useEffect(() => {
    async function fetchAllToilets() {
      const { data, error } = await supabase
        .from("toilets")
        .select("*")
        .eq("is_approved", true);

      if (error) {
        console.error("Fehler beim Laden:", error.message);
        return;
      }

      if (data) {
        console.log(`Toiletten geladen: ${data.length}`);
        setToilets(data as Toilet[]);
      }
    }

    fetchAllToilets();
  }, []);

  // Lückenfüller: läuft nur, wenn sich mapCenter durch eine Suche ändert
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    const [lat, lon] = mapCenter;

    async function fillGapIfNeeded() {
      const alreadyCovered = toilets.some((t) => isNearby(t, lat, lon));

      if (alreadyCovered) {
        console.log(
          "Bereich bereits in Supabase abgedeckt — Overpass wird nicht angefragt",
        );
        return;
      }

      console.log("Keine Daten für diesen Bereich — frage Overpass an");
      const overpassToilets = await fetchOverpassToilets(lat, lon);

      if (overpassToilets.length === 0) {
        console.log("Overpass hat ebenfalls keine Treffer geliefert");
        return;
      }

      console.log(
        `Overpass: ${overpassToilets.length} neue Toiletten gefunden`,
      );
      setToilets((prev) => [...prev, ...overpassToilets]);
      saveToiletsToSupabase(overpassToilets);
    }

    fillGapIfNeeded();
  }, [mapCenter]);

  // Meldung für eine bestehende Toilette speichern (Supabase + lokaler State)
  async function reportToilet(id: string, commentText: string) {
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("toilets")
      .update({ comment: commentText, comment_created_at: now })
      .eq("id", id);

    if (error) {
      console.error("Fehler beim Speichern der Meldung:", error.message);
      alert("Meldung konnte nicht gespeichert werden.");
      return;
    }

    setToilets((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, comment: commentText, comment_created_at: now }
          : t,
      ),
    );
  }

  // Kommentare älter als 12h werden hier zentral ausgeblendet
  const visibleToilets = toilets.map(withEffectiveComment);

  // Filter-Pillen (Umsonst / Barrierefrei / Wickeltisch) — gilt für Karte UND Liste
  const amenityFilteredToilets = visibleToilets.filter((toilet) => {
    if (filters.free && !toilet.is_free) return false;
    if (filters.accessible && !toilet.is_accessible) return false;
    if (filters.changingTable && !toilet.has_changing_table) return false;
    return true;
  });

  // Zusätzlich Textsuche — gilt nur für die Liste, nicht für die Karte
  const listToilets = amenityFilteredToilets.filter((toilet) => {
    const query = searchQuery.toLowerCase();
    return (
      toilet.name.toLowerCase().includes(query) ||
      (toilet.address && toilet.address.toLowerCase().includes(query))
    );
  });

  return (
    <div className="w-screen h-screen bg-gray-100 flex justify-center items-center font-sans">
      <div className="w-full max-w-md h-[850px] bg-[#F5F3E9] rounded-[40px] shadow-2xl overflow-hidden relative border-8 border-gray-800 flex flex-col">
        {(activeTab === "karte" || activeTab === "liste") && (
          <SearchHeader
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filters={filters}
            onToggleFilter={toggleFilter}
          />
        )}

        <main
          className={`w-full flex-1 overflow-y-auto px-4 pb-32 ${
            activeTab === "karte" || activeTab === "liste" ? "pt-36" : "pt-6"
          }`}
        >
          {activeTab === "karte" && (
            <div className="absolute inset-0 w-full h-full z-10">
              <MapView
                toilets={amenityFilteredToilets}
                searchQuery={searchQuery}
                mapCenter={mapCenter}
                setMapCenter={setMapCenter}
              />
            </div>
          )}

          {activeTab === "liste" && (
            <ListView
              toilets={listToilets}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onReportToilet={reportToilet}
              mapCenter={mapCenter}
            />
          )}

          {activeTab === "favoriten" && (
            <ListView
              toilets={visibleToilets.filter((t) => favorites.includes(t.id))}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onReportToilet={reportToilet}
              mapCenter={mapCenter}
            />
          )}

          {activeTab === "profil" && <ProfileView />}
        </main>

        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onPlusClick={() => setIsModalOpen(true)}
        />

        <AddToiletModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            window.location.reload();
          }}
        />
      </div>
    </div>
  );
}

export default App;
