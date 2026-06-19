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
  AlertCircle,
  BarChart2,
  GitBranch
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
import { PageHeaderBanner, PageHeaderButton } from './ui/PageHeaderBanner';
import { TournamentDashboardView } from './tournament-detail/TournamentDashboardView';
import { InscriptionsTab } from './tournament-detail/InscriptionsTab';
import { MatchesTab } from './tournament-detail/MatchesTab';
import { StandingsTab } from './tournament-detail/StandingsTab';
import { PlayoffsTab } from './tournament-detail/PlayoffsTab';

// Generates placeholder empty matches for all playoff phases
export const preGeneratePlayoffsHelper = (tId: string, cat: string, pairCount?: number): Match[] => {
  const list: Match[] = [];
  
  // Decide bracket size based on pair count
  let bracketSize = 16; // default fallback
  if (pairCount !== undefined) {
    if (pairCount <= 4) {
      bracketSize = 2;
    } else if (pairCount <= 9) {
      bracketSize = 4;
    } else if (pairCount <= 16) {
      bracketSize = 8;
    } else if (pairCount <= 32) {
      bracketSize = 16;
    } else {
      bracketSize = 32;
    }
  }

  // 1. 16avos de Final (16 matches, only for bracketSize >= 32)
  if (bracketSize >= 32) {
    for (let i = 1; i <= 16; i++) {
      list.push({
        id: `match_${tId}_playoff_16avos_${cat.replace(/[^a-zA-Z0-9]/g, "")}_m${i}`,
        tournamentId: tId,
        phase: "playoff",
        roundNumber: 1,
        stageName: `16avos de Final ${i}`,
        pair1Id: "",
        pair2Id: "",
        courtId: "",
        date: "",
        time: "",
        status: "pending",
        scoreSummary: "Por jugar",
        winnerPairId: "",
        category: cat
      });
    }
  }

  // 2. Octavos de Final (8 matches, only for bracketSize >= 16)
  if (bracketSize >= 16) {
    for (let i = 1; i <= 8; i++) {
      list.push({
        id: `match_${tId}_playoff_8avos_${cat.replace(/[^a-zA-Z0-9]/g, "")}_m${i}`,
        tournamentId: tId,
        phase: "playoff",
        roundNumber: 2,
        stageName: `Octavos de Final ${i}`,
        pair1Id: "",
        pair2Id: "",
        courtId: "",
        date: "",
        time: "",
        status: "pending",
        scoreSummary: "Por jugar",
        winnerPairId: "",
        category: cat
      });
    }
  }

  // 3. Cuartos de Final (4 matches, only for bracketSize >= 8)
  if (bracketSize >= 8) {
    for (let i = 1; i <= 4; i++) {
      list.push({
        id: `match_${tId}_playoff_4tos_${cat.replace(/[^a-zA-Z0-9]/g, "")}_m${i}`,
        tournamentId: tId,
        phase: "playoff",
        roundNumber: 3,
        stageName: `Cuartos de Final ${i}`,
        pair1Id: "",
        pair2Id: "",
        courtId: "",
        date: "",
        time: "",
        status: "pending",
        scoreSummary: "Por jugar",
        winnerPairId: "",
        category: cat
      });
    }
  }

  // 4. Semifinales (2 matches, only for bracketSize >= 4)
  if (bracketSize >= 4) {
    for (let i = 1; i <= 2; i++) {
      list.push({
        id: `match_${tId}_playoff_sf_${cat.replace(/[^a-zA-Z0-9]/g, "")}_m${i}`,
        tournamentId: tId,
        phase: "playoff",
        roundNumber: 4,
        stageName: `Semifinal ${i}`,
        pair1Id: "",
        pair2Id: "",
        courtId: "",
        date: "",
        time: "",
        status: "pending",
        scoreSummary: "Por jugar",
        winnerPairId: "",
        category: cat
      });
    }
  }

  // 5. Final (1 match, always generated)
  list.push({
    id: `match_${tId}_playoff_final_${cat.replace(/[^a-zA-Z0-9]/g, "")}`,
    tournamentId: tId,
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
    winnerPairId: "",
    category: cat
  });

  return list;
};

import { formatDate as utilsFormatDate } from '../lib/utils';

export const formatDate = utilsFormatDate;

