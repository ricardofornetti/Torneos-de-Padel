import React, { useState, useEffect, Suspense, lazy, Component } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { repository } from './lib/repository';
import { auth, db, isRealFirebase } from './lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { AppNotification } from './types';
import { AppView } from './lib/uiTypes';

// ── Error Boundary ────────────────────────────────────────────────────────────
// Captura errores en el árbol de componentes hijos y muestra una UI de
// recuperación en vez de crashear toda la app.
class ErrorBoundary extends Component<
  { children: React.ReactNode; fallbackView?: string },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; fallbackView?: string }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Solo log técnico en consola — nunca mostrar stack trace al usuario
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-lg mx-auto mt-20 px-6 text-center space-y-4">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-white font-black text-xl uppercase tracking-wider">
            Algo salió mal
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Ocurrió un error inesperado en esta sección. Podés intentar recargar
            o volver al inicio.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="bg-[#d4fc34] text-slate-950 text-xs font-black px-5 py-2.5 rounded-xl uppercase tracking-wider hover:bg-[#bde61f] transition"
            >
              Reintentar
            </button>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.search = ''; }}
              className="bg-slate-800 text-slate-200 text-xs font-black px-5 py-2.5 rounded-xl uppercase tracking-wider hover:bg-slate-700 transition"
            >
              Ir al inicio
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const TournamentManager = lazy(() => import('./components/TournamentManager').then(m => ({ default: m.TournamentManager })));
const TournamentDetail = lazy(() => import('./components/TournamentDetail').then(m => ({ default: m.TournamentDetail })));
const PlayerManager = lazy(() => import('./components/PlayerManager').then(m => ({ default: m.PlayerManager })));
const RankingManager = lazy(() => import('./components/RankingManager').then(m => ({ default: m.RankingManager })));
const CourtManager = lazy(() => import('./components/CourtManager').then(m => ({ default: m.CourtManager })));
const Gallery = lazy(() => import('./components/Gallery').then(m => ({ default: m.Gallery })));
const StatsView = lazy(() => import('./components/StatsView').then(m => ({ default: m.StatsView })));
const FixtureView = lazy(() => import('./components/FixtureView').then(m => ({ default: m.FixtureView })));

function AppLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-slate-700 border-t-[#d4fc34] rounded-full animate-spin" />
        <p className="text-xs text-slate-500 uppercase tracking-wider">Cargando...</p>
      </div>
    </div>
  );
}

export default function App() {
  const [activeView, setActiveView] = useState<AppView>("dashboard");
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [isIsolatedInscriptions, setIsIsolatedInscriptions] = useState(false);

  const navigateTo = (view: AppView, tournamentId: string | null = null, pushToHistory = true) => {
    setActiveView(view);
    setSelectedTournamentId(tournamentId);
    if (tournamentId === null) {
      setIsIsolatedInscriptions(false);
    }
    
    if (pushToHistory) {
      const params = new URLSearchParams();
      params.set('view', view);
      if (tournamentId) {
        params.set('tournament', tournamentId);
      }
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.pushState({ view, tournamentId }, '', newUrl);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = (params.get('view') as AppView) || 'dashboard';
    const tournamentId = params.get('tournament');
    
    navigateTo(view, tournamentId, false);
    
    const urlParams = new URLSearchParams();
    urlParams.set('view', view);
    if (tournamentId) {
      urlParams.set('tournament', tournamentId);
    }
    window.history.replaceState({ view, tournamentId }, '', `${window.location.pathname}?${urlParams.toString()}`);
  }, []);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && typeof event.state === 'object' && 'view' in event.state) {
        const view = event.state.view as AppView;
        const tournamentId = event.state.tournamentId as string | null;
        navigateTo(view, tournamentId, false);
      } else {
        const params = new URLSearchParams(window.location.search);
        const view = (params.get('view') as AppView) || 'dashboard';
        const tournamentId = params.get('tournament');
        navigateTo(view, tournamentId, false);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  
  // High fidelity roles (Admin has creation/draw powers, Player has read-only exploration powers)
  const [userRole, setUserRole] = useState<"admin" | "player">("player");
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const checkRole = () => {
      const user = auth.currentUser;
      if (user && user.emailVerified && user.email === 'fornettiricardo@gmail.com') {
        setUserRole("admin");
      } else {
        setUserRole("player");
      }
    };

    checkRole();
    const unsubscribe = auth.onAuthStateChanged(checkRole);

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (selectedTournamentId === null) {
      setIsIsolatedInscriptions(false);
    }
  }, [selectedTournamentId]);

  const loadNotifications = async () => {
  try {
    const list = await repository.getNotifications();
    setNotifications(list);
  } catch (e) {
    console.warn("Failed to load notifications: ", e);
  }
};

