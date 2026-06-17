import React from 'react';

export const SkeletonCard = () => (
  <div className="bg-slate-900 border border-slate-800/50 rounded-2xl p-5 space-y-3 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-slate-800 rounded-xl" />
      <div className="space-y-1.5 flex-1">
        <div className="h-3 bg-slate-800 rounded w-2/3" />
        <div className="h-2 bg-slate-800/70 rounded w-1/2" />
      </div>
    </div>
    <div className="h-2 bg-slate-800/60 rounded w-full" />
    <div className="h-2 bg-slate-800/40 rounded w-4/5" />
    <div className="h-8 bg-slate-800/50 rounded-xl mt-2" />
  </div>
);
