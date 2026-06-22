import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { supabase } from "../utils/supabaseClient";

interface AddToiletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddToiletModal({
  isOpen,
  onClose,
  onSuccess,
}: AddToiletModalProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  // Startwerte sind Nauen, werden aber durch echtes GPS überschrieben
  const [latitude, setLatitude] = useState(52.6);
  const [longitude, setLongitude] = useState(12.875);

  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState("0.50");
  const [isAccessible, setIsAccessible] = useState(false);
  const [hasChangingTable, setHasChangingTable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState("");

  // Sobald das Modal geöffnet wird, rufen wir die Standortdaten ab
  useEffect(() => {
    if (isOpen && navigator.geolocation) {
      setGpsStatus("Standort wird ermittelt...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          setGpsStatus("📍 Standort erfolgreich erfasst");
        },
        (error) => {
          console.error("GPS Fehler:", error);
          setGpsStatus("⚠️ GPS nicht verfügbar (Nutze Standard: Nauen)");
        },
        { enableHighAccuracy: true, timeout: 5000 },
      );
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("toilets").insert([
      {
        name,
        address,
        latitude,
        longitude,
        is_free: isFree,
        price: isFree ? "0.00" : price,
        is_accessible: isAccessible,
        has_changing_table: hasChangingTable,
        is_approved: false,
      },
    ]);

    setLoading(false);

    if (error) {
      alert(`Fehler beim Speichern: ${error.message}`);
    } else {
      setName("");
      setAddress("");
      setIsAccessible(false);
      setHasChangingTable(false);
      onSuccess();
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center sm:items-center p-4">
      <div className="bg-white w-full max-w-md rounded-t-[30px] sm:rounded-[30px] shadow-2xl p-6 relative max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Neue Toilette melden
            </h2>
            <p className="text-[11px] text-[#4A6B82] font-semibold mt-0.5">
              {gpsStatus}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formular */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Name / Ort
            </label>
            <input
              type="text"
              required
              placeholder="z.B. Stadtpark WC, Café Muster"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:border-[#4A6B82]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Adresse
            </label>
            <input
              type="text"
              placeholder="Straße, Hausnummer, PLZ Ort (Optional)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:border-[#4A6B82]"
            />
          </div>

          {/* Toggle Kostenlos */}
          <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center border border-gray-100">
            <div>
              <span className="text-sm font-semibold text-gray-700 block">
                Kostenlos nutzbar
              </span>
              <span className="text-xs text-gray-400">
                Ist für die Benutzung eine Gebühr fällig?
              </span>
            </div>
            <input
              type="checkbox"
              checked={isFree}
              onChange={(e) => setIsFree(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-[#4A6B82] focus:ring-[#4A6B82]"
            />
          </div>

          {!isFree && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Gebühr (€)
              </label>
              <input
                type="number"
                step="0.10"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:border-[#4A6B82]"
              />
            </div>
          )}

          {/* Toggle Barrierefreiheit */}
          <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center border border-gray-100">
            <div>
              <span className="text-sm font-semibold text-gray-700 block">
                Rollstuhlgerecht ♿
              </span>
              <span className="text-xs text-gray-400">
                Ist das WC barrierefrei zugänglich?
              </span>
            </div>
            <input
              type="checkbox"
              checked={isAccessible}
              onChange={(e) => setIsAccessible(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-[#4A6B82] focus:ring-[#4A6B82]"
            />
          </div>

          {/* Toggle Wickeltisch */}
          <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center border border-gray-100">
            <div>
              <span className="text-sm font-semibold text-gray-700 block">
                Wickeltisch 👶
              </span>
              <span className="text-xs text-gray-400">
                Gibt es eine Möglichkeit, Babys zu wickeln?
              </span>
            </div>
            <input
              type="checkbox"
              checked={hasChangingTable}
              onChange={(e) => setHasChangingTable(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-[#4A6B82] focus:ring-[#4A6B82]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#4A6B82] hover:bg-[#3D5A6E] text-white font-bold py-3 px-4 rounded-xl transition mt-2 disabled:opacity-50"
          >
            {loading ? "Wird gespeichert..." : "Eintrag hinzufügen"}
          </button>
        </form>
      </div>
    </div>
  );
}
