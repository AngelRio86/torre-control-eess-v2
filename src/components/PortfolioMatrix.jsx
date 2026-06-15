import { strategicScore, scoreColor } from '../lib/scoring';
import { recommendPathway } from '../lib/transformation';

// ─────────────────────────────────────────────────────────────────────────────
// Matriz 2x2:
//   Eje X: Fortaleza del Activo (score C4)
//   Eje Y: Atractivo del Mercado (combinación de score C2 + C5)
// Cuadrantes:
//   ↗ Star (alta demanda, activo fuerte)              → potenciar
//   ↘ Underutilized (alta demanda, activo débil)       → modernizar / EV
//   ↖ Niche (baja demanda, activo fuerte)              → conveniencia
//   ↙ Question (baja demanda, activo débil)            → reposicionar / divest
// ─────────────────────────────────────────────────────────────────────────────

const QUADRANTS = {
  TR: { label: 'Star',          subtitle: 'Potenciar y proteger',  color: 'var(--green)' },
  BR: { label: 'Underutilized', subtitle: 'Modernizar / EV Hub',   color: 'var(--blue)' },
  TL: { label: 'Niche',         subtitle: 'Conveniencia',          color: '#7c3aed' },
  BL: { label: 'Question',      subtitle: 'Reposicionar / Divest', color: 'var(--accent)' },
};

function avg(...nums) {
  const v = nums.filter(n => n != null);
  return v.length === 0 ? null : v.reduce((s, x) => s + x, 0) / v.length;
}