useEffect(() => {
  if (!isRealFirebase) {
    // Modo sandbox (localStorage): carga una vez, sin polling
    loadNotifications();
    return;
  }

  // Modo Firebase real: listener en tiempo real
  // onSnapshot mantiene una conexión abierta y solo notifica cuando hay cambios.
  // No cobra reads innecesarios como el setInterval de 5 segundos.
  const q = query(
    collection(db, 'notifications'),
    orderBy('timestamp', 'desc'),
    limit(50)
  );

  const unsubscribe = onSnapshot(q,
    (snap) => {
      const list = snap.docs.map(d => d.data() as AppNotification);
      setNotifications(list);
    },
    (error) => {
      // Si falla el listener (ej. sin permisos), fallback silencioso a localStorage
      console.warn('Notifications listener error, falling back:', error);
      loadNotifications();
    }
  );

  // Limpia la conexión cuando el componente se desmonta
  return () => unsubscribe();
}, []);

  const handleClearAlerts = async () => {
    await repository.clearNotifications();
    loadNotifications();
  };

  const handleMarkAllRead = async () => {
    repository.markNotificationsAsRead();
    loadNotifications();
  };

  const handleSidebarNavigation = (view: typeof activeView) => {
    navigateTo(view, null);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-white">
      
      {/* Visual Navigation Sidebar */}
      <Sidebar 
        userRole={userRole} 
        onNavigate={handleSidebarNavigation}
        activeView={selectedTournamentId ? "tournaments" : activeView}
        notifications={notifications}
        onClearNotifications={handleClearAlerts}
        onMarkAllRead={handleMarkAllRead}
      />

      {/* Main Core View Area */}
      <main className="flex-1 w-full min-w-0 flex flex-col bg-slate-950">
        
        <div className="flex-1">
          <ErrorBoundary>
            <Suspense fallback={<AppLoadingFallback />}>
            {selectedTournamentId ? (
              <TournamentDetail 
                tournamentId={selectedTournamentId}
                userRole={userRole}
                onBack={() => {
                  navigateTo("tournaments", null);
                }}
                onIsolateModeChange={(isolated) => {
                  setIsIsolatedInscriptions(isolated);
                }}
              />
            ) : (
              <>
                {activeView === "dashboard" && (
                  <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Dashboard 
                      userRole={userRole}
                      onNavigateToTournament={(id) => navigateTo("tournaments", id)}
                      onNavigate={(view) => navigateTo(view, null)}
                    />
                  </div>
                )}

                {activeView === "tournaments" && (
                  <TournamentManager 
                    userRole={userRole}
                    onSelectTournament={(id) => navigateTo("tournaments", id)}
                    onBack={() => handleSidebarNavigation("dashboard")}
                  />
                )}

                {activeView === "players" && (
                  <PlayerManager 
                    userRole={userRole}
                    onBack={() => handleSidebarNavigation("dashboard")}
                  />
                )}

                {activeView === "rankings" && (
                  <RankingManager 
                    userRole={userRole} 
                    onBack={() => handleSidebarNavigation("dashboard")}
                  />
                )}

                {activeView === "courts" && (
                  <CourtManager 
                    userRole={userRole}
                    onBack={() => handleSidebarNavigation("dashboard")}
                  />
                )}

                {activeView === "gallery" && (
                  <Gallery 
                    userRole={userRole}
                    onBack={() => handleSidebarNavigation("dashboard")}
                  />
                )}

                {activeView === "stats" && (
                  <StatsView />
                )}

                {activeView === "fixture" && (
                  <FixtureView 
                    onSelectTournament={(id) => navigateTo("tournaments", id)}
                    onNavigate={handleSidebarNavigation}
                  />
                )}
              </>
            )}
          </Suspense>
        </ErrorBoundary>
        </div>

        {/* Clean Responsive Footer */}
        <footer className="border-t border-slate-900/45 bg-slate-1000/30 py-6 text-center text-xs text-slate-500 font-mono mt-8">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span>© 2026 Circuitos de Torneos • Pro League-ATP Padel Platform v1.4.0</span>
            <div className="flex gap-4">
              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Online Mode</span>
              <span className="text-[#d4fc34] hover:underline">ricardofornetti@gmail.com</span>
            </div>
          </div>
        </footer>

      </main>

    </div>
  );
}
