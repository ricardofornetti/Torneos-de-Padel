import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Calendar, 
  Activity, 
  TrendingUp, 
  MapPin, 
  Users, 
  Play, 
  CheckCircle,
  Clock,
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';
import { repository } from '../lib/repository';
import { Tournament, Player, Match, Pair, Court } from '../types';

interface DashboardProps {
  userRole: "admin" | "player";
  onNavigateToTournament: (id: string) => void;
  onNavigate: (view: "dashboard" | "tournaments" | "players" | "rankings" | "courts") => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  userRole, 
  onNavigateToTournament,
  onNavigate
}) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const [tList, pList, mList, prList, cList] = await Promise.all([
          repository.getTournaments(),
          repository.getPlayers(),
          repository.getMatches(),
          repository.getPairs(),
          repository.getCourts()
        ]);
        
        setTournaments(tList);
        setPlayers(pList);
        setMatches(mList);
        setPairs(prList);
        setCourts(cList);
      } catch (err) {
        console.error("Dashboard error loading data", err);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  const getPlayerNamesByPairId = (pairId: string) => {
    const pair = pairs.find(p => p.id === pairId);
    if (!pair) return "Pareja no registrada";
    
    const p1 = players.find(p => p.id === pair.player1Id);
    const p2 = players.find(p => p.id === pair.player2Id);
    
    const p1Name = p1 ? `${p1.lastName}` : "???";
    const p2Name = p2 ? `${p2.lastName}` : "???";
    return `${p1Name} / ${p2Name}`;
  };

  const getTournamentName = (id: string) => {
    return tournaments.find(t => t.id === id)?.name || "Torneo General";
  };

  const getCourtName = (id: string) => {
    return courts.find(c => c.id === id)?.name || "Pista s/asignar";
  };

  // Filter Active vs Scheduled vs Completed
  const activeTournaments = tournaments.filter(t => t.status === "in_progress");
  const upcomingTournaments = tournaments.filter(t => t.status === "registration");
  const completedTournaments = tournaments.filter(t => t.status === "completed");

  const pendingMatches = matches.filter(m => m.status === "pending").slice(0, 3);
  const completedMatches = matches.filter(m => m.status === "completed" || m.status === "wo").slice(0, 3);

  // Top 5 ranking players
  const topPlayers = [...players].sort((a, b) => b.rankingPoints - a.rankingPoints).slice(0, 4);

  // Stats calculation - only count matches belonging to existing active/completed/registration tournaments to stay accurate
  const validTournamentIds = new Set(tournaments.map(t => t.id));
  const validMatches = matches.filter(m => m.tournamentId && validTournamentIds.has(m.tournamentId));
  const totalMatchesCount = validMatches.length;
  const completedMatchesCount = validMatches.filter(m => m.status === "completed" || m.status === "wo").length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
        <Activity className="w-8 h-8 animate-spin text-blue-500 mb-2" />
        <span className="font-mono text-xs">Cargando datos del panel...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Title & Banner HERO */}
      <div className="relative rounded-2xl overflow-hidden border border-sky-100 p-6 md:p-8 flex flex-col justify-center min-h-[220px]">
        {/* Background Image with overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/src/assets/images/padel_hero_banner_1780152172518.png" 
            alt="Padel Court Banner" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-slate-950/75 mix-blend-multiply"></div>
        </div>
        
        <div className="max-w-2xl relative z-10 text-white">
          <span className="inline-flex items-center gap-1 bg-cyan-500/20 text-[#d4fc34] px-3 py-1 rounded-full text-[10px] font-extrabold border border-[#d4fc34]/30 uppercase tracking-widest mb-4 font-mono">
            <Trophy className="w-3.5 h-3.5 text-[#d4fc34]" /> EQUIPAMIENTO Y CANCHAS DE NIVEL PRO
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2 font-display italic uppercase">
            PADEL PRO <span className="text-[#d4fc34] not-italic font-sans">|</span> CIRCUITO 2026
          </h1>
          <p className="text-slate-200 text-xs md:text-sm leading-relaxed font-sans">
            Plataforma automática para la distribución de grupos, fixtures Round Robin con control de canchas, carga de resultados, playoffs automáticos de eliminación directa y actualización de ránking anual.
          </p>
        </div>

        {/* Quick Shortcut Buttons for Administration */}
        {userRole === "admin" && (
          <div className="mt-6 flex flex-wrap gap-3 relative z-10">
            <button
              onClick={() => onNavigate("tournaments")}
              className="bg-[#d4fc34] hover:bg-[#c5f015] text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-lime-500/10 transition-all cursor-pointer uppercase tracking-wider"
            >
              <Trophy className="w-3.5 h-3.5 text-slate-950" /> Crear Nuevo Torneo
            </button>
            <button
              onClick={() => onNavigate("players")}
              className="bg-slate-900/80 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 border border-slate-700/50 backdrop-blur-sm transition-all cursor-pointer uppercase tracking-wider"
            >
              <Users className="w-3.5 h-3.5 text-[#d4fc34]" /> Agregar Jugador
            </button>
          </div>
        )}
      </div>

      {/* Grid Quick Dashboard Info Counter */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <button
          onClick={() => onNavigate("tournaments")}
          className="bg-[#0f172a] border border-slate-900 p-4 rounded-xl flex items-center gap-3 hover:border-cyan-500/40 hover:bg-[#131d35] hover:scale-[1.02] active:scale-[0.98] transition-all duration-250 cursor-pointer text-left focus:outline-none w-full group"
        >
          <div className="p-3 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-2xl font-black text-white font-mono">{tournaments.length}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold group-hover:text-cyan-400 transition-colors">Total Torneos</span>
          </div>
        </button>

        <button
          onClick={() => onNavigate("rankings")}
          className="bg-[#0f172a] border border-slate-900 p-4 rounded-xl flex items-center gap-3 hover:border-cyan-500/40 hover:bg-[#131d35] hover:scale-[1.02] active:scale-[0.98] transition-all duration-250 cursor-pointer text-left focus:outline-none w-full group"
        >
          <div className="p-3 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-2xl font-black text-white font-mono">{players.length}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold group-hover:text-cyan-400 transition-colors">Ranking Jugadores</span>
          </div>
        </button>

        <button
          onClick={() => onNavigate("tournaments")}
          className="bg-[#0f172a] border border-slate-900 p-4 rounded-xl flex items-center gap-3 hover:border-cyan-500/40 hover:bg-[#131d35] hover:scale-[1.02] active:scale-[0.98] transition-all duration-250 cursor-pointer text-left focus:outline-none w-full group"
        >
          <div className="p-3 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-2xl font-black text-white font-mono">
              {completedMatchesCount}/{totalMatchesCount}
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold group-hover:text-cyan-400 transition-colors">Partidos Jugados</span>
          </div>
        </button>

        <button
          onClick={() => onNavigate("courts")}
          className="bg-[#0f172a] border border-slate-900 p-4 rounded-xl flex items-center gap-3 hover:border-amber-500/40 hover:bg-[#131d35] hover:scale-[1.02] active:scale-[0.98] transition-all duration-250 cursor-pointer text-left focus:outline-none w-full group"
        >
          <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-2xl font-black text-white font-mono">
              {courts.filter(c => c.active).length}
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold group-hover:text-amber-400 transition-colors">Canchas Habilitadas</span>
          </div>
        </button>

      </div>

      {/* Main Core Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COL 1: ACTIVE TOURNAMENTS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 bg-cyan-500 h-5 rounded-full"></div>
              <h2 className="text-base font-extrabold text-white font-display uppercase tracking-wider">Torneos en Curso</h2>
            </div>
            <button 
              onClick={() => onNavigate("tournaments")} 
              className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-0.5 hover:underline"
            >
              Ver todos <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeTournaments.length === 0 ? (
              <div className="md:col-span-2 bg-[#0f172a] border border-slate-900 rounded-xl p-8 text-center text-slate-500 text-xs">
                No hay torneos activos en juego hoy. Crea uno en la sección de Torneos.
              </div>
            ) : (
              activeTournaments.map(t => {
                const tournamentPairs = pairs.filter(p => p.tournamentId === t.id);
                return (
                  <div 
                    key={t.id}
                    className="bg-[#0f172a] border border-slate-900 hover:border-cyan-500/10 transition-all rounded-xl p-5 flex flex-col justify-between group"
                    id={`active-t-${t.id}`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase">
                          {t.category}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-green-400 font-bold uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span> En curso
                        </span>
                      </div>
                      <h3 className="font-extrabold text-white text-base group-hover:text-cyan-400 transition-colors font-display">
                        {t.name}
                      </h3>
                      <div className="mt-3 space-y-2 text-xs text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-cyan-500/50" />
                          <span>{t.club} - {t.city}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-cyan-500/50" />
                          <span>{tournamentPairs.length} parejas confirmadas / {t.maxPairs} Max</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-800/65 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 font-mono">
                        Fin: {t.endDate}
                      </span>
                      <button
                        onClick={() => onNavigateToTournament(t.id)}
                        className="bg-slate-900 hover:bg-slate-850 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all border border-slate-800 cursor-pointer hover:border-cyan-500/30"
                      >
                        <Play className="w-3 h-3 text-cyan-400" /> Administrar
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* UPCOMING INSCRIPTIONS */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 bg-amber-500 h-5 rounded-full"></div>
              <h2 className="text-base font-extrabold text-white font-display uppercase tracking-wider">Etapa de Inscripción</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingTournaments.length === 0 ? (
                <div className="md:col-span-2 bg-[#0f172a] border border-slate-900 rounded-xl p-6 text-center text-slate-500 text-xs">
                  No hay torneos en registro actualmente.
                </div>
              ) : (
                upcomingTournaments.map(t => {
                  const tournamentPairs = pairs.filter(p => p.tournamentId === t.id);
                  return (
                    <div 
                      key={t.id}
                      className="bg-[#0f172a] border border-slate-900 rounded-xl p-4 flex items-center justify-between hover:border-amber-500/20 transition-all text-xs"
                    >
                      <div>
                        <h3 className="font-extrabold text-slate-100 text-sm">{t.name}</h3>
                        <p className="text-xs text-slate-400 mt-1">{t.club} • <span className="text-amber-400">{t.category}</span></p>
                        <span className="text-[10px] text-slate-500">
                          {tournamentPairs.length} / {t.maxPairs} parejas inscritas
                        </span>
                      </div>
                      <button
                        onClick={() => onNavigateToTournament(t.id)}
                        className="bg-slate-900 hover:bg-slate-800 hover:text-amber-400 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-lg transition-all border border-slate-805 cursor-pointer"
                      >
                        Inscribir
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ADVANCED STATISTICS / CHART */}
          <div className="bg-[#0f172a] border border-slate-900 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-sm text-white font-display uppercase tracking-wider">Estadísticas Complejo Deportivo (Carga de Canchas)</h3>
            </div>
            
            {/* Custom Interactive SVG Padel Court Chart */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-3">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Gráfico de densidad de partidos distribuidos en las pistas del complejo para optimizar horarios y evitar encabalgamientos de canchas.
                </p>
                <div className="space-y-2">
                  {courts.slice(0, 3).map((court, index) => {
                    const courtMatches = matches.filter(m => m.courtId === court.id).length;
                    const pct = totalMatchesCount > 0 ? (courtMatches / totalMatchesCount) * 100 : 0;
                    const colors = ["bg-cyan-500", "bg-indigo-500", "bg-purple-500"];
                    return (
                      <div key={court.id} className="text-xs">
                        <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                          <span>{court.name}</span>
                          <span className="font-semibold font-mono">{courtMatches} partidos ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-900">
                          <div className={`h-full ${colors[index % 3]}`} style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Padel Equipment Profile Card */}
              <div className="bg-slate-950 rounded-xl overflow-hidden border border-slate-900 flex flex-col justify-between">
                <div className="p-4">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono block mb-3">Equipamiento Homologado</span>
                  <div className="flex gap-4 items-center">
                    <img 
                      src="/src/assets/images/padel_gear_badge_1780152189724.png" 
                      alt="Paleta y Pelota de Padel" 
                      className="w-16 h-16 rounded-xl object-cover border border-slate-800 shadow-md shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wide">Pelotas y Palas Oficiales</h4>
                      <p className="text-[10.5px] text-slate-400 leading-snug mt-1">
                        Se juegan con pelotas amarillas de alta presión reglamentarias de 6.5 cm y palas de superficie rugosa de goma EVA/Carbono.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-900/60 p-3 pt-2 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-900/85">
                  <span className="font-semibold text-slate-500">Pista / Corte Oficial</span>
                  <span className="text-[#d4fc34] font-bold">Lomas Club Sede</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* COL 2: LIVE MATCH REEL & TOP PLAYERS RANKING */}
        <div className="space-y-6">
          
          {/* LIVE MATCH REEL (PARTIDOS PRÓXIMOS/ÚLTIMOS) */}
          <div className="bg-[#0f172a] border border-slate-900 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-sm text-white font-display uppercase tracking-wider">Partidos Recientes</h3>
              </div>
            </div>

            <div className="space-y-3">
              {matches.slice(0, 4).map(m => {
                const isFinished = m.status === "completed" || m.status === "wo";
                return (
                  <div 
                    key={m.id}
                    className="p-3 rounded-lg bg-slate-950 border border-slate-900 text-xs hover:border-slate-800 transition"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-2">
                      <span className="font-mono">{m.stageName} • R{m.roundNumber}</span>
                      <span className="font-mono">{getTournamentName(m.tournamentId).split(' 20')[0]}</span>
                    </div>

                    {/* Team Names */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className={`font-semibold ${isFinished && m.winnerPairId === m.pair1Id ? "text-cyan-400" : "text-slate-200"}`}>
                          {getPlayerNamesByPairId(m.pair1Id)}
                        </span>
                        {isFinished && m.winnerPairId === m.pair1Id && (
                          <CheckCircle className="w-3.5 h-3.5 text-cyan-500" />
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`font-semibold ${isFinished && m.winnerPairId === m.pair2Id ? "text-cyan-400" : "text-slate-200"}`}>
                          {getPlayerNamesByPairId(m.pair2Id)}
                        </span>
                        {isFinished && m.winnerPairId === m.pair2Id && (
                          <CheckCircle className="w-3.5 h-3.5 text-cyan-500" />
                        )}
                      </div>
                    </div>

                    {/* Bottom Metadata & score */}
                    <div className="mt-3 pt-2 border-t border-slate-900 flex items-center justify-between text-[11px]">
                      {isFinished ? (
                        <span className="bg-cyan-650/10 text-cyan-400 font-extrabold px-2 py-0.5 rounded font-mono border border-cyan-500/10">
                          {m.scoreSummary || "WO"}
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-405 font-sans font-medium">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{m.date} • {m.time} h</span>
                        </div>
                      )}
                      
                      <span className="text-[10px] text-slate-500">
                        {getCourtName(m.courtId).split(' - ')[0]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TOP PLAYERS PERMANENT RANKING */}
          <div className="bg-[#0f172a] border border-slate-900 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-sm text-white font-display uppercase tracking-wider">Líderes de Ranking</h3>
              </div>
              <button 
                onClick={() => onNavigate("rankings")} 
                className="text-[11px] text-cyan-400 hover:underline hover:text-cyan-300 transition-colors"
              >
                Ver Ranking
              </button>
            </div>

            <div className="space-y-3">
              {topPlayers.map((p, index) => {
                const medals = ["🏆", "🥈", "🥉", "⚡"];
                return (
                  <div 
                    key={p.id}
                    className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-900 hover:border-slate-800 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold font-mono text-slate-500 w-4">
                        {medals[index] || `#${index + 1}`}
                      </span>
                      <img 
                        src={p.photoUrl} 
                        alt={`${p.firstName} ${p.lastName}`} 
                        className="w-8 h-8 rounded-full object-cover border border-slate-800" 
                      />
                      <div>
                        <span className="block font-bold text-xs text-white">
                          {p.firstName} {p.lastName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-sans">
                          {p.category} • {p.city}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs font-black text-rose-400 block">
                        {p.rankingPoints}
                      </span>
                      <span className="text-[9px] text-slate-400 uppercase font-mono tracking-wider">Puntos</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* HISTORICAL COMPLETED SHORTCUT */}
          <div className="bg-[#0f172a] border border-slate-900 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-5 h-5 text-cyan-400" />
              <div>
                <span className="block text-xs font-bold text-white">Ver Historial de Torneos</span>
                <span className="text-[10px] text-slate-400">Torneos cerrados y puntos históricos</span>
              </div>
            </div>
            <button 
              onClick={() => onNavigate("tournaments")}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-900 border border-slate-900"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
