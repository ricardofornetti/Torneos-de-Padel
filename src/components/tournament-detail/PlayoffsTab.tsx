import React, { useState } from 'react';
import { 
  Trophy, 
  MapPin, 
  Users, 
  Calendar, 
  ChevronRight, 
  ArrowLeft,
  Search
} from 'lucide-react';
import { Tournament, Pair, Match, Court } from '../../types';
import { ALL_PADEL_CATEGORIES } from '../TournamentDetail';
import { formatDate } from '../../lib/utils';

interface TournamentDashboardViewProps {
  tournament: Tournament;
  pairs: Pair[];
  matches: Match[];
  courts: Court[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  setActiveTab: (tab: "inscriptions" | "groups" | "matches" | "standings" | "playoffs") => void;
  setViewMode: (mode: "dashboard" | "isolated") => void;
  userRole: "admin" | "player";
  onBack: () => void;
  handleOpenFinishModal: () => void;
}

export const TournamentDashboardView: React.FC<TournamentDashboardViewProps> = ({
  tournament,
  pairs,
  matches,
  courts,
  selectedCategory,
  setSelectedCategory,
  setActiveTab,
  setViewMode,
  userRole,
  onBack,
  handleOpenFinishModal
}) => {
  const [categorySearch, setCategorySearch] = useState("");
  const categoryPairs = pairs.filter(p => p.category === selectedCategory);
  const categoryMatches = matches.filter(m => m.category === selectedCategory);
  const isNoMatches = categoryMatches.length === 0;

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-6">
      {/* HEADER DE ACCIÓN */}
      {userRole === "admin" && tournament.status === "in_progress" && (
        <div className="flex items-center justify-end pb-4 border-b border-slate-900">
          <button
            id="finish-tournament-btn"
            onClick={handleOpenFinishModal}
            className="bg-red-950/20 hover:bg-red-900 border border-red-900/40 text-red-400 text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer uppercase tracking-wider shadow-md"
          >
            🏁 Finalizar Torneo
          </button>
        </div>
      )}

      {/* STYLE A HERO BANNER (No full-width gradient, no stickers) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 w-full pt-2">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="bg-[#d4fc34]/15 text-[#d4fc34] border border-[#d4fc34]/20 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest font-mono">
              {tournament.category}
            </span>
            <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest font-mono border ${
              tournament.status === "registration" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
              tournament.status === "in_progress" ? "bg-green-500/10 text-green-400 border-green-500/20 animate-pulse" :
              "bg-slate-500/10 text-slate-400 border-slate-500/20"
            }`}>
              {tournament.status === "registration" ? "● Inscripción Libre" :
               tournament.status === "in_progress" ? "● Torneo en Juego" : "● Finalizado"}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-wider text-white flex items-center gap-2.5">
            <Trophy className="w-7 h-7 text-[#d4fc34]" /> {tournament.name}
          </h1>

          <p className="text-xs text-slate-400 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-500" /> {tournament.club} — {tournament.city}
          </p>

          {/* INDICADOR DE PROGRESO */}
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { label: "Inscripción", active: tournament.status === "registration" },
              { label: "Sorteo", active: tournament.status === "in_progress" && isNoMatches },
              { label: "Grupos", active: tournament.status === "in_progress" && !isNoMatches && matches.some(m => m.category === selectedCategory && (m.stageName.toLowerCase().includes("grupo") || m.stageName.toLowerCase().includes("zona"))) },
              { label: "Playoffs", active: tournament.status === "in_progress" && !isNoMatches && matches.some(m => m.category === selectedCategory && (m.stageName.toLowerCase().includes("playoff") || m.stageName.toLowerCase().includes("ronda") || m.stageName.toLowerCase().includes("octavos") || m.stageName.toLowerCase().includes("cuartos") || m.stageName.toLowerCase().includes("final"))) },
              { label: "Finalizado", active: tournament.status === "completed" }
            ].map((step, idx) => (
              <React.Fragment key={step.label}>
                {idx > 0 && <span className="text-slate-700 text-[10px] select-none">→</span>}
                <span className={`text-[9px] font-black uppercase tracking-wider font-mono px-2 py-0.5 rounded-md ${
                  step.active
                    ? "bg-[#d4fc34]/15 text-[#d4fc34] border border-[#d4fc34]/30"
                    : "text-slate-600 border border-transparent"
                }`}>
                  {step.label}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Right Side: Simplified Schedule Card */}
        <div className="shrink-0 bg-slate-900 border border-slate-800 p-4 rounded-xl w-full md:w-auto">
          <span className="block text-[8px] text-[#d4fc34] mb-0.5 font-mono uppercase tracking-widest font-black">📅 CRONOGRAMA</span>
          <span className="block font-bold text-xs text-slate-200">
            {formatDate(tournament.startDate)} • {formatDate(tournament.endDate)}
          </span>
          <span className="block text-[10px] text-slate-400 mt-1">
            Zonas: {tournament.numGroups} Zonas • Canchas: {tournament.numCourts} Asignadas
          </span>
        </div>
      </div>

      <div className="space-y-6 pt-4">
        {/* CENTRAL CATEGORY RIBBON */}
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-mono tracking-widest font-bold uppercase block pl-1">
              CATEGORÍAS DE ESTE TORNEO • Mostrando: <strong className="text-[#d4fc34]">{selectedCategory}</strong>
            </span>
            <span className="text-[10px] text-blue-400 font-mono font-bold uppercase tracking-wider">
              Soporte Jerárquico Multicategoría
            </span>
          </div>

          {/* Búsqueda de categoría */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input 
              type="text" 
              placeholder="Buscar categoría..."
              value={categorySearch} 
              onChange={e => setCategorySearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-[#d4fc34] rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none" 
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {ALL_PADEL_CATEGORIES.filter(cat => 
              cat.toLowerCase().includes(categorySearch.toLowerCase())
            ).map(cat => {
              const catPairs = pairs.filter(p => p.category === cat);
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 border ${
                    active
                      ? "bg-[#d4fc34]/15 text-[#d4fc34] border-[#d4fc34]/30 font-black"
                      : "bg-slate-950 text-slate-400 border-slate-900 hover:text-slate-200 hover:border-slate-800"
                  }`}
                >
                  <span>{cat}</span>
                  {catPairs.length > 0 && (
                    <span className="bg-[#d4fc34] text-slate-950 font-black px-1.5 py-0.5 rounded-full text-[9px]">
                      {catPairs.length}
                    </span>
                  )}
                </button>
              );
            })}
            {ALL_PADEL_CATEGORIES.filter(cat => 
              cat.toLowerCase().includes(categorySearch.toLowerCase())
            ).length === 0 && (
              <span className="text-xs text-slate-500 italic px-2">No se encontraron categorías con ese nombre.</span>
            )}
          </div>
        </div>

        {/* DYNAMIC NAVIGATION GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
          
          {/* Card 1: Inscriptions */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-[#22d3ee]/40 hover:bg-slate-900 transition duration-300 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
                  <Users className="w-5 h-5" />
                </span>
                <span className="text-[11px] font-mono font-medium text-[#d4fc34] bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                  {categoryPairs.length} Parejas
                </span>
              </div>
              <h3 className="text-base font-extrabold text-white mb-2">Parejas Inscritas</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Planilla de participación para esta categoría. Modifica o elimina parejas, administra jugadores libres y realiza el sorteo de grupos de forma instantánea.
              </p>
            </div>
            <button
              onClick={() => {
                setActiveTab("inscriptions");
                setViewMode("isolated");
              }}
              className="mt-6 bg-slate-950 hover:bg-slate-850 hover:text-[#d4fc34] text-slate-350 border border-slate-800 py-3 px-4 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              Ingresar a Inscripciones <ChevronRight className="w-4 h-4 text-blue-400 animate-pulse" />
            </button>
          </div>

          {/* Card 2: Fixture */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-[#22d3ee]/40 hover:bg-slate-900 transition duration-300 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </span>
                {isNoMatches ? (
                  <span className="bg-amber-500/10 text-amber-500 text-[8px] px-2 py-0.5 rounded uppercase font-black tracking-wider border border-amber-500/20">
                    PENDIENTE DE SORTEO
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                    {categoryMatches.length} Partidos Totales
                  </span>
                )}
              </div>
              <h3 className="text-base font-extrabold text-[#d4fc34] mb-2 tracking-wider">Partidos</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cronograma oficial de juego para esta categoría. Controla la asignación de pistas, carga resultados de los sets y procesa abandonos o Walkovers.
              </p>
            </div>
            <button
              disabled={isNoMatches}
              onClick={() => {
                setActiveTab("matches");
                setViewMode("isolated");
              }}
              className={`mt-6 py-3 px-4 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider ${
                isNoMatches
                  ? "bg-slate-950/40 text-slate-600 border-slate-900 cursor-not-allowed"
                  : "bg-slate-950 hover:bg-slate-850 hover:text-[#d4fc34] text-slate-350 border border-slate-800"
              }`}
            >
              {isNoMatches
                ? "Fixture No Sorteado"
                : "Explorar Partidos y Resultados"}
              {!isNoMatches && <ChevronRight className="w-4 h-4 text-[#d4fc34]" />}
            </button>
          </div>

          {/* Card 3: Standings */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 hover:border-[#22d3ee]/40 hover:bg-slate-900 transition duration-300 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="p-3 bg-[#d4fc34]/10 text-[#d4fc34] rounded-xl border border-[#d4fc34]/20">
                  <Trophy className="w-5 h-5" />
                </span>
                {isNoMatches ? (
                  <span className="bg-slate-800 text-slate-500 text-[9px] px-2 py-0.5 rounded uppercase font-bold">
                    PENDIENTE DE SORTEO
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                    Cálculo Oficial de Puntos
                  </span>
                )}
              </div>
              <h3 className="text-base font-extrabold text-white mb-2">Tablas de Posiciones</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tablas analíticas generadas automáticamente: rendimiento de zonas de grupos y la Tabla Unificada de Doble Eliminación srtc.
              </p>
            </div>
            <button
              disabled={isNoMatches}
              onClick={() => {
                setActiveTab("standings");
                setViewMode("isolated");
              }}
              className={`mt-6 py-3 px-4 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider ${
                isNoMatches
                  ? "bg-slate-950/40 text-slate-600 border-slate-900 cursor-not-allowed"
                  : "bg-[#d4fc34]/10 hover:bg-[#d4fc34] hover:text-slate-950 text-[#d4fc34] border border-[#d4fc34]/20"
              }`}
            >
              {isNoMatches
                ? "Posiciones No Disponibles"
                : "Ver Tablas de Clasificación"}
              {!isNoMatches && <ChevronRight className="w-4 h-4 text-slate-950" />}
            </button>
          </div>

          {/* Card 4: Bracket */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 hover:border-[#22d3ee]/40 hover:bg-slate-900 transition duration-300 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="p-3 bg-[#d4fc34]/10 text-[#d4fc34] rounded-xl border border-[#d4fc34]/20">
                  <Trophy className="w-5 h-5" />
                </span>
                {isNoMatches ? (
                  <span className="bg-slate-800 text-slate-500 text-[9px] px-2 py-0.5 rounded uppercase font-bold">
                    PENDIENTE DE SORTEO
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                    Cuadros de Play-Offs
                  </span>
                )}
              </div>
              <h3 className="text-base font-extrabold text-[#d4fc34] mb-2 tracking-wider">Cuadros</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Visualiza el bracket interactivo con los cruces directos y llaves de eliminación directa hasta coronar a los campeones.
              </p>
            </div>
            <button
              disabled={isNoMatches}
              onClick={() => {
                setActiveTab("playoffs");
                setViewMode("isolated");
              }}
              className={`mt-6 py-3 px-4 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider ${
                isNoMatches
                  ? "bg-slate-950/40 text-slate-600 border-slate-900 cursor-not-allowed"
                  : "bg-[#d4fc34]/10 hover:bg-[#d4fc34] hover:text-slate-950 text-[#d4fc34] border border-[#d4fc34]/20"
              }`}
            >
              {isNoMatches
                ? "Bracket No Disponible"
                : "Ver Cuadros / Llaves"}
              {!isNoMatches && <ChevronRight className="w-4 h-4 text-slate-950" />}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
