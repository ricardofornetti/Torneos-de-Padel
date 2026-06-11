import { Match, Pair, StandingsRow, Tournament, Player } from '../types';

/**
 * 1. DYNAMIC ROUND ROBIN GENERATION (Circle Method)
 */
export function generateRoundRobinMatches(
  pairIds: string[],
  tournamentId: string,
  stageName: string,
  baseDate: string = "2026-06-01"
): Match[] {
  const matches: Match[] = [];
  const teams = [...pairIds];
  
  if (teams.length < 2) return [];

  // If odd, add a dummy BYE team
  const isOdd = teams.length % 2 !== 0;
  if (isOdd) {
    teams.push("BYE");
  }

  const numTeams = teams.length;
  const numRounds = numTeams - 1;
  const matchesPerRound = numTeams / 2;

  // Clone list for rotation
  const list = [...teams];
  let matchCounter = 1;

  for (let round = 1; round <= numRounds; round++) {
    // Generate dates incrementing by 1 day per round for neatness
    const currentDate = new Date(baseDate);
    currentDate.setDate(currentDate.getDate() + (round - 1));
    const dateString = currentDate.toISOString().split("T")[0];

    for (let i = 0; i < matchesPerRound; i++) {
      const home = list[i];
      const away = list[numTeams - 1 - i];

      if (home !== "BYE" && away !== "BYE") {
        matches.push({
          id: `match_${tournamentId}_${stageName.replace(/[^a-zA-Z0-9]/g, "")}_r${round}_m${matchCounter++}`,
          tournamentId,
          phase: "group",
          roundNumber: round,
          stageName,
          pair1Id: home,
          pair2Id: away,
          courtId: "", // Assigned during court scheduling
          date: dateString,
          time: `${17 + (matchCounter % 3)}:00`, // neatly stagger times
          status: "pending",
          scoreSummary: "",
          winnerPairId: ""
        });
      }
    }

    // Rotate teams with the first team static
    const lastElement = list[numTeams - 1];
    for (let j = numTeams - 1; j > 1; j--) {
      list[j] = list[j - 1];
    }
    list[1] = lastElement;
  }

  return matches;
}

/**
 * Parses a standard padel score string to compute stats
 * e.g., "6-4 6-3" or "2-6 7-6 6-4"
 */
export function parseScoreSummary(score: string, pair1Id: string, pair2Id: string) {
  const result = {
    sets1: 0,
    sets2: 0,
    games1: 0,
    games2: 0,
    winnerId: ""
  };

  const normalized = score.trim().toUpperCase();
  if (normalized === "W.O." || normalized === "W.O" || normalized === "WALKOVER") {
    // Walkover: team 1 wins default 6-0 6-0
    result.sets1 = 2;
    result.sets2 = 0;
    result.games1 = 12;
    result.games2 = 0;
    result.winnerId = pair1Id;
    return result;
  }

  const setsArray = score.trim().split(/\s+/);
  for (const set of setsArray) {
    if (!set.includes("-")) continue;
    const [g1Str, g2Str] = set.split("-");
    const g1 = parseInt(g1Str, 10);
    const g2 = parseInt(g2Str, 10);
    if (isNaN(g1) || isNaN(g2)) continue;

    result.games1 += g1;
    result.games2 += g2;

    if (g1 > g2) {
      result.sets1 += 1;
    } else if (g2 > g1) {
      result.sets2 += 1;
    }
  }

  if (result.sets1 > result.sets2) {
    result.winnerId = pair1Id;
  } else if (result.sets2 > result.sets1) {
    result.winnerId = pair2Id;
  }

  return result;
}

/**
 * 2. STANDINGS CALCULATION (Round Robin Group Table)
 * Rule system: 
 * 1. Puntos (Ganado = 3, WO Ganado = 3, Perdido = 1, WO Perdido = 0)
 * 2. Partidos ganados (PG)
 * 3. Diferencia de sets (setsDiff)
 * 4. Diferencia de games (gamesDiff)
 * 5. Resultado entre sí (Head-to-head)
 * 6. Sorteo / ID
 */
