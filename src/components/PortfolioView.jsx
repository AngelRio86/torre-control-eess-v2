import PortfolioMatrix from './PortfolioMatrix';
import { strategicScore, scoreColor, scoreLabel } from '../lib/scoring';
import { recommendPathway, PATHWAYS } from '../lib/transformation';
import { portfolioAlerts, SEVERITY_META, CATEGORY_META } from '../lib/alerts';

function KpiTile({ label, value, sub, accent }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '10px',
      padding: '16px 18px',
      flex: 1,
    }}>
      <div style={{
        fontSize: '10px',
        fontFamily: 'JetBrains Mono, monospace',
        color: 'var(--text-dim)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        marginBottom: '8px',
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'DM Serif Display, serif',
        fontSize: '32px',
        color: accent || 'var(--text-head)',
        lineHeight: 1,
        marginBottom: '4px',
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: '11px', color: 'var(--text-sub)' }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function PathwayDistribution({ stations }) {
  const dist = {};
  for (const s of stations) {
    if (s.tipo !== 'petronor') continue;
    const r = recommendPathway(s);
    const k = r.primary.pathway.key;
    if (!dist[k]) dist[k] = { count: 0, stations: [], pathway: r.primary.pathway };
    dist[k].count++;
    dist[k].stations.push(s);
  }

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
        Distribución de Pathways
      </div>
      <h3 style={{
        fontFamily: 'DM Serif Display, serif',
        fontSize: '18px',
        color: 'var(--text-head)',
        marginBottom: '14px',
      }}>
        Recomendación estratégica del portafolio
      </h3>
      <div className="flex flex-col gap-2">
        {Object.values(dist).sort((a, b) => b.count - a.count).map(({ pathway, count, stations: ss }) => (
          <div key={pathway.key} style={{
            padding: '10px 14px',
            background: 'var(--bg)',
            borderRadius: '8px',
            border: '1px solid var(--border)',
          }}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '20px' }}>{pathway.icon}</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-head)' }}>
                    {pathway.label}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-sub)' }}>
                    {pathway.short}
                  </div>
                </div>
              </div>
              <div style={{
                padding: '4px 10px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-head)',
                minWidth: '38px',
                textAlign: 'center',
              }}>
                {count}
              </div>
            </div>
            <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--text-sub)', fontFamily: 'JetBrains Mono, monospace' }}>
              {ss.map(s => s.id.replace('PET-', '')).join(' · ')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RankingTable({ stations, onSelect }) {
  const rows = stations
    .filter(s => s.tipo === 'petronor')
    .map(s => {
      const score = strategicScore(s);
      const path = recommendPathway(s);
      return { station: s, score, path };
    })
    .sort((a, b) => (b.score.score ?? -1) - (a.score.score ?? -1));

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
        Ranking
      </div>
      <h3 style={{
        fontFamily: 'DM Serif Display, serif',
        fontSize: '18px',
        color: 'var(--text-head)',
        marginBottom: '14px',
      }}>
        Estaciones por strategic score
      </h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th style={th}>#</th>
            <th style={th}>Estación</th>
            <th style={{ ...th, textAlign: 'right' }}>Score</th>
            <th style={th}>Estado</th>
            <th style={th}>Pathway</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.station.id}
                onClick={() => onSelect && onSelect(r.station.id)}
                style={{ borderBottom: '1px solid var(--border-soft)', cursor: 'pointer' }}>
              <td style={{ ...td, color: 'var(--text-dim)', fontFamily: 'JetBrains Mono, monospace' }}>
                {String(i + 1).padStart(2, '0')}
              </td>
              <td style={td}>
                <div style={{ fontWeight: 600, color: 'var(--text-head)' }}>
                  {r.station.id.replace('PET-', '')}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-sub)' }}>
                  {r.station.nombre}
                </div>
              </td>
              <td style={{ ...td, textAlign: 'right' }}>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '15px',
                  fontWeight: 700,
                  color: scoreColor(r.score.score),
                }}>
                  {r.score.score ?? '—'}
                </span>
              </td>
              <td style={{ ...td, color: scoreColor(r.score.score), fontWeight: 500 }}>
                {r.score.label}
              </td>
              <td style={td}>
                <span style={{ fontSize: '14px', marginRight: '4px' }}>{r.path.primary.pathway.icon}</span>
                {r.path.primary.pathway.label}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
