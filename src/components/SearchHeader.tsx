import {
  Search,
  MapPin,
  Clock,
  Banknote,
  Accessibility,
  Baby,
} from "lucide-react";

export interface ToiletFilters {
  free: boolean;
  accessible: boolean;
  changingTable: boolean;
}

interface SearchHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filters: ToiletFilters;
  onToggleFilter: (key: keyof ToiletFilters) => void;
}

export function SearchHeader({
  searchQuery,
  setSearchQuery,
  filters,
  onToggleFilter,
}: SearchHeaderProps) {
  const pillBaseClass =
    "flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium shadow-sm whitespace-nowrap transition";
  const pillActiveClass = "bg-[#4A6B82] text-white hover:bg-[#3D5A6E]";
  const pillInactiveClass =
    "bg-white text-[#4A6B82] border border-[#4A6B82]/20 hover:bg-[#F5F3E9]";

  return (
    <div className="absolute top-0 left-0 right-0 z-[1000] p-4 bg-gradient-to-b from-[#F5F3E9] via-[#F5F3E9]/90 to-transparent pb-8">
      <div className="flex items-center bg-white rounded-2xl shadow-md px-4 py-3 border border-gray-100">
        <Search className="text-[#4A6B82] w-5 h-5 mr-3" />
        <input
          type="text"
          placeholder="Stadt, Straße oder Standort..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-sm focus:outline-none text-gray-800 placeholder-gray-400"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="text-gray-400 hover:text-gray-600 text-xs mr-2"
          >
            Clear
          </button>
        )}
        <MapPin className="text-[#4A6B82] w-5 h-5 ml-2 cursor-pointer hover:text-[#3D5A6E] transition" />
      </div>

      <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none">
        <button
          className={`${pillBaseClass} bg-[#4A6B82] text-white hover:bg-[#3D5A6E]`}
          title="Optisch, ohne echte Filterfunktion"
        >
          <Clock className="w-3.5 h-3.5" /> Jetzt geöffnet
        </button>

        <button
          onClick={() => onToggleFilter("free")}
          className={`${pillBaseClass} ${filters.free ? pillActiveClass : pillInactiveClass}`}
        >
          <Banknote className="w-3.5 h-3.5" /> Umsonst
        </button>

        <button
          onClick={() => onToggleFilter("accessible")}
          className={`${pillBaseClass} ${filters.accessible ? pillActiveClass : pillInactiveClass}`}
        >
          <Accessibility className="w-3.5 h-3.5" /> Barrierefrei
        </button>

        <button
          onClick={() => onToggleFilter("changingTable")}
          className={`${pillBaseClass} ${filters.changingTable ? pillActiveClass : pillInactiveClass}`}
        >
          <Baby className="w-3.5 h-3.5" /> Wickeltisch
        </button>
      </div>
    </div>
  );
}