export function calculateGroupStandings(
  pairs: Pair[],
  matches: Match[],
  getPairNames: (id: string) => string,
  isSRTC24: boolean = false
): StandingsRow[] {
  const standingsMap: { [pairId: string]: StandingsRow } = {};

  // Initialize standings for all pairs in this group
  pairs.forEach(pair => {
    standingsMap[pair.id] = {
      pairId: pair.id,
      pairName: getPairNames(pair.id),
      points: 0,
      pj: 0,
      pg: 0,
      pp: 0,
      setsWon: 0,
      setsLost: 0,
      gamesWon: 0,
      gamesLost: 0,
      setsDiff: 0,
      gamesDiff: 0,
      headToHeadResult: {}
    };
  });

  // Process completed matches
  matches.forEach(match => {
    const row1 = standingsMap[match.pair1Id];
    const row2 = standingsMap[match.pair2Id];

    if (!row1 || !row2) return; // Matches outside these pairs
    if (match.status === "pending") return;

    row1.pj += 1;
    row2.pj += 1;

    if (match.status === "wo") {
      // Walkover: winner takes all. Win = 2pts for SRTC24, otherwise 3pts. Loser = 0pts for WO
      if (match.winnerPairId === match.pair1Id) {
        row1.pg += 1;
        row1.points += isSRTC24 ? 2 : 3;
        row1.setsWon += 2;
        row1.gamesWon += 12;

        row2.pp += 1;
        row2.points += 0; // 0 points for WO
        row2.setsLost += 2;
        row2.gamesLost += 12;

        row1.headToHeadResult[match.pair2Id] = "won";
        row2.headToHeadResult[match.pair1Id] = "lost";
      } else {
        row2.pg += 1;
        row2.points += isSRTC24 ? 2 : 3;
        row2.setsWon += 2;
        row2.gamesWon += 12;

        row1.pp += 1;
        row1.points += 0;
        row1.setsLost += 2;
        row1.gamesLost += 12;

        row2.headToHeadResult[match.pair1Id] = "won";
        row1.headToHeadResult[match.pair2Id] = "lost";
      }
    } else {
      // Standard completed or abandoned
      const score = parseScoreSummary(match.scoreSummary, match.pair1Id, match.pair2Id);
      
      row1.setsWon += score.sets1;
      row1.setsLost += score.sets2;
      row1.gamesWon += score.games1;
      row1.gamesLost += score.games2;

      row2.setsWon += score.sets2;
      row2.setsLost += score.sets1;
      row2.gamesWon += score.games2;
      row2.gamesLost += score.games1;

      if (match.winnerPairId === match.pair1Id) {
        row1.pg += 1;
        row1.points += isSRTC24 ? 2 : 3; // Win (2 pts in SRTC24, 3 otherwise)
        row2.pp += 1;
        row2.points += 1; // Loss (1pt)

        row1.headToHeadResult[match.pair2Id] = "won";
        row2.headToHeadResult[match.pair1Id] = "lost";
      } else {
        row2.pg += 1;
        row2.points += isSRTC24 ? 2 : 3;
        row1.pp += 1;
        row1.points += 1;

        row2.headToHeadResult[match.pair1Id] = "won";
        row1.headToHeadResult[match.pair2Id] = "lost";
      }
    }
  });

  // Calculate diffs
  const standings = Object.values(standingsMap);
  standings.forEach(row => {
    row.setsDiff = row.setsWon - row.setsLost;
    row.gamesDiff = row.gamesWon - row.gamesLost;
  });

  // Sort according to tie-break laws
  standings.sort((a, b) => {
    // 1. Points
    if (b.points !== a.points) return b.points - a.points;
    // 2. Matches Won
    if (b.pg !== a.pg) return b.pg - a.pg;
    // 3. Set Diff
    if (b.setsDiff !== a.setsDiff) return b.setsDiff - a.setsDiff;
    // 4. Game Diff
    if (b.gamesDiff !== a.gamesDiff) return b.gamesDiff - a.gamesDiff;
    // 5. Head to head
    if (a.headToHeadResult[b.pairId]) {
      return a.headToHeadResult[b.pairId] === "won" ? -1 : 1;
    }
    // 6. Sorteo (use alphanumeric ID string comparison as deterministic backup)
    return a.pairId.localeCompare(b.pairId);
  });

  return standings;
}

/**
 * 3. PLAYOFF BRACKET GENERATION
 * Generates initial matches of playoffs based on number of qualified teams.
 * e.g., 2 groups -> Top 2 of each qualify = 4 teams (Semifinal)
 * e.g., 4 groups -> Top 2 of each qualify = 8 teams (Quarter-finals)
 * e.g., 8 groups -> 16 qualified teams (Octavos)
 *
 * Map design format:
 * Group winners are A1, B1, C1, D1
 * Group runners-ups are A2, B2, C2, D2
 * Pairups:
 * Semifinal 1: A1 vs B2
 * Semifinal 2: B1 vs A2
 * 
 * Quarter-finals:
 * Q1: A1 vs B2
 * Q2: C1 vs D2
 * Q3: B1 vs A2
 * Q4: D1 vs C2
 */
export interface QualifiedTeam {
  pairId: string;
  sourceGroup: string; // "Grupo A"
  rank: 1 | 2; // 1st or 2nd
}

