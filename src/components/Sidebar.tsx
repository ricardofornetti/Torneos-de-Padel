import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Bell, 
  Shield, 
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
  Sparkle
} from 'lucide-react';
import { repository } from '../lib/repository';
import { AppNotification } from '../types';
import { auth, isRealFirebase } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';

interface SidebarProps {
  userRole: "admin" | "player";
  onChangeRole: (role: "admin" | "player") => void;
  onNavigate: (view: "dashboard" | "tournaments" | "players" | "rankings" | "courts" | "gallery" | "stats" | "fixture") => void;
  activeView: string;
  notifications?: AppNotification[];
  onClearNotifications?: () => void;
  onMarkAllRead?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  userRole, 
  onChangeRole, 
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
    // Check mock login session
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
        console.error("Error reading localUserJson in Sidebar:", e);
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
        // Create player profile if doesn't exist
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
            birthDate: "1995-05-05",
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
      console.error("Google sign-in error in Sidebar UI:", error);
      setRegError(
        `Error de autenticación Google: ${error.message || 'Error general'}. Puede intentar con el formulario manual.`
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
      setRegError("Por favor ingresa un correo electrónico de Gmail válido.");
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
        `Te has registrado de manera exitosa y tu ficha está activa.`,
        "success"
      );
      
      window.dispatchEvent(new Event("storage"));
      setShowRegisterModal(false);
    } catch (err: any) {
      setRegError(`Error al guardar jugador: ${err.message || err.toString()}`);
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
        console.error("Logout error in Sidebar UI:", error);
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "tournaments", label: "Torneos", icon: Trophy },
    { id: "fixture", label: "Fixture / Calendario", icon: Calendar },
    { id: "players", label: "Jugadores", icon: Users },
    { id: "rankings", label: "Ranking Oficial", icon: BadgeTrophyIcon },
    { id: "stats", label: "Estadísticas", icon: BarChart3 },
    { id: "courts", label: "Canchas", icon: MapPin },
    { id: "gallery", label: "Galería de Fotos", icon: ImageIcon }
  ];

  function BadgeTrophyIcon(props: any) {
    return <Trophy {...props} className={props.className + " text-amber-400"} />;
  }

  const handleNavItemClick = (id: any) => {
    onNavigate(id);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* MOBILE HEADER BAR */}
      <header className="lg:hidden bg-slate-950 border-b border-slate-900 sticky top-0 z-40 px-4 py-3 flex items-center justify-between w-full">
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => setIsMobileOpen(true)}
            className="p-2 -ml-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition"
            id="mobile-menu-trigger"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div onClick={() => onNavigate("dashboard")} className="flex items-center gap-2 cursor-pointer">
            <div className="bg-gradient-to-br from-[#d4fc34] to-lime-600 p-1.5 rounded-lg text-slate-950">
              <Trophy className="w-4 h-4 text-slate-950" />
            </div>
            <span className="font-extrabold text-sm tracking-wider text-[#d4fc34] uppercase font-sans">
              Circuitos <span className="text-white">PRO</span>
            </span>
          </div>
        </div>

        {/* Mobile Header Icons */}
        <div className="flex items-center gap-2">
          {/* Notifications Trigger */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition relative"
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
              )}
            </button>
          </div>

          {/* Quick login / Profile image */}
          {currentUser ? (
            <img 
              src={currentUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.email}`} 
              alt="Me" 
              className="w-7 h-7 rounded-full border border-[#d4fc34]/60 object-cover" 
              referrerPolicy="no-referrer" 
              onClick={() => setShowRegisterModal(true)}
            />
          ) : (
            <button 
              onClick={() => setShowRegisterModal(true)}
              className="p-2 bg-[#d4fc34]/10 text-[#d4fc34] rounded-lg border border-[#d4fc34]/20 text-xs font-semibold"
            >
              <LogIn className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* DESKTOP SIDEBAR PANEL */}
      <aside 
        className={`hidden lg:flex flex-col bg-slate-950 border-r border-slate-900 sticky top-0 h-screen transition-all duration-300 z-40 shrink-0 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
        id="desktop-sidebar"
      >
        {/* Sidebar Header Brand */}
        <div className="p-5 border-b border-slate-900/60 flex items-center justify-between">
          <div 
            onClick={() => onNavigate("dashboard")} 
            className="flex items-center gap-2.5 cursor-pointer overflow-hidden select-none"
          >
            <div className="bg-gradient-to-br from-[#d4fc34] to-lime-600 p-2 rounded-xl text-slate-950 shadow-md">
              <Trophy className="w-5.5 h-5.5 text-slate-950" />
            </div>
            {!isCollapsed && (
              <div className="animate-fade-in">
                <span className="font-extrabold text-base tracking-wider text-[#d4fc34] block font-sans uppercase">
                  Circuitos <span className="text-white">PRO</span>
                </span>
                <span className="text-[9px] font-mono font-bold text-slate-500 block uppercase tracking-widest mt-0.5">
                  Padel League
                </span>
              </div>
            )}
          </div>

          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 hover:bg-slate-900 rounded-lg text-slate-500 hover:text-white transition hidden md:block"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavItemClick(item.id)}
                className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all group cursor-pointer ${
                  isActive
                    ? "bg-[#d4fc34]/10 text-[#d4fc34] border-l-2 border-[#d4fc34]"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <Icon className={`w-4.5 h-4.5 shrink-0 transition-transform ${isActive ? 'scale-105' : 'group-hover:scale-105'}`} />
                {!isCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Account & Profile */}
        <div className="p-3 border-t border-slate-900/60 bg-slate-1000/60">
          {currentUser ? (
            <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : "px-2 py-1.5 bg-slate-900/40 rounded-xl border border-slate-900"}`}>
              <img 
                src={currentUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.email}`} 
                alt="Perfil" 
                className="w-7 h-7 rounded-xl object-cover border border-[#22d3ee]/60 shrink-0" 
                referrerPolicy="no-referrer"
              />
              {!isCollapsed && (
                <div className="flex-1 min-w-0 animate-fade-in">
                  <span className="block text-[10px] font-black text-white leading-none truncate">
                    {currentUser.displayName || 'Usuario'}
                  </span>
                  <span className="block text-[8px] text-slate-500 font-mono leading-none truncate mt-0.5">
                    {currentUser.email}
                  </span>
                </div>
              )}
              {!isCollapsed && (
                <button
                  onClick={handleLogout}
                  className="p-1 hover:text-red-400 text-slate-500 transition shrink-0"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowRegisterModal(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-900 hover:bg-slate-850 text-white text-xs font-bold rounded-xl transition border border-slate-805"
            >
              <LogIn className="w-4 h-4 text-cyan-400 shrink-0" />
              {!isCollapsed && <span>Ingresar con Gmail</span>}
            </button>
          )}

          {/* Quick Admin switch indicator beneath if not collapsed */}
          {!isCollapsed && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-900/60 flex items-center justify-between text-[9px] font-mono">
              <span className="text-slate-500 uppercase tracking-wider font-bold">ROL DE ACCESO:</span>
              <button
                onClick={() => onChangeRole(userRole === "admin" ? "player" : "admin")}
                className={`px-2 py-0.5 rounded uppercase font-bold text-[8px] transition-all tracking-wider ${
                  userRole === "admin"
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                    : "bg-slate-900 text-slate-400 border border-slate-800"
                }`}
              >
                {userRole === "admin" ? "Organizador" : "Espectador"}
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* MOBILE BAR SLIDEOUT DRAWER */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop mask */}
          <div 
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
          ></div>
          
          {/* Drawer Panel */}
          <aside className="w-72 bg-slate-950 border-r border-slate-900 h-full relative z-10 flex flex-col p-5 shadow-2xl animate-in slide-in-from-left duration-250">
            <div className="flex items-center justify-between pb-5 border-b border-slate-900">
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-br from-[#d4fc34] to-lime-600 p-1.5 rounded-lg text-slate-950">
                  <Trophy className="w-4 h-4 text-slate-950" />
                </div>
                <span className="font-extrabold text-sm tracking-wider text-[#d4fc34] uppercase font-sans">
                  Circuitos <span className="text-white">PRO</span>
                </span>
              </div>
              <button 
                onClick={() => setIsMobileOpen(false)}
                className="p-1.5 hover:bg-slate-900 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nav List */}
            <nav className="flex-1 py-6 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavItemClick(item.id)}
                    className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-xl text-xs font-bold transition-all group ${
                      isActive
                        ? "bg-[#d4fc34]/10 text-[#d4fc34] border-l-2 border-[#d4fc34]"
                        : "text-slate-400 hover:text-white hover:bg-slate-900/60"
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Profile footer inside mobile slideout */}
            <div className="pt-4 border-t border-slate-900">
              {currentUser ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 px-1">
                    <img 
                      src={currentUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.email}`} 
                      alt="Perfil" 
                      className="w-9 h-9 rounded-xl object-cover border border-[#22d3ee]/60 shrink-0" 
                    />
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-white truncate">{currentUser.displayName}</span>
                      <span className="block text-[9px] text-slate-500 font-mono truncate mt-0.5">{currentUser.email}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <button
                      onClick={() => onChangeRole(userRole === "admin" ? "player" : "admin")}
                      className={`py-2 px-3 rounded-xl uppercase font-bold text-center border transition-all ${
                        userRole === "admin"
                          ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                          : "bg-slate-900 text-slate-400 border-slate-800"
                      }`}
                    >
                      {userRole === "admin" ? "⚡ ORG" : "👀 ESPECTADOR"}
                    </button>
                    <button
                      onClick={handleLogout}
                      className="py-2 px-3 bg-red-950/20 text-red-400 hover:bg-red-950/40 rounded-xl border border-red-900/25 flex items-center justify-center gap-1.5 font-bold uppercase"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Salir</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsMobileOpen(false);
                    setShowRegisterModal(true);
                  }}
                  className="w-full py-2.5 bg-[#d4fc34] hover:bg-[#c5f015] text-slate-950 font-black text-xs rounded-xl transition uppercase tracking-wider flex items-center justify-center gap-1.5"
                >
                  <LogIn className="w-4 h-4 text-slate-950 shrink-0" />
                  <span>Ingresar con Gmail</span>
                </button>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* NOTIFICATIONS TRAY SYSTEM */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 flex justify-end p-4 lg:p-8 animate-in fade-in duration-200 pointer-events-none">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative z-10 self-start pointer-events-auto mt-14 lg:mt-6 animate-in slide-in-from-right duration-250">
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
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-800/80">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs font-mono">
                  No hay notificaciones cargadas.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div key={notif.id} className={`p-4 space-y-1 transition ${notif.read ? 'opacity-60' : 'bg-slate-850/30'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-slate-150">{notif.title}</span>
                      <span className="text-[8px] text-slate-500 font-mono">{notif.timestamp ? notif.timestamp.slice(11, 16) : ""} h</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">{notif.message}</p>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 bg-slate-950/50 text-center border-t border-slate-805">
                <button 
                  onClick={onClearNotifications}
                  className="text-[10px] text-red-400 hover:underline cursor-pointer"
                >
                  Borrar todas las alertas
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REGISTRATION MODAL FORM */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl relative my-8">
            
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
              {regError && (
                <div className="p-3 bg-red-950/45 border border-red-900/60 rounded-xl text-[11px] text-red-400 font-medium whitespace-pre-wrap leading-relaxed">
                  {regError}
                </div>
              )}

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

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-3 text-[9px] text-slate-500 font-mono uppercase tracking-widest leading-none">ó Registro Manual Directo</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

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
                    <label className="text-[9px] font-bold text-slate-400 uppercase font-mono block">CUIT *</label>
                    <input
                      type="text"
                      required
                      placeholder="CUIT del competidor"
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
                    <label className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Ciudad</label>
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
                    <option value="6ta Femenina">6ta Femenina</option>
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
    </>
  );
};
