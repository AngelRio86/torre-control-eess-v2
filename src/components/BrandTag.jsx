import { getBrand } from '../lib/brands';

export default function BrandTag({ marca, size = 'sm' }) {
  const b = getBrand(marca);
  const sizes = {
    sm: { padding: '2px 8px', fontSize: '10px' },
    md: { padding: '3px 10px', fontSize: '11px' },
  };
  const s = sizes[size] || sizes.sm;
  return (
    <span
      style={{
        ...s,
        display: 'inline-block',
        borderRadius: '20px',
        background: b.bg_soft,
        color: b.hex,
        border: `1px solid ${b.hex}30`,
        fontFamily: 'JetBrains Mono, monospace',
        fontWeight: 500,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      {marca}
    </span>
  );
}
