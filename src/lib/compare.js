// Configuración del comparador.
// Define qué KPIs se muestran por capa, cómo se formatean y en qué dirección
// se considera "mejor". El "mejor de la fila" se marca con un punto verde en la UI.

export const CAPA_TITLES = {
  c1_interno:     'Datos internos del negocio',
  c2_demanda:     'Demanda territorial',
  c3_competencia: 'Mapa competitivo',
  c4_activo:      'Activo y opcionalidad',
  c5_movilidad:   'Movilidad real',
  c6_reputacion:  'Reputación de servicio',
};

export const CAPA_KEYS = Object.keys(CAPA_TITLES);

// Por cada capa, lista de KPIs a comparar.
// { key, label, better: 'higher' | 'lower', format }
// Capas 1-5 vacías hasta Fase 4.
export const COMPARE_CONFIG = {
  c1_interno: [],
  c2_demanda: [],
  c3_competencia: [
    // ── Precios (MITECO) ──────────────────────────────────────────────────
    { key: 'g95',            label: 'Gasolina 95 E5',     better: 'lower',  format: v => `${v.toFixed(3)} €/L` },
    { key: 'g98',            label: 'Gasolina 98 E5',     better: 'lower',  format: v => `${v.toFixed(3)} €/L` },
    { key: 'diesel_a',       label: 'Diésel A',           better: 'lower',  format: v => `${v.toFixed(3)} €/L` },
    { key: 'diesel_premium', label: 'Diésel Premium',     better: 'lower',  format: v => `${v.toFixed(3)} €/L` },
    // ── Entorno comercial (OSM, radio 1 km) ───────────────────────────────
    { key: 'n_supermercados_1km',    label: '🛒 Supermercados (1 km)',  better: 'higher', format: v => v.toLocaleString('es-ES') },
    { key: 'n_cafes_1km',            label: '☕ Cafés (1 km)',          better: 'higher', format: v => v.toLocaleString('es-ES') },
    { key: 'n_restaurantes_1km',     label: '🍽️ Restaurantes (1 km)',   better: 'higher', format: v => v.toLocaleString('es-ES') },
    { key: 'n_hoteles_1km',          label: '🏨 Hoteles (1 km)',        better: 'higher', format: v => v.toLocaleString('es-ES') },
    { key: 'n_lavados_1km',          label: '🧼 Lavados (1 km)',        better: 'higher', format: v => v.toLocaleString('es-ES') },
    { key: 'n_cargadores_ev_osm',    label: '⚡ Cargadores EV (1 km)',  better: 'higher', format: v => v.toLocaleString('es-ES') },
    { key: 'n_eess_competencia_osm', label: '⛽ EESS competencia (1 km)', better: 'lower',  format: v => v.toLocaleString('es-ES') },
  ],
  c4_activo: [],
  c5_movilidad: [],
  c6_reputacion: [
    { key: 'rating',    label: 'Rating',     better: 'higher', format: v => `★ ${v.toFixed(1)}` },
    { key: 'n_resenas', label: 'Nº reseñas', better: 'higher', format: v => v.toLocaleString('es-ES') },
  ],
};

// Devuelve el objeto KPI { valor, fuente, fecha, estado } de una capa, o null.
export const getKpi = (capa, kpiKey) => {
  if (!capa || capa.disponible === false) return null;
  return capa[kpiKey] || null;
};

// Dado un array de valores numéricos (con posibles null), devuelve el índice
// del mejor según la dirección. Devuelve -1 si no hay diferencia significativa
// (todos iguales, solo uno con dato, etc.) para no marcar dot.
export const findBestIdx = (values, direction = 'higher') => {
  const validIdxs = values
    .map((v, i) => ({ v, i }))
    .filter(({ v }) => v !== null && v !== undefined);
  if (validIdxs.length < 2) return -1;
  const sorted = [...validIdxs].sort((a, b) =>
    direction === 'higher' ? b.v - a.v : a.v - b.v
  );
  if (sorted[0].v === sorted[sorted.length - 1].v) return -1; // todos iguales
  return sorted[0].i;
};
