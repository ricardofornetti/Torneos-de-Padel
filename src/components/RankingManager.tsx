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

export const RankingManager: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
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
      for (const p of updated) {
        await repository.savePlayer(p);
      }
      await repository.addNotification("Reinicio de Ranking", "El administrador ha reiniciado todos los puntajes anuales de la temporada.", "warning");
      loadRankings();
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
          
          <button
            onClick={handleResetPoints}
            className="bg-red-950/30 hover:bg-red-950/60 border border-red-900/30 text-red-400 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-red-500 animate-spin" /> Reiniciar Puntos
          </button>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row gap-4">
        
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por nombre, apellido, club o ciudad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none"
          />
        </div>

        {/* Filter Selection */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-2 outline-none"
          >
            <option value="all">Todas las Categorías</option>
            <option value="Libre Masculina">Libre Masculina</option>
            <option value="4ta Masculina">4ta Masculina</option>
            <option value="5ta Masculina">5ta Masculina</option>
            <option value="6ta Masculina">6ta Masculina</option>
            <option value="7ma Masculina">7ma Masculina</option>
            <option value="6ta Femenina">6ta Femenina</option>
            <option value="7ma Femenina">7ma Femenina</option>
          </select>
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
            <span className="text-slate-400">🥈 Finalista:</span>
            <span className="font-bold text-slate-300">70 Pts</span>
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
