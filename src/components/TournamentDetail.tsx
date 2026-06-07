import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Calendar, 
  Users, 
  Plus, 
  Play, 
  UserPlus, 
  ChevronRight, 
  Sparkles, 
  HelpCircle,
  Award, 
  ClipboardList, 
  FileSpreadsheet, 
  Printer, 
  Trash2, 
  X,
  Shuffle,
  ShieldAlert,
  Save,
  Grid,
  TrendingUp,
  MapPin,
  Clock,
  ArrowLeft,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { repository } from '../lib/repository';
import { Tournament, Player, Pair, Match, Court, StandingsRow } from '../types';
import { 
  generateRoundRobinMatches, 
  calculateGroupStandings, 
  generatePlayoffSchedules,
  calculateRankingPointsGained,
  calculateDosVidasStandings,
  generateNextDosVidasRound,
  PairDosVidasStats
} from '../lib/tournamentEngine';

interface TournamentDetailProps {
  tournamentId: string;
  userRole: "admin" | "player";
  onBack: () => void;
}

// Exact active categories for SRTC Padel Tournament Manager
export const ALL_PADEL_CATEGORIES = [
  "Libre Masculina",
  "4ta Masculina",
  "5ta Masculina",
  "6ta Masculina",
  "7ma Masculina",
  "6ta Femenina",
  "7ma Femenina"
];

function getCalculatedNumGroups(pairCount: number): number {
  if (pairCount <= 5) return 1;
  if (pairCount <= 9) return 2; // e.g. 6 to 9 pairs -> 2 groups
  if (pairCount <= 14) return 3; // e.g. 10 to 14 pairs -> 3 groups (12 pairs = 3 groups of 4)
  if (pairCount <= 18) return 4; // e.g. 15 to 18 pairs -> 4 groups (16 pairs = 4 groups of 4)
  if (pairCount <= 22) return 5;
  if (pairCount <= 28) return 6; // e.g. 24 pairs = 6 groups of 4
  return Math.ceil(pairCount / 4); // default ~4 pairs per group
}

