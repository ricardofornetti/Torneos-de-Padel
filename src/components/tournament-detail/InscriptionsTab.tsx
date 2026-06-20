import React from 'react';
import { 
  Printer, 
  Sparkles, 
  Trash2, 
  AlertCircle, 
  UserPlus, 
  Shuffle, 
  Trophy 
} from 'lucide-react';
import { Tournament, Player, Pair } from '../../types';

interface InscriptionsTabProps {
  tournament: Tournament;
  pairs: Pair[];
  players: Player[];
  selectedCategory: string;
  userRole: "admin" | "player";
  isTournamentCompleted: boolean;
  unregisteredCategoryPlayers: Player[];
  availablePlayersP1: Player[];
  availablePlayersP2: Player[];
  p1Select: string;
  setP1Select: (val: string) => void;
  p2Select: string;
  setP2Select: (val: string) => void;
  hasMatchesForCategory: boolean;
  handleOpenPrintSheet: (section: "inscriptions" | "matches" | "standings" | "playoffs") => void;
  handleAutoPairRemaining: (limitCount?: number) => void;
  getPairName: (id: string) => string;
  handleDeletePair: (id: string, name: string) => void;
  handleRegisterPair: (e: React.FormEvent) => void;
  handleExecuteDraw: (method: "random" | "ranking") => void;
}

