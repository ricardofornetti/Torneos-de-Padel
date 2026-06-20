import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Plus, 
  Trash2, 
  Filter, 
  Search, 
  Calendar, 
  MapPin, 
  Users, 
  Activity, 
  X, 
  Save, 
  Sparkles,
  ArrowRight,
  Edit,
  ArrowLeft
} from 'lucide-react';
import { repository } from '../lib/repository';
import { Tournament, Pair, Match, Player, PlayerPrivateData } from '../types';
import { formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface TournamentManagerProps {
  userRole: "admin" | "player";
  onSelectTournament: (id: string) => void;
  onBack?: () => void;
}

export const TournamentManager: React.FC<TournamentManagerProps> = ({ 
  userRole, 
  onSelectTournament,
  onBack
}) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteTConfirm, setDeleteTConfirm] = useState<{ id: string; name: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "registration" | "in_progress" | "completed">("all");

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSizeSelectorOpen, setIsSizeSelectorOpen] = useState(false);
  const [prefillDemo16, setPrefillDemo16] = useState(false);
  const [prefillDemo32, setPrefillDemo32] = useState(false);
  const [prefillDemo24, setPrefillDemo24] = useState(false);
  const [newT, setNewT] = useState({
    name: "",
    club: "",
    city: "",
    startDate: "",
    endDate: "",
    maxPairs: 16,
    numGroups: 4,
    numCourts: 3
  });

  const [courts, setCourts] = useState<any[]>([]);

  const loadTournaments = async () => {
    setLoading(true);
    try {
      const [list, crts] = await Promise.all([
        repository.getTournaments(),
        repository.getCourts()
      ]);
      setTournaments(list);
      setCourts(crts);
    } catch (err) {
      console.error("Error loading tournaments in manager", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTournaments();
  }, []);

  const handleOpenCreateForm = () => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    setEditingId(null);
    const activeCourtsCount = courts.filter(c => c.active).length;
    setNewT({
      name: "",
      club: "",
      city: "",
      startDate: today.toISOString().split('T')[0],
      endDate: nextWeek.toISOString().split('T')[0],
      maxPairs: 16,
      numGroups: 4,
      numCourts: activeCourtsCount > 0 ? Math.min(3, activeCourtsCount) : 3
    });
    setPrefillDemo16(false);
    setPrefillDemo32(false);
    setPrefillDemo24(false);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (t: Tournament) => {
    setEditingId(t.id);
    
    setNewT({
      name: t.name,
      club: t.club,
      city: t.city,
      startDate: t.startDate,
      endDate: t.endDate,
      maxPairs: t.maxPairs,
      numGroups: t.numGroups,
      numCourts: t.numCourts
    });
    setIsFormOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newT.name || !newT.club || !newT.city) {
      alert("Por favor completa los campos principales (Nombre del Torneo, Club y Ciudad).");
      return;
    }

    if (editingId) {
      const original = tournaments.find(t => t.id === editingId);
      const tObj: Tournament = {
        id: editingId,
        name: newT.name,
        club: newT.club,
        city: newT.city,
        category: "Multicategoría",
        tournamentType: "Grupos + Eliminatorias",
        startDate: newT.startDate,
        endDate: newT.endDate,
        status: original ? original.status : "registration",
        maxPairs: Number(newT.maxPairs) || 8,
        numGroups: Number(newT.numGroups) || 2,
        numCourts: Number(newT.numCourts) || 3
      };

      await repository.saveTournament(tObj);
      await repository.addNotification(
        "Torneo Modificado",
        `Se ha actualizado la información del torneo '${tObj.name}'.`,
        "success"
      );
    } else {
      const tId = `tournament_${Date.now()}`;
      const is16Prefill = Number(newT.maxPairs) === 16 && prefillDemo16;
      const is32Prefill = Number(newT.maxPairs) === 32 && prefillDemo32;
      const is24Prefill = Number(newT.maxPairs) === 24 && prefillDemo24;

      const tObj: Tournament = {
        id: tId,
        name: newT.name,
        club: newT.club,
        city: newT.city,
        category: "Multicategoría",
        tournamentType: "Grupos + Eliminatorias",
        startDate: newT.startDate,
        endDate: newT.endDate,
        status: (is16Prefill || is32Prefill || is24Prefill) ? "in_progress" : "registration",
        maxPairs: Number(newT.maxPairs) || 8,
        numGroups: Number(newT.maxPairs) === 24 ? 8 : (Number(newT.numGroups) || 2),
        numCourts: Number(newT.numCourts) || 3
      };

      await repository.saveTournament(tObj);
      await repository.addNotification(
        "Torneo Creado",
        `Se ha habilitado la inscripción multicategoría para el torneo '${tObj.name}'.`,
        "success"
      );

      if (is32Prefill) {
        // Create 64 famous players
        const playersList32 = [
          { firstName: "Arturo", lastName: "Coello", pts: 1200 },
          { firstName: "Agustín", lastName: "Tapia", pts: 1180 },
          { firstName: "Alejandro", lastName: "Galán", pts: 1120 },
          { firstName: "Juan", lastName: "Lebrón", pts: 1100 },
          { firstName: "Paquito", lastName: "Navarro", pts: 950 },
          { firstName: "Martín", lastName: "Di Nenno", pts: 940 },
          { firstName: "Fernando", lastName: "Belasteguín", pts: 890 },
          { firstName: "Sanyo", lastName: "Gutiérrez", pts: 870 },
          { firstName: "Franco", lastName: "Stupaczuk", pts: 920 },
          { firstName: "Federico", lastName: "Chingotto", pts: 910 },
          { firstName: "Momo", lastName: "González", pts: 810 },
          { firstName: "Mike", lastName: "Yanguas", pts: 830 },
          { firstName: "Jon", lastName: "Sanz", pts: 800 },
          { firstName: "Coki", lastName: "Nieto", pts: 790 },
          { firstName: "Javi", lastName: "Garrido", pts: 780 },
          { firstName: "Edu", lastName: "Alonso", pts: 760 },
          { firstName: "Álex", lastName: "Ruiz", pts: 750 },
          { firstName: "Juan", lastName: "Tello", pts: 730 },
          { firstName: "Lucas", lastName: "Campagnolo", pts: 700 },
          { firstName: "Javi", lastName: "Leal", pts: 650 },
          { firstName: "Maxi", lastName: "Sánchez", pts: 670 },
          { firstName: "Lucho", lastName: "Capra", pts: 620 },
          { firstName: "Gonzalo", lastName: "Rubio", pts: 610 },
          { firstName: "Javier", lastName: "Ruiz", pts: 610 },
          { firstName: "Pincho", lastName: "Fernández", pts: 580 },
          { firstName: "José", lastName: "G. Diestro", pts: 560 },
          { firstName: "Ramiro", lastName: "Moyano", pts: 550 },
          { firstName: "Xisco", lastName: "Gil", pts: 540 },
          { firstName: "Agustín", lastName: "Gutiérrez", pts: 510 },
          { firstName: "José", lastName: "Rico", pts: 500 },
          { firstName: "Teo", lastName: "Zapata", pts: 480 },
          { firstName: "Enrique", lastName: "Goenaga", pts: 440 },
          { firstName: "Javi", lastName: "Rico", pts: 450 },
          { firstName: "Miguel", lastName: "Lamperti", pts: 460 },
          { firstName: "Álvaro", lastName: "Cepero", pts: 430 },
          { firstName: "Arnau", lastName: "Ayats", pts: 420 },
          { firstName: "Denis", lastName: "Perino", pts: 410 },
          { firstName: "Facundo", lastName: "Domínguez", pts: 400 },
          { firstName: "Aris", lastName: "Patiniotis", pts: 390 },
          { firstName: "Ignacio", lastName: "Vilariño", pts: 380 },
          { firstName: "Mario", lastName: "Del Castillo", pts: 370 },
          { firstName: "Iván", lastName: "Ramírez", pts: 360 },
          { firstName: "José", lastName: "Solano", pts: 350 },
          { firstName: "Jaime", lastName: "Muñoz", pts: 340 },
          { firstName: "Jairo", lastName: "Bautista", pts: 330 },
          { firstName: "Martín", lastName: "S. Piñeiro", pts: 320 },
          { firstName: "Rafa", lastName: "Méndez", pts: 310 },
          { firstName: "Salva", lastName: "Oria", pts: 300 },
          { firstName: "Toni", lastName: "Bueno", pts: 290 },
          { firstName: "Marc", lastName: "Quílez", pts: 280 },
          { firstName: "Federico", lastName: "Mouriño", pts: 270 },
          { firstName: "Ignacio", lastName: "Sager", pts: 260 },
          { firstName: "Luis", lastName: "Hernández", pts: 250 },
          { firstName: "Íñigo", lastName: "Jofre", pts: 240 },
          { firstName: "Álvaro", lastName: "Meléndez", pts: 230 },
          { firstName: "Pedro", lastName: "Meléndez", pts: 220 },
          { firstName: "Cristian", lastName: "Germán", pts: 210 },
          { firstName: "Miguel", lastName: "Semmler", pts: 200 },
          { firstName: "Pablo", lastName: "Cardona", pts: 190 },
          { firstName: "Javier", lastName: "Valdés", pts: 180 },
          { firstName: "Raúl", lastName: "Marcos", pts: 170 },
          { firstName: "Thomas", lastName: "Leygue", pts: 160 },
          { firstName: "David", lastName: "Gala", pts: 150 },
          { firstName: "Pol", lastName: "Hernández", pts: 140 }
        ];

        const savedPlayerIds: string[] = [];
        for (let idx = 0; idx < playersList32.length; idx++) {
          const item = playersList32[idx];
          const pId = `tp_srtc32_${idx + 1}_${Date.now()}`;
          const pProfile: Player = {
            id: pId,
            firstName: item.firstName,
            lastName: item.lastName,
            city: newT.city || "Madrid",
            category: "5ta Masculina",
            rankingPoints: item.pts,
            photoUrl: "https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&q=80&w=200",
            matchesPlayed: 10,
            matchesWon: 5,
            matchesLost: 5,
            setsWon: 10,
            setsLost: 10,
            gamesWon: 100,
            gamesLost: 100
          };
          const privateProfile: PlayerPrivateData = {
            id: pId,
            dni: `${20020000 + idx}B`,
            phone: `+34 600 032 ${String(idx).padStart(3, "0")}`,
            email: `${item.firstName.toLowerCase()}.${item.lastName.toLowerCase().replace(/[^a-zA-Z]/g, "")}@demo-padel.com`,
            birthDate: "1998-05-15"
          };
          await repository.savePlayer(pProfile, privateProfile);
          savedPlayerIds.push(pId);
        }

        const createdPairs: Pair[] = [];
        for (let i = 0; i < 32; i++) {
          const p1Id = savedPlayerIds[i * 2];
          const p2Id = savedPlayerIds[i * 2 + 1];
          const prObj: Pair = {
            id: `pair_${tId}_srtc32_${i + 1}`,
            tournamentId: tId,
            player1Id: p1Id,
            player2Id: p2Id,
            category: "5ta Masculina",
            combinedRanking: playersList32[i * 2].pts + playersList32[i * 2 + 1].pts,
            status: "confirmed"
          };
          await repository.savePair(prObj);
          createdPairs.push(prObj);
        }

        const allGeneratedMatches32: Match[] = [];
        const dateString = newT.startDate || new Date().toISOString().split("T")[0];

        // 3.1. Ronda 1 Matches (16 matches)
        for (let i = 0; i < 16; i++) {
          const letter = String.fromCharCode(65 + i); // 'A' to 'P'
          const p1 = createdPairs[i * 2];
          const p2 = createdPairs[i * 2 + 1];
          allGeneratedMatches32.push({
            id: `match_${tId}_srtc32_5taMasculina_r1_m${i + 1}`,
            tournamentId: tId,
            phase: "group",
            roundNumber: 1,
            stageName: `Ronda 1 - Grupo ${letter}`,
            pair1Id: p1.id,
            pair2Id: p2.id,
            courtId: i < Number(newT.numCourts) ? `court_${(i % Number(newT.numCourts)) + 1}` : "court_1",
            date: dateString,
            time: `${17 + Math.floor(i / 4)}:00`,
            status: "pending",
            scoreSummary: "Por jugar",
            winnerPairId: "",
            category: "5ta Masculina"
          });
        }

        // 3.2. Ronda 2 Placeholder Matches (16 matches, Partidos 17 to 32)
        for (let i = 17; i <= 32; i++) {
          allGeneratedMatches32.push({
            id: `match_${tId}_srtc32_5taMasculina_r2_m${i}`,
            tournamentId: tId,
            phase: "group",
            roundNumber: 2,
            stageName: `Ronda 2 - Partido ${i}`,
            pair1Id: "",
            pair2Id: "",
            courtId: "",
            date: dateString,
            time: `${18 + Math.floor((i - 17) / 4)}:00`,
            status: "pending",
            scoreSummary: "Por jugar",
            winnerPairId: "",
            category: "5ta Masculina"
          });
        }

        // 3.3. Octavos de Final Placeholder Matches (8 matches)
        for (let i = 1; i <= 8; i++) {
          allGeneratedMatches32.push({
            id: `match_${tId}_srtc32_5taMasculina_8_m${i}`,
            tournamentId: tId,
            phase: "playoff",
            roundNumber: 3,
            stageName: `Octavos de Final ${i}`,
            pair1Id: "",
            pair2Id: "",
            courtId: "",
            date: dateString,
            time: "19:00",
            status: "pending",
            scoreSummary: "Por jugar",
            winnerPairId: "",
            category: "5ta Masculina"
          });
        }

        // 3.4. Cuartos de final Placeholder Matches (4 matches)
        for (let i = 1; i <= 4; i++) {
          allGeneratedMatches32.push({
            id: `match_${tId}_srtc32_5taMasculina_q_m${i}`,
            tournamentId: tId,
            phase: "playoff",
            roundNumber: 4,
            stageName: `Cuartos de Final ${i}`,
            pair1Id: "",
            pair2Id: "",
            courtId: "",
            date: dateString,
            time: "20:00",
            status: "pending",
            scoreSummary: "Por jugar",
            winnerPairId: "",
            category: "5ta Masculina"
          });
        }

        // 3.5. Semifinales Placeholder Matches (2 matches)
        for (let i = 1; i <= 2; i++) {
          allGeneratedMatches32.push({
            id: `match_${tId}_srtc32_5taMasculina_sf_m${i}`,
            tournamentId: tId,
            phase: "playoff",
            roundNumber: 5,
            stageName: `Semifinal ${i}`,
            pair1Id: "",
            pair2Id: "",
            courtId: "",
            date: dateString,
            time: "20:30",
            status: "pending",
            scoreSummary: "Por jugar",
            winnerPairId: "",
            category: "5ta Masculina"
          });
        }

        // 3.6. Final Placeholder Match
        allGeneratedMatches32.push({
          id: `match_${tId}_srtc32_5taMasculina_final`,
          tournamentId: tId,
          phase: "playoff",
          roundNumber: 6,
          stageName: "Final",
          pair1Id: "",
          pair2Id: "",
          courtId: "",
          date: dateString,
          time: "21:30",
          status: "pending",
          scoreSummary: "Por jugar",
          winnerPairId: "",
          category: "5ta Masculina"
        });

        for (const m of allGeneratedMatches32) {
          await repository.saveMatch(m);
        }

        await repository.addNotification(
          "Fixture Confeccionado",
          `Se han creado 32 parejas de ejemplo y el fixture oficial SRTC 32 de 47 partidos para la categoría '5ta Masculina' en el torneo '${newT.name}'.`,
          "success"
        );
      }

      if (is16Prefill) {
        // Create 32 famous players
        const playersList = [
          { firstName: "Arturo", lastName: "Coello", pts: 1200 },
          { firstName: "Agustín", lastName: "Tapia", pts: 1180 },
          { firstName: "Alejandro", lastName: "Galán", pts: 1120 },
          { firstName: "Juan", lastName: "Lebrón", pts: 1100 },
          { firstName: "Paquito", lastName: "Navarro", pts: 950 },
          { firstName: "Martín", lastName: "Di Nenno", pts: 940 },
          { firstName: "Fernando", lastName: "Belasteguín", pts: 890 },
          { firstName: "Sanyo", lastName: "Gutiérrez", pts: 870 },
          { firstName: "Franco", lastName: "Stupaczuk", pts: 920 },
          { firstName: "Federico", lastName: "Chingotto", pts: 910 },
          { firstName: "Momo", lastName: "González", pts: 810 },
          { firstName: "Mike", lastName: "Yanguas", pts: 830 },
          { firstName: "Jon", lastName: "Sanz", pts: 800 },
          { firstName: "Coki", lastName: "Nieto", pts: 790 },
          { firstName: "Javi", lastName: "Garrido", pts: 780 },
          { firstName: "Edu", lastName: "Alonso", pts: 760 },
          { firstName: "Álex", lastName: "Ruiz", pts: 750 },
          { firstName: "Juan", lastName: "Tello", pts: 730 },
          { firstName: "Lucas", lastName: "Campagnolo", pts: 700 },
          { firstName: "Javi", lastName: "Leal", pts: 650 },
          { firstName: "Maxi", lastName: "Sánchez", pts: 670 },
          { firstName: "Lucho", lastName: "Capra", pts: 620 },
          { firstName: "Gonzalo", lastName: "Rubio", pts: 610 },
          { firstName: "Javier", lastName: "Ruiz", pts: 610 },
          { firstName: "Pincho", lastName: "Fernández", pts: 580 },
          { firstName: "José", lastName: "G. Diestro", pts: 560 },
          { firstName: "Ramiro", lastName: "Moyano", pts: 550 },
          { firstName: "Xisco", lastName: "Gil", pts: 540 },
          { firstName: "Agustín", lastName: "Gutiérrez", pts: 510 },
          { firstName: "José", lastName: "Rico", pts: 500 },
          { firstName: "Teo", lastName: "Zapata", pts: 480 },
          { firstName: "Enrique", lastName: "Goenaga", pts: 440 }
        ];

        const savedPlayerIds: string[] = [];
        for (let idx = 0; idx < playersList.length; idx++) {
          const item = playersList[idx];
          const pId = `tp_srtc16_${idx + 1}_${Date.now()}`;
          const pProfile: Player = {
            id: pId,
            firstName: item.firstName,
            lastName: item.lastName,
            city: newT.city || "Madrid",
            category: "5ta Masculina",
            rankingPoints: item.pts,
            photoUrl: "https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&q=80&w=200",
            matchesPlayed: 10,
            matchesWon: 5,
            matchesLost: 5,
            setsWon: 10,
            setsLost: 10,
            gamesWon: 100,
            gamesLost: 100
          };
          const privateProfile: PlayerPrivateData = {
            id: pId,
            dni: `${10020000 + idx}A`,
            phone: `+34 600 000 ${String(idx).padStart(3, "0")}`,
            email: `${item.firstName.toLowerCase()}.${item.lastName.toLowerCase().replace(/[^a-zA-Z]/g, "")}@demo-padel.com`,
            birthDate: "1998-05-15"
          };
          await repository.savePlayer(pProfile, privateProfile);
          savedPlayerIds.push(pId);
        }

        const createdPairs: Pair[] = [];
        for (let i = 0; i < 16; i++) {
          const p1Id = savedPlayerIds[i * 2];
          const p2Id = savedPlayerIds[i * 2 + 1];
          const prObj: Pair = {
            id: `pair_${tId}_srtc16_${i + 1}`,
            tournamentId: tId,
            player1Id: p1Id,
            player2Id: p2Id,
            category: "5ta Masculina",
            combinedRanking: playersList[i * 2].pts + playersList[i * 2 + 1].pts,
            status: "confirmed"
          };
          await repository.savePair(prObj);
          createdPairs.push(prObj);
        }

        const allGeneratedMatches: Match[] = [];
        const dateString = newT.startDate || new Date().toISOString().split("T")[0];

        // 3.1. Ronda 1 Matches (8 matches)
        for (let i = 0; i < 8; i++) {
          const letter = String.fromCharCode(65 + i); // 'A' to 'H'
          const p1 = createdPairs[i * 2];
          const p2 = createdPairs[i * 2 + 1];
          allGeneratedMatches.push({
            id: `match_${tId}_srtc16_5taMasculina_r1_m${i + 1}`,
            tournamentId: tId,
            phase: "group",
            roundNumber: 1,
            stageName: `Ronda 1 - Grupo ${letter}`,
            pair1Id: p1.id,
            pair2Id: p2.id,
            courtId: i < Number(newT.numCourts) ? `court_${(i % Number(newT.numCourts)) + 1}` : "court_1",
            date: dateString,
            time: `${17 + Math.floor(i / 3)}:00`,
            status: "pending",
            scoreSummary: "Por jugar",
            winnerPairId: "",
            category: "5ta Masculina"
          });
        }

        // 3.2. Ronda 2 Placeholder Matches (8 matches, Partidos 9 to 16)
        for (let i = 9; i <= 16; i++) {
          allGeneratedMatches.push({
            id: `match_${tId}_srtc16_5taMasculina_r2_m${i}`,
            tournamentId: tId,
            phase: "group",
            roundNumber: 2,
            stageName: `Ronda 2 - Partido ${i}`,
            pair1Id: "",
            pair2Id: "",
            courtId: "",
            date: dateString,
            time: `${18 + Math.floor((i - 9) / 3)}:00`,
            status: "pending",
            scoreSummary: "Por jugar",
            winnerPairId: "",
            category: "5ta Masculina"
          });
        }

        // 3.3. Cuartos de Final Placeholder Matches (4 matches)
        for (let i = 1; i <= 4; i++) {
          allGeneratedMatches.push({
            id: `match_${tId}_srtc16_5taMasculina_q_m${i}`,
            tournamentId: tId,
            phase: "playoff",
            roundNumber: 3,
            stageName: `Cuartos de Final ${i}`,
            pair1Id: "",
            pair2Id: "",
            courtId: "",
            date: dateString,
            time: "19:00",
            status: "pending",
            scoreSummary: "Por jugar",
            winnerPairId: "",
            category: "5ta Masculina"
          });
        }

        // 3.4. Semifinales Placeholder Matches (2 matches)
        for (let i = 1; i <= 2; i++) {
          allGeneratedMatches.push({
            id: `match_${tId}_srtc16_5taMasculina_sf_m${i}`,
            tournamentId: tId,
            phase: "playoff",
            roundNumber: 4,
            stageName: `Semifinal ${i}`,
            pair1Id: "",
            pair2Id: "",
            courtId: "",
            date: dateString,
            time: "20:00",
            status: "pending",
            scoreSummary: "Por jugar",
            winnerPairId: "",
            category: "5ta Masculina"
          });
        }

        // 3.5. Final Placeholder Match
        allGeneratedMatches.push({
          id: `match_${tId}_srtc16_5taMasculina_final`,
          tournamentId: tId,
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
          category: "5ta Masculina"
        });

        for (const m of allGeneratedMatches) {
          await repository.saveMatch(m);
        }

        await repository.addNotification(
          "Fixture Confeccionado",
          `Se han creado 16 parejas de ejemplo y el fixture oficial SRTC 16 de 23 partidos para la categoría '5ta Masculina' en el torneo '${newT.name}'.`,
          "success"
        );
      }

      if (is24Prefill) {
        // Create 48 famous players
        const playersList24 = [
          { firstName: "Arturo", lastName: "Coello", pts: 1200 },
          { firstName: "Agustín", lastName: "Tapia", pts: 1180 },
          { firstName: "Alejandro", lastName: "Galán", pts: 1120 },
          { firstName: "Juan", lastName: "Lebrón", pts: 1100 },
          { firstName: "Paquito", lastName: "Navarro", pts: 950 },
          { firstName: "Martín", lastName: "Di Nenno", pts: 940 },
          { firstName: "Fernando", lastName: "Belasteguín", pts: 890 },
          { firstName: "Sanyo", lastName: "Gutiérrez", pts: 870 },
          { firstName: "Franco", lastName: "Stupaczuk", pts: 920 },
          { firstName: "Federico", lastName: "Chingotto", pts: 910 },
          { firstName: "Momo", lastName: "González", pts: 810 },
          { firstName: "Mike", lastName: "Yanguas", pts: 820 },
          { firstName: "Jon", lastName: "Sanz", pts: 800 },
          { firstName: "Coki", lastName: "Nieto", pts: 790 },
          { firstName: "Javi", lastName: "Garrido", pts: 780 },
          { firstName: "Edu", lastName: "Alonso", pts: 760 },
          { firstName: "Álex", lastName: "Ruiz", pts: 750 },
          { firstName: "Juan", lastName: "Tello", pts: 730 },
          { firstName: "Lucas", lastName: "Campagnolo", pts: 700 },
          { firstName: "Javi", lastName: "Leal", pts: 650 },
          { firstName: "Maxi", lastName: "Sánchez", pts: 670 },
          { firstName: "Lucho", lastName: "Capra", pts: 620 },
          { firstName: "Gonzalo", lastName: "Rubio", pts: 610 },
          { firstName: "Javier", lastName: "Ruiz", pts: 610 },
          { firstName: "Pincho", lastName: "Fernández", pts: 580 },
          { firstName: "José", lastName: "G. Diestro", pts: 560 },
          { firstName: "Ramiro", lastName: "Moyano", pts: 550 },
          { firstName: "Xisco", lastName: "Gil", pts: 540 },
          { firstName: "Agustín", lastName: "Gutiérrez", pts: 510 },
          { firstName: "José", lastName: "Rico", pts: 500 },
          { firstName: "Teo", lastName: "Zapata", pts: 480 },
          { firstName: "Enrique", lastName: "Goenaga", pts: 440 },
          { firstName: "Javi", lastName: "Rico", pts: 455 },
          { firstName: "Miguel", lastName: "Lamperti", pts: 462 },
          { firstName: "Álvaro", lastName: "Cepero", pts: 434 },
          { firstName: "Arnau", lastName: "Ayats", pts: 421 },
          { firstName: "Denis", lastName: "Perino", pts: 412 },
          { firstName: "Facundo", lastName: "Domínguez", pts: 403 },
          { firstName: "Aris", lastName: "Patiniotis", pts: 395 },
          { firstName: "Ignacio", lastName: "Vilariño", pts: 382 },
          { firstName: "Mario", lastName: "Del Castillo", pts: 371 },
          { firstName: "Iván", lastName: "Ramírez", pts: 366 },
          { firstName: "José", lastName: "Solano", pts: 352 },
          { firstName: "Jaime", lastName: "Muñoz", pts: 341 },
          { firstName: "Jairo", lastName: "Bautista", pts: 332 },
          { firstName: "Martín", lastName: "S. Piñeiro", pts: 322 },
          { firstName: "Rafa", lastName: "Méndez", pts: 312 },
          { firstName: "Salva", lastName: "Oria", pts: 302 }
        ];

        const savedPlayerIds: string[] = [];
        for (let idx = 0; idx < playersList24.length; idx++) {
          const item = playersList24[idx];
          const pId = `tp_srtc24_${idx + 1}_${Date.now()}`;
          const pProfile: Player = {
            id: pId,
            firstName: item.firstName,
            lastName: item.lastName,
            city: newT.city || "Madrid",
            category: "5ta Masculina",
            rankingPoints: item.pts,
            photoUrl: "https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&q=80&w=200",
            matchesPlayed: 10,
            matchesWon: 5,
            matchesLost: 5,
            setsWon: 10,
            setsLost: 10,
            gamesWon: 100,
            gamesLost: 100
          };
          const privateProfile: PlayerPrivateData = {
            id: pId,
            dni: `${30020000 + idx}C`,
            phone: `+34 600 024 ${String(idx).padStart(3, "0")}`,
            email: `${item.firstName.toLowerCase()}.${item.lastName.toLowerCase().replace(/[^a-zA-Z]/g, "")}@demo-padel.com`,
            birthDate: "1998-05-15"
          };
          await repository.savePlayer(pProfile, privateProfile);
          savedPlayerIds.push(pId);
        }

        const createdPairs: Pair[] = [];
        for (let i = 0; i < 24; i++) {
          const p1Id = savedPlayerIds[i * 2];
          const p2Id = savedPlayerIds[i * 2 + 1];
          const prObj: Pair = {
            id: `pair_${tId}_srtc24_${i + 1}`,
            tournamentId: tId,
            player1Id: p1Id,
            player2Id: p2Id,
            category: "5ta Masculina",
            combinedRanking: playersList24[i * 2].pts + playersList24[i * 2 + 1].pts,
            status: "confirmed"
          };
          await repository.savePair(prObj);
          createdPairs.push(prObj);
        }

        const allGeneratedMatches: Match[] = [];
        const dateString = newT.startDate || new Date().toISOString().split("T")[0];

        // 1. Fase de grupos: 8 grupos de 3 parejas (A-H)
        // Grupo A (0,1,2), Grupo B (3,4,5), etc. 
        const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
        for (let gIdx = 0; gIdx < 8; gIdx++) {
          const letter = letters[gIdx];
          const gPairs = [
            createdPairs[gIdx * 3],
            createdPairs[gIdx * 3 + 1],
            createdPairs[gIdx * 3 + 2]
          ];

          // Partido 1: P1 vs P2
          allGeneratedMatches.push({
            id: `match_${tId}_srtc24_5taMasculina_g_${letter}_m1`,
            tournamentId: tId,
            phase: "group",
            roundNumber: 1,
            stageName: `Grupo ${letter}`,
            pair1Id: gPairs[0].id,
            pair2Id: gPairs[1].id,
            courtId: gIdx < Number(newT.numCourts) ? `court_${(gIdx % Number(newT.numCourts)) + 1}` : "court_1",
            date: dateString,
            time: `${16 + Math.floor(gIdx / 3)}:00`,
            status: "pending",
            scoreSummary: "Por jugar",
            winnerPairId: "",
            category: "5ta Masculina"
          });

          // Partido 2: P1 vs P3
          allGeneratedMatches.push({
            id: `match_${tId}_srtc24_5taMasculina_g_${letter}_m2`,
            tournamentId: tId,
            phase: "group",
            roundNumber: 2,
            stageName: `Grupo ${letter}`,
            pair1Id: gPairs[0].id,
            pair2Id: gPairs[2].id,
            courtId: gIdx < Number(newT.numCourts) ? `court_${((gIdx + 1) % Number(newT.numCourts)) + 1}` : "court_1",
            date: dateString,
            time: `${17 + Math.floor(gIdx / 3)}:00`,
            status: "pending",
            scoreSummary: "Por jugar",
            winnerPairId: "",
            category: "5ta Masculina"
          });

          // Partido 3: P2 vs P3
          allGeneratedMatches.push({
            id: `match_${tId}_srtc24_5taMasculina_g_${letter}_m3`,
            tournamentId: tId,
            phase: "group",
            roundNumber: 3,
            stageName: `Grupo ${letter}`,
            pair1Id: gPairs[1].id,
            pair2Id: gPairs[2].id,
            courtId: gIdx < Number(newT.numCourts) ? `court_${((gIdx + 2) % Number(newT.numCourts)) + 1}` : "court_1",
            date: dateString,
            time: `${18 + Math.floor(gIdx / 3)}:00`,
            status: "pending",
            scoreSummary: "Por jugar",
            winnerPairId: "",
            category: "5ta Masculina"
          });
        }

        // 2. Ronda Clasificatoria (cruces automáticos, Partidos 25 a 32)
        // Pre-generamos vacíos
        for (let pNum = 25; pNum <= 32; pNum++) {
          allGeneratedMatches.push({
            id: `match_${tId}_srtc24_5taMasculina_rc_p${pNum}`,
            tournamentId: tId,
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
            category: "5ta Masculina"
          });
        }

        // 3. Cuartos de final (4 partidos, Partidos 33 a 36)
        for (let i = 1; i <= 4; i++) {
          allGeneratedMatches.push({
            id: `match_${tId}_srtc24_5taMasculina_q_m${i}`,
            tournamentId: tId,
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
            category: "5ta Masculina"
          });
        }

        // 4. Semifinales (2 partidos, Partidos 37 y 38)
        for (let i = 1; i <= 2; i++) {
          allGeneratedMatches.push({
            id: `match_${tId}_srtc24_5taMasculina_sf_m${i}`,
            tournamentId: tId,
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
            category: "5ta Masculina"
          });
        }

        // 5. Final (1 partido, Partido 39)
        allGeneratedMatches.push({
          id: `match_${tId}_srtc24_5taMasculina_final`,
          tournamentId: tId,
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
          category: "5ta Masculina"
        });

        for (const m of allGeneratedMatches) {
          await repository.saveMatch(m);
        }

        await repository.addNotification(
          "Fixture Confeccionado",
          `Se han creado 24 parejas de ejemplo y el fixture oficial SRTC 24 de 39 partidos para la categoría '5ta Masculina' en el torneo '${newT.name}'.`,
          "success"
        );
      }
    }

    setIsFormOpen(false);
    setEditingId(null);
    loadTournaments();
  };

  const handleDelete = async (id: string, name: string) => {
    setDeleteTConfirm({ id, name });
  };

  const executeDeleteT = async () => {
    if (!deleteTConfirm) return;
    const { id, name } = deleteTConfirm;
    setDeleteTConfirm(null);
    try {
      await repository.deleteTournament(id);
      await repository.addNotification(
        "Torneo Eliminado",
        `Se eliminó de raíz el torneo '${name}'.`,
        "warning"
      );
      loadTournaments();
    } catch (err) {
      console.error("Error deleting tournament:", err);
    }
  };

  // Filter listings
  const filtered = tournaments.filter(t => {
    // 1. Status Filter
    if (statusFilter !== "all" && t.status !== statusFilter) {
      return false;
    }

    // 2. Search Query (name, club, city)
    if (search.trim() !== "") {
      const q = search.toLowerCase();
      const nameMatch = t.name?.toLowerCase().includes(q);
      const clubMatch = t.club?.toLowerCase().includes(q);
      const cityMatch = t.city?.toLowerCase().includes(q);
      return nameMatch || clubMatch || cityMatch;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 w-full flex-1">
        {/* Banner de Pantalla de Torneos */}
        <div className="relative rounded-3xl overflow-hidden border border-slate-800/80 p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 min-h-[160px] shadow-2xl">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <img 
              src="/src/assets/images/tournaments_banner_1781910969256.webp" 
              alt="Jugadores compitiendo en cancha de pádel del complejo" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {/* dark overlay to keep it readable, lighter on the right where there's no text */}
            <div className="absolute inset-0 bg-slate-950/55 bg-gradient-to-r from-slate-950 via-slate-950/75 to-slate-950/35"></div>
          </div>

          <div className="space-y-1 relative z-10">
            <div className="flex items-center gap-2 mb-1.5 animate-fade-in">
              <span className="bg-[#d4fc34]/15 text-[#d4fc34] border border-[#d4fc34]/20 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest font-mono">
                Circuito Profesional
              </span>
              <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest font-mono">
                TOUR
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-wider text-white flex items-center gap-2.5">
              <Trophy className="w-6 h-6 text-[#d4fc34]" />
              <span>Circuitos de Torneos</span>
            </h1>
            <p className="text-xs text-slate-350 font-normal max-w-xl">
              Planificación, llaves automáticas y control reglamentario de competencias oficiales de la liga.
            </p>
          </div>

          {userRole === "admin" && (
            <div className="self-start md:self-center relative z-10">
              <button
                onClick={handleOpenCreateForm}
                className="bg-[#d4fc34] hover:bg-[#cbf528] text-slate-950 text-xs font-black px-5 py-3 rounded-xl uppercase tracking-widest flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#d4fc34]/10"
              >
                <Plus className="w-4 h-4 text-slate-950" />
                <span>Crear Torneo</span>
              </button>
            </div>
          )}
        </div>

        {/* FILTERS PANEL */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3.5 shadow-md">
          <div className="flex items-center gap-2 text-xs font-mono font-black text-[#d4fc34] uppercase tracking-wider border-b border-slate-850 pb-2">
            <Filter className="w-4 h-4" /> Búsqueda y Filtros de Torneos
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Buscar Torneo</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, club o ciudad..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-[#d4fc34] rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none"
                />
              </div>
            </div>

            {/* Status Dropdown */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Estado de Gestión</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-[#d4fc34] rounded-lg p-2 text-xs text-slate-100 outline-none block appearance-none"
              >
                <option value="all">Todos los Estados</option>
                <option value="registration">Inscripciones Abiertas</option>
                <option value="in_progress">En Juego / En Curso</option>
                <option value="completed">Finalizados / Cerrados</option>
              </select>
            </div>
          </div>
        </div>

      {loading ? (
        <div className="text-center py-10 font-mono text-slate-500 text-xs">
          Comunicando con Firestore...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center text-slate-500 text-xs">
          No se encontraron torneos vigentes para esta sección.
        </div>
      ) : (
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filtered.map((t, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
              whileHover={{ y: -4, transition: { duration: 0.15 } }}
              key={t.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 transition rounded-xl flex flex-col justify-between group overflow-hidden shadow-md"
              id={`t-card-${t.id}`}
            >
              {/* Header card body */}
              <div className="p-5 space-y-4">
                
                <div className="flex items-center justify-between">
                  {/* Category tag */}
                  <span className="bg-blue-600/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase">
                    {t.category}
                  </span>

                  {/* Status pills */}
                  <span className={`text-[10px] font-bold uppercase flex items-center gap-1 ${
                    t.status === "registration" ? "text-amber-400 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10" :
                    t.status === "in_progress" ? "text-green-400 bg-green-500/5 px-2 py-0.5 rounded border border-green-500/10 animate-pulse" :
                    "text-slate-500 bg-slate-950 px-2 py-0.5 rounded"
                  }`}>
                    ● {t.status === "registration" ? "Inscripción" :
                       t.status === "in_progress" ? "En juego" : "Finalizado"}
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-white text-base leading-snug group-hover:text-blue-400 transition">
                    {t.name}
                  </h3>
                  <div className="space-y-2 mt-3 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{t.club} — {t.city}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="font-mono text-[11px]">{formatDate(t.startDate)} al {formatDate(t.endDate)}</span>
                    </div>


                  </div>
                </div>

              </div>

              {/* Card Footer action panel */}
              <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 flex items-center justify-between">
                <div>
                  {userRole === "admin" && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleOpenEditForm(t)}
                        className="text-[10.5px] text-slate-500 hover:text-amber-400 font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" /> Modificar
                      </button>
                      <button
                        onClick={() => handleDelete(t.id, t.name)}
                        className="text-[10.5px] text-slate-500 hover:text-red-400 font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Eliminar
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onSelectTournament(t.id)}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-750 hover:bg-slate-850 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer"
                >
                  Administrar <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                </button>
              </div>

            </motion.div>
          ))}
        </motion.div>
      )}



      {/* MODAL CREATOR DIALOG FOR INTERACTIVE FORMS */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="font-extrabold text-sm text-white flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-emerald-400" /> {editingId ? "Modificar Torneo" : "Registrar Nuevo Torneo"}
              </span>
              <button
                onClick={() => { setIsFormOpen(false); setEditingId(null); }}
                className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="overflow-y-auto p-5 space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="block text-[10px] uppercase text-slate-400 font-mono">Nombre del Torneo *</label>
                <input
                  type="text"
                  required
                  placeholder="Torneo de Primavera - Open Cristal"
                  value={newT.name}
                  onChange={(e) => setNewT({...newT, name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase text-slate-400 font-mono">Club Sede *</label>
                  <input
                    type="text"
                    required
                    placeholder="Club Centro de Tenis Cristal"
                    value={newT.club}
                    onChange={(e) => setNewT({...newT, club: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase text-slate-400 font-mono">Ciudad *</label>
                  <input
                    type="text"
                    required
                    placeholder="Valladolid"
                    value={newT.city}
                    onChange={(e) => setNewT({...newT, city: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase text-slate-400 font-mono">Fecha Inicio *</label>
                  <input
                    type="date"
                    required
                    value={newT.startDate}
                    onChange={(e) => setNewT({...newT, startDate: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase text-slate-400 font-mono">Fecha Fin *</label>
                  <input
                    type="date"
                    required
                    value={newT.endDate}
                    onChange={(e) => setNewT({...newT, endDate: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3 font-sans">
                <button
                  type="button"
                  onClick={() => { setIsFormOpen(false); setEditingId(null); }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#d4fc34] hover:bg-[#c5f015] text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer uppercase tracking-wider"
                >
                  <Save className="w-3.5 h-3.5 text-slate-950" /> {editingId ? "Guardar Cambios" : "Generar Torneo"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* SYSTEM PROMPT: ASK FOR TOURNAMENT SIZE & FIXTURE TYPE */}
      {isSizeSelectorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900">
              <span className="font-extrabold text-sm text-white flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-emerald-400" /> Configuración Inicial: Cantidad de Parejas
              </span>
              <button
                onClick={() => setIsSizeSelectorOpen(false)}
                className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg cursor-pointer transition border border-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
              
              <div className="space-y-1">
                <h4 className="text-white text-base font-black">¿De cuántas parejas será el torneo?</h4>
                <p className="text-slate-400 text-xs">
                  Selecciona la cantidad de parejas participantes. El sistema adaptará los sorteos, zonas y fases de eliminación en base a tu elección.
                </p>
              </div>

              {/* Grid of couples options */}
              <div className="grid grid-cols-3 gap-3">
                {[16, 24, 32].map((size) => {
                  const isOfficial = size === 16 || size === 24 || size === 32;
                  const isSelected = newT.maxPairs === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        let estGroups = 2;
                        if (size === 24) estGroups = 8;
                        else estGroups = 8; // Default for others

                        setNewT({
                          ...newT, 
                          maxPairs: size,
                          numGroups: estGroups
                        });
                      }}
                      className={`relative border p-4 rounded-xl flex flex-col items-center justify-center text-center transition gap-1.5 cursor-pointer ${
                        isSelected
                          ? "bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/10 text-white"
                          : "bg-slate-950 border-slate-800 hover:border-slate-750 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {isOfficial && (
                        <span className="absolute -top-2.5 bg-indigo-500 text-slate-950 font-mono text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                          OFICIAL SRTC
                        </span>
                      )}
                      <span className={`text-lg font-black ${isSelected ? "text-[#d4fc34]" : "text-slate-300"}`}>
                        {size}
                      </span>
                      <span className="text-[10px] font-bold">Parejas</span>
                      
                      <span className="text-[8px] opacity-70 font-mono">
                        {size === 24 ? "8 Grupos de 3" : "Doble Eliminación"}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Opciones Adicionales / Cantidad Personalizada */}
              <div className="bg-slate-950 p-4 border border-slate-800/80 rounded-xl space-y-3">
                <span className="text-white font-extrabold text-[11px] uppercase tracking-wider block font-mono text-emerald-400">
                  ¿Otra Cantidad de Parejas?
                </span>
                <p className="text-[10px] text-slate-400">
                  Selecciona de entre las otras capacidades reglamentarias o ingresa manualmente cualquier número deseado de parejas:
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] text-slate-400 uppercase font-mono mb-1">Capacidades Standard</label>
                    <select
                      value={[16, 24, 32].includes(newT.maxPairs) ? "" : newT.maxPairs}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (val) {
                          setNewT({
                            ...newT,
                            maxPairs: val,
                            numGroups: Math.max(2, Math.floor(val / 3))
                          });
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Seleccionar otra --</option>
                      {[8, 12, 18, 20, 22, 26, 28, 30, 40, 48, 64].map((size) => (
                        <option key={size} value={size}>{size} Parejas</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] text-slate-400 uppercase font-mono mb-1">Ingresar Manual (Cualquiera)</label>
                    <input
                      type="number"
                      min={2}
                      max={128}
                      value={newT.maxPairs}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setNewT({
                          ...newT,
                          maxPairs: val || 2,
                          numGroups: Math.max(2, Math.floor((val || 2) / 3))
                        });
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white text-center font-bold tracking-wider outline-none focus:border-indigo-500 h-[34px]"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Information Banner based on selection */}
              {newT.maxPairs === 32 ? (
                <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-2xl p-4 space-y-4 shadow-sm">
                  <div className="flex gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-extrabold text-[#d4fc34] text-xs font-display">Formato Directo Oficial SRTC 32</h4>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        Sistema oficial de 32 parejas con **Dos Partidos Garantizados**. Los perdedores de Ronda 1 disputan ronda de repechaje en Ronda 2, clasificando únicamente los ganadores de Ronda 2 a Octavos de Final.
                      </p>
                    </div>
                  </div>
                </div>
              ) : newT.maxPairs === 24 ? (
                <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-2xl p-4 space-y-4 shadow-sm">
                  <div className="flex gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-extrabold text-[#d4fc34] text-xs font-display">Formato Directo Oficial SRTC 24</h4>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        Sistema oficial de 24 parejas: **Fase de grupos** de 8 zonas de 3 parejas (todos contra todos, PG*2, PP*1, WO=0). Clasifican los 2 mejores de cada grupo a la **Ronda Clasificatoria** (16 parejas en cruces directos). Los 8 ganadores pasan a Cuartos de final. 
                      </p>
                    </div>
                  </div>
                </div>
              ) : newT.maxPairs === 16 ? (
                <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-2xl p-4 space-y-4 shadow-sm">
                  <div className="flex gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-extrabold text-[#d4fc34] text-xs font-display">Formato Directo Oficial SRTC 16</h4>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        Sistema de cuadro reglamentario de 16 parejas coordinado con un fixture pre-armado y progresión sincronizada de dos vidas garantizadas para competiciones de alto rendimiento.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-2xl p-4 space-y-4 shadow-sm">
                  <div className="flex gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-extrabold text-emerald-400 text-xs font-display">Formato Adaptativo {newT.maxPairs} Parejas</h4>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        El sistema SRTC adaptará automáticamente los grupos equilibrados de 3 o 4 parejas (o de 2 si fuera indispensable) garantizando que todos jueguen un mínimo de 2 partidos. Fase eliminatoria directa calibrada hacia la potencia de 2 más cercana.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3 font-sans">
                <button
                  type="button"
                  onClick={() => setIsSizeSelectorOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSizeSelectorOpen(false);
                    setIsFormOpen(true);
                  }}
                  className="bg-[#d4fc34] hover:bg-[#c5f015] text-slate-950 text-xs font-black px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer uppercase tracking-wider"
                >
                  Continuar <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-[#0f172a] border border-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-white text-base">
                ¿Eliminar Torneo?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                🚨 ¿Estás seguro de que deseas eliminar el torneo <span className="text-white font-semibold">'{deleteTConfirm.name}'</span> de raíz? Esta acción es irreversible y removerá todas las inscripciones y partidos asociados.
              </p>
            </div>
            
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setDeleteTConfirm(null)}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold px-4 py-2.5 rounded-lg border border-slate-800 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeDeleteT}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};
