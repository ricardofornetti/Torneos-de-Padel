import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Users, 
  MapPin, 
  Activity, 
  ShieldAlert, 
  Volume2, 
  LayoutDashboard,
  LogOut,
  Sparkles,
  Award,
  Bell
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { TournamentManager } from './components/TournamentManager';
import { TournamentDetail } from './components/TournamentDetail';
import { PlayerManager } from './components/PlayerManager';
import { RankingManager } from './components/RankingManager';
import { CourtManager } from './components/CourtManager';
import { Gallery } from './components/Gallery';
import { repository } from './lib/repository';

export default function App() {
  const [activeView, setActiveView] = useState<"dashboard" | "tournaments" | "players" | "rankings" | "courts" | "gallery">("dashboard");
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [isIsolatedInscriptions, setIsIsolatedInscriptions] = useState(false);
  
  // High fidelity roles (Admin has creation/draw powers, Player has read-only exploration powers)
  const [userRole, setUserRole] = useState<"admin" | "player">("admin");
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (selectedTournamentId === null) {
      setIsIsolatedInscriptions(false);
    }
  }, [selectedTournamentId]);

  const loadNotifications = async () => {
    const list = await repository.getNotifications();
    setNotifications(list);
  };

  useEffect(() => {
    loadNotifications();
    // Refresh alerts periodically
    const t = setInterval(loadNotifications, 4000);
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-white">
      
      {/* Visual Navigation Bar */}
      {!isIsolatedInscriptions && !selectedTournamentId && activeView === "dashboard" && (
        <Navbar 
          userRole={userRole} 
          onChangeRole={(role) => setUserRole(role)}
          onNavigate={(view) => {
            setSelectedTournamentId(null);
            setIsIsolatedInscriptions(false);
            setActiveView(view);
          }}
          activeView={selectedTournamentId ? "tournaments" : activeView}
          notifications={notifications}
          onClearNotifications={handleClearAlerts}
          onMarkAllRead={handleMarkAllRead}
        />
      )}

      {/* Main Core Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Elegant inline back-to-dashboard shortcut (no header/navbar branding or bar container) */}
        {activeView !== "dashboard" && !selectedTournamentId && (
          <div className="mb-6">
            <button
              onClick={() => {
                setSelectedTournamentId(null);
                setIsIsolatedInscriptions(false);
                setActiveView("dashboard");
              }}
              className="group flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#d4fc34] hover:text-white transition-all cursor-pointer bg-slate-900/40 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 px-4 py-2 rounded-xl"
            >
              <span className="transition-transform group-hover:-translate-x-1">←</span>
              <span>Volver al Dashboard</span>
            </button>
          </div>
        )}
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
              <Dashboard 
                userRole={userRole}
                onNavigateToTournament={(id) => setSelectedTournamentId(id)}
                onNavigate={(view) => setActiveView(view)}
              />
            )}

            {activeView === "tournaments" && (
              <TournamentManager 
                userRole={userRole}
                onSelectTournament={(id) => setSelectedTournamentId(id)}
              />
            )}

            {activeView === "players" && (
              <PlayerManager 
                userRole={userRole}
              />
            )}

             {activeView === "rankings" && (
               <RankingManager userRole={userRole} />
             )}

            {activeView === "courts" && (
              <CourtManager 
                userRole={userRole}
              />
            )}

            {activeView === "gallery" && (
              <Gallery 
                userRole={userRole}
              />
            )}
          </>
        )}
      </main>

      {/* Professional Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© 2026 Padel Tournament Manager • Pro Edition v1.4.0</span>
          <div className="flex gap-4">
            <span className="text-[10px] text-slate-600">Firestore Online Sandbox Mode</span>
            <span className="text-blue-500/80">fornettiricardo@gmail.com</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
