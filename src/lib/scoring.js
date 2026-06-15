// ============================================================================
// MOTOR DE SCORING ESTRATÉGICO · Torre de Control EESS v2
// ============================================================================
// Cada estación recibe un Strategic Score (0-100) compuesto por 5 dimensiones.
// Las dimensiones son auditables: cada componente referencia los KPIs que usa.
//
// Filosofía: NO es un cálculo "black-box". Cada score es trazable a datos
// observables, y el motor tolera ausencia parcial de datos (score parcial
// + flag de confianza).
// ============================================================================

// ── helpers de extracción de valor ──────────────────────────────────────────
const val = (kpi) => (kpi && kpi.valor != null ? kpi.valor : null);

// Normaliza un valor a [0,100] dado un rango esperado [min, max]
// invert=true → más bajo es mejor (ej: gap de precio)
const norm = (v, min, max, invert = false) => {
  if (v == null) return null;
  const clamped = Math.max(min, Math.min(max, v));
  const pct = ((clamped - min) / (max - min)) * 100;
  return invert ? 100 - pct : pct;
};

// Promedio robusto que ignora null y devuelve también la confianza
// (% de componentes con dato).
const robustAvg = (components) => {
  const present = components.filter((c) => c.score != null);
  if (present.length === 0) return { score: null, confidence: 0, present: [], missing: components.filter(c => c.score == null) };
  const score = present.reduce((s, c) => s + c.score * (c.weight ?? 1), 0)
              / present.reduce((s, c) => s + (c.weight ?? 1), 0);
  return {
    score: Math.round(score),
    confidence: Math.round((present.length / components.length) * 100),
    present,
    missing: components.filter(c => c.score == null),
  };
};

// ============================================================================
// SCORE C2 · DEMANDA TERRITORIAL
// ============================================================================
// Mide qué tan atractivo es el mercado natural de la estación.
// Componentes:
//   - Renta per cápita (poder adquisitivo)
//   - Densidad de población (volumen potencial)
//   - Veh/mil hab (penetración vehicular)
//   - % mayores 65 invertido (envejecimiento penaliza demanda futura)
// ============================================================================
export function scoreDemanda(c2) {
  if (!c2 || !c2.disponible) return { score: null, confidence: 0, components: [], note: 'Capa C2 no disponible' };

  const renta_pc = val(c2.renta_per_capita);
  const poblacion = val(c2.poblacion);
  const veh_mil = val(c2.veh_por_mil_hab);
  const pct65 = val(c2.pct_mayores_65);

  // Rangos calibrados con la realidad del Bilbao metropolitano (datos reales del proyecto):
  //   renta_pc: 12.000 (Sestao) — 18.000 (Leioa)
  //   poblacion (municipio): 24.000 (Erandio) — 350.000 (Bilbao)
  //   veh/mil hab: 420 — 510
  //   %mayores65: 22 — 28
  const components = [
    { key: 'renta_per_capita', label: 'Poder adquisitivo', weight: 1.5,
      score: norm(renta_pc, 10000, 20000) },
    { key: 'poblacion_log', label: 'Volumen del mercado', weight: 1.0,
      // Logarítmica para suavizar Bilbao vs municipios pequeños
      score: poblacion != null ? norm(Math.log10(poblacion), 4.2, 5.6) : null },
    { key: 'veh_mil_hab', label: 'Penetración vehicular', weight: 1.0,
      score: norm(veh_mil, 380, 530) },
    { key: 'envejecimiento', label: 'Demanda futura', weight: 0.8,
      score: norm(pct65, 20, 30, true) }, // invertido
  ];

  return { ...robustAvg(components), components };
}

