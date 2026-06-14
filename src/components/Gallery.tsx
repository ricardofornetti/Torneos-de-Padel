import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Trash2, 
  Plus, 
  X, 
  Save, 
  Trophy, 
  Video, 
  Image as ImageIcon,
  Flame, 
  Sparkles, 
  ArrowLeftRight,
  UploadCloud,
  FileCheck,
  Film
} from 'lucide-react';
import { repository } from '../lib/repository';
import { GalleryMedia, Tournament, Match } from '../types';
import { PageHeaderBanner, PageHeaderButton } from './ui/PageHeaderBanner';

interface GalleryProps {
  userRole: "admin" | "player";
  onBack?: () => void;
}

export const Gallery: React.FC<GalleryProps> = ({ userRole, onBack }) => {
  const [mediaList, setMediaList] = useState<GalleryMedia[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedTournamentFilter, setSelectedTournamentFilter] = useState("all");
  
  // Create / Upload state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCaption, setNewCaption] = useState("");
  const [newType, setNewType] = useState<"photo" | "video">("photo");
  const [selectedTournamentId, setSelectedTournamentId] = useState("");
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [fileBase64, setFileBase64] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [media, tourneys, games] = await Promise.all([
        repository.getGalleryMedia(),
        repository.getTournaments(),
        repository.getMatches()
      ]);
      setMediaList(media);
      setTournaments(tourneys);
      setMatches(games);
    } catch (err) {
      console.error("Error loading gallery data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file) return;

    // Check size limit: restrict base64 stored files to ~2MB to protect local quotas, or use objectURLs if exceeded
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      setFileBase64(base64);
      setFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleOpenForm = () => {
    setNewTitle("");
    setNewCaption("");
    setNewType("photo");
    setSelectedTournamentId("");
    setSelectedMatchId("");
    setFileBase64("");
    setFileName("");
    setIsFormOpen(true);
  };

  const handleCreateMedia = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fileBase64) {
      alert("Por favor selecciona un archivo de imagen o video.");
      return;
    }

    const mediaObj: GalleryMedia = {
      id: "media_" + Date.now(),
      tournamentId: selectedTournamentId || undefined,
      matchId: selectedMatchId || undefined,
      url: fileBase64,
      type: newType,
      title: newTitle || (newType === "photo" ? "Foto de Partido" : "Video de Jugada"),
      caption: newCaption || undefined,
      createdAt: new Date().toISOString()
    };

    setLoading(true);
    await repository.saveGalleryMedia(mediaObj);
    
    // Add success notification
    await repository.addNotification(
      "Galería Actualizada",
      `Se agregó exitosamente: "${mediaObj.title}" a la galería.`,
      "success"
    );

    setIsFormOpen(false);
    loadData();
  };

  const handleDeleteMedia = async (id: string, title: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar "${title}" de la galería?`)) {
      setLoading(true);
      await repository.deleteGalleryMedia(id);
      await repository.addNotification(
        "Multimedia Eliminada",
        `Se eliminó "${title}" de la galería de partidos.`,
        "warning"
      );
      loadData();
    }
  };

  const filteredMedia = mediaList.filter(item => {
    if (selectedTournamentFilter === "all") return true;
    return item.tournamentId === selectedTournamentFilter;
  });

  const selectedTournamentMatches = matches.filter(m => m.tournamentId === selectedTournamentId);

  return (
    <div className="w-full flex flex-col">
      
      {/* Full-width header banner */}
      <PageHeaderBanner
        onBack={onBack}
        gridPatternId="grid-gallery"
        eyebrow="Cobertura Oficial"
        eyebrowColor="cyan"
        title="Galería Oficial"
        description="Visualizador de fotografías, resúmenes multimedia y momentos decisivos del circuito."
        cornerBadge="EN VIVO"
        icon={
          <svg className="w-14 h-14 relative z-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Camera outer body */}
            <rect x="20" y="32" width="60" height="42" rx="8" fill="#0f172a" stroke="#d4fc34" strokeWidth="2.5" />
            <path d="M40 32 L44 24 H56 L60 32 Z" fill="#0f172a" stroke="#d4fc34" strokeWidth="2" />
            {/* Lens frame */}
            <circle cx="50" cy="53" r="16" fill="#1e293b" stroke="#d4fc34" strokeWidth="2" />
            {/* Neon yellow core ball representing the lens reflections */}
            <circle cx="50" cy="53" r="10" fill="#d4fc34" />
            {/* Lens glare specular reflection arcs */}
            <path d="M45 48 A 7 7 0 0 1 55 48" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
            {/* Flash bulb indicator */}
            <circle cx="70" cy="40" r="3" fill="#facc15" />
          </svg>
        }
        actions={
          userRole === "admin" && (
            <PageHeaderButton
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={handleOpenForm}
            >
              Cargar Multimedia
            </PageHeaderButton>
          )
        }
      />

      {/* Main page content wrapped in centered padding */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* FILTER & STATS BANNER */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Dropdown Filters */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono font-bold">Torneo:</span>
          <select
            value={selectedTournamentFilter}
            onChange={(e) => setSelectedTournamentFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-200 p-2 rounded-lg outline-none focus:border-cyan-500"
          >
            <option value="all">Ver Todos los Torneos</option>
            {tournaments.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Info label */}
        <div className="text-[11px] text-slate-500 font-mono">
          Mostrando <span className="text-cyan-400 font-bold">{filteredMedia.length}</span> archivos de partidos
        </div>
      </div>

      {/* GALLERY LIST GRID */}
      {loading ? (
        <div className="text-center py-20 font-mono text-slate-500 text-xs">
          Recuperando galería oficial de Firestore...
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-16 text-center space-y-4">
          <UploadCloud className="w-12 h-12 text-slate-700 mx-auto" />
          <div className="text-slate-400 text-sm font-semibold">Aún sin registros multimedia</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Sube fotos o videos cortos de los encuentros en curso para que los jugadores sigan el historial del campeonato en tiempo real.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMedia.map(item => {
            const tournament = tournaments.find(t => t.id === item.tournamentId);
            const matchObj = matches.find(m => m.id === item.matchId);
            
            return (
              <div 
                key={item.id} 
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 transition rounded-2xl overflow-hidden flex flex-col group relative"
              >
                
                {/* Media representation */}
                <div className="aspect-video relative bg-black overflow-hidden flex items-center justify-center">
                  {item.type === "video" ? (
                    item.url.startsWith("data:video") || item.url.startsWith("blob:") || item.url.startsWith("http") ? (
                      <video 
                        src={item.url} 
                        controls 
                        className="w-full h-full object-cover" 
                        preload="metadata"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center text-slate-500 gap-2 p-4 text-center">
                        <Film className="w-10 h-10 text-cyan-500 animate-pulse" />
                        <span className="text-xs font-mono font-bold uppercase text-slate-400">Play Video</span>
                        <span className="text-[10px] text-slate-600 line-clamp-1">{item.title}</span>
                      </div>
                    )
                  ) : (
                    <img 
                      src={item.url} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      referrerPolicy="no-referrer"
                    />
                  )}

                  {/* Badges Overlay */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="bg-slate-950/80 backdrop-blur-md text-slate-300 border border-slate-850 text-[9px] font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1 uppercase">
                      {item.type === "video" ? <Video className="w-3 h-3 text-cyan-400" /> : <ImageIcon className="w-3 h-3 text-emerald-400" />}
                      {item.type === "video" ? "Video" : "Foto"}
                    </span>
                  </div>

                  {/* Delete button overlay for Admin */}
                  {userRole === "admin" && (
                    <button
                      onClick={() => handleDeleteMedia(item.id, item.title || "Multimedia")}
                      className="absolute top-3 right-3 bg-red-650/80 backdrop-blur-md text-white hover:bg-red-600 p-1.5 rounded-lg border border-red-500/25 transition cursor-pointer"
                      title="Eliminar de galería"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Description Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-extrabold text-white text-sm tracking-tight leading-tight group-hover:text-cyan-400 transition">
                      {item.title}
                    </h3>
                    {item.caption && (
                      <p className="text-slate-400 text-[11px] leading-relaxed mt-1 line-clamp-2">
                        {item.caption}
                      </p>
                    )}
                  </div>

                  {/* Game Associations Foot */}
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 space-y-1 text-[10px] text-slate-500">
                    {tournament && (
                      <div className="flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-amber-500 shrink-0" />
                        <span className="truncate font-semibold text-slate-400">{tournament.name}</span>
                      </div>
                    )}
                    {matchObj && (
                      <div className="flex items-center gap-1 font-mono text-[9px]">
                        <ArrowLeftRight className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="truncate">Partido: {matchObj.stageName} ({matchObj.scoreSummary || "En espera"})</span>
                      </div>
                    )}
                    <div className="text-[8px] text-slate-600 font-mono text-right mt-1">
                      {new Date(item.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* FORM MODAL FOR ADMIN UPLOADS */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="font-extrabold text-sm text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" /> Cargar Archivo a la Galería
              </span>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMedia} className="overflow-y-auto p-5 space-y-4 text-xs font-sans">
              
              {/* Type Switcher */}
              <div className="space-y-1">
                <label className="block text-[10px] uppercase text-slate-400 font-mono">Tipo de Archivo</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setNewType("photo")}
                    className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      newType === "photo" ? "bg-slate-850 text-white border border-slate-750" : "text-slate-500 hover:text-slate-350"
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" /> Foto
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType("video")}
                    className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      newType === "video" ? "bg-slate-850 text-white border border-slate-750" : "text-slate-500 hover:text-slate-350"
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" /> Video / Jugada
                  </button>
                </div>
              </div>

              {/* Title & Caption */}
              <div className="space-y-1">
                <label className="block text-[10px] uppercase text-slate-400 font-mono">Título del momento *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Tremenda bandeja de Coello"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase text-slate-400 font-mono">Breve reseña / Comentario</label>
                <textarea
                  placeholder="Ej: Impresionante cruce de bolas en la volea por el set point"
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 h-16 outline-none focus:border-cyan-500"
                />
              </div>

              {/* File drag selector area */}
              <div className="space-y-1">
                <label className="block text-[10px] uppercase text-slate-400 font-mono">Archivo Multimedia *</label>
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition ${
                    dragActive ? "border-cyan-500 bg-cyan-500/5" : "border-slate-850 bg-slate-950"
                  }`}
                >
                  <label className="cursor-pointer flex flex-col items-center justify-center space-y-2">
                    <input
                      type="file"
                      accept={newType === "photo" ? "image/*" : "video/*"}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {fileBase64 ? (
                      <>
                        <FileCheck className="w-10 h-10 text-emerald-400" />
                        <span className="text-white font-semibold text-xs truncate max-w-[200px] block">
                          {fileName || "Archivo Cargado"}
                        </span>
                        <span className="text-[10px] text-slate-500">Haz clic para cambiar de archivo</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-10 h-10 text-slate-600 mx-auto" />
                        <div className="text-slate-350 text-xs font-bold font-sans">Arrastra tu archivo aquí o busca en tu equipo</div>
                        <p className="text-[10px] text-slate-600 font-mono">Formato aceptado: {newType === "photo" ? "Imagenes (PNG/JPG)" : "Videos (MP4)"}</p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Game Associations */}
              <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-880">
                <div className="space-y-1">
                  <label className="block text-[9px] text-slate-400 font-mono uppercase">Torneo Asociado</label>
                  <select
                    value={selectedTournamentId}
                    onChange={(e) => { setSelectedTournamentId(e.target.value); setSelectedMatchId(""); }}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200 outline-none focus:border-cyan-500 text-xs"
                  >
                    <option value="">Ninguno</option>
                    {tournaments.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] text-slate-400 font-mono uppercase">Partido Asociado</label>
                  <select
                    value={selectedMatchId}
                    disabled={!selectedTournamentId}
                    onChange={(e) => setSelectedMatchId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200 outline-none focus:border-cyan-500 text-xs disabled:opacity-40"
                  >
                    <option value="">Ninguno</option>
                    {selectedTournamentMatches.map(m => (
                      <option key={m.id} value={m.id}>{m.stageName} ({m.scoreSummary || "Pendiente"})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3 font-sans">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#d4fc34] hover:bg-[#c5f015] text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer uppercase tracking-wider"
                >
                  <Save className="w-3.5 h-3.5 text-slate-950" /> Guardar en Galería
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};
