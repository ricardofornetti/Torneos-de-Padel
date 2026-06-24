export type CategoryLevel =
  | "Primera"
  | "Segunda"
  | "Tercera"
  | "Cuarta"
  | "Quinta"
  | "Sexta"
  | "Séptima"
  | "Octava"
  | "A"
  | "B"
  | "C"
  | "D";

export type CategoryDivision = "Masculino" | "Femenino" | "Mixto";

export interface PadelCategory {
  division: CategoryDivision;
  level: CategoryLevel;
  fullName: string; // e.g. "Masculino - Tercera" or "Mixto - B"
}

export interface PlayerStats {
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  setsWon: number;
  setsLost: number;
  gamesWon: number;
  gamesLost: number;
}

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  city: string;
  category: string; // Full category name matching "Division - Level"
  rankingPoints: number;
  photoUrl: string;
  // Stats
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  setsWon: number;
  setsLost: number;
  gamesWon: number;
  gamesLost: number;
  // Optional private/additional fields
  dni?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  gender?: string;
}

export interface PlayerPrivateData {
  id: string; // matches Player id
  dni: string;
  email: string;
  phone: string;
  birthDate: string; // YYYY-MM-DD
}

export interface Tournament {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  club: string;
  city: string;
  category: string; // e.g. "Masculino - Tercera"
  tournamentType: string; // "Grupos + Eliminatorias"
  maxPairs: number;
  numGroups: number;
  numCourts: number;
  status: "registration" | "in_progress" | "completed";
}

export interface Pair {
  id: string;
  tournamentId: string;
  player1Id: string;
  player2Id: string;
  category: string; // Tournament category
  combinedRanking: number; // player1 points + player2 points
  status: "registered" | "waitlist" | "confirmed";
  name?: string;
}

export interface MatchScoreSet {
  t1: number;
  t2: number;
}

export interface Match {
  id: string;
  tournamentId: string;
  phase: "group" | "playoff";
  roundNumber: number; // e.g. 1, 2, 3
  stageName: string; // e.g. "Grupo A", "Cuartos 1", "Semifinal 2", "Final"
  pair1Id: string;
  pair2Id: string;
  courtId: string; // reference to Court
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: "pending" | "completed" | "wo" | "abandoned";
  category?: string; // e.g. "5ta Masculina"
  settledAt?: string; // Timestamp
  scoreSummary: string; // e.g., "6-4 6-3" or "W.O."
  winnerPairId: string; // ID of winner pair (pair1Id or pair2Id or empty if unplayed)
}

export interface Court {
  id: string;
  name: string;
  club: string;
  active: boolean;
}

export interface StandingsRow {
  pairId: string;
  pairName: string; // names of both players
  points: number; // Win = 3pts, Loss = 1pt, WO = 0pts
  pj: number; // played
  pg: number; // won
  pp: number; // lost
  setsWon: number;
  setsLost: number;
  gamesWon: number;
  gamesLost: number;
  setsDiff: number;
  gamesDiff: number;
  headToHeadResult?: { [opponentPairId: string]: "won" | "lost" };
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string; // ISO string
  type: "info" | "success" | "warning";
  read: boolean;
}

export interface GalleryMedia {
  id: string;
  tournamentId?: string;
  matchId?: string;
  url: string; // Blob or base64 or external url
  type: "photo" | "video";
  title?: string;
  caption?: string;
  createdAt: string;
}

