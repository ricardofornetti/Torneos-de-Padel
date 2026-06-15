import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  MapPin, 
  Check, 
  Trash2, 
  Calendar, 
  Clock, 
  AlertTriangle,
  Sparkles,
  Save,
  CheckCircle,
  X,
  Edit,
  ArrowLeft
} from 'lucide-react';
import { repository } from '../lib/repository';
import { Court, Match, Pair, Player } from '../types';

interface CourtManagerProps {
  userRole: "admin" | "player";
  onBack?: () => void;
}

export const CourtManager: React.FC<CourtManagerProps> = ({ userRole, onBack }) => {
  const [courts, setCourts] = useState<Court[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isCourtFormOpen, setIsCourtFormOpen] = useState(false);
  const [courtName, setCourtName] = useState("");
  const [courtClub, setCourtClub] = useState("");
  const [editCourtName, setEditCourtName] = useState("");
  const [editCourtClub, setEditCourtClub] = useState("");
  const [editingCourtId, setEditingCourtId] = useState<string | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [deleteCourtConfirm, setDeleteCourtConfirm] = useState<{ id: string; name: string } | null>(null);
  const [showDeleteAllCourtsModal, setShowDeleteAllCourtsModal] = useState(false);
  const [deletingCourts, setDeletingCourts] = useState(false);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [scheduleCourtId, setScheduleCourtId] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [overlapWarning, setOverlapWarning] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cList, mList, prList, pList] = await Promise.all([
        repository.getCourts(),
        repository.getMatches(),
        repository.getPairs(),
        repository.getPlayers()
      ]);
      
      setCourts(cList);
      setMatches(mList);
      setPairs(prList);
      setPlayers(pList);
    } catch (err) {
      console.error("CourtManager error loading data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddCourt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courtName || !courtClub) {
      alert("Por favor completa los campos.");
      return;
    }
    const newCourt: Court = {
      id: `court_${Date.now()}`,
      name: courtName,
      club: courtClub,
      active: true
    };
    await repository.saveCourt(newCourt);
    await repository.addNotification("Pista Creada", `Nueva cancha '${newCourt.name}' agregada con éxito.`, "info");
    
    setCourtName("");
    setCourtClub("");
    setIsCourtFormOpen(false);
    loadData();
  };

  const handleDeleteCourt = async (id: string, name: string) => {
    setDeleteCourtConfirm({ id, name });
  };

  const handleSaveEditCourt = async (id: string, name: string, club: string) => {
    if (!name || !club) {
      alert("Por favor completa todos los campos.");
      return;
    }
    const updatedCourt: Court = {
      id,
      name,
      club,
      active: true
    };
    await repository.saveCourt(updatedCourt);
    await repository.addNotification("Pista Actualizada", `Cancha '${name}' modificada con éxito.`, "info");
    loadData();
  };

  const handleDeleteAllCourts = () => {
    setShowDeleteAllCourtsModal(true);
  };

  const executeDeleteAllCourts = async () => {
    setShowDeleteAllCourtsModal(false);
    setDeletingCourts(true);
    try {
      await Promise.all(courts.map(c => repository.deleteCourt(c.id)));
      await repository.addNotification(
        "Limpieza de Pistas", 
        "Se han eliminado todos los complejos y canchas cargados hasta el momento.", 
        "warning"
      );
      await loadData();
    } catch (err) {
      console.error("Error deleting all courts:", err);
    } finally {
      setDeletingCourts(false);
    }
  };

  const executeDeleteCourt = async () => {
    if (!deleteCourtConfirm) return;
    const { id, name } = deleteCourtConfirm;
    setDeleteCourtConfirm(null);
    try {
      await repository.deleteCourt(id);
      await repository.addNotification("Pista Desactivada", `Se removió la cancha '${name}'.`, "warning");
      loadData();
    } catch (err) {
      console.error("Error deleting court:", err);
    }
  };

  // Convert time "HH:MM" to minutes for overlap checking
  const timeToMinutes = (timeStr: string): number => {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  // ADVANCED OVERLAP CHECKER ENGINE (Standard slot duration = 90 mins)
  const checkOverlap = (courtId: string, date: string, timeStr: string, excludeMatchId: string): string | null => {
    const checkStart = timeToMinutes(timeStr);
    const checkEnd = checkStart + 90; // 90 min duration for court bookings

    const courtMatches = matches.filter(
      m => m.courtId === courtId && m.date === date && m.id !== excludeMatchId && m.status === "pending"
    );

    for (const m of courtMatches) {
      if (!m.time) continue;
      const mStart = timeToMinutes(m.time);
      const mEnd = mStart + 90;

      // Overlap logic: A intersection B
      if (checkStart < mEnd && checkEnd > mStart) {
        return `⚠️ CONFLICTO DE RESERVA: Pista saturada. Existe un partido programado entre ${m.time} y ${Math.floor(mEnd/60)}:${mEnd%60 === 0 ? '00' : mEnd%60} de ese mismo día en esta cancha.`;
      }
    }
    return null;
  };

  // Handle changing slot details
  useEffect(() => {
    if (scheduleCourtId && scheduleDate && scheduleTime && selectedMatchId) {
      const conflict = checkOverlap(scheduleCourtId, scheduleDate, scheduleTime, selectedMatchId);
      setOverlapWarning(conflict);
    } else {
      setOverlapWarning(null);
    }
  }, [scheduleCourtId, scheduleDate, scheduleTime, selectedMatchId]);

  const handleOpenScheduleModal = (m: Match) => {
    setSelectedMatchId(m.id);
    setScheduleCourtId(m.courtId || (courts[0]?.id || ""));
    setScheduleDate(m.date || new Date().toISOString().split('T')[0]);
    setScheduleTime(m.time || "18:00");
    setIsScheduleModalOpen(true);
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatchId || !scheduleCourtId || !scheduleDate || !scheduleTime) {
      alert("Completa todos los datos de asignación.");
      return;
    }

    // Check overlap first
    const overlapStr = checkOverlap(scheduleCourtId, scheduleDate, scheduleTime, selectedMatchId);
    if (overlapStr && userRole !== "admin") {
      alert("No se puede asignar: existe solapamiento de horarios.");
      return;
    }

    const matchToUpdate = matches.find(m => m.id === selectedMatchId);
    if (matchToUpdate) {
      const updatedMatch: Match = {
        ...matchToUpdate,
        courtId: scheduleCourtId,
        date: scheduleDate,
        time: scheduleTime
      };
      await repository.saveMatch(updatedMatch);
      await repository.addNotification(
        "Cancha Asignada", 
        `Se ha programado el partido en ${courts.find(c => c.id === scheduleCourtId)?.name} el ${scheduleDate} a las ${scheduleTime} h.`,
        "success"
      );
    }

    setIsScheduleModalOpen(false);
    loadData();
  };

  const getPairName = (pairId: string) => {
    const p = pairs.find(item => item.id === pairId);
    if (!p) return "Sorteando...";
    const p1 = players.find(item => item.id === p.player1Id);
    const p2 = players.find(item => item.id === p.player2Id);
    return `${p1?.lastName || "?"} / ${p2?.lastName || "?"}`;
  };

  const pendingAssignments = matches.filter(m => m.status === "pending" && !m.courtId);
  const scheduledMatches = matches.filter(m => m.status === "pending" && m.courtId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 w-full flex-1">
        {onBack && (
          <button
            onClick={onBack}
            className="group text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-[#d4fc34] transition-colors flex items-center gap-1.5 self-start mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#d4fc34]" />
            <span>Volver</span>
          </button>
        )}

        {/* Light Header (Style A) */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-900 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-[#d4fc34]/15 text-[#d4fc34] border border-[#d4fc34]/20 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest font-mono">
                Sede Oficial
              </span>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest font-mono">
                PISTAS
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-wider text-white flex items-center gap-2.5">
              <MapPin className="w-7 h-7 text-[#d4fc34]" />
              <span>Complejos y Pistas</span>
            </h1>
            <p className="text-xs text-slate-400 font-normal">
              Control en tiempo real de partidos en cancha, disponibilidad física y turnos de juego.
            </p>
          </div>

          {userRole === "admin" && (
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <button
                onClick={() => {
                  setEditingCourtId(null);
                  setCourtName("");
                  setCourtClub("");
                  setIsCourtFormOpen(true);
                }}
                className="bg-[#d4fc34]/15 hover:bg-[#d4fc34] hover:text-slate-950 text-[#d4fc34] text-xs font-black px-5 py-3 rounded-xl border border-[#d4fc34]/20 uppercase tracking-widest flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow-lg hover:shadow-[#d4fc34]/10"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Cancha</span>
              </button>

              <button
                onClick={() => {
                  if (courts.length === 0) {
                    alert("No hay canchas registradas para gestionar.");
                    return;
                  }
                  setIsManageModalOpen(true);
                }}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold px-4 py-3 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer uppercase tracking-wider whitespace-nowrap"
              >
                <Edit className="w-4 h-4 text-[#d4fc34]" />
                <span>{courts.length > 0 ? "Modificar y Eliminar" : "Gestionar"}</span>
              </button>

              <button
                onClick={handleDeleteAllCourts}
                disabled={deletingCourts}
                className="bg-red-955/20 hover:bg-red-900/40 border border-red-900/50 text-red-300 hover:text-white text-xs font-bold px-4 py-3 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50 uppercase tracking-wider whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-550" />
                <span>{deletingCourts ? 'Eliminando...' : 'Eliminar Canchas'}</span>
              </button>
            </div>
          )}
        </div>

      {/* QUICK COURTS LIST */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {courts.map(c => {
          const bookedCount = matches.filter(m => m.courtId === c.id && m.status === "pending").length;
          return (
            <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-slate-500 font-mono font-bold uppercase">{c.club.split(" Padel ")[0]}</span>
                <h4 className="font-extrabold text-sm text-slate-100 mt-1">{c.name}</h4>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-indigo-400 font-mono font-medium">{bookedCount} Activos</span>
                {userRole === "admin" && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setEditingCourtId(c.id);
                        setEditCourtName(c.name);
                        setEditCourtClub(c.club);
                        setIsManageModalOpen(true);
                      }}
                      className="text-slate-500 hover:text-[#d4fc34] transition p-1 rounded hover:bg-slate-800 cursor-pointer"
                      title="Modificar cancha"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteCourt(c.id, c.name)}
                      className="text-slate-500 hover:text-red-400 transition p-1 rounded hover:bg-slate-800 cursor-pointer"
                      title="Eliminar cancha"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COL 1: PENDING ASSIGNMENT MATCHES list */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Sin Cancha Asignada
            </h3>
            <span className="bg-amber-600/10 text-amber-500 font-mono font-bold text-[10px] px-2 py-0.5 rounded-full">
              {pendingAssignments.length} partidos
            </span>
          </div>

          <div className="space-y-3">
            {pendingAssignments.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 text-center text-slate-600 text-xs">
                ¡Todos los partidos tienen cancha y horario asignados!
              </div>
            ) : (
              pendingAssignments.map(m => (
                <div 
                  key={m.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3 hover:border-slate-700 transition"
                >
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono block mb-1">{m.stageName} • Ronda {m.roundNumber}</span>
                    <span className="font-extrabold text-xs block text-slate-200">
                      {getPairName(m.pair1Id)}
                    </span>
                    <span className="text-[10px] text-slate-500 block font-mono">Vs</span>
                    <span className="font-extrabold text-xs block text-slate-200">
                      {getPairName(m.pair2Id)}
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenScheduleModal(m)}
                    className="w-full bg-slate-800 hover:bg-slate-700 hover:text-blue-400 text-slate-350 text-xs font-bold py-2 rounded-lg transition text-center cursor-pointer"
                  >
                    Asignar Cancha / Hora
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COL 2: BOOKINGS SCHEDULE GRAPH / CALENDAR */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-green-500" /> Reservas Vigentes en el Complejo
          </h3>

          <div className="space-y-3">
            {scheduledMatches.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-12 text-center text-slate-600 text-xs">
                No hay cronogramas activos cargados hoy en el panel.
              </div>
            ) : (
              scheduledMatches.map(m => (
                <div 
                  key={m.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div className="space-y-1">
                    <span className="bg-indigo-600/10 text-indigo-400 font-mono font-bold text-[10px] px-2 py-0.5 rounded">
                      {courts.find(c => c.id === m.courtId)?.name || "Pista"}
                    </span>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="font-extrabold text-xs text-white">{getPairName(m.pair1Id)}</span>
                      <span className="text-[10px] text-slate-500 font-mono">vs</span>
                      <span className="font-extrabold text-xs text-white">{getPairName(m.pair2Id)}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block font-mono">{m.stageName} • Ronda {m.roundNumber}</span>
                  </div>

                  <div className="flex flex-col md:items-end gap-2 shrink-0">
                    <div className="flex items-center gap-2 text-xs font-mono font-medium text-slate-350">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{m.date}</span>
                      <Clock className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
                      <span>{m.time} h</span>
                    </div>

                    {userRole === "admin" && (
                      <button
                        onClick={() => handleOpenScheduleModal(m)}
                        className="text-xs text-blue-400 hover:text-blue-300 font-bold hover:underline"
                      >
                        Re-programar partido
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* FORM MODAL: ADD COURT */}
      {isCourtFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="font-extrabold text-sm text-white">⚙️ Registrar Pista</span>
              <button onClick={() => setIsCourtFormOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleAddCourt} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] uppercase text-slate-400 font-mono">Nombre de Pista *</label>
                <input
                  type="text"
                  required
                  placeholder="Cancha 4 - Cristal Premium"
                  value={courtName}
                  onChange={(e) => setCourtName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase text-slate-400 font-mono">Complejo / Club *</label>
                <input
                  type="text"
                  required
                  placeholder="Club Cristal Padel Recoletos"
                  value={courtClub}
                  onChange={(e) => setCourtClub(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCourtFormOpen(false)}
                  className="flex-1 bg-slate-800 text-slate-350 text-xs py-2 rounded-lg font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#d4fc34] hover:bg-[#c5f015] text-slate-950 text-xs font-black py-2.5 rounded-xl cursor-pointer uppercase tracking-wider transition"
                >
                  Guardar Cancha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN SCHEDULE & COURT */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="font-extrabold text-sm text-white">📅 Programar Turno de Juego</span>
              <button onClick={() => setIsScheduleModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="p-5 space-y-4">
              
              <div className="space-y-1">
                <label className="block text-[10px] uppercase text-slate-400">Seleccionar Cancha *</label>
                <select
                  value={scheduleCourtId}
                  onChange={(e) => setScheduleCourtId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none"
                >
                  {courts.map(c => {
                    let isOccupied = false;
                    let occupyingDetails = "";
                    if (scheduleDate && scheduleTime && selectedMatchId) {
                      const checkStart = timeToMinutes(scheduleTime);
                      const checkEnd = checkStart + 90;
                      const courtMatches = matches.filter(
                        m => m.courtId === c.id && m.date === scheduleDate && m.id !== selectedMatchId && m.status === "pending"
                      );
                      const matchConflict = courtMatches.find(m => {
                        if (!m.time) return false;
                        const mStart = timeToMinutes(m.time);
                        const mEnd = mStart + 90;
                        return checkStart < mEnd && checkEnd > mStart;
                      });
                      if (matchConflict) {
                        isOccupied = true;
                        occupyingDetails = ` (Ocupada @ ${matchConflict.time})`;
                      }
                    }
                    return (
                      <option key={c.id} value={c.id} disabled={isOccupied}>
                        {c.name} ({c.club.split(" ")[0]}){occupyingDetails}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase text-slate-400">Fecha *</label>
                  <input
                    type="date"
                    required
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase text-slate-400">Hora *</label>
                  <input
                    type="time"
                    required
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              {/* OVERLAP WARNING RENDERER */}
              {overlapWarning && (
                <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-3 flex gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-red-300 leading-relaxed font-sans">{overlapWarning}</p>
                </div>
              )}

              <div className="pt-2 flex gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="flex-1 bg-slate-800 text-slate-350 py-2 rounded-lg font-bold"
                >
                  Salir
                </button>
                <button
                  type="submit"
                  disabled={!!overlapWarning && userRole !== "admin"}
                  className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    overlapWarning && userRole !== "admin"
                      ? "bg-slate-800 text-slate-600 border border-slate-850 cursor-not-allowed"
                      : "bg-[#d4fc34] hover:bg-[#c5f015] text-slate-950"
                  }`}
                >
                  <Save className={`w-3.5 h-3.5 ${overlapWarning && userRole !== "admin" ? 'text-slate-600' : 'text-slate-950'}`} /> Programar Partido
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteCourtConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-[#0f172a] border border-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-white text-base">
                ¿Eliminar Cancha?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                ¿Estás seguro de que deseas desactivar/eliminar la cancha <span className="text-white font-semibold">'{deleteCourtConfirm.name}'</span>? No afectará a partidos previos.
              </p>
            </div>
            
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setDeleteCourtConfirm(null)}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold px-4 py-2.5 rounded-lg border border-slate-800 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeDeleteCourt}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE ALL COURTS CONFIRMATION MODAL */}
      {showDeleteAllCourtsModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-[#0f172a] border border-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-white text-base">
                ¿Eliminar Todos los Complejos?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                ¿Estás seguro de que deseas eliminar <strong className="text-white">TODAS</strong> las canchas y complejos deportivos registrados hasta el momento? No se puede deshacer.
              </p>
            </div>
            
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setShowDeleteAllCourtsModal(false)}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold px-4 py-2.5 rounded-lg border border-slate-800 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeDeleteAllCourts}
                className="flex-1 bg-red-650 hover:bg-red-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition cursor-pointer"
              >
                Eliminar Todo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FORM MODAL: MANAGE COURTS */}
      {isManageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="font-extrabold text-sm text-white flex items-center gap-1.5">
                <Edit className="w-4 h-4 text-indigo-400" /> Modificar o Eliminar Canchas
              </span>
              <button onClick={() => setIsManageModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-4 divide-y divide-slate-800/60 font-sans">
              {courts.map((c, idx) => {
                const isCurrentEditing = editingCourtId === c.id;
                return (
                  <div key={c.id} className={`pt-4 ${idx === 0 ? 'pt-0' : ''}`}>
                    {isCurrentEditing ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[9px] uppercase tracking-wider text-slate-400 font-mono">Nombre de Cancha</label>
                            <input
                              type="text"
                              value={editCourtName}
                              onChange={(e) => setEditCourtName(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[9px] uppercase tracking-wider text-slate-400 font-mono">Complejo / Club</label>
                            <input
                              type="text"
                              value={editCourtClub}
                              onChange={(e) => setEditCourtClub(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>
                        
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => setEditingCourtId(null)}
                            className="bg-slate-800 text-slate-350 text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-slate-750 transition cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await handleSaveEditCourt(c.id, editCourtName, editCourtClub);
                              setEditingCourtId(null);
                            }}
                            className="bg-[#d4fc34] text-slate-950 text-[10px] font-black px-3.5 py-1.5 rounded-lg hover:bg-[#c5f015] transition uppercase tracking-wider cursor-pointer"
                          >
                            Guardar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <span className="text-[10px] text-indigo-400 font-mono font-bold uppercase">{c.club}</span>
                          <h4 className="font-extrabold text-xs text-white mt-0.5">{c.name}</h4>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0 font-sans">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCourtId(c.id);
                              setEditCourtName(c.name);
                              setEditCourtClub(c.club);
                            }}
                            className="bg-slate-800 hover:bg-slate-750 text-slate-200 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                          >
                            Modificar
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => {
                              handleDeleteCourt(c.id, c.name);
                            }}
                            className="bg-red-950/30 hover:bg-red-900/40 text-red-400 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-red-900/20 transition cursor-pointer"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="p-4 border-t border-slate-800 bg-slate-950/45 text-right flex justify-between items-center text-xs">
              <span className="text-[10px] text-slate-500 font-mono">
                Total canchas: {courts.length}
              </span>
              <button
                type="button"
                onClick={() => setIsManageModalOpen(false)}
                className="bg-slate-800 text-slate-300 py-1.5 px-4 rounded-xl font-bold hover:bg-slate-700 transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};