export function generatePlayoffSchedules(
  qualified: QualifiedTeam[], // must be ordered neatly
  tournamentId: string
): Match[] {
  const matches: Match[] = [];
  const numTeams = qualified.length;

  if (numTeams === 2) {
    // Direct Final
    matches.push({
      id: `match_${tournamentId}_playoff_final`,
      tournamentId,
      phase: "playoff",
      roundNumber: 1,
      stageName: "Final",
      pair1Id: qualified[0].pairId,
      pair2Id: qualified[1].pairId,
      courtId: "",
      date: "",
      time: "",
      status: "pending",
      scoreSummary: "Por jugar",
      winnerPairId: ""
    });
  } 
  else if (numTeams === 4) {
    // Semifinals
    // Matchup: Group 1 1st vs Group 2 2nd, Group 2 1st vs Group 1 2nd
    const g1_1 = qualified.find(q => q.sourceGroup === "Grupo A" && q.rank === 1)?.pairId || qualified[0].pairId;
    const g2_2 = qualified.find(q => q.sourceGroup === "Grupo B" && q.rank === 2)?.pairId || qualified[3].pairId;
    const g2_1 = qualified.find(q => q.sourceGroup === "Grupo B" && q.rank === 1)?.pairId || qualified[2].pairId;
    const g1_2 = qualified.find(q => q.sourceGroup === "Grupo A" && q.rank === 2)?.pairId || qualified[1].pairId;

    matches.push(
      {
        id: `match_${tournamentId}_playoff_sf1`,
        tournamentId,
        phase: "playoff",
        roundNumber: 1,
        stageName: "Semifinal 1",
        pair1Id: g1_1,
        pair2Id: g2_2,
        courtId: "",
        date: "",
        time: "",
        status: "pending",
        scoreSummary: "Por jugar",
        winnerPairId: ""
      },
      {
        id: `match_${tournamentId}_playoff_sf2`,
        tournamentId,
        phase: "playoff",
        roundNumber: 1,
        stageName: "Semifinal 2",
        pair1Id: g2_1,
        pair2Id: g1_2,
        courtId: "",
        date: "",
        time: "",
        status: "pending",
        scoreSummary: "Por jugar",
        winnerPairId: ""
      },
      {
        id: `match_${tournamentId}_playoff_final`,
        tournamentId,
        phase: "playoff",
        roundNumber: 2,
        stageName: "Final",
        pair1Id: "",
        pair2Id: "",
        courtId: "",
        date: "",
        time: "",
        status: "pending",
        scoreSummary: "Por jugar",
        winnerPairId: ""
      }
    );
  }
  else if (numTeams <= 8) {
    // Quarter-finals (Cuartos de final)
    const hasGroupCD = qualified.some(q => q.sourceGroup === "Grupo C" || q.sourceGroup === "Grupo D");
    if (hasGroupCD) {
      const findQ = (g: string, r: number, fallbackIdx: number): string => {
        return qualified.find(q => q.sourceGroup === g && q.rank === r)?.pairId || qualified[fallbackIdx]?.pairId || "";
      };

      const pairs = [
        { p1: findQ("Grupo A", 1, 0), p2: findQ("Grupo B", 2, 7), name: "Cuartos 1" },
        { p1: findQ("Grupo C", 1, 2), p2: findQ("Grupo D", 2, 5), name: "Cuartos 2" },
        { p1: findQ("Grupo B", 1, 4), p2: findQ("Grupo A", 2, 3), name: "Cuartos 3" },
        { p1: findQ("Grupo D", 1, 6), p2: findQ("Grupo C", 2, 1), name: "Cuartos 4" }
      ];

      pairs.forEach((p, idx) => {
        matches.push({
          id: `match_${tournamentId}_playoff_q${idx+1}`,
          tournamentId,
          phase: "playoff",
          roundNumber: 1,
          stageName: p.name,
          pair1Id: p.p1 || "",
          pair2Id: p.p2 || "",
          courtId: "",
          date: "",
          time: "",
          status: "pending",
          scoreSummary: "Por jugar",
          winnerPairId: ""
        });
      });
    } else {
      // Simple crossover for A and B
      const findQB = (g: string, r: number): string => {
        return qualified.find(q => q.sourceGroup === g && q.rank === r)?.pairId || "";
      };
      
      const p1 = findQB("Grupo A", 1) || qualified[0]?.pairId || "";
      const p2 = findQB("Grupo B", 4) || qualified[7]?.pairId || "";
      
      const p3 = findQB("Grupo B", 1) || qualified[1]?.pairId || "";
      const p4 = findQB("Grupo A", 4) || qualified[6]?.pairId || "";

      const p5 = findQB("Grupo A", 2) || qualified[2]?.pairId || "";
      const p6 = findQB("Grupo B", 3) || qualified[5]?.pairId || "";

      const p7 = findQB("Grupo B", 2) || qualified[3]?.pairId || "";
      const p8 = findQB("Grupo A", 3) || qualified[4]?.pairId || "";

      const pairsB = [
        { p1, p2, name: "Cuartos 1" },
        { p1: p3, p2: p4, name: "Cuartos 2" },
        { p1: p5, p2: p6, name: "Cuartos 3" },
        { p1: p7, p2: p8, name: "Cuartos 4" }
      ];

      pairsB.forEach((p, idx) => {
        matches.push({
          id: `match_${tournamentId}_playoff_q${idx+1}`,
          tournamentId,
          phase: "playoff",
          roundNumber: 1,
          stageName: p.name,
          pair1Id: p.p1 || "",
          pair2Id: p.p2 || "",
          courtId: "",
          date: "",
          time: "",
          status: "pending",
          scoreSummary: "Por jugar",
          winnerPairId: ""
        });
      });
    }

    // Pre-generate subsequent Semifinals & Final
    matches.push(
      {
        id: `match_${tournamentId}_playoff_sf1`,
        tournamentId,
        phase: "playoff",
        roundNumber: 2,
        stageName: "Semifinal 1",
        pair1Id: "",
        pair2Id: "",
        courtId: "",
        date: "",
        time: "",
        status: "pending",
        scoreSummary: "Por jugar",
        winnerPairId: ""
      },
      {
        id: `match_${tournamentId}_playoff_sf2`,
        tournamentId,
        phase: "playoff",
        roundNumber: 2,
        stageName: "Semifinal 2",
        pair1Id: "",
        pair2Id: "",
        courtId: "",
        date: "",
        time: "",
        status: "pending",
        scoreSummary: "Por jugar",
        winnerPairId: ""
      },
      {
        id: `match_${tournamentId}_playoff_final`,
        tournamentId,
        phase: "playoff",
        roundNumber: 3,
        stageName: "Final",
        pair1Id: "",
        pair2Id: "",
        courtId: "",
        date: "",
        time: "",
        status: "pending",
        scoreSummary: "Por jugar",
        winnerPairId: ""
      }
    );
  }
  else if (numTeams <= 16) {
    // Octavos de Final (8avos - 8 matches)
    for (let i = 0; i < 8; i++) {
      matches.push({
        id: `match_${tournamentId}_playoff_oct_${i+1}`,
        tournamentId,
        phase: "playoff",
        roundNumber: 1,
        stageName: `Octavos de Final ${i+1}`,
        pair1Id: qualified[i]?.pairId || "",
        pair2Id: qualified[numTeams - 1 - i]?.pairId || "",
        courtId: "",
        date: "",
        time: "",
        status: "pending",
        scoreSummary: "Por jugar",
        winnerPairId: ""
      });
    }

    // Pre-generate subsequent Cuartos de Final (1 to 4)
    for (let i = 0; i < 4; i++) {
      matches.push({
        id: `match_${tournamentId}_playoff_q${i+1}`,
        tournamentId,
        phase: "playoff",
        roundNumber: 2,
        stageName: `Cuartos de Final ${i+1}`,
        pair1Id: "",
        pair2Id: "",
        courtId: "",
        date: "",
        time: "",
        status: "pending",
        scoreSummary: "Por jugar",
        winnerPairId: ""
      });
    }

    // Pre-generate subsequent Semifinals & Final
    matches.push(
      {
        id: `match_${tournamentId}_playoff_sf1`,
        tournamentId,
        phase: "playoff",
        roundNumber: 3,
        stageName: "Semifinal 1",
        pair1Id: "",
        pair2Id: "",
        courtId: "",
        date: "",
        time: "",
        status: "pending",
        scoreSummary: "Por jugar",
        winnerPairId: ""
      },
      {
        id: `match_${tournamentId}_playoff_sf2`,
        tournamentId,
        phase: "playoff",
        roundNumber: 3,
        stageName: "Semifinal 2",
        pair1Id: "",
        pair2Id: "",
        courtId: "",
        date: "",
        time: "",
        status: "pending",
        scoreSummary: "Por jugar",
        winnerPairId: ""
      },
      {
        id: `match_${tournamentId}_playoff_final`,
        tournamentId,
        phase: "playoff",
        roundNumber: 4,
        stageName: "Final",
        pair1Id: "",
        pair2Id: "",
        courtId: "",
        date: "",
        time: "",
        status: "pending",
        scoreSummary: "Por jugar",
        winnerPairId: ""
      }
    );
  }
  else {
    // 16avos de Final (Round of 32 - 16 matches)
    for (let i = 0; i < 16; i++) {
      matches.push({
        id: `match_${tournamentId}_playoff_16avos_${i+1}`,
        tournamentId,
        phase: "playoff",
        roundNumber: 1,
        stageName: `16avos de Final ${i+1}`,
        pair1Id: qualified[i]?.pairId || "",
        pair2Id: qualified[numTeams - 1 - i]?.pairId || "",
        courtId: "",
        date: "",
        time: "",
        status: "pending",
        scoreSummary: "Por jugar",
        winnerPairId: ""
      });
    }

    // Pre-generate subsequent Octavos de Final (1 to 8)
    for (let i = 0; i < 8; i++) {
      matches.push({
        id: `match_${tournamentId}_playoff_oct_${i+1}`,
        tournamentId,
        phase: "playoff",
        roundNumber: 2,
        stageName: `Octavos de Final ${i+1}`,
        pair1Id: "",
        pair2Id: "",
        courtId: "",
        date: "",
        time: "",
        status: "pending",
        scoreSummary: "Por jugar",
        winnerPairId: ""
      });
    }

    // Pre-generate subsequent Cuartos de Final (1 to 4)
    for (let i = 0; i < 4; i++) {
      matches.push({
        id: `match_${tournamentId}_playoff_q${i+1}`,
        tournamentId,
        phase: "playoff",
        roundNumber: 3,
        stageName: `Cuartos de Final ${i+1}`,
        pair1Id: "",
        pair2Id: "",
        courtId: "",
        date: "",
        time: "",
        status: "pending",
        scoreSummary: "Por jugar",
        winnerPairId: ""
      });
    }

    // Pre-generate subsequent Semifinals & Final
    matches.push(
      {
        id: `match_${tournamentId}_playoff_sf1`,
        tournamentId,
        phase: "playoff",
        roundNumber: 4,
        stageName: "Semifinal 1",
        pair1Id: "",
        pair2Id: "",
        courtId: "",
        date: "",
        time: "",
        status: "pending",
        scoreSummary: "Por jugar",
        winnerPairId: ""
      },
      {
        id: `match_${tournamentId}_playoff_sf2`,
        tournamentId,
        phase: "playoff",
        roundNumber: 4,
        stageName: "Semifinal 2",
        pair1Id: "",
        pair2Id: "",
        courtId: "",
        date: "",
        time: "",
        status: "pending",
        scoreSummary: "Por jugar",
        winnerPairId: ""
      },
      {
        id: `match_${tournamentId}_playoff_final`,
        tournamentId,
        phase: "playoff",
        roundNumber: 5,
        stageName: "Final",
        pair1Id: "",
        pair2Id: "",
        courtId: "",
        date: "",
        time: "",
        status: "pending",
        scoreSummary: "Por jugar",
        winnerPairId: ""
      }
    );
  }

  return matches;
}

