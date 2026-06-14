import { useState } from 'react';
import SourceBadge from './SourceBadge';
import BrandTag from './BrandTag';

// ─────────────────────────────────────────────────────────────────────────────
// Primitivos
// ─────────────────────────────────────────────────────────────────────────────

// Píldora pequeña (PENDIENTE / PARCIAL)
function StatusPill({ tone = 'warning', label }) {
  const tones = {
    warning: { bg: '#FFFBEB', color: '#92400E', border: '#FCD34D60' },
    info:    { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE80' },
  };
  const t = tones[tone] || tones.warning;
  return (
    <span style={{
      padding: '2px 8px',
      borderRadius: '4px',
      background: t.bg,
      color: t.color,
      fontSize: '9px',
      fontFamily: 'JetBrains Mono, monospace',
      border: `1px solid ${t.border}`,
      letterSpacing: '0.05em',
    }}>
      {label}
    </span>
  );
}

// Fila de KPI con label, valor formateado y SourceBadge debajo
function KpiRow({ label, kpi, format = v => v, accent }) {
  if (!kpi) return null;
  const isAvailable = kpi.valor != null;
  return (
    <div
      className="flex items-start justify-between py-2 border-b last:border-b-0"
      style={{ borderColor: 'var(--border-soft)' }}
    >
      <div className="flex-1">
        <div style={{ fontSize: '12px', color: 'var(--text-sub)' }}>{label}</div>
        {isAvailable && <SourceBadge kpi={kpi} compact />}
      </div>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '13px',
        fontWeight: 600,
        color: accent || 'var(--text-head)',
        whiteSpace: 'nowrap',
        marginLeft: '12px',
      }}>
      {isAvailable ? format(kpi.valor) : '—'}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Fila compacta para mostrar un POI: icono+label, contador, distancia
// ─────────────────────────────────────────────────────────────────────────────
function PoiRow({ label, kpi, dist }) {
  if (!kpi) return null;
  const count = kpi.valor;
  const isAvailable = count != null;
  const distVal = dist?.valor;
  const hasCount = isAvailable && count > 0;

  return (
    <div
      className="flex items-center justify-between py-2 border-b last:border-b-0"
      style={{ borderColor: 'var(--border-soft)' }}
    >
      <div style={{
        fontSize: '12px',
        color: 'var(--text-sub)',
        flex: 1,
      }}>
        {label}
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: '10px',
        marginLeft: '12px',
      }}>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '13px',
          fontWeight: 600,
          color: hasCount ? 'var(--text-head)' : 'var(--text-dim)',
        }}>
          {isAvailable ? count : '—'}
        </span>
        {hasCount && distVal != null && (
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '11px',
            color: 'var(--text-dim)',
            minWidth: '52px',
            textAlign: 'right',
          }}>
            {distVal < 1000 ? `${distVal} m` : `${(distVal / 1000).toFixed(1)} km`}
          </span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Card colapsable de una capa
// ─────────────────────────────────────────────────────────────────────────────
// Total de fuentes previstas por capa (numerador = fuentes ya integradas)
const FUENTES_PREVISTAS = {
  c1_interno: 1,     // Sistemas Petronor
  c2_demanda: 4,     // INE + Eustat + DGT + Catastro
  c3_competencia: 3, // MITECO + OSM + OpenChargeMap
  c4_activo: 1,      // Catastro
  c5_movilidad: 1,   // Aforos DGT
  c6_reputacion: 1,  // Google Maps manual
};

