// Configuración del comparador.
// Define qué KPIs se muestran por capa, cómo se formatean y en qué dirección
// se considera "mejor". El "mejor de la fila" se marca en verde, el peor en rojo.

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
// { key, label, better: 'higher' | 'lower' | 'neutral', format }
// 'neutral' = se muestra pero no se marca mejor/peor
export const COMPARE_CONFIG = {
  c1_interno: [],

  // ── Capa 2 · Demanda territorial (Eustat + INE) ─────────────────────────
  c2_demanda: [
    { key: 'poblacion',        label: '👥 Población municipio', better: 'higher', format: v => v.toLocaleString('es-ES') },
    { key: 'renta_neta_hogar', label: '💶 Renta neta/hogar',    better: 'higher', format: v => `${v.toLocaleString('es-ES')} €` },
    { key: 'renta_per_capita', label: '👤 Renta per cápita',    better: 'higher', format: v => `${v.toLocaleString('es-ES')} €` },
    { key: 'edad_media',       label: '📅 Edad media',          better: 'lower',  format: v => `${v.toFixed(1)} años` },
    { key: 'pct_mayores_65',   label: '👴 % mayores 65 años',   better: 'lower',  format: v => `${v.toFixed(1)}%` },
    { key: 'vehiculos_total',  label: '🚗 Parque vehículos',    better: 'higher', format: v => v.toLocaleString('es-ES') },
    { key: 'veh_por_mil_hab',  label: '🚘 Vehículos/1000 hab',  better: 'higher', format: v => v.toLocaleString('es-ES') },
  ],

  // ── Capa 3 · Mapa competitivo (MITECO + OSM) ────────────────────────────
  c3_competencia: [
    // Precios (MITECO)
    { key: 'g95',            label: 'Gasolina 95 E5',     better: 'lower',  format: v => `${v.toFixed(3)} €/L` },
    { key: 'g98',            label: 'Gasolina 98 E5',     better: 'lower',  format: v => `${v.toFixed(3)} €/L` },
    { key: 'diesel_a',       label: 'Diésel A',           better: 'lower',  format: v => `${v.toFixed(3)} €/L` },
    { key: 'diesel_premium', label: 'Diésel Premium',     better: 'lower',  format: v => `${v.toFixed(3)} €/L` },
    // Entorno comercial (OSM)
    { key: 'n_supermercados_1km',    label: '🛒 Supermercados (1 km)',  better: 'higher', format: v => v.toLocaleString('es-ES') },
    { key: 'n_cafes_1km',            label: '☕ Cafés (1 km)',          better: 'higher', format: v => v.toLocaleString('es-ES') },
    { key: 'n_restaurantes_1km',     label: '🍽️ Restaurantes (1 km)',   better: 'higher', format: v => v.toLocaleString('es-ES') },
    { key: 'n_hoteles_1km',          label: '🏨 Hoteles (1 km)',        better: 'higher', format: v => v.toLocaleString('es-ES') },
    { key: 'n_lavados_1km',          label: '🧼 Lavados (1 km)',        better: 'higher', format: v => v.toLocaleString('es-ES') },
    { key: 'n_cargadores_ev_osm',    label: '⚡ Cargadores EV (1 km)',  better: 'higher', format: v => v.toLocaleString('es-ES') },
    { key: 'n_eess_competencia_osm', label: '⛽ EESS competencia (1 km)', better: 'lower',  format: v => v.toLocaleString('es-ES') },
  ],

  // ── Capa 4 · Activo y opcionalidad (estimación visual) ──────────────────
  c4_activo: [
    { key: 'n_surtidores',       label: '⛽ Nº surtidores',         better: 'higher', format: v => v.toLocaleString('es-ES') },
    { key: 'superficie_m2',      label: '📐 Superficie (m²)',       better: 'higher', format: v => `${v.toLocaleString('es-ES')} m²` },
    { key: 'horas_servicio_24h', label: '🕐 Servicio 24h',          better: 'higher', format: v => v ? 'Sí' : 'No' },
    { key: 'tienda',             label: '🏪 Tienda conveniencia',   better: 'higher', format: v => v ? 'Sí' : 'No' },
  ],

  // ── Capa 5 · Movilidad real (Aforos DGT) ────────────────────────────────
  c5_movilidad: [
    { key: 'imd',         label: '🚦 IMD (veh/día)',     better: 'higher', format: v => v.toLocaleString('es-ES') },
    { key: 'pct_pesados', label: '🚛 % pesados',         better: 'higher', format: v => `${v.toFixed(1)}%` },
  ],

  // ── Capa 6 · Reputación (Google Maps) ───────────────────────────────────
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

// Dado un array de valores (con posibles null), devuelve el índice
// del mejor según la dirección. Devuelve -1 si no hay diferencia significativa
// o si los valores no son comparables (booleanos, strings).
export const findBestIdx = (values, direction = 'higher') => {
  const validIdxs = values
    .map((v, i) => ({ v, i }))
    .filter(({ v }) => v !== null && v !== undefined);
  if (validIdxs.length < 2) return -1;

  // Si son booleanos: el mejor es true (si higher) o false (si lower)
  if (typeof validIdxs[0].v === 'boolean') {
    const target = direction === 'higher';
    const trues = validIdxs.filter(({ v }) => v === target);
    const falses = validIdxs.filter(({ v }) => v !== target);
    if (trues.length === 0 || falses.length === 0) return -1; // todos iguales
    return trues[0].i; // marca el primero true
  }

  // Numérico
  const sorted = [...validIdxs].sort((a, b) =>
    direction === 'higher' ? b.v - a.v : a.v - b.v
  );
  if (sorted[0].v === sorted[sorted.length - 1].v) return -1;
  return sorted[0].i;
};
