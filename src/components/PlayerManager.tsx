import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit3, 
  Filter, 
  Mail, 
  Phone, 
  MapPin, 
  Award, 
  CreditCard, 
  Calendar,
  X,
  Save,
  TrendingUp,
  Image,
  Camera,
  Video,
  VideoOff
} from 'lucide-react';
import { repository } from '../lib/repository';
import { Player } from '../types';
import { getFIPTop100Males, getFIPTop100Females } from '../lib/fipRankingsData';

interface PlayerManagerProps {
  userRole: "admin" | "player";
  onBack?: () => void;
}

const PADEL_CATEGORIES = [
  "Libre Masculina",
  "4ta Masculina",
  "5ta Masculina",
  "6ta Masculina",
  "7ma Masculina",
  "6ta Femenina",
  "7ma Femenina"
];

const AVATARS = [
  "https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200"
];

export const PlayerManager: React.FC<PlayerManagerProps> = ({ userRole, onBack }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("all");
  const [loggedEmail, setLoggedEmail] = useState<string>("");
  const [genderFilter, setGenderFilter] = useState<"all" | "Masculino" | "Femenino">("Masculino");
  
  const getPlayerGender = (p: Player): "Masculino" | "Femenino" => {
    const cat = (p.category || "").toLowerCase();
    if (cat.includes("femenina") || cat.includes("femenino")) {
      return "Femenino";
    }
    return "Masculino";
  };
  
  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  // Camera Integration States and Refs
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 300, height: 300, facingMode: "user" }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Native code handles play
      }
      setIsCameraActive(true);
    } catch (err) {
      console.error("Camera access error", err);
      setCameraError("No se pudo acceder a la cámara. Permiso denegado o no disponible.");
    }
  };

  // Play handler to catch asynchronously
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.play().catch(e => console.error("Camera play failed", e));
    }
  }, [isCameraActive]);

  // Stop Camera Stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Capture Base64 frame
  const capturePhoto = () => {
    if (!videoRef.current) return;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 300, 300);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setNewPlayer(prev => ({ ...prev, photoUrl: dataUrl }));
      }
      stopCamera();
    } catch (err) {
      console.error("Capture photo error", err);
      setCameraError("Error al capturar la imagen.");
    }
  };

  const handleCloseForm = () => {
    stopCamera();
    setIsFormOpen(false);
  };
  
  const [newPlayer, setNewPlayer] = useState({
    firstName: "",
    lastName: "",
    dni: "",
    phone: "",
    email: "",
    city: "",
    birthDate: "",
    category: "6ta Masculina",
    rankingPoints: 0,
    photoUrl: ""
  });

  const loadPlayers = async () => {
    setLoading(true);
    const list = await repository.getPlayers();
    setPlayers(list);
    setLoading(false);
  };

  useEffect(() => {
    loadPlayers();
  }, []);

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
    // Also attach listener for custom login updates
    window.addEventListener("storage", handleCheckUser);
    return () => window.removeEventListener("storage", handleCheckUser);
  }, [players]);

  const handleOpenCreateForm = () => {
    let prefilledEmail = "";
    const localUserJson = localStorage.getItem("padel_mgr_mock_user");
    if (localUserJson) {
      try {
        prefilledEmail = JSON.parse(localUserJson).email || "";
      } catch (e) {}
    }

    setEditingPlayer(null);
    setNewPlayer({
      firstName: "",
      lastName: "",
      dni: "",
      phone: "",
      email: prefilledEmail,
      city: "",
      birthDate: "1995-01-01",
      category: "6ta Masculina",
      rankingPoints: 0,
      photoUrl: AVATARS[Math.floor(Math.random() * AVATARS.length)]
    });
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (player: Player) => {
    setEditingPlayer(player);
    let cat = player.category;
    if (!PADEL_CATEGORIES.includes(cat)) {
      if (cat.includes("Primera") || cat.includes("Libre")) {
        cat = "Libre Masculina";
      } else if (cat.includes("Segunda") || cat.includes("4ta")) {
        cat = "4ta Masculina";
      } else if (cat.includes("Tercera") || cat.includes("5ta")) {
        cat = "5ta Masculina";
      } else if (cat.includes("Cuarta") || cat.includes("6ta")) {
        if (cat.includes("Femenina")) cat = "6ta Femenina";
        else cat = "6ta Masculina";
      } else if (cat.includes("Séptima") || cat.includes("7ma") || cat.includes("Octava")) {
        if (cat.includes("Femenina")) cat = "7ma Femenina";
        else cat = "7ma Masculina";
      } else {
        cat = "6ta Masculina";
      }
    }

    setNewPlayer({
      firstName: player.firstName,
      lastName: player.lastName,
      dni: player.dni,
      phone: player.phone,
      email: player.email,
      city: player.city,
      birthDate: player.birthDate,
      category: cat,
      rankingPoints: player.rankingPoints,
      photoUrl: player.photoUrl
    });
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayer.firstName || !newPlayer.lastName || !newPlayer.email || !newPlayer.dni) {
      alert("Por favor completa los campos requeridos (Nombre, Apellido, Email y CUIT).");
      return;
    }

    const categoryString = newPlayer.category;
    const id = editingPlayer ? editingPlayer.id : `p_${Date.now()}`;

    const playerToSave: Player = {
      id,
      firstName: newPlayer.firstName,
      lastName: newPlayer.lastName,
      dni: newPlayer.dni,
      phone: newPlayer.phone,
      email: newPlayer.email,
      city: newPlayer.city,
      birthDate: newPlayer.birthDate,
      category: categoryString,
      rankingPoints: Number(newPlayer.rankingPoints) || 0,
      photoUrl: newPlayer.photoUrl || AVATARS[0],
      // Carry forward stats
      matchesPlayed: editingPlayer?.matchesPlayed || 0,
      matchesWon: editingPlayer?.matchesWon || 0,
      matchesLost: editingPlayer?.matchesLost || 0,
      setsWon: editingPlayer?.setsWon || 0,
      setsLost: editingPlayer?.setsLost || 0,
      gamesWon: editingPlayer?.gamesWon || 0,
      gamesLost: editingPlayer?.gamesLost || 0
    };

    await repository.savePlayer(playerToSave);
    await repository.addNotification(
      editingPlayer ? "Jugador Modificado" : "Nuevo Jugador Registrado",
      `Se ha cargado con éxito a ${playerToSave.firstName} ${playerToSave.lastName} en la categoría ${playerToSave.category}.`,
      "success"
    );

    handleCloseForm();
    loadPlayers();
  };

  const handleImportFIPPlayers = async () => {
    setLoading(true);
    try {
      const males = getFIPTop100Males();
      const females = getFIPTop100Females();
      const allPlayers = [...males, ...females];

      for (const p of allPlayers) {
        await repository.savePlayer(p);
      }

      await repository.addNotification(
        "Importación FIP Exitosa",
        "Se han cargado 100 jugadores en cada una de las 7 categorías (700 jugadores en total: 500 masculinos y 200 femeninas) para simular torneos completos.",
        "success"
      );
      loadPlayers();
    } catch (error) {
      console.error("Error importing FIP players", error);
      alert("Error al cargar jugadores de la FIP.");
    } finally {
      setLoading(false);
    }
  };

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const handleDelete = async (id: string, name: string) => {
    setDeleteConfirm({ id, name });
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    const { id, name } = deleteConfirm;
    setDeleteConfirm(null);
    try {
      await repository.deletePlayer(id);
      await repository.addNotification(
        "Jugador Eliminado",
        `Se eliminó a ${name} del sistema.`,
        "warning"
      );
      loadPlayers();
    } catch (err) {
      console.error("Error deleting player:", err);
    }
  };

  // Filter players based on search & filters (including gender)
  const filteredPlayers = players.filter(p => {
    const pFullName = `${p.firstName} ${p.lastName}`.toLowerCase();
    const matchesSearch = pFullName.includes(search.toLowerCase()) || p.city.toLowerCase().includes(search.toLowerCase());
    
    // Category match - ensure exact match when selected
    const matchesCategory = divisionFilter === "all" ? true : p.category === divisionFilter;
    
    // Gender match
    let matchesGender = true;
    if (genderFilter !== "all") {
      const pGender = getPlayerGender(p);
      matchesGender = (pGender === genderFilter);
    }
    
    return matchesSearch && matchesCategory && matchesGender;
  });

  return (
    <div className="w-full flex flex-col">
      
      {/* Full-width header banner */}
      <div className="w-full bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-[size:16px_16px] opacity-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-[0.03] pointer-events-none">
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid-players" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-players)" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 w-full">
          {/* Title Section with Sticker and Back button */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 w-full md:w-auto">
            {onBack && (
              <button
                onClick={onBack}
                className="group flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#d4fc34] hover:text-slate-950 hover:bg-[#d4fc34] transition-all cursor-pointer bg-slate-900/60 border border-slate-800 hover:border-slate-700 px-4 py-2.5 rounded-xl self-start sm:self-auto"
              >
                <span className="transition-transform group-hover:-translate-x-1">←</span>
                <span>Volver</span>
              </button>
            )}

            <div className="flex items-center gap-5">
              {/* Dynamic player profile sticker */}
              <div className="w-20 h-20 shrink-0 bg-[#d4fc34]/10 rounded-2xl border border-[#d4fc34]/30 flex items-center justify-center p-2 shadow-inner relative group select-none overflow-hidden">
                <div className="absolute inset-0 bg-[#d4fc34]/5 rounded-2xl animate-pulse"></div>
                <svg className="w-14 h-14 relative z-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Card Shield Frame */}
                  <path d="M22,24 C34,20 66,20 78,24 C78,54 68,76 50,83 C32,76 22,54 22,24 Z" fill="#0f172a" stroke="#d4fc34" strokeWidth="2.5" />
                  {/* Photo Profile Silhouette */}
                  <circle cx="50" cy="38" r="9" fill="#1e293b" stroke="#d4fc34" strokeWidth="2" />
                  <path d="M34 62 C34 51 66 51 66 62" stroke="#d4fc34" strokeWidth="2" strokeLinecap="round" />
                  {/* Shiny crown above helmet profile */}
                  <polygon points="50,23 54,27 46,27" fill="#facc15" />
                </svg>
                <span className="absolute -top-1.5 -right-1.5 bg-[#d4fc34] text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-full shadow border border-slate-950 uppercase tracking-widest leading-none font-sans">PLAYER</span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest font-mono">
                    Athlete Database
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-wider text-white">
                  Registro de Jugadores
                </h1>
                <p className="text-xs text-slate-400">
                  Ficha oficial unificada de competidores registrados y acumuladores de ranking anual.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main page content wrapped in centered padding */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* GENDER / RAMA TABS WITH ALIGNED REGISTRATION BUTTON */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-800 pb-px gap-3">
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => {
              setGenderFilter("Masculino");
              setDivisionFilter("all");
            }}
            className={`px-5 py-3 text-xs font-black uppercase tracking-wider transition-all relative cursor-pointer ${
              genderFilter === "Masculino"
                ? "text-blue-400 border-b-2 border-blue-500 font-extrabold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Masculino
          </button>
          <button
            onClick={() => {
              setGenderFilter("Femenino");
              setDivisionFilter("all");
            }}
            className={`px-5 py-3 text-xs font-black uppercase tracking-wider transition-all relative cursor-pointer ${
              genderFilter === "Femenino"
                ? "text-pink-400 border-b-2 border-pink-500 font-extrabold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Femenino
          </button>
          <button
            onClick={() => {
              setGenderFilter("all");
              setDivisionFilter("all");
            }}
            className={`px-5 py-3 text-xs font-black uppercase tracking-wider transition-all relative cursor-pointer ${
              genderFilter === "all"
                ? "text-[#d4fc34] border-b-2 border-[#d4fc34] font-extrabold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Ver Todos
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 pb-2 lg:pb-0">
          {userRole === "admin" && (
            <button
              onClick={handleImportFIPPlayers}
              className="bg-indigo-950/40 hover:bg-indigo-950/80 text-indigo-300 hover:text-white border border-indigo-900/40 text-[10px] font-black px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer uppercase tracking-wider text-center"
              title="Cargar automáticamente 100 jugadores premium por categoría (700 jugadores en total: 50% de origen FIP real)"
            >
              <span>🎾 Cargar Ránking FIP</span>
            </button>
          )}
          <button
            onClick={handleOpenCreateForm}
            className="bg-[#d4fc34]/15 hover:bg-[#d4fc34] hover:text-slate-950 text-[#d4fc34] text-xs font-extrabold px-4 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer border border-[#d4fc34]/20 uppercase tracking-widest"
          >
            <Plus className="w-4 h-4 text-[#d4fc34] group-hover:text-slate-950" /> 
            <span>{userRole === "admin" ? "Registrar Jugador" : "Inscribirse como Jugador"}</span>
          </button>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center">
        <div className="w-full md:flex-1 relative">
          <input
            type="text"
            placeholder="Buscar por nombre, apellido o ciudad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <select
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-2.5 py-2 text-xs text-slate-300 outline-none w-full md:w-auto"
          >
            <option value="all">Todas las Categorías</option>
            {PADEL_CATEGORIES.filter(cat => {
              if (genderFilter === "Masculino") return !cat.toLowerCase().includes("femenina") && !cat.toLowerCase().includes("femenino");
              if (genderFilter === "Femenino") return cat.toLowerCase().includes("femenina") || cat.toLowerCase().includes("femenino");
              return true;
            }).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* PLAYERS Bento LISTING SECTION */}
      {loading ? (
        <div className="text-center py-10 font-mono text-xs text-slate-500 animate-pulse">
          Sincronizando jugadores...
        </div>
      ) : filteredPlayers.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-500 text-xs font-medium">
          Ningún jugador coincide con los filtros especificados.
        </div>
      ) : (
        <div className="space-y-10">
          {(() => {
            // Determine active categories to display
            const categoriesToRender = PADEL_CATEGORIES.filter(cat => {
              const matchesDiv = divisionFilter === "all" || cat === divisionFilter;
              
              let matchesGend = true;
              if (genderFilter === "Masculino") {
                matchesGend = !cat.toLowerCase().includes("femenina") && !cat.toLowerCase().includes("femenino");
              } else if (genderFilter === "Femenino") {
                matchesGend = cat.toLowerCase().includes("femenina") || cat.toLowerCase().includes("femenino");
              }
              
              return matchesDiv && matchesGend;
            });

            const otherPlayers = filteredPlayers.filter(p => !PADEL_CATEGORIES.includes(p.category));

            return (
              <>
                {categoriesToRender.map(catName => {
                  const catPlayers = filteredPlayers.filter(p => p.category === catName);
                  if (catPlayers.length === 0) return null;

                  return (
                    <div key={catName} className="space-y-4" id={`p-sect-${catName.replace(/\s+/g, '-').toLowerCase()}`}>
                      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
                        <span className="w-1.5 h-3.5 bg-blue-500 rounded-full"></span>
                        <h3 className="text-xs font-bold text-slate-200 tracking-wide uppercase font-mono">
                          {catName}
                        </h3>
                        <span className="bg-slate-950 text-slate-500 text-[10px] px-2 py-0.5 rounded-md font-mono border border-slate-800">
                          {catPlayers.length}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {catPlayers.map(p => {
                          const winRate = p.matchesPlayed > 0 ? (p.matchesWon / p.matchesPlayed) * 100 : 0;
                          const isMe = p.email && loggedEmail && p.email.toLowerCase() === loggedEmail.toLowerCase();
                          return (
                            <div 
                              key={p.id}
                              className={`bg-slate-900 border transition rounded-xl overflow-hidden flex flex-col justify-between relative ${
                                isMe ? 'border-cyan-500/70 shadow-lg shadow-cyan-500/5' : 'border-slate-800 hover:border-slate-700'
                              }`}
                              id={`player-card-${p.id}`}
                            >
                              {/* Header card info */}
                              <div className="p-4 relative">
                                
                                {/* Edit/Delete overlays for Admin / Self Edit */}
                                {(userRole === "admin" || isMe) && (
                                  <div className="absolute top-3 right-3 flex gap-1">
                                    <button
                                      onClick={() => handleOpenEditForm(p)}
                                      className="p-1.5 bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-white rounded-md transition"
                                      title="Editar Perfil"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    {userRole === "admin" && (
                                      <button
                                        onClick={() => handleDelete(p.id, `${p.firstName} ${p.lastName}`)}
                                        className="p-1.5 bg-slate-950/80 hover:bg-red-900/40 text-slate-400 hover:text-red-400 rounded-md transition"
                                        title="Eliminar Jugador"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                )}

                                {/* Player Image and Badge Category */}
                                <div className="flex items-center gap-3">
                                  <img
                                    src={p.photoUrl}
                                    alt={`${p.firstName} ${p.lastName}`}
                                    className="w-12 h-12 rounded-full object-cover border border-slate-700 shadow-md"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div>
                                    <div className="flex items-center gap-1 mb-1 flex-wrap">
                                      <span className="bg-slate-950 text-blue-400 border border-slate-800 px-2 py-0.5 rounded text-[9px] font-mono font-bold block w-fit">
                                        {p.category}
                                      </span>
                                      {isMe && (
                                        <span className="bg-cyan-500 text-slate-950 px-1.5 py-0.5 rounded text-[9px] font-sans font-extrabold uppercase animate-pulse">
                                          ★ tú
                                        </span>
                                      )}
                                    </div>
                                    <h4 className="font-extrabold text-sm text-white">
                                      {p.lastName}, {p.firstName}
                                    </h4>
                                  </div>
                                </div>

                                {/* Body particulars */}
                                <div className="mt-4 pt-3 border-t border-slate-800/60 space-y-2 text-xs text-slate-400">
                                  {(userRole === "admin" || isMe) ? (
                                    <>
                                      <div className="flex items-center gap-2">
                                        <CreditCard className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                                        <span className="font-mono text-[11px] text-slate-300">DNI: {p.dni}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Mail className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                                        <span className="truncate">{p.email}</span>
                                      </div>
                                      {p.phone && (
                                        <div className="flex items-center gap-2">
                                          <Phone className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                                          <span>{p.phone}</span>
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <div className="text-[10px] text-slate-500 italic pb-1">
                                      Contacto oculto por privacidad
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                                    <span>{p.city}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Lifetime Advanced Stats footer */}
                              <div className="bg-slate-950 p-3 border-t border-slate-800">
                                <div className="grid grid-cols-3 text-center gap-1">
                                  <div>
                                    <span className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider">PUNTOS</span>
                                    <span className="font-black text-white text-xs">{p.rankingPoints}</span>
                                  </div>
                                  <div>
                                    <span className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider">PJ</span>
                                    <span className="font-bold text-slate-300 text-xs font-mono">{p.matchesPlayed}</span>
                                  </div>
                                  <div>
                                    <span className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider">V / D</span>
                                    <span className="font-mono text-green-400 text-xs font-semibold">
                                      {p.matchesWon} - {p.matchesLost}
                                    </span>
                                  </div>
                                </div>

                                {/* Progress winrate bar */}
                                <div className="mt-2 text-[10px] flex items-center justify-between text-slate-400 font-mono">
                                  <span>Efectividad:</span>
                                  <span className="font-bold text-blue-400">{winRate.toFixed(0)}%</span>
                                </div>
                                <div className="w-full bg-slate-900 h-1.5 rounded-full mt-1 overflow-hidden">
                                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${winRate}%` }}></div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Other fallback categories if present */}
                {otherPlayers.length > 0 && (
                  <div className="space-y-4" id="p-sect-other">
                    <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
                      <span className="w-1.5 h-3.5 bg-slate-600 rounded-full"></span>
                      <h3 className="text-xs font-bold text-slate-400 tracking-wide uppercase font-mono">
                        Otras Categorías
                      </h3>
                      <span className="bg-slate-950 text-slate-500 text-[10px] px-2 py-0.5 rounded-md font-mono border border-slate-800">
                        {otherPlayers.length}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {otherPlayers.map(p => {
                        const winRate = p.matchesPlayed > 0 ? (p.matchesWon / p.matchesPlayed) * 100 : 0;
                        const isMe = p.email && loggedEmail && p.email.toLowerCase() === loggedEmail.toLowerCase();
                        return (
                          <div 
                            key={p.id}
                            className={`bg-slate-900 border transition rounded-xl overflow-hidden flex flex-col justify-between relative ${
                              isMe ? 'border-cyan-500/70 shadow-lg shadow-cyan-500/5' : 'border-slate-800 hover:border-slate-700'
                            }`}
                            id={`player-card-${p.id}`}
                          >
                            <div className="p-4 relative">
                              {(userRole === "admin" || isMe) && (
                                <div className="absolute top-3 right-3 flex gap-1">
                                  <button
                                    onClick={() => handleOpenEditForm(p)}
                                    className="p-1.5 bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-white rounded-md transition"
                                    title="Editar Perfil"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  {userRole === "admin" && (
                                    <button
                                      onClick={() => handleDelete(p.id, `${p.firstName} ${p.lastName}`)}
                                      className="p-1.5 bg-slate-950/80 hover:bg-red-900/40 text-slate-400 hover:text-red-400 rounded-md transition"
                                      title="Eliminar Jugador"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              )}

                              <div className="flex items-center gap-3">
                                <img
                                  src={p.photoUrl}
                                  alt={`${p.firstName} ${p.lastName}`}
                                  className="w-12 h-12 rounded-full object-cover border border-slate-700 shadow-md"
                                  referrerPolicy="no-referrer"
                                />
                                <div>
                                  <div className="flex items-center gap-1 mb-1 flex-wrap">
                                    <span className="bg-slate-950 text-blue-400 border border-slate-800 px-2 py-0.5 rounded text-[9px] font-mono font-bold block w-fit">
                                      {p.category}
                                    </span>
                                    {isMe && (
                                      <span className="bg-cyan-500 text-slate-950 px-1.5 py-0.5 rounded text-[9px] font-sans font-extrabold uppercase animate-pulse">
                                        ★ tú
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="font-extrabold text-sm text-white">
                                    {p.lastName}, {p.firstName}
                                  </h4>
                                </div>
                              </div>

                              <div className="mt-4 pt-3 border-t border-slate-800/60 space-y-2 text-xs text-slate-400">
                                {(userRole === "admin" || isMe) ? (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <CreditCard className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                                      <span className="font-mono text-[11px] text-slate-300">DNI: {p.dni}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Mail className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                                      <span className="truncate">{p.email}</span>
                                    </div>
                                    {p.phone && (
                                      <div className="flex items-center gap-2">
                                        <Phone className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                                        <span>{p.phone}</span>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="text-[10px] text-slate-500 italic pb-1">
                                    Contacto oculto por privacidad
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                                  <span>{p.city}</span>
                                </div>
                              </div>
                            </div>

                            <div className="bg-slate-950 p-3 border-t border-slate-800">
                              <div className="grid grid-cols-3 text-center gap-1">
                                <div>
                                  <span className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider">PUNTOS</span>
                                  <span className="font-black text-white text-xs">{p.rankingPoints}</span>
                                </div>
                                <div>
                                  <span className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider">PJ</span>
                                  <span className="font-bold text-slate-300 text-xs font-mono">{p.matchesPlayed}</span>
                                </div>
                                <div>
                                  <span className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider">V / D</span>
                                  <span className="font-mono text-green-400 text-xs font-semibold">
                                    {p.matchesWon} - {p.matchesLost}
                                  </span>
                                </div>
                              </div>

                              <div className="mt-2 text-[10px] flex items-center justify-between text-slate-400 font-mono">
                                  <span>Efectividad:</span>
                                  <span className="font-bold text-blue-400">{winRate.toFixed(0)}%</span>
                              </div>
                              <div className="w-full bg-slate-900 h-1.5 rounded-full mt-1 overflow-hidden">
                                <div className="bg-blue-500 h-full rounded-full" style={{ width: `${winRate}%` }}></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-[#0f172a] border border-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-white text-base">
                ¿Eliminar Jugador?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                ¿Estás seguro de que deseas eliminar al jugador <span className="text-white font-semibold">{deleteConfirm.name}</span> del sistema? Esta acción no se puede deshacer.
              </p>
            </div>
            
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold px-4 py-2.5 rounded-lg border border-slate-800 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FORM MODAL POPUP FOR CREATE / UPDATE */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="font-extrabold text-sm text-white">
                {editingPlayer ? "✏️ Editar Ficha Jugador" : "➕ Registrar Nuevo Jugador"}
              </span>
              <button
                onClick={handleCloseForm}
                className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="overflow-y-auto p-5 space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={newPlayer.firstName}
                    onChange={(e) => setNewPlayer({...newPlayer, firstName: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-blue-500"
                    placeholder="Arturo"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400">Apellido *</label>
                  <input
                    type="text"
                    required
                    value={newPlayer.lastName}
                    onChange={(e) => setNewPlayer({...newPlayer, lastName: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-blue-500"
                    placeholder="Coello"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400">cuit *</label>
                  <input
                    type="text"
                    required
                    value={newPlayer.dni}
                    onChange={(e) => setNewPlayer({...newPlayer, dni: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-blue-500"
                    placeholder="20-38927452-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400">ciudad</label>
                  <input
                    type="text"
                    value={newPlayer.city}
                    onChange={(e) => setNewPlayer({...newPlayer, city: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-blue-500"
                    placeholder="Valladolid"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400">Email *</label>
                  <input
                    type="email"
                    required
                    value={newPlayer.email}
                    onChange={(e) => setNewPlayer({...newPlayer, email: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-blue-500"
                    placeholder="arturo.coello@gmail.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400">Teléfono</label>
                  <input
                    type="text"
                    value={newPlayer.phone}
                    onChange={(e) => setNewPlayer({...newPlayer, phone: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-blue-500"
                    placeholder="+34 654 321 001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    value={newPlayer.birthDate}
                    onChange={(e) => setNewPlayer({...newPlayer, birthDate: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400">Puntaje Ranking Inicial</label>
                  <input
                    type="number"
                    value={newPlayer.rankingPoints}
                    onChange={(e) => setNewPlayer({...newPlayer, rankingPoints: Number(e.target.value)})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Category selector */}
              <div className="space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-805">
                <label className="block text-[9px] uppercase tracking-widest text-[#6c7d93] font-bold">Categoría de Competencia *</label>
                <select
                  value={newPlayer.category}
                  onChange={(e) => setNewPlayer({...newPlayer, category: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none focus:border-blue-500"
                >
                  {PADEL_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 leading-snug mt-1">
                  Adjudica al jugador de forma exclusiva a una de las categorías federativas oficiales del circuito.
                </p>
              </div>

              <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-805">
                <div className="flex items-center gap-4">
                  {/* Avatar Circular Preview */}
                  <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[#d4fc34] flex-shrink-0 bg-slate-900 flex items-center justify-center">
                    {newPlayer.photoUrl ? (
                      <img 
                        src={newPlayer.photoUrl} 
                        alt="Avatar Preview" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-slate-500">Sin Foto</span>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-1.5">
                    <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold font-mono">Avatar / Foto de Perfil</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={isCameraActive ? stopCamera : startCamera}
                        className={`text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${isCameraActive ? 'bg-red-900/40 text-red-300 border border-red-800' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'}`}
                      >
                        {isCameraActive ? (
                          <>
                            <VideoOff className="w-3.5 h-3.5" />
                            <span>Apagar Cámara</span>
                          </>
                        ) : (
                          <>
                            <Camera className="w-3.5 h-3.5 text-[#d4fc34]" />
                            <span>Sacarse Foto</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewPlayer({...newPlayer, photoUrl: AVATARS[Math.floor(Math.random() * AVATARS.length)]})}
                        className="bg-slate-800 hover:bg-slate-700 p-2 rounded-lg text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                        title="Aleatorio"
                      >
                        <Image className="w-3.5 h-3.5 text-blue-400" />
                        <span>Predefinida</span>
                      </button>
                    </div>
                  </div>
                </div>

                {cameraError && (
                  <div className="text-[11px] text-red-400 bg-red-950/20 border border-red-900/30 p-2 rounded-lg leading-tight">
                    {cameraError}
                  </div>
                )}

                {/* Live Camera Feed */}
                {isCameraActive && (
                  <div className="space-y-2 border-t border-slate-900 pt-3 flex flex-col items-center">
                    <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-slate-800 bg-slate-900">
                      <video 
                        ref={videoRef} 
                        playsInline
                        muted
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="bg-[#d4fc34] hover:bg-[#c5f015] text-slate-950 text-xs font-black px-4 py-2 rounded-lg flex items-center gap-1.5 uppercase tracking-wide cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-slate-950" />
                      Capturar Foto
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-4 py-2 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#d4fc34] hover:bg-[#c5f015] text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer uppercase tracking-wider"
                >
                  <Save className="w-3.5 h-3.5 text-slate-950" /> Guardar Cambios
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
