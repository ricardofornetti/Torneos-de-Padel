import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { repository } from './lib/repository';
import { auth } from './lib/firebase';

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
  const [activeView, setActiveView] = useState<"dashboard" | "tournaments" | "players" | "rankings" | "courts" | "gallery" | "stats" | "fixture">("dashboard");
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [isIsolatedInscriptions, setIsIsolatedInscriptions] = useState(false);
  
  // High fidelity roles (Admin has creation/draw powers, Player has read-only exploration powers)
  const [userRole, setUserRole] = useState<"admin" | "player">("player");
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const checkRole = () => {
      const user = auth.currentUser;
      if (user && user.email === 'fornettiricardo@gmail.com') {
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
    loadNotifications();
    // Refresh alerts periodically
    const t = setInterval(loadNotifications, 5000);
    return () => clearInterval(t);
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
    setSelectedTournamentId(null);
    setIsIsolatedInscriptions(false);
    setActiveView(view);
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
          <Suspense fallback={<AppLoadingFallback />}>
            {selectedTournamentId ? (
              <TournamentDetail 
                tournamentId={selectedTournamentId}
                userRole={userRole}
                onBack={() => {
                  setSelectedTournamentId(null);
                  setIsIsolatedInscriptions(false);
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
                      onNavigateToTournament={(id) => setSelectedTournamentId(id)}
                      onNavigate={(view) => setActiveView(view as any)}
                    />
                  </div>
                )}

                {activeView === "tournaments" && (
                  <TournamentManager 
                    userRole={userRole}
                    onSelectTournament={(id) => setSelectedTournamentId(id)}
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
                    onSelectTournament={(id) => setSelectedTournamentId(id)}
                    onNavigate={handleSidebarNavigation}
                  />
                )}
              </>
            )}
          </Suspense>
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
