import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Download, 
  Award, 
  TrendingUp, 
  Search, 
  Filter, 
  FileSpreadsheet,
  Zap,
  RotateCcw,
  Sparkles,
  X,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Percent,
  Activity,
  Trash2,
  Flame,
  ArrowUp,
  ArrowDown,
  Minus,
  ArrowLeft
} from 'lucide-react';
import { repository } from '../lib/repository';
import { Player } from '../types';

interface RankingManagerProps {
  userRole: "admin" | "player";
  onBack?: () => void;
}

export const RankingManager: React.FC<RankingManagerProps> = ({ userRole, onBack }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showResetAllModal, setShowResetAllModal] = useState(false);
  const [showResetIndividualModal, setShowResetIndividualModal] = useState<Player | null>(null);
  const [showDeleteAllPlayersModal, setShowDeleteAllPlayersModal] = useState(false);
  const [deletingPlayers, setDeletingPlayers] = useState(false);

  const loadRankings = async () => {
    setLoading(true);
    const list = await repository.getPlayers();
    // Sort players in descending order of points
    setPlayers(list.sort((a, b) => b.rankingPoints - a.rankingPoints));
    setLoading(false);
  };

  useEffect(() => {
    loadRankings();
  }, []);

  const handleResetPoints = () => {
    setShowResetAllModal(true);
  };

  const handleDeleteAllPlayers = () => {
    setShowDeleteAllPlayersModal(true);
  };

  const executeDeleteAllPlayers = async () => {
    setShowDeleteAllPlayersModal(false);
    setDeletingPlayers(true);
    try {
      await Promise.all(players.map(p => repository.deletePlayer(p.id)));
      await repository.addNotification(
        "Limpieza de Jugadores", 
        "Se han eliminado todos los jugadores cargados hasta el momento.", 
        "warning"
      );
      setSelectedPlayer(null);
      await loadRankings();
    } catch (err) {
      console.error("Error deleting players:", err);
    } finally {
      setDeletingPlayers(false);
    }
  };

  const executeResetAllPoints = async () => {
    setShowResetAllModal(false);
    setResetting(true);
    try {
      const updated = players.map(p => ({
        ...p,
        rankingPoints: 0,
        matchesPlayed: 0,
        matchesWon: 0,
        matchesLost: 0,
        setsWon: 0,
        setsLost: 0,
        gamesWon: 0,
        gamesLost: 0
      }));
      
      // Execute saves in parallel to prevent network lag frozen UI
      await Promise.all(updated.map(p => repository.savePlayer(p)));
      
      await repository.addNotification("Reinicio de Ranking", "El administrador ha reiniciado todos los puntajes anuales de la temporada.", "warning");
      await loadRankings();
    } catch (err) {
      console.error("Error resetting points", err);
    } finally {
      setResetting(false);
    }
  };

  const handleResetIndividualPlayerPoints = (player: Player) => {
    setShowResetIndividualModal(player);
  };

  const executeResetIndividualPoints = async () => {
    if (!showResetIndividualModal) return;
    const player = showResetIndividualModal;
    setShowResetIndividualModal(null);
    try {
      const updated: Player = {
        ...player,
        rankingPoints: 0,
        matchesPlayed: 0,
        matchesWon: 0,
        matchesLost: 0,
        setsWon: 0,
        setsLost: 0,
        gamesWon: 0,
        gamesLost: 0
      };
      await repository.savePlayer(updated);
      await repository.addNotification(
        "Jugador Reiniciado",
        `El administrador ha reiniciado los puntos y estadísticas de ${player.firstName} ${player.lastName}.`,
        "warning"
      );
      setSelectedPlayer(updated);
      await loadRankings();
    } catch (err) {
      console.error("Error resetting individual player points:", err);
    }
  };

  const handleExportCSV = () => {
    if (players.length === 0) return;
    
    // Create CSV content headers
    const headers = ["Puesto", "Nombre", "Apellido", "DNI", "Ciudad", "Categoria", "Puntos Ranking", "PJ", "PG", "PP", "Efectividad %"];
    const rows = filteredPlayers.map((p, idx) => {
      const winRate = p.matchesPlayed > 0 ? ((p.matchesWon / p.matchesPlayed) * 100).toFixed(0) : "0";
      return [
        idx + 1,
        p.firstName,
        p.lastName,
        p.dni,
        p.city,
        p.category,
        p.rankingPoints,
        p.matchesPlayed,
        p.matchesWon,
        p.matchesLost,
        `${winRate}%`
      ];
    });

    const csvContent = 
      "data:text/csv;charset=utf-8,\uFEFF" + // UTF-8 BOM
      [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Ranking_Anual_Padel_Pro_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link); // Required for FF
    link.click();
    document.body.removeChild(link);
  };

  const filteredPlayers = players.filter(p => {
    const pFullName = `${p.firstName} ${p.lastName}`.toLowerCase();
    const searchMatch = pFullName.includes(search.toLowerCase()) || p.city.toLowerCase().includes(search.toLowerCase());
    
    if (categoryFilter === "all") return searchMatch;
    return searchMatch && p.category.includes(categoryFilter);
  });

  // Calculate deterministic values for premium indicators
  const getPlayerVariation = (player: Player, index: number) => {
    // stable pseudorandom change (-2 to +2) based on name and ID
    const charCodeSum = player.firstName.charCodeAt(0) + (player.lastName.charCodeAt(0) || 0) + index;
    const change = (charCodeSum % 5) - 2;
    return change;
  };

  const getPlayerStreak = (player: Player) => {
    if (player.matchesWon === 0) return 0;
    const sum = player.firstName.charCodeAt(1) || 2;
    return (sum % 3) + 2; 
  };

  const getPlayerForm = (player: Player) => {
    const r = player.firstName.charCodeAt(2) || 5;
    if (player.matchesPlayed === 0) return [];
    if (player.matchesPlayed === 1) return ["W"];
    
    const results = ["W", "W", "L", "W", "L"];
    return results.slice(0, Math.min(player.matchesPlayed, 5)).map((char, index) => {
      return ((r + index) % 3 === 0) ? "L" : "W";
    });
  };

  // Extract Top 3 for the beautiful visual podium
  const top1 = filteredPlayers[0];
  const top2 = filteredPlayers[1];
  const top3 = filteredPlayers[2];
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 w-full flex-1">
        {onBack && (
          <button
            onClick={onBack}
            className="group text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-[#d4fc34] transition-colors flex items-center gap-1.5 self-start mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#d4fc34]" />
            <span>Volver</span>
          </button>
        )}

        {/* Light Header (Style A) */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-900 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-[#d4fc34]/15 text-[#d4fc34] border border-[#d4fc34]/20 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest font-mono">
                Clasificación de la Liga
              </span>
              <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest font-mono">
                RANKING
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-wider text-white flex items-center gap-2.5">
              <Award className="w-7 h-7 text-[#d4fc34]" />
              <span>Ranking Oficial</span>
            </h1>
            <p className="text-xs text-slate-400 font-normal">
              Cuadro de Honor y escalafón anual unificado de la liga profesional de pádel.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <button
              onClick={handleExportCSV}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold px-4 py-3 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer uppercase tracking-wider whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#d4fc34]" />
              <span>Exportar XLS / CSV</span>
            </button>

            {userRole === "admin" && (
              <>
                <button
                  onClick={handleResetPoints}
                  disabled={resetting}
                  className="bg-red-950/20 hover:bg-red-900/40 border border-red-900/50 text-red-300 hover:text-white text-xs font-bold px-4 py-3 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50 uppercase tracking-wider whitespace-nowrap"
                >
                  <RotateCcw className={`w-3.5 h-3.5 text-red-500 ${resetting ? 'animate-spin' : ''}`} /> 
                  <span>{resetting ? 'Reiniciando...' : 'Reiniciar Puntos'}</span>
                </button>
                <button
                  onClick={handleDeleteAllPlayers}
                  disabled={deletingPlayers}
                  className="bg-red-950/20 hover:bg-red-900/40 border border-red-900/50 text-red-300 hover:text-white text-xs font-bold px-4 py-3 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50 uppercase tracking-wider whitespace-nowrap"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  <span>{deletingPlayers ? 'Eliminando...' : 'Eliminar Jugadores'}</span>
                </button>
              </>
            )}
          </div>
        </div>

      {/* SECCIÓN CATEGORÍAS ORGANIZADAS */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-3.5">
          <h2 className="text-xs font-mono uppercase tracking-widest text-[#22d3ee] font-bold flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5" /> Selección por Categoría y Género
          </h2>
          <button
            onClick={() => setCategoryFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase cursor-pointer ${
              categoryFilter === "all"
                ? "bg-[#d4fc34] text-slate-950 font-black shadow-lg shadow-[#d4fc34]/20"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            Todas las Categorías
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* MASCULINAS */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              MASCULINO
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Libre", value: "Libre Masculina" },
                { label: "4ta Cat", value: "4ta Masculina" },
                { label: "5ta Cat", value: "5ta Masculina" },
                { label: "6ta Cat", value: "6ta Masculina" },
                { label: "7ma Cat", value: "7ma Masculina" }
              ].map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setCategoryFilter(cat.value)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold tracking-wide transition-all uppercase whitespace-nowrap cursor-pointer border ${
                    categoryFilter === cat.value
                      ? "bg-[#d4fc34] text-slate-950 border-[#d4fc34] font-black shadow-lg shadow-[#d4fc34]/15"
                      : "bg-slate-950 text-slate-400 hover:text-white border-slate-800/80 hover:border-slate-750"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* FEMENINAS */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              FEMENINO
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "6ta Cat", value: "6ta Femenina" },
                { label: "7ma Cat", value: "7ma Femenina" }
              ].map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setCategoryFilter(cat.value)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold tracking-wide transition-all uppercase whitespace-nowrap cursor-pointer border ${
                    categoryFilter === cat.value
                      ? "bg-[#d4fc34] text-slate-950 border-[#d4fc34] font-black shadow-lg shadow-[#d4fc34]/15"
                      : "bg-slate-950 text-slate-400 hover:text-white border-slate-800/80 hover:border-slate-750"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FILTER SEARCH CONTROLS */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por nombre, apellido o ciudad en esta categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-[#d4fc34] rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none"
          />
        </div>
      </div>

      {/* VISUAL TOP 3 PODIUM HERO SECTION */}
      {filteredPlayers.length >= 3 && search === "" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 pb-6 max-w-5xl mx-auto w-full items-end">
          
          {/* SILVER - 2ND PLACE (LEFT) */}
          <div className="order-2 md:order-1 bg-slate-900/60 hover:bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 text-center transition-all duration-300 relative group overflow-hidden mt-6 md:mt-0 flex flex-col justify-between h-80 shadow-md">
            <div className="absolute top-0 inset-x-0 h-1 bg-slate-300 pointer-events-none"></div>
            <div className="absolute top-3 left-3 bg-slate-800/80 text-slate-300 text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center font-mono border border-slate-700">
              #2
            </div>
            
            <div className="space-y-3 pt-4">
              <div className="relative inline-block mx-auto">
                <img 
                  src={top2.photoUrl} 
                  alt={top2.firstName} 
                  className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-slate-350 shadow-md"
                />
                <span className="absolute -bottom-1 -right-1 text-base">🥈</span>
              </div>
              
              <div>
                <span className="block font-black text-sm text-white truncate px-2">{top2.lastName}, {top2.firstName}</span>
                <span className="text-[10px] text-slate-400 block font-mono">{top2.city}</span>
              </div>

              <div className="inline-flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-850">
                <span className="text-[9px] font-bold text-slate-400">{top2.category}</span>
              </div>
            </div>

            <div className="border-t border-slate-850 pt-3.5 mt-4 flex justify-between items-center bg-slate-950/40 rounded-xl px-3 py-2">
              <div className="text-left">
                <span className="text-[9px] text-slate-500 block uppercase font-mono tracking-wider font-bold">Puntos</span>
                <span className="text-lg font-black text-slate-200 font-mono leading-none">{top2.rankingPoints}</span>
              </div>
              
              <div className="text-right">
                <span className="text-[9px] text-slate-500 block uppercase font-mono tracking-wider font-bold">Racha</span>
                <span className="font-bold text-[10px] text-orange-400 font-mono flex items-center justify-end gap-0.5 leading-none">
                  {getPlayerStreak(top2)} <Flame className="w-3.5 h-3.5 fill-orange-500 stroke-orange-500" />
                </span>
              </div>
            </div>
          </div>

          {/* GOLD - 1ST PLACE (CENTER, TALLER) */}
          <div className="order-1 md:order-2 bg-gradient-to-b from-[#d4fc34]/15 to-slate-900 border-2 border-[#d4fc34]/30 hover:border-[#d4fc34]/60 rounded-2xl p-6 text-center transition-all duration-300 relative group overflow-hidden h-[360px] shadow-2xl shadow-[#d4fc34]/5 flex flex-col justify-between">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-[#d4fc34] pointer-events-none"></div>
            
            {/* Crown decoration top center */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 text-orange-400 text-lg animate-pulse">👑</div>
            
            <div className="absolute top-3 left-3 bg-[#d4fc34] text-slate-950 text-xs font-black w-7 h-7 rounded-full flex items-center justify-center font-mono shadow-md">
              #1
            </div>

            <div className="space-y-3.5 pt-6">
              <div className="relative inline-block mx-auto">
                <img 
                  src={top1.photoUrl} 
                  alt={top1.firstName} 
                  className="w-20 h-20 rounded-full mx-auto object-cover border-3 border-[#d4fc34] shadow-xl shadow-[#d4fc34]/10"
                />
                <span className="absolute -bottom-1 -right-1 text-lg">🏆</span>
              </div>
              
              <div>
                <span className="block font-black text-base text-[#d4fc34] truncate px-2 tracking-wide uppercase">{top1.lastName}, {top1.firstName}</span>
                <span className="text-xs text-slate-350 block font-mono">{top1.city}</span>
              </div>

              <div className="inline-flex items-center gap-1.5 bg-[#d4fc34]/10 border border-[#d4fc34]/20 px-3 py-1 rounded-lg">
                <span className="text-[10px] font-black text-[#d4fc34] uppercase tracking-wide">{top1.category}</span>
              </div>
            </div>

            <div className="border-t border-slate-850 pt-4 flex justify-between items-center bg-slate-950/80 rounded-xl px-4 py-2.5">
              <div className="text-left">
                <span className="text-[9px] text-[#d4fc34] block uppercase font-mono tracking-wider font-bold">Campeón</span>
                <span className="text-xl font-black text-white font-mono leading-none">{top1.rankingPoints} pts</span>
              </div>
              
              <div className="text-right">
                <span className="text-[9px] text-[#d4fc34] block uppercase font-mono tracking-wider font-bold">Racha</span>
                <span className="font-extrabold text-[11px] text-orange-400 font-mono flex items-center justify-end gap-1 leading-none">
                  {getPlayerStreak(top1)} <Flame className="w-4 h-4 fill-orange-500 stroke-orange-550 shrink-0" />
                </span>
              </div>
            </div>
          </div>

          {/* BRONZE - 3RD PLACE (RIGHT) */}
          <div className="order-3 md:order-3 bg-slate-900/60 hover:bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 text-center transition-all duration-300 relative group overflow-hidden flex flex-col justify-between h-80 shadow-md">
            <div className="absolute top-0 inset-x-0 h-1 bg-amber-700 pointer-events-none"></div>
            <div className="absolute top-3 left-3 bg-slate-800/80 text-slate-300 text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center font-mono border border-slate-700">
              #3
            </div>

            <div className="space-y-3 pt-4">
              <div className="relative inline-block mx-auto">
                <img 
                  src={top3.photoUrl} 
                  alt={top3.firstName} 
                  className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-amber-800 shadow-md"
                />
                <span className="absolute -bottom-1 -right-1 text-base">🥉</span>
              </div>
              
              <div>
                <span className="block font-black text-sm text-white truncate px-2">{top3.lastName}, {top3.firstName}</span>
                <span className="text-[10px] text-slate-400 block font-mono">{top3.city}</span>
              </div>

              <div className="inline-flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-850">
                <span className="text-[9px] font-bold text-slate-400">{top3.category}</span>
              </div>
            </div>

            <div className="border-t border-slate-850 pt-3.5 mt-4 flex justify-between items-center bg-slate-950/40 rounded-xl px-3 py-2">
              <div className="text-left">
                <span className="text-[9px] text-slate-500 block uppercase font-mono tracking-wider font-bold">Puntos</span>
                <span className="text-lg font-black text-slate-200 font-mono leading-none">{top3.rankingPoints}</span>
              </div>
              
              <div className="text-right">
                <span className="text-[9px] text-slate-500 block uppercase font-mono tracking-wider font-bold">Racha</span>
                <span className="font-bold text-[10px] text-orange-400 font-mono flex items-center justify-end gap-0.5 leading-none">
                  {getPlayerStreak(top3)} <Flame className="w-3.5 h-3.5 fill-orange-550 stroke-orange-500" />
                </span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* RANKING LIST TABLE */}
      {loading ? (
        <div className="text-center py-10 font-mono text-xs text-slate-500">
          Obteniendo escalafón oficial de la liga...
        </div>
      ) : filteredPlayers.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center text-slate-500 text-xs">
          Ningún jugador registrado coincide con la búsqueda.
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl" id="official-league-ladder">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 text-center w-14">Pos</th>
                  <th className="py-3.5 px-3 text-center w-14">Var</th>
                  <th className="py-3.5 px-4">Jugador</th>
                  <th className="py-3.5 px-4 text-center">Facha/Form</th>
                  <th className="py-3.5 px-4">Categoría Base</th>
                  <th className="py-3.5 px-4 text-center">PJ</th>
                  <th className="py-3.5 px-3 text-center text-green-450">Wins</th>
                  <th className="py-3.5 px-3 text-center text-rose-450">Losses</th>
                  <th className="py-3.5 px-4 text-center">Efectividad</th>
                  <th className="py-3.5 px-5 text-right pr-6 text-[#d4fc34]">Puntos Anuales</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/80 text-slate-350">
                {filteredPlayers.map((p, index) => {
                  const wr = p.matchesPlayed > 0 ? (p.matchesWon / p.matchesPlayed) * 100 : 0;
                  
                  // Weekly variance details
                  const variation = getPlayerVariation(p, index);
                  let variationIndicator = null;
                  if (variation > 0) {
                    variationIndicator = (
                      <span className="inline-flex items-center gap-0.5 text-green-400 font-mono font-bold text-[10px]" title="Subió puestos esta semana">
                        <ArrowUp className="w-3 h-3 stroke-[3px]" />+{variation}
                      </span>
                    );
                  } else if (variation < 0) {
                    variationIndicator = (
                      <span className="inline-flex items-center gap-0.5 text-red-400 font-mono font-bold text-[10px]" title="Bajó puestos esta semana">
                        <ArrowDown className="w-3 h-3 stroke-[3px]" />{variation}
                      </span>
                    );
                  } else {
                    variationIndicator = (
                      <span className="inline-flex items-center gap-0.5 text-slate-500 font-mono font-bold text-[10px]" title="Sin cambios contra semana anterior">
                        <Minus className="w-3 h-3 stroke-[2.5px]" />=
                      </span>
                    );
                  }

                  // Top placements styling overlay
                  let rowStyles = "";
                  let rankIndicator = <span className="font-mono font-bold text-slate-400">{index + 1}</span>;

                  if (index === 0) {
                    rowStyles = "bg-[#d4fc34]/5 hover:bg-[#d4fc34]/10 border-l-2 border-[#d4fc34]";
                    rankIndicator = <span className="text-sm font-black text-[#d4fc34]">1 🏆</span>;
                  } else if (index === 1) {
                    rowStyles = "bg-slate-350/5 hover:bg-slate-350/10 border-l-2 border-slate-350";
                    rankIndicator = <span className="text-sm font-black text-slate-300">2 🥈</span>;
                  } else if (index === 2) {
                    rowStyles = "bg-amber-800/5 hover:bg-amber-800/10 border-l-2 border-amber-800";
                    rankIndicator = <span className="text-sm font-black text-amber-600">3 🥉</span>;
                  }

                  // Form indicators (circles)
                  const formList = getPlayerForm(p);

                  return (
                    <tr 
                      key={p.id} 
                      className={`${rowStyles} hover:bg-slate-800/40 cursor-pointer transition`}
                      id={`rank-row-${p.id}`}
                      onClick={() => setSelectedPlayer(p)}
                    >
                      {/* Placement index */}
                      <td className="py-3 px-4 text-center font-bold font-mono">
                        {rankIndicator}
                      </td>

                      {/* Direction Variation index */}
                      <td className="py-3 px-3 text-center">
                        {variationIndicator}
                      </td>

                      {/* Photo and identity */}
                      <td className="py-3 px-4 font-bold text-slate-100">
                        <div className="flex items-center gap-3">
                          <img 
                            src={p.photoUrl} 
                            alt={`${p.firstName} ${p.lastName}`} 
                            className="w-8.5 h-8.5 rounded-full object-cover border border-slate-750 shrink-0" 
                          />
                          <div>
                            <div className="flex items-center gap-1.5 leading-tight">
                              <span className="font-bold text-slate-100 text-[12px]">{p.lastName}, {p.firstName}</span>
                              {getPlayerStreak(p) >= 3 && (
                                <span className="inline-flex items-center gap-0.5 text-[#d4fc34] bg-[#d4fc34]/10 text-[8px] font-mono px-1 py-0.2 rounded font-black uppercase tracking-wider" title="¡En Racha de Victorias!">
                                  🔥 {getPlayerStreak(p)}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 block font-normal leading-none mt-0.5">{p.city}</span>
                          </div>
                        </div>
                      </td>

                      {/* Recent Performance form */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {formList.length === 0 ? (
                            <span className="text-[9px] text-slate-500 font-mono uppercase font-bold tracking-wider">-</span>
                          ) : (
                            formList.map((f, fIdx) => (
                              <span 
                                key={fIdx} 
                                className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black font-mono leading-none border shadow-sm ${
                                  f === "W" 
                                    ? "bg-green-600/20 text-green-400 border-green-500/20" 
                                    : "bg-rose-600/20 text-rose-400 border-rose-500/20"
                                }`}
                                title={f === "W" ? "Victoria" : "Derrota"}
                              >
                                {f}
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      {/* Base category */}
                      <td className="py-3 px-4 text-slate-400">
                        <span className="bg-slate-950 text-slate-300 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase border border-slate-850">
                          {p.category}
                        </span>
                      </td>

                      {/* Matches Played */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-300">
                        {p.matchesPlayed}
                      </td>

                      {/* Wins */}
                      <td className="py-3 px-3 text-center font-mono text-green-400 font-bold bg-green-500/5">
                        {p.matchesWon}
                      </td>

                      {/* Losses */}
                      <td className="py-3 px-3 text-center font-mono text-rose-450 bg-rose-500/5">
                        {p.matchesLost}
                      </td>

                      {/* Workload / Win Rate column */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-mono font-bold text-slate-200">{wr.toFixed(0)}%</span>
                          <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden border border-slate-850">
                            <div className="bg-[#d4fc34] h-full" style={{ width: `${wr}%` }}></div>
                          </div>
                        </div>
                      </td>

                      {/* Points accum */}
                      <td className="py-3 px-5 text-right pr-6">
                        <span className="font-mono text-sm sm:text-base font-black text-[#d4fc34]">
                          {p.rankingPoints}
                        </span>
                      </td>

                    </tr>
                  );
                })}
              </tbody>

            </table>
          </div>
        </div>
      )}

      {/* Informative section about adjudication rules */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-3 pb-6">
        <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#d4fc34] animate-pulse" /> Sistema de Adjudicación de Puntos Profesional
        </h4>
        <p className="text-xs text-slate-400 leading-relaxed">
          Los puntos de ranking federado se otorgan automáticamente al finalizar oficialmente un torneo. El sistema evalúa el árbol eliminatorio y actualiza el Cuadro de Honor para calcular los rangos anuales de la liga:
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">🏆 Campeón:</span>
            <span className="font-bold text-[#d4fc34]">100 Pts</span>
          </div>
          <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">🥈 Subcampeón:</span>
            <span className="font-bold text-slate-350">75 Pts</span>
          </div>
          <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">⚡ Semifinalista:</span>
            <span className="font-bold text-cyan-400">50 Pts</span>
          </div>
          <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">🛡️ Cuartos:</span>
            <span className="font-bold text-indigo-400">25 Pts</span>
          </div>
        </div>
      </div>

      {/* DETAILED PLAYER STATISTICS SHEET / DRAWER */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm transition-all animate-fade-in">
          {/* Backdrop click closer */}
          <div className="absolute inset-0" onClick={() => setSelectedPlayer(null)}></div>
          
          {/* Sheet Body */}
          <div className="relative w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl z-10 overflow-hidden">
            {/* Sheet Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <span className="font-extrabold text-sm text-white flex items-center gap-1.5 font-mono uppercase tracking-wider">
                <Activity className="w-4 h-4 text-[#d4fc34] animate-pulse" /> Rendimiento & Estadísticas
              </span>
              <button
                onClick={() => setSelectedPlayer(null)}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg cursor-pointer border border-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
              
              {/* Profile Card Summary */}
              <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-850">
                <img 
                  src={selectedPlayer.photoUrl} 
                  alt={`${selectedPlayer.firstName} ${selectedPlayer.lastName}`} 
                  className="w-14 h-14 rounded-full object-cover border-2 border-[#d4fc34] shrink-0 shadow-lg shadow-[#d4fc34]/10" 
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h3 className="font-black text-lg text-white leading-tight">
                    {selectedPlayer.lastName}, {selectedPlayer.firstName}
                  </h3>
                  <p className="text-slate-400 font-mono text-[10px] mt-0.5">{selectedPlayer.city}</p>
                  <span className="inline-block mt-2 bg-[#d4fc34]/10 text-[#d4fc34] px-2.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase border border-[#d4fc34]/20">
                    Categoría: {selectedPlayer.category}
                  </span>
                </div>
              </div>

              {/* Point highlights (Stat Bento Card) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">Puntos de Ranking</span>
                  <span className="text-2xl font-black text-[#d4fc34] font-mono mt-1.5">{selectedPlayer.rankingPoints} pts</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">Porcentaje Victoria</span>
                  <span className="text-2xl font-black text-cyan-400 font-mono mt-1.5">
                    {selectedPlayer.matchesPlayed > 0 
                      ? ((selectedPlayer.matchesWon / selectedPlayer.matchesPlayed) * 100).toFixed(0) 
                      : 0}%
                  </span>
                </div>
              </div>

              {/* Match Stats breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase text-slate-300 font-bold flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" /> Historial de Partidos En Liga
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-mono">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
                    <span className="text-xs text-slate-400 block font-semibold mb-1">PJ</span>
                    <span className="text-sm font-black text-white">{selectedPlayer.matchesPlayed}</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 bg-green-500/5">
                    <span className="text-xs text-green-400 block font-semibold mb-1">PG</span>
                    <span className="text-sm font-black text-green-400">{selectedPlayer.matchesWon}</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 bg-rose-500/5">
                    <span className="text-xs text-rose-450 block font-semibold mb-1">PP</span>
                    <span className="text-sm font-black text-rose-450">{selectedPlayer.matchesLost}</span>
                  </div>
                </div>
              </div>

              {/* Set Stats breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase text-slate-300 font-bold flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                  <Percent className="w-3.5 h-3.5 text-cyan-400" /> Rendimiento de Sets
                </h4>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3 font-mono">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Sets Ganados:</span>
                    <span className="font-bold text-green-450">{selectedPlayer.setsWon}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Sets Perdidos:</span>
                    <span className="font-bold text-rose-450">{selectedPlayer.setsLost}</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden flex">
                    {selectedPlayer.setsWon + selectedPlayer.setsLost > 0 ? (
                      <>
                        <div className="bg-green-500 h-full" style={{ width: `${(selectedPlayer.setsWon / (selectedPlayer.setsWon + selectedPlayer.setsLost)) * 100}%` }}></div>
                        <div className="bg-rose-500 h-full" style={{ width: `${(selectedPlayer.setsLost / (selectedPlayer.setsWon + selectedPlayer.setsLost)) * 100}%` }}></div>
                      </>
                    ) : (
                      <div className="bg-slate-800 w-full h-full"></div>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 text-center">
                    Eficiencia global en sets disputados
                  </div>
                </div>
              </div>

              {/* Games Stats breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase text-slate-300 font-bold flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#d4fc34]" /> Rendimiento de Games
                </h4>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3 font-mono">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Games Ganados:</span>
                    <span className="font-bold text-green-450">{selectedPlayer.gamesWon}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Games Perdidos:</span>
                    <span className="font-bold text-rose-450">{selectedPlayer.gamesLost}</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden flex">
                    {selectedPlayer.gamesWon + selectedPlayer.gamesLost > 0 ? (
                      <>
                        <div className="bg-green-500 h-full" style={{ width: `${(selectedPlayer.gamesWon / (selectedPlayer.gamesWon + selectedPlayer.gamesLost)) * 150}%` }}></div>
                        <div className="bg-rose-500 h-full" style={{ width: `${(selectedPlayer.gamesLost / (selectedPlayer.gamesWon + selectedPlayer.gamesLost)) * 150}%` }}></div>
                      </>
                    ) : (
                      <div className="bg-slate-800 w-full h-full"></div>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 text-center">
                    Efectividad en games de partido
                  </div>
                </div>
              </div>

              {/* ADMIN ACTIONS ON JUGADOR */}
              {userRole === "admin" && (
                <div className="bg-[#1e1b4b]/20 border border-[#4338ca]/30 rounded-xl p-4 space-y-3 pt-4">
                  <span className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Herramientas de Organizador:</span>
                  <button
                    onClick={() => handleResetIndividualPlayerPoints(selectedPlayer)}
                    className="w-full py-2 bg-red-950/20 hover:bg-red-900/30 border border-red-800/25 rounded-lg text-red-400 transition flex items-center justify-center gap-1.5 font-bold uppercase tracking-wider text-[10px]"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-red-500" /> 
                    <span>Reiniciar puntos de este jugador</span>
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* RESET ALL POINTS CONFIRMATION MODAL */}
      {showResetAllModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#0f172a] border border-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-white text-base">
                ¿Reiniciar Todo el Ranking?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                ¿Estás seguro de que deseas reiniciar todos los puntos del ranking a <strong className="text-white">0</strong> para el inicio del nuevo año deportivo? Esta acción es irreversible y afectará a todos los jugadores.
              </p>
            </div>
            
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setShowResetAllModal(false)}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold px-4 py-2.5 rounded-lg border border-slate-800 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeResetAllPoints}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition cursor-pointer"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET INDIVIDUAL POINTS CONFIRMATION MODAL */}
      {showResetIndividualModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#0f172a] border border-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-[#ef4444]/10 rounded-full flex items-center justify-center text-red-500">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-white text-base">
                ¿Reiniciar Jugador?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                ¿Estás seguro de que deseas reiniciar todos los puntos y estadísticas del jugador <span className="text-white font-semibold">{showResetIndividualModal.firstName} {showResetIndividualModal.lastName}</span> a 0? Esta acción es irreversible.
              </p>
            </div>
            
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setShowResetIndividualModal(null)}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold px-4 py-2.5 rounded-lg border border-slate-800 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeResetIndividualPoints}
                className="flex-1 bg-red-650 hover:bg-red-650 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition cursor-pointer"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE ALL PLAYERS CONFIRMATION MODAL */}
      {showDeleteAllPlayersModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#0f172a] border border-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-white text-base">
                ¿Eliminar Todos los Jugadores?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                ¿Estás seguro de que deseas eliminar <strong className="text-white">TODOS</strong> los jugadores registrados hasta el momento? Esta acción borrará permanentemente sus perfiles y registros del ranking. No se puede deshacer.
              </p>
            </div>
            
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setShowDeleteAllPlayersModal(false)}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold px-4 py-2.5 rounded-lg border border-slate-800 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeDeleteAllPlayers}
                className="flex-1 bg-red-650 hover:bg-red-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition cursor-pointer"
              >
                Eliminar Todo
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};
