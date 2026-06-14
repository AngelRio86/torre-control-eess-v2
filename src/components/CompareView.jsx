import { useState } from 'react';
import BrandTag from './BrandTag';
import SourceBadge from './SourceBadge';
import {
  CAPA_TITLES,
  CAPA_KEYS,
  COMPARE_CONFIG,
  getKpi,
  findBestIdx,
} from '../lib/compare';

// ─────────────────────────────────────────────────────────────────────────────
// Card colapsable de una capa en la vista comparada
// ─────────────────────────────────────────────────────────────────────────────
function CompareLayerCard({ capaKey, title, stations, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const config = COMPARE_CONFIG[capaKey] || [];

  const disponibles = stations.filter(
    st => st.capas[capaKey]?.disponible !== false
  ).length;
  const total = stations.length;
  const algunaDisp = disponibles > 0 && config.length > 0;

  // Color del badge "n/N con dato"
  const badgeBg = algunaDisp ? '#F0FDF4' : '#FFFBEB';
  const badgeColor = algunaDisp ? '#166534' : '#92400E';
  const badgeBorder = algunaDisp ? '#6EE7B780' : '#FCD34D60';

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
            CAPA {String(CAPA_KEYS.indexOf(capaKey) + 1).padStart(2, '0')}
          </span>
          <span style={{
            fontFamily: 'DM Serif Display, serif',
            fontSize: '16px',
            color: 'var(--text-head)',
          }}>
            {title}
          </span>
          <span style={{
            padding: '2px 8px',
            borderRadius: '4px',
            background: badgeBg,
            color: badgeColor,
            fontSize: '9px',
            fontFamily: 'JetBrains Mono, monospace',
            border: `1px solid ${badgeBorder}`,
            letterSpacing: '0.05em',
          }}>
            {disponibles}/{total} con dato
          </span>
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
        <div className="border-t" style={{ borderColor: 'var(--border-soft)' }}>
          {(disponibles === 0 || config.length === 0) ? (
            <div className="text-center py-8 px-4">
              <div style={{ fontSize: '12px', color: 'var(--text-sub)' }}>
                {config.length === 0
                  ? 'Capa pendiente de integración. Comparable a partir de la Fase 4.'
                  : 'Ninguna estación seleccionada tiene esta capa disponible.'}
              </div>
            </div>
          ) : (
            <div className="px-5 py-4">
              {config.map(({ key, label, better, format }) => {
                const kpis = stations.map(st => getKpi(st.capas[capaKey], key));
                const values = kpis.map(k => k?.valor ?? null);
                const bestIdx = findBestIdx(values, better);
                const worstIdx = findBestIdx(values, better === 'higher' ? 'lower' : 'higher');

                return (
                  <div
                    key={key}
                    className="grid items-center py-3 border-b last:border-b-0"
                    style={{
                      borderColor: 'var(--border-soft)',
                      gridTemplateColumns: `160px repeat(${stations.length}, 1fr)`,
                      gap: '12px',
                    }}
                  >
                    <div style={{ fontSize: '12px', color: 'var(--text-sub)' }}>
                      {label}
                    </div>
                    {kpis.map((kpi, i) => {
                      const isBest = i === bestIdx;
                      return (
                        <div
                          key={i}
                          className="flex flex-col items-end gap-0.5"
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            background: i === bestIdx
                              ? '#F0FDF4'  // verde muy suave
                              : i === worstIdx
                                ? '#FEF2F2'  // rojo muy suave
                                : 'transparent',
                            border: i === bestIdx
                              ? '1px solid #86EFAC60'
                              : i === worstIdx
                                ? '1px solid #FCA5A560'
                                : '1px solid transparent',
                          }}
                        >
                          {kpi?.valor != null ? (
                            <>
                              <div className="flex items-center gap-1.5">
                                {isBest && (
                                  <span style={{
                                    color: '#059669',
                                    fontSize: '8px',
                                    lineHeight: 1,
                                  }}>●</span>
                                )}
                                <span style={{
                                  fontFamily: 'JetBrains Mono, monospace',
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  color: isBest ? '#059669' : 'var(--text-head)',
                                }}>
                                  {format(kpi.valor)}
                                </span>
                              </div>
                              <SourceBadge kpi={kpi} compact />
                            </>
                          ) : (
                            <span style={{
                              fontSize: '13px',
                              color: 'var(--text-dim)',
                              fontFamily: 'JetBrains Mono, monospace',
                            }}>
                              —
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Veredicto global: cuenta KPIs ganados por cada estación
// ─────────────────────────────────────────────────────────────────────────────
function Veredicto({ stations }) {
  // Recorre todas las capas y todos los KPIs, cuenta cuántos gana cada estación
  const wins = stations.map(() => 0);
  let totalComparable = 0;

  CAPA_KEYS.forEach(capaKey => {
    const config = COMPARE_CONFIG[capaKey] || [];
    config.forEach(({ key, better }) => {
      const values = stations.map(st => getKpi(st.capas[capaKey], key)?.valor ?? null);
      const validCount = values.filter(v => v !== null).length;
      if (validCount < 2) return; // necesitamos al menos 2 para comparar
      const bestIdx = findBestIdx(values, better);
      if (bestIdx >= 0) {
        wins[bestIdx]++;
        totalComparable++;
      }
    });
  });

  if (totalComparable === 0) {
    return (
      <div
        className="rounded-xl p-5 mt-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div style={{ fontSize: '12px', color: 'var(--text-sub)', textAlign: 'center' }}>
          Aún no hay KPIs comparables entre las estaciones seleccionadas.
        </div>
      </div>
    );
  }

  // Ordenar las estaciones por victorias para destacar al líder
  const ranking = stations
    .map((st, i) => ({ st, wins: wins[i], idx: i }))
    .sort((a, b) => b.wins - a.wins);
  const lider = ranking[0];

  return (
    <div
      className="rounded-xl p-6 mt-4"
      style={{
        background: 'linear-gradient(135deg, var(--surface) 0%, #FAFBFC 100%)',
        border: '1px solid var(--border)',
      }}
    >
      <div style={{
        fontSize: '10px',
        color: 'var(--text-dim)',
        fontFamily: 'JetBrains Mono, monospace',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        marginBottom: '14px',
      }}>
        Veredicto global · {totalComparable} KPIs comparados
      </div>

      <div className="flex flex-col gap-3">
        {ranking.map(({ st, wins: w, idx }, rank) => {
          const pct = totalComparable > 0 ? (w / totalComparable) * 100 : 0;
          const isLeader = rank === 0 && w > lider.wins / 2; // líder claro solo si tiene ventaja
          return (
            <div key={st.id} className="flex items-center gap-3">
              <div style={{
                width: '28px',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '11px',
                color: 'var(--text-dim)',
                textAlign: 'center',
              }}>
                {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `#${rank + 1}`}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-head)',
                  marginBottom: '4px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {st.nombre}
                </div>
                <div style={{
                  height: '6px',
                  background: '#E5E7EB',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: isLeader ? '#10B981' : '#94A3B8',
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              </div>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-head)',
                minWidth: '70px',
                textAlign: 'right',
              }}>
                {w} de {totalComparable}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Vista principal de comparación
// ─────────────────────────────────────────────────────────────────────────────
export default function CompareView({ stations }) {
  if (!stations || stations.length === 0) return null;

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'var(--bg)' }}>
      <div style={{
        maxWidth: stations.length >= 3 ? '1200px' : '900px',
        margin: '0 auto',
        padding: '28px 28px 48px',
      }}>

        {/* HEADER STRIP: una columna por estación */}
        <div
          className="grid gap-3 mb-6"
          style={{ gridTemplateColumns: `160px repeat(${stations.length}, 1fr)` }}
        >
          <div></div>
          {stations.map(st => (
            <div
              key={st.id}
              className="rounded-xl p-4"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '10px',
                color: 'var(--text-dim)',
                marginBottom: '6px',
              }}>
                {st.id}
              </div>
              <div style={{
                fontFamily: 'DM Serif Display, serif',
                fontSize: '15px',
                color: 'var(--text-head)',
                lineHeight: 1.25,
                marginBottom: '6px',
              }}>
                {st.nombre}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-sub)', marginBottom: '8px' }}>
                {st.municipio}
              </div>
              <BrandTag marca={st.marca} size="sm" />
            </div>
          ))}
        </div>

        {/* CAPAS COMPARADAS */}
        <div className="mb-2">
          <div style={{
            fontSize: '10px',
            color: 'var(--text-dim)',
            fontFamily: 'JetBrains Mono, monospace',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: '12px',
          }}>
            Comparación por capa
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {CAPA_KEYS.map(capaKey => (
            <CompareLayerCard
              key={capaKey}
              capaKey={capaKey}
              title={CAPA_TITLES[capaKey]}
              stations={stations}
              defaultOpen={capaKey === 'c6_reputacion'}
            />
          ))}
        </div>

        {/* ─── VEREDICTO GLOBAL ──────────────────────────────────────── */}
        <Veredicto stations={stations} />
      </div>
    </div>
  );
}