// ============================================================================
// SCORE C3 · POSICIÓN COMPETITIVA Y ENTORNO COMERCIAL
// ============================================================================
// Componentes:
//   - Gap de precio vs. min competencia G95 (más negativo = más caro = peor)
//   - Densidad de tráfico comercial (POIs en 1km)
//   - Presión EV de la zona (más cargadores cerca = más madura → oportunidad)
//   - Cercanía de competencia (más lejos = más cautivo)
// ============================================================================
export function scoreCompetencia(c3) {
  if (!c3 || !c3.disponible) return { score: null, confidence: 0, components: [], note: 'Capa C3 no disponible' };

  const gap_g95 = val(c3.gap_vs_min_g95);
  const n_super = val(c3.n_supermercados_1km);
  const n_cafes = val(c3.n_cafes_1km);
  const n_rest = val(c3.n_restaurantes_1km);
  const n_ev = val(c3.n_cargadores_ev_osm);
  const dist_comp = val(c3.dist_eess_competencia_m);

  // Gap g95: rango -0.05 (más barato que el mínimo, raro) a +0.20 (muy caro).
  // Si la estación es competidor, no tendremos gap → componente null.
  const components = [
    { key: 'gap_precio', label: 'Posición de precio', weight: 1.4,
      score: norm(gap_g95, -0.05, 0.20, true) }, // invertido: gap alto = malo
    { key: 'comercio_1km', label: 'Riqueza comercial 1km', weight: 1.0,
      score: norm((n_super ?? 0) * 2 + (n_cafes ?? 0) + (n_rest ?? 0) * 0.5, 0, 30) },
    { key: 'ev_zona', label: 'Madurez EV en zona', weight: 0.8,
      // 0 cargadores = 0 puntos (zona "virgen"); 5+ = 100 (zona madura, oportunidad clara)
      score: norm(n_ev, 0, 5) },
    { key: 'cautividad', label: 'Cautividad geográfica', weight: 1.0,
      // Competidor a >2km = score alto; a <500m = bajo
      score: norm(dist_comp, 300, 2500) },
  ];

  return { ...robustAvg(components), components };
}

// ============================================================================
// SCORE C4 · FORTALEZA DEL ACTIVO
// ============================================================================
// Componentes:
//   - N° surtidores (capacidad de despacho)
//   - 24h (rango operativo)
//   - Tienda + Lavado (opcionalidad y márgenes no-fuel)
//   - Superficie (potencial de transformación)
//   - Edad (vejez penaliza capex futuro)
// ============================================================================
export function scoreActivo(c4) {
  if (!c4 || !c4.disponible) return { score: null, confidence: 0, components: [], note: 'Capa C4 no disponible' };

  const n_surt = val(c4.n_surtidores);
  const h24 = val(c4.horas_servicio_24h);
  const tienda = val(c4.tienda);
  const lavado = val(c4.lavado);
  const sup = val(c4.superficie_m2);
  const anyo = val(c4.anyo_construccion);

  const components = [
    { key: 'capacidad', label: 'Capacidad de despacho', weight: 1.2,
      score: norm(n_surt, 2, 10) },
    { key: 'operatividad_24h', label: 'Operatividad 24h', weight: 1.0,
      score: h24 === true ? 100 : (h24 === false ? 30 : null) },
    { key: 'opcionalidad', label: 'Opcionalidad (tienda+lavado)', weight: 1.3,
      score: (tienda != null && lavado != null) ?
              (tienda ? 50 : 0) + (lavado ? 50 : 0) : null },
    { key: 'superficie', label: 'Superficie del solar', weight: 1.0,
      score: norm(sup, 500, 3500) },
    { key: 'edad', label: 'Edad del activo', weight: 0.8,
      score: anyo != null ? norm(anyo, 1970, 2020) : null }, // más reciente = mejor
  ];

  return { ...robustAvg(components), components };
}

// ============================================================================
// SCORE C5 · CALIDAD DEL FLUJO DE TRÁFICO
// ============================================================================
// Componentes:
//   - IMD (vehículos/día)
//   - % pesados (mayor = mayor consumo unitario, pero más volátil)
// ============================================================================
export function scoreMovilidad(c5) {
  if (!c5 || !c5.disponible) return { score: null, confidence: 0, components: [], note: 'Capa C5 no disponible' };

  const imd = val(c5.imd);
  const pct_pes = val(c5.pct_pesados);

  const components = [
    { key: 'imd', label: 'Intensidad de tráfico', weight: 1.8,
      score: norm(imd, 5000, 35000) },
    { key: 'pct_pesados', label: 'Mix pesados/ligeros', weight: 0.6,
      // Curva en U-invertida centrada en ~12% — demasiado bajo o demasiado alto penaliza
      score: pct_pes != null ? 100 - Math.abs(pct_pes - 12) * 5 : null },
  ];

  return { ...robustAvg(components), components };
}

