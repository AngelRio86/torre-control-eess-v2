import { strategicScore, scoreLabel, scoreColor } from '../lib/scoring';
import { recommendPathway, PATHWAYS } from '../lib/transformation';
import { alertsForStation, CATEGORY_META, SEVERITY_META } from '../lib/alerts';

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componentes
// ─────────────────────────────────────────────────────────────────────────────

function ScoreBadge({ score, label }) {
  const color = scoreColor(score);
  return (
    <div className="flex items-center gap-3">
      <div style={{
        fontFamily: 'DM Serif Display, serif',
        fontSize: '52px',
        lineHeight: 1,
        color,
        fontWeight: 400,
      }}>
        {score != null ? score : '—'}
      </div>
      <div>
        <div style={{
          fontSize: '10px',
          fontFamily: 'JetBrains Mono, monospace',
          color: 'var(--text-dim)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          Strategic Score
        </div>
        <div style={{
          fontSize: '15px',
          color,
          fontWeight: 600,
          marginTop: '2px',
        }}>
          {label}
        </div>
      </div>
    </div>
  );
}

function DimensionBar({ name, score, confidence }) {
  const color = scoreColor(score);
  return (
    <div>
      <div className="flex items-baseline justify-between" style={{ marginBottom: '4px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-sub)' }}>{name}</span>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '11px',
          color,
          fontWeight: 600,
        }}>
          {score != null ? score : '—'}
        </span>
      </div>
      <div style={{
        height: '4px',
        background: 'var(--bg)',
        borderRadius: '2px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${score ?? 0}%`,
          height: '100%',
          background: color,
          borderRadius: '2px',
          transition: 'width 0.4s',
        }} />
      </div>
      {confidence < 100 && (
        <div style={{
          fontSize: '9px',
          color: 'var(--text-dim)',
          fontFamily: 'JetBrains Mono, monospace',
          marginTop: '2px',
        }}>
          confianza {confidence}%
        </div>
      )}
    </div>
  );
}

