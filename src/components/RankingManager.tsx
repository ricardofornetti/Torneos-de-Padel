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
  Sparkles
} from 'lucide-react';
import { repository } from '../lib/repository';
import { Player } from '../types';

interface RankingManagerProps {
  userRole: "admin" | "player";
}

export const RankingManager: React.FC<RankingManagerProps> = ({ userRole }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

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

  const handleResetPoints = async () => {
    if (confirm("⚠️ ¿Estás seguro de que deseas reiniciar todos los puntos del ranking a 0 para el inicio del nuevo año deportivo? Esta acción es irreversible.")) {
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

  return (
    <div className="space-y-6">
      
      {/* Header card banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" /> Escalafón y Ranking Anual
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Visualización oficial acumuladora del circuito de pádel profesional. Los puntos se adjudican automáticamente en función de los resultados finales de las eliminatorias.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportCSV}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Exportar Ranking (CSV)
          </button>
          
          {userRole === "admin" && (
            <button
              onClick={handleResetPoints}
              disabled={resetting}
              className="bg-red-950/30 hover:bg-red-950/60 border border-red-900/40 text-red-400 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-red-500 ${resetting ? 'animate-spin' : ''}`} /> 
              <span>{resetting ? 'Reiniciando...' : 'Reiniciar Puntos'}</span>
            </button>
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
        
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por nombre, apellido o ciudad en esta categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none"
          />
        </div>

      </div>

      {/* RANKING LIST TABLE */}
      {loading ? (
        <div className="text-center py-10 font-mono text-xs text-slate-500">
          Obteniendo escalafón oficial...
        </div>
      ) : filteredPlayers.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center text-slate-500 text-xs">
          Ningún jugador registrado coincide con la búsqueda.
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono text-[10px] uppercase">
                <tr>
                  <th className="py-3 px-4 text-center">Pos</th>
                  <th className="py-3 px-4">Jugador</th>
                  <th className="py-3 px-4">Categoría Base</th>
                  <th className="py-3 px-4 text-center">PJ</th>
                  <th className="py-3 px-3 text-center text-green-400">Wins</th>
                  <th className="py-3 px-3 text-center text-rose-400">Losses</th>
                  <th className="py-3 px-4 text-center">Efectividad</th>
                  <th className="py-3 px-4 text-right pr-6 text-amber-400">Puntos Anuales</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/80 text-slate-350">
                {filteredPlayers.map((p, index) => {
                  const wr = p.matchesPlayed > 0 ? (p.matchesWon / p.matchesPlayed) * 100 : 0;
                  
                  // Top placements styling
                  let rowStyles = "";
                  let rankIndicator = <span className="font-mono">{index + 1}</span>;

                  if (index === 0) {
                    rowStyles = "bg-amber-500/5 hover:bg-amber-500/10";
                    rankIndicator = <span className="text-xl">🏆</span>;
                  } else if (index === 1) {
                    rowStyles = "bg-slate-300/5 hover:bg-slate-300/10";
                    rankIndicator = <span className="text-xl">🥈</span>;
                  } else if (index === 2) {
                    rowStyles = "bg-orange-850/5 hover:bg-orange-850/10";
                    rankIndicator = <span className="text-xl">🥉</span>;
                  }

                  return (
                    <tr 
                      key={p.id} 
                      className={`${rowStyles} transition`}
                      id={`rank-row-${p.id}`}
                    >
                      {/* Placement index */}
                      <td className="py-3.5 px-4 text-center font-bold font-mono">
                        {rankIndicator}
                      </td>

                      {/* Photo and identity */}
                      <td className="py-3.5 px-4 font-bold text-slate-100">
                        <div className="flex items-center gap-3">
                          <img 
                            src={p.photoUrl} 
                            alt={`${p.firstName} ${p.lastName}`} 
                            className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0" 
                          />
                          <div>
                            <span className="block font-bold text-slate-100">{p.lastName}, {p.firstName}</span>
                            <span className="text-[10px] text-slate-400 block font-normal">{p.city}</span>
                          </div>
                        </div>
                      </td>

                      {/* Base category */}
                      <td className="py-3.5 px-4 text-slate-400">
                        <span className="bg-slate-950 text-slate-300 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase border border-slate-850">
                          {p.category}
                        </span>
                      </td>

                      {/* Matches Played */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-300">
                        {p.matchesPlayed}
                      </td>

                      {/* Wins */}
                      <td className="py-3.5 px-3 text-center font-mono text-green-400 font-bold bg-green-500/5">
                        {p.matchesWon}
                      </td>

                      {/* Losses */}
                      <td className="py-3.5 px-3 text-center font-mono text-rose-450 bg-rose-500/5">
                        {p.matchesLost}
                      </td>

                      {/* Workload / Win Rate column */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-mono font-bold text-slate-200">{wr.toFixed(0)}%</span>
                          <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-blue-500 h-full" style={{ width: `${wr}%` }}></div>
                          </div>
                        </div>
                      </td>

                      {/* Points accum */}
                      <td className="py-3.5 px-4 text-right pr-6">
                        <span className="font-mono text-base font-black text-amber-400">
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
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-3">
        <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-400" /> Sistema de Adjudicación de Puntos
        </h4>
        <p className="text-xs text-slate-400 leading-relaxed">
          Los puntos de ranking se calculan automáticamente al cerrar un torneo en estado **Finalizado**. El sistema evalúa el playoff de eliminaciones y asigna el puntaje correspondiente de acuerdo a los reglamentos deportivos internacionales:
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">🏆 Campeón:</span>
            <span className="font-bold text-amber-400">100 Pts</span>
          </div>
          <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">🥈 Subcampeón:</span>
            <span className="font-bold text-slate-350">75 Pts</span>
          </div>
          <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">⚡ Semifinalista:</span>
            <span className="font-bold text-blue-400">50 Pts</span>
          </div>
          <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">🛡️ Cuartos:</span>
            <span className="font-bold text-indigo-400">25 Pts</span>
          </div>
        </div>
      </div>

    </div>
  );
};
