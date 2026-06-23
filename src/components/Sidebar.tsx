import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Bell, 
  User, 
  LogIn, 
  LogOut, 
  X, 
  Sparkles,
  LayoutDashboard,
  Calendar,
  Users,
  BarChart3,
  MapPin,
  Image as ImageIcon,
  Menu,
  ChevronLeft,
  ChevronRight,
  Shield,
  Zap,
  Award,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { repository } from '../lib/repository';
import { AppNotification, Player, PlayerPrivateData } from '../types';
import { auth, isRealFirebase } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';
import { AppView } from '../lib/uiTypes';

interface SidebarProps {
  userRole: "admin" | "player";
  onNavigate: (view: AppView) => void;
  activeView: AppView;
  notifications?: AppNotification[];
  onClearNotifications?: () => void;
  onMarkAllRead?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  userRole, 
  onNavigate,
  activeView,
  notifications = [],
  onClearNotifications,
  onMarkAllRead
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  // Registration Modal State
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regError, setRegError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [regForm, setRegForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    dni: "",
    phone: "",
    city: "",
    category: "6ta Masculina",
  });

  const [isMockSession, setIsMockSession] = useState(false);

  useEffect(() => {
    // Check mock login session
    const localUserJson = localStorage.getItem("padel_mgr_mock_user");
    if (localUserJson) {
      try {
        const localUser = JSON.parse(localUserJson);
        setCurrentUser(localUser);
        setIsMockSession(!localUser.isGoogle);
      } catch (e) {
        console.error("Error reading localUserJson in Sidebar:", e);
      }
    }

    if (isRealFirebase && auth) {
      const unsubscribe = auth.onAuthStateChanged((user: FirebaseUser | null) => {
        const hasLocal = !!localStorage.getItem("padel_mgr_mock_user");
        if (!hasLocal) {
          setCurrentUser(user);
          setIsMockSession(false);
        } else {
          try {
            const localUser = JSON.parse(localStorage.getItem("padel_mgr_mock_user") || "{}");
            setIsMockSession(!localUser.isGoogle);
          } catch (e) {}
        }
      });
      return () => unsubscribe();
    }
  }, []);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setRegError("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      if (user) {
        // Create player profile if doesn't exist
        const existingPlayers = await repository.getPlayers();
        const exists = existingPlayers.some(p => p.id === `p_google_${user.uid}`);
        
        if (!exists && user.email) {
          const parts = (user.displayName || "Jugador Gmail").split(" ");
          const fName = (parts[0] || "Gmail").slice(0, 45);
          const lName = (parts.slice(1).join(" ") || "Usuario").slice(0, 45);
          
          const playerProfile: Player = {
            id: `p_google_${user.uid}`,
            firstName: fName,
            lastName: lName,
            city: "General",
            category: "6ta Masculina",
            rankingPoints: 100,
            matchesPlayed: 0,
            matchesWon: 0,
            matchesLost: 0,
            setsWon: 0,
            setsLost: 0,
            gamesWon: 0,
            gamesLost: 0,
            photoUrl: user.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.email}`
          };

          const privateProfile: PlayerPrivateData = {
            id: `p_google_${user.uid}`,
            dni: `G-${user.uid.slice(0, 6)}`,
            email: user.email.toLowerCase(),
            phone: "",
            birthDate: "1995-05-05"
          };

          await repository.savePlayer(playerProfile, privateProfile);
        }

        const mockUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || "Usuario Gmail",
          photoURL: user.photoURL,
          isGoogle: true
        };
        localStorage.setItem("padel_mgr_mock_user", JSON.stringify(mockUser));
        setCurrentUser(mockUser as any);
        setIsMockSession(false);
        
        setShowRegisterModal(false);
      }
    } catch (error) {
      console.error("Google sign-in error in Sidebar UI:", error);
      const firebaseError = error as { code?: string; message?: string };
      const errorCode = firebaseError.code;
      
      if (errorCode === "auth/popup-closed-by-user") {
        setRegError("");
        return;
      }
      
      if (errorCode === "auth/network-request-failed") {
        setRegError("Error de conexión. Verificá tu internet e intentá de nuevo.");
      } else if (errorCode === "auth/popup-blocked") {
        setRegError("El navegador bloqueó la ventana de login. Permitir popups para este sitio.");
      } else {
        const isUnauthorizedDomain = error.message && (
          error.message.includes("auth/unauthorized-domain") || 
          error.message.includes("unauthorized-domain") ||
          errorCode === "auth/unauthorized-domain"
        );
        
        if (isUnauthorizedDomain) {
          setRegError(
            `⚠️ Dominio No Autorizado en Firebase Auth.\n\nPara solucionarlo e ingresar con Google:\n1. Abre la consola de Firebase en:\nhttps://console.firebase.google.com/project/silken-concept-wsjh2/authentication/settings\n2. Ve a la pestaña "Ajustes" -> "Dominios autorizados" -> "Agregar dominio".\n3. Registra este dominio actual: ${window.location.host}\n\nMientras tanto, puedes registrarte usando el "Registro Manual Directo" de abajo.`
          );
        } else {
          let cleanMsg = error.message || "Error general de autenticación.";
          if (cleanMsg.includes("{")) {
            try {
              cleanMsg = cleanMsg.split("{")[0].trim();
            } catch (e) {}
          }
          setRegError(cleanMsg);
        }
      }
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
      setRegError("Por favor ingresa un correo electrónico de Gmail válido.");
      return;
    }
    
    try {
      const newPlayerId = `p_gmail_${Date.now()}`;
      
      const playerProfile: Player = {
        id: newPlayerId,
        firstName: regForm.firstName.trim(),
        lastName: regForm.lastName.trim(),
        city: regForm.city.trim() || "Sin Especificar",
        category: regForm.category,
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

      const privateProfile: PlayerPrivateData = {
        id: newPlayerId,
        dni: regForm.dni.trim(),
        email: emailSanitized,
        phone: regForm.phone.trim(),
        birthDate: "1995-01-01"
      };
      
      await repository.savePlayer(playerProfile, privateProfile);
      
      const mockUser = {
        uid: newPlayerId,
        email: emailSanitized,
        displayName: `${playerProfile.firstName} ${playerProfile.lastName}`,
        photoURL: playerProfile.photoUrl,
        isGoogle: false
      };
      
      localStorage.setItem("padel_mgr_mock_user", JSON.stringify(mockUser));
      setCurrentUser(mockUser as any);
      setIsMockSession(true);
      
      await repository.addNotification(
        "Registro Exitoso",
        `Te has registrado de manera exitosa y tu ficha está activa.`,
        "success"
      );
      
      window.dispatchEvent(new Event("storage"));
      setShowRegisterModal(false);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setRegError(`Error al guardar jugador: ${errorMsg}`);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem("padel_mgr_mock_user");
    setCurrentUser(null);
    setIsMockSession(false);
    window.dispatchEvent(new Event("storage"));
    if (isRealFirebase && auth) {
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Logout error in Sidebar UI:", error);
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const navItems: { id: AppView; label: string; icon: React.ComponentType<any> }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "tournaments", label: "Torneos", icon: Trophy },
    { id: "fixture", label: "Calendario", icon: Calendar },
    { id: "players", label: "Jugadores", icon: Users },
    { id: "rankings", label: "Rankings", icon: AwardTrophyIcon },
    { id: "stats", label: "Estadísticas", icon: BarChart3 },
    { id: "courts", label: "Canchas", icon: MapPin },
    { id: "gallery", label: "Fotos", icon: ImageIcon }
  ];

  function AwardTrophyIcon(props: React.ComponentProps<typeof Trophy>) {
    return <Trophy {...props} className={(props.className || "") + " text-[#d4fc34] shrink-0"} />;
  }

  const handleNavItemClick = (id: AppView) => {
    onNavigate(id);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* MOBILE TOP STATUS GREETING HEADER */}
      <header className="lg:hidden bg-slate-950/95 border-b border-slate-900/80 sticky top-0 z-40 px-4 py-3 flex items-center justify-between w-full backdrop-blur-md select-none">
        <div className="flex items-center gap-2">
          {/* Menu button for profile settings slide */}
          <button 
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className="p-2 -ml-2 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
            id="mobile-menu-trigger"
            aria-label="Menú de Navegación"
          >
            <Menu className="w-5 h-5 text-[#d4fc34]" />
          </button>
          
          <div onClick={() => onNavigate("dashboard")} className="flex items-center gap-1.5 cursor-pointer">
            <span className="font-display font-black text-xs tracking-wider text-[#d4fc34] uppercase">
              SRTC <span className="text-white">PADEL</span>
            </span>
          </div>
        </div>

        {/* Mobile Header Icons: Alerts & Accounts */}
        <div className="flex items-center gap-1">
          {/* Notifications Trigger */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 hover:bg-slate-900 text-slate-400 hover:text-white rounded-xl transition relative cursor-pointer"
              aria-label="Ver notificaciones"
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#d4fc34] rounded-full animate-pulse"></span>
              )}
            </button>
          </div>

          {/* User profile bubble modal trigger */}
          {currentUser ? (
            <img 
              src={currentUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.email}`} 
              alt="Me" 
              className="w-7 h-7 rounded-lg border border-[#d4fc34] object-cover shrink-0 ml-1 cursor-pointer" 
              referrerPolicy="no-referrer" 
              onClick={() => setIsMobileOpen(true)}
            />
          ) : (
            <button 
              onClick={() => setShowRegisterModal(true)}
              className="p-1 px-2.5 bg-[#d4fc34]/15 text-[#d4fc34] border border-[#d4fc34]/20 rounded-lg text-[10px] font-mono font-bold tracking-wider uppercase ml-1 cursor-pointer"
            >
              INICIAR SESION
            </button>
          )}
        </div>
      </header>

      {/* MOBILE SPORTY BOTTOM NAVIGATION BAR */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-45 bg-[#0b0f19]/95 border-t border-slate-900/90 py-1.5 px-2 flex justify-around items-center backdrop-blur-lg select-none pb-safe">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavItemClick(item.id)}
              className="flex flex-col items-center justify-center p-2 rounded-xl transition-all relative flex-1 min-w-[50px] min-h-[44px] cursor-pointer"
            >
              {isActive && (
                <motion.div 
                  layoutId="mobileActiveIndicator"
                  className="absolute inset-0 bg-[#d4fc34]/10 rounded-xl -z-10"
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                />
              )}
              <Icon className={`w-[18px] h-[18px] ${isActive ? "text-[#d4fc34] scale-105" : "text-slate-400"}`} />
              <span className={`text-[9px] font-display font-medium tracking-wide mt-1 ${isActive ? "text-[#d4fc34] font-bold" : "text-slate-500"}`}>
                {item.id === "fixture" ? "Calendario" : item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* DESKTOP SIDEBAR PANEL */}
      <aside 
        className={`hidden lg:flex flex-col bg-[#0b0f19] border-r border-slate-900/80 sticky top-0 h-screen transition-all duration-300 z-40 shrink-0 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
        id="desktop-sidebar"
      >
        {/* Sidebar Header Brand */}
        <div className="p-5 border-b border-slate-900/50 flex items-center justify-between">
          <div 
            onClick={() => onNavigate("dashboard")} 
            className="flex items-center gap-3 cursor-pointer overflow-hidden select-none"
          >
            <div className="bg-gradient-to-br from-[#d4fc34] to-lime-500 p-2 rounded-xl text-slate-950 shadow-md">
              <Trophy className="w-5 h-5 text-slate-950" />
            </div>
            {!isCollapsed && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-display font-bold leading-none"
              >
                <span className="font-black text-sm tracking-widest text-[#d4fc34] block uppercase">
                  SRTC <span className="text-white">PADEL</span>
                </span>
                <span className="text-[8px] font-mono text-slate-500 tracking-widest block uppercase mt-1">
                  OFFICIAL LEAGUE
                </span>
              </motion.div>
            )}
          </div>

          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 hover:bg-slate-900 rounded-lg text-slate-500 hover:text-white transition cursor-pointer"
            aria-label={isCollapsed ? "Expandir panel lateral" : "Contraer panel lateral"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavItemClick(item.id)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-xs font-bold transition-all group cursor-pointer relative ${
                  isActive
                    ? "text-[#d4fc34]"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/60"
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeTabPill"
                    className="absolute inset-0 bg-[#d4fc34]/10 rounded-xl border-l-[3px] border-[#d4fc34] -z-10"
                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  />
                )}
                <Icon className={`w-4.5 h-4.5 shrink-0 transition-transform ${isActive ? 'scale-105 text-[#d4fc34]' : 'group-hover:scale-105'}`} />
                {!isCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Account & Profile */}
        <div className="p-3 border-t border-slate-900/50 bg-[#090d15]/50">
          {currentUser ? (
            <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : "px-2 py-1.5 bg-slate-900/30 rounded-xl border border-slate-900"}`}>
              <img 
                src={currentUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.email}`} 
                alt="Perfil" 
                className="w-7.5 h-7.5 rounded-lg object-cover border border-[#d4fc34]/50 shrink-0" 
                referrerPolicy="no-referrer"
              />
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <span className="block text-[10px] font-black text-white leading-none truncate font-display">
                    {currentUser.displayName || 'Usuario'}
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 min-w-0">
                    <span className="block text-[8px] text-slate-500 font-mono leading-none truncate">
                      {currentUser.email}
                    </span>
                    {isMockSession && (
                      <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 px-1 py-0.5 rounded text-[7px] font-black uppercase tracking-wide shrink-0">
                        Sandbox
                      </span>
                    )}
                  </div>
                </div>
              )}
              {!isCollapsed && (
                <button
                  onClick={handleLogout}
                  className="p-1 hover:text-red-400 text-slate-500 transition shrink-0 cursor-pointer"
                  title="Cerrar Sesión"
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowRegisterModal(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-3 bg-slate-900/60 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition border border-slate-800 cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-[#d4fc34] shrink-0" />
              {!isCollapsed && <span className="font-display font-medium">Ingresar Gmail</span>}
            </button>
          )}
        </div>
      </aside>

      {/* MOBILE BAR SLIDEOUT DRAWER (DRAWER SIDE-MODAL) */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop mask */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm pointer-events-auto"
            />
            
            {/* Drawer Panel */}
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="w-72 bg-[#090d16] border-r border-slate-900/90 h-full relative z-10 flex flex-col p-5 shadow-2.5xl"
            >
              <div className="flex items-center justify-between pb-5 border-b border-slate-900">
                <div className="flex items-center gap-2">
                  <div className="bg-gradient-to-br from-[#d4fc34] to-lime-600 p-1.5 rounded-lg text-slate-950">
                    <Trophy className="w-4 h-4 text-slate-950" />
                  </div>
                  <span className="font-display font-black text-xs tracking-wider text-[#d4fc34] uppercase">
                    SRTC <span className="text-white">PADEL</span>
                  </span>
                </div>
                <button 
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1.5 hover:bg-slate-900 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                  aria-label="Cerrar panel"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Drawer Extra Actions / Profile Settings */}
              <div className="flex-1 py-6 space-y-4 overflow-y-auto">
                <span className="text-[9px] font-mono font-bold tracking-widest text-slate-500 uppercase block">Menú del Competidor</span>
                <div className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavItemClick(item.id)}
                        className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? "bg-[#d4fc34]/10 text-[#d4fc34] border-l-2 border-[#d4fc34]"
                            : "text-slate-400 hover:text-white hover:bg-slate-900/40"
                        }`}
                      >
                        <Icon className="w-4.5 h-4.5 shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Profile footer inside mobile slideout */}
              <div className="pt-4 border-t border-slate-900">
                {currentUser ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 px-1">
                      <img 
                        src={currentUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.email}`} 
                        alt="Perfil" 
                        className="w-9 h-9 rounded-xl object-cover border border-[#d4fc34]/50 shrink-0" 
                      />
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-white truncate font-display">{currentUser.displayName}</span>
                        <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                          <span className="block text-[9px] text-slate-550 font-mono truncate">{currentUser.email}</span>
                          {isMockSession && (
                            <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wide shrink-0">
                              Sandbox
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-[10px] font-mono">
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsMobileOpen(false);
                        }}
                        className="w-full py-2.5 px-3 bg-red-950/20 text-red-400 hover:bg-red-950/40 rounded-xl border border-red-900/20 flex items-center justify-center gap-1.5 font-bold uppercase cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Salir de la Cuenta</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setIsMobileOpen(false);
                      setShowRegisterModal(true);
                    }}
                    className="w-full py-3 bg-[#d4fc34] hover:bg-[#bde61f] text-slate-950 font-black text-xs rounded-xl transition uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <LogIn className="w-4 h-4 text-slate-950 shrink-0" />
                    <span>Iniciar Sesion</span>
                  </button>
                )}
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* NOTIFICATIONS TRAY SYSTEM */}
      <AnimatePresence>
        {showNotifications && (
          <div className="fixed inset-0 z-50 flex justify-end p-4 lg:p-8 animate-in fade-in duration-200 pointer-events-none">
            <motion.div 
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800/80 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative z-10 self-start pointer-events-auto mt-14 lg:mt-6"
            >
              <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <span className="font-extrabold text-xs text-white uppercase tracking-wider font-display">
                  Notificaciones ({unreadCount})
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={onMarkAllRead} 
                    className="text-[10px] text-[#d4fc34] hover:underline cursor-pointer"
                  >
                    Marcar leídas
                  </button>
                  <button 
                    onClick={() => setShowNotifications(false)} 
                    className="text-slate-400 hover:text-white cursor-pointer"
                    aria-label="Cerrar notificaciones"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs font-mono">
                    No hay notificaciones cargadas.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id} className={`p-4 space-y-1 transition ${notif.read ? 'opacity-60' : 'bg-slate-850/15'}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-slate-150">{notif.title}</span>
                        <span className="text-[8px] text-slate-550 font-mono">{notif.timestamp ? notif.timestamp.slice(11, 16) : ""} h</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-normal">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-3 bg-slate-950/50 text-center border-t border-slate-900">
                  <button 
                    onClick={onClearNotifications}
                    className="text-[10px] text-red-400 hover:underline cursor-pointer"
                  >
                    Borrar todas las de la lista
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REGISTRATION MODAL FORM */}
      <AnimatePresence>
        {showRegisterModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-start justify-center p-4 z-50 overflow-y-auto pt-4 sm:items-center sm:pt-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-slate-900 border border-slate-800/95 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl relative my-2 sm:my-8"
            >
              <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#d4fc34]/10 border border-[#d4fc34]/20 rounded-lg">
                    <Trophy className="w-4 h-4 text-[#d4fc34]" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-xs font-display uppercase tracking-widest">Ficha del Competidor</h3>
                    <span className="text-[9px] text-[#d4fc34] block font-mono">Autenticación híbrida federada</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                  aria-label="Cerrar modal"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[70vh] sm:max-h-[75vh] overflow-y-auto">
                <AnimatePresence mode="popLayout">
                  {regError && (
                    <motion.div 
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="p-3.5 bg-red-950/45 border border-red-900/60 rounded-xl text-[11px] text-red-300 font-medium whitespace-pre-wrap leading-relaxed flex flex-col gap-2.5"
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <span className="flex-1">{regError}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleGoogleLogin()}
                        className="self-start text-[10px] font-bold uppercase tracking-wider text-white hover:text-[#d4fc34] bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-850 transition cursor-pointer font-mono"
                      >
                        Reintentar
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-1.5">
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest font-mono block">MÉTODO AUTOMÁTICO RECOMENDADO:</span>
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

                {!showManualForm ? (
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setShowManualForm(true)}
                      className="text-xs text-slate-400 hover:text-[#d4fc34] underline transition font-medium cursor-pointer"
                    >
                      ¿Problemas con Google? Registrate manualmente
                    </button>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-4 pt-1"
                  >
                    <div className="relative flex py-2 items-center">
                      <div className="flex-grow border-t border-slate-800"></div>
                      <span className="flex-shrink mx-3 text-[9px] text-slate-500 font-mono uppercase tracking-widest leading-none">Registro Alternativo</span>
                      <div className="flex-grow border-t border-slate-800"></div>
                    </div>

                    <form onSubmit={handleLocalRegisterSubmit} className="space-y-4 text-left">
                      <div className="p-3 bg-[#d4fc34]/10 border border-[#d4fc34]/20 rounded-xl text-[10px] text-slate-300 leading-normal font-mono flex items-start gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-[#d4fc34] shrink-0 mt-0.5 animate-pulse" />
                        <span>
                          Registro alternativo: completá tus datos para crear tu ficha de competidor sin cuenta Google.
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
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#d4fc34]/50 font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase font-mono block">DNI *</label>
                          <input
                            type="text"
                            required
                            placeholder="Documento único"
                            value={regForm.dni}
                            onChange={e => setRegForm({...regForm, dni: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#d4fc34]/50 font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Nombre *</label>
                          <input
                            type="text"
                            required
                            placeholder="Nombre completo"
                            value={regForm.firstName}
                            onChange={e => setRegForm({...regForm, firstName: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#d4fc34]/50"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Apellido *</label>
                          <input
                            type="text"
                            required
                            placeholder="Apellido registrado"
                            value={regForm.lastName}
                            onChange={e => setRegForm({...regForm, lastName: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#d4fc34]/50"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase font-mono block">WhatsApp</label>
                          <input
                            type="tel"
                            placeholder="Tel de contacto"
                            value={regForm.phone}
                            onChange={e => setRegForm({...regForm, phone: e.target.value})}
                            className="w-full bg-slate-950 border border-[#d4fc34]/20 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#d4fc34]/50 font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Ciudad de Residencia</label>
                          <input
                            type="text"
                            placeholder="Localidad"
                            value={regForm.city}
                            onChange={e => setRegForm({...regForm, city: e.target.value})}
                            className="w-full bg-slate-950 border border-[#d4fc34]/20 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#d4fc34]/50"
                          />
                        </div>
                      </div>

                      <div className="space-y-1 pt-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Categoría de Inscripción Oficial *</label>
                        <select
                          required
                          value={regForm.category}
                          onChange={e => setRegForm({...regForm, category: e.target.value})}
                          className="w-full bg-slate-950 border border-[#d4fc34]/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4fc34]/55 block appearance-none"
                        >
                          <option value="Libre Masculina">Libre Masculina</option>
                          <option value="4ta Masculina">4ta Masculina</option>
                          <option value="5ta Masculina">5ta Masculina</option>
                          <option value="6ta Masculina">6ta Masculina</option>
                          <option value="7ma Masculina">7ma Masculina</option>
                          <option value="6ta Femenina">6ta Femenina</option>
                          <option value="7ma Femenina">7ma Femenina</option>
                        </select>
                      </div>

                      <p className="text-[10px] text-slate-500 mb-3 leading-relaxed">
                        Este acceso crea una sesión local de prueba (sandbox) en este navegador, sin sincronización en la nube. Para una cuenta real con Google, usá el botón de arriba.
                      </p>

                      <button
                        type="submit"
                        className="btn-padel-primary w-full py-3 text-slate-950 font-black text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg uppercase tracking-wider mt-4"
                      >
                        <Sparkles className="w-4 h-4 text-slate-950 shrink-0" />
                        <span>Matricularse y Acceder</span>
                      </button>
                    </form>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