export const InscriptionsTab: React.FC<InscriptionsTabProps> = ({
  tournament,
  pairs,
  players,
  selectedCategory,
  userRole,
  isTournamentCompleted,
  unregisteredCategoryPlayers,
  availablePlayersP1,
  availablePlayersP2,
  p1Select,
  setP1Select,
  p2Select,
  setP2Select,
  hasMatchesForCategory,
  handleOpenPrintSheet,
  handleAutoPairRemaining,
  getPairName,
  handleDeletePair,
  handleRegisterPair,
  handleExecuteDraw
}) => {
  const categoryPairs = pairs.filter(p => p.category === selectedCategory);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Left Col: list of couples inscribed */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-sm text-white">Parejas Registradas</h3>
            <button
              onClick={() => handleOpenPrintSheet("inscriptions")}
              className="bg-[#d4fc34]/10 hover:bg-[#d4fc34] hover:text-slate-950 text-[#d4fc34] text-[10px] font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer border border-[#d4fc34]/20 uppercase tracking-widest"
              title="Ver planilla limpia oficial de esta categoría para imprimir o exportar, sin menú de navegación"
            >
              <Printer className="w-3.5 h-3.5" /> Abrir en nueva página (Sin menús/Imprimir)
            </button>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {categoryPairs.length} / {tournament.maxPairs} Max (por categoría)
          </span>
        </div>

        {categoryPairs.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center text-slate-500 text-xs text-balance flex flex-col items-center justify-center gap-4">
            <span>Aún no hay parejas registradas para la categoría '{selectedCategory}' en este torneo. Agrega una pareja a la derecha.</span>
            {userRole === "admin" && !isTournamentCompleted && unregisteredCategoryPlayers.length >= 2 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleAutoPairRemaining()}
                  className="bg-gradient-to-r from-[#d4fc34] to-[#b8df11] hover:shadow-lg hover:shadow-[#d4fc34]/20 text-slate-950 text-xs font-black px-5 py-3 rounded-xl transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider shadow-sm"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" /> Auto-Emparejar e Inscribir Jugadores Libres ({unregisteredCategoryPlayers.length})
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryPairs.map((pr, index) => {
              const name = getPairName(pr.id);
              return (
                <div 
                  key={pr.id}
                  className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono block">Pareja #{index + 1}</span>
                    <span className="font-extrabold text-sm block text-slate-100">{name}</span>
                    <span className="text-[9px] text-slate-400 font-mono block mt-1.5">
                      Suma de Ranking: {pr.combinedRanking} Pts
                    </span>
                  </div>

                  {userRole === "admin" && !hasMatchesForCategory && !isTournamentCompleted && (
                    <button
                      onClick={() => handleDeletePair(pr.id, name)}
                      className="bg-slate-950 hover:bg-red-950/40 p-2 text-slate-500 hover:text-red-400 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Col: form to register players */}
      <div className="lg:col-span-1 space-y-6">
        {isTournamentCompleted || hasMatchesForCategory ? (
          <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-4 text-xs text-slate-500 flex gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              {isTournamentCompleted 
                ? "Inscripciones cerradas. El torneo se encuentra finalizado." 
                : "Inscripciones cerradas para esta categoría ya que el cronograma/fixture ha sido sorteado."}
            </span>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-blue-400" /> Inscribir en {selectedCategory}
            </h4>

            <form onSubmit={handleRegisterPair} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] uppercase text-slate-400">Jugador N°1 *</label>
                <select
                  value={p1Select}
                  onChange={(e) => setP1Select(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-2 outline-none"
                >
                  <option value="">Selecciona Jugador 1...</option>
                  {availablePlayersP1.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.lastName}, {p.firstName} ({p.rankingPoints} Pts) — {p.city}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase text-slate-400">Jugador N°2 *</label>
                <select
                  value={p2Select}
                  onChange={(e) => setP2Select(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-2 outline-none"
                >
                  <option value="">Selecciona Jugador 2...</option>
                  {availablePlayersP2.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.lastName}, {p.firstName} ({p.rankingPoints} Pts) — {p.city}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-[#d4fc34] hover:bg-[#c5f015] text-slate-950 text-xs font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer uppercase tracking-wider"
              >
                Confirmar Inscripción Pareja
              </button>
            </form>

            {userRole === "admin" && unregisteredCategoryPlayers.length >= 2 && (
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Registro Rápido Simulado
                </span>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Completa rápidamente la cantidad de parejas necesarias para simular formatos específicos usando jugadores libres de la categoría ({unregisteredCategoryPlayers.length} libres):
                </p>
                
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleAutoPairRemaining(16)}
                    className="bg-slate-950 hover:bg-slate-850 hover:text-white text-[10px] text-slate-350 font-bold py-2 px-1 rounded-lg transition border border-slate-800 text-center cursor-pointer"
                    title="Auto-Empareja hasta tener 16 parejas en total"
                  >
                    Pre-llenar 16
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAutoPairRemaining(24)}
                    className="bg-slate-950 hover:bg-slate-850 hover:text-white text-[10px] text-slate-350 font-bold py-2 px-1 rounded-lg transition border border-slate-800 text-center cursor-pointer"
                    title="Auto-Empareja hasta tener 24 parejas en total"
                  >
                    Pre-llenar 24
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAutoPairRemaining(32)}
                    className="bg-slate-950 hover:bg-slate-850 hover:text-white text-[10px] text-slate-350 font-bold py-2 px-1 rounded-lg transition border border-slate-800 text-center cursor-pointer"
                    title="Auto-Empareja hasta tener 32 parejas en total"
                  >
                    Pre-llenar 32
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAutoPairRemaining()}
                    className="bg-[#d4fc34]/10 hover:bg-[#d4fc34]/20 text-[#d4fc34] hover:text-slate-100 text-[10px] font-black py-2 px-1 rounded-lg transition border border-[#d4fc34]/20 text-center cursor-pointer"
                    title="Inscribe a todos los jugadores libres disponibles"
                  >
                    Llenar Todos
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* DRAW ACTION FOR ADMIN - RENDERED UNDER THE INSCRIPTION FORM CARD */}
        {userRole === "admin" && !hasMatchesForCategory && !isTournamentCompleted && categoryPairs.length >= 2 && (
          <div className="bg-blue-950/20 border border-blue-500/20 p-5 rounded-2xl space-y-4 shadow-sm">
            <div className="flex gap-2">
              <Sparkles className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-sm text-white">Lanzar Sorteo de Zona • {selectedCategory}</h4>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">
                  Utiliza nuestro procesador de sorteos para dividir las parejas en zonas y fabricar dinámicamente el fixture de partidos (Round Robin) para la categoría de competencia seleccionada.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={() => handleExecuteDraw("random")}
                className="w-full bg-[#d4fc34] hover:bg-[#c5f015] text-slate-950 text-xs font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer uppercase tracking-wider"
              >
                <Shuffle className="w-4 h-4 text-slate-950" /> Sorteo Aleatorio
              </button>
              <button
                onClick={() => handleExecuteDraw("ranking")}
                className="w-full bg-[#d4fc34] hover:bg-[#c5f015] text-slate-950 text-xs font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer uppercase tracking-wider"
              >
                <Trophy className="w-4 h-4 text-slate-950" /> Sorteo equilibrado por Ranking
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
