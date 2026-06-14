import React from 'react';

interface PageHeaderButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  icon?: React.ReactNode;
}

export const PageHeaderButton: React.FC<PageHeaderButtonProps> = ({
  variant = "secondary",
  icon,
  children,
  className = "",
  ...props
}) => {
  const baseClasses = "text-[10px] sm:text-xs font-black px-4 py-2.5 rounded-xl uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer disabled:opacity-50 select-none whitespace-nowrap shrink-0 border";
  
  const variantClasses = {
    primary: "bg-[#d4fc34]/15 hover:bg-[#d4fc34] hover:text-slate-950 text-[#d4fc34] border-[#d4fc34]/20 hover:border-[#d4fc34]",
    secondary: "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700",
    danger: "bg-red-950/20 hover:bg-red-900 border-red-900/40 hover:border-red-600 text-red-400"
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
};

interface PageHeaderBannerProps {
  onBack?: () => void;
  icon: React.ReactNode;          // el SVG del sticker (20x20 o similar)
  cornerBadge: string;            // texto corto: "TOUR", "RANK", "COURT", "PLAYER", "LIVE"
  eyebrow: string;                // "Professional Circuit", "Official Venue", etc.
  eyebrowColor?: "blue" | "amber" | "emerald" | "cyan" | "indigo";
  title: string;
  description: string;
  actions?: React.ReactNode;      // botones de la derecha
  gridPatternId: string;          // para que cada SVG de fondo tenga id único
}

export const PageHeaderBanner: React.FC<PageHeaderBannerProps> = ({
  onBack,
  icon,
  cornerBadge,
  eyebrow,
  eyebrowColor = "blue",
  title,
  description,
  actions,
  gridPatternId
}) => {
  const colorMap = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
  };

  const eyebrowClasses = `border ${colorMap[eyebrowColor]} px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest font-mono`;

  return (
    <div className="w-full bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-[size:16px_16px] opacity-10 pointer-events-none"></div>
      <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-[0.03] pointer-events-none">
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id={gridPatternId} width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${gridPatternId})`} />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 w-full">
        {/* Title Section with Sticker and Back button */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 w-full md:w-auto">
          {onBack && (
            <button
              onClick={onBack}
              className="group flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#d4fc34] hover:text-slate-950 hover:bg-[#d4fc34] transition-all cursor-pointer bg-slate-900/60 border border-slate-800 hover:border-slate-700 px-4 py-2.5 rounded-xl self-start sm:self-auto shrink-0"
            >
              <span className="transition-transform group-hover:-translate-x-1">←</span>
              <span>Volver</span>
            </button>
          )}

          <div className="flex items-center gap-5 overflow-hidden">
            {/* Standardized Sticker Wrapper with flex cornerBadge */}
            <div className="relative shrink-0 select-none">
              <div className="w-20 h-20 bg-[#d4fc34]/10 rounded-2xl border border-[#d4fc34]/30 flex items-center justify-center p-2 shadow-inner group overflow-hidden">
                <div className="absolute inset-0 bg-[#d4fc34]/5 rounded-2xl animate-pulse pointer-events-none"></div>
                {icon}
              </div>
              <span className="absolute -top-1.5 -right-1.5 bg-[#d4fc34] text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full shadow border border-slate-950 uppercase tracking-widest leading-none font-sans whitespace-nowrap w-fit z-20">
                {cornerBadge}
              </span>
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={eyebrowClasses}>
                  {eyebrow}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-wider text-white truncate">
                {title}
              </h1>
              <p className="text-xs text-slate-400">
                {description}
              </p>
            </div>
          </div>
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2 md:gap-3 shrink-0 relative z-20">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
