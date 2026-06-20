import React, { useState } from 'react';
import { Trophy, Filter } from 'lucide-react';
import { Tournament, Pair, Match, Player } from '../../types';

interface PlayoffsTabProps {
  tournament: Tournament;
  pairs: Pair[];
  matches: Match[];
  players: Player[];
  selectedCategory: string;
  userRole: "admin" | "player";
  handleOpenScorer: (m: Match) => void;
}

type PlayoffFilterType = "all" | "r1" | "r2" | "16avos" | "16vos" | "rc" | "8avos" | "4tos" | "semifinal" | "final";

export const PlayoffsTab: React.FC<PlayoffsTabProps> = ({
  tournament,
  pairs,
  matches,
  players,
  selectedCategory,
  userRole,
  handleOpenScorer
}) => {
  const [playoffFilter, setPlayoffFilter] = useState<PlayoffFilterType>("all");

  const categoryMatches = matches.filter(m => m.category === selectedCategory);
  if (categoryMatches.length === 0) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center text-slate-500 text-xs">
        La eliminatoria directa de playoffs aún no se ha generado para {selectedCategory}. Termina los grupos y presiona lanzar eliminatorias en la pestaña Posiciones.
      </div>
    );
  }

  const categoryPairs = pairs.filter(p => p.category === selectedCategory);
  const isSRTC16 = categoryPairs.length === 16;
  const isSRTC32 = categoryPairs.length === 32;

  const matches_r1 = (isSRTC16 || isSRTC32) 
    ? categoryMatches.filter(m => m.roundNumber === 1 || m.stageName.toLowerCase().includes("ronda 1")) 
    : [];
  const matches_r2 = (isSRTC16 || isSRTC32) 
    ? categoryMatches.filter(m => m.roundNumber === 2 || m.stageName.toLowerCase().includes("ronda 2")) 
    : [];

  const playoffMatches = categoryMatches.filter(m => m.phase === "playoff");
  const has16 = playoffMatches.some(m => m.stageName.startsWith("16avos de Final") || m.stageName.startsWith("Dieciseisavos"));
  const hasRc = playoffMatches.some(m => m.stageName.includes("Ronda Clasificatoria"));
  
  const has8 = isSRTC32 
    ? categoryMatches.some(m => m.roundNumber === 3 || m.stageName.toLowerCase().includes("octavos") || m.stageName.toLowerCase().includes("8avos"))
    : playoffMatches.some(m => m.stageName.startsWith("Octavos de Final") || m.stageName.startsWith("8avos de Final"));

  const has4 = isSRTC16 
    ? categoryMatches.some(m => m.roundNumber === 3)
    : isSRTC32 
    ? categoryMatches.some(m => m.roundNumber === 4)
    : playoffMatches.some(m => m.stageName.startsWith("Cuartos") || m.stageName.startsWith("Cuartos de Final") || m.stageName.startsWith("4tos"));

  const hasSf = isSRTC16
    ? categoryMatches.some(m => m.roundNumber === 4)
    : isSRTC32
    ? categoryMatches.some(m => m.roundNumber === 5)
    : playoffMatches.some(m => m.stageName.startsWith("Semifinal"));

  const hasF = isSRTC16
    ? categoryMatches.some(m => m.roundNumber === 5)
    : isSRTC32
    ? categoryMatches.some(m => m.roundNumber === 6)
    : playoffMatches.some(m => m.stageName === "Final");

  const matches_16avos = playoffMatches.filter(m => m.stageName.startsWith("16avos de Final") || m.stageName.startsWith("Dieciseisavos"));
  const matches_rc = playoffMatches.filter(m => m.stageName.includes("Ronda Clasificatoria"));
  
  const matches_8avos = isSRTC32 
    ? categoryMatches.filter(m => m.roundNumber === 3 || m.stageName.toLowerCase().includes("octavos") || m.stageName.toLowerCase().includes("8avos"))
    : playoffMatches.filter(m => m.stageName.startsWith("Octavos de Final") || m.stageName.startsWith("8avos de Final"));

  const matches_4tos = isSRTC16 
    ? categoryMatches.filter(m => m.roundNumber === 3)
    : isSRTC32 
    ? categoryMatches.filter(m => m.roundNumber === 4)
    : playoffMatches.filter(m => m.stageName.startsWith("Cuartos") || m.stageName.startsWith("Cuartos de Final") || m.stageName.startsWith("4tos"));

  const matches_sf = isSRTC16
    ? categoryMatches.filter(m => m.roundNumber === 4)
    : isSRTC32
    ? categoryMatches.filter(m => m.roundNumber === 5)
    : playoffMatches.filter(m => m.stageName.startsWith("Semifinal"));

  const matches_final = isSRTC16
    ? categoryMatches.filter(m => m.roundNumber === 5)
    : isSRTC32
    ? categoryMatches.filter(m => m.roundNumber === 6)
    : playoffMatches.filter(m => m.stageName === "Final");

  const renderPlayoffMatchCard = (m: Match) => {
    return (
      <div 
        key={m.id}
        className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl transition-all hover:border-slate-500/50 w-[245px] hover:shadow-2xl hover:bg-slate-900/95 duration-200"
      >
        <div className="p-2.5 border-b border-slate-850 bg-slate-950 font-mono text-[10px] text-center text-slate-400 font-bold flex items-center justify-between px-3.5">
          <span className="uppercase tracking-wider font-extrabold">{m.stageName}</span>
          {m.status !== "pending" && (
            <span className="text-[8px] bg-[#d4fc34]/15 text-[#d4fc34] border border-[#d4fc34]/25 px-1.5 py-0.5 rounded font-black tracking-wider shadow-sm">OK</span>
          )}
        </div>
        
        <div className="p-3.5 space-y-3 text-xs">
          {/* Pair 1 info with avatars */}
          <div className="flex items-center justify-between gap-1.5 min-h-[1.75rem]">
            {m.pair1Id ? (() => {
              const pr = pairs.find(p => p.id === m.pair1Id);
              const p1 = pr ? players.find(p => p.id === pr.player1Id) : null;
              const p2 = pr ? players.find(p => p.id === pr.player2Id) : null;
              
              return (
                <div className="flex items-center gap-1 truncate max-w-[210px] py-0.5">
                  {/* Player 1 Avatar + Name */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {p1?.photoUrl ? (
                      <img 
                        src={p1.photoUrl} 
                        alt={p1.lastName} 
                        className="w-5 h-5 rounded-full object-cover border border-slate-950 shrink-0 select-none shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[8px] text-slate-400 font-bold shrink-0 select-none">
                        {p1?.lastName?.[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                    <span className={`font-black tracking-tight text-xs truncate max-w-[76px] ${
                      m.winnerPairId === m.pair1Id ? 'text-[#d4fc34]' : m.winnerPairId ? 'text-slate-500' : 'text-slate-200'
                    }`}>
                      {p1?.lastName || "???"}
                    </span>
                  </div>

                  <span className="text-slate-700 font-bold select-none text-[9px] mx-0.5">/</span>

                  {/* Player 2 Avatar + Name */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {p2?.photoUrl ? (
                      <img 
                        src={p2.photoUrl} 
                        alt={p2.lastName} 
                        className="w-5 h-5 rounded-full object-cover border border-slate-950 shrink-0 select-none shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[8px] text-slate-400 font-bold shrink-0 select-none">
                        {p2?.lastName?.[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                    <span className={`font-black tracking-tight text-xs truncate max-w-[76px] ${
                      m.winnerPairId === m.pair1Id ? 'text-[#d4fc34]' : m.winnerPairId ? 'text-slate-500' : 'text-slate-200'
                    }`}>
                      {p2?.lastName || "???"}
                    </span>
                  </div>
                </div>
              );
            })() : (
              <span className="text-slate-500 italic text-[11px] font-medium pl-1">Esperando...</span>
            )}
            {m.winnerPairId === m.pair1Id && <Trophy className="w-3.5 h-3.5 text-[#d4fc34] shrink-0 fill-[#d4fc34]/20 ml-auto pr-0.5" />}
          </div>
          
          {/* Pair 2 info with avatars */}
          <div className="flex items-center justify-between gap-1.5 min-h-[1.75rem] border-t border-slate-800/40 pt-2.5">
            {m.pair2Id ? (() => {
              const pr = pairs.find(p => p.id === m.pair2Id);
              const p1 = pr ? players.find(p => p.id === pr.player1Id) : null;
              const p2 = pr ? players.find(p => p.id === pr.player2Id) : null;
              
              return (
                <div className="flex items-center gap-1 truncate max-w-[210px] py-0.5">
                  {/* Player 1 Avatar + Name */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {p1?.photoUrl ? (
                      <img 
                        src={p1.photoUrl} 
                        alt={p1.lastName} 
                        className="w-5 h-5 rounded-full object-cover border border-slate-950 shrink-0 select-none shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[8px] text-slate-400 font-bold shrink-0 select-none">
                        {p1?.lastName?.[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                    <span className={`font-black tracking-tight text-xs truncate max-w-[76px] ${
                      m.winnerPairId === m.pair2Id ? 'text-[#d4fc34]' : m.winnerPairId ? 'text-slate-505' : 'text-slate-205'
                    }`}>
                      {p1?.lastName || "???"}
                    </span>
                  </div>

                  <span className="text-slate-700 font-bold select-none text-[9px] mx-0.5">/</span>

                  {/* Player 2 Avatar + Name */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {p2?.photoUrl ? (
                      <img 
                        src={p2.photoUrl} 
                        alt={p2.lastName} 
                        className="w-5 h-5 rounded-full object-cover border border-slate-950 shrink-0 select-none shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[8px] text-slate-400 font-bold shrink-0 select-none">
                        {p2?.lastName?.[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                    <span className={`font-black tracking-tight text-xs truncate max-w-[76px] ${
                      m.winnerPairId === m.pair2Id ? 'text-[#d4fc34]' : m.winnerPairId ? 'text-slate-505' : 'text-slate-205'
                    }`}>
                      {p2?.lastName || "???"}
                    </span>
                  </div>
                </div>
              );
            })() : (
              <span className="text-slate-500 italic text-[11px] font-medium pl-1">Esperando...</span>
            )}
            {m.winnerPairId === m.pair2Id && <Trophy className="w-3.5 h-3.5 text-[#d4fc34] shrink-0 fill-[#d4fc34]/20 ml-auto pr-0.5" />}
          </div>

          {m.status !== "pending" && m.scoreSummary && (
            <div className="mt-2.5 text-center pt-2 border-t border-slate-800/40">
              <span className="bg-[#d4fc34]/10 border border-[#d4fc34]/25 text-[#d4fc34] font-mono text-[10px] py-0.5 px-2.5 rounded inline-block font-black shadow-sm">
                Marcador: {m.scoreSummary}
              </span>
            </div>
          )}
        </div>

        {userRole === "admin" && (
          <button 
            type="button"
            onClick={() => handleOpenScorer(m)}
            className="w-full bg-slate-950/60 hover:bg-slate-800 py-1.5 font-mono text-[9px] border-t border-slate-850 text-[#d4fc34] font-bold hover:text-white cursor-pointer transition-colors text-center"
          >
            Cargar Marcador
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5 border-none">
          <Trophy className="w-4 h-4 text-indigo-400" /> Playoffs Eliminatorios: {selectedCategory}
        </h3>
      </div>

      {/* Panel de Filtros de Playoffs */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md space-y-3.5">
        <div className="flex items-center gap-2 text-xs font-mono font-black text-[#d4fc34] uppercase tracking-wider border-b border-slate-850 pb-2">
          <Filter className="w-4 h-4" /> Filtros de Eliminación Directa
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Fase / Ronda Activa</label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "all", label: "Todas las Llaves" },
              ...(matches_r1.length > 0 ? [{ id: "r1", label: "Ronda 1" }] : []),
              ...(matches_r2.length > 0 ? [{ id: "r2", label: "Ronda 2" }] : []),
              ...(has16 ? [{ id: "16vos", label: "Dieciseisavos" }] : []),
              ...(has8 ? [{ id: "8avos", label: "Octavos" }] : []),
              ...(has4 ? [{ id: "4tos", label: "Cuartos" }] : []),
              ...(hasSf ? [{ id: "semifinal", label: "Semifinales" }] : []),
              ...(hasF ? [{ id: "final", label: "Gran Final" }] : [])
            ].map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => setPlayoffFilter(r.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase cursor-pointer ${
                  playoffFilter === r.id
                    ? "bg-[#d4fc34] text-slate-950 shadow-md font-extrabold"
                    : "bg-slate-950 text-slate-400 border border-slate-850 hover:text-white"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        </div>
      </div>

      <div className="py-2 overflow-x-auto">
        <div className={`flex gap-5 pb-4 justify-start items-start ${
          playoffFilter === "all" 
            ? (isSRTC32 ? "min-w-[1950px]" : isSRTC16 ? "min-w-[1600px]" : "min-w-[1150px]") 
            : "min-w-0"
        }`}>
          
          {/* Ronda 1 Column */}
          {matches_r1.length > 0 && (playoffFilter === "all" || playoffFilter === "r1") && (
            <div className="space-y-6 w-[270px] shrink-0">
              <span className="block text-[10px] text-[#d4fc34] uppercase tracking-widest font-mono text-center font-extrabold bg-slate-900/40 border border-slate-800 py-1.5 rounded-lg">Ronda 1</span>
              <div className="space-y-4">
                {matches_r1.map(m => renderPlayoffMatchCard(m))}
              </div>
            </div>
          )}

          {/* Arrow Spacer */}
          {matches_r1.length > 0 && playoffFilter === "all" && (
            <div className="hidden md:flex self-center text-slate-700 font-extrabold shrink-0 text-sm">➔</div>
          )}

          {/* Ronda 2 Column */}
          {matches_r2.length > 0 && (playoffFilter === "all" || playoffFilter === "r2") && (
            <div className="space-y-6 w-[270px] shrink-0">
              <span className="block text-[10px] text-[#d4fc34] uppercase tracking-widest font-mono text-center font-extrabold bg-slate-900/40 border border-slate-800 py-1.5 rounded-lg">Ronda 2</span>
              <div className="space-y-4">
                {matches_r2.map(m => renderPlayoffMatchCard(m))}
              </div>
            </div>
          )}

          {/* Arrow Spacer */}
          {matches_r2.length > 0 && playoffFilter === "all" && (
            <div className="hidden md:flex self-center text-slate-700 font-extrabold shrink-0 text-sm">➔</div>
          )}

          {/* 16avos Column */}
          {matches_16avos.length > 0 && (playoffFilter === "all" || playoffFilter === "16avos" || playoffFilter === "16vos") && (
            <div className="space-y-6 w-[270px] shrink-0">
              <span className="block text-[10px] text-slate-500 uppercase tracking-widest font-mono text-center font-extrabold bg-slate-900/40 py-1.5 rounded-lg">16avos de Final</span>
              <div className="space-y-4">
                {matches_16avos.map(m => renderPlayoffMatchCard(m))}
              </div>
            </div>
          )}

          {/* Arrow Spacer */}
          {matches_16avos.length > 0 && playoffFilter === "all" && (
            <div className="hidden md:flex self-center text-slate-700 font-extrabold shrink-0 text-sm">➔</div>
          )}

          {/* Ronda Clasificatoria Column (SRTC-24) */}
          {matches_rc.length > 0 && (playoffFilter === "all" || playoffFilter === "rc") && (
            <div className="space-y-6 w-[270px] shrink-0">
              <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-mono text-center font-extrabold bg-slate-900/40 py-1.5 rounded-lg">Ronda Clasificatoria</span>
              <div className="space-y-4">
                {matches_rc.map(m => renderPlayoffMatchCard(m))}
              </div>
            </div>
          )}

          {/* Arrow Spacer */}
          {matches_rc.length > 0 && playoffFilter === "all" && (
            <div className="hidden md:flex self-center text-slate-700 font-extrabold shrink-0 text-sm">➔</div>
          )}

          {/* 8avos Column */}
          {matches_8avos.length > 0 && (playoffFilter === "all" || playoffFilter === "8avos") && (
            <div className="space-y-6 w-[270px] shrink-0">
              <span className="block text-[10px] text-slate-450 uppercase tracking-widest font-mono text-center font-extrabold bg-slate-900/40 py-1.5 rounded-lg">8avos de Final</span>
              <div className="space-y-4">
                {matches_8avos.map(m => renderPlayoffMatchCard(m))}
              </div>
            </div>
          )}

          {/* Arrow Spacer */}
          {matches_8avos.length > 0 && playoffFilter === "all" && (
            <div className="hidden md:flex self-center text-slate-700 font-extrabold shrink-0 text-sm">➔</div>
          )}

          {/* Cuartos Column */}
          {matches_4tos.length > 0 && (playoffFilter === "all" || playoffFilter === "4tos") && (
            <div className="space-y-6 w-[270px] shrink-0">
              <span className="block text-[10px] text-slate-300 uppercase tracking-widest font-mono text-center font-extrabold bg-slate-900/40 py-1.5 rounded-lg">Cuartos de Final</span>
              <div className="space-y-4">
                {matches_4tos.map(m => renderPlayoffMatchCard(m))}
              </div>
            </div>
          )}

          {/* Arrow Spacer */}
          {matches_4tos.length > 0 && playoffFilter === "all" && (
            <div className="hidden md:flex self-center text-slate-700 font-extrabold shrink-0 text-sm">➔</div>
          )}

          {/* Semifinals Column */}
          {matches_sf.length > 0 && (playoffFilter === "all" || playoffFilter === "semifinal") && (
            <div className="space-y-6 w-[270px] shrink-0">
              <span className="block text-[10px] text-slate-200 uppercase tracking-widest font-mono text-center font-extrabold bg-slate-900/40 py-1.5 rounded-lg">Semifinales</span>
              <div className="space-y-4">
                {matches_sf.map(m => renderPlayoffMatchCard(m))}
              </div>
            </div>
          )}

          {/* Arrow Spacer */}
          {matches_sf.length > 0 && playoffFilter === "all" && (
            <div className="hidden md:flex self-center text-slate-700 font-extrabold shrink-0 text-sm">➔</div>
          )}

          {/* Final Column */}
          {matches_final.length > 0 && (playoffFilter === "all" || playoffFilter === "final") && (
            <div className="space-y-6 w-[290px] shrink-0">
              <span className="block text-[10px] text-yellow-450 uppercase tracking-widest font-mono text-center font-extrabold bg-indigo-950/20 py-1.5 border border-indigo-500/10 rounded-lg">Gran Final</span>
              <div className="space-y-4">
                {matches_final.map(m => (
                  <div 
                    key={m.id}
                    className="bg-indigo-950/20 border-2 border-indigo-500/20 rounded-2xl overflow-hidden shadow-xl"
                  >
                    <div className="p-2 border-b border-indigo-500/10 bg-indigo-950/40 font-mono text-[9px] text-center text-amber-400 font-black tracking-widest uppercase">
                      MATCH POINT - FINAL
                    </div>

                    <div className="p-4 space-y-3.5 text-xs animate-fade-in">
                      <div className="flex items-center justify-between gap-1.5 min-h-[1.75rem]">
                        {m.pair1Id ? (() => {
                          const pr = pairs.find(p => p.id === m.pair1Id);
                          const p1 = pr ? players.find(p => p.id === pr.player1Id) : null;
                          const p2 = pr ? players.find(p => p.id === pr.player2Id) : null;

                          return (
                            <div className="flex items-center gap-1.5 truncate max-w-[230px]">
                              {/* Player 1 avatar + name */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                {p1?.photoUrl ? (
                                  <img 
                                    src={p1.photoUrl} 
                                    alt={p1.lastName} 
                                    className="w-5 h-5 rounded-full object-cover border border-slate-950 shrink-0 select-none shadow-sm"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[8px] text-slate-400 font-bold shrink-0 select-none">
                                    {p1?.lastName?.[0]?.toUpperCase() || "?"}
                                  </div>
                                )}
                                <span className={`font-black text-xs ${m.winnerPairId === m.pair1Id ? 'text-amber-400' : 'text-slate-100'}`}>
                                  {p1?.lastName || "???"}
                                </span>
                              </div>

                              <span className="text-slate-600 font-bold select-none text-[9px] mx-0.5">/</span>

                              {/* Player 2 avatar + name */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                {p2?.photoUrl ? (
                                  <img 
                                    src={p2.photoUrl} 
                                    alt={p2.lastName} 
                                    className="w-5 h-5 rounded-full object-cover border border-slate-950 shrink-0 select-none shadow-sm"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[8px] text-slate-400 font-bold shrink-0 select-none">
                                    {p2?.lastName?.[0]?.toUpperCase() || "?"}
                                  </div>
                                )}
                                <span className={`font-black text-xs ${m.winnerPairId === m.pair1Id ? 'text-amber-400' : 'text-slate-100'}`}>
                                  {p2?.lastName || "???"}
                                </span>
                              </div>
                            </div>
                          );
                        })() : (
                          <span className="text-slate-500 italic text-[11px] pl-1">Por clasificar</span>
                        )}
                        {m.winnerPairId === m.pair1Id && <Trophy className="w-3.5 h-3.5 text-indigo-400 shrink-0 fill-indigo-400/20" />}
                      </div>

                      <div className="flex items-center justify-between gap-1.5 min-h-[1.75rem] border-t border-slate-800/60 pt-3">
                        {m.pair2Id ? (() => {
                          const pr = pairs.find(p => p.id === m.pair2Id);
                          const p1 = pr ? players.find(p => p.id === pr.player1Id) : null;
                          const p2 = pr ? players.find(p => p.id === pr.player2Id) : null;

                          return (
                            <div className="flex items-center gap-1.5 truncate max-w-[230px]">
                              {/* Player 1 avatar + name */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                {p1?.photoUrl ? (
                                  <img 
                                    src={p1.photoUrl} 
                                    alt={p1.lastName} 
                                    className="w-5 h-5 rounded-full object-cover border border-slate-950 shrink-0 select-none shadow-sm"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[8px] text-slate-400 font-bold shrink-0 select-none">
                                    {p1?.lastName?.[0]?.toUpperCase() || "?"}
                                  </div>
                                )}
                                <span className={`font-black text-xs ${m.winnerPairId === m.pair2Id ? 'text-amber-400' : 'text-slate-100'}`}>
                                  {p1?.lastName || "???"}
                                </span>
                              </div>

                              <span className="text-slate-600 font-bold select-none text-[9px] mx-0.5">/</span>

                              {/* Player 2 avatar + name */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                {p2?.photoUrl ? (
                                  <img 
                                    src={p2.photoUrl} 
                                    alt={p2.lastName} 
                                    className="w-5 h-5 rounded-full object-cover border border-slate-950 shrink-0 select-none shadow-sm"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[8px] text-slate-400 font-bold shrink-0 select-none">
                                    {p2?.lastName?.[0]?.toUpperCase() || "?"}
                                  </div>
                                )}
                                <span className={`font-black text-xs ${m.winnerPairId === m.pair2Id ? 'text-amber-400' : 'text-slate-100'}`}>
                                  {p2?.lastName || "???"}
                                </span>
                              </div>
                            </div>
                          );
                        })() : (
                          <span className="text-slate-500 italic text-[11px] pl-1">Por clasificar</span>
                        )}
                        {m.winnerPairId === m.pair2Id && <Trophy className="w-3.5 h-3.5 text-indigo-400 shrink-0 fill-indigo-400/20" />}
                      </div>

                      {m.status !== "pending" && m.scoreSummary && (
                        <div className="mt-3.5 text-center pt-2 border-t border-slate-800/40">
                          <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono font-black py-1 px-3.5 rounded-lg inline-block text-xs">
                            Score: {m.scoreSummary}
                          </span>
                        </div>
                      )}
                    </div>

                    {userRole === "admin" && (
                      <button 
                        type="button"
                        onClick={() => handleOpenScorer(m)}
                        className="w-full bg-indigo-900/30 hover:bg-slate-850 py-2.5 font-mono text-[10px] border-t border-indigo-500/10 text-white font-bold cursor-pointer transition-colors text-center"
                      >
                        Cargar Resultado Final
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
