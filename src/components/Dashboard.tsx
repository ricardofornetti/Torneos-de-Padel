import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Calendar, 
  Activity, 
  MapPin, 
  Users, 
  Play, 
  CheckCircle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  Award,
  Zap,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { repository } from '../lib/repository';
import { Tournament, Player, Match, Pair, Court } from '../types';
import { LiveBadge } from './ui/LiveBadge';

interface DashboardProps {
  userRole: "admin" | "player";
  onNavigateToTournament: (id: string) => void;
  onNavigate: (view: "dashboard" | "tournaments" | "players" | "rankings" | "courts" | "gallery" | "stats" | "fixture") => void;
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

  // Top 4 ranking players
  const topPlayers = [...players].sort((a, b) => b.rankingPoints - a.rankingPoints).slice(0, 4);

  // Stats calculation
  const validTournamentIds = new Set(tournaments.map(t => t.id));
  const validMatches = matches.filter(m => m.tournamentId && validTournamentIds.has(m.tournamentId));
  const totalMatchesCount = validMatches.length;
  const completedMatchesCount = validMatches.filter(m => m.status === "completed" || m.status === "wo").length;

  // Stagger Container Animation
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[55vh] text-slate-400 gap-4">
        {/* Skeleton Live score pulse */}
        <div className="relative flex items-center justify-center h-16 w-16">
          <span className="absolute inline-flex h-full w-full rounded-full bg-[#d4fc34]/15 animate-live-ping"></span>
          <div className="bg-[#d4fc34] rounded-full p-4 text-slate-950 shadow-lg shadow-[#d4fc34]/20 animate-pulse">
            <Trophy className="w-6 h-6 text-slate-950" />
          </div>
        </div>
        <div className="text-center">
          <span className="font-display font-black text-sm text-slate-200 tracking-widest uppercase block animate-pulse">Cargando Datos de Liga</span>
          <span className="font-mono text-[9px] text-[#d4fc34]/80 tracking-widest uppercase block mt-1">Conectando con Servidor Central</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="space-y-8"
    >
      {/* Title & Banner HERO */}
      <motion.div 
        variants={itemVariants}
        className="relative rounded-3xl overflow-hidden border border-slate-800/80 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 min-h-[220px] shadow-2xl"
      >
        {/* Background Image of the court at night */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/src/assets/images/dashboard_hero_1781910955942.jpg" 
            alt="Pista de Pádel SRTC" 
            className="w-full h-full object-cover blur-[1px]"
            referrerPolicy="no-referrer"
          />
          {/* Post-procesamiento overlay oscuro */}
          <div className="absolute inset-0 bg-slate-950/80 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/70"></div>
        </div>
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-[#d4fc34]/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-16 -right-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none text-right"></div>

        {/* Hero Info Columns */}
        <div className="max-w-3xl relative z-10 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          {/* Elite Isotipo */}
          <div className="relative w-24 h-24 shrink-0 bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl border border-slate-800 p-3 shadow-2xl flex items-center justify-center group select-none overflow-hidden">
            <div className="absolute inset-x-0 bottom-0 h-1 bg-[#d4fc34]"></div>
            
            <svg className="w-16 h-16 z-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="42" stroke="#d4fc34" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
              <g transform="translate(14, 14)">
                <g transform="rotate(-28 36 36)">
                  <path d="M22 45 L10 62 C8 65 3 64 1 60 C-1 56 1 50 4 47 L16 31" stroke="#d4fc34" strokeWidth="2.5" strokeLinecap="round" opacity="0.8"/>
                  <rect x="22" y="16" width="22" height="22" rx="11" fill="#0f172a" stroke="#d4fc34" strokeWidth="2.5" />
                </g>
                <g transform="rotate(28 36 36)">
                  <path d="M50 45 L62 62 C64 65 69 64 71 60 C73 56 71 50 68 47 L56 31" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" opacity="0.8"/>
                  <rect x="30" y="16" width="22" height="22" rx="11" fill="#0f172a" stroke="#e2e8f0" strokeWidth="2.5" />
                </g>
              </g>
              <circle cx="50" cy="46" r="7" fill="#d4fc34" />
              <path d="M46 43 C48 45 48 47 46 49" stroke="#000000" strokeWidth="1" strokeLinecap="round" fill="none" />
              <path d="M54 43 C52 45 52 47 54 49" stroke="#000000" strokeWidth="1" strokeLinecap="round" fill="none" />
              <polygon points="50,14 52,18 56,18 53,21 54,25 50,23 46,25 47,21 44,18 48,18" fill="#facc15" />
            </svg>
            <span className="absolute bottom-1 bg-slate-950 border border-slate-900 text-[8px] font-black tracking-widest text-[#d4fc34] px-1.5 py-0.5 rounded uppercase leading-none font-sans">PRO</span>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="bg-[#d4fc34]/10 text-[#d4fc34] border border-[#d4fc34]/20 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest font-mono">
                Official Padel League
              </span>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest font-mono flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span> SISTEMA ACTIVO
              </span>
            </div>
            
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white font-display uppercase leading-tight">
              CIRCUITO DE PADEL <span className="text-[#d4fc34]">PRO</span>
            </h1>
            <p className="text-slate-350 text-xs md:text-sm leading-relaxed max-w-2xl font-sans font-normal">
              Plataforma deportiva omnicanal. Distribución de zonas en modo round robin, brackets interactivos de eliminación directa, cronogramas de canchas en vivo y actualización de rankings anuales en tiempo real.
            </p>
          </div>
        </div>

        {/* Quick Shortcut Buttons for Administration */}
        {userRole === "admin" && (
          <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-2 relative z-10 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => onNavigate("tournaments")}
              className="btn-padel-primary text-xs font-black px-5 py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer uppercase tracking-wider w-full sm:w-auto"
            >
              <Trophy className="w-3.5 h-3.5 text-slate-950" /> Crear Torneo
            </button>
            <button
              onClick={() => onNavigate("players")}
              className="bg-slate-900/80 hover:bg-slate-800 text-white text-xs font-bold px-5 py-3 rounded-xl flex items-center justify-center gap-1.5 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer uppercase tracking-wider w-full sm:w-auto"
            >
              <Users className="w-3.5 h-3.5 text-[#d4fc34]" /> Fichar Jugador
            </button>
          </div>
        )}
      </motion.div>

      {/* Grid Quick Dashboard Info Counter */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <button
          onClick={() => onNavigate("tournaments")}
          className="sports-card p-4 flex items-center gap-3.5 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer text-left focus:outline-none w-full group"
        >
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[#d4fc34] group-hover:bg-[#d4fc34]/10 transition-colors">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-2xl font-black text-white font-mono leading-none">{tournaments.length}</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold group-hover:text-[#d4fc34] transition-colors mt-1.5 block">Torneos</span>
          </div>
        </button>

        <button
          onClick={() => onNavigate("rankings")}
          className="sports-card p-4 flex items-center gap-3.5 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer text-left focus:outline-none w-full group"
        >
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[#d4fc34] group-hover:bg-[#d4fc34]/10 transition-colors">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-2xl font-black text-white font-mono leading-none">{players.length}</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold group-hover:text-[#d4fc34] transition-colors mt-1.5 block">Jugadores</span>
          </div>
        </button>

        <button
          onClick={() => onNavigate("fixture")}
          className="sports-card p-4 flex items-center gap-3.5 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer text-left focus:outline-none w-full group"
        >
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-teal-400 group-hover:bg-teal-400/10 transition-colors">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-2xl font-black text-white font-mono leading-none">
              {completedMatchesCount}/{totalMatchesCount}
            </span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold group-hover:text-teal-400 transition-colors mt-1.5 block">Jugados</span>
          </div>
        </button>

        <button
          onClick={() => onNavigate("courts")}
          className="sports-card p-4 flex items-center gap-3.5 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer text-left focus:outline-none w-full group"
        >
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 group-hover:bg-amber-400/10 transition-colors">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-2xl font-black text-white font-mono leading-none">
              {courts.filter(c => c.active).length}
            </span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold group-hover:text-amber-400 transition-colors mt-1.5 block">Pistas</span>
          </div>
        </button>

      </motion.div>

      {/* Main Core Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COL 1: ACTIVE TOURNAMENTS */}
        <div className="lg:col-span-2 space-y-8">
          
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 bg-[#d4fc34] h-5 rounded-full"></div>
                <h2 className="text-sm font-black text-white font-display uppercase tracking-widest">Torneos en Curso</h2>
              </div>
              <button 
                onClick={() => onNavigate("tournaments")} 
                className="text-xs text-[#d4fc34] hover:text-[#bde61f] font-bold flex items-center gap-0.5 bg-[#d4fc34]/5 border border-[#d4fc34]/20 px-3 py-1.5 rounded-xl hover:bg-[#d4fc34]/10 transition-colors cursor-pointer"
              >
                <span>Ver todos</span> <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeTournaments.length === 0 ? (
                <div className="md:col-span-2 sports-card p-8 text-center text-slate-500 text-xs font-mono border-dashed bg-slate-900/10">
                  <Trophy className="w-8 h-8 mx-auto text-slate-700 mb-2" />
                  No hay torneos activos en juego hoy. Crea uno en la sección de Torneos.
                </div>
              ) : (
                activeTournaments.map(t => {
                  const tournamentPairs = pairs.filter(p => p.tournamentId === t.id);
                  return (
                    <div 
                      key={t.id}
                      className="sports-card p-5 flex flex-col justify-between group h-full hover:sports-card-glow hover:scale-[1.01] transition-transform"
                      id={`active-t-${t.id}`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="bg-[#d4fc34]/10 text-[#d4fc34] border border-[#d4fc34]/15 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase">
                            {t.category}
                          </span>
                          <LiveBadge status="live" text="EN JUEGO" />
                        </div>
                        <h3 className="font-extrabold text-white text-base group-hover:text-[#d4fc34] transition-colors font-display line-clamp-1">
                          {t.name}
                        </h3>
                        <div className="mt-4 space-y-2.5 text-xs text-slate-400">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-[#d4fc34]/50 shrink-0" />
                            <span className="truncate">{t.club} - {t.city}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-[#d4fc34]/50 shrink-0" />
                            <span>{tournamentPairs.length} parejas confirmadas / {t.maxPairs} Max</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-900 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 font-mono">
                          Fin: {t.endDate}
                        </span>
                        <button
                          onClick={() => onNavigateToTournament(t.id)}
                          className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all border border-slate-800 cursor-pointer hover:border-[#d4fc34]/30"
                        >
                          <Play className="w-3 h-3 text-[#d4fc34]" /> <span>Administrar</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>

          {/* UPCOMING INSCRIPTIONS */}
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 bg-amber-400 h-5 rounded-full"></div>
              <h2 className="text-sm font-black text-white font-display uppercase tracking-widest">Etapa de Inscripción ABIERTA</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingTournaments.length === 0 ? (
                <div className="md:col-span-2 sports-card p-6 text-center text-slate-500 text-xs font-mono border-dashed bg-slate-900/10">
                  No hay torneos en registro actualmente.
                </div>
              ) : (
                upcomingTournaments.map(t => {
                  const tournamentPairs = pairs.filter(p => p.tournamentId === t.id);
                  return (
                    <div 
                      key={t.id}
                      className="sports-card p-4.5 flex items-center justify-between hover:sports-card-glow hover:scale-[1.01] transition text-xs"
                    >
                      <div className="space-y-1">
                        <h3 className="font-extrabold text-slate-100 text-sm line-clamp-1">{t.name}</h3>
                        <p className="text-xs text-slate-400">{t.club} • <span className="text-amber-400 font-bold">{t.category}</span></p>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {tournamentPairs.length} / {t.maxPairs} parejas inscritas (Inscripción Oficial)
                        </span>
                      </div>
                      <button
                        onClick={() => onNavigateToTournament(t.id)}
                        className="bg-[#d4fc34]/10 hover:bg-[#d4fc34] hover:text-slate-950 text-[#d4fc34] text-xs font-bold px-3.5 py-2 rounded-xl transition border border-[#d4fc34]/20 cursor-pointer"
                      >
                        Inscribir
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>

          {/* ADVANCED STATISTICS / CHART */}
          <motion.div variants={itemVariants} className="sports-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[#d4fc34]" />
              <h3 className="font-bold text-sm text-white font-display uppercase tracking-wider">Carga y Rendimiento de Pistas (Estadísticas de Uso)</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Densidad horaria analizada por pista del complejo para optimizar la rotación y evitar encabalgamientos de canchas en rondas críticas.
                </p>
                <div className="space-y-3">
                  {courts.slice(0, 3).map((court, index) => {
                    const courtMatches = matches.filter(m => m.courtId === court.id).length;
                    const pct = totalMatchesCount > 0 ? (courtMatches / totalMatchesCount) * 100 : 0;
                    const colors = ["bg-[#d4fc34]", "bg-indigo-400", "bg-emerald-400"];
                    return (
                      <div key={court.id} className="text-xs">
                        <div className="flex justify-between text-[11px] text-slate-300 mb-1 font-sans">
                          <span className="font-bold">{court.name}</span>
                          <span className="font-semibold font-mono text-slate-400">{courtMatches} partidos ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-900/60">
                          <div className={`h-full ${colors[index % 3]}`} style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Padel Equipment Profile Card */}
              <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800/60 flex flex-col justify-between p-4 space-y-4 select-none">
                <span className="text-[9px] text-[#d4fc34] uppercase tracking-widest font-mono font-black block">Reglamentación Oficial Srtc</span>
                <div className="flex gap-4 items-center">
                  <img 
                    src="/src/assets/images/gear_showcase_1781911001400.jpg" 
                    alt="Paleta y Pelota de Padel" 
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-800 shadow-md shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="space-y-0.5">
                    <h4 className="text-[11px] font-bold text-white uppercase tracking-wide">Pelotas y Palas de Competición</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                      Pelotas amarillas de alta presión homologadas FIP y palas de carbono amortiguadas homologadas para evitar lesiones.
                    </p>
                  </div>
                </div>
                <div className="bg-slate-900/50 p-2.5 rounded-xl text-[9px] text-slate-400 flex items-center justify-between border border-slate-900">
                  <span className="font-bold text-slate-500 uppercase">Sede Oficial</span>
                  <span className="text-[#d4fc34] font-black uppercase">Complejo Arena Padel</span>
                </div>
              </div>
            </div>
          </motion.div>

        </div>

        {/* COL 2: LIVE MATCH REEL & TOP PLAYERS RANKING */}
        <div className="space-y-6">
          
          {/* LIVE MATCH REEL */}
          <motion.div variants={itemVariants} className="sports-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#d4fc34]" />
                <h3 className="font-bold text-sm text-white font-display uppercase tracking-wider">Cronograma Reciente</h3>
              </div>
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Live Feed</span>
            </div>

            <div className="space-y-3">
              {(() => {
                const recentMatches = [...matches]
                  .filter(m => m.pair1Id && m.pair2Id)
                  .sort((a, b) => {
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
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-900 text-xs hover:border-[#d4fc34]/20 transition-colors"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mb-2">
                        <span className="font-mono bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300 font-bold uppercase">{m.stageName} • R{m.roundNumber}</span>
                        <span className="font-mono text-slate-500">{getTournamentName(m.tournamentId).split(' 20')[0]}</span>
                      </div>

                      {/* Team Names */}
                      <div className="space-y-2 py-1">
                        <div className="flex justify-between items-center">
                          <span className={`font-semibold text-[11px] ${isFinished && m.winnerPairId === m.pair1Id ? "text-[#d4fc34] font-bold" : "text-slate-350"}`}>
                            {getPlayerNamesByPairId(m.pair1Id)}
                          </span>
                          {isFinished && m.winnerPairId === m.pair1Id && (
                            <CheckCircle className="w-3.5 h-3.5 text-[#d4fc34]" />
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={`font-semibold text-[11px] ${isFinished && m.winnerPairId === m.pair2Id ? "text-[#d4fc34] font-bold" : "text-slate-350"}`}>
                            {getPlayerNamesByPairId(m.pair2Id)}
                          </span>
                          {isFinished && m.winnerPairId === m.pair2Id && (
                            <CheckCircle className="w-3.5 h-3.5 text-[#d4fc34]" />
                          )}
                        </div>
                      </div>

                      {/* Bottom Metadata & score */}
                      <div className="mt-3.5 pt-2.5 border-t border-slate-900/60 flex items-center justify-between text-[11px]">
                        {isFinished ? (
                          <LiveBadge status="completed" text={m.scoreSummary || "W.O."} />
                        ) : (
                          <div className="flex items-center gap-1 text-slate-450 font-mono text-[10px]">
                            <span>{m.date || "Pendiente"}</span>
                            <span>•</span>
                            <span className="text-[#d4fc34]">{m.time ? `${m.time} HS` : "s/h"}</span>
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
          </motion.div>

          {/* TOP PLAYERS PERMANENT RANKING */}
          <motion.div variants={itemVariants} className="sports-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#d4fc34]" />
                <h3 className="font-bold text-sm text-white font-display uppercase tracking-wider">Líderes de Ranking</h3>
              </div>
              <button 
                onClick={() => onNavigate("rankings")} 
                className="text-[11px] text-[#d4fc34] hover:underline hover:text-[#bde61f] font-bold transition-colors cursor-pointer"
              >
                Ver Todo
              </button>
            </div>

            <div className="space-y-3">
              {topPlayers.map((p, index) => {
                const medals = ["🥇", "🥈", "🥉", "🏅"];
                return (
                  <div 
                    key={p.id}
                    className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-900 hover:border-[#d4fc34]/15 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xs font-bold font-mono text-slate-500 w-4 block text-center">
                        {medals[index] || `#${index + 1}`}
                      </span>
                      <img 
                        src={p.photoUrl} 
                        alt={`${p.firstName} ${p.lastName}`} 
                        className="w-8 h-8 rounded-full object-cover border border-slate-900 shrink-0" 
                      />
                      <div className="min-w-0">
                        <span className="block font-bold text-xs text-slate-100 truncate">
                          {p.firstName} {p.lastName}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono truncate block">
                          {p.category} • {p.city}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono text-xs font-black text-[#d4fc34] block leading-none">
                        {p.rankingPoints}
                      </span>
                      <span className="text-[8px] text-slate-550 uppercase font-mono tracking-wider mt-0.5 block">Puntos</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* HISTORICAL COMPLETED SHORTCUT */}
          <motion.div variants={itemVariants} className="sports-card p-4 flex items-center justify-between hover:sports-card-glow transition cursor-pointer" onClick={() => onNavigate("tournaments")}>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-500/10 rounded-xl">
                <CheckCircle className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <span className="block text-xs font-bold text-white uppercase tracking-wider font-display">Historial de Clasificaciones</span>
                <span className="text-[10px] text-slate-500 font-mono">Consulte torneos finalizados</span>
              </div>
            </div>
            <div className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-950 border border-slate-900">
              <ArrowUpRight className="w-4 h-4 text-[#d4fc34]" />
            </div>
          </motion.div>

        </div>

      </div>

    </motion.div>
  );
};
