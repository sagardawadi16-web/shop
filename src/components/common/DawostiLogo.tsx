import React from 'react';

interface Props {
  size?: number;
  className?: string;
  centered?: boolean;
  stacked?: boolean;
}

export const DawostiLogo: React.FC<Props> = ({
  size = 40,
  className = '',
  centered = false,
  stacked = false,
}) => (
  <div
    className={className}
    style={{
      display: 'flex',
      flexDirection: stacked ? 'column' : 'row',
      alignItems: 'center',
      justifyContent: centered ? 'center' : 'flex-start',
      gap: stacked ? 4 : 10,
      flexShrink: 0,
      whiteSpace: 'nowrap',
      userSelect: 'none',
      background: 'transparent',
    }}
  >
    <img
      src="/logo.png"
      alt="Dawosti"
      width={size}
      height={size}
      style={{
        objectFit: 'contain',
        flexShrink: 0,
        background: 'transparent',
        filter: 'drop-shadow(0 2px 5px rgba(138, 28, 46, 0.15))',
      }}
    />
    <div style={{ textAlign: centered || stacked ? 'center' : 'left' }}>
      <div
        className="dawosti-brand-title"
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontWeight: 700,
          fontSize: Math.max(17, size * 0.52),
          color: '#2B1810',
          letterSpacing: '0.12em',
          lineHeight: 1,
        }}
      >
        DAWOSTI
      </div>
      <div
        className="dawosti-brand-subtitle"
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: Math.max(9, size * 0.25),
          color: '#8A1C2E',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          fontWeight: 600,
          lineHeight: 1,
          marginTop: 2,
        }}
      >
        Boutique
      </div>
    </div>
  </div>
);
