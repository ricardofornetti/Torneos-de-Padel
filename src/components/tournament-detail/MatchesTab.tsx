import React, { useState } from 'react';
import { 
  MapPin, 
  Trophy, 
  Sparkles, 
  Trash2,
  Calendar,
  Search,
  Activity,
  Award,
  Zap,
  TrendingUp,
  Target,
  Shield,
  Swords,
  Tag
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
    if (label.includes("Grupos") || label.includes("Grupo")) return <Award className="w-4 h-4 text-[#d4fc34]" />;
    if (label === "Ronda 1") return <TrendingUp className="w-4 h-4 text-[#d4fc34]" />;
    if (label === "Ronda 2") return <Activity className="w-4 h-4 text-[#d4fc34]" />;
    if (label.includes("Clasificatoria")) return <Target className="w-4 h-4 text-[#d4fc34]" />;
    if (label.includes("16avos")) return <Shield className="w-4 h-4 text-[#d4fc34]" />;
    if (label.includes("Octavos") || label.includes("8avos")) return <Zap className="w-4 h-4 text-[#d4fc34]" />;
    if (label.includes("Cuartos") || label.includes("4tos")) return <Swords className="w-4 h-4 text-[#d4fc34]" />;
    if (label.includes("Semifinales") || label.includes("Semifinal")) return <Award className="w-4 h-4 text-[#d4fc34]" />;
    if (label.includes("Gran Final") || label.includes("Final")) return <Trophy className="w-4 h-4 text-[#d4fc34]" />;
    return <Tag className="w-4 h-4 text-[#d4fc34]" />;
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

  const renderMatchCard = (m: Match) => {
    const finished = m.status === "completed" || m.status === "wo";
    return (
      <div 
        key={m.id}
        className="bg-slate-900 border border-slate-800/80 rounded-xl p-3 sm:p-4 flex flex-col justify-between hover:border-slate-700 transition relative group"
      >
        {/* Top labels */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono border-b border-slate-850/80 pb-2 mb-3.5">
          <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-850 text-[9px] font-bold uppercase text-cyan-400">
            {m.stageName} • Ronda {m.roundNumber}
          </span>
          <span className="font-medium text-slate-450">
            {m.phase === "group" ? "Fase Zonas" : "Eliminación"}
          </span>
        </div>

        {/* Opponents showdown visual block */}
        <div className="space-y-2 pt-1 pb-3">
          {/* Team A */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[9px] bg-slate-800 w-4 h-4 text-slate-400 flex items-center justify-center rounded font-mono font-bold">A</span>
              <span className={`text-[10px] sm:text-[12px] font-bold ${finished && m.winnerPairId === m.pair1Id ? 'text-[#d4fc34] font-black' : 'text-slate-150'}`}>
                {getPairName(m.pair1Id)}
              </span>
            </div>
            {finished && (
              <span className={`font-mono text-xs font-black px-2 py-0.5 rounded border ${m.winnerPairId === m.pair1Id ? 'bg-[#d4fc34]/15 text-[#d4fc34] border-[#d4fc34]/20' : 'bg-slate-950 text-slate-600 border-slate-850'}`}>
                {m.winnerPairId === m.pair1Id ? "W" : "L"}
              </span>
            )}
          </div>

          {/* Team B */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[9px] bg-slate-800 w-4 h-4 text-slate-400 flex items-center justify-center rounded font-mono font-bold">B</span>
              <span className={`text-[10px] sm:text-[12px] font-bold ${finished && m.winnerPairId === m.pair2Id ? 'text-[#d4fc34] font-black' : 'text-slate-150'}`}>
                {getPairName(m.pair2Id)}
              </span>
            </div>
            {finished && (
              <span className={`font-mono text-xs font-black px-2 py-0.5 rounded border ${m.winnerPairId === m.pair2Id ? 'bg-[#d4fc34]/15 text-[#d4fc34] border-[#d4fc34]/20' : 'bg-slate-950 text-slate-600 border-slate-850'}`}>
                {m.winnerPairId === m.pair2Id ? "W" : "L"}
              </span>
            )}
          </div>
        </div>

        {/* Score or Status summary details block */}
        <div className="pt-2 px-3 py-2.5 bg-slate-950/80 rounded-xl border border-slate-850 flex items-center justify-between mt-2.5">
          {/* Left Info: Court and clock */}
          <div className="flex items-center gap-3.5 text-[10px] text-slate-400 font-mono">
            {(() => {
              const courtName = courts.find(c => c.id === m.courtId)?.name;
              return courtName ? (
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  <span className="font-bold text-slate-200">{courtName}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-slate-550">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                  <span>Sin Cancha</span>
                </div>
              );
            })()}

            {m.date ? (
              <div className="flex items-center gap-1 font-bold">
                <span>{formatDate(m.date)}</span>
                {m.time && <span className="text-slate-500">@{m.time}h</span>}
              </div>
            ) : (
              <div className="text-slate-550">
                <span>Sin hora</span>
              </div>
            )}
          </div>

          {/* Right Info: score summary */}
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded ${finished ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20' : 'bg-slate-900 border border-slate-800 text-slate-500'}`}>
              {m.scoreSummary || "Por jugar"}
            </span>
          </div>
        </div>

        {/* Admin actions block */}
        {userRole === "admin" && (
          <div className="mt-3 pt-3 border-t border-slate-850/85 flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenCourtAssigner(m)}
              className="flex-1 bg-slate-950 hover:bg-slate-850 text-slate-350 hover:text-white border border-slate-800 hover:border-slate-700 text-[10px] font-mono font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
            >
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              {m.courtId ? "Programar" : "Asignar Cancha"}
            </button>
            <button
              type="button"
              onClick={() => handleOpenScorer(m)}
              className="flex-1 bg-[#d4fc34]/10 hover:bg-[#d4fc34] text-[#d4fc34] hover:text-slate-950 border border-[#d4fc34]/20 hover:border-transparent text-[10px] font-mono font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
            >
              <Trophy className="w-3.5 h-3.5" />
              {finished ? "Corregir" : "Cargar Score"}
            </button>
          </div>
        )}
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
        <div className="space-y-2">
          <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Fase del Torneo</label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "all", label: "Todos los Partidos" },
              { id: "group", label: "Fase de Grupos / Zonas" },
              { id: "playoff", label: "Fase Playoffs / Llaves" }
            ].map(phase => (
              <button
                key={phase.id}
                type="button"
                onClick={() => setPhaseFilter(phase.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase cursor-pointer ${
                  phaseFilter === phase.id
                    ? "bg-[#d4fc34] text-slate-950 shadow-md font-extrabold"
                    : "bg-slate-950 text-slate-400 border border-slate-850 hover:text-white"
                }`}
              >
                {phase.label}
              </button>
            ))}
          </div>
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
                    <div className="flex items-center justify-center shrink-0">{groupIcon}</div>
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
                          <div className="grid grid-cols-2 gap-3 mt-2">
                            {subMatches.map(m => renderMatchCard(m))}
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
                  <div className="flex items-center justify-center shrink-0">{groupIcon}</div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-[#d4fc34] drop-shadow-[0_1px_6px_rgba(212,252,52,0.1)]">
                    {groupKey}
                  </h3>
                  <span className="bg-slate-900 border border-slate-800 text-slate-400 text-[10px] font-mono px-2 py-0.5 rounded-lg font-bold">
                    {groupMatches.length} {groupMatches.length === 1 ? 'partido' : 'partidos'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-2">
                  {groupMatches.map(m => renderMatchCard(m))}
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

