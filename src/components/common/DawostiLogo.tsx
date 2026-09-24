import React from 'react';

interface Props {
  size?: number;
  className?: string;
}

export const DawostiLogo: React.FC<Props> = ({ size = 40, className = '' }) => (
  <div className={className} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <img src="/logo.png" alt="Dawosti" width={size} height={size} style={{ borderRadius: 8, objectFit: 'cover' }} />
    <div>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: size * 0.55, color: '#2B1810', letterSpacing: '0.08em', lineHeight: 1 }}>
        DAWOSTI
      </div>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: size * 0.28, color: '#8B3A3A', letterSpacing: '0.15em', textTransform: 'uppercase', lineHeight: 1, marginTop: 2 }}>
        Boutique
      </div>
    </div>
  </div>
);
