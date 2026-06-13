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
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/80 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 min-h-[220px] shadow-2xl">
        {/* Subtle decorative mesh overlay and line art */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:24px_24px] opacity-20 pointer-events-none"></div>
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-lime-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-16 -right-16 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Hero Info Columns */}
        <div className="max-w-3xl relative z-10 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          {/* Elite Isotipo - Double Rackets & Stars (Gold & Lime Fusion) */}
          <div className="relative w-24 h-24 shrink-0 bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl border-2 border-slate-700/80 p-3 shadow-2xl flex items-center justify-center group select-none overflow-hidden">
            <div className="absolute inset-0 bg-[#d4fc34]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            {/* Elegant SVG Logo representing international tour */}
            <svg className="w-16 h-16 z-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Outer Golden Laurel Circle */}
              <circle cx="50" cy="50" r="42" stroke="#d4fc34" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
              {/* Crossed Rackets */}
              <g transform="translate(14, 14)">
                {/* Racket Left */}
                <g transform="rotate(-28 36 36)">
                  <path d="M22 45 L10 62 C8 65 3 64 1 60 C-1 56 1 50 4 47 L16 31" stroke="#d4fc34" strokeWidth="3" strokeLinecap="round" opacity="0.8"/>
                  <rect x="22" y="16" width="22" height="22" rx="11" fill="#0f172a" stroke="#d4fc34" strokeWidth="3" />
                </g>
                {/* Racket Right */}
                <g transform="rotate(28 36 36)">
                  <path d="M50 45 L62 62 C64 65 69 64 71 60 C73 56 71 50 68 47 L56 31" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" opacity="0.8"/>
                  <rect x="30" y="16" width="22" height="22" rx="11" fill="#0f172a" stroke="#e2e8f0" strokeWidth="3" />
                </g>
              </g>
              {/* Glowing tennis/padel ball in the center */}
              <circle cx="50" cy="46" r="8" fill="#d4fc34" className="animate-pulse" />
              <path d="M46 43 C48 45 48 47 46 49" stroke="#000000" strokeWidth="1.2" strokeLinecap="round" fill="none" />
              <path d="M54 43 C52 45 52 47 54 49" stroke="#000000" strokeWidth="1.2" strokeLinecap="round" fill="none" />
              {/* Stars badge */}
              <polygon points="50,14 52,18 56,18 53,21 54,25 50,23 46,25 47,21 44,18 48,18" fill="#facc15" />
            </svg>
            <span className="absolute bottom-1 bg-slate-900 border border-slate-800 text-[8px] font-black tracking-widest text-[#d4fc34] px-1.5 py-0.5 rounded uppercase leading-none font-sans">MASTER</span>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="bg-lime-500/10 text-[#d4fc34] border border-lime-500/20 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest font-mono">
                Official World Tour System
              </span>
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest font-mono">
                Srtc Pro 2026
              </span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-black tracking-wider text-white font-sans uppercase">
              COMPLEJO CENTER <span className="text-[#d4fc34] font-light font-sans">/</span> CIRCUITO PROFESIONAL
            </h1>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-2.5xl font-sans">
              Plataforma automática para la distribución de grupos, fixtures Round Robin con control de canchas en tiempo real, carga de resultados, playoffs de eliminación directa y actualización instantánea del ranking anual oficial.
            </p>
          </div>
        </div>

        {/* Quick Shortcut Buttons for Administration */}
        {userRole === "admin" && (
          <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-3 relative z-10 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => onNavigate("tournaments")}
              className="bg-[#d4fc34] hover:bg-[#c5f015] hover:scale-[1.03] text-slate-950 text-xs font-black px-5 py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-lime-500/15 transition-all cursor-pointer uppercase tracking-wider w-full sm:w-auto"
            >
              <Trophy className="w-3.5 h-3.5 text-slate-950" /> Crear Torneo
            </button>
            <button
              onClick={() => onNavigate("players")}
              className="bg-slate-900 hover:bg-slate-800 hover:scale-[1.03] text-white text-xs font-bold px-5 py-3 rounded-xl flex items-center justify-center gap-1.5 border border-slate-700/80 backdrop-blur-sm transition-all cursor-pointer uppercase tracking-wider w-full sm:w-auto"
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
              {(() => {
                const recentMatches = [...matches]
                  .filter(m => m.pair1Id && m.pair2Id) // Ensure there's actually a match with registered team pairs
                  .sort((a, b) => {
                    // Sort completed or explicitly scheduled matches first, then by ID desc
                    const weightA = (a.status === "completed" || a.status === "wo") ? 2 : (a.date ? 1 : 0);
                    const weightB = (b.status === "completed" || b.status === "wo") ? 2 : (b.date ? 1 : 0);
                    if (weightB !== weightA) return weightB - weightA;
                    return b.id.localeCompare(a.id);
                  })
                  .slice(0, 4);

                if (recentMatches.length === 0) {
                  return (
                    <div className="p-6 text-center text-slate-500 text-xs font-mono border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
                      ⚡ No hay partidos recientes programados de momento. Comienza a definir el cronograma en los torneos para visualizarlos aquí.
                    </div>
                  );
                }

                return recentMatches.map(m => {
                  const isFinished = m.status === "completed" || m.status === "wo";
                  return (
                    <div 
                      key={m.id}
                      className="p-3 rounded-lg bg-slate-950 border border-slate-900 text-xs hover:border-slate-800 transition"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mb-2">
                        <span className="font-mono bg-slate-900 px-1.5 py-0.5 rounded text-slate-400 font-bold uppercase">{m.stageName} • R{m.roundNumber}</span>
                        <span className="font-mono text-slate-450">{getTournamentName(m.tournamentId).split(' 20')[0]}</span>
                      </div>

                      {/* Team Names */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className={`font-semibold ${isFinished && m.winnerPairId === m.pair1Id ? "text-[#d4fc34]" : "text-slate-200"}`}>
                            {getPlayerNamesByPairId(m.pair1Id)}
                          </span>
                          {isFinished && m.winnerPairId === m.pair1Id && (
                            <CheckCircle className="w-3.5 h-3.5 text-cyan-500" />
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={`font-semibold ${isFinished && m.winnerPairId === m.pair2Id ? "text-[#d4fc34]" : "text-slate-200"}`}>
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
                          <span className="bg-[#d4fc34]/10 text-[#d4fc34] font-extrabold px-2 py-0.5 rounded font-mono border border-[#d4fc34]/15">
                            {m.scoreSummary || "W.O."}
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-400 font-sans font-medium">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            <span>{m.date || "Pendiente"} • {m.time ? `${m.time} h` : "s/h"}</span>
                          </div>
                        )}
                        
                        <span className="text-[10px] text-slate-500 font-mono">
                          {getCourtName(m.courtId).split(' - ')[0]}
                        </span>
                      </div>
                    </div>
                  );
                });
              })()}
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