/**
 * 4. ANNUAL RANKING POINTS ASSIGNATION
 * Championship level distributions:
 * Campeón = 100
 * Finalista = 70
 * Semifinalista = 50
 * Cuartos = 25
 */
export function calculateRankingPointsGained(stageReached: string, isWinner: boolean): number {
  if (stageReached === "Final") {
    return isWinner ? 100 : 75;
  }
  if (stageReached.startsWith("Semifinal")) {
    return 50;
  }
  if (stageReached.startsWith("Cuartos") || stageReached.startsWith("Cuartos de Final")) {
    return 25;
  }
  return 10; // Default group stage points
}

/**
 * 5. SISTEMA DOS VIDAS SRTC ENGINE
 */

export interface PairDosVidasStats {
  pairId: string;
  pairName: string;
  pj: number; // Partidos Jugados
  pg: number; // Victorias (incluye BYEs ganados)
  pp: number; // Derrotas
  setsWon: number;
  setsLost: number;
  gamesWon: number;
  gamesLost: number;
  setsDiff: number;
  gamesDiff: number;
  lives: number; // 2 - pp (mínimo 0)
  eliminated: boolean; // pp >= 2
  opponentsPlayed: string[]; // Historial de rivales para evitar repeticiones
  byesCount: number; // Cantidad de BYEs recibidos
}

