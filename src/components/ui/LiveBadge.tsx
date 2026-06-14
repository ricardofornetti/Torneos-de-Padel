import React from 'react';
import { Play, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

interface LiveBadgeProps {
  status: "pending" | "completed" | "wo" | "abandoned" | "live";
  text?: string;
  className?: string;
}

export const LiveBadge: React.FC<LiveBadgeProps> = ({ status, text, className = "" }) => {
  switch (status) {
    case "live":
      return (
        <span className={`inline-flex items-center gap-1.5 bg-[#d4fc34]/15 border border-[#d4fc34]/30 px-2 py-0.5 rounded-full text-[9px] font-mono font-black text-[#d4fc34] uppercase tracking-wider ${className}`}>
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#d4fc34] opacity-75 animate-live-ping"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#d4fc34] animate-live-pulse"></span>
          </span>
          <span>{text || "EN CURSO"}</span>
        </span>
      );
    case "completed":
      return (
        <span className={`inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-wider ${className}`}>
          <CheckCircle2 className="w-2.5 h-2.5" />
          <span>{text || "FINALIZADO"}</span>
        </span>
      );
    case "wo":
      return (
        <span className={`inline-flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold text-yellow-400 uppercase tracking-wider ${className}`}>
          <AlertTriangle className="w-2.5 h-2.5" />
          <span>{text || "W.O. EN COLA"}</span>
        </span>
      );
    case "abandoned":
      return (
        <span className={`inline-flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold text-rose-400 uppercase tracking-wider ${className}`}>
          <AlertTriangle className="w-2.5 h-2.5" />
          <span>{text || "ABANDONO"}</span>
        </span>
      );
    case "pending":
    default:
      return (
        <span className={`inline-flex items-center gap-1 bg-slate-800/80 border border-slate-700/50 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold text-slate-350 uppercase tracking-wider ${className}`}>
          <Clock className="w-2.5 h-2.5 text-slate-450" />
          <span>{text || "PROGRAMADO"}</span>
        </span>
      );
  }
};
