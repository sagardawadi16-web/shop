import React from 'react';

interface Props {
  size?: number;
  className?: string;
}

export const DawostiLogo: React.FC<Props> = ({ size = 40, className = '' }) => (
  <div className={className} style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, whiteSpace: 'nowrap', userSelect: 'none' }}>
    <img src="/logo.png" alt="Dawosti" width={size} height={size} style={{ borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
    <div>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: Math.max(16, size * 0.55), color: '#2B1810', letterSpacing: '0.08em', lineHeight: 1 }}>
        DAWOSTI
      </div>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: Math.max(9, size * 0.28), color: '#8B3A3A', letterSpacing: '0.15em', textTransform: 'uppercase', lineHeight: 1, marginTop: 2 }}>
        Boutique
      </div>
    </div>
  </div>
);