function PathwayCard({ rec, primary = false }) {
  const { pathway, score, signals } = rec;
  const support = signals.filter(s => s.score > 0);
  const against = signals.filter(s => s.score < 0);

  return (
    <div style={{
      background: primary ? 'var(--accent-soft)' : 'var(--surface)',
      border: `1px solid ${primary ? 'var(--accent-border)' : 'var(--border)'}`,
      borderRadius: '10px',
      padding: primary ? '18px 20px' : '14px 16px',
    }}>
      <div className="flex items-start justify-between gap-3" style={{ marginBottom: primary ? '12px' : '8px' }}>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: primary ? '22px' : '16px' }}>{pathway.icon}</span>
          <div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: primary ? '17px' : '13px',
              fontWeight: 600,
              color: 'var(--text-head)',
              lineHeight: 1.2,
            }}>
              {pathway.label}
            </div>
            <div style={{
              fontSize: primary ? '12px' : '10px',
              color: 'var(--text-sub)',
              marginTop: '2px',
            }}>
              {pathway.short}
            </div>
          </div>
        </div>
        <div style={{
          padding: '2px 8px',
          borderRadius: '4px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '10px',
          color: 'var(--text-sub)',
          whiteSpace: 'nowrap',
        }}>
          fit {score >= 0 ? '+' : ''}{score}
        </div>
      </div>

      {primary && (
        <>
          <div style={{
            fontSize: '12px',
            color: 'var(--text-base)',
            lineHeight: 1.5,
            marginBottom: '12px',
            paddingBottom: '12px',
            borderBottom: '1px solid var(--border-soft)',
          }}>
            {pathway.description}
          </div>

          <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '12px' }}>
            <div>
              <div style={{
                fontSize: '9px',
                color: 'var(--text-dim)',
                fontFamily: 'JetBrains Mono, monospace',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}>Capex</div>
              <div style={{ fontSize: '12px', color: 'var(--text-head)', fontWeight: 500, marginTop: '2px' }}>
                {pathway.capex}
              </div>
            </div>
            <div>
              <div style={{
                fontSize: '9px',
                color: 'var(--text-dim)',
                fontFamily: 'JetBrains Mono, monospace',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}>Horizonte</div>
              <div style={{ fontSize: '12px', color: 'var(--text-head)', fontWeight: 500, marginTop: '2px' }}>
                {pathway.horizon}
              </div>
            </div>
          </div>

          {support.length > 0 && (
            <div style={{ marginBottom: against.length > 0 ? '10px' : 0 }}>
              <div style={{
                fontSize: '10px',
                color: 'var(--green)',
                fontFamily: 'JetBrains Mono, monospace',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '6px',
              }}>
                Señales que lo soportan
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {support.slice(0, 5).map((s, i) => (
                  <li key={i} style={{
                    fontSize: '12px',
                    color: 'var(--text-base)',
                    marginBottom: '3px',
                    paddingLeft: '14px',
                    position: 'relative',
                  }}>
                    <span style={{
                      position: 'absolute',
                      left: 0,
                      color: 'var(--green)',
                      fontWeight: 600,
                    }}>+</span>
                    {s.label}
                    {s.evidence && (
                      <span style={{ color: 'var(--text-dim)', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}>
                        {' '}· {s.evidence}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {against.length > 0 && (
            <div>
              <div style={{
                fontSize: '10px',
                color: 'var(--accent)',
                fontFamily: 'JetBrains Mono, monospace',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '6px',
              }}>
                Señales en contra
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {against.slice(0, 3).map((s, i) => (
                  <li key={i} style={{
                    fontSize: '12px',
                    color: 'var(--text-base)',
                    marginBottom: '3px',
                    paddingLeft: '14px',
                    position: 'relative',
                  }}>
                    <span style={{
                      position: 'absolute',
                      left: 0,
                      color: 'var(--accent)',
                      fontWeight: 600,
                    }}>−</span>
                    {s.label}
                    {s.evidence && (
                      <span style={{ color: 'var(--text-dim)', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}>
                        {' '}· {s.evidence}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AlertRow({ alert }) {
  const sev = SEVERITY_META[alert.severity];
  const cat = CATEGORY_META[alert.category];
  return (
    <div style={{
      padding: '10px 14px',
      borderLeft: `3px solid ${sev.color}`,
      background: sev.bg,
      borderRadius: '0 6px 6px 0',
      marginBottom: '8px',
    }}>
      <div className="flex items-start justify-between gap-3" style={{ marginBottom: '4px' }}>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: '13px' }}>{cat.icon}</span>
          <span style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-head)',
          }}>
            {alert.title}
          </span>
        </div>
        <span style={{
          padding: '1px 6px',
          borderRadius: '3px',
          background: sev.color,
          color: 'white',
          fontSize: '9px',
          fontFamily: 'JetBrains Mono, monospace',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          whiteSpace: 'nowrap',
        }}>
          {sev.label}
        </span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text-base)', lineHeight: 1.45 }}>
        {alert.message}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────
export default function StrategicBrief({ station }) {
  if (!station || station.tipo !== 'petronor') return null;

  const score = strategicScore(station);
  const path = recommendPathway(station);
  const alerts = alertsForStation(station);

  const dimNames = {
    demanda: 'Demanda',
    competencia: 'Competencia',
    activo: 'Activo',
    movilidad: 'Movilidad',
    reputacion: 'Reputación',
  };

  const critical = alerts.filter(a => a.severity === 'high');
  const medium = alerts.filter(a => a.severity === 'medium');

  return (
    <div style={{
      background: 'linear-gradient(180deg, var(--surface) 0%, var(--bg) 100%)',
      border: '1px solid var(--border)',
      borderRadius: '14px',
      padding: '24px 26px',
      marginBottom: '24px',
    }}>
      {/* Banda superior */}
      <div className="flex items-start justify-between gap-6 mb-5">
        <div>
          <div style={{
            fontSize: '10px',
            fontFamily: 'JetBrains Mono, monospace',
            color: 'var(--text-dim)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}>
            Brief estratégico
          </div>
          <ScoreBadge score={score.score} label={score.label} />
        </div>

        {/* Pathway recomendada — píldora destacada */}
        <div style={{
          padding: '10px 16px',
          background: 'var(--accent-soft)',
          border: '1px solid var(--accent-border)',
          borderRadius: '10px',
          minWidth: '220px',
        }}>
          <div style={{
            fontSize: '9px',
            color: 'var(--accent)',
            fontFamily: 'JetBrains Mono, monospace',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: '4px',
            fontWeight: 600,
          }}>
            Pathway recomendada
          </div>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '22px' }}>{path.primary.pathway.icon}</span>
            <div>
              <div style={{
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--text-head)',
                lineHeight: 1.1,
              }}>
                {path.primary.pathway.label}
              </div>
              <div style={{
                fontSize: '10px',
                color: 'var(--text-sub)',
                fontFamily: 'JetBrains Mono, monospace',
                marginTop: '2px',
              }}>
                fit +{path.primary.score} · capex {path.primary.pathway.capex.toLowerCase()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dimensiones */}
      <div className="grid gap-4" style={{
        gridTemplateColumns: 'repeat(5, 1fr)',
        marginBottom: '20px',
        paddingBottom: '20px',
        borderBottom: '1px solid var(--border-soft)',
      }}>
        {Object.entries(score.dimensions).map(([k, v]) => (
          <DimensionBar
            key={k}
            name={dimNames[k]}
            score={v.score}
            confidence={v.confidence}
          />
        ))}
      </div>

      {/* Pathway detallada + alternativas */}
      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        <PathwayCard rec={path.primary} primary={true} />
        <div className="flex flex-col gap-2">
          <div style={{
            fontSize: '9px',
            color: 'var(--text-dim)',
            fontFamily: 'JetBrains Mono, monospace',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: '2px',
          }}>
            Alternativas evaluadas
          </div>
          {path.ranking.slice(1, 4).map((r, i) => (
            <PathwayCard key={i} rec={r} primary={false} />
          ))}
        </div>
      </div>

      {path.override_reason && (
        <div style={{
          padding: '8px 12px',
          background: 'var(--yellow-soft)',
          border: '1px solid var(--yellow-border)',
          borderRadius: '6px',
          fontSize: '11px',
          color: 'var(--text-base)',
          marginBottom: '16px',
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          ⚠ {path.override_reason}
        </div>
      )}

      {/* Alertas críticas */}
      {(critical.length > 0 || medium.length > 0) && (
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <div style={{
              fontSize: '10px',
              fontFamily: 'JetBrains Mono, monospace',
              color: 'var(--text-dim)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}>
              Alertas activas
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-sub)' }}>
              {critical.length > 0 && (
                <span style={{ color: 'var(--accent)', fontWeight: 600, marginRight: '8px' }}>
                  {critical.length} crítica{critical.length !== 1 ? 's' : ''}
                </span>
              )}
              {medium.length > 0 && (
                <span style={{ color: 'var(--yellow)' }}>
                  {medium.length} media{medium.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          {critical.map((a, i) => <AlertRow key={`c-${i}`} alert={a} />)}
          {medium.slice(0, 3).map((a, i) => <AlertRow key={`m-${i}`} alert={a} />)}
        </div>
      )}
    </div>
  );
}
