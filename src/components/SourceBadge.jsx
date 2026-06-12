import { FUENTES } from '../data/stations';

// Lookup por id para evitar buscar en cada render
const FUENTES_BY_ID = Object.fromEntries(
  Object.values(FUENTES).map(f => [f.id, f])
);

const STATE_STYLE = {
  real:          { color: '#059669', symbol: '●', label: 'Real' },
  estimado:      { color: '#D97706', symbol: '○', label: 'Estimado' },
  no_disponible: { color: '#9CA3AF', symbol: '—', label: 'No disponible' },
};

function fmtFecha(fechaIso) {
  if (!fechaIso) return null;
  try {
    return new Date(fechaIso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  } catch {
    return fechaIso;
  }
}

export default function SourceBadge({ kpi, compact = false }) {
  if (!kpi) return null;
  const state = STATE_STYLE[kpi.estado] || STATE_STYLE.no_disponible;
  const fuente = FUENTES_BY_ID[kpi.fuente];
  const fechaFmt = fmtFecha(kpi.fecha);
  const label = fuente?.label || state.label;

  if (compact) {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '9px',
        color: state.color,
        fontFamily: 'JetBrains Mono, monospace',
        whiteSpace: 'nowrap',
        marginTop: '2px',
      }}>
        <span>{state.symbol}</span>
        <span>{label}</span>
        {fechaFmt && <span style={{ color: 'var(--text-dim)' }}>· {fechaFmt}</span>}
      </span>
    );
  }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '9px',
      padding: '2px 6px',
      borderRadius: '4px',
      background: `${state.color}10`,
      border: `1px solid ${state.color}30`,
      color: state.color,
      fontFamily: 'JetBrains Mono, monospace',
    }}>
      <span>{state.symbol}</span>
      <span>{label}</span>
      {fechaFmt && <span style={{ opacity: 0.7 }}>· {fechaFmt}</span>}
    </span>
  );
}