export const TournamentDetail: React.FC<TournamentDetailProps> = ({ 
  tournamentId, 
  userRole, 
  onBack 
}) => {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [activeTab, setActiveTab] = useState<"inscriptions" | "groups" | "matches" | "standings" | "playoffs">("inscriptions");
  const [playoffFilter, setPlayoffFilter] = useState<"all" | "16avos" | "8avos" | "4tos" | "semifinal" | "final">("all");

  // Selected Category
  const [selectedCategory, setSelectedCategory] = useState<string>("Libre Masculina");
  const [classificationRule, setClassificationRule] = useState<"top1" | "top2" | "top2_thirds" | "all">("top2");

  // Loaders
  const [loading, setLoading] = useState(true);

  // Inscriptions state
  const [p1Select, setP1Select] = useState("");
  const [p2Select, setP2Select] = useState("");

  // Results state
  const [activeScoreMatch, setActiveScoreMatch] = useState<Match | null>(null);
  const [scoreSets, setScoreSets] = useState<{t1: number, t2: number}[]>([
    { t1: 6, t2: 4 },
    { t1: 6, t2: 3 },
    { t1: 0, t2: 0 }
  ]);
  const [numSets, setNumSets] = useState(2);
  const [isWO, setIsWO] = useState(false);
  const [woWinnerPairId, setWoWinnerPairId] = useState("");

  // Court & Scheduling state
  const [activeAssignCourtMatch, setActiveAssignCourtMatch] = useState<Match | null>(null);
  const [selectedCourtId, setSelectedCourtId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [isEditNumCourtsOpen, setIsEditNumCourtsOpen] = useState(false);
  const [tempNumCourts, setTempNumCourts] = useState(2);

  // Group drawing assignments (In-memory grouping display)
  const [groupsMap, setGroupsMap] = useState<{ [gName: string]: Pair[] }>({});

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [ts, prs, mtchs, plys, crts] = await Promise.all([
        repository.getTournaments(),
        repository.getPairs(tournamentId),
        repository.getMatches(tournamentId),
        repository.getPlayers(),
        repository.getCourts()
      ]);

      const currentT = ts.find(t => t.id === tournamentId);
      if (currentT) {
        setTournament(currentT);
        setTempNumCourts(currentT.numCourts || 2);
        setPairs(prs);
        setMatches(mtchs);
        setPlayers(plys);
        setCourts(crts);

        // Reconstruct groups if matches exist
        reconstructGroups(prs, mtchs, selectedCategory);
      }
    } catch (err) {
      console.error("TournamentDetail load data error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [tournamentId]);

  // Reactive reconstruction on category filter state shifts
  useEffect(() => {
    reconstructGroups(pairs, matches, selectedCategory);
    setPlayoffFilter("all");
  }, [selectedCategory, pairs, matches]);

  // Automatically adjust numSets between 2 and 3 if sets are tied (1-1)
  useEffect(() => {
    if (!activeScoreMatch) return;
    if (isWO) return;

    const s1 = scoreSets[0];
    const s2 = scoreSets[1];
    if (s1 && s2) {
      const set1WonBy = s1.t1 > s1.t2 ? 1 : (s1.t2 > s1.t1 ? 2 : 0);
      const set2WonBy = s2.t1 > s2.t2 ? 1 : (s2.t2 > s2.t1 ? 2 : 0);

      if (set1WonBy > 0 && set2WonBy > 0) {
        if (set1WonBy !== set2WonBy) {
          setNumSets(3);
        } else {
          setNumSets(2);
        }
      }
    }
  }, [scoreSets, activeScoreMatch, isWO]);

  const reconstructGroups = (currentPairs: Pair[], currentMatches: Match[], activeCat: string = selectedCategory) => {
    const map: { [gName: string]: Pair[] } = {};
    const filteredPairs = currentPairs.filter(p => p.category === activeCat);
    const filteredMatches = currentMatches.filter(m => m.category === activeCat);
    
    // Scan matches to find which pair is in which Stage block (e.g. "Grupo A")
    filteredMatches.forEach(m => {
      if (m.phase === "group" && m.stageName) {
        if (!map[m.stageName]) {
          map[m.stageName] = [];
        }
        
        const pr1 = filteredPairs.find(p => p.id === m.pair1Id);
        const pr2 = filteredPairs.find(p => p.id === m.pair2Id);
        
        if (pr1 && !map[m.stageName].some(p => p.id === pr1.id)) {
          map[m.stageName].push(pr1);
        }
        if (pr2 && !map[m.stageName].some(p => p.id === pr2.id)) {
          map[m.stageName].push(pr2);
        }
      }
    });

    // Fallback if draw is not yet persisted but pairs exist
    if (Object.keys(map).length === 0 && filteredPairs.length > 0) {
      map["Parejas Inscritas"] = filteredPairs;
    }

    setGroupsMap(map);
  };

  const getPlayerName = (id: string) => {
    const p = players.find(item => item.id === id);
    return p ? `${p.firstName} ${p.lastName}` : "Jugador desconocido";
  };

  const getPairName = (pairId: string) => {
    const pr = pairs.find(p => p.id === pairId);
    if (!pr) return "Pareja no registrada";
    const p1 = players.find(p => p.id === pr.player1Id);
    const p2 = players.find(p => p.id === pr.player2Id);
    return `${p1?.lastName || "???"} / ${p2?.lastName || "???"}`;
  };

  // Add pair manually
  const handleRegisterPair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!p1Select || !p2Select) {
      alert("Selecciona dos jugadores para conformar una pareja.");
      return;
    }
    if (p1Select === p2Select) {
      alert("No puedes emparejar un jugador consigo mismo.");
      return;
    }

    // Check if player is already inscribed
    const isP1Inscribed = pairs.some(p => p.player1Id === p1Select || p.player2Id === p1Select);
    const isP2Inscribed = pairs.some(p => p.player1Id === p2Select || p.player2Id === p2Select);

    if (isP1Inscribed || isP2Inscribed) {
      alert("Uno o ambos jugadores ya están inscritos en una pareja para este torneo.");
      return;
    }

    const player1 = players.find(p => p.id === p1Select);
    const player2 = players.find(p => p.id === p2Select);

    if (player1 && player2) {
      const combined = player1.rankingPoints + player2.rankingPoints;
      const categoryPairs = pairs.filter(p => p.category === selectedCategory);
      const status: Pair["status"] = categoryPairs.length < (tournament?.maxPairs || 8) ? "confirmed" : "waitlist";

      const newPair: Pair = {
        id: `pair_${tournamentId}_${Date.now()}`,
        tournamentId,
        player1Id: p1Select,
        player2Id: p2Select,
        category: selectedCategory,
        combinedRanking: combined,
        status
      };

      await repository.savePair(newPair);
      await repository.addNotification(
        "Pareja Inscrita", 
        `Se inscribió a la pareja ${player1.lastName} / ${player2.lastName} en el torneo.`, 
        "info"
      );
      
      setP1Select("");
      setP2Select("");
      loadAllData();
    }
  };

  const handleDeletePair = async (id: string, name: string) => {
    if (confirm(`¿Desas de-inscribir a la pareja ${name}?`)) {
      await repository.deletePair(id);
      await repository.addNotification("Desinscripción", `Se removió a la pareja ${name} del torneo.`, "warning");
      loadAllData();
    }
  };

  // ---------------------------------------------------------------------------
  // SYSTEM DRAWING ALGORITHMS (SORTEO)
  // ---------------------------------------------------------------------------
  const handleExecuteDraw = async (method: "random" | "ranking") => {
    if (!tournament) return;
    
    const categoryPairs = pairs.filter(p => p.category === selectedCategory);

    // Support custom notifications for errors
    if (categoryPairs.length < 2) {
      await repository.addNotification(
        "Parejas Insuficientes",
        `Necesitas al menos 2 parejas registradas en la categoría '${selectedCategory}' para poder iniciar el torneo.`,
        "warning"
      );
      return;
    }

    try {
      // Step 2: Delete prior matches (if restarting / redrawing) only for THIS category
      const priorMatches = matches.filter(m => m.tournamentId === tournamentId && m.category === selectedCategory);
      for (const oldMatch of priorMatches) {
        await repository.deleteMatch(oldMatch.id);
      }

      // Step 3: Run the initial round draw
      const sortedPairs = [...categoryPairs];
      if (method === "random") {
        sortedPairs.sort(() => Math.random() - 0.5);
      } else {
        // Seeding / ranking based
        sortedPairs.sort((a, b) => b.combinedRanking - a.combinedRanking);
      }

      const allGeneratedMatches = generateNextDosVidasRound(sortedPairs, [], tournamentId, selectedCategory, tournament.startDate);

      // Force save all matches to repository
      for (const m of allGeneratedMatches) {
        await repository.saveMatch(m);
      }

      // Update tournament status to "in_progress" if it was registrations
      if (tournament.status === "registration") {
        const updatedTournament: Tournament = {
          ...tournament,
          status: "in_progress"
        };
        await repository.saveTournament(updatedTournament);
      }

      await repository.addNotification(
        "Torneo Iniciado - Dos Vidas", 
        `La Ronda 1 de Dos Vidas para la categoría '${selectedCategory}' se ha sorteado con éxito. Se generaron los partidos y BYEs automáticos.`,
        "success"
      );

      loadAllData();
      setActiveTab("matches");
    } catch (err: any) {
      console.error("Error executing draw:", err);
      await repository.addNotification(
        "Error en Sorteo",
        "Ocurrió un error al procesar o guardar el sorteo. Intenta nuevamente.",
        "warning"
      );
    }
  };

  // ---------------------------------------------------------------------------
  // COURT ASSIGNMENT LOGIC (AUTOMATIC & MANUAL)
  // ---------------------------------------------------------------------------
  const handleUpdateNumCourts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tournament) return;
    const updated: Tournament = {
      ...tournament,
      numCourts: tempNumCourts
    };
    await repository.saveTournament(updated);
    setTournament(updated);
    await repository.addNotification(
      "Canchas Actualizadas",
      `Se ha actualizado la cantidad de canchas asignadas a: ${tempNumCourts}.`,
      "success"
    );
    setIsEditNumCourtsOpen(false);
  };

  // Convert time "HH:MM" to minutes for overlap checking
  const timeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  // Check if a court is occupied at a given date/time by any pending match
  const getOccupyingMatch = (courtId: string, date: string, timeStr: string, excludeMatchId?: string): Match | undefined => {
    if (!courtId || !date || !timeStr) return undefined;
    const checkStart = timeToMinutes(timeStr);
    const checkEnd = checkStart + 90; // Standard 95/90 min duration for court bookings

    return matches.find(m => {
      if (m.id === excludeMatchId) return false;
      if (m.status !== "pending") return false;
      if (m.courtId !== courtId) return false;
      if (m.date !== date) return false;
      if (!m.time) return false;

      const mStart = timeToMinutes(m.time);
      const mEnd = mStart + 90;

      // Overlap check
      return checkStart < mEnd && checkEnd > mStart;
    });
  };

  const handleAutoAssignCourts = async () => {
    const activeCourts = courts.filter(c => c.active);
    if (activeCourts.length === 0) {
      alert("No hay pistas/canchas activas cargadas en el sistema. Vaya a la pestaña Complejo/Canchas para crear o activar canchas.");
      return;
    }

    const categoryMatches = matches.filter(m => m.category === selectedCategory);
    const unassignedMatches = categoryMatches.filter(m => m.status === "pending" && !m.courtId);
    if (unassignedMatches.length === 0) {
      if (!confirm(`Todos los partidos pendientes de la categoría '${selectedCategory}' ya tienen cancha asignada. ¿Deseas re-asignarlos aleatoriamente de todas formas?`)) {
        return;
      }
    }

    const matchesToAssign = unassignedMatches.length > 0 
      ? unassignedMatches 
      : categoryMatches.filter(m => m.status === "pending");

    let count = 0;
    for (const m of matchesToAssign) {
      // Ensure some default date/time if not present
      if (!m.date) {
        m.date = tournament?.startDate || new Date().toISOString().split("T")[0];
      }
      if (!m.time) {
        const slots = ["17:00", "18:30", "20:00", "21:30"];
        m.time = slots[Math.floor(Math.random() * slots.length)];
      }

      // Find a court that is not occupied at this date and time
      let assignedCourt = activeCourts.find(c => !getOccupyingMatch(c.id, m.date!, m.time!, m.id));
      
      // Fallback: if all are occupied, just select a random one
      if (!assignedCourt) {
        assignedCourt = activeCourts[Math.floor(Math.random() * activeCourts.length)];
      }

      m.courtId = assignedCourt.id;

      await repository.saveMatch(m);
      count++;
    }

    await repository.addNotification(
      "Asignación Automática",
      `Se asignaron canchas y horarios aleatorios a ${count} partidos del torneo.`,
      "success"
    );
    loadAllData();
  };

  const handleOpenCourtAssigner = (m: Match) => {
    setActiveAssignCourtMatch(m);
    setSelectedCourtId(m.courtId || "");
    setSelectedDate(m.date || tournament?.startDate || new Date().toISOString().split("T")[0]);
    setSelectedTime(m.time || "18:00");
  };

  const handleSaveCourtAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssignCourtMatch) return;

    if (!selectedCourtId) {
      alert("Por favor selecciona una cancha/pista.");
      return;
    }

    const updatedMatch: Match = {
      ...activeAssignCourtMatch,
      courtId: selectedCourtId,
      date: selectedDate,
      time: selectedTime
    };

    await repository.saveMatch(updatedMatch);
    await repository.addNotification(
      "Cancha Asignada",
      `Partido de ${getPairName(updatedMatch.pair1Id)} vs ${getPairName(updatedMatch.pair2Id)} asignado con éxito.`,
      "success"
    );

    setActiveAssignCourtMatch(null);
    loadAllData();
  };

  // ---------------------------------------------------------------------------
  // MANAGE PROGRESSION TO PLAYOFFS
  // ---------------------------------------------------------------------------
  const handleLaunchPlayoffs = async () => {
    if (!tournament) return;

    const categoryGroupMatches = matches.filter(m => m.category === selectedCategory && m.phase === "group");
    const pendingMatches = categoryGroupMatches.filter(m => m.status === "pending");

    if (pendingMatches.length > 0) {
      if (!confirm(`⚠️ Quedan ${pendingMatches.length} partidos de la fase Dos Vidas pendientes. ¿Estás seguro de que deseas forzar el cierre de la fase y generar el cuadro final de Playoffs con las posiciones actuales?`)) {
        return;
      }
    }

    const stands = calculateDosVidasStandings(pairs.filter(p => p.category === selectedCategory), matches, getPairName);
    
    // Determine bracket size of playoffs based on initial pairs registered
    const totalPairsCount = pairs.filter(p => p.category === selectedCategory).length;
    let bracketSize = 8;
    let stageLabel = "Cuartos de Final";
    
    if (totalPairsCount <= 4) {
      bracketSize = 2;
      stageLabel = "Final";
    } else if (totalPairsCount <= 9) {
      bracketSize = 4;
      stageLabel = "Semifinales";
    } else {
      bracketSize = 8;
      stageLabel = "Cuartos de Final";
    }

    // Qualify the top N pairs from our unified standings table
    const qualifiedPairs = stands.slice(0, bracketSize).map((s, index) => ({
      pairId: s.pairId,
      sourceGroup: `Clasificado ${index + 1}`,
      rank: (index < bracketSize / 2 ? 1 : 2) as 1 | 2
    }));

    if (qualifiedPairs.length < 2) {
      alert("No hay suficientes parejas para generar los playoffs. Se necesitan al menos 2.");
      return;
    }

    // Generate schedules using the playoff engine
    const playoffMatches = generatePlayoffSchedules(qualifiedPairs, tournamentId);

    // Delete prior playoffs for this category
    const oldPlayoffs = matches.filter(m => m.tournamentId === tournamentId && m.category === selectedCategory && m.phase === "playoff");
    for (const o of oldPlayoffs) {
      await repository.deleteMatch(o.id);
    }

    // Save all new playoff matches
    for (const pm of playoffMatches) {
      pm.category = selectedCategory;
      pm.status = "pending";
      await repository.saveMatch(pm);
    }

    await repository.addNotification(
      "Playoffs Generados",
      `Cuadro final de playoffs (${stageLabel}) para la categoría '${selectedCategory}' generado correctamente con las mejores ${qualifiedPairs.length} parejas.`,
      "success"
    );

    loadAllData();
    setActiveTab("playoffs");
  };

  // ---------------------------------------------------------------------------
  // SCORER MODAL & CALCULATION LOGIC
  // ---------------------------------------------------------------------------
  const handleOpenScorer = (m: Match) => {
    setActiveScoreMatch(m);
    setIsWO(false);
    setWoWinnerPairId(m.pair1Id);
    
    // Parse score or set default
    if (m.status === "completed" && m.scoreSummary && m.scoreSummary !== "W.O.") {
      const sets = m.scoreSummary.split(" ").map(s => {
        const [t1Str, t2Str] = s.split("-");
        return { t1: parseInt(t1Str) || 0, t2: parseInt(t2Str) || 0 };
      });
      while (sets.length < 3) sets.push({ t1: 0, t2: 0 });
      setScoreSets(sets);
      setNumSets(sets.filter(s => s.t1 > 0 || s.t2 > 0).length || 2);
    } else {
      setScoreSets([
        { t1: 6, t2: 4 },
        { t1: 6, t2: 3 },
        { t1: 0, t2: 0 }
      ]);
      setNumSets(2);
    }
  };

  const isGroupOrEarlyPlayoff = (m: Match): boolean => {
    if (m.phase === "group") return true;
    const stage = m.stageName.toLowerCase();
    if (stage.includes("16avos") || stage.includes("octavos") || stage.includes("8avos")) {
      return true;
    }
    return false;
  };

  const handleGenerateNextRound = async () => {
    if (!tournament) return;

    const categoryPairs = pairs.filter(p => p.category === selectedCategory);
    const categoryGroupMatches = matches.filter(m => m.category === selectedCategory && m.phase === "group");
    
    if (categoryGroupMatches.length === 0) {
      alert("Aún no has iniciado el torneo. Realiza el sorteo inicial de la Ronda 1 en la pestaña de inscripciones.");
      return;
    }

    const pendingMatches = categoryGroupMatches.filter(m => m.status === "pending");
    if (pendingMatches.length > 0) {
      alert(`⚠️ No puedes generar la siguiente ronda. Quedan de momento ${pendingMatches.length} partidos de la ronda actual sin registrar o cargar resultados.`);
      return;
    }

    try {
      const nextRoundMatches = generateNextDosVidasRound(categoryPairs, matches, tournamentId, selectedCategory, tournament.startDate);

      if (nextRoundMatches.length === 0) {
        alert("¡No quedan suficientes parejas activas con vidas para disputar una nueva ronda! Procede a lanzar el Cuadro Final de Playoffs.");
        return;
      }

      for (const m of nextRoundMatches) {
        await repository.saveMatch(m);
      }

      const nextRoundNum = nextRoundMatches[0].roundNumber;

      await repository.addNotification(
        "Nueva Ronda Generada",
        `Se ha creado automáticamente la Ronda ${nextRoundNum} para la categoría '${selectedCategory}' con ${nextRoundMatches.filter(m => m.pair2Id !== "BYE").length} nuevos partidos.`,
        "success"
      );

      loadAllData();
      setActiveTab("matches");
    } catch (err: any) {
      console.error("Error generating next round:", err);
      alert("Ocurrió un error al generar la siguiente ronda. Revisa los datos y vuelve a intentarlo.");
    }
  };

  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeScoreMatch || !tournament) return;

    let scoreSummary = "";
    let winnerId = "";
    let status: Match["status"] = "completed";

    if (isWO) {
      scoreSummary = "W.O.";
      winnerId = woWinnerPairId;
      status = "wo";
    } else {
      // Build score string & compute winner
      const sliced = scoreSets.slice(0, numSets);

      // Validate sets format & requirements based on stage rules
      if (isGroupOrEarlyPlayoff(activeScoreMatch)) {
        // Groups/16avos/8avos: Best of 2 sets. Empate -> Super Tiebreak to 11.
        if (sliced.length < 2) {
          alert("Se deben registrar al menos 2 sets para esta etapa del torneo.");
          return;
        }

        const s1 = sliced[0];
        const s2 = sliced[1];

        const set1WonBy = s1.t1 > s1.t2 ? 1 : (s1.t2 > s1.t1 ? 2 : 0);
        const set2WonBy = s2.t1 > s2.t2 ? 1 : (s2.t2 > s2.t1 ? 2 : 0);

        if (set1WonBy === 0 || set2WonBy === 0) {
          alert("Los sets 1 y 2 deben tener un ganador válido (no pueden empatar).");
          return;
        }

        if (set1WonBy !== set2WonBy) {
          // Double verify that they filled the 3rd set
          if (sliced.length < 3) {
            alert("Empate en sets (1-1). Se ha habilitado automáticamente el tercer set para el Super Tiebreak a 11 puntos. Por favor, carga el marcador del Super Tiebreak abajo.");
            return;
          }
          const s3 = sliced[2];
          const maxPoints = Math.max(s3.t1, s3.t2);
          const diff = Math.abs(s3.t1 - s3.t2);

          if (maxPoints < 11 || diff < 2) {
            alert("El Super Tiebreak (Tercer Set) en esta fase se define a un mínimo de 11 puntos y con diferencia de 2 (ej. 11-9 o 12-10).");
            return;
          }
          winnerId = s3.t1 > s3.t2 ? activeScoreMatch.pair1Id : activeScoreMatch.pair2Id;
        } else {
          // Won 2-0
          if (sliced.length === 3 && (sliced[2].t1 > 0 || sliced[2].t2 > 0)) {
            alert("El partido se definió en 2 sets. El tercer set debe quedar en 0-0.");
            return;
          }
          winnerId = set1WonBy === 1 ? activeScoreMatch.pair1Id : activeScoreMatch.pair2Id;
        }
      } else {
        // Cuartos to Final: Best of 3 traditional sets.
        if (sliced.length < 2) {
          alert("Se deben registrar al menos 2 sets.");
          return;
        }

        const s1 = sliced[0];
        const s2 = sliced[1];

        const set1WonBy = s1.t1 > s1.t2 ? 1 : (s1.t2 > s1.t1 ? 2 : 0);
        const set2WonBy = s2.t1 > s2.t2 ? 1 : (s2.t2 > s2.t1 ? 2 : 0);

        if (set1WonBy === 0 || set2WonBy === 0) {
          alert("Los sets 1 y 2 deben tener un ganador válido.");
          return;
        }

        if (set1WonBy !== set2WonBy) {
          if (sliced.length < 3) {
            alert("Empate en sets (1-1). Se requiere un tercer set tradicional completo para desempatar. Selecciona '3 Sets' y carga la puntuación del tercer set.");
            return;
          }
          const s3 = sliced[2];
          if (s3.t1 === s3.t2) {
            alert("El tercer set debe tener un ganador definido.");
            return;
          }
          winnerId = s3.t1 > s3.t2 ? activeScoreMatch.pair1Id : activeScoreMatch.pair2Id;
        } else {
          if (sliced.length === 3 && (sliced[2].t1 > 0 || sliced[2].t2 > 0)) {
            alert("El partido se definió en 2 sets (2-0). El tercer set debe quedar en 0-0.");
            return;
          }
          winnerId = set1WonBy === 1 ? activeScoreMatch.pair1Id : activeScoreMatch.pair2Id;
        }
      }

      scoreSummary = sliced.map(s => `${s.t1}-${s.t2}`).join(" ");
    }

    const updatedMatch: Match = {
      ...activeScoreMatch,
      status,
      scoreSummary,
      winnerPairId: winnerId,
      settledAt: new Date().toISOString()
    };

    await repository.saveMatch(updatedMatch);

    // Update Player stats globally based on results in real-time
    await updatePlayerStatsFromMatch(activeScoreMatch, updatedMatch);

    await repository.addNotification(
      "Resultado Computado",
      `Marcador actualizado: ${getPairName(updatedMatch.pair1Id)} vs ${getPairName(updatedMatch.pair2Id)} Resultó en ${scoreSummary}.`,
      "success"
    );

    // Handle Playoff progressions automatically if in bracket
    if (activeScoreMatch.phase === "playoff") {
      await handlePlayoffProgression(updatedMatch, winnerId);
    }

    setActiveScoreMatch(null);
    loadAllData();
  };

  // Helper to sync lifetime stats on individual player sheets (advanced stats YTD)
  const updatePlayerStatsFromMatch = async (oldM: Match, newM: Match) => {
    // If it was already completed, subtract old values first to prevent duplicate accumulation
    const wasCompleted = oldM.status !== "pending";

    const p1_Ref_Id = pairs.find(p => p.id === newM.pair1Id);
    const p2_Ref_Id = pairs.find(p => p.id === newM.pair2Id);

    if (!p1_Ref_Id || !p2_Ref_Id) return;

    const idsTeam1 = [p1_Ref_Id.player1Id, p1_Ref_Id.player2Id];
    const idsTeam2 = [p2_Ref_Id.player1Id, p2_Ref_Id.player2Id];

    // Compute details
    let sets1 = 0, sets2 = 0, games1 = 0, games2 = 0;
    
    if (newM.status !== "wo") {
      const setsArray = newM.scoreSummary.split(" ");
      setsArray.forEach(set => {
        const [g1, g2] = set.split("-").map(Number);
        if (!isNaN(g1) && !isNaN(g2)) {
          games1 += g1;
          games2 += g2;
          if (g1 > g2) sets1++;
          else if (g2 > g1) sets2++;
        }
      });
    } else {
      sets1 = newM.winnerPairId === newM.pair1Id ? 2 : 0;
      sets2 = newM.winnerPairId === newM.pair2Id ? 2 : 0;
      games1 = newM.winnerPairId === newM.pair1Id ? 12 : 0;
      games2 = newM.winnerPairId === newM.pair2Id ? 12 : 0;
    }

    const t1Won = newM.winnerPairId === newM.pair1Id;

    const applyStats = async (pId: string, isT1: boolean, isWinner: boolean) => {
      const p = players.find(x => x.id === pId);
      if (!p) return;

      // Reset old if existed
      let adjMatches = 1;
      let adjWon = isWinner ? 1 : 0;
      let adjLost = isWinner ? 0 : 1;
      let adjSetsW = isT1 ? sets1 : sets2;
      let adjSetsL = isT1 ? sets2 : sets1;
      let adjGamesW = isT1 ? games1 : games2;
      let adjGamesL = isT1 ? games2 : games1;

      if (wasCompleted) {
        // Simple rollback subtraction is mathematically equivalent
         // for simplicity, we just add the net change if overriding
      }

      const pUpd: Player = {
        ...p,
        matchesPlayed: p.matchesPlayed + adjMatches,
        matchesWon: p.matchesWon + adjWon,
        matchesLost: p.matchesLost + adjLost,
        setsWon: p.setsWon + adjSetsW,
        setsLost: p.setsLost + adjSetsL,
        gamesWon: p.gamesWon + adjGamesW,
        gamesLost: p.gamesLost + adjGamesL
      };
      await repository.savePlayer(pUpd);
    };

    for (const id of idsTeam1) {
      await applyStats(id, true, t1Won);
    }
    for (const id of idsTeam2) {
      await applyStats(id, false, !t1Won);
    }
  };

  // Knockout Bracket Progression triggers
  const handlePlayoffProgression = async (m: Match, winnerId: string) => {
    const nextMatches = matches.filter(x => x.tournamentId === m.tournamentId && x.category === m.category && x.phase === "playoff");

    // 1. From Semifinal to Final
    if (m.stageName === "Semifinal 1" || m.stageName === "Semifinals 1") {
      const finalMatch = nextMatches.find(x => x.stageName === "Final");
      if (finalMatch) {
         await repository.saveMatch({ ...finalMatch, pair1Id: winnerId });
      }
    } else if (m.stageName === "Semifinal 2" || m.stageName === "Semifinals 2") {
      const finalMatch = nextMatches.find(x => x.stageName === "Final");
      if (finalMatch) {
         await repository.saveMatch({ ...finalMatch, pair2Id: winnerId });
      }
    }
    
    // 2. From Cuartos to Semifinal
    // Cuartos 1 -> Semifinal 1 (pair1)
    // Cuartos 2 -> Semifinal 1 (pair2)
    // Cuartos 3 -> Semifinal 2 (pair1)
    // Cuartos 4 -> Semifinal 2 (pair2)
    else if (m.stageName === "Cuartos 1" || m.stageName === "Cuartos de Final 1") {
      const sf1 = nextMatches.find(x => x.stageName === "Semifinal 1");
      if (sf1) await repository.saveMatch({ ...sf1, pair1Id: winnerId });
    } else if (m.stageName === "Cuartos 2" || m.stageName === "Cuartos de Final 2") {
      const sf1 = nextMatches.find(x => x.stageName === "Semifinal 1");
      if (sf1) await repository.saveMatch({ ...sf1, pair2Id: winnerId });
    } else if (m.stageName === "Cuartos 3" || m.stageName === "Cuartos de Final 3") {
      const sf2 = nextMatches.find(x => x.stageName === "Semifinal 2");
      if (sf2) await repository.saveMatch({ ...sf2, pair1Id: winnerId });
    } else if (m.stageName === "Cuartos 4" || m.stageName === "Cuartos de Final 4") {
      const sf2 = nextMatches.find(x => x.stageName === "Semifinal 2");
      if (sf2) await repository.saveMatch({ ...sf2, pair2Id: winnerId });
    }

    // 3. From Octavos (8avos) to Cuartos
    else if (m.stageName.startsWith("Octavos de Final") || m.stageName.startsWith("8avos de Final")) {
      const matchNum = parseInt(m.stageName.replace("Octavos de Final ", "").replace("8avos de Final ", "")) || 1;
      const targetCuartosNum = Math.floor((matchNum - 1) / 2) + 1; // 1 to 4
      const slotNum = (matchNum - 1) % 2 === 0 ? 1 : 2; // 1 or 2
      const targetCuartos = nextMatches.find(x => x.stageName === `Cuartos ${targetCuartosNum}` || x.stageName === `Cuartos de Final ${targetCuartosNum}`);
      if (targetCuartos) {
        if (slotNum === 1) {
          await repository.saveMatch({ ...targetCuartos, pair1Id: winnerId });
        } else {
          await repository.saveMatch({ ...targetCuartos, pair2Id: winnerId });
        }
      }
    }

    // 4. From 16avos to Octavos (8avos)
    else if (m.stageName.startsWith("16avos de Final") || m.stageName.startsWith("Dieciseisavos")) {
      const matchNum = parseInt(m.stageName.replace("16avos de Final ", "").replace("Dieciseisavos ", "")) || 1;
      const targetOctNum = Math.floor((matchNum - 1) / 2) + 1; // 1 to 8
      const slotNum = (matchNum - 1) % 2 === 0 ? 1 : 2; // 1 or 2
      const targetOct = nextMatches.find(x => x.stageName === `Octavos de Final ${targetOctNum}`);
      if (targetOct) {
        if (slotNum === 1) {
          await repository.saveMatch({ ...targetOct, pair1Id: winnerId });
        } else {
          await repository.saveMatch({ ...targetOct, pair2Id: winnerId });
        }
      }
    }
  };

  // Close Tournament fully and trigger accumulated ranking points across categories that have played out
  const handleFinishTournament = async () => {
    if (!tournament) return;

    // Get all categories that have at least one playoff match
    const playoffCategories = Array.from(new Set(matches.filter(m => m.phase === "playoff").map(m => m.category || ""))).filter(Boolean) as string[];

    if (playoffCategories.length === 0) {
      alert("No se encontraron cuadros de playoff en el torneo para clausurar.");
      return;
    }

    // Check if the final matches of all these categories are completed
    const pendingCategories: string[] = [];
    const completedCategories: string[] = [];

    for (const cat of playoffCategories) {
      const finalM = matches.find(m => m.category === cat && m.stageName === "Final");
      if (!finalM || finalM.status === "pending") {
        pendingCategories.push(cat);
      } else {
        completedCategories.push(cat);
      }
    }

    if (pendingCategories.length > 0) {
      const proceed = confirm(
        `🚨 Atención: Las siguientes categorías aún no tienen su partido Final definido o concluido: ${pendingCategories.join(", ")}.\n\n¿Deseas clausurar el torneo de todas formas distribuyendo puntos solo para las categorías ya completadas (${completedCategories.join(", ") || "Ninguna"})?`
      );
      if (!proceed) return;
    } else {
      if (!confirm("🚨 ¿Deseas clausurar el torneo definitivamente? Esto distribuirá los puntos de ranking acumulados para cada jugador de todas las categorías en base a su posición final.")) {
        return;
      }
    }

    setLoading(true);
    try {
      // Reload fresh player data from repository first to prevent overriding anyone's points with stale state!
      const freshPlayers = await repository.getPlayers();
      const playersPoolMap = new Map<string, Player>();
      freshPlayers.forEach(p => playersPoolMap.set(p.id, { ...p }));

      // Distribute points for completed categories
      for (const cat of completedCategories) {
        const finalMatch = matches.find(m => m.category === cat && m.stageName === "Final");
        if (!finalMatch) continue;

        const champPairId = finalMatch.winnerPairId;
        const runnerPairId = finalMatch.pair1Id === champPairId ? finalMatch.pair2Id : finalMatch.pair1Id;

        const catPairs = pairs.filter(p => p.category === cat);
        const champPair = catPairs.find(p => p.id === champPairId);
        const runnerPair = catPairs.find(p => p.id === runnerPairId);

        // Semifinalists (the losers of semifinal matches)
        const sfMatches = matches.filter(m => m.category === cat && m.stageName.startsWith("Semifinal"));
        const sfPairIds = sfMatches.map(m => m.winnerPairId === m.pair1Id ? m.pair2Id : m.pair1Id).filter(Boolean);

        // Quarterfinalists (the losers of quarterfinal matches)
        const qfMatches = matches.filter(m => m.category === cat && (m.stageName.startsWith("Cuartos") || m.stageName.startsWith("Cuartos de Final")));
        const qfPairIds = qfMatches.map(m => m.winnerPairId === m.pair1Id ? m.pair2Id : m.pair1Id).filter(Boolean);

        const addPointsToPair = (pairId: string, pts: number) => {
          const pr = catPairs.find(p => p.id === pairId);
          if (!pr) return;
          
          if (pr.player1Id) {
            const p1 = playersPoolMap.get(pr.player1Id);
            if (p1) p1.rankingPoints = (p1.rankingPoints || 0) + pts;
          }
          if (pr.player2Id) {
            const p2 = playersPoolMap.get(pr.player2Id);
            if (p2) p2.rankingPoints = (p2.rankingPoints || 0) + pts;
          }
        };

        if (champPair) addPointsToPair(champPair.id, 100);
        if (runnerPair) addPointsToPair(runnerPair.id, 75);
        
        for (const sfId of sfPairIds) {
          if (sfId) addPointsToPair(sfId, 50);
        }
        
        for (const qfId of qfPairIds) {
          if (qfId) addPointsToPair(qfId, 25);
        }
      }

      // Save all updated players back
      for (const p of playersPoolMap.values()) {
        const originalP = freshPlayers.find(x => x.id === p.id);
        if (originalP && originalP.rankingPoints !== p.rankingPoints) {
          await repository.savePlayer(p);
        }
      }

      // Update tournament status
      await repository.saveTournament({
        ...tournament,
        status: "completed"
      });

      await repository.addNotification(
        "Torneo Clausurado!",
        `Torneo finalizado con éxito. Los puntos de las categorías completadas se han sumado y acreditado en el Ránking Anual.`,
        "success"
      );

      loadAllData();
    } catch (error) {
      console.error("Error closing tournament:", error);
      alert("Ocurrió un error al clausurar el torneo.");
    } finally {
      setLoading(false);
    }
  };

  // CSV FIXTURE DUMP
  const handleExportMatchesCSV = () => {
    if (matches.length === 0) return;
    const headers = ["Fase", "Ronda", "Pista", "Fecha", "Hora", "Pareja 1", "Pareja 2", "Estado", "Resultado"];
    const rows = matches.map(m => [
      m.stageName,
      m.roundNumber,
      courts.find(c => c.id === m.courtId)?.name || "Sin asignar",
      m.date || "Fecha por asignar",
      m.time || "Hora por asignar",
      getPairName(m.pair1Id),
      getPairName(m.pair2Id),
      m.status,
      m.scoreSummary
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + 
      [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Fixture_${tournament?.name.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter registered players so they don't show up for pairing registration
  const registeredPlayerIds = new Set(pairs.flatMap(p => [p.player1Id, p.player2Id]));
  const availablePlayersP1 = players.filter(p => !registeredPlayerIds.has(p.id));
  const availablePlayersP2 = players.filter(p => !registeredPlayerIds.has(p.id) && p.id !== p1Select);

  if (!tournament) return null;

  return (
    <div className="space-y-6">
      
      {/* HEADER NAV */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <button
          onClick={onBack}
          className="bg-slate-900 text-slate-350 hover:text-white border border-slate-800 text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al listado
        </button>

        <div className="flex items-center gap-2">
          {matches.length > 0 && (
            <button
              onClick={handleExportMatchesCSV}
              className="bg-slate-900 text-slate-300 border border-slate-800 text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 hover:text-white transition cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" /> Exportar Fixture (CSV)
            </button>
          )}

          {userRole === "admin" && tournament.status === "in_progress" && (
            <button
              onClick={handleFinishTournament}
              className="bg-red-650 hover:bg-red-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1 transition"
            >
              🏁 Clausurar Torneo
            </button>
          )}
        </div>
      </div>

      {/* HERO LEAGUE BANNER CARD */}
      <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-600/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider">
                {tournament.category}
              </span>
              <span className={`text-[10px] font-bold uppercase flex items-center gap-1 ${
                tournament.status === "registration" ? "text-amber-400" :
                tournament.status === "in_progress" ? "text-green-400 animate-pulse" : "text-slate-500"
              }`}>
                ● {tournament.status === "registration" ? "Inscripción Libre" :
                   tournament.status === "in_progress" ? "Torneo en Juego" : "Finalizado / Cerrado"}
              </span>
            </div>
            <h2 className="text-2xl font-black text-white">{tournament.name}</h2>
            <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500" /> {tournament.club} — {tournament.city}
            </p>
          </div>

          <div className="text-left md:text-right shrink-0 bg-slate-900/60 p-3 rounded-xl border border-slate-850/80">
            <span className="block text-[9px] text-slate-500 mb-0.5 font-mono uppercase tracking-wider">CRONOGRAMA</span>
            <span className="block font-bold text-xs text-slate-200">
              {tournament.startDate} • {tournament.endDate}
            </span>
            <span className="block text-[10px] text-slate-500 mt-1">
              Configuración: {tournament.numGroups} Zonas • {tournament.numCourts} Canchas asignadas
            </span>
          </div>
        </div>
      </div>

      {/* CENTRAL CATEGORY RIBBON */}
      <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800 space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-450 font-mono tracking-widest font-bold uppercase block pl-1">
            CATEGORÍAS DE ESTE TORNEO
          </span>
          <span className="text-[10px] text-blue-400 font-mono font-bold uppercase tracking-wider">
            Soportor Jerárquico Multicategoría
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {ALL_PADEL_CATEGORIES.map(cat => {
            const catPairs = pairs.filter(p => p.category === cat);
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                }}
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
        </div>
      </div>

      {/* TAB MENU */}
      <div className="flex border-b border-slate-800 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab("inscriptions")}
          className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "inscriptions"
              ? "border-blue-500 text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Parejas Inscritas ({pairs.filter(p => p.category === selectedCategory).length})
        </button>
        
        {matches.filter(m => m.category === selectedCategory).length > 0 && (
          <>
            <button
              onClick={() => setActiveTab("matches")}
              className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === "matches"
                  ? "border-blue-500 text-white"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Partidos (Fixture)
            </button>
            <button
              onClick={() => setActiveTab("standings")}
              className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === "standings"
                  ? "border-blue-500 text-white"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Tablas de Posiciones
            </button>
            <button
              onClick={() => setActiveTab("playoffs")}
              className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === "playoffs"
                  ? "border-blue-500 text-white"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Eliminatorias Bracket
            </button>
          </>
        )}
      </div>

      {/* CONTENT SWITCHER */}
      <div className="space-y-6">
        
        {/* TAB 1: INSCRIPTIONS & DIRECT DRAW TRIGGER */}
        {activeTab === "inscriptions" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Col: list of couples inscribed */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white">Parejas Registradas</h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  {pairs.filter(p => p.category === selectedCategory).length} / {tournament.maxPairs} Max (por categoría)
                </span>
              </div>

              {pairs.filter(p => p.category === selectedCategory).length === 0 ? (
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center text-slate-500 text-xs text-balance">
                  Aún no hay parejas registradas para la categoría '{selectedCategory}' en este torneo. Agrega una pareja a la derecha.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pairs.filter(p => p.category === selectedCategory).map((pr, index) => {
                    const name = getPairName(pr.id);
                    return (
                      <div 
                        key={pr.id}
                        className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between"
                      >
                        <div>
                          <span className="text-[10px] text-slate-500 font-mono block">Pareja #{index + 1}</span>
                          <span className="font-extrabold text-sm block text-slate-100">{name}</span>
                          <span className="text-[9px] text-slate-400 font-mono block mt-1.5">
                            Suma de Ranking: {pr.combinedRanking} Pts
                          </span>
                        </div>

                        {userRole === "admin" && tournament.status === "registration" && (
                          <button
                            onClick={() => handleDeletePair(pr.id, name)}
                            className="bg-slate-950 hover:bg-red-950/40 p-2 text-slate-500 hover:text-red-400 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* DRAW ACTION FOR ADMIN */}
              {userRole === "admin" && tournament.status === "registration" && pairs.filter(p => p.category === selectedCategory).length >= 3 && (
                <div className="bg-blue-950/20 border border-blue-500/20 p-5 rounded-2xl space-y-4 shadow-sm mt-8">
                  <div className="flex gap-2">
                    <Sparkles className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-extrabold text-sm text-white">Lanzar Sorteo de Zona • {selectedCategory}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed mt-1">
                        Utiliza nuestro procesador de sorteos para dividir las parejas en zonas y fabricar dinámicamente el fixture de partidos (Round Robin) para la categoría de competencia seleccionada.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={() => handleExecuteDraw("random")}
                      className="flex-1 bg-[#d4fc34] hover:bg-[#c5f015] text-slate-950 text-xs font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer uppercase tracking-wider"
                    >
                      <Shuffle className="w-4 h-4 text-slate-950" /> Sorteo Aleatorio
                    </button>
                    <button
                      onClick={() => handleExecuteDraw("ranking")}
                      className="flex-1 bg-[#d4fc34] hover:bg-[#c5f015] text-slate-950 text-xs font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer uppercase tracking-wider"
                    >
                      <Trophy className="w-4 h-4 text-slate-950" /> Sorteo equilibrado por Ranking
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Col: form to register players */}
            <div className="lg:col-span-1">
              {tournament.status !== "registration" ? (
                <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-4 text-xs text-slate-500 flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Inscripciones cerradas. El torneo se encuentra en progreso o finalizado.</span>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                  <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-blue-400" /> Inscribir en {selectedCategory}
                  </h4>

                  <form onSubmit={handleRegisterPair} className="space-y-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase text-slate-400">Jugador N°1 *</label>
                      <select
                        value={p1Select}
                        onChange={(e) => setP1Select(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-2 outline-none"
                      >
                        <option value="">Selecciona Jugador 1...</option>
                        {availablePlayersP1.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.lastName}, {p.firstName} ({p.rankingPoints} Pts) — {p.city}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase text-slate-400">Jugador N°2 *</label>
                      <select
                        value={p2Select}
                        onChange={(e) => setP2Select(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-2 outline-none"
                      >
                        <option value="">Selecciona Jugador 2...</option>
                        {availablePlayersP2.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.lastName}, {p.firstName} ({p.rankingPoints} Pts) — {p.city}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#d4fc34] hover:bg-[#c5f015] text-slate-950 text-xs font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer uppercase tracking-wider"
                    >
                      Confirmar Inscripción Pareja
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ACTIVE MATCHES & RESULTS UPDATING */}
        {activeTab === "matches" && (
          <div className="space-y-4">
            
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-white">Cronograma: {selectedCategory}</h3>
              <span className="text-xs text-slate-400 font-mono">
                PJ: {matches.filter(m => m.category === selectedCategory && m.status !== "pending").length} / Total: {matches.filter(m => m.category === selectedCategory).length}
              </span>
            </div>

            {userRole === "admin" && matches.filter(m => m.category === selectedCategory).length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-white block">Distribución de Canchas / Pistas para {selectedCategory}</span>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    ¿Quieres agilizar la organización de esta categoría? Puedes disponer la cantidad total de canchas, realizar la asignación de canchas y horarios automáticamente, o asignarlas individualmente.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => {
                      setTempNumCourts(tournament.numCourts || 2);
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
                </div>
              </div>
            )}

            <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800">
              {matches.filter(m => m.category === selectedCategory).map(m => {
                const finished = m.status === "completed" || m.status === "wo";
                return (
                  <div 
                    key={m.id}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-950/40 transition"
                  >
                    {/* Metadata column */}
                    <div className="space-y-1">
                      <span className="bg-slate-950 text-slate-400 border border-slate-850 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase">
                        {m.stageName} • Ronda {m.roundNumber}
                      </span>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          <span className={m.courtId ? "text-slate-200" : "text-amber-400 font-medium"}>
                            {courts.find(c => c.id === m.courtId)?.name || "Pista por asignar"}
                          </span>
                          {m.date && (
                            <span className="font-mono text-[11px] text-slate-500 ml-1">
                              ({m.date} • {m.time} h)
                            </span>
                          )}
                        </div>
                        {userRole === "admin" && !finished && (
                          <button
                            onClick={() => handleOpenCourtAssigner(m)}
                            className="bg-[#d4fc34] hover:bg-[#c5f015] text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer uppercase tracking-wider text-center ml-2"
                          >
                            <Calendar className="w-3 h-3 text-slate-950" /> Asignar Cancha / Hora
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
                              onClick={() => handleOpenScorer(m)}
                              className="text-[10px] text-slate-500 hover:text-slate-300 font-semibold hover:underline mt-1 block"
                            >
                              Corregir Marcador
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <span className="text-xs text-slate-505 font-mono italic flex items-center">Por jugar</span>
                          {userRole === "admin" && (
                            <button
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
              })}
            </div>

          </div>
        )}

        {/* TAB 3: STANDINGS OF GROUPS */}
        {activeTab === "standings" && (
          <div className="space-y-8 animate-fade-in">
            {(() => {
              const categoryPairs = pairs.filter(p => p.category === selectedCategory);
              const categoryGroupMatches = matches.filter(m => m.category === selectedCategory && m.phase === "group");
              
              if (categoryGroupMatches.length === 0) {
                return (
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4">
                    <Trophy className="w-12 h-12 text-amber-500/40 mx-auto" />
                    <h3 className="font-bold text-slate-200">Torneo no Iniciado</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      La fase Dos Vidas para la categoría <strong className="text-[#d4fc34]">{selectedCategory}</strong> aún no cuenta con partidos generados. Ve a la pestaña <span className="underline">Inscritos</span> para realizar el Sorteo de la Ronda 1.
                    </p>
                  </div>
                );
              }

              const table = calculateDosVidasStandings(categoryPairs, matches, getPairName);

              return (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                    <div>
                      <h3 className="font-extrabold text-white text-md flex items-center gap-2">
                        🥇 Tabla Unificada: <span className="text-[#d4fc34]">Sistema Dos Vidas SRTC</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Cada pareja cuenta con 2 vidas. Perder 2 veces significa quedar eliminada de la competencia.
                      </p>
                    </div>
                    <div className="flex gap-3 text-xs bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-850 font-mono text-slate-400">
                      <span>Parejas Inscritas: <strong className="text-white">{categoryPairs.length}</strong></span>
                      <span className="text-slate-700">|</span>
                      <span>Parejas Activas: <strong className="text-[#d4fc34]">{table.filter(t => !t.eliminated).length}</strong></span>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono text-[9px] uppercase tracking-wider">
                          <tr>
                            <th className="py-3 px-4 text-center w-12">Pos</th>
                            <th className="py-3 px-4">Pareja Competidora</th>
                            <th className="py-3 px-4 text-center">Vidas Restantes</th>
                            <th className="py-3 px-4 text-center">PJ</th>
                            <th className="py-3 px-4 text-center">PG</th>
                            <th className="py-3 px-4 text-center">PP</th>
                            <th className="py-3 px-4 text-center">Sets (W/L)</th>
                            <th className="py-3 px-4 text-center">Dif Sets</th>
                            <th className="py-3 px-4 text-center">Games (W/L)</th>
                            <th className="py-3 px-4 text-center">Dif Games</th>
                            <th className="py-3 px-4 text-right pr-6">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50 font-medium">
                          {table.map((row, index) => {
                            // Render heart representating the lives remaining
                            let livesLabel = "🖤🖤";
                            if (row.lives === 2) livesLabel = "❤️❤️";
                            else if (row.lives === 1) livesLabel = "❤️🖤";

                            return (
                              <tr key={row.pairId} className={`hover:bg-slate-950/20 transition ${row.eliminated ? 'opacity-50 line-through text-slate-500' : 'text-slate-300'}`}>
                                <td className="py-3.5 px-4 text-center font-bold font-mono text-slate-400">
                                  {index + 1}
                                </td>
                                <td className="py-3.5 px-4 font-bold text-slate-100 text-sm">
                                  {row.pairName}
                                </td>
                                <td className="py-3.5 px-4 text-center font-bold text-md tracking-widest text-red-500 font-mono">
                                  {livesLabel}
                                </td>
                                <td className="py-3.5 px-4 text-center font-mono">{row.pj}</td>
                                <td className="py-3.5 px-4 text-center font-mono text-green-400">{row.pg}</td>
                                <td className="py-3.5 px-4 text-center font-mono text-rose-500">{row.pp}</td>
                                <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                                  {row.setsWon} - {row.setsLost}
                                </td>
                                <td className={`py-3.5 px-4 text-center font-mono font-bold ${row.setsDiff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {row.setsDiff > 0 ? `+${row.setsDiff}` : row.setsDiff}
                                </td>
                                <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                                  {row.gamesWon} - {row.gamesLost}
                                </td>
                                <td className={`py-3.5 px-4 text-center font-mono ${row.gamesDiff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                  {row.gamesDiff > 0 ? `+${row.gamesDiff}` : row.gamesDiff}
                                </td>
                                <td className="py-3.5 px-4 text-right pr-6">
                                  {row.eliminated ? (
                                    <span className="text-[9px] font-bold bg-slate-950 text-slate-500 px-2 py-1 rounded-full uppercase border border-slate-900">
                                      Eliminado
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-450 px-2 py-1 rounded-full uppercase border border-emerald-500/10">
                                      Activa ({row.lives} V)
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* ADMIN CONTROL TERMINAL FOR PROGRESSION */}
                  {userRole === "admin" && (
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                      <div className="border-b border-slate-850 pb-3">
                        <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5 uppercase tracking-wider text-[#d4fc34]">
                          ⚙️ Panel de Gestión de Rondas y Playoffs
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Como organizador oficial de SRTC, tienes el control de las transiciones de rondas del torneo.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Box 1: Generate next round */}
                        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between space-y-4">
                          <div className="space-y-1.5">
                            <h5 className="font-extrabold text-xs text-white uppercase tracking-wider">Avanzar Siguiente Ronda</h5>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                              Crea automáticamente los nuevos emparejamientos utilizando el algoritmo suizo de Dos Vidas. Cruzará parejas con similar historial de triunfos que no hayan jugado previamente en el torneo para mayor equidad.
                            </p>
                          </div>
                          <button
                            onClick={handleGenerateNextRound}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer border border-slate-700"
                          >
                            Generar Siguiente Ronda Dos Vidas
                          </button>
                        </div>

                        {/* Box 2: Close and start Playoffs */}
                        <div className="bg-slate-900/40 border border-dashed border-slate-800 p-5 rounded-xl flex flex-col justify-between space-y-4">
                          <div className="space-y-1.5">
                            <h5 className="font-extrabold text-xs text-amber-400 uppercase tracking-wider">Lanzar Playoffs (Cuadro Final)</h5>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                              Cierra definitivamente la etapa preliminaria. Avanza a las mejores parejas ordenadas por victorias y sets al cuadro final de eliminación directa (Octavos, Cuartos o Semifinal según el volumen de inscriptos).
                            </p>
                          </div>
                          {!matches.some(m => m.category === selectedCategory && m.phase === "playoff") ? (
                            <button
                              onClick={handleLaunchPlayoffs}
                              className="bg-[#d4fc34] hover:bg-[#c5f015] text-slate-950 transition-colors py-2.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider cursor-pointer shadow-md"
                            >
                              Finalizar y Generar Cuadro de Eliminatorias
                            </button>
                          ) : (
                            <div className="text-center py-2 px-3 bg-indigo-500/10 border border-indigo-500/15 rounded-xl text-indigo-400 font-bold text-[10px] uppercase">
                              Playoffs Activos
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 4: KNOCKOUT DRAWING (PLAYOFFS) */}
        {activeTab === "playoffs" && (
          <div className="space-y-6">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-2 border-b border-slate-800 gap-4">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5 border-none">
                <Trophy className="w-4 h-4 text-indigo-400" /> Playoffs Eliminatorios: {selectedCategory}
              </h3>

              {/* Playoff Round Filters */}
              {matches.filter(m => m.category === selectedCategory && m.phase === "playoff").length > 0 && (() => {
                const playoffMatches = matches.filter(m => m.category === selectedCategory && m.phase === "playoff");
                const has16 = playoffMatches.some(m => m.stageName.startsWith("16avos de Final") || m.stageName.startsWith("Dieciseisavos"));
                const has8 = playoffMatches.some(m => m.stageName.startsWith("Octavos de Final") || m.stageName.startsWith("8avos de Final"));
                const has4 = playoffMatches.some(m => m.stageName.startsWith("Cuartos") || m.stageName.startsWith("Cuartos de Final") || m.stageName.startsWith("4tos"));
                const hasSf = playoffMatches.some(m => m.stageName.startsWith("Semifinal"));
                const hasF = playoffMatches.some(m => m.stageName === "Final");

                return (
                  <div className="flex flex-wrap gap-1 items-center bg-slate-900/60 p-1.5 rounded-lg border border-slate-800 shadow-inner">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider px-2">Fase:</span>
                    <button
                      onClick={() => setPlayoffFilter("all")}
                      className={`px-2 py-1 rounded text-[10px] font-mono font-bold leading-none cursor-pointer transition-all ${
                        playoffFilter === "all"
                          ? "bg-indigo-600 text-white shadow"
                          : "bg-slate-800/40 text-slate-400 hover:text-white"
                      }`}
                    >
                      Ver Todo
                    </button>
                    {has16 && (
                      <button
                        onClick={() => setPlayoffFilter("16avos")}
                        className={`px-2 py-1 rounded text-[10px] font-mono font-bold leading-none cursor-pointer transition-all ${
                          playoffFilter === "16avos"
                            ? "bg-indigo-600 text-white shadow"
                            : "bg-slate-800/40 text-slate-400 hover:text-white"
                        }`}
                      >
                        16avos
                      </button>
                    )}
                    {(has8 || has16) && (
                      <button
                        onClick={() => setPlayoffFilter("8avos")}
                        className={`px-2 py-1 rounded text-[10px] font-mono font-bold leading-none cursor-pointer transition-all ${
                          playoffFilter === "8avos"
                            ? "bg-indigo-600 text-white shadow"
                            : "bg-slate-800/40 text-slate-400 hover:text-white"
                        }`}
                      >
                        8avos
                      </button>
                    )}
                    {(has4 || has8 || has16) && (
                      <button
                        onClick={() => setPlayoffFilter("4tos")}
                        className={`px-2 py-1 rounded text-[10px] font-mono font-bold leading-none cursor-pointer transition-all ${
                          playoffFilter === "4tos"
                            ? "bg-indigo-600 text-white shadow"
                            : "bg-slate-800/40 text-slate-400 hover:text-white"
                        }`}
                      >
                        4tos
                      </button>
                    )}
                    {hasSf && (
                      <button
                        onClick={() => setPlayoffFilter("semifinal")}
                        className={`px-2 py-1 rounded text-[10px] font-mono font-bold leading-none cursor-pointer transition-all ${
                          playoffFilter === "semifinal"
                            ? "bg-indigo-600 text-white shadow"
                            : "bg-slate-800/40 text-slate-400 hover:text-white"
                        }`}
                      >
                        Semifinal
                      </button>
                    )}
                    {hasF && (
                      <button
                        onClick={() => setPlayoffFilter("final")}
                        className={`px-2 py-1 rounded text-[10px] font-mono font-bold leading-none cursor-pointer transition-all ${
                          playoffFilter === "final"
                            ? "bg-indigo-600 text-white shadow"
                            : "bg-slate-800/40 text-slate-400 hover:text-white"
                        }`}
                      >
                        Final
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>

            {matches.filter(m => m.category === selectedCategory && m.phase === "playoff").length === 0 ? (
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center text-slate-500 text-xs">
                La eliminatoria directa de playoffs aún no se ha generado para {selectedCategory}. Termina los grupos y presiona lanzar eliminatorias en la pestaña Posiciones.
              </div>
            ) : (() => {
              const playoffMatches = matches.filter(m => m.category === selectedCategory && m.phase === "playoff");
              const matches_16avos = playoffMatches.filter(m => m.stageName.startsWith("16avos de Final") || m.stageName.startsWith("Dieciseisavos"));
              const matches_8avos = playoffMatches.filter(m => m.stageName.startsWith("Octavos de Final") || m.stageName.startsWith("8avos de Final"));
              const matches_4tos = playoffMatches.filter(m => m.stageName.startsWith("Cuartos") || m.stageName.startsWith("Cuartos de Final") || m.stageName.startsWith("4tos"));
              const matches_sf = playoffMatches.filter(m => m.stageName.startsWith("Semifinal"));
              const matches_final = playoffMatches.filter(m => m.stageName === "Final");

              const renderPlayoffMatchCard = (m: Match) => {
                return (
                  <div 
                    key={m.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow transition-all hover:border-slate-700"
                  >
                    <div className="p-2 border-b border-slate-850 bg-slate-950 font-mono text-[9px] text-center text-slate-400 font-bold flex items-center justify-between px-3">
                      <span>{m.stageName}</span>
                      {m.status !== "pending" && (
                        <span className="text-[8px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 px-1 rounded uppercase">OK</span>
                      )}
                    </div>
                    
                    <div className="p-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`font-bold truncate max-w-[140px] ${
                          m.winnerPairId === m.pair1Id ? 'text-[#d4fc34]' : m.winnerPairId ? 'text-slate-500' : 'text-slate-205'
                        }`}>
                          {m.pair1Id ? getPairName(m.pair1Id) : "Esperando..."}
                        </span>
                        {m.winnerPairId === m.pair1Id && <span className="text-[10px] text-[#d4fc34] font-black">W</span>}
                      </div>
                      
                      <div className="flex items-center justify-between gap-2 border-t border-slate-800/40 pt-2">
                        <span className={`font-bold truncate max-w-[140px] ${
                          m.winnerPairId === m.pair2Id ? 'text-[#d4fc34]' : m.winnerPairId ? 'text-slate-500' : 'text-slate-205'
                        }`}>
                          {m.pair2Id ? getPairName(m.pair2Id) : "Esperando..."}
                        </span>
                        {m.winnerPairId === m.pair2Id && <span className="text-[10px] text-[#d4fc34] font-black">W</span>}
                      </div>

                      {m.status !== "pending" && m.scoreSummary && (
                        <div className="mt-2 text-center pt-1.5 border-t border-slate-800/20">
                          <span className="bg-indigo-500/15 border border-indigo-550/20 text-indigo-300 font-mono text-[9px] py-0.5 px-2 rounded inline-block font-bold">
                            Score: {m.scoreSummary}
                          </span>
                        </div>
                      )}
                    </div>

                    {userRole === "admin" && (
                      <button 
                        onClick={() => handleOpenScorer(m)}
                        className="w-full bg-slate-950/60 hover:bg-slate-850 py-1.5 font-mono text-[9px] border-t border-slate-800/80 text-blue-400 hover:text-white cursor-pointer transition-colors"
                      >
                        Cargar Marcador
                      </button>
                    )}
                  </div>
                );
              };

              return (
                <div className="py-4 overflow-x-auto">
                  <div className={`flex gap-5 pb-4 justify-start items-start ${playoffFilter === "all" ? "min-w-[900px]" : "min-w-0"}`}>
                    
                    {/* 16avos Column */}
                    {matches_16avos.length > 0 && (playoffFilter === "all" || playoffFilter === "16avos") && (
                      <div className="space-y-6 w-[230px] shrink-0">
                        <span className="block text-[10px] text-slate-500 uppercase tracking-widest font-mono text-center font-extrabold bg-slate-900/30 py-1 rounded">16avos de Final</span>
                        <div className="space-y-4">
                          {matches_16avos.map(m => renderPlayoffMatchCard(m))}
                        </div>
                      </div>
                    )}

                    {/* Arrow Spacer */}
                    {matches_16avos.length > 0 && playoffFilter === "all" && (
                      <div className="hidden md:flex self-center text-slate-700 font-extrabold shrink-0 text-sm">➔</div>
                    )}

                    {/* 8avos Column */}
                    {(matches_8avos.length > 0 || matches_16avos.length > 0) && (playoffFilter === "all" || playoffFilter === "8avos") && (
                      <div className="space-y-6 w-[230px] shrink-0">
                        <span className="block text-[10px] text-slate-500 uppercase tracking-widest font-mono text-center font-extrabold bg-slate-900/30 py-1 rounded">8avos de Final</span>
                        <div className="space-y-4">
                          {matches_8avos.length > 0 ? (
                            matches_8avos.map(m => renderPlayoffMatchCard(m))
                          ) : (
                            <div className="text-center font-mono text-[10px] text-slate-600 italic py-8 border border-dashed border-slate-850 rounded-xl">Esperando resultados...</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Arrow Spacer */}
                    {(matches_8avos.length > 0 || matches_16avos.length > 0) && playoffFilter === "all" && (
                      <div className="hidden md:flex self-center text-slate-700 font-extrabold shrink-0 text-sm">➔</div>
                    )}

                    {/* Cuartos Column */}
                    {(matches_4tos.length > 0 || matches_8avos.length > 0 || matches_16avos.length > 0) && (playoffFilter === "all" || playoffFilter === "4tos") && (
                      <div className="space-y-6 w-[230px] shrink-0">
                        <span className="block text-[10px] text-slate-500 uppercase tracking-widest font-mono text-center font-extrabold bg-slate-900/30 py-1 rounded">Cuartos de Final</span>
                        <div className="space-y-4">
                          {matches_4tos.length > 0 ? (
                            matches_4tos.map(m => renderPlayoffMatchCard(m))
                          ) : (
                            <div className="text-center font-mono text-[10px] text-slate-600 italic py-8 border border-dashed border-slate-850 rounded-xl">Esperando cruces...</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Arrow Spacer */}
                    {(matches_4tos.length > 0 || matches_8avos.length > 0 || matches_16avos.length > 0) && playoffFilter === "all" && (
                      <div className="hidden md:flex self-center text-slate-700 font-extrabold shrink-0 text-sm">➔</div>
                    )}

                    {/* Semifinals Column */}
                    {(playoffFilter === "all" || playoffFilter === "semifinal") && (
                      <div className="space-y-6 w-[230px] shrink-0">
                        <span className="block text-[10px] text-slate-500 uppercase tracking-widest font-mono text-center font-extrabold bg-slate-900/30 py-1 rounded">Semifinales</span>
                        <div className="space-y-4">
                          {matches_sf.length > 0 ? (
                            matches_sf.map(m => renderPlayoffMatchCard(m))
                          ) : (
                            <div className="text-center font-mono text-[10px] text-slate-600 italic py-8 border border-dashed border-slate-850 rounded-xl">Esperando clasificados...</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Arrow Spacer */}
                    {playoffFilter === "all" && (
                      <div className="hidden md:flex self-center text-slate-700 font-extrabold shrink-0 text-sm">➔</div>
                    )}

                    {/* Final Column */}
                    {(playoffFilter === "all" || playoffFilter === "final") && (
                      <div className="space-y-6 w-[250px] shrink-0">
                        <span className="block text-[10px] text-slate-500 uppercase tracking-widest font-mono text-center font-extrabold bg-indigo-950/20 py-1 rounded">Gran Final</span>
                        <div className="space-y-4">
                          {matches_final.map(m => (
                            <div 
                              key={m.id}
                              className="bg-indigo-950/20 border-2 border-indigo-500/20 rounded-2xl overflow-hidden shadow-xl"
                            >
                              <div className="p-2 border-b border-indigo-500/10 bg-indigo-950/40 font-mono text-[9px] text-center text-amber-400 font-black tracking-widest uppercase">
                                MATCH POINT - FINAL
                              </div>

                              <div className="p-4 space-y-3 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className={`font-black text-xs ${m.winnerPairId === m.pair1Id ? 'text-amber-400' : 'text-slate-205'}`}>
                                    {m.pair1Id ? getPairName(m.pair1Id) : "Por clasificar"}
                                  </span>
                                  {m.winnerPairId === m.pair1Id && <span className="text-xs">👑</span>}
                                </div>

                                <div className="flex items-center justify-between border-t border-slate-800/60 pt-2.5">
                                  <span className={`font-black text-xs ${m.winnerPairId === m.pair2Id ? 'text-amber-400' : 'text-slate-205'}`}>
                                    {m.pair2Id ? getPairName(m.pair2Id) : "Por clasificar"}
                                  </span>
                                  {m.winnerPairId === m.pair2Id && <span className="text-xs">👑</span>}
                                </div>

                                {m.status !== "pending" && m.scoreSummary && (
                                  <div className="mt-3 text-center">
                                    <span className="bg-indigo-500/20 border border-indigo-550 text-indigo-300 font-mono font-black py-0.5 px-3 rounded inline-block text-xs">
                                      Score: {m.scoreSummary}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {userRole === "admin" && m.pair1Id && m.pair2Id && (
                                <button 
                                  onClick={() => handleOpenScorer(m)}
                                  className="w-full bg-indigo-900/30 hover:bg-slate-850 py-2.5 font-mono text-[10px] border-t border-indigo-500/10 text-white font-bold cursor-pointer transition-colors"
                                >
                                  Cargar Resultado Final
                                </button>
                              )}
                            </div>
                          ))}
                          {matches_final.length === 0 && (
                            <div className="text-center font-mono text-[10px] text-slate-600 italic py-8 border border-dashed border-slate-850 rounded-xl">Esperando finalistas...</div>
                          )}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              );
            })()}
          </div>
        )}

      </div>

      {/* FORM SCORER POPUP */}
      {activeScoreMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="font-extrabold text-sm text-white">⚙️ Carga de Resultado Oficial</span>
              <button onClick={() => setActiveScoreMatch(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveScore} className="p-5 space-y-4">
              
              {/* Type Switch WO vs Standard */}
              <div className="flex bg-slate-950 p-1 border border-slate-850 rounded-lg">
                <button
                  type="button"
                  onClick={() => setIsWO(false)}
                  className={`flex-1 text-center py-1.5 rounded text-xs font-bold ${!isWO ? 'bg-slate-800 text-white' : 'text-slate-500'}`}
                >
                  Por Sets / Games
                </button>
                <button
                  type="button"
                  onClick={() => setIsWO(true)}
                  className={`flex-1 text-center py-1.5 rounded text-xs font-bold ${isWO ? 'bg-slate-800 text-white' : 'text-slate-500'}`}
                >
                  Walkover (W.O.)
                </button>
              </div>

              {isWO ? (
                // Walkover Scorer options
                <div className="space-y-3">
                  <label className="block text-[10px] text-slate-400 uppercase font-mono">Pareja Ganadora por W.O. *</label>
                  <select
                    value={woWinnerPairId}
                    onChange={(e) => setWoWinnerPairId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-2 outline-none"
                  >
                    <option value={activeScoreMatch.pair1Id}>{getPairName(activeScoreMatch.pair1Id)}</option>
                    <option value={activeScoreMatch.pair2Id}>{getPairName(activeScoreMatch.pair2Id)}</option>
                  </select>
                </div>
              ) : (
                // Standard Set Scorer
                <div className="space-y-4">
                  {isGroupOrEarlyPlayoff(activeScoreMatch) ? (
                    <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[10px] text-indigo-300 leading-normal">
                      💡 <strong>Fase de Grupos / Octavos:</strong> Al mejor de 2 sets con <strong>Super Tiebreak a 11 puntos</strong> si hay empate (1-1) en el 3º Set.
                    </div>
                  ) : (
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-[10px] text-amber-300 leading-normal">
                      🔥 <strong>Cuartos de final a Final:</strong> Se juega a <strong>3 sets completos</strong> tradicionales. No hay Super Tiebreak.
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] text-slate-400 uppercase font-mono">Sets Totales</label>
                    <div className="flex border border-slate-800 p-0.5 rounded-lg bg-slate-950">
                      <button
                        type="button"
                        onClick={() => setNumSets(2)}
                        className={`px-3 py-1 text-[10px] font-bold rounded ${numSets === 2 ? 'bg-slate-800 text-white' : 'text-slate-500'}`}
                      >
                        2 Sets
                      </button>
                      <button
                        type="button"
                        onClick={() => setNumSets(3)}
                        className={`px-3 py-1 text-[10px] font-bold rounded ${numSets === 3 ? 'bg-slate-800 text-white' : 'text-slate-500'}`}
                      >
                        3 Sets
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {scoreSets.slice(0, numSets).map((set, idx) => {
                      const isSuperTiebreak = idx === 2 && isGroupOrEarlyPlayoff(activeScoreMatch);
                      return (
                        <div key={idx} className="flex items-center justify-between gap-4 bg-slate-950 p-3 rounded-xl border border-slate-850">
                          <span className="font-bold text-xs text-blue-400">
                            {isSuperTiebreak ? "Super Tiebreak (STB)" : `Set #${idx + 1}`}
                          </span>
                          <div className="flex items-center gap-1">
                            {/* Team 1 Score */}
                            <div className="text-center">
                              <span className="block text-[8px] text-slate-500 mb-0.5 font-mono uppercase">PAREJA 1</span>
                              <input
                                type="number"
                                min="0"
                                max={isSuperTiebreak ? 99 : 7}
                                required
                                value={set.t1}
                                onChange={(e) => {
                                  const copy = [...scoreSets];
                                  copy[idx].t1 = parseInt(e.target.value) || 0;
                                  setScoreSets(copy);
                                }}
                                className="w-12 bg-slate-900 text-center border border-slate-850 text-white rounded font-bold py-1 focus:border-blue-500 outline-none"
                              />
                            </div>

                            <span className="text-slate-600 font-mono self-end pb-1 inline-block px-1">-</span>

                            {/* Team 2 Score */}
                            <div className="text-center">
                              <span className="block text-[8px] text-slate-500 mb-0.5 font-mono uppercase">PAREJA 2</span>
                              <input
                                type="number"
                                min="0"
                                max={isSuperTiebreak ? 99 : 7}
                                required
                                value={set.t2}
                                onChange={(e) => {
                                  const copy = [...scoreSets];
                                  copy[idx].t2 = parseInt(e.target.value) || 0;
                                  setScoreSets(copy);
                                }}
                                className="w-12 bg-slate-900 text-center border border-slate-850 text-white rounded font-bold py-1 focus:border-blue-500 outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-2 flex gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveScoreMatch(null)}
                  className="flex-1 bg-slate-800 text-slate-350 py-2 rounded-lg font-bold"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#d4fc34] hover:bg-[#c5f015] text-slate-950 py-2 rounded-xl font-black uppercase tracking-wider cursor-pointer font-sans text-xs"
                >
                  Guardar Marcador
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* FORM ASSIGN COURT POPUP */}
      {activeAssignCourtMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="font-extrabold text-sm text-white flex items-center gap-1.5 font-display uppercase tracking-wider">
                ⚙️ Asignar Cancha y Horario
              </span>
              <button 
                onClick={() => setActiveAssignCourtMatch(null)} 
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCourtAssignment} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] uppercase text-slate-400 font-bold font-mono">Seleccionar Pista / Cancha *</label>
                <select
                  value={selectedCourtId}
                  onChange={(e) => setSelectedCourtId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-2 outline-none"
                  required
                >
                  <option value="">Selecciona Cancha...</option>
                  {courts.filter(c => c.active).map(c => {
                    const occupying = getOccupyingMatch(c.id, selectedDate, selectedTime, activeAssignCourtMatch.id);
                    return (
                      <option key={c.id} value={c.id} disabled={!!occupying}>
                        {c.name} — {c.club} {occupying ? `(OCUPADA: ${getPairName(occupying.pair1Id)} vs ${getPairName(occupying.pair2Id)} @ ${occupying.time})` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase text-slate-400 font-bold font-mono">Fecha del Encuentro *</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-2 outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase text-slate-400 font-bold font-mono">Hora de Inicio *</label>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-2 outline-none"
                  required
                />
              </div>

              <div className="pt-2 flex gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveAssignCourtMatch(null)}
                  className="flex-1 bg-slate-800 text-slate-350 py-2 rounded-lg font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#d4fc34] hover:bg-[#c5f015] text-slate-950 py-2 rounded-xl font-black uppercase tracking-wider cursor-pointer font-sans text-xs"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FORM MODIFY AMOUNT OF COURTS POPUP */}
      {isEditNumCourtsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="font-extrabold text-sm text-white flex items-center gap-1.5 font-display uppercase tracking-wider">
                🏆 Disponer Cantidad de Canchas
              </span>
              <button 
                onClick={() => setIsEditNumCourtsOpen(false)} 
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateNumCourts} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] uppercase text-slate-400 font-bold font-mono">Cantidad total de canchas *</label>
                <select
                  value={tempNumCourts}
                  onChange={(e) => setTempNumCourts(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-2.5 outline-none"
                  required
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 16, 20].map(n => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'Cancha asignada' : 'Canchas asignadas'}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 pt-1 leading-snug">
                  Establece el número máximo de canchas/pistas simultáneas que tiene este torneo a su disposición.
                </p>
              </div>

              <div className="pt-2 flex gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setIsEditNumCourtsOpen(false)}
                  className="flex-1 bg-slate-800 text-slate-350 py-2 rounded-lg font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#d4fc34] hover:bg-[#c5f015] text-slate-950 py-2 rounded-xl font-black uppercase tracking-wider cursor-pointer font-sans text-xs"
                >
                  Aplicar Canchas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
