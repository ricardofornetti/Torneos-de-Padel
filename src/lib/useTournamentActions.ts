// src/lib/useTournamentActions.ts
// Hook que encapsula todos los handlers de acción del admin en TournamentDetail.
// Separa la lógica de UI sin tocar tournamentEngine.ts ni repository.ts.

import { useState } from 'react';
import { repository } from './repository';
import { Tournament, Player, Pair, Match, Court } from '../types';

interface UseTournamentActionsProps {
  tournament: Tournament | null;
  players: Player[];
  pairs: Pair[];
  matches: Match[];
  courts: Court[];
  selectedCategory: string;
  setMatches: (m: Match[]) => void;
  setPairs: (p: Pair[]) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function useTournamentActions({
  tournament,
  players,
  pairs,
  matches,
  courts,
  selectedCategory,
  setMatches,
  setPairs,
  showToast,
}: UseTournamentActionsProps) {

  const [isProcessing, setIsProcessing] = useState(false);

  // Asignar cancha y hora a un partido
  const handleAssignCourt = async (
    matchId: string,
    courtId: string,
    date: string,
    time: string
  ) => {
    if (!tournament) return;
    setIsProcessing(true);
    try {
      const match = matches.find(m => m.id === matchId);
      if (!match) throw new Error('Partido no encontrado');

      // Verificar conflicto de cancha
      const conflict = matches.find(m =>
        m.id !== matchId &&
        m.courtId === courtId &&
        m.date === date &&
        m.time === time &&
        m.status === 'pending'
      );

      if (conflict) {
        const court = courts.find(c => c.id === courtId);
        showToast(`La cancha ${court?.name ?? courtId} ya está ocupada en ese horario.`, 'error');
        return;
      }

      const updated = { ...match, courtId, date, time };
      await repository.saveMatch(updated);
      setMatches(matches.map(m => m.id === matchId ? updated : m));
      showToast('Cancha y horario asignados correctamente.', 'success');
    } catch (e) {
      showToast('Error al asignar cancha.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Cargar resultado de un partido
  const handleSaveResult = async (
    matchId: string,
    winnerPairId: string,
    scoreSummary: string
  ) => {
    if (!tournament) return;
    setIsProcessing(true);
    try {
      const match = matches.find(m => m.id === matchId);
      if (!match) throw new Error('Partido no encontrado');

      const updated = { ...match, winnerPairId, scoreSummary, status: 'completed' as const };
      await repository.saveMatch(updated);
      setMatches(matches.map(m => m.id === matchId ? updated : m));
      showToast('Resultado guardado correctamente.', 'success');
    } catch (e) {
      showToast('Error al guardar resultado.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    handleAssignCourt,
    handleSaveResult,
  };
}