// ============================================================================
// SCORE C6 · REPUTACIÓN
// ============================================================================
// Componentes:
//   - Rating Google Maps (1-5)
//   - Volumen de reseñas (proxy de exposición)
// ============================================================================
export function scoreReputacion(c6) {
  if (!c6 || !c6.disponible) return { score: null, confidence: 0, components: [], note: 'Capa C6 no disponible' };

  const rating = val(c6.rating);
  const n_res = val(c6.n_resenas);

  const components = [
    { key: 'rating', label: 'Rating Google Maps', weight: 1.8,
      score: norm(rating, 3.0, 5.0) },
    { key: 'volumen_resenas', label: 'Volumen de reseñas', weight: 0.6,
      // Log para que pase de 0 → 50 a 100 reseñas; de 100 → 500 sea menor diferencial
      score: n_res != null ? norm(Math.log10(Math.max(1, n_res)), 1.0, 3.0) : null },
  ];

  return { ...robustAvg(components), components };
}

// ============================================================================
// STRATEGIC SCORE COMPUESTO
// ============================================================================
// Pondera las 5 dimensiones disponibles (C2..C6). C1 (interno) queda fuera
// hasta Fase 2.
//
// Pesos por defecto:
//   Demanda     0.20 — qué tan atractivo es el mercado
//   Competencia 0.20 — posición competitiva
//   Activo      0.25 — fortaleza del activo (lo que se puede transformar)
//   Movilidad   0.20 — calidad del flujo
//   Reputación  0.15 — percepción actual
// ============================================================================
export const WEIGHTS_DEFAULT = {
  demanda: 0.20,
  competencia: 0.20,
  activo: 0.25,
  movilidad: 0.20,
  reputacion: 0.15,
};

export function strategicScore(station, weights = WEIGHTS_DEFAULT) {
  const d = scoreDemanda(station.capas.c2_demanda);
  const c = scoreCompetencia(station.capas.c3_competencia);
  const a = scoreActivo(station.capas.c4_activo);
  const m = scoreMovilidad(station.capas.c5_movilidad);
  const r = scoreReputacion(station.capas.c6_reputacion);

  const dimensions = { demanda: d, competencia: c, activo: a, movilidad: m, reputacion: r };

  const items = [
    { score: d.score, weight: weights.demanda,     key: 'demanda',     conf: d.confidence },
    { score: c.score, weight: weights.competencia, key: 'competencia', conf: c.confidence },
    { score: a.score, weight: weights.activo,      key: 'activo',      conf: a.confidence },
    { score: m.score, weight: weights.movilidad,   key: 'movilidad',   conf: m.confidence },
    { score: r.score, weight: weights.reputacion,  key: 'reputacion',  conf: r.confidence },
  ];
  const present = items.filter(i => i.score != null);
  if (present.length === 0) {
    return { score: null, confidence: 0, dimensions, label: 'Sin datos' };
  }

  const totalW = present.reduce((s, i) => s + i.weight, 0);
  const weightedScore = present.reduce((s, i) => s + i.score * i.weight, 0) / totalW;
  // Confianza global = media ponderada de confianzas de dimensión * % dimensiones presentes
  const dimsCoverage = present.length / items.length;
  const confAvg = present.reduce((s, i) => s + i.conf * i.weight, 0) / totalW;
  const confidence = Math.round(confAvg * dimsCoverage);

  return {
    score: Math.round(weightedScore),
    confidence,
    dimensions,
    label: scoreLabel(weightedScore),
  };
}

export function scoreLabel(score) {
  if (score == null) return 'Sin datos';
  if (score >= 75) return 'Excelente';
  if (score >= 60) return 'Sólida';
  if (score >= 45) return 'Aceptable';
  if (score >= 30) return 'Vulnerable';
  return 'Crítica';
}

export function scoreColor(score) {
  if (score == null) return 'var(--text-dim)';
  if (score >= 75) return 'var(--green)';
  if (score >= 60) return '#0891b2'; // cyan
  if (score >= 45) return 'var(--yellow)';
  if (score >= 30) return '#ea580c'; // orange
  return 'var(--accent)';
}