interface TournamentDetailProps {
  tournamentId: string;
  userRole: "admin" | "player";
  onBack: () => void;
  onIsolateModeChange?: (isIsolatedInscriptions: boolean) => void;
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
  onBack,
  onIsolateModeChange
}) => {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [activeTab, setActiveTab] = useState<"inscriptions" | "groups" | "matches" | "standings" | "playoffs">("inscriptions");
  const [viewMode, setViewMode] = useState<"dashboard" | "isolated">("dashboard");
  const [playoffFilter, setPlayoffFilter] = useState<"all" | "r1" | "r2" | "16avos" | "rc" | "8avos" | "4tos" | "semifinal" | "final">("all");
  const [fixtureFilter, setFixtureFilter] = useState<"all" | "group" | "16avos" | "8avos" | "4tos" | "semifinal" | "final" | "r1" | "r2">("all");

  useEffect(() => {
    if (onIsolateModeChange) {
      onIsolateModeChange(viewMode === "isolated");
    }
    return () => {
      if (onIsolateModeChange) {
        onIsolateModeChange(false);
      }
    };
  }, [viewMode, onIsolateModeChange]);

  // Selected Category
  const categoryInitialized = React.useRef(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("5ta Masculina");
  const [classificationRule, setClassificationRule] = useState<"top1" | "top2" | "top2_thirds" | "all">("top2");

  // Loaders
  const [loading, setLoading] = useState(true);

  // Inscriptions state
  const [p1Select, setP1Select] = useState("");
  const [p2Select, setP2Select] = useState("");
  const [pairToDelete, setPairToDelete] = useState<{ id: string; name: string } | null>(null);

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

  // Custom Alert state for court assignment conflicts & completions
  const [inAppAlert, setInAppAlert] = useState<{
    visible: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  } | null>(null);

  const triggerInAppAlert = (type: "success" | "error", title: string, message: string) => {
    setInAppAlert({ visible: true, type, title, message });
    setTimeout(() => {
      setInAppAlert(prev => {
        if (prev && prev.title === title && prev.message === message) {
          return null;
        }
        return prev;
      });
    }, 6050);
  };

  // Custom Finalizar Torneo Confirmation Dialog States
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [finishModalTitle, setFinishModalTitle] = useState("");
  const [finishModalWarning, setFinishModalWarning] = useState<string | null>(null);
  const [finishModalPayload, setFinishModalPayload] = useState<{ completedCategories: string[] } | null>(null);
  const [finishModalError, setFinishModalError] = useState<string | null>(null);

  // Group drawing assignments (In-memory grouping display)
  const [groupsMap, setGroupsMap] = useState<{ [gName: string]: Pair[] }>({});

  const [loggedEmail, setLoggedEmail] = useState<string>("");

  useEffect(() => {
    const handleCheckUser = () => {
      const uJson = localStorage.getItem("padel_mgr_mock_user");
      if (uJson) {
        try {
          const u = JSON.parse(uJson);
          setLoggedEmail(u.email || "");
        } catch (e) {}
      } else {
        setLoggedEmail("");
      }
    };
    handleCheckUser();
    window.addEventListener("storage", handleCheckUser);
    return () => window.removeEventListener("storage", handleCheckUser);
  }, []);

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

        // Auto-select the first category that has pairs or matches on initial load
        let initialCat = selectedCategory;
        if (!categoryInitialized.current) {
          const catsWithPairs = prs.map(p => p.category).filter(Boolean);
          const catsWithMatches = mtchs.map(m => m.category).filter(Boolean);
          
          if (catsWithPairs.length > 0) {
            const found = ALL_PADEL_CATEGORIES.find(c => catsWithPairs.includes(c));
            if (found) {
              initialCat = found;
            } else {
              initialCat = catsWithPairs[0];
            }
          } else if (catsWithMatches.length > 0) {
            const found = ALL_PADEL_CATEGORIES.find(c => catsWithMatches.includes(c));
            if (found) {
              initialCat = found;
            } else {
              initialCat = catsWithMatches[0];
            }
          } else if (currentT.category && currentT.category !== "Multicategoría") {
            initialCat = currentT.category;
          } else {
            initialCat = "5ta Masculina";
          }
          setSelectedCategory(initialCat);
          categoryInitialized.current = true;
        }

        // Reconstruct groups if matches exist
        reconstructGroups(prs, mtchs, initialCat);
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
    if (!pairId) return "Por determinar";
    const pr = pairs.find(p => p.id === pairId);
    if (!pr) return "Por determinar";
    const p1 = players.find(p => p.id === pr.player1Id);
    const p2 = players.find(p => p.id === pr.player2Id);
    return `${p1?.lastName || "???"} / ${p2?.lastName || "???"}`;
  };

  const handleOpenPrintSheet = (section: "inscriptions" | "matches" | "standings" | "playoffs") => {
    if (!tournament) return;

    const newWindow = window.open('', '_blank');
    if (!newWindow) {
      alert("Por favor habilita las ventanas emergentes (popups) para abrir la hoja de impresión.");
      return;
    }

    const catPairs = pairs.filter(p => p.category === selectedCategory);
    const catMatches = matches.filter(m => m.category === selectedCategory);

    let title = "";
    let contentHtml = "";

    if (section === "inscriptions") {
      title = "Parejas Inscritas";
      let rowsHtml = "";
      if (catPairs.length === 0) {
        rowsHtml = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: #64748b; font-style: italic;">No hay parejas inscritas en esta categoría</td></tr>`;
      } else {
        catPairs.forEach((pr, idx) => {
          const p1 = players.find(p => p.id === pr.player1Id);
          const p2 = players.find(p => p.id === pr.player2Id);
          const p1Name = p1 ? `${p1.lastName}, ${p1.firstName}` : "---";
          const p2Name = p2 ? `${p2.lastName}, ${p2.firstName}` : "---";
          const isP1Me = p1 && p1.email && loggedEmail && p1.email.toLowerCase() === loggedEmail.toLowerCase();
          const isP2Me = p2 && p2.email && loggedEmail && p2.email.toLowerCase() === loggedEmail.toLowerCase();
          const canSeeP1 = userRole === "admin" || isP1Me || isP2Me;
          const canSeeP2 = userRole === "admin" || isP1Me || isP2Me;

          const p1Contact = p1 ? (canSeeP1 ? `${p1.dni ? 'DNI: ' + p1.dni : ''} ${p1.phone ? '• Cel: ' + p1.phone : ''}`.trim() : "Contacto Oculto") : "N/A";
          const p2Contact = p2 ? (canSeeP2 ? `${p2.dni ? 'DNI: ' + p2.dni : ''} ${p2.phone ? '• Cel: ' + p2.phone : ''}`.trim() : "Contacto Oculto") : "N/A";

          rowsHtml += `
            <tr>
              <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
              <td><strong>${p1Name}</strong><br><small style="color: #64748b;">${p1Contact}</small></td>
              <td><strong>${p2Name}</strong><br><small style="color: #64748b;">${p2Contact}</small></td>
              <td style="text-align: center;">${pr.combinedRanking} Pts</td>
              <td style="text-align: center; text-transform: uppercase;"><span style="background-color: #f0fdf4; color: #166534; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; border: 1px solid #bbf7d0;">${pr.status || 'Confirmada'}</span></td>
            </tr>
          `;
        });
      }

      contentHtml = `
        <div class="section-title">Nómina Oficial de Parejas Inscritas (${catPairs.length})</div>
        <table>
          <thead>
            <tr>
              <th style="width: 50px; text-align: center;">Nº</th>
              <th>Primer Integrante (Jugador 1)</th>
              <th>Segundo Integrante (Jugador 2)</th>
              <th style="width: 150px; text-align: center;">Suma de Ranking</th>
              <th style="width: 120px; text-align: center;">Estado</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      `;
    } else if (section === "matches") {
      title = "Partidos (Fixture)";
      let roundsHtml = "";
      
      if (catMatches.length === 0) {
        roundsHtml = `<div style="text-align: center; padding: 40px; color: #64748b; font-style: italic; border: 1px dashed #cbd5e1; border-radius: 8px;">No hay partidos programados en esta categoría</div>`;
      } else {
        const uniqueStages: string[] = Array.from(new Set(catMatches.map(m => m.stageName as string)));
        uniqueStages.forEach(stageName => {
          const stageMatches = catMatches.filter(m => m.stageName === stageName);
          let matchRows = "";

          stageMatches.forEach((m, idx) => {
            const p1Name = m.pair1Id ? getPairName(m.pair1Id) : "Por clasificar";
            const p2Name = m.pair2Id ? getPairName(m.pair2Id) : "Por clasificar";
            const courtName = courts.find(c => c.id === m.courtId)?.name || m.courtId || "Por asignar";
            const dateTime = m.date && m.time ? `${m.date} - ${m.time} hs` : "Sin programar";
            const isCompleted = m.status === 'completed';
            const statusLabel = isCompleted ? 'Completado' : (m.status === 'pending' ? 'Pendiente' : m.status.toUpperCase());
            
            matchRows += `
              <tr>
                <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
                <td><strong>${p1Name}</strong></td>
                <td style="text-align: center; font-weight: bold; color: #64748b;">vs</td>
                <td><strong>${p2Name}</strong></td>
                <td>${courtName}</td>
                <td style="text-align: center;">${dateTime}</td>
                <td style="text-align: center; font-family: monospace; font-weight: bold; background-color: #f8fafc; font-size: 14px;">${m.scoreSummary || 'Por jugar'}</td>
                <td style="text-align: center;"><span style="font-weight: bold; font-size: 11px; padding: 3px 8px; border-radius: 4px; ${isCompleted ? 'background-color: #f0fdf4; color: #166534; border: 1px solid #bbf7d0;' : 'background-color: #fef9c3; color: #713f12; border: 1px solid #fef08a;'}">${statusLabel}</span></td>
              </tr>
            `;
          });

          roundsHtml += `
            <div class="section-title">Etapa: ${stageName.toUpperCase()}</div>
            <table>
              <thead>
                <tr>
                  <th style="width: 50px; text-align: center;">Nº</th>
                  <th>Pareja de Entrada</th>
                  <th style="width: 40px; text-align: center;">-</th>
                  <th>Pareja de Oposición</th>
                  <th style="width: 140px;">Cancha / Sede</th>
                  <th style="width: 140px; text-align: center;">Programación</th>
                  <th style="width: 130px; text-align: center;">Resultado</th>
                  <th style="width: 110px; text-align: center;">Estado</th>
                </tr>
              </thead>
              <tbody>
                ${matchRows}
              </tbody>
            </table>
          `;
        });
      }

      contentHtml = roundsHtml;
    } else if (section === "standings") {
      title = "Tabla de Posiciones";
      let standingsContent = "";

      const isSRTC24 = catPairs.length === 24;
      if (isSRTC24) {
        const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
        standingsContent += `<div class="section-title">📊 Tablas por Zonas (Formato Oficial SRTC 24)</div>`;
        letters.forEach(letter => {
          const groupMatches = catMatches.filter(m => m.stageName === `Grupo ${letter}`);
          const groupPairIds = new Set<string>();
          groupMatches.forEach(gm => {
            if (gm.pair1Id) groupPairIds.add(gm.pair1Id);
            if (gm.pair2Id) groupPairIds.add(gm.pair2Id);
          });
          const groupPairs = catPairs.filter(p => groupPairIds.has(p.id));
          const stands = calculateGroupStandings(groupPairs, groupMatches, getPairName, true);
          
          if (stands.length > 0) {
            let rowHtml = "";
            stands.forEach((row, idx) => {
              rowHtml += `
                <tr>
                  <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
                  <td><strong>${row.pairName}</strong></td>
                  <td style="text-align: center;">${row.pj}</td>
                  <td style="text-align: center; color: #15803d; font-weight: bold;">${row.pg}</td>
                  <td style="text-align: center;">${row.setsWon}-${row.setsLost}</td>
                  <td style="text-align: center; font-weight: bold; color: ${row.setsDiff >= 0 ? '#15803d' : '#b91c1c'}">${row.setsDiff >= 0 ? '+' : ''}${row.setsDiff}</td>
                  <td style="text-align: center;">${row.gamesWon}-${row.gamesLost}</td>
                  <td style="text-align: center; color: ${row.gamesDiff >= 0 ? '#16a34a' : '#dc2626'}">${row.gamesDiff >= 0 ? '+' : ''}${row.gamesDiff}</td>
                  <td style="text-align: right; padding-right: 15px; font-weight: bold; font-size: 14px;">${row.points}</td>
                </tr>
              `;
            });

            standingsContent += `
              <h4 style="margin: 20px 0 8px 0; color: #1e3a8a; text-transform: uppercase; font-size: 14px; font-weight: 800; border-bottom: 2px solid #3b82f6; padding-bottom: 4px;">Zona Grupo ${letter}</h4>
              <table>
                <thead>
                  <tr>
                    <th style="width: 50px; text-align: center;">Pos</th>
                    <th>Pareja</th>
                    <th style="width: 50px; text-align: center;">PJ</th>
                    <th style="width: 50px; text-align: center;">PG</th>
                    <th style="width: 90px; text-align: center;">Sets (W-L)</th>
                    <th style="width: 60px; text-align: center;">Dif S</th>
                    <th style="width: 90px; text-align: center;">Games (W-L)</th>
                    <th style="width: 60px; text-align: center;">Dif G</th>
                    <th style="width: 80px; text-align: right; padding-right: 15px;">PTS</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowHtml}
                </tbody>
              </table>
            `;
          }
        });
      } else {
        const isSRTC16 = catPairs.length === 16;
        const isSRTC32 = catPairs.length === 32;
        const stagesToRender: { title: string; matches: Match[] }[] = [];

        if (isSRTC16) {
          stagesToRender.push({ title: "Ronda 1", matches: catMatches.filter(m => m.roundNumber === 1 || m.stageName.toLowerCase().includes("ronda 1")) });
          stagesToRender.push({ title: "Ronda 2", matches: catMatches.filter(m => m.roundNumber === 2 || m.stageName.toLowerCase().includes("ronda 2")) });
          stagesToRender.push({ title: "Cuartos de Final", matches: catMatches.filter(m => m.roundNumber === 3 || m.stageName.toLowerCase().includes("cuartos") || m.stageName.toLowerCase().includes("4tos")) });
          stagesToRender.push({ title: "Semifinales", matches: catMatches.filter(m => m.roundNumber === 4 || m.stageName.toLowerCase().includes("semifinal")) });
          stagesToRender.push({ title: "Final", matches: catMatches.filter(m => m.roundNumber === 5 || m.stageName.toLowerCase() === "final") });
        } else if (isSRTC32) {
          stagesToRender.push({ title: "Ronda 1", matches: catMatches.filter(m => m.roundNumber === 1 || m.stageName.toLowerCase().includes("ronda 1")) });
          stagesToRender.push({ title: "Ronda 2", matches: catMatches.filter(m => m.roundNumber === 2 || m.stageName.toLowerCase().includes("ronda 2")) });
          stagesToRender.push({ title: "Octavos de Final", matches: catMatches.filter(m => m.roundNumber === 3 || m.stageName.toLowerCase().includes("octavos") || m.stageName.toLowerCase().includes("8avos")) });
          stagesToRender.push({ title: "Cuartos de Final", matches: catMatches.filter(m => m.roundNumber === 4 || m.stageName.toLowerCase().includes("cuartos") || m.stageName.toLowerCase().includes("4tos")) });
          stagesToRender.push({ title: "Semifinales", matches: catMatches.filter(m => m.roundNumber === 5 || m.stageName.toLowerCase().includes("semifinal")) });
          stagesToRender.push({ title: "Final", matches: catMatches.filter(m => m.roundNumber === 6 || m.stageName.toLowerCase() === "final") });
        } else {
          const stageNames: string[] = Array.from(new Set(catMatches.map(m => m.stageName as string)));
          stageNames.forEach(name => {
            stagesToRender.push({ title: name, matches: catMatches.filter(m => m.stageName === name) });
          });
        }

        standingsContent += `<div class="section-title">📊 Tablas por Etapas (Rendimiento por Fase)</div>`;
        let stagesAdded = 0;
        stagesToRender.forEach(stage => {
          const pairIds = new Set<string>();
          stage.matches.forEach(m => {
            if (m.pair1Id && m.pair1Id !== "BYE") pairIds.add(m.pair1Id);
            if (m.pair2Id && m.pair2Id !== "BYE") pairIds.add(m.pair2Id);
          });
          const stagePairs = catPairs.filter(p => pairIds.has(p.id));
          const stands = calculateGroupStandings(stagePairs, stage.matches, getPairName, false);

          if (stands.length > 0) {
            stagesAdded++;
            let stageRows = "";
            stands.forEach((row, idx) => {
              stageRows += `
                <tr>
                  <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
                  <td><strong>${row.pairName}</strong></td>
                  <td style="text-align: center;">${row.pj}</td>
                  <td style="text-align: center; color: #15803d; font-weight: bold;">${row.pg}</td>
                  <td style="text-align: center; color: #b91c1c;">${row.pp}</td>
                  <td style="text-align: center;">${row.setsWon}-${row.setsLost}</td>
                  <td style="text-align: center; font-weight: bold; color: ${row.setsDiff >= 0 ? '#15803d' : '#b91c1c'}">${row.setsDiff >= 0 ? '+' : ''}${row.setsDiff}</td>
                  <td style="text-align: center;">${row.gamesWon}-${row.gamesLost}</td>
                  <td style="text-align: center; color: ${row.gamesDiff >= 0 ? '#16a34a' : '#dc2626'}">${row.gamesDiff > 0 ? '+' : ''}${row.gamesDiff}</td>
                  <td style="text-align: right; padding-right: 15px; font-weight: bold; font-size: 14px;">${row.points}</td>
                </tr>
              `;
            });

            standingsContent += `
              <h4 style="margin: 20px 0 8px 0; color: #1e3a8a; text-transform: uppercase; font-size: 14px; font-weight: 800; border-bottom: 2px solid #3b82f6; padding-bottom: 4px;">Etapa: ${stage.title}</h4>
              <table>
                <thead>
                  <tr>
                    <th style="width: 50px; text-align: center;">Pos</th>
                    <th>Pareja</th>
                    <th style="width: 50px; text-align: center;">PJ</th>
                    <th style="width: 50px; text-align: center;">PG</th>
                    <th style="width: 50px; text-align: center;">PP</th>
                    <th style="width: 90px; text-align: center;">Sets (W-L)</th>
                    <th style="width: 60px; text-align: center;">Dif S</th>
                    <th style="width: 90px; text-align: center;">Games (W-L)</th>
                    <th style="width: 60px; text-align: center;">Dif G</th>
                    <th style="width: 80px; text-align: right; padding-right: 15px;">PTS</th>
                  </tr>
                </thead>
                <tbody>
                  ${stageRows}
                </tbody>
              </table>
            `;
          }
        });

        if (stagesAdded === 0) {
          standingsContent += `<p style="color: #64748b; font-style: italic; margin-bottom: 30px;">Ninguna etapa posee partidos finalizados.</p>`;
        }
      }

      if (!isSRTC24) {
        const table = calculateDosVidasStandings(catPairs, matches, getPairName);
        let unifiedRows = "";

        table.forEach((row, idx) => {
          let livesLabel = "🖤 🖤";
          if (row.lives === 2) livesLabel = "❤️ ❤️";
          else if (row.lives === 1) livesLabel = "❤️ 🖤";
          
          unifiedRows += `
            <tr style="${row.eliminated ? 'opacity: 0.6; text-decoration: line-through; background-color: #f8fafc;' : ''}">
              <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
              <td><strong>${row.pairName}</strong></td>
              <td style="text-align: center; font-size: 14px;">${livesLabel}</td>
              <td style="text-align: center;">${row.pj}</td>
              <td style="text-align: center; color: #15803d;">${row.pg}</td>
              <td style="text-align: center; color: #b91c1c;">${row.pp}</td>
              <td style="text-align: center;">${row.setsWon} - ${row.setsLost}</td>
              <td style="text-align: center; font-weight: bold; color: ${row.setsDiff >= 0 ? '#15803d' : '#b91c1c'}">${row.setsDiff > 0 ? '+' : ''}${row.setsDiff}</td>
              <td style="text-align: center;">${row.gamesWon} - ${row.gamesLost}</td>
              <td style="text-align: center; color: ${row.gamesDiff >= 0 ? '#16a34a' : '#dc2626'}">${row.gamesDiff > 0 ? '+' : ''}${row.gamesDiff}</td>
              <td style="text-align: right; padding-right: 15px;">
                <span style="font-weight: bold; font-size: 11px; padding: 3px 8px; border-radius: 4px; ${row.eliminated ? 'background-color: #f1f5f9; color: #64748b; border: 1px solid #cbd5e1;' : 'background-color: #f0fdf4; color: #166534; border: 1px solid #bbf7d0;'}">
                  ${row.eliminated ? 'ELIMINADO' : 'ACTIVO (' + row.lives + ' V)'}
                </span>
              </td>
            </tr>
          `;
        });

        standingsContent += `
          <div class="section-title">🥇 Tabla Unificada General: Sistema Dos Vidas SRTC</div>
          <table>
            <thead>
              <tr>
                <th style="width: 50px; text-align: center;">Pos</th>
                <th>Pareja Competidora</th>
                <th style="width: 140px; text-align: center;">Vidas Restantes</th>
                <th style="width: 55px; text-align: center;">PJ</th>
                <th style="width: 55px; text-align: center;">PG</th>
                <th style="width: 55px; text-align: center;">PP</th>
                <th style="width: 95px; text-align: center;">Sets (W/L)</th>
                <th style="width: 60px; text-align: center;">Dif S</th>
                <th style="width: 95px; text-align: center;">Games (W/L)</th>
                <th style="width: 60px; text-align: center;">Dif G</th>
                <th style="width: 140px; text-align: right; padding-right: 15px;">Estado</th>
              </tr>
            </thead>
            <tbody>
              ${unifiedRows}
            </tbody>
          </table>
        `;
      }

      contentHtml = standingsContent;
    } else if (section === "playoffs") {
      title = "Cuadros de Eliminación Directa";
      
      const playoffMatches = catMatches.filter(m => m.phase === "playoff" || m.stageName.toLowerCase().includes("final") || m.stageName.toLowerCase().includes("semifinal") || m.stageName.toLowerCase().includes("cuartos") || m.stageName.toLowerCase().includes("octavos") || m.stageName.toLowerCase().includes("16avos"));
      
      if (playoffMatches.length === 0) {
        contentHtml = `
          <div style="text-align: center; padding: 50px; color: #64748b; font-style: italic; border: 1px dashed #cbd5e1; border-radius: 8px; margin-top: 20px;">
            Aún no se han generado los cuadros directos de playoffs para esta categoría.
          </div>
        `;
      } else {
        const uniquePlayoffStages: string[] = Array.from(new Set(playoffMatches.map(m => m.stageName as string)));
        let bracketBlocks = "";

        uniquePlayoffStages.forEach(stageName => {
          const stageMatches = playoffMatches.filter(m => m.stageName === stageName);
          let matchCards = "";

          stageMatches.forEach((m, idx) => {
            const p1Name = m.pair1Id ? getPairName(m.pair1Id) : "Por clasificar";
            const p2Name = m.pair2Id ? getPairName(m.pair2Id) : "Por clasificar";
            const isCompleted = m.status === 'completed';
            const isP1Winner = isCompleted && m.winnerPairId === m.pair1Id;
            const isP2Winner = isCompleted && m.winnerPairId === m.pair2Id;

            matchCards += `
              <div class="bracket-game">
                <div class="bracket-game-title">Partido ${idx + 1}</div>
                <div class="bracket-game-team ${isP1Winner ? 'winner' : (isCompleted ? 'loser' : '')}">
                  <span>${p1Name}</span>
                  <span>${isCompleted && isP1Winner ? '🏆' : ''}</span>
                </div>
                <div style="border-top: 1px dashed #cbd5e1; margin: 6px 0;"></div>
                <div class="bracket-game-team ${isP2Winner ? 'winner' : (isCompleted ? 'loser' : '')}">
                  <span>${p2Name}</span>
                  <span>${isCompleted && isP2Winner ? '🏆' : ''}</span>
                </div>
                <div style="margin-top: 10px; font-size: 11px; color: #0f172a; font-weight: bold; background-color: #f1f5f9; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px; display: flex; justify-content: space-between;">
                  <span>Marcador:</span> <strong>${m.scoreSummary || 'Por jugar'}</strong>
                </div>
              </div>
            `;
          });

          bracketBlocks += `
            <div class="section-title">Eliminatoria: ${stageName.toUpperCase()}</div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 15px; margin-bottom: 30px;">
              ${matchCards}
            </div>
          `;
        });

        contentHtml = bracketBlocks;
      }
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>SRTC - ${title} - ${tournament.name}</title>
        <style>
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
            color: #0f172a;
            background-color: #ffffff;
            padding: 30px;
            margin: 0;
            line-height: 1.4;
          }
          .header {
            border-bottom: 3px double #0f172a;
            padding-bottom: 12px;
            margin-bottom: 25px;
            text-align: center;
          }
          .header h1 {
            margin: 0 0 4px 0;
            font-size: 24px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .header h2 {
            margin: 0 0 6px 0;
            font-size: 14px;
            font-weight: 700;
            color: #1e3a8a;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            font-size: 12px;
            color: #475569;
            text-align: left;
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
            margin-top: 8px;
          }
          .section-title {
            font-size: 14px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            background-color: #0f172a;
            color: #ffffff;
            padding: 6px 12px;
            margin: 25px 0 12px 0;
            border-radius: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 12px;
          }
          th {
            background-color: #f8fafc;
            border: 1px solid #94a3b8;
            padding: 8px 10px;
            text-align: left;
            font-weight: bold;
            color: #1e293b;
            text-transform: uppercase;
            font-size: 10px;
            letter-spacing: 0.5px;
          }
          td {
            border: 1px solid #cbd5e1;
            padding: 8px 10px;
            color: #0f172a;
            vertical-align: middle;
          }
          tr:nth-child(even) td {
            background-color: #f8fafc;
          }
          .bracket-game {
            border: 1px solid #94a3b8;
            border-radius: 6px;
            padding: 12px;
            background: #ffffff;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          }
          .bracket-game-title {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            color: #64748b;
            margin-bottom: 6px;
            letter-spacing: 0.5px;
          }
          .bracket-game-team {
            font-size: 12px;
            display: flex;
            justify-content: space-between;
            padding: 3px 0;
            font-weight: 500;
          }
          .bracket-game-team.winner {
            font-weight: bold;
            color: #000000;
          }
          .bracket-game-team.loser {
            text-decoration: line-through;
            color: #94a3b8;
          }
          .btn-print {
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #1d4ed8;
            color: #ffffff;
            border: none;
            padding: 8px 16px;
            font-size: 12px;
            font-weight: bold;
            border-radius: 6px;
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(0,0,0,0.15);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            transition: all 0.2s;
            z-index: 999999;
          }
          .btn-print:hover {
            background-color: #1e40af;
            transform: translateY(-1px);
          }
          @media print {
            body {
              padding: 0;
              font-size: 11px;
            }
            .btn-print {
              display: none !important;
            }
            .section-title {
              background-color: #cbd5e1 !important;
              color: #000000 !important;
              border: 1px solid #000000;
            }
            td, th {
              padding: 6px 8px !important;
            }
          }
        </style>
      </head>
      <body>
        <button class="btn-print" onclick="window.print()">🖨️ Imprimir Planilla</button>

        <div class="header">
          <h1>Planilla Oficial de Competencia</h1>
          <h2>Torneo: ${tournament.name}</h2>
          
          <div class="meta-grid">
            <div>
              <strong>Club / Sede:</strong> ${tournament.club || "No especificado"}<br>
              <strong>Ubicación:</strong> ${tournament.city || "No especificada"}<br>
              <strong>Tipo de Torneo:</strong> ${tournament.tournamentType || "Dos Vidas"}
            </div>
            <div>
              <strong>Categoría:</strong> ${selectedCategory}<br>
              <strong>Fecha:</strong> ${tournament.startDate} al ${tournament.endDate}<br>
              <strong>Generado:</strong> ${new Date().toLocaleString('es-AR')}
            </div>
          </div>
        </div>

        ${contentHtml}

        <div style="margin-top: 40px; border-top: 1px solid #cbd5e1; padding-top: 15px; text-align: center; font-size: 10px; color: #64748b; font-weight: bold;">
          Sistema de Gestión de Torneos Oficiales SRTC Padel — Planilla libre de encabezado flotante
        </div>
      </body>
      </html>
    `;

    newWindow.document.write(htmlContent);
    newWindow.document.close();
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

  const handleDeletePair = (id: string, name: string) => {
    setPairToDelete({ id, name });
  };

  const executeDeletePair = async () => {
    if (!pairToDelete) return;
    const { id, name } = pairToDelete;
    setPairToDelete(null);
    await repository.deletePair(id);
    await repository.addNotification("Desinscripción", `Se removió a la pareja ${name} del torneo.`, "warning");
    loadAllData();
  };

  // Automatically pair up remaining players of selectedCategory
  const handleAutoPairRemaining = async (limitCount?: number) => {
    if (!tournament) return;

    // Filter registered players in this tournament
    const currentRegisteredIds = new Set(pairs.flatMap(p => [p.player1Id, p.player2Id]));

    // All available players in selectedCategory
    const categoryPlayers = players.filter(p => p.category === selectedCategory);
    const unregistered = categoryPlayers.filter(p => !currentRegisteredIds.has(p.id));

    // Existing pairs in this category
    const existingPairsInCategory = pairs.filter(p => p.category === selectedCategory);

    let targetPairsToCreate = 0;
    if (limitCount) {
      targetPairsToCreate = Math.max(0, limitCount - existingPairsInCategory.length);
    } else {
      targetPairsToCreate = Math.floor(unregistered.length / 2);
    }

    if (limitCount && existingPairsInCategory.length >= limitCount) {
      await repository.addNotification(
        "Límite Alcanzado",
        `Esta categoría ya tiene ${existingPairsInCategory.length} parejas registradas, que alcanza o supera el objetivo de ${limitCount}.`,
        "info"
      );
      return;
    }

    const playersNeeded = targetPairsToCreate * 2;
    if (unregistered.length < playersNeeded) {
      const maxPossible = Math.floor(unregistered.length / 2);
      await repository.addNotification(
        "Jugadores Insuficientes",
        `No hay suficientes jugadores libres en '${selectedCategory}' para crear ${targetPairsToCreate} parejas adicionales. Se generarán las ${maxPossible} parejas posibles con los libres disponibles.`,
        "warning"
      );
      targetPairsToCreate = maxPossible;
    }

    if (targetPairsToCreate <= 0) {
      await repository.addNotification(
        "Registro No Necesario",
        "No hay jugadores libres suficientes para crear nuevas parejas.",
        "warning"
      );
      return;
    }

    // Sort players by ranking descendiente
    const sorted = [...unregistered].sort((a, b) => b.rankingPoints - a.rankingPoints);

    let pairsCreatedCount = 0;
    try {
      for (let i = 0; i < targetPairsToCreate * 2; i += 2) {
        if (i >= sorted.length - 1) break;
        const p1 = sorted[i];
        const p2 = sorted[i + 1];

        const combined = p1.rankingPoints + p2.rankingPoints;
        const status: Pair["status"] = "confirmed";

        const newPair: Pair = {
          id: `pair_${tournamentId}_${p1.id}_${p2.id}`,
          tournamentId,
          player1Id: p1.id,
          player2Id: p2.id,
          category: selectedCategory,
          combinedRanking: combined,
          status
        };

        await repository.savePair(newPair);
        pairsCreatedCount++;
      }

      await repository.addNotification(
        "Parejas Auto-generadas",
        `Se han emparejado e inscrito ${pairsCreatedCount} parejas de la categoría '${selectedCategory}' exitosamente (Total: ${existingPairsInCategory.length + pairsCreatedCount} parejas).`,
        "success"
      );

      loadAllData();
    } catch (error) {
      console.error("Error auto-pairing remaining players:", error);
      await repository.addNotification(
        "Error al Registrar",
        "Ocurrió un inconveniente al generar las parejas automáticas.",
        "warning"
      );
    }
  };


  const handleResetCategory = async () => {
    if (confirm(`¿Estás seguro de que deseas reiniciar todos los partidos y sorteos de la categoría '${selectedCategory}'? Se eliminarán los marcadores y fixture.`)) {
      const priorMatches = matches.filter(m => m.tournamentId === tournamentId && m.category === selectedCategory);
      await Promise.all(priorMatches.map(oldMatch => repository.deleteMatch(oldMatch.id)));

      // Only set status to "registration" if no other categories have matches
      const otherMatches = matches.filter(m => m.tournamentId === tournamentId && m.category !== selectedCategory);
      if (tournament && otherMatches.length === 0 && tournament.status !== "registration") {
        const updatedTournament: Tournament = {
          ...tournament,
          status: "registration"
        };
        await repository.saveTournament(updatedTournament);
      }

      await repository.addNotification(
        "Categoría Reiniciada",
        `Se eliminaron todos los partidos de '${selectedCategory}'. Podrás realizar un nuevo sorteo.`,
        "warning"
      );

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
      alert(`Necesitas al menos 2 parejas registradas en la categoría '${selectedCategory}' para poder iniciar el torneo.`);
      return;
    }

    try {
      // Step 2: Delete prior matches (if restarting / redrawing) only for THIS category
      const priorMatches = matches.filter(m => m.tournamentId === tournamentId && m.category === selectedCategory);
      await Promise.all(priorMatches.map(oldMatch => repository.deleteMatch(oldMatch.id)));

      // Step 3: Run the initial round draw
      const sortedPairs = [...categoryPairs];
      if (method === "random") {
        sortedPairs.sort(() => Math.random() - 0.5);
      } else {
        // Seeding / ranking based
        sortedPairs.sort((a, b) => b.combinedRanking - a.combinedRanking);
      }

      const isSRTC16 = sortedPairs.length === 16;
      if (isSRTC16) {
        const allGeneratedMatches: Match[] = [];
        const dateString = tournament?.startDate || new Date().toISOString().split("T")[0];

        // 1. Ronda 1 Matches (8 matches)
        for (let i = 0; i < 8; i++) {
          const letter = String.fromCharCode(65 + i); // 'A' to 'H'
          const p1 = sortedPairs[i * 2];
          const p2 = sortedPairs[i * 2 + 1];
          allGeneratedMatches.push({
            id: `match_${tournamentId}_srtc16_${selectedCategory.replace(/[^a-zA-Z0-9]/g, "")}_r1_m${i + 1}`,
            tournamentId,
            phase: "group",
            roundNumber: 1,
            stageName: `Ronda 1 - Grupo ${letter}`,
            pair1Id: p1.id,
            pair2Id: p2.id,
            courtId: "",
            date: dateString,
            time: `${17 + (i % 3)}:00`,
            status: "pending",
            scoreSummary: "Por jugar",
            winnerPairId: "",
            category: selectedCategory
          });
        }

        // 2. Ronda 2 Placeholder Matches (8 matches, Partidos 9 to 16)
        for (let i = 9; i <= 16; i++) {
          allGeneratedMatches.push({
            id: `match_${tournamentId}_srtc16_${selectedCategory.replace(/[^a-zA-Z0-9]/g, "")}_r2_m${i}`,
            tournamentId,
            phase: "group",
            roundNumber: 2,
            stageName: `Ronda 2 - Partido ${i}`,
            pair1Id: "",
            pair2Id: "",
            courtId: "",
            date: dateString,
            time: `${17 + (i % 3)}:00`,
            status: "pending",
            scoreSummary: "Por jugar",
            winnerPairId: "",
            category: selectedCategory
          });
        }

        // 3. Cuartos de Final Placeholder Matches (4 matches)
        for (let i = 1; i <= 4; i++) {
          allGeneratedMatches.push({
            id: `match_${tournamentId}_srtc16_${selectedCategory.replace(/[^a-zA-Z0-9]/g, "")}_q_m${i}`,
            tournamentId,
            phase: "playoff",
            roundNumber: 3,
            stageName: `Cuartos de Final ${i}`,
            pair1Id: "",
            pair2Id: "",
            courtId: "",
            date: dateString,
            time: "18:00",
            status: "pending",
            scoreSummary: "Por jugar",
            winnerPairId: "",
            category: selectedCategory
          });
        }

        // 4. Semifinales Placeholder Matches (2 matches)
        for (let i = 1; i <= 2; i++) {
          allGeneratedMatches.push({
            id: `match_${tournamentId}_srtc16_${selectedCategory.replace(/[^a-zA-Z0-9]/g, "")}_sf_m${i}`,
            tournamentId,
            phase: "playoff",
            roundNumber: 4,
            stageName: `Semifinal ${i}`,
            pair1Id: "",
            pair2Id: "",
            courtId: "",
            date: dateString,
            time: "19:30",
            status: "pending",
            scoreSummary: "Por jugar",
            winnerPairId: "",
            category: selectedCategory
          });
        }

        // 5. Final Placeholder Match
        allGeneratedMatches.push({
          id: `match_${tournamentId}_srtc16_${selectedCategory.replace(/[^a-zA-Z0-9]/g, "")}_final`,
          tournamentId,
          phase: "playoff",
          roundNumber: 5,
          stageName: "Final",
          pair1Id: "",
          pair2Id: "",
          courtId: "",
          date: dateString,
          time: "21:00",
          status: "pending",
          scoreSummary: "Por jugar",
          winnerPairId: "",
          category: selectedCategory
        });

        await Promise.all(allGeneratedMatches.map(m => repository.saveMatch(m)));

        if (tournament.status === "registration") {
          const updatedTournament: Tournament = {
            ...tournament,
            status: "in_progress"
          };
          await repository.saveTournament(updatedTournament);
        }

        await repository.addNotification(
          "Torneo Iniciado - SRTC 16", 
          `El Torneo SRTC 16 para la categoría '${selectedCategory}' se ha iniciado con éxito. Se pre-generaron todas las llaves y partidos hasta la Final.`,
          "success"
        );

        loadAllData();
        setActiveTab("matches");
        return;
      }

      const isSRTC32 = sortedPairs.length === 32;
      if (isSRTC32) {
        const allGeneratedMatches: Match[] = [];
        const dateString = tournament?.startDate || new Date().toISOString().split("T")[0];
        const cleanCat = selectedCategory.replace(/[^a-zA-Z0-9]/g, "");

        // 1. Ronda 1 Matches (16 matches)
        for (let i = 0; i < 16; i++) {
          const letter = String.fromCharCode(65 + i); // 'A' to 'P'
          const p1 = sortedPairs[i * 2];
          const p2 = sortedPairs[i * 2 + 1];
          allGeneratedMatches.push({
            id: `match_${tournamentId}_srtc32_${cleanCat}_r1_m${i + 1}`,
            tournamentId,
            phase: "group",
            roundNumber: 1,
            stageName: `Ronda 1 - Grupo ${letter}`,
            pair1Id: p1.id,
            pair2Id: p2.id,
            courtId: "",
            date: dateString,
            time: `${17 + (i % 4)}:00`,
            status: "pending",
            scoreSummary: "Por jugar",
            winnerPairId: "",
            category: selectedCategory
          });
        }

        // 2. Ronda 2 Placeholder Matches (16 matches, Partidos 17 to 32)
        for (let i = 17; i <= 32; i++) {
          allGeneratedMatches.push({
            id: `match_${tournamentId}_srtc32_${cleanCat}_r2_m${i}`,
            tournamentId,
            phase: "group",
            roundNumber: 2,
            stageName: `Ronda 2 - Partido ${i}`,
            pair1Id: "",
            pair2Id: "",
            courtId: "",
            date: dateString,
            time: `${17 + (i % 4)}:00`,
            status: "pending",
            scoreSummary: "Por jugar",
            winnerPairId: "",
            category: selectedCategory
          });
        }

        // 3. Octavos de Final Placeholder Matches (8 matches)
        for (let i = 1; i <= 8; i++) {
          allGeneratedMatches.push({
            id: `match_${tournamentId}_srtc32_${cleanCat}_8_m${i}`,
            tournamentId,
            phase: "playoff",
            roundNumber: 3,
            stageName: `Octavos de Final ${i}`,
            pair1Id: "",
            pair2Id: "",
            courtId: "",
            date: dateString,
            time: "18:00",
            status: "pending",
            scoreSummary: "Por jugar",
            winnerPairId: "",
            category: selectedCategory
          });
        }

        // 4. Cuartos de Final Placeholder Matches (4 matches)
        for (let i = 1; i <= 4; i++) {
          allGeneratedMatches.push({
            id: `match_${tournamentId}_srtc32_${cleanCat}_q_m${i}`,
            tournamentId,
            phase: "playoff",
            roundNumber: 4,
            stageName: `Cuartos de Final ${i}`,
            pair1Id: "",
            pair2Id: "",
            courtId: "",
            date: dateString,
            time: "19:00",
            status: "pending",
            scoreSummary: "Por jugar",
            winnerPairId: "",
            category: selectedCategory
          });
        }

        // 5. Semifinales Placeholder Matches (2 matches)
        for (let i = 1; i <= 2; i++) {
          allGeneratedMatches.push({
            id: `match_${tournamentId}_srtc32_${cleanCat}_sf_m${i}`,
            tournamentId,
            phase: "playoff",
            roundNumber: 5,
            stageName: `Semifinal ${i}`,
            pair1Id: "",
            pair2Id: "",
            courtId: "",
            date: dateString,
            time: "20:00",
            status: "pending",
            scoreSummary: "Por jugar",
            winnerPairId: "",
            category: selectedCategory
          });
        }

        // 6. Final Placeholder Match
        allGeneratedMatches.push({
          id: `match_${tournamentId}_srtc32_${cleanCat}_final`,
          tournamentId,
          phase: "playoff",
          roundNumber: 6,
          stageName: "Final",
          pair1Id: "",
          pair2Id: "",
          courtId: "",
          date: dateString,
          time: "21:00",
          status: "pending",
          scoreSummary: "Por jugar",
          winnerPairId: "",
          category: selectedCategory
        });

        await Promise.all(allGeneratedMatches.map(m => repository.saveMatch(m)));

        if (tournament.status === "registration") {
          const updatedTournament: Tournament = {
            ...tournament,
            status: "in_progress"
          };
          await repository.saveTournament(updatedTournament);
        }

        await repository.addNotification(
          "Torneo Iniciado - SRTC 32", 
          `El Torneo SRTC 32 para la categoría '${selectedCategory}' se ha iniciado con éxito. Se pre-generaron todas las llaves y partidos hasta la Final.`,
          "success"
        );

        loadAllData();
        setActiveTab("matches");
        return;
      }

      const isSRTC24 = sortedPairs.length === 24;
      if (isSRTC24) {
        const allGeneratedMatches: Match[] = [];
        const dateString = tournament?.startDate || new Date().toISOString().split("T")[0];
        const cleanCat = selectedCategory.replace(/[^a-zA-Z0-9]/g, "");
        const maxCourts = Math.max(1, Number(tournament.numCourts || 3));

        // 1. Fase de grupos: 8 grupos de 3 parejas (A-H)
        const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
        for (let gIdx = 0; gIdx < 8; gIdx++) {
          const letter = letters[gIdx];
          const gPairs = [
            sortedPairs[gIdx * 3],
            sortedPairs[gIdx * 3 + 1],
            sortedPairs[gIdx * 3 + 2]
          ];

          // Partido 1: P1 vs P2
          allGeneratedMatches.push({
            id: `match_${tournamentId}_srtc24_${cleanCat}_g_${letter}_m1`,
            tournamentId,
            phase: "group",
            roundNumber: 1,
            stageName: `Grupo ${letter}`,
            pair1Id: gPairs[0].id,
            pair2Id: gPairs[1].id,
            courtId: gIdx < maxCourts ? `court_${(gIdx % maxCourts) + 1}` : "court_1",
            date: dateString,
            time: `${16 + Math.floor(gIdx / 3)}:00`,
            status: "pending",
            scoreSummary: "Por jugar",
            winnerPairId: "",
            category: selectedCategory
          });

          // Partido 2: P1 vs P3
          allGeneratedMatches.push({
            id: `match_${tournamentId}_srtc24_${cleanCat}_g_${letter}_m2`,
            tournamentId,
            phase: "group",
            roundNumber: 2,
            stageName: `Grupo ${letter}`,
            pair1Id: gPairs[0].id,
            pair2Id: gPairs[2].id,
            courtId: gIdx < maxCourts ? `court_${((gIdx + 1) % maxCourts) + 1}` : "court_1",
            date: dateString,
            time: `${17 + Math.floor(gIdx / 3)}:00`,
            status: "pending",
            scoreSummary: "Por jugar",
            winnerPairId: "",
            category: selectedCategory
          });

          // Partido 3: P2 vs P3
          allGeneratedMatches.push({
            id: `match_${tournamentId}_srtc24_${cleanCat}_g_${letter}_m3`,
            tournamentId,
            phase: "group",
            roundNumber: 3,
            stageName: `Grupo ${letter}`,
            pair1Id: gPairs[1].id,
            pair2Id: gPairs[2].id,
            courtId: gIdx < maxCourts ? `court_${((gIdx + 2) % maxCourts) + 1}` : "court_1",
            date: dateString,
            time: `${18 + Math.floor(gIdx / 3)}:00`,
            status: "pending",
            scoreSummary: "Por jugar",
            winnerPairId: "",
            category: selectedCategory
          });
        }

        // 2. Ronda Clasificatoria (cruces automáticos, Partidos 25 a 32)
        for (let pNum = 25; pNum <= 32; pNum++) {
          allGeneratedMatches.push({
            id: `match_${tournamentId}_srtc24_${cleanCat}_rc_p${pNum}`,
            tournamentId,
            phase: "playoff",
            roundNumber: 4,
            stageName: `Ronda Clasificatoria - P${pNum}`,
            pair1Id: "",
            pair2Id: "",
            courtId: "",
            date: dateString,
            time: "19:00",
            status: "pending",
            scoreSummary: "Por jugar",
            winnerPairId: "",
            category: selectedCategory
          });
        }

        // 3. Cuartos de final (4 partidos, Partidos 33 a 36)
        for (let i = 1; i <= 4; i++) {
          allGeneratedMatches.push({
            id: `match_${tournamentId}_srtc24_${cleanCat}_q_m${i}`,
            tournamentId,
            phase: "playoff",
            roundNumber: 5,
            stageName: `Cuartos de Final ${i}`,
            pair1Id: "",
            pair2Id: "",
            courtId: "",
            date: dateString,
            time: "20:00",
            status: "pending",
            scoreSummary: "Por jugar",
            winnerPairId: "",
            category: selectedCategory
          });
        }

        // 4. Semifinales (2 partidos, Partidos 37 y 38)
        for (let i = 1; i <= 2; i++) {
          allGeneratedMatches.push({
            id: `match_${tournamentId}_srtc24_${cleanCat}_sf_m${i}`,
            tournamentId,
            phase: "playoff",
            roundNumber: 6,
            stageName: `Semifinal ${i}`,
            pair1Id: "",
            pair2Id: "",
            courtId: "",
            date: dateString,
            time: "20:30",
            status: "pending",
            scoreSummary: "Por jugar",
            winnerPairId: "",
            category: selectedCategory
          });
        }

        // 5. Final (1 partido, Partido 39)
        allGeneratedMatches.push({
          id: `match_${tournamentId}_srtc24_${cleanCat}_final`,
          tournamentId,
          phase: "playoff",
          roundNumber: 7,
          stageName: "Final",
          pair1Id: "",
          pair2Id: "",
          courtId: "",
          date: dateString,
          time: "21:30",
          status: "pending",
          scoreSummary: "Por jugar",
          winnerPairId: "",
          category: selectedCategory
        });

        await Promise.all(allGeneratedMatches.map(m => repository.saveMatch(m)));

        if (tournament.status === "registration") {
          const updatedTournament: Tournament = {
            ...tournament,
            status: "in_progress"
          };
          await repository.saveTournament(updatedTournament);
        }

        await repository.addNotification(
          "Torneo Iniciado - SRTC 24", 
          `El Torneo SRTC 24 para la categoría '${selectedCategory}' se ha iniciado con éxito. Se generaron las 8 zonas de 3 y todos los placeholders de playoff.`,
          "success"
        );

        loadAllData();
        setActiveTab("matches");
        return;
      }

      // Standard Dos Vidas Generation (Fallback for other counts)
      const allGeneratedMatches = generateNextDosVidasRound(sortedPairs, [], tournamentId, selectedCategory, tournament.startDate);

      // Force save all matches to repository
      await Promise.all(allGeneratedMatches.map(m => repository.saveMatch(m)));

      // Pre-generate all empty playoff phases (16avos, 8avos, 4tos, semis, final)
      const emptyPlayoffs = preGeneratePlayoffsHelper(tournamentId, selectedCategory, sortedPairs.length);
      await Promise.all(emptyPlayoffs.map(m => repository.saveMatch(m)));

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
      alert("Ocurrió un error en el sorteo: " + (err?.message || String(err)));
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

    // Check if the court is occupied at the scheduled date and time by another non-finished match
    const occupying = getOccupyingMatch(selectedCourtId, selectedDate, selectedTime, activeAssignCourtMatch.id);
    if (occupying) {
      const courtName = courts.find(c => c.id === selectedCourtId)?.name || "Cancha";
      triggerInAppAlert(
        "error",
        "Conflicto de Pista",
        `La cancha ${courtName} ya se encuentra ocupada por el partido ${getPairName(occupying.pair1Id)} vs ${getPairName(occupying.pair2Id)} el día ${formatDate(selectedDate)} a las ${occupying.time}. Elija otro horario o cancha.`
      );
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

    const courtName = courts.find(c => c.id === selectedCourtId)?.name || "Cancha";
    triggerInAppAlert(
      "success",
      "Asignación Exitosa",
      `Se ha reservado correctamente la cancha ${courtName} para el partido de ${getPairName(updatedMatch.pair1Id)} vs ${getPairName(updatedMatch.pair2Id)} el día ${formatDate(selectedDate)} a las ${selectedTime}.`
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
    } else if (totalPairsCount <= 16) {
      bracketSize = 8;
      stageLabel = "Cuartos de Final";
    } else {
      bracketSize = 16;
      stageLabel = "Octavos de Final";
    }

    // Qualify the top N pairs from our standings table
    const qualifiedIds = stands.slice(0, bracketSize).map(s => s.pairId);

    if (qualifiedIds.length < 2) {
      alert("No hay suficientes parejas para generar los playoffs. Se necesitan al menos 2.");
      return;
    }

    // Load active playoff matches for this tournament and category
    let playoffMatches = matches.filter(m => m.tournamentId === tournamentId && m.category === selectedCategory && m.phase === "playoff");
    
    // Fallback if none exist
    if (playoffMatches.length === 0) {
      playoffMatches = preGeneratePlayoffsHelper(tournamentId, selectedCategory, totalPairsCount);
    }

    // Reset all playoff matches to blank/initial values
    const resetMatches = playoffMatches.map(m => ({
      ...m,
      pair1Id: "",
      pair2Id: "",
      winnerPairId: "",
      status: "pending" as Match["status"],
      scoreSummary: "Por jugar"
    }));

    // Seeding templates
    const seeds16 = [[0, 31], [15, 16], [8, 23], [7, 24], [4, 27], [11, 20], [12, 19], [3, 28], [2, 29], [13, 18], [10, 21], [5, 26], [6, 25], [9, 22], [14, 17], [1, 30]];
    const seeds8 = [[0, 15], [7, 8], [4, 11], [3, 12], [2, 13], [5, 10], [6, 9], [1, 14]];
    const seeds4 = [[0, 7], [3, 4], [2, 5], [1, 6]];

    // Populate the starting round
    const updatedPlayoffs = [...resetMatches];

    if (bracketSize === 16) {
      // Starting round is Octavos (which is the 8-matches round of 16)
      for (let idx = 0; idx < 8; idx++) {
        const mObj = updatedPlayoffs.find(m => m.stageName === `Octavos de Final ${idx + 1}`);
        if (mObj) {
          const [s1, s2] = seeds8[idx];
          mObj.pair1Id = qualifiedIds[s1] || "";
          mObj.pair2Id = qualifiedIds[s2] || "";
        }
      }
    } else if (bracketSize === 8) {
      // Starting round is Cuartos de Final (4 matches)
      for (let idx = 0; idx < 4; idx++) {
        const mObj = updatedPlayoffs.find(m => m.stageName === `Cuartos de Final ${idx + 1}` || m.stageName === `Cuartos ${idx + 1}`);
        if (mObj) {
          const [s1, s2] = seeds4[idx];
          mObj.pair1Id = qualifiedIds[s1] || "";
          mObj.pair2Id = qualifiedIds[s2] || "";
        }
      }
    } else if (bracketSize === 4) {
      // Starting round is Semifinal
      const sf1 = updatedPlayoffs.find(m => m.stageName === "Semifinal 1");
      const sf2 = updatedPlayoffs.find(m => m.stageName === "Semifinal 2");
      if (sf1) {
        sf1.pair1Id = qualifiedIds[0] || "";
        sf1.pair2Id = qualifiedIds[3] || "";
      }
      if (sf2) {
        sf2.pair1Id = qualifiedIds[1] || "";
        sf2.pair2Id = qualifiedIds[2] || "";
      }
    } else if (bracketSize === 2) {
      // Starting round is Final
      const f = updatedPlayoffs.find(m => m.stageName === "Final");
      if (f) {
        f.pair1Id = qualifiedIds[0] || "";
        f.pair2Id = qualifiedIds[1] || "";
      }
    }

    // Save all updated playoff matches
    for (const pm of updatedPlayoffs) {
      await repository.saveMatch(pm);
    }

    await repository.addNotification(
      "Playoffs Generados",
      `Cuadro final de playoffs (${stageLabel}) para la categoría '${selectedCategory}' generado correctamente con las mejores ${qualifiedIds.length} parejas.`,
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
    const is32 = pairs.filter(p => p.category === m.category).length === 32;
    if (is32 && (stage.includes("octavos") || stage.includes("8avos"))) {
      return false;
    }
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

    const winnerName = getPairName(winnerId);
    const assignedCourtName = courts.find(c => c.id === activeScoreMatch.courtId)?.name || "";
    const courtMsg = assignedCourtName 
      ? `La cancha "${assignedCourtName}" ya se encuentra liberada y disponible para nuevos encuentros.` 
      : "La cancha queda liberada y disponible.";

    triggerInAppAlert(
      "success",
      "Partido Finalizado",
      `¡El encuentro ha concluido! Pareja ganadora: ${winnerName} (${scoreSummary}). ${courtMsg}`
    );

    // Handle progressions based on tournament configuration
    const isSRTC16 = pairs.filter(p => p.category === selectedCategory).length === 16;
    const isSRTC32 = pairs.filter(p => p.category === selectedCategory).length === 32;
    const isSRTC24 = pairs.filter(p => p.category === selectedCategory).length === 24;

    if (isSRTC16) {
      await handleSRTC16Progression(updatedMatch, winnerId);
    } else if (isSRTC32) {
      await handleSRTC32Progression(updatedMatch, winnerId);
    } else if (isSRTC24) {
      await handleSRTC24Progression(updatedMatch, winnerId);
    } else {
      // Handle Playoff progressions automatically if in bracket
      if (activeScoreMatch.phase === "playoff") {
        await handlePlayoffProgression(updatedMatch, winnerId);
      }

      // Automatically launch playoffs if this was the last group match and tournament type is "Grupos + Eliminatorias"
      if (activeScoreMatch.phase === "group" && tournament?.tournamentType === "Grupos + Eliminatorias") {
        const allCategoryMatches = [...matches.filter(m => m.id !== updatedMatch.id), updatedMatch]
          .filter(m => m.category === selectedCategory);
        const remainingGroupMatches = allCategoryMatches.filter(m => m.phase === "group" && m.status === "pending");
        
        if (remainingGroupMatches.length === 0) {
          const stands = calculateDosVidasStandings(pairs.filter(p => p.category === selectedCategory), allCategoryMatches.filter(m => m.phase === "group"), getPairName);
          const totalPairsCount = pairs.filter(p => p.category === selectedCategory).length;
          
          let bracketSize = 8;
          let stageLabel = "Cuartos de Final";
          if (totalPairsCount <= 4) {
            bracketSize = 2;
            stageLabel = "Final";
          } else if (totalPairsCount <= 9) {
            bracketSize = 4;
            stageLabel = "Semifinales";
          } else if (totalPairsCount <= 16) {
            bracketSize = 8;
            stageLabel = "Cuartos de Final";
          } else {
            bracketSize = 16;
            stageLabel = "Octavos de Final";
          }

          const qualifiedIds = stands.slice(0, bracketSize).map(s => s.pairId);
          if (qualifiedIds.length >= 2) {
            let playoffMatches = matches.filter(m => m.tournamentId === tournamentId && m.category === selectedCategory && m.phase === "playoff");
            if (playoffMatches.length === 0) {
              playoffMatches = preGeneratePlayoffsHelper(tournamentId, selectedCategory, totalPairsCount);
            }

            const resetMatches = playoffMatches.map(m => ({
              ...m,
              pair1Id: "",
              pair2Id: "",
              winnerPairId: "",
              status: "pending" as Match["status"],
              scoreSummary: "Por jugar"
            }));

            const seeds8 = [[0, 15], [7, 8], [4, 11], [3, 12], [2, 13], [5, 10], [6, 9], [1, 14]];
            const seeds4 = [[0, 7], [3, 4], [2, 5], [1, 6]];
            const updatedPlayoffs = [...resetMatches];

            if (bracketSize === 16) {
              for (let idx = 0; idx < 8; idx++) {
                const mObj = updatedPlayoffs.find(m => m.stageName === `Octavos de Final ${idx + 1}`);
                if (mObj) {
                  const [s1, s2] = seeds8[idx];
                  mObj.pair1Id = qualifiedIds[s1] || "";
                  mObj.pair2Id = qualifiedIds[s2] || "";
                }
              }
            } else if (bracketSize === 8) {
              for (let idx = 0; idx < 4; idx++) {
                const mObj = updatedPlayoffs.find(m => m.stageName === `Cuartos de Final ${idx + 1}` || m.stageName === `Cuartos ${idx + 1}`);
                if (mObj) {
                  const [s1, s2] = seeds4[idx];
                  mObj.pair1Id = qualifiedIds[s1] || "";
                  mObj.pair2Id = qualifiedIds[s2] || "";
                }
              }
            } else if (bracketSize === 4) {
              const sf1 = updatedPlayoffs.find(m => m.stageName === "Semifinal 1");
              const sf2 = updatedPlayoffs.find(m => m.stageName === "Semifinal 2");
              if (sf1) {
                sf1.pair1Id = qualifiedIds[0] || "";
                sf1.pair2Id = qualifiedIds[3] || "";
              }
              if (sf2) {
                sf2.pair1Id = qualifiedIds[1] || "";
                sf2.pair2Id = qualifiedIds[2] || "";
              }
            } else if (bracketSize === 2) {
              const f = updatedPlayoffs.find(m => m.stageName === "Final");
              if (f) {
                f.pair1Id = qualifiedIds[0] || "";
                f.pair2Id = qualifiedIds[1] || "";
              }
            }

            for (const pm of updatedPlayoffs) {
              await repository.saveMatch(pm);
            }

            await repository.addNotification(
              "Fase de Clasificación Completada",
              `Se han finalizado las rondas de grupo. Se clasificaron automáticamente las parejas y se completó la primera fase eliminatoria (${stageLabel}) para la categoría '${selectedCategory}'.`,
              "success"
            );
          }
        }
      }
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

  // SRTC 24 progression logic
  const handleSRTC24Progression = async (m: Match, winnerId: string) => {
    const allMatches = await repository.getMatches();
    const catMatches = allMatches.filter(x => x.tournamentId === m.tournamentId && x.category === m.category);

    const categoryPairs = pairs.filter(p => p.category === m.category);

    // 1. Fase de Grupos
    if (m.phase === "group") {
      // Verificamos si todos los de fase de grupo ya jugaron
      const groupMatches = catMatches.filter(x => x.phase === "group");
      const remainingGroup = groupMatches.filter(x => x.status === "pending" && x.id !== m.id);

      if (remainingGroup.length === 0) {
        // ¡La fase de grupos finalizó! Sincronizamos clasificados de cada grupo A-H
        const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
        const groupLeaders: { [letter: string]: { first: string; second: string } } = {};

        letters.forEach(letter => {
          const gMatches = groupMatches.filter(x => x.stageName === `Grupo ${letter}` || x.id === m.id && m.stageName === `Grupo ${letter}`);
          // Si el partido actual es del grupo actual, lo actualizamos en la lista de partidos a evaluar
          const finalGMatches = gMatches.map(gm => gm.id === m.id ? { ...gm, status: m.status, winnerPairId: m.winnerPairId, scoreSummary: m.scoreSummary } : gm);
          
          // Conseguir parejas del grupo
          const groupPairIds = new Set<string>();
          finalGMatches.forEach(gm => {
            if (gm.pair1Id) groupPairIds.add(gm.pair1Id);
            if (gm.pair2Id) groupPairIds.add(gm.pair2Id);
          });
          const groupPairs = categoryPairs.filter(p => groupPairIds.has(p.id));

          // Calcular tabla de posiciones de este grupo en base a los criterios oficiales (PG*2, PP*1, WO=0, etc.)
          const stands = calculateGroupStandings(groupPairs, finalGMatches, getPairName, true);
          
          groupLeaders[letter] = {
            first: stands[0]?.pairId || "",
            second: stands[1]?.pairId || ""
          };
        });

        // Ahora cruzamos los clasificados en la Ronda Clasificatoria (Partidos 25 a 32)
        // P25: 1ºA vs 2ºB
        const rc25 = catMatches.find(x => x.stageName.includes("P25") || x.id.endsWith("_rc_p25"));
        if (rc25) await repository.saveMatch({ ...rc25, pair1Id: groupLeaders["A"].first, pair2Id: groupLeaders["B"].second });

        // P26: 1ºB vs 2ºA
        const rc26 = catMatches.find(x => x.stageName.includes("P26") || x.id.endsWith("_rc_p26"));
        if (rc26) await repository.saveMatch({ ...rc26, pair1Id: groupLeaders["B"].first, pair2Id: groupLeaders["A"].second });

        // P27: 1ºC vs 2ºD
        const rc27 = catMatches.find(x => x.stageName.includes("P27") || x.id.endsWith("_rc_p27"));
        if (rc27) await repository.saveMatch({ ...rc27, pair1Id: groupLeaders["C"].first, pair2Id: groupLeaders["D"].second });

        // P28: 1ºD vs 2ºC
        const rc28 = catMatches.find(x => x.stageName.includes("P28") || x.id.endsWith("_rc_p28"));
        if (rc28) await repository.saveMatch({ ...rc28, pair1Id: groupLeaders["D"].first, pair2Id: groupLeaders["C"].second });

        // P29: 1ºE vs 2ºF
        const rc29 = catMatches.find(x => x.stageName.includes("P29") || x.id.endsWith("_rc_p29"));
        if (rc29) await repository.saveMatch({ ...rc29, pair1Id: groupLeaders["E"].first, pair2Id: groupLeaders["F"].second });

        // P30: 1ºF vs 2ºE
        const rc30 = catMatches.find(x => x.stageName.includes("P30") || x.id.endsWith("_rc_p30"));
        if (rc30) await repository.saveMatch({ ...rc30, pair1Id: groupLeaders["F"].first, pair2Id: groupLeaders["E"].second });

        // P31: 1ºG vs 2ºH
        const rc31 = catMatches.find(x => x.stageName.includes("P31") || x.id.endsWith("_rc_p31"));
        if (rc31) await repository.saveMatch({ ...rc31, pair1Id: groupLeaders["G"].first, pair2Id: groupLeaders["H"].second });

        // P32: 1ºH vs 2ºG
        const rc32 = catMatches.find(x => x.stageName.includes("P32") || x.id.endsWith("_rc_p32"));
        if (rc32) await repository.saveMatch({ ...rc32, pair1Id: groupLeaders["H"].first, pair2Id: groupLeaders["G"].second });

        await repository.addNotification(
          "Playoffs Armados",
          "La fase de grupos de 24 parejas ha concluido. El fixture ha clasificado automáticamente a los dos mejores de cada grupo y ha estructurado la Ronda Clasificatoria.",
          "info"
        );
      }
    }

    // 2. Ronda Clasificatoria (Partidos 25 al 32)
    if (m.phase === "playoff" && m.stageName.includes("Ronda Clasificatoria")) {
      const matchNum = Number(m.stageName.match(/P(\d+)/)?.[1]);
      if (matchNum) {
        // Determinar destino en Cuartos (Partidos 33 a 36)
        if (matchNum === 25) {
          const q1 = catMatches.find(x => x.stageName.includes("Cuartos de Final 1") || x.id.endsWith("_q_m1"));
          if (q1) await repository.saveMatch({ ...q1, pair1Id: winnerId });
        } else if (matchNum === 27) {
          const q1 = catMatches.find(x => x.stageName.includes("Cuartos de Final 1") || x.id.endsWith("_q_m1"));
          if (q1) await repository.saveMatch({ ...q1, pair2Id: winnerId });
        } else if (matchNum === 26) {
          const q2 = catMatches.find(x => x.stageName.includes("Cuartos de Final 2") || x.id.endsWith("_q_m2"));
          if (q2) await repository.saveMatch({ ...q2, pair1Id: winnerId });
        } else if (matchNum === 28) {
          const q2 = catMatches.find(x => x.stageName.includes("Cuartos de Final 2") || x.id.endsWith("_q_m2"));
          if (q2) await repository.saveMatch({ ...q2, pair2Id: winnerId });
        } else if (matchNum === 29) {
          const q3 = catMatches.find(x => x.stageName.includes("Cuartos de Final 3") || x.id.endsWith("_q_m3"));
          if (q3) await repository.saveMatch({ ...q3, pair1Id: winnerId });
        } else if (matchNum === 31) {
          const q3 = catMatches.find(x => x.stageName.includes("Cuartos de Final 3") || x.id.endsWith("_q_m3"));
          if (q3) await repository.saveMatch({ ...q3, pair2Id: winnerId });
        } else if (matchNum === 30) {
          const q4 = catMatches.find(x => x.stageName.includes("Cuartos de Final 4") || x.id.endsWith("_q_m4"));
          if (q4) await repository.saveMatch({ ...q4, pair1Id: winnerId });
        } else if (matchNum === 32) {
          const q4 = catMatches.find(x => x.stageName.includes("Cuartos de Final 4") || x.id.endsWith("_q_m4"));
          if (q4) await repository.saveMatch({ ...q4, pair2Id: winnerId });
        }
      }
    }

    // 3. Cuartos de final
    if (m.phase === "playoff" && m.stageName.includes("Cuartos de Final")) {
      const qNum = Number(m.stageName.match(/Cuartos de Final (\d+)/)?.[1]);
      if (qNum) {
        if (qNum === 1) {
          const sf1 = catMatches.find(x => x.stageName.includes("Semifinal 1") || x.id.endsWith("_sf_m1"));
          if (sf1) await repository.saveMatch({ ...sf1, pair1Id: winnerId });
        } else if (qNum === 3) {
          const sf1 = catMatches.find(x => x.stageName.includes("Semifinal 1") || x.id.endsWith("_sf_m1"));
          if (sf1) await repository.saveMatch({ ...sf1, pair2Id: winnerId });
        } else if (qNum === 2) {
          const sf2 = catMatches.find(x => x.stageName.includes("Semifinal 2") || x.id.endsWith("_sf_m2"));
          if (sf2) await repository.saveMatch({ ...sf2, pair1Id: winnerId });
        } else if (qNum === 4) {
          const sf2 = catMatches.find(x => x.stageName.includes("Semifinal 2") || x.id.endsWith("_sf_m2"));
          if (sf2) await repository.saveMatch({ ...sf2, pair2Id: winnerId });
        }
      }
    }

    // 4. Semifinales
    if (m.phase === "playoff" && m.stageName.includes("Semifinal")) {
      const sfNum = Number(m.stageName.match(/Semifinal (\d+)/)?.[1]);
      if (sfNum) {
        const finalMatch = catMatches.find(x => x.stageName === "Final" || x.id.endsWith("_final"));
        if (finalMatch) {
          if (sfNum === 1) {
            await repository.saveMatch({ ...finalMatch, pair1Id: winnerId });
          } else {
            await repository.saveMatch({ ...finalMatch, pair2Id: winnerId });
          }
        }
      }
    }
  };

  // SRTC 16 progression logic
  const handleSRTC16Progression = async (m: Match, winnerId: string) => {
    const allMatches = await repository.getMatches();
    const catMatches = allMatches.filter(x => x.tournamentId === m.tournamentId && x.category === m.category);

    const loserId = m.pair1Id === winnerId ? m.pair2Id : m.pair1Id;

    // Ronda 1 matches -> progress to Ronda 2
    if (m.roundNumber === 1 && m.phase === "group") {
      const stage = m.stageName; // e.g., "Ronda 1 - Grupo A"
      const letter = stage.charAt(stage.length - 1); // e.g., "A"

      if (letter === "A") {
        const p9 = catMatches.find(x => x.stageName === "Ronda 2 - Partido 9");
        if (p9) await repository.saveMatch({ ...p9, pair1Id: winnerId });
        const p10 = catMatches.find(x => x.stageName === "Ronda 2 - Partido 10");
        if (p10) await repository.saveMatch({ ...p10, pair2Id: loserId });
      } else if (letter === "B") {
        const p10 = catMatches.find(x => x.stageName === "Ronda 2 - Partido 10");
        if (p10) await repository.saveMatch({ ...p10, pair1Id: winnerId });
        const p9 = catMatches.find(x => x.stageName === "Ronda 2 - Partido 9");
        if (p9) await repository.saveMatch({ ...p9, pair2Id: loserId });
      } else if (letter === "C") {
        const p11 = catMatches.find(x => x.stageName === "Ronda 2 - Partido 11");
        if (p11) await repository.saveMatch({ ...p11, pair1Id: winnerId });
        const p12 = catMatches.find(x => x.stageName === "Ronda 2 - Partido 12");
        if (p12) await repository.saveMatch({ ...p12, pair2Id: loserId });
      } else if (letter === "D") {
        const p12 = catMatches.find(x => x.stageName === "Ronda 2 - Partido 12");
        if (p12) await repository.saveMatch({ ...p12, pair1Id: winnerId });
        const p11 = catMatches.find(x => x.stageName === "Ronda 2 - Partido 11");
        if (p11) await repository.saveMatch({ ...p11, pair2Id: loserId });
      } else if (letter === "E") {
        const p13 = catMatches.find(x => x.stageName === "Ronda 2 - Partido 13");
        if (p13) await repository.saveMatch({ ...p13, pair1Id: winnerId });
        const p14 = catMatches.find(x => x.stageName === "Ronda 2 - Partido 14");
        if (p14) await repository.saveMatch({ ...p14, pair2Id: loserId });
      } else if (letter === "F") {
        const p14 = catMatches.find(x => x.stageName === "Ronda 2 - Partido 14");
        if (p14) await repository.saveMatch({ ...p14, pair1Id: winnerId });
        const p13 = catMatches.find(x => x.stageName === "Ronda 2 - Partido 13");
        if (p13) await repository.saveMatch({ ...p13, pair2Id: loserId });
      } else if (letter === "G") {
        const p15 = catMatches.find(x => x.stageName === "Ronda 2 - Partido 15");
        if (p15) await repository.saveMatch({ ...p15, pair1Id: winnerId });
        const p16 = catMatches.find(x => x.stageName === "Ronda 2 - Partido 16");
        if (p16) await repository.saveMatch({ ...p16, pair2Id: loserId });
      } else if (letter === "H") {
        const p16 = catMatches.find(x => x.stageName === "Ronda 2 - Partido 16");
        if (p16) await repository.saveMatch({ ...p16, pair1Id: winnerId });
        const p15 = catMatches.find(x => x.stageName === "Ronda 2 - Partido 15");
        if (p15) await repository.saveMatch({ ...p15, pair2Id: loserId });
      }
    }

    // Ronda 2 matches -> progress to Cuartos de final
    else if (m.roundNumber === 2 && m.phase === "group") {
      const matchNum = parseInt(m.stageName.replace("Ronda 2 - Partido ", "")) || 9;
      const targetQNum = Math.floor((matchNum - 9) / 2) + 1; // 1 to 4
      const targetQ = catMatches.find(x => x.stageName === `Cuartos de Final ${targetQNum}` || x.stageName === `Cuartos ${targetQNum}`);
      if (targetQ) {
        const isPair1 = (matchNum % 2) !== 0; // 9, 11, 13, 15 are odd -> pair1
        if (isPair1) {
          await repository.saveMatch({ ...targetQ, pair1Id: winnerId });
        } else {
          await repository.saveMatch({ ...targetQ, pair2Id: winnerId });
        }
      }
    }

    // Cuartos de Final -> progress to Semifinal
    else if (m.phase === "playoff" && (m.stageName.includes("Cuartos") || m.stageName.includes("4tos"))) {
      const matchNum = parseInt(m.stageName.replace("Cuartos de Final ", "").replace("Cuartos ", "")) || 1;
      const sf1 = catMatches.find(x => x.stageName === "Semifinal 1");
      const sf2 = catMatches.find(x => x.stageName === "Semifinal 2");

      if (matchNum === 1 && sf1) {
        await repository.saveMatch({ ...sf1, pair1Id: winnerId });
      } else if (matchNum === 2 && sf1) {
        await repository.saveMatch({ ...sf1, pair2Id: winnerId });
      } else if (matchNum === 3 && sf2) {
        await repository.saveMatch({ ...sf2, pair1Id: winnerId });
      } else if (matchNum === 4 && sf2) {
        await repository.saveMatch({ ...sf2, pair2Id: winnerId });
      }
    }

    // Semifinales -> progress to Final
    else if (m.phase === "playoff" && m.stageName.startsWith("Semifinal")) {
      const matchNum = parseInt(m.stageName.replace("Semifinal ", "")) || 1;
      const finalMatch = catMatches.find(x => x.stageName === "Final");
      if (finalMatch) {
        if (matchNum === 1) {
          await repository.saveMatch({ ...finalMatch, pair1Id: winnerId });
        } else if (matchNum === 2) {
          await repository.saveMatch({ ...finalMatch, pair2Id: winnerId });
        }
      }
    }
  };

  // SRTC 32 progression logic
  const handleSRTC32Progression = async (m: Match, winnerId: string) => {
    const allMatches = await repository.getMatches();
    const catMatches = allMatches.filter(x => x.tournamentId === m.tournamentId && x.category === m.category);

    const loserId = m.pair1Id === winnerId ? m.pair2Id : m.pair1Id;

    // Ronda 1 matches -> progress to Ronda 2
    if (m.roundNumber === 1 && m.phase === "group") {
      const stage = m.stageName; // e.g., "Ronda 1 - Grupo A"
      const letter = stage.charAt(stage.length - 1); // e.g., "A" to "P"

      // Letter mapping to matches 17 to 32:
      const mappings: { [key: string]: { winMatch: number; winPos: 1 | 2; loseMatch: number; losePos: 1 | 2 } } = {
        'A': { winMatch: 17, winPos: 1, loseMatch: 18, losePos: 2 },
        'B': { winMatch: 18, winPos: 1, loseMatch: 17, losePos: 2 },
        'C': { winMatch: 19, winPos: 1, loseMatch: 20, losePos: 2 },
        'D': { winMatch: 20, winPos: 1, loseMatch: 19, losePos: 2 },
        'E': { winMatch: 21, winPos: 1, loseMatch: 22, losePos: 2 },
        'F': { winMatch: 22, winPos: 1, loseMatch: 21, losePos: 2 },
        'G': { winMatch: 23, winPos: 1, loseMatch: 24, losePos: 2 },
        'H': { winMatch: 24, winPos: 1, loseMatch: 23, losePos: 2 },
        'I': { winMatch: 25, winPos: 1, loseMatch: 26, losePos: 2 },
        'J': { winMatch: 26, winPos: 1, loseMatch: 25, losePos: 2 },
        'K': { winMatch: 27, winPos: 1, loseMatch: 28, losePos: 2 },
        'L': { winMatch: 28, winPos: 1, loseMatch: 27, losePos: 2 },
        'M': { winMatch: 29, winPos: 1, loseMatch: 30, losePos: 2 },
        'N': { winMatch: 30, winPos: 1, loseMatch: 29, losePos: 2 },
        'O': { winMatch: 31, winPos: 1, loseMatch: 32, losePos: 2 },
        'P': { winMatch: 32, winPos: 1, loseMatch: 31, losePos: 2 }
      };

      const map = mappings[letter];
      if (map) {
        const mw = catMatches.find(x => x.stageName === `Ronda 2 - Partido ${map.winMatch}`);
        if (mw) {
          if (map.winPos === 1) await repository.saveMatch({ ...mw, pair1Id: winnerId });
          else await repository.saveMatch({ ...mw, pair2Id: winnerId });
        }
        const ml = catMatches.find(x => x.stageName === `Ronda 2 - Partido ${map.loseMatch}`);
        if (ml) {
          if (map.losePos === 1) await repository.saveMatch({ ...ml, pair1Id: loserId });
          else await repository.saveMatch({ ...ml, pair2Id: loserId });
        }
      }
    }

    // Ronda 2 matches -> progress to Octavos de final
    else if (m.roundNumber === 2 && m.phase === "group") {
      const matchNum = parseInt(m.stageName.replace("Ronda 2 - Partido ", "")) || 17;
      const targetOctNum = Math.floor((matchNum - 17) / 2) + 1; // 1 to 8
      const targetOct = catMatches.find(x => x.stageName === `Octavos de Final ${targetOctNum}` || x.stageName === `Octavos ${targetOctNum}`);
      if (targetOct) {
        const isPair1 = (matchNum % 2) !== 0; // odd is pair1Id
        if (isPair1) {
          await repository.saveMatch({ ...targetOct, pair1Id: winnerId });
        } else {
          await repository.saveMatch({ ...targetOct, pair2Id: winnerId });
        }
      }
    }

    // Octavos de final -> progress to Cuartos de final
    else if (m.phase === "playoff" && (m.stageName.includes("Octavos") || m.stageName.includes("8avos"))) {
      const matchNum = parseInt(m.stageName.replace("Octavos de Final ", "").replace("Octavos ", "").replace("8avos ", "")) || 1;
      const targetQNum = Math.floor((matchNum - 1) / 2) + 1; // 1 to 4
      const targetQ = catMatches.find(x => x.stageName === `Cuartos de Final ${targetQNum}` || x.stageName === `Cuartos ${targetQNum}`);
      if (targetQ) {
        const isPair1 = (matchNum % 2) !== 0; // odd is pair1Id
        if (isPair1) {
          await repository.saveMatch({ ...targetQ, pair1Id: winnerId });
        } else {
          await repository.saveMatch({ ...targetQ, pair2Id: winnerId });
        }
      }
    }

    // Cuartos de Final -> progress to Semifinal
    else if (m.phase === "playoff" && (m.stageName.includes("Cuartos") || m.stageName.includes("4tos"))) {
      const matchNum = parseInt(m.stageName.replace("Cuartos de Final ", "").replace("Cuartos ", "").replace("4tos ", "")) || 1;
      const sf1 = catMatches.find(x => x.stageName === "Semifinal 1");
      const sf2 = catMatches.find(x => x.stageName === "Semifinal 2");

      if (matchNum === 1 && sf1) {
        await repository.saveMatch({ ...sf1, pair1Id: winnerId });
      } else if (matchNum === 2 && sf1) {
        await repository.saveMatch({ ...sf1, pair2Id: winnerId });
      } else if (matchNum === 3 && sf2) {
        await repository.saveMatch({ ...sf2, pair1Id: winnerId });
      } else if (matchNum === 4 && sf2) {
        await repository.saveMatch({ ...sf2, pair2Id: winnerId });
      }
    }

    // Semifinales -> progress to Final
    else if (m.phase === "playoff" && m.stageName.startsWith("Semifinal")) {
      const matchNum = parseInt(m.stageName.replace("Semifinal ", "")) || 1;
      const finalMatch = catMatches.find(x => x.stageName === "Final");
      if (finalMatch) {
        if (matchNum === 1) {
          await repository.saveMatch({ ...finalMatch, pair1Id: winnerId });
        } else if (matchNum === 2) {
          await repository.saveMatch({ ...finalMatch, pair2Id: winnerId });
        }
      }
    }
  };

  // Open Tourney Finish interactive modal
  const handleOpenFinishModal = () => {
    if (!tournament) return;

    // Get all categories that have at least one playoff match
    const playoffCategories = Array.from(new Set(matches.filter(m => m.phase === "playoff").map(m => m.category || ""))).filter(Boolean) as string[];

    if (playoffCategories.length === 0) {
      setFinishModalError("No se encontraron esquemas ni cuadros de playoff en el torneo para poder finalizarlo.");
      setFinishModalWarning(null);
      setFinishModalPayload({ completedCategories: [] });
      setFinishModalTitle("No se puede Finalizar");
      setShowFinishModal(true);
      return;
    }

    // Check if final matches of all these categories are completed
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

    setFinishModalError(null);
    setFinishModalPayload({ completedCategories });

    if (pendingCategories.length > 0) {
      setFinishModalTitle("⚠️ Finalizar Torneo (Pendientes)");
      setFinishModalWarning(
        `Atención: Las siguientes categorías aún no tienen su partido Final definido o concluido: ${pendingCategories.join(", ")}.`
      );
    } else {
      setFinishModalTitle("🏆 Finalizar Torneo");
      setFinishModalWarning(null);
    }
    setShowFinishModal(true);
  };

  // Close Tournament fully and trigger accumulated ranking points across categories that have played out
  const executeFinishTournament = async () => {
    if (!tournament) return;
    const completedCategories = finishModalPayload?.completedCategories || [];

    setLoading(true);
    setShowFinishModal(false);
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
        "Torneo Finalizado!",
        `Torneo finalizado con éxito. Los puntos de las categorías completadas se han sumado y acreditado en el Ránking Anual.`,
        "success"
      );

      loadAllData();
    } catch (error) {
      console.error("Error closing tournament:", error);
      await repository.addNotification(
        "Error al finalizar",
        "Ocurrió un error al intentar finalizar el torneo.",
        "warning"
      );
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
  const availablePlayersP1 = players.filter(p => !registeredPlayerIds.has(p.id) && p.category === selectedCategory);
  const availablePlayersP2 = players.filter(p => !registeredPlayerIds.has(p.id) && p.id !== p1Select && p.category === selectedCategory);
  const categoryPlayers = players.filter(p => p.category === selectedCategory);
  const unregisteredCategoryPlayers = categoryPlayers.filter(p => !registeredPlayerIds.has(p.id));
  const hasMatchesForCategory = matches.some(m => m.category === selectedCategory);
  const isTournamentCompleted = tournament?.status === "completed";

  if (!tournament) return null;

  return (
    <div className="space-y-6">
      
      {viewMode === "isolated" ? (
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-20 animate-fade-in">
          
          {/* Light Header (Style A) */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="bg-[#d4fc34]/15 text-[#d4fc34] border border-[#d4fc34]/20 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest font-mono">
                  OFFICIAL LIVE SHEET
                </span>
                <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest font-mono">
                  {selectedCategory.toUpperCase()}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-wider text-white flex items-center gap-2.5">
                {activeTab === "inscriptions" ? (
                  <>
                    <ClipboardList className="w-7 h-7 text-[#d4fc34]" />
                    <span>Inscripciones</span>
                  </>
                ) : activeTab === "matches" ? (
                  <>
                    <Calendar className="w-7 h-7 text-[#d4fc34]" />
                    <span>Partidos</span>
                  </>
                ) : activeTab === "standings" ? (
                  <>
                    <BarChart2 className="w-7 h-7 text-[#d4fc34]" />
                    <span>Posiciones</span>
                  </>
                ) : (
                  <>
                    <GitBranch className="w-7 h-7 text-[#d4fc34]" />
                    <span>Cuadros</span>
                  </>
                )}
              </h1>
              <p className="text-xs text-slate-400">
                {activeTab === "inscriptions" ? "Lista oficial de parejas inscritas y cargadas en esta categoría para este torneo." :
                 activeTab === "matches" ? "Cronograma oficial de juego, asignación de pistas y carga de resultados en tiempo real." :
                 activeTab === "standings" ? "Tabla de posiciones oficiales, de zonas y clasificación de la categoría activa." :
                 "Cuadros de llaves principales, cruces directos y fase de eliminación playoffs."}
              </p>
            </div>

            <div className="self-start md:self-center">
            </div>
          </div>
            {/* COMPACT CATEGORY SELECTOR IN ISOLATED VIEW */}
            <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2 scrollbar-none border-b border-slate-900">
              <span className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-widest shrink-0 mr-1">
                Categoría activa:
              </span>
              {ALL_PADEL_CATEGORIES.map(cat => {
                const catPairs = pairs.filter(p => p.category === cat);
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition border shrink-0 cursor-pointer ${
                      active
                        ? "bg-[#d4fc34]/15 text-[#d4fc34] border-[#d4fc34]/40 font-black"
                        : "bg-slate-950/60 text-slate-400 border-slate-900 hover:text-slate-200 hover:border-slate-800"
                    }`}
                  >
                    <span>{cat}</span>
                    {catPairs.length > 0 && (
                      <span className="ml-1 bg-[#d4fc34] text-slate-950 font-black px-1 rounded-full text-[8px]">
                        {catPairs.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* DIRECT NAVIGATION TABS */}
            <div className="flex gap-2 border-b border-slate-850 pb-px overflow-x-auto scrollbar-none w-full">
              {[
                { id: "inscriptions", label: "Inscripciones", icon: ClipboardList },
                { id: "matches", label: "Partidos", icon: Calendar },
                { id: "standings", label: "Posiciones", icon: BarChart2 },
                { id: "playoffs", label: "Cuadros", icon: GitBranch },
              ].map(tab => {
                const isDisabled = (tab.id === "standings" || tab.id === "playoffs" || tab.id === "matches") && matches.filter(m => m.category === selectedCategory).length === 0;
                return (
                  <button
                    key={tab.id}
                    title={isDisabled ? "Disponible después del sorteo" : ""}
                    onClick={() => {
                      if (isDisabled) return;
                      setActiveTab(tab.id as any);
                    }}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-lg transition border-b-2 shrink-0 ${
                      isDisabled
                        ? "text-slate-600 border-transparent opacity-40 cursor-not-allowed select-none"
                        : activeTab === tab.id
                        ? "text-[#d4fc34] border-[#d4fc34] bg-slate-900/40"
                        : "text-slate-400 border-transparent hover:text-slate-200"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* COMPONENT CONDITIONAL RENDERING */}
            <div className="pt-2">
              {activeTab === "inscriptions" && (
                <InscriptionsTab
                  tournament={tournament}
                  pairs={pairs}
                  players={players}
                  selectedCategory={selectedCategory}
                  userRole={userRole}
                  isTournamentCompleted={isTournamentCompleted}
                  unregisteredCategoryPlayers={unregisteredCategoryPlayers}
                  availablePlayersP1={availablePlayersP1}
                  availablePlayersP2={availablePlayersP2}
                  p1Select={p1Select}
                  setP1Select={setP1Select}
                  p2Select={p2Select}
                  setP2Select={setP2Select}
                  hasMatchesForCategory={hasMatchesForCategory}
                  handleOpenPrintSheet={handleOpenPrintSheet}
                  handleAutoPairRemaining={handleAutoPairRemaining}
                  getPairName={getPairName}
                  handleDeletePair={handleDeletePair}
                  handleRegisterPair={handleRegisterPair}
                  handleExecuteDraw={handleExecuteDraw}
                />
              )}

              {activeTab === "matches" && (
                <MatchesTab
                  tournament={tournament}
                  pairs={pairs}
                  matches={matches}
                  courts={courts}
                  selectedCategory={selectedCategory}
                  userRole={userRole}
                  fixtureFilter={fixtureFilter}
                  setFixtureFilter={setFixtureFilter}
                  getPairName={getPairName}
                  handleOpenCourtAssigner={handleOpenCourtAssigner}
                  handleOpenScorer={handleOpenScorer}
                  setTempNumCourts={setTempNumCourts}
                  setIsEditNumCourtsOpen={setIsEditNumCourtsOpen}
                  handleAutoAssignCourts={handleAutoAssignCourts}
                  handleResetCategory={handleResetCategory}
                />
              )}

              {activeTab === "standings" && (
                <StandingsTab
                  tournament={tournament}
                  pairs={pairs}
                  matches={matches}
                  selectedCategory={selectedCategory}
                  userRole={userRole}
                  getPairName={getPairName}
                  handleGenerateNextRound={handleGenerateNextRound}
                  handleLaunchPlayoffs={handleLaunchPlayoffs}
                />
              )}

              {activeTab === "playoffs" && (
                <PlayoffsTab
                  tournament={tournament}
                  pairs={pairs}
                  matches={matches}
                  players={players}
                  selectedCategory={selectedCategory}
                  userRole={userRole}
                  handleOpenScorer={handleOpenScorer}
                />
              )}
            </div>
          </div>
      ) : (
        <TournamentDashboardView
          tournament={tournament}
          pairs={pairs}
          matches={matches}
          courts={courts}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          setActiveTab={setActiveTab}
          setViewMode={setViewMode}
          userRole={userRole}
          onBack={onBack}
          handleOpenFinishModal={handleOpenFinishModal}
        />
      )}

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
                      <option key={c.id} value={c.id} className={occupying ? "text-rose-450 bg-rose-950/10" : ""}>
                        {c.name} — {c.club} {occupying ? `⚠️ [OCUPADA: ${getPairName(occupying.pair1Id)} vs ${getPairName(occupying.pair2Id)}]` : ""}
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

      {/* CONFIRM DELETE PAIR MODAL */}
      {pairToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-[#0f172a] border border-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-white text-base">
                ¿Desinscribir Pareja?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                ¿Estás seguro de que deseas de-inscribir a la pareja <span className="text-white font-semibold">{pairToDelete.name}</span> de esta categoría? Esta acción es irreversible.
              </p>
            </div>
            
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setPairToDelete(null)}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-350 text-xs font-bold px-4 py-2.5 rounded-lg border border-slate-800 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeDeletePair}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition cursor-pointer"
              >
                De-inscribir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FINALIZAR TORNEO MODAL */}
      {showFinishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <span className="font-extrabold text-sm text-white flex items-center gap-1.5 font-display uppercase tracking-wider">
                {finishModalTitle || "🏆 Finalizar Torneo"}
              </span>
              <button 
                onClick={() => setShowFinishModal(false)} 
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 bg-slate-900">
              {finishModalError ? (
                <div className="text-xs text-red-500 bg-red-950/20 border border-red-900/30 p-3 rounded-lg leading-relaxed">
                  {finishModalError}
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    Al finalizar el torneo, su estado cambiará permanentemente a <span className="text-[#d4fc34] font-bold">Finalizado / Cerrado</span>. Además, se calcularán y otorgarán los puntos de clasificación a los jugadores del ranking en base a los resultados de las finales concluidas.
                  </p>

                  {finishModalWarning && (
                    <div className="text-xs text-amber-400 bg-amber-950/20 border border-amber-900/30 p-3 rounded-lg leading-relaxed">
                      {finishModalWarning}
                    </div>
                  )}

                  {finishModalPayload && finishModalPayload.completedCategories.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">
                        Categorías Concluidas que sumarán puntos
                      </span>
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                        {finishModalPayload.completedCategories.map(cat => (
                          <div key={cat} className="flex justify-between items-center text-xs text-slate-200">
                            <span className="text-[#d4fc34] font-semibold">• {cat}</span>
                            <span className="text-slate-400 text-[10px] font-mono">+100 Campeón / +75 Sub / +50 SF / +25 QF</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {finishModalPayload && finishModalPayload.completedCategories.length === 0 && (
                    <p className="text-xs text-amber-400 font-mono bg-amber-950/15 border border-amber-900/20 p-3 rounded-lg">
                      ⚠️ Ninguna categoría tiene su Final concluida, por lo que no se otorgarán puntos de ranking para ningún jugador.
                    </p>
                  )}
                </>
              )}

              <div className="pt-2 flex gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setShowFinishModal(false)}
                  className="flex-1 bg-slate-800 text-slate-300 py-2.5 rounded-lg font-bold cursor-pointer transition hover:bg-slate-750"
                >
                  Cancelar
                </button>
                {!finishModalError && (
                  <button
                    type="button"
                    onClick={executeFinishTournament}
                    className="flex-1 bg-[#d4fc34] hover:bg-[#c5f015] text-slate-950 py-2.5 rounded-xl font-black uppercase tracking-wider cursor-pointer font-sans"
                  >
                    Confirmar y Finalizar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM FLOATING TOAST NOTIFICATION */}
      {inAppAlert && inAppAlert.visible && (
        <div className="fixed top-6 right-6 z-[250] max-w-md w-full bg-slate-900/95 backdrop-blur border border-slate-800 rounded-2xl shadow-2xl p-4 animate-in slide-in-from-top-4 duration-300">
          <div className="flex gap-3">
            <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
              inAppAlert.type === "success" 
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" 
                : "bg-rose-500/10 text-rose-450 border border-rose-500/15"
            }`}>
              {inAppAlert.type === "success" ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className={`text-xs font-black uppercase tracking-wider font-mono ${
                inAppAlert.type === "success" ? "text-emerald-400" : "text-rose-450"
              }`}>
                {inAppAlert.title}
              </h4>
              <p className="text-slate-300 text-xs mt-1.5 leading-relaxed font-sans font-medium">
                {inAppAlert.message}
              </p>
            </div>
            <button 
              onClick={() => setInAppAlert(null)}
              className="text-slate-450 hover:text-white shrink-0 cursor-pointer self-start p-1 hover:bg-slate-800/50 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