/**
 * Computa la tabla unificada del Sistema Dos Vidas SRTC para una categoría.
 */
export function calculateDosVidasStandings(
  pairs: Pair[],
  matches: Match[],
  getPairName: (id: string) => string
): PairDosVidasStats[] {
  const statsMap: { [pairId: string]: PairDosVidasStats } = {};

  // Inicializar estadísticas para cada pareja inscrita en la categoría
  pairs.forEach(p => {
    statsMap[p.id] = {
      pairId: p.id,
      pairName: getPairName(p.id),
      pj: 0,
      pg: 0,
      pp: 0,
      setsWon: 0,
      setsLost: 0,
      gamesWon: 0,
      gamesLost: 0,
      setsDiff: 0,
      gamesDiff: 0,
      lives: 2,
      eliminated: false,
      opponentsPlayed: [],
      byesCount: 0
    };
  });

  // Filtrar partidos de fase preliminaria o fase Dos Vidas (phase === "group")
  const dvMatches = matches.filter(m => m.phase === "group" && m.status !== "pending");

  dvMatches.forEach(m => {
    const p1 = statsMap[m.pair1Id];
    const p2 = statsMap[m.pair2Id];

    // Caso de partido BYE (la pareja 2 es "BYE")
    if (m.pair2Id === "BYE" || m.scoreSummary === "BYE") {
      const activePair = p1 || p2;
      if (activePair) {
        activePair.pg += 1;
        activePair.byesCount += 1;
        // Los BYE no se computan como PJ de cancha ni suman sets/games
      }
      return;
    }

    if (!p1 || !p2) return;

    p1.pj += 1;
    p2.pj += 1;
    p1.opponentsPlayed.push(m.pair2Id);
    p2.opponentsPlayed.push(m.pair1Id);

    if (m.status === "wo") {
      if (m.winnerPairId === m.pair1Id) {
        p1.pg += 1;
        p1.setsWon += 2;
        p1.gamesWon += 12;

        p2.pp += 1;
        p2.setsLost += 2;
        p2.gamesLost += 12;
      } else {
        p2.pg += 1;
        p2.setsWon += 2;
        p2.gamesWon += 12;

        p1.pp += 1;
        p1.setsLost += 2;
        p1.gamesLost += 12;
      }
    } else {
      const score = parseScoreSummary(m.scoreSummary, m.pair1Id, m.pair2Id);

      p1.setsWon += score.sets1;
      p1.setsLost += score.sets2;
      p1.gamesWon += score.games1;
      p1.gamesLost += score.games2;

      p2.setsWon += score.sets2;
      p2.setsLost += score.sets1;
      p2.gamesWon += score.games2;
      p2.gamesLost += score.games1;

      if (m.winnerPairId === m.pair1Id) {
        p1.pg += 1;
        p2.pp += 1;
      } else if (m.winnerPairId === m.pair2Id) {
        p2.pg += 1;
        p1.pp += 1;
      }
    }
  });

  const statsList = Object.values(statsMap);
  statsList.forEach(s => {
    s.lives = Math.max(0, 2 - s.pp);
    s.eliminated = s.pp >= 2;
    s.setsDiff = s.setsWon - s.setsLost;
    s.gamesDiff = s.gamesWon - s.gamesLost;
  });

  // Strict SRTC rules: losers of Ronda 2 matches are immediately eliminated (0 lives remaining)
  const completedR2Matches = matches.filter(
    m => m.status !== "pending" && 
    (m.stageName.toLowerCase().includes("ronda 2") || m.id.includes("_r2_m"))
  );
  completedR2Matches.forEach(m => {
    const loserId = m.winnerPairId === m.pair1Id ? m.pair2Id : m.pair1Id;
    const loserStats = statsList.find(s => s.pairId === loserId);
    if (loserStats) {
      loserStats.lives = 0;
      loserStats.eliminated = true;
    }
  });

  // Criterios de ordenación:
  // 1. No eliminados primero (más vidas primero)
  // 2. Más victorias (PG desc)
  // 3. Diferencia de sets (desc)
  // 4. Diferencia de games (desc)
  // 5. Alfabético o ID determinista
  statsList.sort((a, b) => {
    if (a.eliminated !== b.eliminated) {
      return a.eliminated ? 1 : -1;
    }
    if (b.lives !== a.lives) {
      return b.lives - a.lives;
    }
    if (b.pg !== a.pg) {
      return b.pg - a.pg;
    }
    if (b.setsDiff !== a.setsDiff) {
      return b.setsDiff - a.setsDiff;
    }
    if (b.gamesDiff !== a.gamesDiff) {
      return b.gamesDiff - a.gamesDiff;
    }
    return a.pairId.localeCompare(b.pairId);
  });

  return statsList;
}

