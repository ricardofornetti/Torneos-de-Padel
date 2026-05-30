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
  X
} from 'lucide-react';
import { repository } from '../lib/repository';
import { Court, Match, Pair, Player } from '../types';

export const CourtManager: React.FC<{ userRole: "admin" | "player" }> = ({ userRole }) => {
  const [courts, setCourts] = useState<Court[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isCourtFormOpen, setIsCourtFormOpen] = useState(false);
  const [courtName, setCourtName] = useState("");
  const [courtClub, setCourtClub] = useState("");
  const [deleteCourtConfirm, setDeleteCourtConfirm] = useState<{ id: string; name: string } | null>(null);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [scheduleCourtId, setScheduleCourtId] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [overlapWarning, setOverlapWarning] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const cList = await repository.getCourts();
    const mList = await repository.getMatches();
    const prList = await repository.getPairs();
    const pList = await repository.getPlayers();
    
    setCourts(cList);
    setMatches(mList);
    setPairs(prList);
    setPlayers(pList);
    setLoading(false);
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
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <MapPin className="w-6 h-6 text-indigo-500" /> Control de Pistas y Cronograma
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gestión física del complejo deportivo: añade canchas, visualiza reservas horarias y asigna canchas evitando superposiciones.
          </p>
        </div>

        {userRole === "admin" && (
          <button
            onClick={() => setIsCourtFormOpen(true)}
            className="bg-[#d4fc34] hover:bg-[#c5f015] text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition ml-auto cursor-pointer uppercase tracking-wider"
          >
            <Plus className="w-4 h-4 text-slate-950" /> Agregar Cancha
          </button>
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
                {userRole === "admin" && courts.length > 3 && (
                  <button 
                    onClick={() => handleDeleteCourt(c.id, c.name)}
                    className="text-slate-500 hover:text-red-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
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
                  {courts.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.club.split(" ")[0]})</option>
                  ))}
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

    </div>
  );
};
