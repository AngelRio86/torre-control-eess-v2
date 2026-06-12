import { useState } from 'react';
import SourceBadge from './SourceBadge';
import BrandTag from './BrandTag';

// ─────────────────────────────────────────────────────────────────────────────
// Card colapsable de una capa
// ─────────────────────────────────────────────────────────────────────────────
function LayerCard({ num, title, capa, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const pendiente = capa && capa.disponible === false;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 transition-colors hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '11px',
            color: 'var(--text-dim)',
            minWidth: '52px',
          }}>
            CAPA {String(num).padStart(2, '0')}
          </span>
          <span style={{
            fontFamily: 'DM Serif Display, serif',
            fontSize: '16px',
            color: 'var(--text-head)',
          }}>
            {title}
          </span>
          {pendiente && (
            <span style={{
              padding: '2px 8px',
              borderRadius: '4px',
              background: '#FFFBEB',
              color: '#92400E',
              fontSize: '9px',
              fontFamily: 'JetBrains Mono, monospace',
              border: '1px solid #FCD34D60',
              letterSpacing: '0.05em',
            }}>
              PENDIENTE
            </span>
          )}
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            color: 'var(--text-dim)',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t" style={{ borderColor: 'var(--border-soft)' }}>
          <div className="pt-4">{children}</div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Panel "pendiente" reusable para C1–C5
