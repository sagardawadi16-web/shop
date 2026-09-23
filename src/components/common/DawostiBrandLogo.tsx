import React from 'react';

interface DawostiBrandLogoProps {
  variant?: 'full' | 'mark' | 'compact' | 'white';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const DawostiBrandLogo: React.FC<DawostiBrandLogoProps> = ({
  variant = 'full',
  className = '',
  size = 'md',
}) => {
  // Height configurations tailored for the official boutique logo aspect ratio
  const sizeClasses = {
    sm: { mark: 'h-8 w-auto', text: 'text-sm', sub: 'text-[8px]' },
    md: { mark: 'h-10 sm:h-11 w-auto', text: 'text-base sm:text-lg', sub: 'text-[9px]' },
    lg: { mark: 'h-14 w-auto', text: 'text-xl', sub: 'text-[10px]' },
    xl: { mark: 'h-20 w-auto', text: 'text-2xl', sub: 'text-xs' },
  }[size];

  const dotColor = variant === 'white' ? '#F6C358' : '#C76A32';
  const textColor = variant === 'white' ? 'text-white' : 'text-[#651722]';
  const subColor = variant === 'white' ? 'text-white/80' : 'text-[#2B1810]';

  // The official Dawosti boutique monogram emblem:
  const LogoMark = (
    <img
      src="/logo.png"
      alt="Dawosti Logo"
      className={`${sizeClasses.mark} object-contain shrink-0 mix-blend-multiply transition-transform duration-300 drop-shadow-2xs`}
      loading="eager"
    />
  );

  if (variant === 'mark') {
    return <div className={`inline-flex items-center ${className}`}>{LogoMark}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 ${className}`}>
      {LogoMark}

      <div className="flex flex-col justify-center select-none">
        <div className="flex items-center gap-1.5 leading-none">
          <span
            className={`font-serif-luxury font-bold tracking-[0.2em] ${textColor} ${sizeClasses.text}`}
          >
            DAWOSTI
          </span>
          <span
            className="w-2 h-2 rounded-full inline-block shrink-0 shadow-xs"
            style={{ backgroundColor: dotColor }}
          />
        </div>
        <span
          className={`font-sans uppercase font-medium tracking-[0.24em] ${subColor} ${sizeClasses.sub} mt-1`}
        >
          Clothing & Textiles
        </span>
      </div>
    </div>
  );
};
