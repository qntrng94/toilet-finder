import { Map, List, Plus, Heart, User } from "lucide-react";

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onPlusClick: () => void;
}

export function BottomNav({
  activeTab,
  setActiveTab,
  onPlusClick,
}: BottomNavProps) {
  return (
    <div className="absolute bottom-5 left-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 px-4 py-3 flex justify-between items-center z-[9999]">
      {/* Karte */}
      <button
        onClick={() => setActiveTab("karte")}
        className={`flex flex-col items-center gap-1 transition ${
          activeTab === "karte"
            ? "text-[#4A6B82]"
            : "text-gray-400 hover:text-[#4A6B82]"
        }`}
      >
        <Map className="w-5 h-5" />
        <span
          className={`text-[10px] ${activeTab === "karte" ? "font-bold" : "font-medium"}`}
        >
          Karte
        </span>
      </button>

      {/* Liste */}
      <button
        onClick={() => setActiveTab("liste")}
        className={`flex flex-col items-center gap-1 transition ${
          activeTab === "liste"
            ? "text-[#4A6B82]"
            : "text-gray-400 hover:text-[#4A6B82]"
        }`}
      >
        <List className="w-5 h-5" />
        <span
          className={`text-[10px] ${activeTab === "liste" ? "font-bold" : "font-medium"}`}
        >
          Liste
        </span>
      </button>

      {/* Plus Button (Floating Trigger) */}
      <button
        onClick={onPlusClick}
        className="w-12 h-12 bg-[#4A6B82] hover:bg-[#3D5A6E] text-white rounded-full flex items-center justify-center shadow-md transform -translate-y-2 transition active:scale-95 border-4 border-[#F5F3E9]"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Favoriten */}
      <button
        onClick={() => setActiveTab("favoriten")}
        className={`flex flex-col items-center gap-1 transition ${
          activeTab === "favoriten"
            ? "text-[#4A6B82]"
            : "text-gray-400 hover:text-[#4A6B82]"
        }`}
      >
        <Heart className="w-5 h-5" />
        <span
          className={`text-[10px] ${activeTab === "favoriten" ? "font-bold" : "font-medium"}`}
        >
          Favoriten
        </span>
      </button>

      {/* Profil */}
      <button
        onClick={() => setActiveTab("profil")}
        className={`flex flex-col items-center gap-1 transition ${
          activeTab === "profil"
            ? "text-[#4A6B82]"
            : "text-gray-400 hover:text-[#4A6B82]"
        }`}
      >
        <User className="w-5 h-5" />
        <span
          className={`text-[10px] ${activeTab === "profil" ? "font-bold" : "font-medium"}`}
        >
          Profil
        </span>
      </button>
    </div>
  );
}