// ─────────────────────────────────────────────────────────────────────────────
function PendientePanel({ capa }) {
  return (
    <div className="text-center py-8 px-4">
      <div style={{ fontSize: '28px', opacity: 0.3, marginBottom: '10px' }}>⌛</div>
      <div style={{
        fontSize: '13px',
        color: 'var(--text-base)',
        marginBottom: '6px',
        fontWeight: 500,
      }}>
        Pendiente de integración
      </div>
      <p style={{
        fontSize: '12px',
        color: 'var(--text-sub)',
        maxWidth: '44ch',
        margin: '0 auto',
        lineHeight: 1.5,
      }}>
        {capa.motivo}. Esta capa se poblará en la Fase 4 con las siguientes fuentes:
      </p>
      <div className="flex items-center justify-center gap-2 flex-wrap mt-3">
        {capa.fuentes_previstas?.map(f => (
          <span
            key={f}
            style={{
              fontSize: '10px',
              padding: '3px 8px',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              color: 'var(--text-sub)',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            {f}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────
export default function StationDetail({ station }) {
  if (!station) return null;
  const {
    c1_interno: c1,
    c2_demanda: c2,
    c3_competencia: c3,
    c4_activo: c4,
    c5_movilidad: c5,
    c6_reputacion: c6,
  } = station.capas;

  const capasDisponibles = [c1, c2, c3, c4, c5, c6].filter(
    c => c?.disponible !== false
  ).length;

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'var(--bg)' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '28px 28px 48px' }}>

        {/* ── HEADER ── */}
        <div
          className="flex items-start justify-between gap-6 mb-6 pb-6 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '11px',
                color: 'var(--text-dim)',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                padding: '2px 8px',
                borderRadius: '4px',
              }}>
                {station.id}
              </span>
              <BrandTag marca={station.marca} size="md" />
              {station.tipo === 'competidor' && (
                <span style={{
                  fontSize: '10px',
                  color: 'var(--text-dim)',
                  fontFamily: 'JetBrains Mono, monospace',
                }}>
                  Competidor de {station.competidor_de.join(', ')}
                </span>
              )}
            </div>
            <h1 style={{
              fontFamily: 'DM Serif Display, serif',
              fontSize: '26px',
              color: 'var(--text-head)',
              marginBottom: '4px',
              lineHeight: 1.2,
            }}>
              {station.nombre}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-sub)' }}>
              {station.direccion} · {station.municipio}
            </p>
            {station.accesos && station.accesos.length > 1 && (
              <div style={{
                fontSize: '11px',
                color: 'var(--text-dim)',
                marginTop: '6px',
                fontFamily: 'JetBrains Mono, monospace',
              }}>
                {station.accesos.length} accesos físicos · {station.accesos.map(a => a.sentido).join(' / ')}
              </div>
            )}
          </div>
        </div>

        {/* ── STATUS STRIP ── */}
        <div
          className="grid gap-3 mb-6"
          style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
        >
          <div
            className="rounded-xl p-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div style={{
              fontSize: '10px',
              color: 'var(--text-dim)',
              fontFamily: 'JetBrains Mono, monospace',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '8px',
            }}>
              Capas con datos
            </div>
            <div style={{
              fontFamily: 'DM Serif Display, serif',
              fontSize: '26px',
              color: 'var(--text-head)',
              lineHeight: 1,
            }}>
              {capasDisponibles}{' '}
              <span style={{ fontSize: '16px', color: 'var(--text-dim)' }}>/ 6</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
              El resto en Fase 4
            </div>
          </div>

          <div
            className="rounded-xl p-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div style={{
              fontSize: '10px',
              color: 'var(--text-dim)',
              fontFamily: 'JetBrains Mono, monospace',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '8px',
            }}>
              Reputación · C6
            </div>
            {c6?.disponible ? (
              <>
                <div style={{
                  fontFamily: 'DM Serif Display, serif',
                  fontSize: '26px',
                  color: c6.rating.valor >= 4.0
                    ? 'var(--green)'
                    : c6.rating.valor >= 3.7
                    ? 'var(--yellow)'
                    : 'var(--red)',
                  lineHeight: 1,
                }}>
                  ★ {c6.rating.valor.toFixed(1)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
                  {c6.n_resenas.valor.toLocaleString('es-ES')} reseñas
                </div>
              </>
            ) : (
              <div style={{ fontSize: '13px', color: 'var(--text-dim)' }}>—</div>
            )}
          </div>

          <div
            className="rounded-xl p-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div style={{
              fontSize: '10px',
              color: 'var(--text-dim)',
              fontFamily: 'JetBrains Mono, monospace',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '8px',
            }}>
              IMP · Índice Maestro
            </div>
            <div style={{
              fontFamily: 'DM Serif Display, serif',
              fontSize: '26px',
              color: 'var(--text-dim)',
              lineHeight: 1,
            }}>
              —
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
              Requiere C1–C5
            </div>
          </div>
        </div>

        {/* ── CAPAS ── */}
        <div className="mb-2">
          <div style={{
            fontSize: '10px',
            color: 'var(--text-dim)',
            fontFamily: 'JetBrains Mono, monospace',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: '12px',
          }}>
            Inteligencia Territorial — 6 Capas de Datos
          </div>
        </div>

        <div className="flex flex-col gap-3">

          <LayerCard num={1} title="Datos internos del negocio" capa={c1}>
            <PendientePanel capa={c1} />
          </LayerCard>

          <LayerCard num={2} title="Demanda territorial" capa={c2}>
            <PendientePanel capa={c2} />
          </LayerCard>

          <LayerCard num={3} title="Mapa competitivo" capa={c3}>
            <PendientePanel capa={c3} />
          </LayerCard>

          <LayerCard num={4} title="Activo y opcionalidad" capa={c4}>
            <PendientePanel capa={c4} />
          </LayerCard>

          <LayerCard num={5} title="Movilidad real" capa={c5}>
            <PendientePanel capa={c5} />
          </LayerCard>

          <LayerCard num={6} title="Reputación de servicio" capa={c6} defaultOpen={true}>
            {c6?.disponible ? (
              <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div>
                  <div style={{
                    fontSize: '11px',
                    color: 'var(--text-dim)',
                    fontFamily: 'JetBrains Mono, monospace',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '8px',
                  }}>
                    Métricas Google Maps
                  </div>
                  <div
                    className="flex items-center justify-between py-3 border-b"
                    style={{ borderColor: 'var(--border-soft)' }}
                  >
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-sub)' }}>Rating</div>
                      <SourceBadge kpi={c6.rating} compact />
                    </div>
                    <div style={{
                      fontFamily: 'DM Serif Display, serif',
                      fontSize: '32px',
                      color: c6.rating.valor >= 4.0
                        ? 'var(--green)'
                        : c6.rating.valor >= 3.7
                        ? 'var(--yellow)'
                        : 'var(--red)',
                      lineHeight: 1,
                    }}>
                      ★ {c6.rating.valor.toFixed(1)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-sub)' }}>Nº de reseñas</div>
                      <SourceBadge kpi={c6.n_resenas} compact />
                    </div>
                    <div style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '20px',
                      color: 'var(--text-head)',
                      fontWeight: 600,
                    }}>
                      {c6.n_resenas.valor.toLocaleString('es-ES')}
                    </div>
                  </div>
                </div>
                <div>
                  <div style={{
                    fontSize: '11px',
                    color: 'var(--text-dim)',
                    fontFamily: 'JetBrains Mono, monospace',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '8px',
                  }}>
                    Análisis pendiente
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-sub)', lineHeight: 1.6 }}>
                    Sentimiento, temas positivos/negativos y diferencial vs. competencia
                    se calculan en la Fase 4 con análisis NLP sobre el texto de las reseñas.
                  </p>
                </div>
              </div>
            ) : (
              <PendientePanel capa={c6} />
            )}
          </LayerCard>

        </div>
      </div>
    </div>
  );
}
