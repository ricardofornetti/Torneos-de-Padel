import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Trophy, 
  MapPin, 
  Clock, 
  Activity, 
  Search,
  ChevronRight,
  Filter,
  Sparkles,
  Info
} from 'lucide-react';
import { repository } from '../lib/repository';
import { Tournament, Match, Pair } from '../types';

interface FixtureViewProps {
  onSelectTournament: (id: string) => void;
  onNavigate: (view: any) => void;
}

export const FixtureView: React.FC<FixtureViewProps> = ({ onSelectTournament, onNavigate }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    async function loadData() {
      try {
        const [t, m, p] = await Promise.all([
          repository.getTournaments(),
          repository.getMatches(),
          repository.getPairs()
        ]);
        setTournaments(t);
        // Sort matches by date first
        setMatches(m.sort((a, b) => {
          if (!a.date) return 1;
          if (!b.date) return -1;
          return a.date.localeCompare(b.date) || a.time.localeCompare(b.time);
        }));
        setPairs(p);
      } catch (err) {
        console.error("Error loading fixture matches:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-xs font-mono text-slate-500">
        <Activity className="w-4 h-4 animate-spin text-[#d4fc34] mr-2" />
        Sincronizando fixture oficial...
      </div>
    );
  }

  // Get Pair names helper
  const getPairNames = (pairId: string): string => {
    if (!pairId) return "A clasificar...";
    if (pairId.startsWith("bye")) return "BYE (Pase directo)";
    
    const pair = pairs.find(p => p.id === pairId);
    if (!pair) return "Pareja Vacía";
    return `${pair.player1LastName}/${pair.player2LastName}`;
  };

  const getTournamentName = (tId: string): string => {
    const tournament = tournaments.find(t => t.id === tId);
    return tournament ? tournament.name : "Torneo Desconocido";
  };

  // Filtered List
  const filteredMatches = matches.filter(m => {
    const tMatch = selectedTournamentId === "all" || m.tournamentId === selectedTournamentId;
    const sMatch = statusFilter === "all" || m.status === statusFilter;
    const cMatch = categoryFilter === "all" || m.category === categoryFilter;
    
    // search name, surname or stage
    const p1Name = getPairNames(m.pair1Id).toLowerCase();
    const p2Name = getPairNames(m.pair2Id).toLowerCase();
    const stage = (m.stageName || "").toLowerCase();
    const query = searchTerm.toLowerCase();
    
    const textMatch = p1Name.includes(query) || p2Name.includes(query) || stage.includes(query);
    
    return tMatch && sMatch && cMatch && textMatch;
  });

  // Group filtered matches by Date for timeline look
  const groupedByDate: Record<string, Match[]> = {};
  filteredMatches.forEach(m => {
    const d = m.date || "Fecha sin asignar";
    if (!groupedByDate[d]) {
      groupedByDate[d] = [];
    }
    groupedByDate[d].push(m);
  });

  const formatDate = (dateStr: string) => {
    if (dateStr === "Fecha sin asignar") return dateStr;
    try {
      const parts = dateStr.split("-");
      if (parts.length !== 3) return dateStr;
      const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return date.toLocaleDateString("es-ES", { weekday: 'long', day: 'numeric', month: 'long' });
    } catch (e) {
      return dateStr;
    }
  };

  const categoriesList = [
    "Libre Masculina",
    "4ta Masculina",
    "5ta Masculina",
    "6ta Masculina",
    "7ma Masculina",
    "6ta Femenina",
    "7ma Femenina"
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      
      {/* Header section */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-[#d4fc34]/15 text-[#d4fc34] border border-[#d4fc34]/20 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest font-mono">
            MATCH CENTER
          </span>
          <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest font-mono">
            FIP OFFICIAL RULES
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-wider text-white flex items-center gap-2.5">
          <CalendarIcon className="w-7 h-7 text-[#d4fc34]" /> Fixture & Calendario
        </h1>
        <p className="text-xs text-slate-400">
          Cronograma general de partidos día a día, marcadores oficiales y llaves de eliminación.
        </p>
      </div>

      {/* FILTER PANEL SHEET */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
        
        <div className="flex items-center gap-2 text-xs font-mono font-black text-[#22d3ee] uppercase tracking-wider border-b border-slate-850 pb-2.5">
          <Filter className="w-4 h-4" /> Filtros de Visualización
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Tournament Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Torneo Activo</label>
            <select
              value={selectedTournamentId}
              onChange={(e) => setSelectedTournamentId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-[#d4fc34] rounded-lg p-2 text-xs text-slate-100 outline-none"
            >
              <option value="all">🏆 Todos los Torneos</option>
              {tournaments.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.status === "completed" ? "Cerrado" : "Activo"})</option>
              ))}
            </select>
          </div>

          {/* Category Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Categoría Base</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-[#d4fc34] rounded-lg p-2 text-xs text-slate-100 outline-none"
            >
              <option value="all">🎾 Todas las Categorías</option>
              {categoriesList.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Search Term input */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Buscar por Jugador / Ronda</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Apellido o ronda..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-[#d4fc34] rounded-lg pl-8 p-1.5 text-xs text-slate-100 placeholder-slate-600 outline-none"
              />
            </div>
          </div>

          {/* Status Tabs */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Estado de Partidos</label>
            <div className="grid grid-cols-3 bg-slate-950 border border-slate-800 p-1 rounded-lg">
              {(["all", "pending", "completed"] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`py-1 rounded text-[10px] font-mono font-black transition-all uppercase cursor-pointer ${
                    statusFilter === status
                      ? "bg-[#d4fc34] text-slate-950"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {status === "all" ? "Todos" : status === "pending" ? "Por jugar" : "Finalizados"}
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* MATCH TILES & TIMELINE RESULTS */}
      {filteredMatches.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500 text-xs font-mono">
          Ningún partido coincide con los filtros aplicados en el cronograma.
        </div>
      ) : (
        <div className="space-y-8">
          
          {Object.entries(groupedByDate).map(([dateStr, dateMatches]) => (
            <div key={dateStr} className="space-y-3">
              
              {/* Date Header Tile */}
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#d4fc34]" />
                <h3 className="text-xs sm:text-sm font-black text-slate-100 uppercase tracking-wide">
                  {formatDate(dateStr)}
                </h3>
                <div className="flex-1 h-px bg-slate-850"></div>
                <span className="text-[10px] text-slate-500 font-mono font-bold uppercase">{dateMatches.length} partidos</span>
              </div>

              {/* Grid of Matches */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dateMatches.map((m) => {
                  const isCompleted = m.status === 'completed';
                  const isByeValue = m.pair1Id?.startsWith("bye") || m.pair2Id?.startsWith("bye");
                  
                  return (
                    <div 
                      key={m.id}
                      className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition relative group"
                    >
                      {/* Top labels */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono border-b border-slate-850/80 pb-2 mb-3.5">
                        <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-850 text-[9px] font-bold uppercase text-cyan-400">
                          {m.category}
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-350 truncate max-w-[120px]" title={getTournamentName(m.tournamentId)}>
                            {getTournamentName(m.tournamentId)}
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className="font-medium text-slate-450">
                            {m.phase === "group" ? "Fase Zonas" : m.stageName || "Playoffs"}
                          </span>
                        </div>
                      </div>

                      {/* Opponents showdown visual block */}
                      <div className="space-y-2 pt-1 pb-3">
                        {/* Team A */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] bg-slate-800 w-4 h-4 text-slate-400 flex items-center justify-center rounded font-mono font-bold">A</span>
                            <span className={`text-[12px] font-bold ${isCompleted && m.winnerPairId === m.pair1Id ? 'text-[#d4fc34] font-black' : 'text-slate-150'}`}>
                              {getPairNames(m.pair1Id)}
                            </span>
                          </div>

                          {isCompleted && (
                            <span className="font-mono text-xs font-black text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-850">
                              {m.winnerPairId === m.pair1Id ? "W" : "L"}
                            </span>
                          )}
                        </div>

                        {/* Team B */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] bg-slate-800 w-4 h-4 text-slate-400 flex items-center justify-center rounded font-mono font-bold">B</span>
                            <span className={`text-[12px] font-bold ${isCompleted && m.winnerPairId === m.pair2Id ? 'text-[#d4fc34] font-black' : 'text-slate-150'}`}>
                              {getPairNames(m.pair2Id)}
                            </span>
                          </div>

                          {isCompleted && (
                            <span className="font-mono text-xs font-black text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-850">
                              {m.winnerPairId === m.pair2Id ? "W" : "L"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Score or Status summary */}
                      <div className="pt-2 px-3 py-2.5 bg-slate-950/80 rounded-xl border border-slate-850 flex items-center justify-between mt-2.5">
                        
                        {/* Left Info: Court and clock */}
                        <div className="flex items-center gap-3.5 text-[10px] text-slate-400 font-mono">
                          {m.courtId ? (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                              <span className="font-bold text-slate-200">Cancha {m.courtId.replace("c", "")}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-slate-500">
                              <MapPin className="w-3.5 h-3.5" />
                              <span>Sin Cancha</span>
                            </div>
                          )}

                          {m.time ? (
                            <div className="flex items-center gap-1 font-bold">
                              <Clock className="w-3.5 h-3.5 text-[#d4fc34]" />
                              <span>{m.time} h</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-slate-550">
                              <Clock className="w-3.5 h-3.5" />
                              <span>h?</span>
                            </div>
                          )}
                        </div>

                        {/* Right Info: score string or click details shortcut */}
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded ${isCompleted ? 'bg-[#d4fc34]/15 text-[#d4fc34] border border-[#d4fc34]/20' : 'bg-slate-900 border border-slate-800 text-slate-500'}`}>
                            {m.scoreSummary || "Por jugar"}
                          </span>

                          <button
                            onClick={() => {
                              onSelectTournament(m.tournamentId);
                              onNavigate("tournaments");
                            }}
                            className="p-1 hover:text-[#d4fc34] text-slate-400 transition"
                            title="Ir al torneo"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>

                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          ))}

        </div>
      )}

      {/* QUICK FOOTER INFO */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 flex items-start gap-3.5">
        <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="block text-xs font-black text-white uppercase tracking-wider font-mono">Información de Fixtures</span>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Los resultados de partidos publicados corresponden a las planillas firmadas por los veedores oficiales de pista. Los administradores u organizadores de cada llave pueden corregir canchas o programaciones horarias si las inclemencias del tiempo o fuerza mayor lo requieren.
          </p>
        </div>
      </div>

    </div>
  );
};