/**
 * Genera de forma automática los emparejamientos para la siguiente ronda del Sistema Dos Vidas SRTC.
 * Soporta de manera nativa BYEs automáticos si hay número impar, cruce alternado en Ronda 2 y prevención de repeticiones.
 */
export function generateNextDosVidasRound(
  pairs: Pair[],
  matches: Match[],
  tournamentId: string,
  category: string,
  baseDate: string = "2026-06-01"
): Match[] {
  // 1. Obtener la ronda máxima actual para esta categoría
  const categoryGroupMatches = matches.filter(m => m.category === category && m.phase === "group");
  const maxRound = categoryGroupMatches.reduce((max, m) => Math.max(max, m.roundNumber), 0);
  const nextRoundNumber = maxRound + 1;

  // Si hay partidos de la ronda anterior sin jugar, no se puede avanzar (esto se valida en el componente)
  const statsList = calculateDosVidasStandings(pairs, matches, () => "");
  
  // Parejas activas (menos de 2 derrotas)
  const activeStats = statsList.filter(s => !s.eliminated);
  if (activeStats.length < 2) return []; // El torneo concluyó o debe pasar a playoffs

  const newMatches: Match[] = [];
  const dateObj = new Date(baseDate || new Date().toISOString().split("T")[0]);
  dateObj.setDate(dateObj.getDate() + (nextRoundNumber - 1) * 2); // 2 días de separación de ronda
  const dateString = dateObj.toISOString().split("T")[0];

  // --- CASO 1: RONDA 1 ---
  if (nextRoundNumber === 1) {
    // Ordenar parejas por ranking combinado descendente para emparejamientos nivelados
    const sortedPairs = [...pairs].filter(p => p.category === category)
      .sort((a, b) => b.combinedRanking - a.combinedRanking);

    const pairList = [...sortedPairs];
    let matchCounter = 1;

    // Si es impar, dar BYE automático a la pareja con mayor ranking (primer preclasificado)
    if (pairList.length % 2 !== 0) {
      // El de mayor ranking obtiene el BYE y avanza con un triunfo automático
      const byePair = pairList.shift()!; // Saca el primero
      newMatches.push({
        id: `match_${tournamentId}_dv_${category.replace(/[^a-zA-Z0-9]/g, "")}_r${nextRoundNumber}_bye`,
        tournamentId,
        phase: "group",
        roundNumber: nextRoundNumber,
        stageName: `Ronda 1 - BYE`,
        pair1Id: byePair.id,
        pair2Id: "BYE",
        courtId: "BYE",
        date: dateString,
        time: "00:00",
        status: "completed",
        scoreSummary: "BYE",
        winnerPairId: byePair.id,
        category
      });
    }

    // Emparejar los restantes consecutivamente para tener partidos equiparados (ej. 1vs2, 3vs4...)
    for (let i = 0; i < pairList.length; i += 2) {
      const p1 = pairList[i];
      const p2 = pairList[i + 1];
      newMatches.push({
        id: `match_${tournamentId}_dv_${category.replace(/[^a-zA-Z0-9]/g, "")}_r${nextRoundNumber}_m${matchCounter}`,
        tournamentId,
        phase: "group",
        roundNumber: nextRoundNumber,
        stageName: `Ronda 1 - Grupo ${String.fromCharCode(65 + matchCounter - 1)}`,
        pair1Id: p1.id,
        pair2Id: p2.id,
        courtId: "",
        date: dateString,
        time: `${17 + (matchCounter % 3)}:00`,
        status: "pending",
        scoreSummary: "Por jugar",
        winnerPairId: "",
        category
      });
      matchCounter++;
    }

    return newMatches;
  }

  // --- CASO 2: RONDA 2 (Cruce ganador vs perdedor alternado) ---
  if (nextRoundNumber === 2) {
    // Buscamos los partidos de la Ronda 1 disputados
    const r1Matches = categoryGroupMatches.filter(m => m.roundNumber === 1 && m.pair2Id !== "BYE");
    // También buscamos si hubo un BYE en Ronda 1
    const r1ByeMatch = categoryGroupMatches.find(m => m.roundNumber === 1 && m.pair2Id === "BYE");

    const r1Winners = r1Matches.map(m => m.winnerPairId);
    const r1Losers = r1Matches.map(m => m.pair1Id === m.winnerPairId ? m.pair2Id : m.pair1Id);

    // Si hubo una pareja con BYE, es considerada "ganadora" (0 derrotas) en Ronda 2
    if (r1ByeMatch) {
      r1Winners.unshift(r1ByeMatch.pair1Id);
    }

    // La regla de Ronda 2 dice: Ganador A vs Perdedor B, Ganador B vs Perdedor A...
    // Vamos a cruzarlos.
    const pairedIds = new Set<string>();
    let matchCounter = 1;

    // Aseguramos una copia de los ganadores y perdedores para emparejar
    const winList = [...r1Winners];
    const losList = [...r1Losers];

    // Si son impares o asimétricos por el BYE, corremos el algoritmo general para resolverlo
    if (winList.length !== losList.length) {
      return runSwissMatchmaking(activeStats, tournamentId, nextRoundNumber, dateString, category);
    }

    // Hacemos el cruce Ganador[i] vs Perdedor[i + 1] y Ganador[i + 1] vs Perdedor[i]
    for (let i = 0; i < winList.length; i += 2) {
      // Si queda un único elemento al final por ser impar la cantidad de partidos
      if (i === winList.length - 1) {
        newMatches.push({
          id: `match_${tournamentId}_dv_${category.replace(/[^a-zA-Z0-9]/g, "")}_r${nextRoundNumber}_m${matchCounter}`,
          tournamentId,
          phase: "group",
          roundNumber: nextRoundNumber,
          stageName: `Ronda 2 - Grupo ${String.fromCharCode(65 + matchCounter - 1)}`,
          pair1Id: winList[i],
          pair2Id: losList[i],
          courtId: "",
          date: dateString,
          time: `${17 + (matchCounter % 3)}:00`,
          status: "pending",
          scoreSummary: "Por jugar",
          winnerPairId: "",
          category
        });
        break;
      }

      const w1 = winList[i];
      const w2 = winList[i + 1];
      const l1 = losList[i];
      const l2 = losList[i + 1];

      // G1 vs L2
      newMatches.push({
        id: `match_${tournamentId}_dv_${category.replace(/[^a-zA-Z0-9]/g, "")}_r${nextRoundNumber}_m${matchCounter}`,
        tournamentId,
        phase: "group",
        roundNumber: nextRoundNumber,
        stageName: `Ronda 2 - Grupo ${String.fromCharCode(65 + matchCounter - 1)}`,
        pair1Id: w1,
        pair2Id: l2,
        courtId: "",
        date: dateString,
        time: `${17 + (matchCounter % 3)}:00`,
        status: "pending",
        scoreSummary: "Por jugar",
        winnerPairId: "",
        category
      });
      matchCounter++;

      // G2 vs L1
      newMatches.push({
        id: `match_${tournamentId}_dv_${category.replace(/[^a-zA-Z0-9]/g, "")}_r${nextRoundNumber}_m${matchCounter + 1}`,
        tournamentId,
        phase: "group",
        roundNumber: nextRoundNumber,
        stageName: `Ronda 2 - Grupo ${String.fromCharCode(65 + matchCounter)}`,
        pair1Id: w2,
        pair2Id: l1,
        courtId: "",
        date: dateString,
        time: `${17 + ((matchCounter + 1) % 3)}:00`,
        status: "pending",
        scoreSummary: "Por jugar",
        winnerPairId: "",
        category
      });
      matchCounter += 2;
    }

    return newMatches;
  }

  // --- CASO 3: RONDA 3 EN ADELANTE (Matchmaking Suizo con Filtro de Repeticiones) ---
  return runSwissMatchmaking(activeStats, tournamentId, nextRoundNumber, dateString, category);
}

