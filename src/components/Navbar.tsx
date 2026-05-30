import React, { useState, useEffect } from 'react';
import { Trophy, Bell, Shield, User, LogIn, LogOut, CheckCircle, Crown } from 'lucide-react';
import { repository } from '../lib/repository';
import { AppNotification } from '../types';
import { auth, isRealFirebase } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';

interface NavbarProps {
  userRole: "admin" | "player";
  onChangeRole: (role: "admin" | "player") => void;
  onNavigate: (view: "dashboard" | "tournaments" | "players" | "rankings" | "courts") => void;
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

  useEffect(() => {
    if (isRealFirebase && auth) {
      const unsubscribe = auth.onAuthStateChanged((user: FirebaseUser | null) => {
        setCurrentUser(user);
        if (user) {
          // If the logged in Google user is the specified admin email, promote them to admin role
          if (user.email === 'fornettiricardo@gmail.com') {
            onChangeRole("admin");
          } else {
            onChangeRole("player");
          }
        }
      });
      return () => unsubscribe();
    }
  }, [onChangeRole]);

  const handleGoogleLogin = async () => {
    if (!isRealFirebase || !auth) return;
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google sign-in error in UI:", error);
    }
  };

  const handleLogout = async () => {
    if (!isRealFirebase || !auth) return;
    try {
      await signOut(auth);
      onChangeRole("player");
    } catch (error) {
      console.error("Logout error in UI:", error);
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

          {/* Quick role toggle on mobile */}
          <div className="flex items-center gap-2 md:hidden">
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
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none font-medium">
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
            Ranking Anual
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
        </div>

        {/* Roles and System Settings Desktop */}
        <div className="hidden md:flex items-center gap-4">
          
          {/* Active Firebase / Local Sandbox indicator */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400">
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isRealFirebase ? 'bg-cyan-400' : 'bg-amber-400'}`}></span>
            <span>{isRealFirebase ? 'Firestore Online' : 'Local Sandbox Ready'}</span>
          </div>

          {/* Action-Based Role Picker */}
          <div className="flex bg-[#0f172a] border border-slate-800 p-0.5 rounded-lg">
            <button
              onClick={() => onChangeRole("player")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                userRole === "player"
                  ? "bg-slate-800 text-white shadow-sm"
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

          {/* Real Google Auth Provider Box */}
          {isRealFirebase && (
            <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
              {currentUser ? (
                <div className="flex items-center gap-2">
                  <div className="relative group/user">
                    {currentUser.photoURL ? (
                      <img 
                        src={currentUser.photoURL} 
                        alt={currentUser.displayName || 'Me'} 
                        className="w-7 h-7 rounded-full border border-cyan-500"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-cyan-600/20 flex items-center justify-center border border-cyan-500 text-cyan-400 text-xs font-semibold">
                        {currentUser.email?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    
                    {/* Admin Badge display */}
                    {currentUser.email === 'fornettiricardo@gmail.com' && (
                      <span className="absolute -top-1 -right-1 bg-amber-500 text-black p-0.5 rounded-full text-[8px] font-bold">
                        <Crown className="w-2 h-2" />
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col text-left">
                    <span className="text-[10px] text-slate-400 max-w-[80px] truncate font-sans font-medium line-clamp-1">
                      {currentUser.displayName || 'Organizador'}
                    </span>
                    <button 
                      onClick={handleLogout} 
                      className="text-[9px] text-red-400 hover:text-red-300 hover:underline flex items-center gap-0.5"
                    >
                      <LogOut className="w-2 h-2" /> Cerrar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleGoogleLogin}
                  className="flex items-center gap-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 px-2.5 py-1 rounded-md text-xs font-black transition-all shadow shadow-cyan-500/20 active:scale-95"
                  title="Conectar con Google para guardar datos"
                >
                  <LogIn className="w-3 h-3 text-slate-950" />
                  <span>Google</span>
                </button>
              )}
            </div>
          )}

          {/* Mini-Notification center */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition-all relative"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-cyan-500 text-slate-950 font-black text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-slate-950">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification drop */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 shadow-2xl rounded-xl z-50 overflow-hidden text-slate-200">
                <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                  <span className="font-bold text-sm text-white">Notificaciones</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleMarkAllRead} 
                      className="text-[10px] text-cyan-400 hover:underline font-semibold"
                    >
                      Leídas
                    </button>
                    <button 
                      onClick={clearAllNotifications} 
                      className="text-[10px] text-red-400 hover:underline font-semibold"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-800">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">
                      Sin alertas nuevas
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div 
                        key={notif.id} 
                        className={`p-3 text-xs transition-colors ${notif.read ? 'bg-slate-900/40 text-slate-400' : 'bg-slate-950 text-slate-100'}`}
                      >
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <span className={`font-semibold ${notif.type === 'success' ? 'text-green-400' : notif.type === 'warning' ? 'text-amber-400' : 'text-cyan-400'}`}>
                            {notif.title}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono whitespace-nowrap">
                            {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="line-clamp-2">{notif.body}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
