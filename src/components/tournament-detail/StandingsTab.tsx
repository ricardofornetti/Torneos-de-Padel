import React from 'react';
import { Trophy, Award, Shield, BarChart2, Settings } from 'lucide-react';
import { Tournament, Pair, Match } from '../../types';
import { calculateGroupStandings, calculateDosVidasStandings } from '../../lib/tournamentEngine';

interface StandingsTabProps {
  tournament: Tournament;
  pairs: Pair[];
  matches: Match[];
  selectedCategory: string;
  userRole: "admin" | "player";
  getPairName: (id: string | null | undefined) => string;
  handleGenerateNextRound: () => void;
  handleLaunchPlayoffs: () => void;
}

export const StandingsTab: React.FC<StandingsTabProps> = ({
  tournament,
  pairs,
  matches,
  selectedCategory,
  userRole,
  getPairName,
  handleGenerateNextRound,
  handleLaunchPlayoffs
}) => {
  const categoryPairs = pairs.filter(p => p.category === selectedCategory);
  const categoryGroupMatches = matches.filter(m => m.category === selectedCategory && m.phase === "group");
  
  if (categoryGroupMatches.length === 0) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4">
        <Trophy className="w-12 h-12 text-amber-500/40 mx-auto" />
        <h3 className="font-bold text-slate-200">Torneo no Iniciado</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          La fase inicial para la categoría <strong className="text-[#d4fc34]">{selectedCategory}</strong> aún no cuenta con partidos generados. Ve a la pestaña <span className="underline">Inscritos</span> para realizar el Sorteo.
        </p>
      </div>
    );
  }

  const isSRTC24 = categoryPairs.length === 24;

  if (isSRTC24) {
    const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
          <div>
            <h3 className="font-extrabold text-white text-md flex items-center gap-2 font-display">
              <Trophy className="w-4.5 h-4.5 text-[#d4fc34]" /> Tablas por Zonas: <span className="text-[#d4fc34]">Formato Oficial SRTC 24</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Cada zona cuenta con 3 parejas disputando el formato todos contra todos. Avanzan los 2 mejores de cada zona.
            </p>
          </div>
          <div className="flex gap-3 text-xs bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-850 font-mono text-slate-400">
            <span>Zonas Totales: <strong className="text-white">8</strong></span>
            <span className="text-slate-700">|</span>
            <span>Parejas Inscriptas: <strong className="text-[#d4fc34]">24</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {letters.map(letter => {
            const groupMatches = matches.filter(m => m.category === selectedCategory && m.stageName === `Grupo ${letter}`);
            const groupPairIds = new Set<string>();
            groupMatches.forEach(gm => {
              if (gm.pair1Id) groupPairIds.add(gm.pair1Id);
              if (gm.pair2Id) groupPairIds.add(gm.pair2Id);
            });
            const groupPairs = categoryPairs.filter(p => groupPairIds.has(p.id));
            const stands = calculateGroupStandings(groupPairs, groupMatches, getPairName, true);

            return (
              <div key={letter} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl animate-fade-in">
                <div className="bg-slate-950 px-4 py-3 border-b border-slate-800/80 flex items-center justify-between">
                  <span className="font-extrabold text-[#d4fc34] text-xs font-mono uppercase tracking-widest flex items-center gap-1.5 leading-none">
                    <Award className="w-3.5 h-3.5 text-[#d4fc34]" /> ZONA GRUPO {letter}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono font-bold uppercase leading-none">Oficial</span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-[#0b0f19] text-slate-400 border-b border-slate-800/60 font-mono text-[8px] uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3 text-center w-8">Pos</th>
                        <th className="py-2.5 px-3">Pareja</th>
                        <th className="py-2.5 px-2 text-center">PJ</th>
                        <th className="py-2.5 px-2 text-center">PG</th>
                        <th className="py-2.5 px-2 text-center font-mono">Sets (W/L)</th>
                        <th className="py-2.5 px-2 text-center">DS</th>
                        <th className="py-2.5 px-2 text-center font-mono">Games (W/L)</th>
                        <th className="py-2.5 px-2 text-center">DG</th>
                        <th className="py-2.5 px-4 text-right pr-5">PTS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 font-medium text-slate-300">
                      {stands.map((row, idx) => {
                        const isQualified = idx < 2;
                        return (
                          <tr key={row.pairId} className={`hover:bg-slate-950/20 transition-colors ${isQualified ? "text-slate-100" : "text-slate-500 opacity-60"}`}>
                            <td className="py-3 px-3 text-center font-bold font-mono text-slate-400">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-3 font-bold truncate max-w-[120px]">
                              <div className="flex items-center gap-1">
                                <span className="truncate">{row.pairName}</span>
                                {isQualified && <span className="text-[#d4fc34] text-[9.5px]" title="Clasifica">✔</span>}
                              </div>
                            </td>
                            <td className="py-3 px-2 text-center font-mono">{row.pj}</td>
                            <td className="py-3 px-2 text-center font-mono text-green-400">{row.pg}</td>
                            <td className="py-3 px-2 text-center font-mono text-slate-500">
                              {row.setsWon}-{row.setsLost}
                            </td>
                            <td className={`py-3 px-2 text-center font-mono font-extrabold ${row.setsDiff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {row.setsDiff > 0 ? `+${row.setsDiff}` : row.setsDiff}
                            </td>
                            <td className="py-3 px-2 text-center font-mono text-slate-500">
                              {row.gamesWon}-{row.gamesLost}
                            </td>
                            <td className={`py-3 px-2 text-center font-mono ${row.gamesDiff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {row.gamesDiff > 0 ? `+${row.gamesDiff}` : row.gamesDiff}
                            </td>
                            <td className="py-3 px-4 text-right pr-5 font-black text-amber-400 font-mono text-sm">
                              {row.points}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const table = calculateDosVidasStandings(categoryPairs, matches, getPairName);

  return (
    <div className="space-y-8">
      {/* SECCIÓN: TABLAS POR ETAPA EN DETALLE */}
      <div className="space-y-6 animate-fade-in">
        <div>
          <h4 className="font-extrabold text-sm text-[#d4fc34] flex items-center gap-1.5 uppercase tracking-wider font-mono">
            <BarChart2 className="w-4 h-4 text-[#d4fc34]" /> Tablas de Posiciones por Etapas
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Estadísticas en formato de tabla de rendimiento para cada fase disputada del torneo.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {(() => {
            const isSRTC16 = categoryPairs.length === 16;
            const isSRTC32 = categoryPairs.length === 32;
            const categoryMatches = matches.filter(m => m.category === selectedCategory);

            // Define stages to show
            const stagesToRender: { title: string; matches: Match[] }[] = [];

            if (isSRTC16) {
              stagesToRender.push({
                title: "Ronda 1",
                matches: categoryMatches.filter(m => m.roundNumber === 1 || m.stageName.toLowerCase().includes("ronda 1"))
              });
              stagesToRender.push({
                title: "Ronda 2",
                matches: categoryMatches.filter(m => m.roundNumber === 2 || m.stageName.toLowerCase().includes("ronda 2"))
              });
              stagesToRender.push({
                title: "Cuartos de Final",
                matches: categoryMatches.filter(m => m.roundNumber === 3 || m.stageName.toLowerCase().includes("cuartos") || m.stageName.toLowerCase().includes("4tos"))
              });
              stagesToRender.push({
                title: "Semifinales",
                matches: categoryMatches.filter(m => m.roundNumber === 4 || m.stageName.toLowerCase().includes("semifinal"))
              });
              stagesToRender.push({
                title: "Final",
                matches: categoryMatches.filter(m => m.roundNumber === 5 || m.stageName.toLowerCase() === "final")
              });
            } else if (isSRTC32) {
              stagesToRender.push({
                title: "Ronda 1",
                matches: categoryMatches.filter(m => m.roundNumber === 1 || m.stageName.toLowerCase().includes("ronda 1"))
              });
              stagesToRender.push({
                title: "Ronda 2",
                matches: categoryMatches.filter(m => m.roundNumber === 2 || m.stageName.toLowerCase().includes("ronda 2"))
              });
              stagesToRender.push({
                title: "Octavos de Final",
                matches: categoryMatches.filter(m => m.roundNumber === 3 || m.stageName.toLowerCase().includes("octavos") || m.stageName.toLowerCase().includes("8avos"))
              });
              stagesToRender.push({
                title: "Cuartos de Final",
                matches: categoryMatches.filter(m => m.roundNumber === 4 || m.stageName.toLowerCase().includes("cuartos") || m.stageName.toLowerCase().includes("4tos"))
              });
              stagesToRender.push({
                title: "Semifinales",
                matches: categoryMatches.filter(m => m.roundNumber === 5 || m.stageName.toLowerCase().includes("semifinal"))
              });
              stagesToRender.push({
                title: "Final",
                matches: categoryMatches.filter(m => m.roundNumber === 6 || m.stageName.toLowerCase() === "final")
              });
            } else {
              // Standard or default formats: extract unique stageNames from matches
              const stageNames: string[] = Array.from(new Set(categoryMatches.map(m => m.stageName)));
              stageNames.forEach(name => {
                stagesToRender.push({
                  title: name,
                  matches: categoryMatches.filter(m => m.stageName === name)
                });
              });
            }

            return stagesToRender.map(stage => {
              const title = stage.title;
              const stageMatches = stage.matches;
              
              // Get unique pair IDs who played or are set to play in this stage
              const pairIds = new Set<string>();
              stageMatches.forEach(m => {
                if (m.pair1Id && m.pair1Id !== "BYE") pairIds.add(m.pair1Id);
                if (m.pair2Id && m.pair2Id !== "BYE") pairIds.add(m.pair2Id);
              });

              // Exclude BYEs
              const stagePairs = categoryPairs.filter(p => pairIds.has(p.id));
              const stands = calculateGroupStandings(stagePairs, stageMatches, getPairName, false);

              return (
                <div key={title} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl animate-fade-in">
                  <div className="bg-slate-950 px-4 py-3 border-b border-slate-800/80 flex items-center justify-between">
                    <span className="font-extrabold text-[#d4fc34] text-xs font-mono uppercase tracking-widest flex items-center gap-1.5 leading-none">
                      <Award className="w-3.5 h-3.5 text-[#d4fc34]" /> ETAPA: {title.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono font-bold uppercase leading-none">
                      {stageMatches.filter(m => m.status !== "pending").length} / {stageMatches.length} Jugados
                    </span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-[#0b0f19] text-slate-400 border-b border-slate-800/60 font-mono text-[8px] uppercase tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3 text-center w-8">Pos</th>
                          <th className="py-2.5 px-3">Pareja</th>
                          <th className="py-2.5 px-2 text-center">PJ</th>
                          <th className="py-2.5 px-2 text-center">PG</th>
                          <th className="py-2.5 px-2 text-center">PP</th>
                          <th className="py-2.5 px-2 text-center font-mono">Sets (W/L)</th>
                          <th className="py-2.5 px-2 text-center">DS</th>
                          <th className="py-2.5 px-2 text-center font-mono">Games (W/L)</th>
                          <th className="py-2.5 px-2 text-center">DG</th>
                          <th className="py-2.5 px-4 text-right pr-5">PTS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40 font-medium text-slate-300">
                        {stands.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="py-6 text-center text-slate-500 italic text-[11px]">
                              Sin partidos disputados en esta etapa
                            </td>
                          </tr>
                        ) : (
                          stands.map((row, idx) => {
                            return (
                              <tr key={row.pairId} className="hover:bg-slate-950/20 transition-colors">
                                <td className="py-3 px-3 text-center font-bold font-mono text-slate-400">
                                  {idx + 1}
                                </td>
                                <td className="py-3 px-3 font-bold truncate max-w-[120px] text-slate-100">
                                  {row.pairName}
                                </td>
                                <td className="py-3 px-2 text-center font-mono">{row.pj}</td>
                                <td className="py-3 px-2 text-center font-mono text-green-400">{row.pg}</td>
                                <td className="py-3 px-2 text-center font-mono text-slate-500">{row.pp}</td>
                                <td className="py-3 px-2 text-center font-mono text-slate-500">
                                  {row.setsWon}-{row.setsLost}
                                </td>
                                <td className={`py-3 px-2 text-center font-mono font-extrabold ${row.setsDiff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {row.setsDiff > 0 ? `+${row.setsDiff}` : row.setsDiff}
                                </td>
                                <td className="py-3 px-2 text-center font-mono text-slate-500">
                                  {row.gamesWon}-{row.gamesLost}
                                </td>
                                <td className={`py-3 px-2 text-center font-mono ${row.gamesDiff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                  {row.gamesDiff > 0 ? `+${row.gamesDiff}` : row.gamesDiff}
                                </td>
                                <td className="py-3 px-4 text-right pr-5 font-black text-[#d4fc34] font-mono text-sm">
                                  {row.points}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* TABLA UNIFICADA */}
      <div className="border-t border-slate-800/80 pt-8 space-y-6 animate-fade-in">
        {(() => {
          const isSRTC16 = categoryPairs.length === 16;
          const isSRTC32 = categoryPairs.length === 32;
          let formatTitle = "Sistema Dos Vidas SRTC";
          if (isSRTC16) formatTitle = "Formato Oficial SRTC 16";
          else if (isSRTC32) formatTitle = "Formato Oficial SRTC 32";

          let formatDesc = "Cada pareja cuenta con 2 vidas. Perder 2 veces significa quedar eliminada de la competencia.";
          if (isSRTC16) formatDesc = "Garantiza que todas las parejas jueguen al menos 2 partidos. Los ganadores de Ronda 2 avanzan a Cuartos de final.";
          else if (isSRTC32) formatDesc = "Garantiza que todas las parejas jueguen al menos 2 partidos. Los ganadores de Ronda 2 avanzan a Octavos de Final.";

          return (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <div>
                <h3 className="font-extrabold text-white text-md flex items-center gap-2">
                  <Trophy className="w-4.5 h-4.5 text-[#d4fc34]" /> Tabla Unificada: <span className="text-[#d4fc34]">{formatTitle}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {formatDesc}
                </p>
              </div>
              <div className="flex gap-3 text-xs bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-850 font-mono text-slate-400">
                <span>Parejas Inscriptas: <strong className="text-white">{categoryPairs.length}</strong></span>
                <span className="text-slate-700">|</span>
                <span>Parejas Activas: <strong className="text-[#d4fc34]">{table.filter(t => !t.eliminated).length}</strong></span>
              </div>
            </div>
          );
        })()}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono text-[9px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 text-center w-12">Pos</th>
                  <th className="py-3 px-4">Pareja Competidora</th>
                  <th className="py-3 px-4 text-center">Vidas Restantes</th>
                  <th className="py-3 px-4 text-center">PJ</th>
                  <th className="py-3 px-4 text-center">PG</th>
                  <th className="py-3 px-4 text-center">PP</th>
                  <th className="py-3 px-4 text-center">Sets (W/L)</th>
                  <th className="py-3 px-4 text-center">Dif Sets</th>
                  <th className="py-3 px-4 text-center">Games (W/L)</th>
                  <th className="py-3 px-4 text-center">Dif Games</th>
                  <th className="py-3 px-4 text-right pr-6">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 font-medium">
                {table.map((row, index) => {
                  let livesLabel = "🖤🖤";
                  if (row.lives === 2) livesLabel = "❤️❤️";
                  else if (row.lives === 1) livesLabel = "❤️🖤";

                  return (
                    <tr key={row.pairId} className={`hover:bg-slate-950/20 transition ${row.eliminated ? 'opacity-50 line-through text-slate-500' : 'text-slate-300'}`}>
                      <td className="py-3.5 px-4 text-center font-bold font-mono text-slate-400">
                        {index + 1}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-100 text-sm">
                        {row.pairName}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-md tracking-widest text-red-500 font-mono">
                        {livesLabel}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono">{row.pj}</td>
                      <td className="py-3.5 px-4 text-center font-mono text-green-400">{row.pg}</td>
                      <td className="py-3.5 px-4 text-center font-mono text-rose-500">{row.pp}</td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-500 font-mono">
                        {row.setsWon} - {row.setsLost}
                      </td>
                      <td className={`py-3.5 px-4 text-center font-mono font-bold ${row.setsDiff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {row.setsDiff > 0 ? `+${row.setsDiff}` : row.setsDiff}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                        {row.gamesWon} - {row.gamesLost}
                      </td>
                      <td className={`py-3.5 px-4 text-center font-mono ${row.gamesDiff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {row.gamesDiff > 0 ? `+${row.gamesDiff}` : row.gamesDiff}
                      </td>
                      <td className="py-3.5 px-4 text-right pr-6">
                        {row.eliminated ? (
                          <span className="text-[9px] font-bold bg-slate-950 text-slate-500 px-2 py-1 rounded-full uppercase border border-slate-900">
                            Eliminado
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-450 px-2 py-1 rounded-full uppercase border border-emerald-500/10">
                            Activa ({row.lives} V)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ADMIN CONTROL TERMINAL FOR PROGRESSION */}
      {userRole === "admin" && (() => {
        const isSRTC16 = categoryPairs.length === 16;
        if (isSRTC16) {
          return (
            <div className="bg-slate-950 border border-indigo-500/30 rounded-2xl p-6 shadow-xl space-y-4">
              <h4 className="font-extrabold text-sm text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Shield className="w-4 h-4 text-indigo-400" /> Sistema Oficial SRTC 16 Activo
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Esta categoría está jugando el formato oficial **SRTC 16** de 16 parejas. El fixture completo ya se encuentra pre-generado. 
                Las parejas derrotadas en **Ronda 1** juegan en la ronda de repechaje (**Ronda 2 - Partidos 10, 11, 13, 15**), mientras que los ganadores de Ronda 1 juegan sus respectivos partidos de ganadores (**Ronda 2 - Partidos 9, 12, 14, 16**).
              </p>
              <div className="p-3 bg-indigo-500/10 border border-indigo-550/20 text-indigo-300 text-xs rounded-xl font-medium leading-relaxed font-sans">
                Los ganadores de los partidos de Ronda 2 avanzan automáticamente a los **Cuartos de Final**. La progresión de llaves es completamente automática al registrar de forma manual o automática los marcadores de cada partido. No requieres realizar sorteos adicionales.
              </div>
            </div>
          );
        }

        return (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="border-b border-slate-850 pb-3">
              <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5 uppercase tracking-wider text-[#d4fc34]">
                <Settings className="w-4 h-4 text-[#d4fc34]" /> Panel de Gestión de Rondas y Playoffs
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Como organizador oficial de SRTC, tienes el control de las transiciones de rondas del torneo.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Box 1: Generate next round */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <h5 className="font-extrabold text-xs text-white uppercase tracking-wider">Avanzar Siguiente Ronda</h5>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Crea automáticamente los nuevos emparejamientos utilizando el algoritmo suizo de Dos Vidas. Cruzará parejas con similar historial de triunfos que no hayan jugado previamente en el torneo para mayor equidad.
                  </p>
                </div>
                <button
                  onClick={handleGenerateNextRound}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer border border-slate-700 w-full"
                >
                  Generar Siguiente Ronda Dos Vidas
                </button>
              </div>

              {/* Box 2: Close and start Playoffs */}
              <div className="bg-slate-900/40 border border-dashed border-slate-800 p-5 rounded-xl flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <h5 className="font-extrabold text-xs text-amber-500 uppercase tracking-wider">Lanzar Playoffs (Cuadro Final)</h5>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Cierra definitivamente la etapa preliminaria. Avanza a las mejores parejas ordenadas por victorias y sets al cuadro final de eliminación directa (Octavos, Cuartos o Semifinal según el volumen de inscriptos).
                  </p>
                </div>
                {!matches.some(m => m.category === selectedCategory && m.phase === "playoff") ? (
                  <button
                    onClick={handleLaunchPlayoffs}
                    className="bg-[#d4fc34] hover:bg-[#c5f015] text-slate-950 transition-colors py-2.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider cursor-pointer shadow-md w-full"
                  >
                    Finalizar y Generar Cuadro de Eliminatorias
                  </button>
                ) : (
                  <div className="text-center py-2 px-3 bg-indigo-500/10 border border-indigo-500/15 rounded-xl text-indigo-400 font-bold text-[10px] uppercase">
                    Playoffs Activos
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
