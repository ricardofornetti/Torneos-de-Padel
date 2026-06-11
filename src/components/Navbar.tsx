import React, { useState, useEffect } from 'react';
import { Trophy, Bell, Shield, User, LogIn, LogOut, CheckCircle, Crown, Camera, X, Sparkles } from 'lucide-react';
import { repository } from '../lib/repository';
import { AppNotification } from '../types';
import { auth, isRealFirebase } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';

interface NavbarProps {
  userRole: "admin" | "player";
  onChangeRole: (role: "admin" | "player") => void;
  onNavigate: (view: "dashboard" | "tournaments" | "players" | "rankings" | "courts" | "gallery") => void;
  activeView: string;
  notifications?: AppNotification[];
  onClearNotifications?: () => void;
  onMarkAllRead?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  userRole, 
  onChangeRole, 
  onNavigate,
  activeView,
  notifications = [],
  onClearNotifications,
  onMarkAllRead
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  
  // Registration and Hybrid Mock state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regError, setRegError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [regForm, setRegForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    dni: "",
    phone: "",
    city: "",
    category: "6ta Masculina",
  });

  useEffect(() => {
    // 1. Check for mock local session first of all, so it takes priority
    const localUserJson = localStorage.getItem("padel_mgr_mock_user");
    if (localUserJson) {
      try {
        const localUser = JSON.parse(localUserJson);
        setCurrentUser(localUser);
        if (localUser.email === 'fornettiricardo@gmail.com') {
          onChangeRole("admin");
        } else {
          onChangeRole("player");
        }
      } catch (e) {
        console.error("Error reading localUserJson:", e);
      }
    }

    if (isRealFirebase && auth) {
      const unsubscribe = auth.onAuthStateChanged((user: FirebaseUser | null) => {
        const hasLocal = !!localStorage.getItem("padel_mgr_mock_user");
        if (!hasLocal) {
          setCurrentUser(user);
          if (user) {
            if (user.email === 'fornettiricardo@gmail.com') {
              onChangeRole("admin");
            } else {
              onChangeRole("player");
            }
          }
        }
      });
      return () => unsubscribe();
    }
  }, [onChangeRole]);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setRegError("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      if (user) {
        // Automatically create player profile on Google Sign-In if not exists
        const existingPlayers = await repository.getPlayers();
        const exists = existingPlayers.some(p => p.email && p.email.toLowerCase() === user.email?.toLowerCase());
        
        if (!exists && user.email) {
          const parts = (user.displayName || "Jugador Gmail").split(" ");
          const fName = parts[0] || "Gmail";
          const lName = parts.slice(1).join(" ") || "Usuario";
          
          await repository.savePlayer({
            id: `p_google_${user.uid}`,
            firstName: fName,
            lastName: lName,
            dni: `G-${user.uid.slice(0, 6)}`,
            email: user.email.toLowerCase(),
            phone: "",
            city: "General",
            category: "6ta Masculina",
            birthDate: "1995-5-5",
            rankingPoints: 100,
            matchesPlayed: 0,
            matchesWon: 0,
            matchesLost: 0,
            setsWon: 0,
            setsLost: 0,
            gamesWon: 0,
            gamesLost: 0,
            photoUrl: user.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.email}`
          });
        }

        const mockUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || "Usuario Gmail",
          photoURL: user.photoURL
        };
        localStorage.setItem("padel_mgr_mock_user", JSON.stringify(mockUser));
        setCurrentUser(mockUser as any);
        
        if (user.email === 'fornettiricardo@gmail.com') {
          onChangeRole("admin");
        } else {
          onChangeRole("player");
        }
        
        setShowRegisterModal(false);
      }
    } catch (error: any) {
      console.error("Google sign-in error in UI:", error);
      setRegError(
        `Error de autenticación Google (${error.code || error.message || 'Error general'}). \n\n¡No te preocupes! El método manual 'Registro Rápido con Gmail' de abajo está habilitado en este sandbox y es 100% funcional. Completa los campos y registrarte hoy mismo.`
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLocalRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    
    if (!regForm.email || !regForm.firstName || !regForm.lastName || !regForm.dni) {
      setRegError("Por favor completa los campos obligatorios (*).");
      return;
    }
    
    const emailSanitized = regForm.email.toLowerCase().trim();
    if (!emailSanitized.includes("gmail.com")) {
      setRegError("Por favor ingresa un correo electrónico de Gmail válido (por ej: nombre@gmail.com).");
      return;
    }
    
    try {
      const newPlayerId = `p_gmail_${Date.now()}`;
      const playerProfile = {
        id: newPlayerId,
        firstName: regForm.firstName.trim(),
        lastName: regForm.lastName.trim(),
        dni: regForm.dni.trim(),
        phone: regForm.phone.trim(),
        email: emailSanitized,
        city: regForm.city.trim() || "Sin Especificar",
        category: regForm.category,
        birthDate: "1995-01-01",
        rankingPoints: 100,
        matchesPlayed: 0,
        matchesWon: 0,
        matchesLost: 0,
        setsWon: 0,
        setsLost: 0,
        gamesWon: 0,
        gamesLost: 0,
        photoUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${emailSanitized}`
      };
      
      await repository.savePlayer(playerProfile);
      
      const mockUser = {
        uid: newPlayerId,
        email: emailSanitized,
        displayName: `${playerProfile.firstName} ${playerProfile.lastName}`,
        photoURL: playerProfile.photoUrl
      };
      
      localStorage.setItem("padel_mgr_mock_user", JSON.stringify(mockUser));
      setCurrentUser(mockUser as any);
      
      if (emailSanitized === "fornettiricardo@gmail.com") {
        onChangeRole("admin");
      } else {
        onChangeRole("player");
      }
      
      await repository.addNotification(
        "Registro Exitoso",
        `Te has registrado con el correo ${emailSanitized} y tu ficha de jugador ya está activa en el ranking.`,
        "success"
      );
      
      window.dispatchEvent(new Event("storage"));
      setShowRegisterModal(false);
    } catch (err: any) {
      setRegError(`Error al guardar en base de datos: ${err.message || err.toString()}`);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem("padel_mgr_mock_user");
    setCurrentUser(null);
    onChangeRole("player");
    window.dispatchEvent(new Event("storage"));
    if (isRealFirebase && auth) {
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Logout error in UI:", error);
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    if (onMarkAllRead) {
      onMarkAllRead();
    } else {
      notifications.forEach(n => n.read = true);
      localStorage.setItem("padel_mgr_notifications", JSON.stringify(notifications));
    }
  };

  const clearAllNotifications = () => {
    if (onClearNotifications) {
      onClearNotifications();
    }
  };

  return (
    <nav className="bg-slate-950 border-b border-slate-900 sticky top-0 z-50 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Logo and Brand */}
        <div className="flex items-center justify-between">
          <div 
            onClick={() => onNavigate("dashboard")} 
            className="flex items-center gap-2.5 cursor-pointer group"
            id="brand-logo"
          >
            <div className="bg-gradient-to-br from-cyan-400 via-cyan-500 to-indigo-600 p-2 rounded-xl text-slate-950 shadow-md group-hover:scale-105 transition-transform">
              <Trophy className="w-5.5 h-5.5 text-slate-950" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white block font-display italic">
                PADEL <span className="text-cyan-400 font-display">PRO</span>
              </span>
              <span className="text-[9px] text-[#22d3ee] font-mono tracking-widest block -mt-1 uppercase font-semibold">
                Tournament Manager
              </span>
            </div>
          </div>

          {/* Quick role toggle and Gmail login on mobile */}
          <div className="flex items-center gap-1.5 md:hidden">
            {isRealFirebase && currentUser && (
              <button
                onClick={handleLogout}
                className="p-1 bg-slate-900 border border-slate-800 rounded-lg shrink-0 flex items-center gap-1 transition"
                title="Cerrar sesión"
              >
                <img 
                  src={currentUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.email}`} 
                  alt="Me" 
                  className="w-4.5 h-4.5 rounded-full border border-cyan-400 object-cover" 
                  referrerPolicy="no-referrer" 
                />
                <LogOut className="w-3 h-3 text-slate-400" />
              </button>
            )}

            <button
              onClick={() => onChangeRole(userRole === "admin" ? "player" : "admin")}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                userRole === "admin" 
                  ? "bg-cyan-650/20 text-cyan-400 border border-cyan-500/30" 
                  : "bg-slate-800 text-slate-300 border border-slate-700"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{userRole === "admin" ? "ADMIN" : "JUGADOR"}</span>
            </button>
          </div>
        </div>

        {/* View Selection Menu */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none font-medium text-center">
          <button
            onClick={() => onNavigate("dashboard")}
            className={`px-3.5 py-1.5 rounded-lg text-xs tracking-wide transition-all uppercase whitespace-nowrap ${
              activeView === "dashboard"
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-md shadow-cyan-500/5 font-bold"
                : "text-slate-400 hover:text-white hover:bg-slate-900/50"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onNavigate("tournaments")}
            className={`px-3.5 py-1.5 rounded-lg text-xs tracking-wide transition-all uppercase whitespace-nowrap ${
              activeView === "tournaments"
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-md shadow-cyan-500/5 font-bold"
                : "text-slate-400 hover:text-white hover:bg-slate-900/50"
            }`}
          >
            Torneos
          </button>
          <button
            onClick={() => onNavigate("players")}
            className={`px-3.5 py-1.5 rounded-lg text-xs tracking-wide transition-all uppercase whitespace-nowrap ${
              activeView === "players"
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-md shadow-cyan-500/5 font-bold"
                : "text-slate-400 hover:text-white hover:bg-slate-900/50"
            }`}
          >
            Jugadores
          </button>
          <button
            onClick={() => onNavigate("rankings")}
            className={`px-3.5 py-1.5 rounded-lg text-xs tracking-wide transition-all uppercase whitespace-nowrap ${
              activeView === "rankings"
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-md shadow-cyan-500/5 font-bold"
                : "text-slate-400 hover:text-white hover:bg-slate-900/50"
            }`}
          >
            Ranking
          </button>
          <button
            onClick={() => onNavigate("courts")}
            className={`px-3.5 py-1.5 rounded-lg text-xs tracking-wide transition-all uppercase whitespace-nowrap ${
              activeView === "courts"
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-md shadow-cyan-500/5 font-bold"
                : "text-slate-400 hover:text-white hover:bg-slate-900/50"
            }`}
          >
            Complejo / Canchas
          </button>
          <button
            onClick={() => onNavigate("gallery")}
            className={`px-3.5 py-1.5 rounded-lg text-xs tracking-wide transition-all uppercase whitespace-nowrap ${
              activeView === "gallery"
                ? "bg-[#d4fc34]/10 text-[#d4fc34] border border-[#d4fc34]/30 shadow-md shadow-[#d4fc34]/5 font-bold"
                : "text-slate-400 hover:text-white hover:bg-slate-900/50"
            }`}
          >
            Galería
          </button>

        </div>

        {/* Roles and System Settings Desktop */}
        <div className="hidden md:flex items-center gap-4">
          
          {/* Google / Gmail Auth Box */}
          {isRealFirebase && currentUser && (
            <div className="flex items-center gap-2">
              <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2">
                <img 
                  src={currentUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.email}`} 
                  alt="Perfil" 
                  className="w-6 h-6 rounded-full object-cover border border-[#22d3ee]/60 shrink-0" 
                  referrerPolicy="no-referrer"
                />
                <div className="flex flex-col text-left max-w-[110px]">
                  <span className="text-[10px] font-bold text-white leading-none truncate">
                    {currentUser.displayName || 'Usuario'}
                  </span>
                  <span className="text-[8px] text-slate-400 leading-none truncate mt-0.5 font-mono">
                    {currentUser.email}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1 hover:text-red-400 text-slate-400 transition ml-1 shrink-0"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Action-Based Role Picker */}
          <div className="flex bg-[#0f172a] border border-slate-800 p-0.5 rounded-lg">
            <button
              onClick={() => onChangeRole("player")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                userRole === "player"
                  ? "bg-slate-800 text-white shadow-sm font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Jugador
            </button>
            <button
              onClick={() => onChangeRole("admin")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                userRole === "admin"
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Organizador
            </button>
          </div>


        </div>
      </div>

      {/* REGISTRATION & GMAIL LOGIN DIALOG */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl relative my-8">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                  <Trophy className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-sm">Registrarse con Gmail</h3>
                  <span className="text-[9px] text-slate-400 block font-mono">Padel Pro Single Sign-On Hybrid</span>
                </div>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Error notification block */}
              {regError && (
                <div className="p-3 bg-red-950/45 border border-red-900/60 rounded-xl text-[11px] text-red-400 font-medium whitespace-pre-wrap leading-relaxed">
                  {regError}
                </div>
              )}

              {/* Option 1: Quick Real Google popup */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono block">MÉTODO AUTOMÁTICO RECOMENDADO:</span>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                  className="w-full py-2.5 bg-white hover:bg-gray-100 text-slate-950 font-black text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 uppercase tracking-wider"
                >
                  <img 
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                    alt="Google" 
                    className="w-4 h-4"
                  />
                  <span>{googleLoading ? 'Iniciando sesión...' : 'Ingresar con cuenta Google'}</span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-3 text-[9px] text-slate-500 font-mono uppercase tracking-widest leading-none">ó Registro Manual Directo</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              {/* Option 2: Quick Local Form Register */}
              <form onSubmit={handleLocalRegisterSubmit} className="space-y-3 text-left">
                <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl text-[10px] text-blue-300 leading-normal font-mono flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5 animate-pulse" />
                  <span>
                    Si Google Sign-In presenta un error debido a la API Key, puedes completar este registro de resguardo con cualquier cuenta <strong>@gmail.com</strong>.
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Email de Gmail *</label>
                    <input
                      type="email"
                      required
                      placeholder="ejemplo@gmail.com"
                      value={regForm.email}
                      onChange={e => setRegForm({...regForm, email: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase font-mono block">DNI / Documento *</label>
                    <input
                      type="text"
                      required
                      placeholder="DNI del competidor"
                      value={regForm.dni}
                      onChange={e => setRegForm({...regForm, dni: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Nombre *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nombre"
                      value={regForm.firstName}
                      onChange={e => setRegForm({...regForm, firstName: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Apellido *</label>
                    <input
                      type="text"
                      required
                      placeholder="Apellido"
                      value={regForm.lastName}
                      onChange={e => setRegForm({...regForm, lastName: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Teléfono / WhatsApp</label>
                    <input
                      type="tel"
                      placeholder="+54 9..."
                      value={regForm.phone}
                      onChange={e => setRegForm({...regForm, phone: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Ciudad / Residencia</label>
                    <input
                      type="text"
                      placeholder="Ciudad"
                      value={regForm.city}
                      onChange={e => setRegForm({...regForm, city: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Categoría de Ficha Padel *</label>
                  <select
                    required
                    value={regForm.category}
                    onChange={e => setRegForm({...regForm, category: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50 block"
                  >
                    <option value="Libre Masculina">Libre Masculina</option>
                    <option value="4ta Masculina">4ta Masculina</option>
                    <option value="5ta Masculina">5ta Masculina</option>
                    <option value="6ta Masculina">6ta Masculina</option>
                    <option value="7ma Masculina">7ma Masculina</option>
                    <option value="6ta Femenina flex">6ta Femenina</option>
                    <option value="7ma Femenina">7ma Femenina</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg uppercase tracking-wider mt-3"
                >
                  <Sparkles className="w-4 h-4 text-slate-950 shrink-0" />
                  <span>Registrarme e Ingresar</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