const th = {
  textAlign: 'left',
  padding: '8px 10px',
  fontSize: '10px',
  fontFamily: 'JetBrains Mono, monospace',
  color: 'var(--text-dim)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};
const td = { padding: '12px 10px', verticalAlign: 'middle' };

function CriticalAlertsList({ stations, onSelect }) {
  const { byStation, totalHigh } = portfolioAlerts(stations.filter(s => s.tipo === 'petronor'));
  // Aplanar y filtrar críticas
  const flat = [];
  for (const [sid, alerts] of Object.entries(byStation)) {
    const station = stations.find(s => s.id === sid);
    for (const a of alerts.filter(x => x.severity === 'high')) {
      flat.push({ ...a, station });
    }
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '20px',
    }}>
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <div style={{
            fontSize: '10px',
            fontFamily: 'JetBrains Mono, monospace',
            color: 'var(--text-dim)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: '4px',
          }}>
            Alertas críticas
          </div>
          <h3 style={{
            fontFamily: 'DM Serif Display, serif',
            fontSize: '18px',
            color: 'var(--text-head)',
          }}>
            Atención inmediata
          </h3>
        </div>
        <span style={{
          padding: '4px 12px',
          background: 'var(--accent)',
          color: 'white',
          borderRadius: '4px',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '13px',
          fontWeight: 600,
        }}>
          {totalHigh}
        </span>
      </div>
      {flat.length === 0 ? (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: 'var(--text-sub)',
          fontSize: '12px',
        }}>
          No hay alertas críticas activas.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {flat.map((a, i) => {
            const cat = CATEGORY_META[a.category];
            return (
              <div key={i}
                   onClick={() => onSelect && onSelect(a.station.id)}
                   style={{
                     padding: '10px 14px',
                     borderLeft: '3px solid var(--accent)',
                     background: 'var(--accent-soft)',
                     borderRadius: '0 6px 6px 0',
                     cursor: 'pointer',
                   }}>
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: '13px' }}>{cat.icon}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-head)' }}>
                      {a.title}
                    </span>
                  </div>
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '10px',
                    color: 'var(--text-sub)',
                    whiteSpace: 'nowrap',
                  }}>
                    {a.station.id.replace('PET-', '')}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-base)', lineHeight: 1.45 }}>
                  {a.message}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function PortfolioView({ stations, onSelect }) {
  const petronor = stations.filter(s => s.tipo === 'petronor');
  const scores = petronor.map(s => strategicScore(s).score).filter(x => x != null);
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const minScore = scores.length ? Math.min(...scores) : null;
  const maxScore = scores.length ? Math.max(...scores) : null;
  const { totalHigh, totalMedium } = portfolioAlerts(petronor);

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'var(--bg)' }}>
      <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '28px 28px 48px' }}>

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            fontSize: '10px',
            fontFamily: 'JetBrains Mono, monospace',
            color: 'var(--text-dim)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: '6px',
          }}>
            Vista CEO
          </div>
          <h1 style={{
            fontFamily: 'DM Serif Display, serif',
            fontSize: '32px',
            color: 'var(--text-head)',
            lineHeight: 1.1,
            marginBottom: '6px',
          }}>
            Portafolio Petronor · Bilbao metropolitano
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-sub)', maxWidth: '720px' }}>
            Análisis estratégico de las {petronor.length} estaciones del portafolio sobre 5 dimensiones:
            demanda territorial, posición competitiva, fortaleza del activo, movilidad real y reputación.
          </p>
        </div>

        {/* KPI tiles */}
        <div className="flex gap-3" style={{ marginBottom: '24px' }}>
          <KpiTile label="Score medio"   value={avgScore ?? '—'}
                   sub={avgScore != null ? scoreLabel(avgScore) : null}
                   accent={scoreColor(avgScore)} />
          <KpiTile label="Mejor estación"  value={maxScore ?? '—'}
                   sub={maxScore != null ? scoreLabel(maxScore) : null}
                   accent={scoreColor(maxScore)} />
          <KpiTile label="Peor estación"   value={minScore ?? '—'}
                   sub={minScore != null ? scoreLabel(minScore) : null}
                   accent={scoreColor(minScore)} />
          <KpiTile label="Alertas críticas" value={totalHigh}
                   sub={`${totalMedium} medias activas`}
                   accent={totalHigh > 0 ? 'var(--accent)' : 'var(--green)'} />
        </div>

        {/* Matriz + Distribución */}
        <div className="grid gap-4" style={{ gridTemplateColumns: '1.4fr 1fr', marginBottom: '24px' }}>
          <PortfolioMatrix stations={stations} onSelect={onSelect} />
          <PathwayDistribution stations={stations} />
        </div>

        {/* Ranking + Alertas críticas */}
        <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <RankingTable stations={stations} onSelect={onSelect} />
          <CriticalAlertsList stations={stations} onSelect={onSelect} />
        </div>
      </div>
    </div>
  );
}
