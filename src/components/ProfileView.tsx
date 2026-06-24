import { User, Settings, MapPin, LogOut } from "lucide-react";

export function ProfileView() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/50 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-[#4A6B82]/10 rounded-full flex items-center justify-center text-[#4A6B82] mb-3">
          <User className="w-10 h-10" />
        </div>
        <h3 className="font-bold text-gray-800 text-lg">Quan Nguyen</h3>
        <p className="text-xs text-gray-500 mt-0.5">Mitglied seit 2026</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100/50 divide-y divide-gray-50 overflow-hidden">
        <div className="px-4 py-3.5 flex items-center justify-between hover:bg-gray-50/50 transition">
          <div className="flex items-center gap-3 text-sm text-gray-700 font-medium">
            <MapPin className="w-4 h-4 text-gray-400" />
            Eingetragene Toiletten
          </div>
          <span className="bg-[#4A6B82]/10 text-[#4A6B82] font-bold text-xs px-2.5 py-1 rounded-full">
            0
          </span>
        </div>

        <button className="w-full px-4 py-3.5 flex items-center gap-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition font-medium">
          <Settings className="w-4 h-4 text-gray-400" />
          App-Einstellungen
        </button>

        <button className="w-full px-4 py-3.5 flex items-center gap-3 text-left text-sm text-red-600 hover:bg-red-50/50 transition font-medium">
          <LogOut className="w-4 h-4 text-red-400" />
          Abmelden
        </button>
      </div>
    </div>
  );
}
