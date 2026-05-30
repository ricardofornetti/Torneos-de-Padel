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
  getPairNames: (id: string) => string
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
      // Walkover: winner takes all
      if (match.winnerPairId === match.pair1Id) {
        row1.pg += 1;
        row1.points += 3;
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
        row2.points += 3;
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
        row1.points += 3; // Win = 3 points
        row2.pp += 1;
        row2.points += 1; // Loss = 1 point

        row1.headToHeadResult[match.pair2Id] = "won";
        row2.headToHeadResult[match.pair1Id] = "lost";
      } else {
        row2.pg += 1;
        row2.points += 3;
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
      }
    );
  }
  else if (numTeams <= 8) {
    // Quarter-finals (4 groups: A, B, C, D)
    const findQ = (g: string, r: 1 | 2, fallbackIdx: number): string => {
      return qualified.find(q => q.sourceGroup === g && q.rank === r)?.pairId || qualified[fallbackIdx]?.pairId;
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
  }
  else {
    // Octavos (8 groups, scale up similarly or simple bracket based on sorted order)
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
    return isWinner ? 100 : 70;
  }
  if (stageReached.startsWith("Semifinal")) {
    return 50;
  }
  if (stageReached.startsWith("Cuartos")) {
    return 25;
  }
  return 10; // Default group stage points
}