function LayerCard({ num, title, capaKey, capa, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const pendiente = capa && capa.disponible === false;
  const parcial = capa && capa.disponible === true && capa.parcial === true;

  // Progreso de fuentes para el pill "PARCIAL"
  const fuentesPresentes = capa?.fuentes_presentes?.length || 0;
  const fuentesPrevistas = FUENTES_PREVISTAS[capaKey] || null;
  const parcialLabel = fuentesPrevistas
    ? `PARCIAL · ${fuentesPresentes} de ${fuentesPrevistas}`
    : 'PARCIAL';

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
          {pendiente && <StatusPill tone="warning" label="PENDIENTE" />}
          {parcial && <StatusPill tone="info" label={parcialLabel} />}
        </div>
        <svg
          width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2"
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
// Panel "pendiente" reusable para C1, C2, C4, C5
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
// Formatters reutilizables
// ─────────────────────────────────────────────────────────────────────────────
const fmtPrice = v => `${v.toFixed(3)} €/L`;
const fmtGap = v => `${v >= 0 ? '+' : ''}${v.toFixed(3)} €/L`;

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
  const isPetronor = station.tipo === 'petronor';
  const hasClusterData = c3?.disponible && c3?.media_competencia_g95;

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

          <LayerCard num={1} title="Datos internos del negocio" capaKey="c1_interno" capa={c1}>
            <PendientePanel capa={c1} />
          </LayerCard>

          <LayerCard num={2} title="Demanda territorial" capaKey="c2_demanda" capa={c2}>
            <PendientePanel capa={c2} />
          </LayerCard>

          {/* ─── CAPA 03 · Mapa competitivo ──────────────────────────────── */}
          <LayerCard
            num={3}
            title="Mapa competitivo"
            capaKey="c3_competencia"
            capa={c3}
            defaultOpen={c3?.disponible === true}
          >
            {c3?.disponible ? (
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
                    Precios de la estación
                  </div>
                  <KpiRow label="Gasolina 95 E5" kpi={c3.g95} format={fmtPrice} />
                  <KpiRow label="Gasolina 98 E5" kpi={c3.g98} format={fmtPrice} />
                  <KpiRow label="Diésel A" kpi={c3.diesel_a} format={fmtPrice} />
                  <KpiRow label="Diésel Premium" kpi={c3.diesel_premium} format={fmtPrice} />
                  {c3.horario && (
                    <div style={{
                      fontSize: '10px',
                      color: 'var(--text-dim)',
                      fontFamily: 'JetBrains Mono, monospace',
                      marginTop: '10px',
                    }}>
                      Horario: {c3.horario}
                    </div>
                  )}
                  {c3.parcial && (
                    <div style={{
                      fontSize: '10px',
                      color: 'var(--text-dim)',
                      marginTop: '10px',
                      fontStyle: 'italic',
                    }}>
                      Precios MITECO + entorno OSM integrados. Cargadores EV (OpenChargeMap) pendientes.
                    </div>
                  )}
                </div>

                {isPetronor && hasClusterData ? (
                  <div>
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--text-dim)',
                      fontFamily: 'JetBrains Mono, monospace',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: '8px',
                    }}>
                      Posición competitiva
                      <span style={{
                        marginLeft: '8px',
                        color: 'var(--text-sub)',
                        textTransform: 'none',
                        letterSpacing: 'normal',
                      }}>
                        (vs. {c3.n_competidores_con_dato} competidores)
                      </span>
                    </div>
                    <KpiRow label="Media competencia G95" kpi={c3.media_competencia_g95} format={fmtPrice} />
                    <KpiRow label="Mín. competencia G95" kpi={c3.min_competencia_g95} format={fmtPrice} />
                    <KpiRow
                      label="Gap vs mín G95"
                      kpi={c3.gap_vs_min_g95}
                      format={fmtGap}
                      accent={c3.gap_vs_min_g95?.valor > 0 ? 'var(--yellow)' : c3.gap_vs_min_g95?.valor < 0 ? 'var(--green)' : undefined}
                    />
                    <div className="mt-3" style={{ height: '12px' }} />
                    <KpiRow label="Media competencia Diésel" kpi={c3.media_competencia_diesel} format={fmtPrice} />
                    <KpiRow label="Mín. competencia Diésel" kpi={c3.min_competencia_diesel} format={fmtPrice} />
                    <KpiRow
                      label="Gap vs mín Diésel"
                      kpi={c3.gap_vs_min_diesel}
                      format={fmtGap}
                      accent={c3.gap_vs_min_diesel?.valor > 0 ? 'var(--yellow)' : c3.gap_vs_min_diesel?.valor < 0 ? 'var(--green)' : undefined}
                    />
                 </div>
                ) : null}

                {/* ── ENTORNO COMERCIAL (OSM POIs en 1 km) ───────────────── */}
                {c3.n_supermercados_1km && (
                  <>
                    <div className="mt-3" style={{ height: '12px' }} />
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--text-dim)',
                      fontFamily: 'JetBrains Mono, monospace',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      <span>Entorno comercial</span>
                      <span style={{
                        fontSize: '10px',
                        color: 'var(--text-sub)',
                        textTransform: 'none',
                        letterSpacing: 0,
                      }}>
                        (radio {c3.radio_poi_m} m)
                      </span>
                    </div>
                    <PoiRow label="🛒  Supermercados"    kpi={c3.n_supermercados_1km}    dist={c3.dist_supermercado_m} />
                    <PoiRow label="☕  Cafés"            kpi={c3.n_cafes_1km}            dist={c3.dist_cafe_m} />
                    <PoiRow label="🍽️  Restaurantes"     kpi={c3.n_restaurantes_1km}     dist={c3.dist_restaurante_m} />
                    <PoiRow label="🏨  Hoteles"          kpi={c3.n_hoteles_1km}          dist={c3.dist_hotel_m} />
                    <PoiRow label="🧼  Lavados"          kpi={c3.n_lavados_1km}          dist={null} />
                    <PoiRow label="⚡  Cargadores EV"    kpi={c3.n_cargadores_ev_osm}    dist={null} />
                    <PoiRow label="⛽  EESS competencia" kpi={c3.n_eess_competencia_osm} dist={c3.dist_eess_competencia_m} />
                  </>
                )}

                {/* ── Mensaje pendientes ─────────────────────────────────── */}
                {!hasClusterData && !c3.n_supermercados_1km && (
                  <div>
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--text-dim)',
                      fontFamily: 'JetBrains Mono, monospace',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: '8px',
                    }}>
                      Próximos datos
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-sub)', lineHeight: 1.6 }}>
                      Cargadores EV detallados (OpenChargeMap) en próximas iteraciones de la Fase 4.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <PendientePanel capa={c3} />
            )}
          </LayerCard>

          <LayerCard num={4} title="Activo y opcionalidad" capa={c4}>
            <PendientePanel capa={c4} />
          </LayerCard>

          <LayerCard num={6} title="Reputación de servicio" capaKey="c6_reputacion" capa={c6} defaultOpen={true}>
            <PendientePanel capa={c5} />
          </LayerCard>

          {/* ─── CAPA 06 · Reputación ────────────────────────────────────── */}
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
                    se calculan en próximas iteraciones de la Fase 4 con análisis NLP sobre el texto de las reseñas.
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
