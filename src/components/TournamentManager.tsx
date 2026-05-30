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
  Edit
} from 'lucide-react';
import { repository } from '../lib/repository';
import { Tournament } from '../types';

interface TournamentManagerProps {
  userRole: "admin" | "player";
  onSelectTournament: (id: string) => void;
}

export const TournamentManager: React.FC<TournamentManagerProps> = ({ 
  userRole, 
  onSelectTournament 
}) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteTConfirm, setDeleteTConfirm] = useState<{ id: string; name: string } | null>(null);
  
  // Tabs
  const [activeTabStatus, setActiveTabStatus] = useState<"active" | "completed">("active");

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newT, setNewT] = useState({
    name: "",
    club: "",
    city: "",
    startDate: "",
    endDate: "",
    maxPairs: 8,
    numGroups: 2,
    numCourts: 3
  });

  const loadTournaments = async () => {
    setLoading(true);
    const list = await repository.getTournaments();
    setTournaments(list);
    setLoading(false);
  };

  useEffect(() => {
    loadTournaments();
  }, []);

  const handleOpenCreateForm = () => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    setEditingId(null);
    setNewT({
      name: "",
      club: "",
      city: "",
      startDate: today.toISOString().split('T')[0],
      endDate: nextWeek.toISOString().split('T')[0],
      maxPairs: 8,
      numGroups: 2,
      numCourts: 3
    });
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
      const tObj: Tournament = {
        id: `tournament_${Date.now()}`,
        name: newT.name,
        club: newT.club,
        city: newT.city,
        category: "Multicategoría",
        tournamentType: "Grupos + Eliminatorias",
        startDate: newT.startDate,
        endDate: newT.endDate,
        status: "registration", // Stays in registration pending drawing
        maxPairs: Number(newT.maxPairs) || 8,
        numGroups: Number(newT.numGroups) || 2,
        numCourts: Number(newT.numCourts) || 3
      };

      await repository.saveTournament(tObj);
      await repository.addNotification(
        "Torneo Creado",
        `Se ha habilitado la inscripción multicategoría para el torneo '${tObj.name}'.`,
        "success"
      );
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
    const term = search.toLowerCase();
    const matchesSearch = t.name.toLowerCase().includes(term) || t.club.toLowerCase().includes(term) || t.city.toLowerCase().includes(term);
    
    // Status filters matches tab selection
    const isCompleted = t.status === "completed";
    const matchesTab = activeTabStatus === "completed" ? isCompleted : !isCompleted;

    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-blue-500" /> Circuito de Torneos
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gestión y panel de torneos abiertos, ligas en curso y campeonatos históricos cerrados.
          </p>
        </div>

        {userRole === "admin" && (
          <button
            onClick={handleOpenCreateForm}
            className="bg-[#d4fc34] hover:bg-[#c5f015] text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer ml-auto uppercase tracking-wider"
          >
            <Plus className="w-4 h-4 text-slate-950" /> Crear Torneo
          </button>
        )}
      </div>

      {/* TABS STATUS NAVIGATION */}
      <div className="flex border-b border-slate-850 gap-2">
        <button
          onClick={() => setActiveTabStatus("active")}
          className={`pb-2 px-4 text-xs font-bold border-b-2 transition ${
            activeTabStatus === "active"
              ? "border-blue-500 text-white font-black"
              : "border-transparent text-slate-500 hover:text-slate-350"
          }`}
        >
          🏆 Ligas y Torneos Vigentes / RegistroAbierto
        </button>
        <button
          onClick={() => setActiveTabStatus("completed")}
          className={`pb-2 px-4 text-xs font-bold border-b-2 transition ${
            activeTabStatus === "completed"
              ? "border-blue-500 text-white font-black"
              : "border-transparent text-slate-500 hover:text-slate-350"
          }`}
        >
          📜 Historial de Torneos Cerrados
        </button>
      </div>

      {/* SEARCH CONTROLS */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center">
        
        {/* Search Input */}
        <div className="w-full relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-4 top-3" />
          <input
            type="text"
            placeholder="Buscar por torneo, club sede o ciudad de juego..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl pl-11 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition"
          />
        </div>

      </div>

      {/* TOURNAMENTS LIST DISPLAY */}
      {loading ? (
        <div className="text-center py-10 font-mono text-slate-500 text-xs">
          Comunicando con Firestore...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center text-slate-500 text-xs">
          No se encontraron torneos vigentes para esta sección.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(t => (
            <div 
              key={t.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 transition rounded-xl flex flex-col justify-between group overflow-hidden"
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
                      <span className="font-mono text-[11px]">{t.startDate} al {t.endDate}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{t.numGroups} grupos • max {t.maxPairs} parejas</span>
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

            </div>
          ))}
        </div>
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
                  <label className="block text-[10px] uppercase text-slate-400 font-mono">Provincia / Ciudad *</label>
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

              {/* Division / Level grids replaced with Multi-category information */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                <span className="text-[10px] text-blue-400 font-mono font-bold tracking-wider uppercase block">
                  Estructura Multicategoría Activada
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  Este torneo habilitará de forma automática e independiente las 11 categorías estándar del circuito (4ta a 8va Masculina, 5ta a 7ma Femenina y Mixtos A/B/C) para que las parejas se inscriban de acuerdo a su nivel.
                </p>
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

              {/* Tournament structure configs (groups / max couples) */}
              <div className="grid grid-cols-3 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-880">
                
                <div className="space-y-1">
                  <label className="block text-[9px] text-slate-400 font-mono uppercase">Max Parejas</label>
                  <select
                    value={newT.maxPairs}
                    onChange={(e) => setNewT({...newT, maxPairs: Number(e.target.value)})}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-slate-100 outline-none"
                  >
                    {[4, 6, 8, 12, 16, 24, 32].map(n => (
                      <option key={n} value={n}>{n} Parejas</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] text-slate-400 font-mono uppercase">Cant Zonas (Grupos)</label>
                  <select
                    value={newT.numGroups}
                    onChange={(e) => setNewT({...newT, numGroups: Number(e.target.value)})}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-slate-100 outline-none"
                  >
                    {[1, 2, 3, 4, 6, 8].map(n => (
                      <option key={n} value={n}>{n} Grupos</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] text-slate-400 font-mono uppercase">Pistas complejas</label>
                  <select
                    value={newT.numCourts}
                    onChange={(e) => setNewT({...newT, numCourts: Number(e.target.value)})}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-slate-100 outline-none"
                  >
                    {[1, 2, 3, 4, 5, 8].map(n => (
                      <option key={n} value={n}>{n} Canchas</option>
                    ))}
                  </select>
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
                  <Save className="w-3.5 h-3.5 text-slate-950" /> {editingId ? "Guardar Cambios" : "Generar Torneo Abierto"}
                </button>
              </div>

            </form>
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
  );
};