export default function PortfolioMatrix({ stations, onSelect }) {
  // Solo Petronor
  const petronor = stations.filter(s => s.tipo === 'petronor');

  // Calcular score y posición para cada una
  const points = petronor.map(s => {
    const score = strategicScore(s);
    const path = recommendPathway(s);
    return {
      station: s,
      x: score.dimensions.activo.score,        // fortaleza activo
      y: avg(score.dimensions.demanda.score,    // atractivo mercado = demanda+movilidad
             score.dimensions.movilidad.score),
      score: score.score,
      pathway: path.primary.pathway,
    };
  });

  // SVG con padding para etiquetas de ejes
  const W = 560;
  const H = 460;
  const padL = 70, padR = 28, padT = 30, padB = 60;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const xScale = v => padL + (v / 100) * plotW;
  const yScale = v => padT + (1 - v / 100) * plotH;

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '20px',
    }}>
      <div style={{
        fontSize: '10px',
        fontFamily: 'JetBrains Mono, monospace',
        color: 'var(--text-dim)',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        marginBottom: '4px',
      }}>
        Matriz de Portafolio
      </div>
      <h3 style={{
        fontFamily: 'DM Serif Display, serif',
        fontSize: '20px',
        color: 'var(--text-head)',
        marginBottom: '4px',
        lineHeight: 1.1,
      }}>
        Atractivo de mercado × Fortaleza del activo
      </h3>
      <p style={{ fontSize: '12px', color: 'var(--text-sub)', marginBottom: '16px' }}>
        Cada estación se posiciona según el score de su mercado (demanda + movilidad) y la fortaleza
        de su activo físico. Los cuadrantes definen pathways arquetípicas.
      </p>

      <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', margin: '0 auto' }}>
        {/* Cuadrantes coloreados muy suaves */}
        <rect x={padL} y={padT} width={plotW/2} height={plotH/2}
              fill="rgba(124,58,237,0.03)" />
        <rect x={padL + plotW/2} y={padT} width={plotW/2} height={plotH/2}
              fill="rgba(5,150,105,0.04)" />
        <rect x={padL} y={padT + plotH/2} width={plotW/2} height={plotH/2}
              fill="rgba(192,0,26,0.04)" />
        <rect x={padL + plotW/2} y={padT + plotH/2} width={plotW/2} height={plotH/2}
              fill="rgba(37,99,235,0.04)" />

        {/* Líneas divisorias del cuadrante */}
        <line x1={padL + plotW/2} y1={padT} x2={padL + plotW/2} y2={padT + plotH}
              stroke="var(--border)" strokeDasharray="4 4" />
        <line x1={padL} y1={padT + plotH/2} x2={padL + plotW} y2={padT + plotH/2}
              stroke="var(--border)" strokeDasharray="4 4" />

        {/* Frames externos */}
        <rect x={padL} y={padT} width={plotW} height={plotH}
              fill="none" stroke="var(--border)" />

        {/* Etiquetas de cuadrantes */}
        <text x={padL + 12} y={padT + 20}
              style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', fill: QUADRANTS.TL.color, fontWeight: 600 }}>
          NICHE
        </text>
        <text x={padL + 12} y={padT + 34}
              style={{ fontSize: '10px', fill: 'var(--text-sub)' }}>
          {QUADRANTS.TL.subtitle}
        </text>

        <text x={padL + plotW - 12} y={padT + 20} textAnchor="end"
              style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', fill: QUADRANTS.TR.color, fontWeight: 600 }}>
          STAR
        </text>
        <text x={padL + plotW - 12} y={padT + 34} textAnchor="end"
              style={{ fontSize: '10px', fill: 'var(--text-sub)' }}>
          {QUADRANTS.TR.subtitle}
        </text>

        <text x={padL + 12} y={padT + plotH - 22}
              style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', fill: QUADRANTS.BL.color, fontWeight: 600 }}>
          QUESTION
        </text>
        <text x={padL + 12} y={padT + plotH - 8}
              style={{ fontSize: '10px', fill: 'var(--text-sub)' }}>
          {QUADRANTS.BL.subtitle}
        </text>

        <text x={padL + plotW - 12} y={padT + plotH - 22} textAnchor="end"
              style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', fill: QUADRANTS.BR.color, fontWeight: 600 }}>
          UNDERUTILIZED
        </text>
        <text x={padL + plotW - 12} y={padT + plotH - 8} textAnchor="end"
              style={{ fontSize: '10px', fill: 'var(--text-sub)' }}>
          {QUADRANTS.BR.subtitle}
        </text>

        {/* Ejes y ticks */}
        {[0, 25, 50, 75, 100].map(t => (
          <g key={`xt-${t}`}>
            <line x1={xScale(t)} y1={padT + plotH} x2={xScale(t)} y2={padT + plotH + 4}
                  stroke="var(--text-dim)" />
            <text x={xScale(t)} y={padT + plotH + 16} textAnchor="middle"
                  style={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', fill: 'var(--text-dim)' }}>
              {t}
            </text>
          </g>
        ))}
        {[0, 25, 50, 75, 100].map(t => (
          <g key={`yt-${t}`}>
            <line x1={padL - 4} y1={yScale(t)} x2={padL} y2={yScale(t)}
                  stroke="var(--text-dim)" />
            <text x={padL - 8} y={yScale(t) + 3} textAnchor="end"
                  style={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', fill: 'var(--text-dim)' }}>
              {t}
            </text>
          </g>
        ))}

        {/* Etiqueta eje X */}
        <text x={padL + plotW/2} y={H - 12} textAnchor="middle"
              style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', fill: 'var(--text-sub)', letterSpacing: '0.05em' }}>
          FORTALEZA DEL ACTIVO  →
        </text>
        {/* Etiqueta eje Y rotada */}
        <text x={-(padT + plotH/2)} y={20} textAnchor="middle" transform="rotate(-90)"
              style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', fill: 'var(--text-sub)', letterSpacing: '0.05em' }}>
          ATRACTIVO DEL MERCADO  →
        </text>

        {/* Puntos */}
        {points.map((p, i) => {
          if (p.x == null || p.y == null) return null;
          const cx = xScale(p.x);
          const cy = yScale(p.y);
          const color = scoreColor(p.score);
          return (
            <g key={p.station.id} style={{ cursor: 'pointer' }}
               onClick={() => onSelect && onSelect(p.station.id)}>
              {/* halo */}
              <circle cx={cx} cy={cy} r={22} fill={color} opacity={0.12} />
              {/* main */}
              <circle cx={cx} cy={cy} r={11} fill={color} stroke="var(--surface)" strokeWidth={2.5}/>
              {/* score interno */}
              <text x={cx} y={cy + 3.5} textAnchor="middle"
                    style={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fill: 'white' }}>
                {p.score}
              </text>
              {/* etiqueta lateral */}
              <text x={cx + 16} y={cy - 2}
                    style={{ fontSize: '11px', fontFamily: 'DM Sans, sans-serif', fill: 'var(--text-head)', fontWeight: 600 }}>
                {p.station.id.replace('PET-', '').replace(/-\d{3}$/, m => m)}
              </text>
              <text x={cx + 16} y={cy + 11}
                    style={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', fill: 'var(--text-sub)' }}>
                {p.pathway.icon} {p.pathway.label}
              </text>
            </g>
          );
        })}
      </svg>
      </div>
    </div>
  );
}