/**
 * Algoritmo suizo inteligente que empareja parejas activas con similar puntaje y récord,
 * evitando estrictamente cruces repetidos y manejando BYEs.
 */
function runSwissMatchmaking(
  activeStats: PairDosVidasStats[],
  tournamentId: string,
  round: number,
  dateString: string,
  category: string
): Match[] {
  const newMatches: Match[] = [];
  const list = [...activeStats];

  // 1. Manejo de BYE si el total de parejas activas es impar
  if (list.length % 2 !== 0) {
    // El BYE se le otorga a la pareja peor clasificada que NO haya recibido BYE anteriormente
    const candidateIdx = list.slice().reverse().findIndex(s => s.byesCount === 0);
    const byeIdx = candidateIdx !== -1 ? (list.length - 1 - candidateIdx) : (list.length - 1);
    const [byePair] = list.splice(byeIdx, 1);

    newMatches.push({
      id: `match_${tournamentId}_dv_${category.replace(/[^a-zA-Z0-9]/g, "")}_r${round}_bye`,
      tournamentId,
      phase: "group",
      roundNumber: round,
      stageName: `Ronda ${round} - BYE`,
      pair1Id: byePair.pairId,
      pair2Id: "BYE",
      courtId: "BYE",
      date: dateString,
      time: "00:00",
      status: "completed",
      scoreSummary: "BYE",
      winnerPairId: byePair.pairId,
      category
    });
  }

  // 2. Emparejar utilizando backtracking de emparejamientos
  const matchesPaired: [string, string][] = [];
  const pairedIds = new Set<string>();

  // Dividir en grupos según vidas restantes:
  // pool0: 2 vidas (0 derrotas)
  // pool1: 1 vida (1 derrota)
  const pool0 = list.filter(s => s.lives === 2);
  const pool1 = list.filter(s => s.lives === 1);

  const finalOrder = [...pool0, ...pool1];

  for (let i = 0; i < finalOrder.length; i++) {
    const p1 = finalOrder[i];
    if (pairedIds.has(p1.pairId)) continue;

    // Buscar un rival apto p2
    let p2Idx = -1;
    for (let j = i + 1; j < finalOrder.length; j++) {
      const candidate = finalOrder[j];
      if (pairedIds.has(candidate.pairId)) continue;

      // Verificar que no hayan jugado ya entre sí en este torneo
      const alreadyPlayed = p1.opponentsPlayed.includes(candidate.pairId);
      if (!alreadyPlayed) {
        p2Idx = j;
        break; // Candidato óptimo encontrado
      }
    }

    // Si todos los rivales disponibles ya jugaron contra p1, forzamos el emparejamiento con el primero libre
    if (p2Idx === -1) {
      p2Idx = finalOrder.findIndex((s, idx) => idx > i && !pairedIds.has(s.pairId));
    }

    if (p2Idx !== -1) {
      const p2 = finalOrder[p2Idx];
      matchesPaired.push([p1.pairId, p2.pairId]);
      pairedIds.add(p1.pairId);
      pairedIds.add(p2.pairId);
    }
  }

  // Escribir los partidos a retornar
  let matchCounter = 1;
  matchesPaired.forEach(([id1, id2]) => {
    newMatches.push({
      id: `match_${tournamentId}_dv_${category.replace(/[^a-zA-Z0-9]/g, "")}_r${round}_m${matchCounter}`,
      tournamentId,
      phase: "group",
      roundNumber: round,
      stageName: `Ronda ${round} - Grupo ${String.fromCharCode(65 + matchCounter - 1)}`,
      pair1Id: id1,
      pair2Id: id2,
      courtId: "",
      date: dateString,
      time: `${17 + (matchCounter % 3)}:00`,
      status: "pending",
      scoreSummary: "Por jugar",
      winnerPairId: "",
      category
    });
    matchCounter++;
  });

  return newMatches;
}

