import { db, auth, isRealFirebase } from './firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc,
  query,
  where
} from 'firebase/firestore';
import { Tournament, Player, Pair, Match, Court, AppNotification, GalleryMedia } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: any, operationType: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  const isPermissionError = 
    errMsg.toLowerCase().includes("permission") || 
    errMsg.toLowerCase().includes("unauthenticated") || 
    errMsg.toLowerCase().includes("insufficient") ||
    (error && error.code === "permission-denied");

  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  if (isPermissionError) {
    console.error('Firestore Error Captured: ', JSON.stringify(errInfo));
  } else {
    console.warn(`Firestore non-fatal issue (${errMsg}) at path: ${path}. Operating in Sandbox fallback.`);
  }
}

export function withTimeout<T>(promise: Promise<T>, ms: number = 5000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Timeout"));
    }, ms);
    promise.then(
      (res) => {
        clearTimeout(timer);
        resolve(res);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

// -----------------------------------------------------------------------------
// HIGH-FIDELITY PRELOADED DEMO DATA
// -----------------------------------------------------------------------------
const INITIAL_PLAYERS: Player[] = [];
const OLD_INITIAL_PLAYERS: any[] = [
  {
    id: "p1",
    firstName: "Arturo",
    lastName: "Coello",
    dni: "38927452A",
    phone: "+34 654 321 001",
    email: "arturo.coello@padelpro.com",
    city: "Valladolid",
    birthDate: "2002-03-08",
    category: "Masculino - Primera",
    rankingPoints: 1200,
    photoUrl: "https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&q=80&w=200",
    matchesPlayed: 42,
    matchesWon: 38,
    matchesLost: 4,
    setsWon: 76,
    setsLost: 12,
    gamesWon: 520,
    gamesLost: 310
  },
  {
    id: "p2",
    firstName: "Agustín",
    lastName: "Tapia",
    dni: "X9284712P",
    phone: "+34 654 321 002",
    email: "agustin.tapia@padelpro.com",
    city: "Catamarca",
    birthDate: "1999-07-24",
    category: "Masculino - Primera",
    rankingPoints: 1180,
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    matchesPlayed: 42,
    matchesWon: 38,
    matchesLost: 4,
    setsWon: 76,
    setsLost: 12,
    gamesWon: 512,
    gamesLost: 318
  },
  {
    id: "p3",
    firstName: "Alejandro",
    lastName: "Galán",
    dni: "41938472M",
    phone: "+34 654 321 003",
    email: "ale.galan@padelpro.com",
    city: "Madrid",
    birthDate: "1996-05-15",
    category: "Masculino - Primera",
    rankingPoints: 1120,
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    matchesPlayed: 45,
    matchesWon: 35,
    matchesLost: 10,
    setsWon: 72,
    setsLost: 24,
    gamesWon: 498,
    gamesLost: 370
  },
  {
    id: "p4",
    firstName: "Juan",
    lastName: "Lebrón",
    dni: "45129384B",
    phone: "+34 654 321 004",
    email: "juan.lebron@padelpro.com",
    city: "Puerto de Santa María",
    birthDate: "1995-01-30",
    category: "Masculino - Primera",
    rankingPoints: 1100,
    photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
    matchesPlayed: 45,
    matchesWon: 35,
    matchesLost: 10,
    setsWon: 72,
    setsLost: 24,
    gamesWon: 492,
    gamesLost: 376
  },
  {
    id: "p5",
    firstName: "Francisco",
    lastName: "Navarro",
    dni: "39482938N",
    phone: "+34 654 321 005",
    email: "paquito@padelpro.com",
    city: "Sevilla",
    birthDate: "1989-02-10",
    category: "Masculino - Primera",
    rankingPoints: 950,
    photoUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200",
    matchesPlayed: 38,
    matchesWon: 27,
    matchesLost: 11,
    setsWon: 58,
    setsLost: 29,
    gamesWon: 410,
    gamesLost: 350
  },
  {
    id: "p6",
    firstName: "Martín",
    lastName: "Di Nenno",
    dni: "D12938472",
    phone: "+34 654 321 006",
    email: "martin.dinenno@padelpro.com",
    city: "Ezeiza",
    birthDate: "1997-03-18",
    category: "Masculino - Primera",
    rankingPoints: 940,
    photoUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200",
    matchesPlayed: 38,
    matchesWon: 27,
    matchesLost: 11,
    setsWon: 58,
    setsLost: 29,
    gamesWon: 408,
    gamesLost: 352
  },
  {
    id: "p7",
    firstName: "Fernando",
    lastName: "Belasteguín",
    dni: "38129348F",
    phone: "+34 654 321 007",
    email: "bela@padelpro.com",
    city: "Pehuajó",
    birthDate: "1979-05-19",
    category: "Masculino - Primera",
    rankingPoints: 890,
    photoUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=200",
    matchesPlayed: 50,
    matchesWon: 38,
    matchesLost: 12,
    setsWon: 79,
    setsLost: 31,
    gamesWon: 540,
    gamesLost: 412
  },
  {
    id: "p8",
    firstName: "Carlos",
    lastName: "Daniel Gutiérrez",
    dni: "41928472S",
    phone: "+34 654 321 008",
    email: "sanyo@padelpro.com",
    city: "San Luis",
    birthDate: "1984-06-15",
    category: "Masculino - Primera",
    rankingPoints: 870,
    photoUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200",
    matchesPlayed: 50,
    matchesWon: 38,
    matchesLost: 12,
    setsWon: 79,
    setsLost: 31,
    gamesWon: 535,
    gamesLost: 417
  },
  {
    id: "p9",
    firstName: "Franco",
    lastName: "Stupaczuk",
    dni: "38491823H",
    phone: "+34 654 321 009",
    email: "franco.supa@padelpro.com",
    city: "Chaco",
    birthDate: "1996-03-25",
    category: "Masculino - Primera",
    rankingPoints: 920,
    photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200",
    matchesPlayed: 35,
    matchesWon: 25,
    matchesLost: 10,
    setsWon: 52,
    setsLost: 24,
    gamesWon: 390,
    gamesLost: 310
  },
  {
    id: "p10",
    firstName: "Federico",
    lastName: "Chingotto",
    dni: "39488392K",
    phone: "+34 654 321 010",
    email: "chingotto@padelpro.com",
    city: "Olavarría",
    birthDate: "1997-04-13",
    category: "Masculino - Primera",
    rankingPoints: 910,
    photoUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=200",
    matchesPlayed: 36,
    matchesWon: 26,
    matchesLost: 10,
    setsWon: 54,
    setsLost: 25,
    gamesWon: 400,
    gamesLost: 315
  },
  {
    id: "p11",
    firstName: "Miguel",
    lastName: "Yanguas",
    dni: "41938472Y",
    phone: "+34 654 321 011",
    email: "mike.yanguas@padelpro.com",
    city: "Málaga",
    birthDate: "2002-03-18",
    category: "Masculino - Primera",
    rankingPoints: 830,
    photoUrl: "https://images.unsplash.com/photo-1500048993953-d23a436266cf?auto=format&fit=crop&q=80&w=200",
    matchesPlayed: 30,
    matchesWon: 20,
    matchesLost: 10,
    setsWon: 44,
    setsLost: 23,
    gamesWon: 310,
    gamesLost: 260
  },
  {
    id: "p12",
    firstName: "Jerónimo",
    lastName: "González",
    dni: "45239102L",
    phone: "+34 654 321 012",
    email: "momo@padelpro.com",
    city: "Antequera",
    birthDate: "1997-02-21",
    category: "Masculino - Primera",
    rankingPoints: 810,
    photoUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200",
    matchesPlayed: 28,
    matchesWon: 18,
    matchesLost: 10,
    setsWon: 40,
    setsLost: 22,
    gamesWon: 290,
    gamesLost: 245
  },
  {
    id: "p13",
    firstName: "Jon",
    lastName: "Sanz",
    dni: "39482103S",
    phone: "+34 654 321 013",
    email: "jon.sanz@padelpro.com",
    city: "Pamplona",
    birthDate: "2000-09-25",
    category: "Masculino - Primera",
    rankingPoints: 800,
    photoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200",
    matchesPlayed: 32,
    matchesWon: 21,
    matchesLost: 11,
    setsWon: 45,
    setsLost: 26,
    gamesWon: 320,
    gamesLost: 285
  },
  {
    id: "p14",
    firstName: "Coki",
    lastName: "Nieto",
    dni: "41923847C",
    phone: "+34 654 321 014",
    email: "coki.nieto@padelpro.com",
    city: "Madrid",
    birthDate: "1998-12-18",
    category: "Masculino - Primera",
    rankingPoints: 790,
    photoUrl: "https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&q=80&w=200",
    matchesPlayed: 28,
    matchesWon: 16,
    matchesLost: 12,
    setsWon: 35,
    setsLost: 27,
    gamesWon: 280,
    gamesLost: 260
  },
  {
    id: "p15",
    firstName: "Javier",
    lastName: "Garrido",
    dni: "48392019J",
    phone: "+34 654 321 015",
    email: "javi.garrido@padelpro.com",
    city: "Córdoba",
    birthDate: "2000-10-26",
    category: "Masculino - Primera",
    rankingPoints: 780,
    photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
    matchesPlayed: 30,
    matchesWon: 17,
    matchesLost: 13,
    setsWon: 38,
    setsLost: 29,
    gamesWon: 295,
    gamesLost: 275
  },
  {
    id: "p16",
    firstName: "Eduardo",
    lastName: "Alonso",
    dni: "45391823E",
    phone: "+34 654 321 016",
    email: "edu.alonso@padelpro.com",
    city: "Valencia",
    birthDate: "2001-01-15",
    category: "Masculino - Primera",
    rankingPoints: 760,
    photoUrl: "https://images.unsplash.com/photo-1504257404764-b2b1d355ef4e?auto=format&fit=crop&q=80&w=200",
    matchesPlayed: 25,
    matchesWon: 13,
    matchesLost: 12,
    setsWon: 29,
    setsLost: 27,
    gamesWon: 240,
    gamesLost: 235
  }
];

const INITIAL_TOURNAMENTS: Tournament[] = [];
const OLD_INITIAL_TOURNAMENTS: any[] = [
  {
    id: "t_madrid_master",
    name: "Master Open Madrid 2026",
    startDate: "2026-06-05",
    endDate: "2026-06-12",
    club: "Club Cristal Padel Recoletos",
    city: "Madrid",
    category: "Masculino - Primera",
    tournamentType: "Grupos + Eliminatorias",
    maxPairs: 8,
    numGroups: 2,
    numCourts: 3,
    status: "in_progress"
  },
  {
    id: "t_sevilla_premier",
    name: "Copa Premier de Sevilla",
    startDate: "2026-07-20",
    endDate: "2026-07-27",
    club: "Sada Padel Club",
    city: "Sevilla",
    category: "Masculino - Primera",
    tournamentType: "Grupos + Eliminatorias",
    maxPairs: 4,
    numGroups: 1,
    numCourts: 2,
    status: "registration"
  },
  {
    id: "t_bcn_grand_slam",
    name: "Gran Slam Barcelona",
    startDate: "2026-04-10",
    endDate: "2026-04-17",
    club: "Real Club Polo Padel",
    city: "Barcelona",
    category: "Masculino - Primera",
    tournamentType: "Grupos + Eliminatorias",
    maxPairs: 4,
    numGroups: 1,
    numCourts: 2,
    status: "completed"
  }
];

const INITIAL_PAIRS: Pair[] = [];
const OLD_INITIAL_PAIRS: any[] = [
  // Madrid Master Pairs
  { id: "pair_t_madrid_p1_p2", tournamentId: "t_madrid_master", player1Id: "p1", player2Id: "p2", category: "Masculino - Primera", combinedRanking: 2380, status: "confirmed" },
  { id: "pair_t_madrid_p3_p4", tournamentId: "t_madrid_master", player1Id: "p3", player2Id: "p4", category: "Masculino - Primera", combinedRanking: 2220, status: "confirmed" },
  { id: "pair_t_madrid_p5_p6", tournamentId: "t_madrid_master", player1Id: "p5", player2Id: "p6", category: "Masculino - Primera", combinedRanking: 1890, status: "confirmed" },
  { id: "pair_t_madrid_p7_p8", tournamentId: "t_madrid_master", player1Id: "p7", player2Id: "p8", category: "Masculino - Primera", combinedRanking: 1760, status: "confirmed" },

  // Sevilla Pairs
  { id: "pair_t_sevilla_p1_p3", tournamentId: "t_sevilla_premier", player1Id: "p1", player2Id: "p3", category: "Masculino - Primera", combinedRanking: 2320, status: "registered" },
  { id: "pair_t_sevilla_p5_p7", tournamentId: "t_sevilla_premier", player1Id: "p5", player2Id: "p7", category: "Masculino - Primera", combinedRanking: 1840, status: "registered" }
];

const INITIAL_COURTS: Court[] = [];
const OLD_INITIAL_COURTS: any[] = [
  { id: "court_1", name: "Pista 1 - Central Cristal", club: "Club Cristal Padel Recoletos", active: true },
  { id: "court_2", name: "Pista 2 - Panorámica Negra", club: "Club Cristal Padel Recoletos", active: true },
  { id: "court_3", name: "Pista 3 - Techada Lateral", club: "Club Cristal Padel Recoletos", active: true },
  { id: "court_4", name: "Pista Central Sevilla", club: "Sada Padel Club", active: true },
  { id: "court_5", name: "Pista Central Polo", club: "Real Club Polo Padel", active: true }
];

const INITIAL_MATCHES: Match[] = [];
const OLD_INITIAL_MATCHES: any[] = [
  {
    id: "m_madrid_g_1",
    tournamentId: "t_madrid_master",
    phase: "group",
    roundNumber: 1,
    stageName: "Grupo A",
    pair1Id: "pair_t_madrid_p1_p2", // Coello-Tapia
    pair2Id: "pair_t_madrid_p7_p8", // Bela-Sanyo
    courtId: "court_1",
    date: "2026-06-05",
    time: "18:00",
    status: "completed",
    scoreSummary: "6-3 6-4",
    winnerPairId: "pair_t_madrid_p1_p2"
  },
  {
    id: "m_madrid_g_2",
    tournamentId: "t_madrid_master",
    phase: "group",
    roundNumber: 1,
    stageName: "Grupo A",
    pair1Id: "pair_t_madrid_p3_p4", // Galan-Lebron
    pair2Id: "pair_t_madrid_p5_p6", // Paquito-Dinenno
    courtId: "court_2",
    date: "2026-06-05",
    time: "19:30",
    status: "pending",
    scoreSummary: "",
    winnerPairId: ""
  },
  {
    id: "m_madrid_g_3",
    tournamentId: "t_madrid_master",
    phase: "group",
    roundNumber: 2,
    stageName: "Grupo A",
    pair1Id: "pair_t_madrid_p1_p2",
    pair2Id: "pair_t_madrid_p5_p6",
    courtId: "court_1",
    date: "2026-06-07",
    time: "18:00",
    status: "pending",
    scoreSummary: "",
    winnerPairId: ""
  },
  {
    id: "m_madrid_g_4",
    tournamentId: "t_madrid_master",
    phase: "group",
    roundNumber: 2,
    stageName: "Grupo A",
    pair1Id: "pair_t_madrid_p3_p4",
    pair2Id: "pair_t_madrid_p7_p8",
    courtId: "court_2",
    date: "2026-06-07",
    time: "19:30",
    status: "pending",
    scoreSummary: "",
    winnerPairId: ""
  }
];

const INITIAL_NOTIFICATIONS: AppNotification[] = [];
const OLD_INITIAL_NOTIFICATIONS: any[] = [
  {
    id: "n1",
    title: "Torneo Lanzado",
    body: "¡Inscripciones abiertas para la Copa Premier de Sevilla!",
    timestamp: "2026-05-30T10:00:00Z",
    type: "info",
    read: false
  },
  {
    id: "n2",
    title: "Resultado Cargado",
    body: "Coello/Tapia ganaron su primer partido de zona contra Belasteguín/Sanyo por 6-3 6-4.",
    timestamp: "2026-05-30T12:30:00Z",
    type: "success",
    read: false
  }
];

const INITIAL_MEDIA: GalleryMedia[] = [];
const OLD_INITIAL_MEDIA: any[] = [
  {
    id: "m1",
    tournamentId: "t_madrid_master",
    matchId: "m_madrid_g_1",
    url: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=600",
    type: "photo",
    title: "Espectacular bandeja de Coello",
    caption: "Punto decisivo en la final del torneo en Madrid.",
    createdAt: "2026-06-05T18:30:00Z"
  },
  {
    id: "m2",
    tournamentId: "t_madrid_master",
    matchId: "m_madrid_g_1",
    url: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&q=80&w=600",
    type: "photo",
    title: "Saludo post-partido de Tapia",
    caption: "Deportividad absoluta en la pista central de padel.",
    createdAt: "2026-06-05T19:10:00Z"
  }
];

// Helper to secure storage keys
const STORAGE_PREFIX = "padel_mgr_";

function getLocal<T>(key: string, initial: T): T {
  const data = localStorage.getItem(STORAGE_PREFIX + key);
  return data ? JSON.parse(data) : initial;
}

function setLocal<T>(key: string, val: T): void {
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(val));
}

// -----------------------------------------------------------------------------
// REPOSITORY CLASS IMPLEMENTING CLEAN ACCESS
// -----------------------------------------------------------------------------
class PadelRepository {
  private cache: {
    tournaments: Tournament[];
    players: Player[];
    pairs: Pair[];
    matches: Match[];
    courts: Court[];
    notifications: AppNotification[];
    galleryMedia: GalleryMedia[];
  };

  constructor() {
    this.cache = {
      tournaments: getLocal("tournaments", INITIAL_TOURNAMENTS),
      players: getLocal("players", INITIAL_PLAYERS),
      pairs: getLocal("pairs", INITIAL_PAIRS),
      matches: getLocal("matches", INITIAL_MATCHES),
      courts: getLocal("courts", INITIAL_COURTS),
      notifications: getLocal("notifications", INITIAL_NOTIFICATIONS),
      galleryMedia: getLocal("galleryMedia", INITIAL_MEDIA),
    };

    // Clean up mock data of previous sessions from local storage cache
    const mockTournamentIds = ["t_madrid_master", "t_sevilla_premier", "t_bcn_grand_slam"];
    const mockPlayerIds = new Set(Array.from({ length: 20 }, (_, i) => `p${i + 1}`));
    const mockCourtIds = ["court_1", "court_2", "court_3", "court_4", "court_5"];
    const mockNotificationIds = ["n1", "n2"];
    const mockMediaIds = ["m1", "m2"];

    this.cache.tournaments = this.cache.tournaments.filter(t => !mockTournamentIds.includes(t.id));
    this.cache.players = this.cache.players.filter(p => !mockPlayerIds.has(p.id));
    this.cache.courts = this.cache.courts.filter(c => !mockCourtIds.includes(c.id));
    this.cache.notifications = this.cache.notifications.filter(n => !mockNotificationIds.includes(n.id));
    this.cache.galleryMedia = this.cache.galleryMedia.filter(m => !mockMediaIds.includes(m.id));
    
    this.cache.pairs = this.cache.pairs.filter(p => !mockTournamentIds.includes(p.tournamentId) && !mockPlayerIds.has(p.player1Id) && !mockPlayerIds.has(p.player2Id));
    this.cache.matches = this.cache.matches.filter(m => !mockTournamentIds.includes(m.tournamentId));

    // Keep LocalStorage populated/snyced
    this.saveAllToStorage();

    // Bootstrap Firestore async if real Firebase is available
    if (isRealFirebase) {
      this.bootstrapFirebaseIfNeeded();
    }
  }

  async bootstrapFirebaseIfNeeded() {
    try {
      const metaRef = doc(db, "metadata", "bootstrap");
      const metaSnap = await withTimeout(getDoc(metaRef), 5000).catch(() => null);
      if (!metaSnap || !metaSnap.exists()) {
        console.log("Seeding Firestore with initial Padel Master data...");
        await setDoc(metaRef, { seeded: true, seededAt: new Date().toISOString() }).catch(() => {});
        
        for (const t of INITIAL_TOURNAMENTS) {
          setDoc(doc(db, "tournaments", t.id), t).catch(() => {});
        }
        for (const p of INITIAL_PLAYERS) {
          setDoc(doc(db, "players", p.id), p).catch(() => {});
        }
        for (const pr of INITIAL_PAIRS) {
          setDoc(doc(db, "pairs", pr.id), pr).catch(() => {});
        }
        for (const m of INITIAL_MATCHES) {
          setDoc(doc(db, "matches", m.id), m).catch(() => {});
        }
        for (const c of INITIAL_COURTS) {
          setDoc(doc(db, "courts", c.id), c).catch(() => {});
        }
        for (const n of INITIAL_NOTIFICATIONS) {
          setDoc(doc(db, "notifications", n.id), n).catch(() => {});
        }
        for (const g of INITIAL_MEDIA) {
          setDoc(doc(db, "galleryMedia", g.id), g).catch(() => {});
        }
        console.log("Firestore successfully seeded in background!");
      }
    } catch (err) {
      console.warn("Bootstrap Firestore was skipped or failed. This is expected if unauthenticated or offline:", err);
    }
  }

  private saveAllToStorage() {
    setLocal("tournaments", this.cache.tournaments);
    setLocal("players", this.cache.players);
    setLocal("pairs", this.cache.pairs);
    setLocal("matches", this.cache.matches);
    setLocal("courts", this.cache.courts);
    setLocal("notifications", this.cache.notifications);
    setLocal("galleryMedia", this.cache.galleryMedia);
  }

  // TOURNAMENTS
  async getTournaments(): Promise<Tournament[]> {
    if (isRealFirebase) {
      try {
        const snap = await withTimeout(getDocs(collection(db, "tournaments")), 5000);
        const list: Tournament[] = [];
        const mockTournamentIds = ["t_madrid_master", "t_sevilla_premier", "t_bcn_grand_slam"];
        snap.forEach(docSnap => {
          const t = docSnap.data() as Tournament;
          if (!mockTournamentIds.includes(t.id)) {
            list.push(t);
          }
        });
        return list;
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, "tournaments");
        return this.cache.tournaments;
      }
    }
    return this.cache.tournaments;
  }

  async saveTournament(t: Tournament): Promise<void> {
    const idx = this.cache.tournaments.findIndex(item => item.id === t.id);
    if (idx >= 0) {
      this.cache.tournaments[idx] = t;
    } else {
      this.cache.tournaments.push(t);
    }
    this.saveAllToStorage();

    if (isRealFirebase) {
      const docRef = doc(db, "tournaments", t.id);
      setDoc(docRef, t).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `tournaments/${t.id}`);
        this.addNotification(
          "Guardado en Sandbox Local",
          "El torneo '" + t.name + "' se guardó en el navegador. Vincula tu cuenta de Google organizador para sincronizar en la nube.",
          "warning"
        );
      });
    }
  }

  async deleteTournament(id: string): Promise<void> {
    this.cache.tournaments = this.cache.tournaments.filter(item => item.id !== id);
    this.cache.matches = this.cache.matches.filter(item => item.tournamentId !== id);
    this.cache.pairs = this.cache.pairs.filter(item => item.tournamentId !== id);
    this.saveAllToStorage();

    if (isRealFirebase) {
      deleteDoc(doc(db, "tournaments", id)).catch((err) => {
        handleFirestoreError(err, OperationType.DELETE, `tournaments/${id}`);
        this.addNotification(
          "Eliminado en Sandbox Local",
          "Torneo removido localmente del navegador. Sincronización cloud limitada sin login.",
          "warning"
        );
      });
    }
  }

  // PLAYERS
  async getPlayers(): Promise<Player[]> {
    if (isRealFirebase) {
      try {
        const snap = await withTimeout(getDocs(collection(db, "players")), 5000);
        const list: Player[] = [];
        const mockPlayerIds = new Set(Array.from({ length: 20 }, (_, i) => `p${i + 1}`));
        snap.forEach(docSnap => {
          const p = docSnap.data() as Player;
          if (!mockPlayerIds.has(p.id)) {
            list.push(p);
          }
        });
        return list;
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, "players");
        return this.cache.players;
      }
    }
    return this.cache.players;
  }

  async savePlayer(p: Player): Promise<void> {
    const idx = this.cache.players.findIndex(item => item.id === p.id);
    if (idx >= 0) {
      this.cache.players[idx] = p;
    } else {
      this.cache.players.push(p);
    }
    this.saveAllToStorage();

    if (isRealFirebase) {
      try {
        await setDoc(doc(db, "players", p.id), p);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `players/${p.id}`);
        this.addNotification(
          "Guardado en Sandbox Local",
          "Jugador '" + p.firstName + " " + p.lastName + "' guardado en el navegador. Requiere permisos de administrador para sincronizar online.",
          "warning"
        );
      }
    }
  }

  async deletePlayer(id: string): Promise<void> {
    this.cache.players = this.cache.players.filter(item => item.id !== id);
    this.saveAllToStorage();

    if (isRealFirebase) {
      deleteDoc(doc(db, "players", id)).catch((err) => {
        handleFirestoreError(err, OperationType.DELETE, `players/${id}`);
        this.addNotification(
          "Eliminado en Sandbox Local",
          "Jugador removido del navegador en modo offline/sandbox.",
          "warning"
        );
      });
    }
  }

  async addDemoPlayersBatch(): Promise<void> {
    const defaultDemos = [
      { id: "p9", firstName: "Franco", lastName: "Stupaczuk", dni: "38491823H", phone: "+34 654 321 009", email: "franco.supa@padelpro.com", city: "Chaco", birthDate: "1996-03-25", category: "Masculino - Primera", rankingPoints: 920, photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200", matchesPlayed: 35, matchesWon: 25, matchesLost: 10, setsWon: 52, setsLost: 24, gamesWon: 390, gamesLost: 310 },
      { id: "p10", firstName: "Federico", lastName: "Chingotto", dni: "39488392K", phone: "+34 654 321 010", email: "chingotto@padelpro.com", city: "Olavarría", birthDate: "1997-04-13", category: "Masculino - Primera", rankingPoints: 910, photoUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=200", matchesPlayed: 36, matchesWon: 26, matchesLost: 10, setsWon: 54, setsLost: 25, gamesWon: 400, gamesLost: 315 },
      { id: "p11", firstName: "Miguel", lastName: "Yanguas", dni: "41938472Y", phone: "+34 654 321 011", email: "mike.yanguas@padelpro.com", city: "Málaga", birthDate: "2002-03-18", category: "Masculino - Primera", rankingPoints: 830, photoUrl: "https://images.unsplash.com/photo-1500048993953-d23a436266cf?auto=format&fit=crop&q=80&w=200", matchesPlayed: 30, matchesWon: 20, matchesLost: 10, setsWon: 44, setsLost: 23, gamesWon: 310, gamesLost: 260 },
      { id: "p12", firstName: "Jerónimo", lastName: "González", dni: "45239102L", phone: "+34 654 321 012", email: "momo@padelpro.com", city: "Antequera", birthDate: "1997-02-21", category: "Masculino - Primera", rankingPoints: 810, photoUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200", matchesPlayed: 28, matchesWon: 18, matchesLost: 10, setsWon: 40, setsLost: 22, gamesWon: 290, gamesLost: 245 },
      { id: "p13", firstName: "Jon", lastName: "Sanz", dni: "39482103S", phone: "+34 654 321 013", email: "jon.sanz@padelpro.com", city: "Pamplona", birthDate: "2000-09-25", category: "Masculino - Primera", rankingPoints: 800, photoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200", matchesPlayed: 32, matchesWon: 21, matchesLost: 11, setsWon: 45, setsLost: 26, gamesWon: 320, gamesLost: 285 },
      { id: "p14", firstName: "Coki", lastName: "Nieto", dni: "41923847C", phone: "+34 654 321 014", email: "coki.nieto@padelpro.com", city: "Madrid", birthDate: "1998-12-18", category: "Masculino - Primera", rankingPoints: 790, photoUrl: "https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&q=80&w=200", matchesPlayed: 28, matchesWon: 16, matchesLost: 12, setsWon: 35, setsLost: 27, gamesWon: 280, gamesLost: 260 },
      { id: "p15", firstName: "Javier", lastName: "Garrido", dni: "48392019J", phone: "+34 654 321 015", email: "javi.garrido@padelpro.com", city: "Córdoba", birthDate: "2000-10-26", category: "Masculino - Primera", rankingPoints: 780, photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200", matchesPlayed: 30, matchesWon: 17, matchesLost: 13, setsWon: 38, setsLost: 29, gamesWon: 295, gamesLost: 275 },
      { id: "p16", firstName: "Eduardo", lastName: "Alonso", dni: "45391823E", phone: "+34 654 321 016", email: "edu.alonso@padelpro.com", city: "Valencia", birthDate: "2001-01-15", category: "Masculino - Primera", rankingPoints: 760, photoUrl: "https://images.unsplash.com/photo-1504257404764-b2b1d355ef4e?auto=format&fit=crop&q=80&w=200", matchesPlayed: 25, matchesWon: 13, matchesLost: 12, setsWon: 29, setsLost: 27, gamesWon: 240, gamesLost: 235 }
    ];
    for (const dp of defaultDemos) {
      if (!this.cache.players.some(p => p.id === dp.id)) {
        this.cache.players.push(dp);
        if (isRealFirebase) {
          try {
            await setDoc(doc(db, "players", dp.id), dp);
          } catch(e) {}
        }
      }
    }
    this.saveAllToStorage();
  }

  // PAIRS
  async getPairs(tournamentId?: string): Promise<Pair[]> {
    if (isRealFirebase) {
      try {
        let snap;
        if (tournamentId) {
          const q = query(collection(db, "pairs"), where("tournamentId", "==", tournamentId));
          snap = await withTimeout(getDocs(q), 5000);
        } else {
          snap = await withTimeout(getDocs(collection(db, "pairs")), 5000);
        }
        const list: Pair[] = [];
        snap.forEach(docSnap => {
          list.push(docSnap.data() as Pair);
        });
        return list;
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, "pairs");
        return tournamentId 
          ? this.cache.pairs.filter(p => p.tournamentId === tournamentId)
          : this.cache.pairs;
      }
    }
    return tournamentId 
      ? this.cache.pairs.filter(p => p.tournamentId === tournamentId)
      : this.cache.pairs;
  }

  async savePair(pr: Pair): Promise<void> {
    const idx = this.cache.pairs.findIndex(item => item.id === pr.id);
    if (idx >= 0) {
      this.cache.pairs[idx] = pr;
    } else {
      this.cache.pairs.push(pr);
    }
    this.saveAllToStorage();

    if (isRealFirebase) {
      setDoc(doc(db, "pairs", pr.id), pr).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `pairs/${pr.id}`);
        this.addNotification(
          "Inscripción guardada en Sandbox",
          "Pareja inscrita y guardada localmente en tu navegador. Conéctate con Google para sincronizar en tiempo real.",
          "warning"
        );
      });
    }
  }

  async deletePair(id: string): Promise<void> {
    this.cache.pairs = this.cache.pairs.filter(item => item.id !== id);
    this.saveAllToStorage();

    if (isRealFirebase) {
      deleteDoc(doc(db, "pairs", id)).catch((err) => {
        handleFirestoreError(err, OperationType.DELETE, `pairs/${id}`);
        this.addNotification(
          "Inscripción cancelada localmente",
          "Pareja removida localmente del navegador.",
          "warning"
        );
      });
    }
  }

  // MATCHES
  async getMatches(tournamentId?: string): Promise<Match[]> {
    if (isRealFirebase) {
      try {
        let snap;
        if (tournamentId) {
          const q = query(collection(db, "matches"), where("tournamentId", "==", tournamentId));
          snap = await withTimeout(getDocs(q), 5000);
        } else {
          snap = await withTimeout(getDocs(collection(db, "matches")), 5000);
        }
        const list: Match[] = [];
        snap.forEach(docSnap => {
          list.push(docSnap.data() as Match);
        });
        return list;
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, "matches");
        return tournamentId 
          ? this.cache.matches.filter(m => m.tournamentId === tournamentId)
          : this.cache.matches;
      }
    }
    return tournamentId 
      ? this.cache.matches.filter(m => m.tournamentId === tournamentId)
      : this.cache.matches;
  }

  async saveMatch(m: Match): Promise<void> {
    const idx = this.cache.matches.findIndex(item => item.id === m.id);
    if (idx >= 0) {
      this.cache.matches[idx] = m;
    } else {
      this.cache.matches.push(m);
    }
    this.saveAllToStorage();

    if (isRealFirebase) {
      setDoc(doc(db, "matches", m.id), m).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `matches/${m.id}`);
        this.addNotification(
          "Resultado guardado en Sandbox",
          "Marcador registrado localmente en tu navegador. Inicia sesión con la cuenta de administrador para guardar cambios en tiempo real.",
          "warning"
        );
      });
    }
  }

  async deleteMatch(id: string): Promise<void> {
    this.cache.matches = this.cache.matches.filter(item => item.id !== id);
    this.saveAllToStorage();

    if (isRealFirebase) {
      try {
        await deleteDoc(doc(db, "matches", id));
      } catch (err: any) {
        handleFirestoreError(err, OperationType.DELETE, `matches/${id}`);
      }
    }
  }

  // COURTS
  async getCourts(): Promise<Court[]> {
    if (isRealFirebase) {
      try {
        const snap = await withTimeout(getDocs(collection(db, "courts")), 5000);
        const list: Court[] = [];
        snap.forEach(docSnap => {
          list.push(docSnap.data() as Court);
        });
        return list;
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, "courts");
        return this.cache.courts;
      }
    }
    return this.cache.courts;
  }

  async saveCourt(c: Court): Promise<void> {
    const idx = this.cache.courts.findIndex(item => item.id === c.id);
    if (idx >= 0) {
      this.cache.courts[idx] = c;
    } else {
      this.cache.courts.push(c);
    }
    this.saveAllToStorage();

    if (isRealFirebase) {
      setDoc(doc(db, "courts", c.id), c).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `courts/${c.id}`);
        this.addNotification(
          "Cancha guardada en Sandbox",
          "Pista '" + c.name + "' guardada localmente en tu navegador.",
          "warning"
        );
      });
    }
  }

  async deleteCourt(id: string): Promise<void> {
    this.cache.courts = this.cache.courts.filter(item => item.id !== id);
    this.saveAllToStorage();

    if (isRealFirebase) {
      deleteDoc(doc(db, "courts", id)).catch((err) => {
        handleFirestoreError(err, OperationType.DELETE, `courts/${id}`);
        this.addNotification(
          "Cancha eliminada localmente",
          "Pista removida localmente del navegador.",
          "warning"
        );
      });
    }
  }

  // NOTIFICATIONS
  getNotifications(): AppNotification[] {
    return this.cache.notifications;
  }

  async addNotification(title: string, body: string, type: "info" | "success" | "warning" = "info"): Promise<void> {
    const newNotif: AppNotification = {
      id: "notif_" + Date.now(),
      title,
      body,
      timestamp: new Date().toISOString(),
      type,
      read: false
    };
    this.cache.notifications = [newNotif, ...this.cache.notifications].slice(0, 50); // limit to Last 50 entries
    this.saveAllToStorage();

    if (isRealFirebase) {
      setDoc(doc(db, "notifications", newNotif.id), newNotif).catch(() => {
        // Safe fail-silent for non-critical logging
      });
    }
  }

  clearNotifications(): void {
    this.cache.notifications = [];
    this.saveAllToStorage();
  }

  markNotificationsAsRead(): void {
    this.cache.notifications.forEach(n => {
      n.read = true;
    });
    this.saveAllToStorage();
  }

  // GALLERY MEDIA
  async getGalleryMedia(tournamentId?: string, matchId?: string): Promise<GalleryMedia[]> {
    if (isRealFirebase) {
      try {
        const snap = await withTimeout(getDocs(collection(db, "galleryMedia")), 5000);
        const list: GalleryMedia[] = [];
        snap.forEach(docSnap => {
          list.push(docSnap.data() as GalleryMedia);
        });
        let filtered = list;
        if (tournamentId) {
          filtered = filtered.filter(g => g.tournamentId === tournamentId);
        }
        if (matchId) {
          filtered = filtered.filter(g => g.matchId === matchId);
        }
        // sort by newest
        return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, "galleryMedia");
        let filtered = this.cache.galleryMedia;
        if (tournamentId) filtered = filtered.filter(g => g.tournamentId === tournamentId);
        if (matchId) filtered = filtered.filter(g => g.matchId === matchId);
        return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    }
    let filtered = this.cache.galleryMedia;
    if (tournamentId) filtered = filtered.filter(g => g.tournamentId === tournamentId);
    if (matchId) filtered = filtered.filter(g => g.matchId === matchId);
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async saveGalleryMedia(g: GalleryMedia): Promise<void> {
    const idx = this.cache.galleryMedia.findIndex(item => item.id === g.id);
    if (idx >= 0) {
      this.cache.galleryMedia[idx] = g;
    } else {
      this.cache.galleryMedia.push(g);
    }
    this.saveAllToStorage();

    if (isRealFirebase) {
      try {
        await setDoc(doc(db, "galleryMedia", g.id), g);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `galleryMedia/${g.id}`);
        this.addNotification(
          "Guardado en Sandbox Local",
          "Imagen guardada localmente en tu navegador. Conéctate con Google para subirla a la nube.",
          "warning"
        );
      }
    }
  }

  async deleteGalleryMedia(id: string): Promise<void> {
    this.cache.galleryMedia = this.cache.galleryMedia.filter(item => item.id !== id);
    this.saveAllToStorage();

    if (isRealFirebase) {
      try {
        await deleteDoc(doc(db, "galleryMedia", id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `galleryMedia/${id}`);
      }
    }
  }
}

export const repository = new PadelRepository();
