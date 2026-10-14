import React from 'react';

interface KoviraLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
  isLight?: boolean;
}

export const KoviraLogo: React.FC<KoviraLogoProps> = ({
  size = 'md',
  showSubtitle = false,
  className = '',
  isLight = true,
}) => {
  const iconSizes = {
    sm: { height: 32, width: 32, font: 'text-2xl', dot: 'w-2 h-2' },
    md: { height: 40, width: 40, font: 'text-3xl sm:text-[32px]', dot: 'w-2.5 h-2.5' },
    lg: { height: 48, width: 48, font: 'text-3xl sm:text-[38px] lg:text-[42px]', dot: 'w-3 h-3' },
  };

  const currentSize = iconSizes[size];

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {/* Modern Brand Typography - Clean Wordmark without K Icon */}
      <div className="flex flex-col leading-none">
        <div className="flex items-center tracking-tight">
          <span
            className={`font-black tracking-wider uppercase font-['Outfit',sans-serif] ${currentSize.font} ${
              isLight ? 'text-white' : 'text-slate-900'
            }`}
          >
            KOVIRA STORE
          </span>
          <span className={`ml-1.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50 ${currentSize.dot}`} />
        </div>
        {showSubtitle && (
          <span
            className={`text-[9.5px] sm:text-[10px] tracking-[0.22em] uppercase font-bold mt-1 ${
              isLight ? 'text-cyan-200/90' : 'text-slate-500'
            }`}
          >
            Curated Living Essentials
          </span>
        )}
      </div>
    </div>
  );
};
