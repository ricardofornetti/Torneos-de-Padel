import React, { useState } from 'react';
import { 
  MapPin, 
  Trophy, 
  Sparkles, 
  Trash2,
  Calendar,
  Search
} from 'lucide-react';
import { Tournament, Pair, Match, Court } from '../../types';
import { formatDate } from '../TournamentDetail';

interface MatchesTabProps {
  tournament: Tournament;
  pairs: Pair[];
  matches: Match[];
  courts: Court[];
  selectedCategory: string;
  userRole: "admin" | "player";
  fixtureFilter: string;
  setFixtureFilter: (filter: string) => void;
  getPairName: (id: string | null | undefined) => string;
  handleOpenCourtAssigner: (match: Match) => void;
  handleOpenScorer: (match: Match) => void;
  setTempNumCourts: (count: number) => void;
  setIsEditNumCourtsOpen: (open: boolean) => void;
  handleAutoAssignCourts: () => void;
  handleResetCategory: () => void;
}

export const MatchesTab: React.FC<MatchesTabProps> = ({
  tournament,
  pairs,
  matches,
  courts,
  selectedCategory,
  userRole,
  fixtureFilter,
  setFixtureFilter,
  getPairName,
  handleOpenCourtAssigner,
  handleOpenScorer,
  setTempNumCourts,
  setIsEditNumCourtsOpen,
  handleAutoAssignCourts,
  handleResetCategory
}) => {
  const [scheduleSearch, setScheduleSearch] = useState("");
  const [phaseFilter, setPhaseFilter] = useState<"all" | "group" | "playoff">("all");

  const currentMatches = matches.filter(m => m.category === selectedCategory);
  const categoryPairs = pairs.filter(p => p.category === selectedCategory);

  const isSRTC16 = categoryPairs.length === 16;
  const isSRTC32 = categoryPairs.length === 32;

  // Filter and sort matches
  let sortedSourceMatches = [...currentMatches];
  if (isSRTC16 || isSRTC32) {
    sortedSourceMatches.sort((a, b) => {
      const rA = a.roundNumber || 0;
      const rB = b.roundNumber || 0;
      if (rA !== rB) return rA - rB;
      return a.id.localeCompare(b.id);
    });
  }

  const matchesToRender = sortedSourceMatches.filter(m => {
    // 1. Search Query
    if (scheduleSearch.trim() !== "") {
      const p1Name = getPairName(m.pair1Id).toLowerCase();
      const p2Name = getPairName(m.pair2Id).toLowerCase();
      const q = scheduleSearch.toLowerCase();
      if (!p1Name.includes(q) && !p2Name.includes(q)) {
        return false;
      }
    }

    // 2. Phase filter
    if (phaseFilter === "group") {
      const isGroup = m.phase === "group" || m.stageName.toLowerCase().includes("grupo") || m.stageName.toLowerCase().includes("ronda");
      if (!isGroup) return false;
    } else if (phaseFilter === "playoff") {
      const isPlayoff = m.phase === "playoff" || (!m.stageName.toLowerCase().includes("grupo") && !m.stageName.toLowerCase().includes("ronda"));
      if (!isPlayoff) return false;
    }

    // 3. Original fixture filter
    if (fixtureFilter === "all") return true;

    if (isSRTC16) {
      if (fixtureFilter === "r1") {
        return m.roundNumber === 1 || m.stageName.toLowerCase().includes("ronda 1");
      }
      if (fixtureFilter === "r2") {
        return m.roundNumber === 2 || m.stageName.toLowerCase().includes("ronda 2");
      }
      if (fixtureFilter === "4tos") {
        return m.roundNumber === 3 || m.stageName.toLowerCase().includes("cuartos") || m.stageName.toLowerCase().includes("4tos");
      }
      if (fixtureFilter === "semifinal") {
        return m.roundNumber === 4 || m.stageName.toLowerCase().includes("semifinal");
      }
      if (fixtureFilter === "final") {
        return m.roundNumber === 5 || m.stageName.toLowerCase() === "final";
      }
      return true;
    }

    if (isSRTC32) {
      if (fixtureFilter === "r1") {
        return m.roundNumber === 1 || m.stageName.toLowerCase().includes("ronda 1");
      }
      if (fixtureFilter === "r2") {
        return m.roundNumber === 2 || m.stageName.toLowerCase().includes("ronda 2");
      }
      if (fixtureFilter === "8avos") {
        return m.roundNumber === 3 || m.stageName.toLowerCase().includes("octavos") || m.stageName.toLowerCase().includes("8avos");
      }
      if (fixtureFilter === "4tos") {
        return m.roundNumber === 4 || m.stageName.toLowerCase().includes("cuartos") || m.stageName.toLowerCase().includes("4tos");
      }
      if (fixtureFilter === "semifinal") {
        return m.roundNumber === 5 || m.stageName.toLowerCase().includes("semifinal");
      }
      if (fixtureFilter === "final") {
        return m.roundNumber === 6 || m.stageName.toLowerCase() === "final";
      }
      return true;
    }

    if (fixtureFilter === "group") {
      return m.phase === "group" || m.stageName.toLowerCase().includes("grupo") || m.stageName.toLowerCase().includes("ronda");
    }
    if (fixtureFilter === "16avos") {
      return m.phase === "playoff" && (m.stageName.toLowerCase().includes("16avos") || m.stageName.toLowerCase().includes("dieciseisavos"));
    }
    if (fixtureFilter === "8avos") {
      return m.phase === "playoff" && (m.stageName.toLowerCase().includes("octavos") || m.stageName.toLowerCase().includes("8avos"));
    }
    if (fixtureFilter === "4tos") {
      return m.phase === "playoff" && (m.stageName.toLowerCase().includes("cuartos") || m.stageName.toLowerCase().includes("4tos"));
    }
    if (fixtureFilter === "semifinal") {
      return m.phase === "playoff" && m.stageName.toLowerCase().includes("semifinal");
    }
    if (fixtureFilter === "final") {
      return m.phase === "playoff" && m.stageName.toLowerCase() === "final";
    }
    return true;
  });

  const getMatchGroupLabel = (m: Match) => {
    const name = m.stageName.toLowerCase();
    if (name.includes("grupo")) return "Fase de Grupos";
    if (name.includes("ronda 1")) return "Ronda 1";
    if (name.includes("ronda 2")) return "Ronda 2";
    if (name.includes("clasificatoria") || name.includes("rc ")) return "Fase Clasificatoria";
    if (name.includes("16avos") || name.includes("dieciseisavos")) return "16avos de Final";
    if (name.includes("octavos") || name.includes("8avos")) return "Octavos de Final";
    if (name.includes("cuartos") || name.includes("4tos")) return "Cuartos de Final";
    if (name.includes("semifinal")) return "Semifinales";
    if (name.includes("final")) return "Gran Final";
    return m.stageName || "Otras Fases";
  };

  const getGroupWeight = (label: string) => {
    if (label.includes("Grupos") || label.includes("Grupo")) return 1;
    if (label === "Ronda 1") return 2;
    if (label === "Ronda 2") return 3;
    if (label.includes("Clasificatoria")) return 4;
    if (label.includes("16avos")) return 5;
    if (label.includes("Octavos") || label.includes("8avos")) return 6;
    if (label.includes("Cuartos") || label.includes("4tos")) return 7;
    if (label.includes("Semifinales") || label.includes("Semifinal")) return 8;
    if (label.includes("Gran Final") || label.includes("Final")) return 9;
    return 10;
  };

  const getGroupIcon = (label: string) => {
    if (label.includes("Grupos") || label.includes("Grupo")) return "🎾";
    if (label === "Ronda 1") return "📈";
    if (label === "Ronda 2") return "📊";
    if (label.includes("Clasificatoria")) return "🎯";
    if (label.includes("16avos")) return "🛡️";
    if (label.includes("Octavos") || label.includes("8avos")) return "⚡";
    if (label.includes("Cuartos") || label.includes("4tos")) return "⚔️";
    if (label.includes("Semifinales") || label.includes("Semifinal")) return "🥈";
    if (label.includes("Gran Final") || label.includes("Final")) return "🏆";
    return "📌";
  };

  interface GroupedMatches {
    [key: string]: Match[];
  }

  const grouped: GroupedMatches = {};
  matchesToRender.forEach(m => {
    const label = getMatchGroupLabel(m);
    if (!grouped[label]) {
      grouped[label] = [];
    }
    grouped[label].push(m);
  });

  const groupKeys = Object.keys(grouped).sort((a, b) => getGroupWeight(a) - getGroupWeight(b));

  const getSubGroupName = (m: Match) => {
    const name = m.stageName;
    const match = name.match(/Grupo\s+([A-Z0-9]+)/i);
    if (match) {
      return `Grupo ${match[1].toUpperCase()}`;
    }
    return null;
  };

  const renderMatchRow = (m: Match) => {
    const finished = m.status === "completed" || m.status === "wo";
    return (
      <div 
        key={m.id}
        className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-950/40 transition"
      >
        {/* Metadata column */}
        <div className="space-y-1">
          <span className="bg-slate-950 text-slate-400 border border-slate-800 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase block w-fit">
            {m.stageName} • Ronda {m.roundNumber}
            {m.date ? ` • Fecha: ${formatDate(m.date)} - ${m.time}h` : " • Fecha: Sin asignar"}
            {` • Cancha: ${courts.find(c => c.id === m.courtId)?.name || 'Sin asignar'}`}
          </span>
          <div className="flex flex-col gap-1.5 text-xs text-slate-400 mt-1">
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shadow-sm" />
              <span className={m.courtId ? "text-slate-200" : "text-amber-400 font-bold"}>
                {courts.find(c => c.id === m.courtId)?.name || "Pista por asignar"}
              </span>
              {m.date && (
                <span className="font-mono text-[11px] text-slate-500 ml-1">
                  ({formatDate(m.date)} • {m.time} h)
                </span>
              )}
            </div>
            {userRole === "admin" && (
              <button
                type="button"
                onClick={() => handleOpenCourtAssigner(m)}
                className="bg-[#d4fc34]/15 hover:bg-[#d4fc34] text-[#d4fc34] hover:text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-lg border border-[#d4fc34]/25 hover:border-transparent transition-all flex items-center gap-1 cursor-pointer uppercase tracking-wider text-center w-fit mt-1"
              >
                <Calendar className="w-3 h-3" /> Asignar Cancha / Hora
              </button>
            )}
          </div>
        </div>

        {/* Team versus */}
        <div className="flex-1 max-w-lg">
          <div className="grid grid-cols-2 gap-4 items-center">
            <div className="text-right">
              <span className={`block text-xs font-bold ${finished && m.winnerPairId === m.pair1Id ? 'text-blue-400' : 'text-slate-200'}`}>
                {getPairName(m.pair1Id)}
              </span>
              {finished && m.winnerPairId === m.pair1Id && <span className="text-[10px] text-green-400 font-bold uppercase">WIN</span>}
            </div>
            <div className="border-l border-slate-800 pl-4">
              <span className={`block text-xs font-bold ${finished && m.winnerPairId === m.pair2Id ? 'text-blue-400' : 'text-slate-200'}`}>
                {getPairName(m.pair2Id)}
              </span>
              {finished && m.winnerPairId === m.pair2Id && <span className="text-[10px] text-green-400 font-bold uppercase">WIN</span>}
            </div>
          </div>
        </div>

        {/* Actions and Score */}
        <div className="flex items-center md:justify-end gap-3 shrink-0">
          {finished ? (
            <div className="text-right">
              <span className="bg-blue-600/10 text-blue-400 border border-blue-500/20 font-mono font-black px-2.5 py-1 rounded text-xs block">
                {m.scoreSummary}
              </span>
              {userRole === "admin" && (
                <button 
                  type="button"
                  onClick={() => handleOpenScorer(m)}
                  className="text-[10px] text-slate-500 hover:text-slate-300 font-semibold hover:underline mt-1 block w-full text-right"
                >
                  Corregir Marcador
                </button>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <span className="text-xs text-slate-500 font-mono italic flex items-center">Por jugar</span>
              {userRole === "admin" && (
                <button
                  type="button"
                  onClick={() => handleOpenScorer(m)}
                  className="bg-slate-800 hover:bg-slate-700 hover:text-blue-400 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition border border-slate-700 cursor-pointer"
                >
                  Cargar Resultado
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderButtonBar = () => {
    if (currentMatches.length === 0) return null;

    if (isSRTC32) {
      const r1Matches = currentMatches.filter(m => m.roundNumber === 1 || m.stageName.toLowerCase().includes("ronda 1"));
      const r2Matches = currentMatches.filter(m => m.roundNumber === 2 || m.stageName.toLowerCase().includes("ronda 2"));
      const oMatches = currentMatches.filter(m => m.roundNumber === 3 || m.stageName.toLowerCase().includes("octavos") || m.stageName.toLowerCase().includes("8avos"));
      const qMatches = currentMatches.filter(m => m.roundNumber === 4 || m.stageName.toLowerCase().includes("cuartos") || m.stageName.toLowerCase().includes("4tos"));
      const sfMatches = currentMatches.filter(m => m.roundNumber === 5 || m.stageName.toLowerCase().includes("semifinal"));
      const fMatches = currentMatches.filter(m => m.roundNumber === 6 || m.stageName.toLowerCase() === "final");

      return (
        <div className="flex flex-wrap gap-1.5 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800 shadow-sm mb-4">
          <span className="text-[10px] font-mono font-bold text-slate-450 uppercase tracking-wider px-2 py-1.5 flex items-center">Fases:</span>
          <button
            type="button"
            onClick={() => setFixtureFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold leading-none cursor-pointer transition-all ${
              fixtureFilter === "all"
                ? "bg-[#22d3ee]/15 text-[#22d3ee] border border-[#22d3ee]/30 font-black"
                : "bg-slate-950 text-slate-400 border border-slate-900 hover:text-white"
            }`}
          >
            Ver Todo
          </button>
          {r1Matches.length > 0 && (
            <button
              type="button"
              onClick={() => setFixtureFilter("r1")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold leading-none cursor-pointer transition-all ${
                fixtureFilter === "r1"
                  ? "bg-[#d4fc34]/15 text-[#d4fc34] border border-[#d4fc34]/30 font-black"
                  : "bg-slate-950 text-slate-400 border border-slate-900 hover:text-white"
              }`}
            >
              Ronda 1
            </button>
          )}
          {r2Matches.length > 0 && (
            <button
              type="button"
              onClick={() => setFixtureFilter("r2")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold leading-none cursor-pointer transition-all ${
                fixtureFilter === "r2"
                  ? "bg-[#d4fc34]/15 text-[#d4fc34] border border-[#d4fc34]/30 font-black"
                  : "bg-slate-950 text-slate-400 border border-slate-900 hover:text-white"
              }`}
            >
              Ronda 2
            </button>
          )}
          {oMatches.length > 0 && (
            <button
              type="button"
              onClick={() => setFixtureFilter("8avos")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold leading-none cursor-pointer transition-all ${
                fixtureFilter === "8avos"
                  ? "bg-[#d4fc34]/15 text-[#d4fc34] border border-[#d4fc34]/30 font-black"
                  : "bg-slate-950 text-slate-400 border border-slate-900 hover:text-white"
              }`}
            >
              8avos
            </button>
          )}
          {qMatches.length > 0 && (
            <button
              type="button"
              onClick={() => setFixtureFilter("4tos")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold leading-none cursor-pointer transition-all ${
                fixtureFilter === "4tos"
                  ? "bg-[#d4fc34]/15 text-[#d4fc34] border border-[#d4fc34]/30 font-black"
                  : "bg-slate-950 text-slate-400 border border-slate-900 hover:text-white"
              }`}
            >
              4tos
            </button>
          )}
          {sfMatches.length > 0 && (
            <button
              type="button"
              onClick={() => setFixtureFilter("semifinal")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold leading-none cursor-pointer transition-all ${
                fixtureFilter === "semifinal"
                  ? "bg-[#d4fc34]/15 text-[#d4fc34] border border-[#d4fc34]/30 font-black"
                  : "bg-slate-950 text-slate-400 border border-slate-900 hover:text-white"
              }`}
            >
              Semifinal
            </button>
          )}
          {fMatches.length > 0 && (
            <button
              type="button"
              onClick={() => setFixtureFilter("final")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold leading-none cursor-pointer transition-all ${
                fixtureFilter === "final"
                  ? "bg-[#d4fc34]/15 text-[#d4fc34] border border-[#d4fc34]/30 font-black"
                  : "bg-slate-950 text-slate-400 border border-slate-900 hover:text-white"
              }`}
            >
              Final
            </button>
          )}
        </div>
      );
    }

    if (isSRTC16) {
      const r1Matches = currentMatches.filter(m => m.roundNumber === 1 || m.stageName.toLowerCase().includes("ronda 1"));
      const r2Matches = currentMatches.filter(m => m.roundNumber === 2 || m.stageName.toLowerCase().includes("ronda 2"));
      const qMatches = currentMatches.filter(m => m.roundNumber === 3 || m.stageName.toLowerCase().includes("cuartos") || m.stageName.toLowerCase().includes("4tos"));
      const sfMatches = currentMatches.filter(m => m.roundNumber === 4 || m.stageName.toLowerCase().includes("semifinal"));
      const fMatches = currentMatches.filter(m => m.roundNumber === 5 || m.stageName.toLowerCase() === "final");

      return (
        <div className="flex flex-wrap gap-1.5 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800 shadow-sm mb-4">
          <span className="text-[10px] font-mono font-bold text-slate-450 uppercase tracking-wider px-2 py-1.5 flex items-center">Fases:</span>
          <button
            type="button"
            onClick={() => setFixtureFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold leading-none cursor-pointer transition-all ${
              fixtureFilter === "all"
                ? "bg-[#22d3ee]/15 text-[#22d3ee] border border-[#22d3ee]/30 font-black"
                : "bg-slate-950 text-slate-400 border border-slate-900 hover:text-white"
            }`}
          >
            Ver Todo
          </button>
          {r1Matches.length > 0 && (
            <button
              type="button"
              onClick={() => setFixtureFilter("r1")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold leading-none cursor-pointer transition-all ${
                fixtureFilter === "r1"
                  ? "bg-[#d4fc34]/15 text-[#d4fc34] border border-[#d4fc34]/30 font-black"
                  : "bg-slate-950 text-slate-400 border border-slate-900 hover:text-white"
              }`}
            >
              Ronda 1
            </button>
          )}
          {r2Matches.length > 0 && (
            <button
              type="button"
              onClick={() => setFixtureFilter("r2")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold leading-none cursor-pointer transition-all ${
                fixtureFilter === "r2"
                  ? "bg-[#d4fc34]/15 text-[#d4fc34] border border-[#d4fc34]/30 font-black"
                  : "bg-slate-950 text-slate-400 border border-slate-900 hover:text-white"
              }`}
            >
              Ronda 2
            </button>
          )}
          {qMatches.length > 0 && (
            <button
              type="button"
              onClick={() => setFixtureFilter("4tos")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold leading-none cursor-pointer transition-all ${
                fixtureFilter === "4tos"
                  ? "bg-[#d4fc34]/15 text-[#d4fc34] border border-[#d4fc34]/30 font-black"
                  : "bg-slate-950 text-slate-400 border border-slate-900 hover:text-white"
              }`}
            >
              4tos
            </button>
          )}
          {sfMatches.length > 0 && (
            <button
              type="button"
              onClick={() => setFixtureFilter("semifinal")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold leading-none cursor-pointer transition-all ${
                fixtureFilter === "semifinal"
                  ? "bg-[#d4fc34]/15 text-[#d4fc34] border border-[#d4fc34]/30 font-black"
                  : "bg-slate-950 text-slate-400 border border-slate-900 hover:text-white"
              }`}
            >
              Semifinal
            </button>
          )}
          {fMatches.length > 0 && (
            <button
              type="button"
              onClick={() => setFixtureFilter("final")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold leading-none cursor-pointer transition-all ${
                fixtureFilter === "final"
                  ? "bg-[#d4fc34]/15 text-[#d4fc34] border border-[#d4fc34]/30 font-black"
                  : "bg-slate-950 text-slate-400 border border-slate-900 hover:text-white"
              }`}
            >
              Final
            </button>
          )}
        </div>
      );
    }

    const hasGroup = currentMatches.some(m => m.phase === "group" || m.stageName.toLowerCase().includes("grupo") || m.stageName.toLowerCase().includes("ronda"));
    const has16 = currentMatches.some(m => m.phase === "playoff" && (m.stageName.toLowerCase().includes("16avos") || m.stageName.toLowerCase().includes("dieciseisavos")));
    const has8 = currentMatches.some(m => m.phase === "playoff" && (m.stageName.toLowerCase().includes("octavos") || m.stageName.toLowerCase().includes("8avos")));
    const has4 = currentMatches.some(m => m.phase === "playoff" && (m.stageName.toLowerCase().includes("cuartos") || m.stageName.toLowerCase().includes("4tos")));
    const hasSf = currentMatches.some(m => m.phase === "playoff" && m.stageName.toLowerCase().includes("semifinal"));
    const hasF = currentMatches.some(m => m.phase === "playoff" && m.stageName.toLowerCase() === "final");

    return (
      <div className="flex flex-wrap gap-1.5 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800 shadow-sm mb-4">
        <span className="text-[10px] font-mono font-bold text-slate-450 uppercase tracking-wider px-2 py-1.5 flex items-center">Fases:</span>
        <button
          type="button"
          onClick={() => setFixtureFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold leading-none cursor-pointer transition-all ${
            fixtureFilter === "all"
              ? "bg-[#22d3ee]/15 text-[#22d3ee] border border-[#22d3ee]/30 font-black"
              : "bg-slate-950 text-slate-400 border border-slate-900 hover:text-white"
          }`}
        >
          Ver Todo
        </button>
        {hasGroup && (
          <button
            type="button"
            onClick={() => setFixtureFilter("group")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold leading-none cursor-pointer transition-all ${
              fixtureFilter === "group"
                ? "bg-[#d4fc34]/15 text-[#d4fc34] border border-[#d4fc34]/30 font-black"
                : "bg-slate-950 text-slate-400 border border-slate-900 hover:text-white"
            }`}
          >
            Fase de Grupos
          </button>
        )}
        {has16 && (
          <button
            type="button"
            onClick={() => setFixtureFilter("16avos")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold leading-none cursor-pointer transition-all ${
              fixtureFilter === "16avos"
                ? "bg-[#d4fc34]/15 text-[#d4fc34] border border-[#d4fc34]/30 font-black"
                : "bg-slate-950 text-slate-400 border border-slate-900 hover:text-white"
            }`}
          >
            16avos
          </button>
        )}
        {has8 && (
          <button
            type="button"
            onClick={() => setFixtureFilter("8avos")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold leading-none cursor-pointer transition-all ${
              fixtureFilter === "8avos"
                ? "bg-[#d4fc34]/15 text-[#d4fc34] border border-[#d4fc34]/30 font-black"
                : "bg-slate-950 text-slate-400 border border-slate-900 hover:text-white"
            }`}
          >
            8avos
          </button>
        )}
        {has4 && (
          <button
            type="button"
            onClick={() => setFixtureFilter("4tos")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold leading-none cursor-pointer transition-all ${
              fixtureFilter === "4tos"
                ? "bg-[#d4fc34]/15 text-[#d4fc34] border border-[#d4fc34]/30 font-black"
                : "bg-slate-950 text-slate-400 border border-slate-900 hover:text-white"
            }`}
          >
            4tos
          </button>
        )}
        {hasSf && (
          <button
            type="button"
            onClick={() => setFixtureFilter("semifinal")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold leading-none cursor-pointer transition-all ${
              fixtureFilter === "semifinal"
                ? "bg-[#d4fc34]/15 text-[#d4fc34] border border-[#d4fc34]/30 font-black"
                : "bg-slate-950 text-slate-400 border border-slate-900 hover:text-white"
            }`}
          >
            Semifinal
          </button>
        )}
        {hasF && (
          <button
            type="button"
            onClick={() => setFixtureFilter("final")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold leading-none cursor-pointer transition-all ${
              fixtureFilter === "final"
                ? "bg-[#d4fc34]/15 text-[#d4fc34] border border-[#d4fc34]/30 font-black"
                : "bg-slate-950 text-slate-405 border border-[#d4fc34]/30"
            }`}
          >
            Final
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-sm text-white">Cronograma: {selectedCategory}</h3>
        <span className="text-xs text-slate-400 font-mono">
          PJ: {currentMatches.filter(m => m.status !== "pending").length} / Total: {currentMatches.length}
        </span>
      </div>

      {/* Panel de Filtros de Cronograma */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
        {/* Buscador de Cronograma */}
        <div className="space-y-1">
          <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Buscador de Cronograma</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input 
              type="text" 
              placeholder="Buscar por apellido de jugador..."
              value={scheduleSearch} 
              onChange={e => setScheduleSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-[#d4fc34] rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none" 
            />
          </div>
        </div>

        {/* Filtro de Fase */}
        <div className="space-y-1">
          <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Fase del Torneo</label>
          <select 
            value={phaseFilter} 
            onChange={e => setPhaseFilter(e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-[#d4fc34] rounded-lg p-2 text-xs text-slate-100 outline-none block appearance-none"
          >
            <option value="all">🏆 Todos los Partidos</option>
            <option value="group">🎾 Fase de Grupos / Zonas</option>
            <option value="playoff">🎬 Fase Playoffs / Llaves</option>
          </select>
        </div>
      </div>

      {renderButtonBar()}

      <div className="space-y-8">
        {groupKeys.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500 text-xs font-mono">
            No hay partidos registrados de momento para esta fase del torneo.
          </div>
        ) : (
          groupKeys.map(groupKey => {
            const groupMatches = grouped[groupKey];
            const groupIcon = getGroupIcon(groupKey);
            const isGroupPhase = groupKey.includes("Grupos") || groupKey.includes("Grupo");

            if (isGroupPhase) {
              const subGrouped: { [subGroup: string]: Match[] } = {};
              groupMatches.forEach(m => {
                const subName = getSubGroupName(m) || "Otros Partidos";
                if (!subGrouped[subName]) {
                  subGrouped[subName] = [];
                }
                subGrouped[subName].push(m);
              });

              const subGroupKeys = Object.keys(subGrouped).sort((a, b) => {
                if (a.includes("Otros") && !b.includes("Otros")) return 1;
                if (!a.includes("Otros") && b.includes("Otros")) return -1;
                return a.localeCompare(b);
              });

              return (
                <div key={groupKey} className="space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-2.5 ml-1">
                    <span className="text-lg select-none">{groupIcon}</span>
                    <h3 className="text-sm font-black uppercase tracking-wider text-[#d4fc34] drop-shadow-[0_1px_6px_rgba(212,252,52,0.1)]">
                      {groupKey}
                    </h3>
                    <span className="bg-slate-900 border border-slate-800 text-slate-400 text-[10px] font-mono px-2 py-0.5 rounded-lg font-bold">
                      {groupMatches.length} {groupMatches.length === 1 ? 'partido' : 'partidos'}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {subGroupKeys.map(subKey => {
                      const subMatches = subGrouped[subKey];
                      return (
                        <div key={subKey} className="space-y-2 bg-slate-900/40 border border-slate-800 p-3.5 rounded-2xl">
                          <div className="text-[10px] font-black uppercase tracking-widest text-[#d4fc34] ml-1 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#d4fc34]"></span>
                            {subKey}
                          </div>
                          <div className="bg-slate-900 border border-slate-850 rounded-xl divide-y divide-slate-800/50 overflow-hidden shadow-inner mt-2">
                            {subMatches.map(m => renderMatchRow(m))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            return (
              <div key={groupKey} className="space-y-3">
                <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-2.5 ml-1">
                  <span className="text-lg select-none">{groupIcon}</span>
                  <h3 className="text-sm font-black uppercase tracking-wider text-[#d4fc34] drop-shadow-[0_1px_6px_rgba(212,252,52,0.1)]">
                    {groupKey}
                  </h3>
                  <span className="bg-slate-900 border border-slate-800 text-slate-400 text-[10px] font-mono px-2 py-0.5 rounded-lg font-bold">
                    {groupMatches.length} {groupMatches.length === 1 ? 'partido' : 'partidos'}
                  </span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800/50 overflow-hidden shadow-inner">
                  {groupMatches.map(m => renderMatchRow(m))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {userRole === "admin" && currentMatches.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 mt-6">
          <div className="space-y-1">
            <span className="text-xs font-bold text-white block">Distribución de Canchas / Pistas para {selectedCategory}</span>
            <p className="text-[11px] text-slate-400 leading-snug">
              ¿Quieres agilizar la organización de esta categoría? Puedes disponer la cantidad total de canchas, realizar la asignación de canchas y horarios automáticamente, o asignarlas individualmente.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                if (tournament) {
                  setTempNumCourts(tournament.numCourts || 2);
                }
                setIsEditNumCourtsOpen(true);
              }}
              className="bg-[#d4fc34] hover:bg-[#c5f015] text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer uppercase tracking-wider font-black font-sans"
            >
              <Trophy className="w-4 h-4 text-slate-950" /> Disponer Cantidad de Canchas
            </button>
            <button
              onClick={handleAutoAssignCourts}
              className="bg-[#d4fc34] hover:bg-[#c5f015] text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer uppercase tracking-wider font-black font-sans"
            >
              <Sparkles className="w-4 h-4 text-slate-950" /> Asignar Canchas Rápidamente
            </button>
            <button
              onClick={handleResetCategory}
              className="bg-red-950/40 hover:bg-red-900/45 border border-red-500/20 text-red-00 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer uppercase tracking-wider font-extrabold font-sans"
            >
              <Trash2 className="w-4 h-4 text-red-400" /> Reiniciar Categoría
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
