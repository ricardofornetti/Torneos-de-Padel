import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Users, 
  Calendar, 
  MapPin, 
  Activity, 
  Flame, 
  TrendingUp, 
  CheckCircle,
  Clock,
  Sparkles,
  BarChart2
} from 'lucide-react';
import { repository } from '../lib/repository';
import { Tournament, Player, Match, Pair, Court } from '../types';

export const StatsView: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [t, p, m, c] = await Promise.all([
          repository.getTournaments(),
          repository.getPlayers(),
          repository.getMatches(),
          repository.getCourts()
        ]);
        setTournaments(t);
        setPlayers(p);
        setMatches(m);
        setCourts(c);
      } catch (err) {
        console.error("Error loading statistics data:", err);
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
        Analizando rendimiento y cargando estadísticas...
      </div>
    );
  }

  // --- STATS COMPUTATIONS ---
  const totalTournaments = tournaments.length;
  const totalPlayers = players.length;
  const totalMatches = matches.length;
  const finishedMatches = matches.filter(m => m.status === 'completed');
  const finishedMatchesCount = finishedMatches.length;

  // Most active category base
  const categoryCounts: Record<string, number> = {};
  players.forEach(p => {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  });
  let topCategory = "Sin datos";
  let topCategoryCount = 0;
  Object.entries(categoryCounts).forEach(([cat, val]) => {
    if (val > topCategoryCount) {
      topCategory = cat;
      topCategoryCount = val;
    }
  });

  // Calculate top players streak or top win ratios
  const activePlayersWithGames = players
    .filter(p => p.matchesPlayed > 0)
    .map(p => {
      const winRatio = p.matchesPlayed > 0 ? (p.matchesWon / p.matchesPlayed) * 100 : 0;
      return {
        ...p,
        winRatio
      };
    })
    .sort((a, b) => b.winRatio - a.winRatio || b.matchesWon - a.matchesWon);

  const topSteakPlayers = [...players]
    .filter(p => p.matchesWon > 0)
    .sort((a, b) => b.matchesWon - a.matchesWon)
    .slice(0, 5);

  // Court occupancy / utilization statistics
  const courtMatchCounts: Record<string, number> = {};
  matches.forEach(m => {
    if (m.courtId) {
      courtMatchCounts[m.courtId] = (courtMatchCounts[m.courtId] || 0) + 1;
    }
  });

  const courtStats = courts.map(c => {
    const assignedMatchesSum = courtMatchCounts[c.id] || 0;
    return {
      ...c,
      matchCount: assignedMatchesSum
    };
  }).sort((a, b) => b.matchCount - a.matchCount);

  // Category summary distribution for SVG Chart
  const categoriesList = [
    "Libre Masculina",
    "4ta Masculina",
    "5ta Masculina",
    "6ta Masculina",
    "7ma Masculina",
    "6ta Femenina",
    "7ma Femenina"
  ];
  
  const categoryDistribution = categoriesList.map(cat => {
    const count = players.filter(p => p.category === cat).length;
    return { name: cat, count };
  });

  const maxCount = Math.max(...categoryDistribution.map(c => c.count), 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Banner de Pantalla de Analíticas */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800/80 p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 min-h-[160px] shadow-2xl">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/src/assets/images/stats_banner_1781911640088.webp" 
            alt="Jugador de pádel rematando en el aire durante un partido" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          {/* dark overlay to keep it readable, lighter on the right where there's no text */}
          <div className="absolute inset-0 bg-slate-950/55 bg-gradient-to-r from-slate-950 via-slate-950/75 to-slate-950/35"></div>
        </div>

        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-[#d4fc34]/15 text-[#d4fc34] border border-[#d4fc34]/20 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest font-mono">
              Analytics & insights
            </span>
            <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest font-mono">
              LIVE UPDATE
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-wider text-white flex items-center gap-2.5">
            <BarChart2 className="w-6 h-6 text-[#d4fc34]" />
            <span>Analíticas del Club</span>
          </h1>
          <p className="text-xs text-slate-350 font-normal max-w-xl">
            Métricas de desempeño, tendencias de canchas y registros de participación en tiempo real de la liga.
          </p>
        </div>
      </div>

      {/* METRICS LEVEL 1 ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric Card 1 */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#d4fc34]/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-110"></div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Efectividad Torneos</span>
            <span className="block text-2xl font-black text-white">
              {totalMatches > 0 ? Math.round((finishedMatchesCount / totalMatches) * 100) : 0}%
            </span>
            <span className="text-[9px] text-slate-400 block">{finishedMatchesCount} de {totalMatches} partidos disputados</span>
          </div>
          <div className="bg-[#d4fc34]/10 text-[#d4fc34] p-3 rounded-xl border border-[#d4fc34]/20">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Metric Card 2 */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-110"></div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Jugadores Oficiales</span>
            <span className="block text-2xl font-black text-white">{totalPlayers}</span>
            <span className="text-[9px] text-slate-400 block">Fichas federadas con rankings acumulados</span>
          </div>
          <div className="bg-cyan-500/10 text-cyan-400 p-3 rounded-xl border border-cyan-500/20">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Metric Card 3 */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-110"></div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Categoría Más Poblada</span>
            <span className="block text-base font-black text-white truncate max-w-[150px]">{topCategory}</span>
            <span className="text-[9px] text-slate-400 block">Con {topCategoryCount} competidores activos</span>
          </div>
          <div className="bg-amber-500/10 text-amber-400 p-3 rounded-xl border border-amber-500/20">
            <Trophy className="w-5 h-5" />
          </div>
        </div>

        {/* Metric Card 4 */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-110"></div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Competencias Totales</span>
            <span className="block text-2xl font-black text-white">{totalTournaments}</span>
            <span className="text-[9px] text-slate-400 block">Circuitos de torneos activos o por iniciar</span>
          </div>
          <div className="bg-rose-500/10 text-rose-300 p-3 rounded-xl border border-rose-500/20">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* BENTO STATS SECTION GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: REGISTRATIONS BY CATEGORY & COURT UTILIZATION (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Bento Panel: Registrations chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-[#d4fc34]" /> Distribución de Jugadores por Categoría
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">Total: {totalPlayers}</span>
              </div>
              <p className="text-[11px] text-slate-400">Total de inscriptos distribuidos según su categoría y género oficial.</p>
            </div>

            {/* Custom Responsive Responsive Bar Graph */}
            <div className="space-y-3 pt-2">
              {categoryDistribution.map((item, id) => {
                const percentage = Math.max(8, Math.round((item.count / maxCount) * 100));
                const isMale = item.name.includes("Masculino") || item.name.includes("Masculina");
                const colorClass = isMale ? "bg-cyan-500 shadow-cyan-500/20" : "bg-rose-500 shadow-rose-500/20";
                
                return (
                  <div key={id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-200">{item.name}</span>
                      <span className="text-slate-400 text-[11px] font-mono font-bold">
                        {item.count} Jugadores ({Math.round((item.count / (totalPlayers || 1)) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-850 relative">
                      <div 
                        className={`absolute left-0 top-0 h-full rounded-full ${colorClass} shadow-lg transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bento Panel: Court utilization and load */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-cyan-400" /> Rendimiento & Demanda de Canchas (Sedes)
              </h3>
              <p className="text-[11px] text-slate-400">Distribución porcentual de todos los partidos programados por cancha asignada.</p>
            </div>

            {courtStats.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs font-mono bg-slate-950 rounded-xl">
                No hay canchas programadas en el sistema.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courtStats.map((court, idx) => {
                  const maxMatches = Math.max(...courtStats.map(c => c.matchCount), 1);
                  const utilPercent = Math.round((court.matchCount / maxMatches) * 100);
                  
                  return (
                    <div key={court.id} className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex items-center justify-between relative group overflow-hidden">
                      {/* Top Rank Badge */}
                      <span className="absolute top-2 right-2 bg-slate-900 text-slate-500 font-mono text-[9px] w-5 h-5 rounded-full flex items-center justify-center border border-slate-800">
                        #{idx + 1}
                      </span>
                      
                      <div className="space-y-1.5 flex-1 pr-6">
                        <span className="text-slate-200 font-black text-xs block truncate uppercase">
                          {court.name}
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          <span className="bg-cyan-500/10 text-cyan-400 font-mono text-[9px] px-1.5 py-0.5 rounded border border-cyan-500/20 font-bold block uppercase">
                            {(court as any).type === "glass" ? "Vidrio Pro" : "Muro oficial"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono font-bold block">
                            {court.matchCount} Partidos
                          </span>
                        </div>

                        {/* Bar percentage */}
                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-cyan-400 to-[#d4fc34] h-full rounded-full transition-all duration-500" 
                            style={{ width: `${utilPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: PERFORMANCE LEADERS & WIN STREAK MASTERS (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Bento Panel: Streak Masters (🔥 Top players) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-500 animate-pulse" /> Líderes de Victorias (Streak)
              </h3>
              <p className="text-[11px] text-slate-400">Competidores con mayor volumen de victorias acumuladas.</p>
            </div>

            <div className="space-y-2.5">
              {topSteakPlayers.map((player, idx) => (
                <div key={player.id} className="flex items-center justify-between p-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-850/60 rounded-xl transition-all">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img 
                        src={player.photoUrl} 
                        alt={`Foto de perfil de ${player.firstName} ${player.lastName}`}
                        className="w-8 h-8 rounded-full border border-slate-700 object-cover" 
                      />
                      <span className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 font-black text-[8px] w-4 h-4 rounded-full flex items-center justify-center border border-slate-950">
                        {idx + 1}
                      </span>
                    </div>

                    <div>
                      <span className="block text-xs font-bold text-white leading-tight">
                        {player.lastName}, {player.firstName}
                      </span>
                      <span className="block text-[9px] text-[#22d3ee] font-mono leading-none mt-0.5">
                        {player.category}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="flex items-center gap-1 text-[11px] font-black text-[#d4fc34] font-mono leading-none justify-end">
                      {player.matchesWon} <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-500" />
                    </span>
                    <span className="text-[8px] text-slate-500 font-mono leading-none">victorias</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bento Panel: Efficiency rating (Win Ratio list) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#d4fc34]" /> Eficacia Máxima (Win-Rate %)
              </h3>
              <p className="text-[11px] text-slate-400">Jugadores ordenados por mayor tasa de efectividad en partidos jugados.</p>
            </div>

            {activePlayersWithGames.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs font-mono bg-slate-950 rounded-xl">
                No hay partidos jugados cargados todavía.
              </div>
            ) : (
              <div className="space-y-2">
                {activePlayersWithGames.slice(0, 5).map((player) => (
                  <div key={player.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-100 font-medium font-sans">{player.firstName} {player.lastName}</span>
                      <span className="text-[#d4fc34] font-mono font-black">{Math.round(player.winRatio)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-855">
                        <div className="bg-gradient-to-r from-[#d4fc34] to-lime-500 h-full rounded-full" style={{ width: `${player.winRatio}%` }}></div>
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono shrink-0">({player.matchesWon}/{player.matchesPlayed})</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* QUICK FOOTER TRIVIA / LEGEND */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20 shrink-0">
          <Sparkles className="w-4 h-4 animate-spin-slow" />
        </div>
        <div className="space-y-0.5">
          <span className="block text-xs font-black text-[#d4fc34] uppercase tracking-wider">¿Sabías qué?</span>
          <p className="text-[11px] text-slate-400">
            Los jugadores ganan 100 puntos por partido ganado en la fase de grupo y hasta 300 puntos adicionales por campeonar en la fase final (playoffs). Los cambios se recalculan de inmediato en el Ranking Oficial.
          </p>
        </div>
      </div>

    </div>
  );
};
