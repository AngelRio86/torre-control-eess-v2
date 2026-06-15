// Torre de Control EESS · v2 — Bilbao Metropolitano
// Esquema v2: cada KPI lleva metadatos { valor, fuente, fecha, estado }
// 4 Petronor + 6 competidores (Repsol excluido por pertenecer al mismo grupo)

import C3_MITECO from './c3_miteco.json';
import C3_OSM    from './c3_osm.json';
import C2_EUSTAT from './c2_eustat.json';
import C4_ACTIVO from './c4_activo.json';
import C5_AFOROS from './c5_aforos.json';

// ============================================================================
// REGISTRO DE FUENTES
// ============================================================================
export const FUENTES = {
  GMAPS_MANUAL: { id: 'gmaps_manual', label: 'Google Maps (consulta manual)', tipo: 'real' },
  MITECO:       { id: 'miteco',       label: 'MITECO Geoportal de Hidrocarburos', tipo: 'real' },
  CATASTRO:     { id: 'catastro',     label: 'Sede Electrónica del Catastro', tipo: 'real' },
  INE:          { id: 'ine',          label: 'INE — Atlas de Renta de los Hogares 2022', tipo: 'real' },
  EUSTAT:       { id: 'eustat',       label: 'Eustat — Estadística municipal 2024', tipo: 'real' },
  DGT:          { id: 'dgt',          label: 'DGT — Parque de vehículos', tipo: 'real' },
  AFOROS_DGT:   { id: 'aforos_dgt',   label: 'DGT — Mapa de Aforos 2023', tipo: 'real' },
  OPENCHARGE:   { id: 'openchargemap',label: 'OpenChargeMap', tipo: 'real' },
  IDE:          { id: 'ide',          label: 'i-DE — Mapa de capacidad de la red', tipo: 'real' },
  OSM:          { id: 'osm',          label: 'OpenStreetMap (Overpass API)', tipo: 'real' },
  GMAPS_SAT:    { id: 'gmaps_sat',    label: 'Google Maps Satélite + Street View (estimación)', tipo: 'estimado' },
  ESTIMADO:     { id: 'estimado',     label: 'Estimación interna', tipo: 'estimado' },
  NO_DISP:      { id: 'no_disponible',label: 'No disponible', tipo: 'no_disponible' },
};

// ============================================================================
// HELPERS DE CONSTRUCCIÓN DE KPI
// ============================================================================
export const dato = (valor, fuente, fecha) => ({
  valor,
  fuente: fuente.id,
  fecha,
  estado: fuente.tipo,
});

export const noDisp = () => ({
  valor: null,
  fuente: FUENTES.NO_DISP.id,
  fecha: null,
  estado: 'no_disponible',
});

const capaPendiente = (fuentes_previstas) => ({
  disponible: false,
  motivo: 'Pendiente de integración',
  fuentes_previstas,
});

// ============================================================================
// BUILDER · Capa C2 — Demanda territorial (Eustat + INE)
// ============================================================================
function buildC2(stationId) {
  const meta = C2_EUSTAT?.estaciones?.[stationId];
  if (!meta) return capaPendiente(['Eustat', 'INE', 'DGT']);

  const m = C2_EUSTAT.municipios[meta.municipio];
  if (!m) return capaPendiente(['Eustat', 'INE', 'DGT']);

  const fechaE = m.fecha_dato;
  const fechaI = '2022-12-31'; // INE Atlas de Renta 2022 es el último disponible

  return {
    disponible: true,
    parcial: true, // falta DGT parque de vehículos detallado por sección censal
    fuentes_presentes: ['eustat', 'ine'],
    municipio: meta.municipio,
    poblacion:        dato(m.poblacion,             FUENTES.EUSTAT, fechaE),
    edad_media:       dato(m.edad_media,            FUENTES.EUSTAT, fechaE),
    pct_mayores_65:   dato(m.pct_mayores_65,        FUENTES.EUSTAT, fechaE),
    renta_neta_hogar: dato(m.renta_neta_hogar,      FUENTES.INE,    fechaI),
    renta_per_capita: dato(m.renta_per_capita,      FUENTES.INE,    fechaI),
    vehiculos_total:  dato(m.vehiculos_total,       FUENTES.EUSTAT, fechaE),
    veh_por_mil_hab:  dato(m.vehiculos_por_mil_hab, FUENTES.EUSTAT, fechaE),
  };
}

// ============================================================================
// BUILDER · Capa C3 (MITECO + OSM) — sin cambios
// ============================================================================
function buildC3(stationId, tipo) {
  const data = C3_MITECO?.estaciones?.[stationId];
  const osm  = C3_OSM?.estaciones?.[stationId];

  if (!data && !osm) {
    return capaPendiente(['MITECO', 'OpenChargeMap', 'OpenStreetMap']);
  }

  const fecha = data?.fecha_dato || C3_MITECO?.fecha_actualizacion;
  const c3 = {
    disponible: true,
    parcial: true, // EV (OpenChargeMap) aún pendiente
    fuentes_presentes: [data && 'miteco', osm && 'osm'].filter(Boolean),
    miteco_id: data?.miteco_id,
    rotulo_miteco: data?.rotulo,
    horario: data?.horario,
    g95:            data?.g95            != null ? dato(data.g95,            FUENTES.MITECO, fecha) : noDisp(),
    g98:            data?.g98            != null ? dato(data.g98,            FUENTES.MITECO, fecha) : noDisp(),
    diesel_a:       data?.diesel_a       != null ? dato(data.diesel_a,       FUENTES.MITECO, fecha) : noDisp(),
    diesel_premium: data?.diesel_premium != null ? dato(data.diesel_premium, FUENTES.MITECO, fecha) : noDisp(),
  };

  const cluster = data ? C3_MITECO?.clusters?.[stationId] : null;
  if (cluster && tipo === 'petronor') {
    c3.n_competidores_con_dato  = cluster.n_competidores_con_dato;
    c3.media_competencia_g95    = cluster.media_competencia_g95    != null ? dato(cluster.media_competencia_g95,    FUENTES.MITECO, fecha) : noDisp();
    c3.min_competencia_g95      = cluster.min_competencia_g95      != null ? dato(cluster.min_competencia_g95,      FUENTES.MITECO, fecha) : noDisp();
    c3.gap_vs_min_g95           = cluster.gap_vs_min_g95           != null ? dato(cluster.gap_vs_min_g95,           FUENTES.MITECO, fecha) : noDisp();
    c3.media_competencia_diesel = cluster.media_competencia_diesel != null ? dato(cluster.media_competencia_diesel, FUENTES.MITECO, fecha) : noDisp();
    c3.min_competencia_diesel   = cluster.min_competencia_diesel   != null ? dato(cluster.min_competencia_diesel,   FUENTES.MITECO, fecha) : noDisp();
    c3.gap_vs_min_diesel        = cluster.gap_vs_min_diesel        != null ? dato(cluster.gap_vs_min_diesel,        FUENTES.MITECO, fecha) : noDisp();
  }

  if (osm) {
    const fechaO = C3_OSM.fecha_actualizacion;
    const poi = (key) => {
      const b = osm[key];
      if (!b || b.count == null) return noDisp();
      return dato(b.count, FUENTES.OSM, fechaO);
    };
    const dist = (key) => {
      const b = osm[key];
      if (!b || b.nearest_m == null) return noDisp();
      return dato(b.nearest_m, FUENTES.OSM, fechaO);
    };

    c3.radio_poi_m             = C3_OSM.radio_metros;
    c3.n_supermercados_1km     = poi('supermercados');
    c3.n_cafes_1km             = poi('cafes');
    c3.n_restaurantes_1km      = poi('restaurantes');
    c3.n_hoteles_1km           = poi('hoteles');
    c3.n_lavados_1km           = poi('lavados');
    c3.n_cargadores_ev_osm     = poi('cargadores_ev');
    c3.n_eess_competencia_osm  = poi('eess_competencia');

    c3.dist_supermercado_m     = dist('supermercados');
    c3.dist_cafe_m             = dist('cafes');
    c3.dist_restaurante_m      = dist('restaurantes');
    c3.dist_hotel_m            = dist('hoteles');
    c3.dist_eess_competencia_m = dist('eess_competencia');
  }

  return c3;
}

// ============================================================================
// BUILDER · Capa C4 — Activo y opcionalidad (estimación visual)
// ============================================================================
function buildC4(stationId) {
  const d = C4_ACTIVO?.estaciones?.[stationId];
  if (!d) return capaPendiente(['Catastro', 'i-DE']);

  const fecha = C4_ACTIVO.fecha_actualizacion;
  return {
    disponible: true,
    parcial: true, // datos estimados; Catastro auténtico requiere consulta Fase 2
    fuentes_presentes: ['gmaps_sat'],
    n_surtidores:            dato(d.n_surtidores,           FUENTES.GMAPS_SAT, fecha),
    horas_servicio_24h:      dato(d.horas_servicio_24h,     FUENTES.GMAPS_SAT, fecha),
    tienda:                  dato(d.tienda,                 FUENTES.GMAPS_SAT, fecha),
    lavado:                  dato(d.lavado,                 FUENTES.GMAPS_SAT, fecha),
    superficie_m2:           dato(d.superficie_estimada_m2, FUENTES.GMAPS_SAT, fecha),
    tipo_acceso:             dato(d.tipo_acceso,            FUENTES.GMAPS_SAT, fecha),
    anyo_construccion:       dato(d.anyo_construccion_estimado, FUENTES.GMAPS_SAT, fecha),
  };
}

// ============================================================================
// BUILDER · Capa C5 — Movilidad real (Aforos DGT)
// ============================================================================
function buildC5(stationId) {
  const d = C5_AFOROS?.estaciones?.[stationId];
  if (!d) return capaPendiente(['Aforos DGT']);

  const fecha = d.fecha_dato;
  return {
    disponible: true,
    parcial: false, // si tenemos aforos, consideramos completa esta primera versión
    fuentes_presentes: ['aforos_dgt'],
    via:           d.via,
    tramo:         d.tramo,
    tipo_via:      d.tipo_via,
    imd:           dato(d.imd,          FUENTES.AFOROS_DGT, fecha),
    pct_pesados:   dato(d.pct_pesados,  FUENTES.AFOROS_DGT, fecha),
    sentidos:      d.sentidos,
  };
}

// ============================================================================
// BUILDER reutilizable para C6 (existente)
// ============================================================================
const c6 = (rating, n_resenas, fecha = '2026-06-11') => ({
  disponible: true,
  rating:    dato(rating,    FUENTES.GMAPS_MANUAL, fecha),
  n_resenas: dato(n_resenas, FUENTES.GMAPS_MANUAL, fecha),
});

// ============================================================================
// ESTACIONES
// ============================================================================
export const STATIONS = [
  // ────────────────────────────────────────────────────────────────────────
  // PETRONOR · cliente potencial
  // ────────────────────────────────────────────────────────────────────────
  {
    id: 'PET-BIL-001',
    tipo: 'petronor',
    marca: 'Petronor',
    nombre: 'Petronor Bilbao N-634',
    direccion: 'Carretera N-634, 115',
    municipio: 'Bilbao',
    zona: 'Bilbao',
    lat: 43.265278,
    lng: -2.961389,
    accesos: null,
    competidores: ['MOE-BIL-001', 'NAF-BAR-001'],
    capas: {
      c1_interno: capaPendiente(['Sistemas Petronor (Fase 2)']),
      c2_demanda: buildC2('PET-BIL-001'),
      c3_competencia: buildC3('PET-BIL-001', 'petronor'),
      c4_activo: buildC4('PET-BIL-001'),
      c5_movilidad: buildC5('PET-BIL-001'),
      c6_reputacion: c6(3.9, 458),
    },
  },
  {
    id: 'PET-SES-001',
    tipo: 'petronor',
    marca: 'Petronor',
    nombre: 'Petronor Sestao',
    direccion: 'Calle Grupo La Paz, 1 / BI-3739 km 4,7',
    municipio: 'Sestao',
    zona: 'Margen izquierda',
    lat: 43.313194,
    lng: -3.010500,
    accesos: null,
    competidores: ['MOE-POR-001', 'ERO-POR-001'],
    capas: {
      c1_interno: capaPendiente(['Sistemas Petronor (Fase 2)']),
      c2_demanda: buildC2('PET-SES-001'),
      c3_competencia: buildC3('PET-SES-001', 'petronor'),
      c4_activo: buildC4('PET-SES-001'),
      c5_movilidad: buildC5('PET-SES-001'),
      c6_reputacion: c6(4.4, 36),
    },
  },
  {
    id: 'PET-ERA-057',
    tipo: 'petronor',
    marca: 'Petronor',
    nombre: 'Petronor Erandio Asua-Loiu',
    direccion: 'BI-3704 Asua-Loiu, km 57',
    municipio: 'Erandio',
    zona: 'Margen derecha',
    lat: 43.307528,
    lng: -2.944833,
    accesos: null,
    competidores: ['SHE-ERA-001', 'ERO-LEI-001'],
    capas: {
      c1_interno: capaPendiente(['Sistemas Petronor (Fase 2)']),
      c2_demanda: buildC2('PET-ERA-057'),
      c3_competencia: buildC3('PET-ERA-057', 'petronor'),
      c4_activo: buildC4('PET-ERA-057'),
      c5_movilidad: buildC5('PET-ERA-057'),
      c6_reputacion: c6(4.0, 361),
    },
  },
  {
    id: 'PET-ERA-055',
    tipo: 'petronor',
    marca: 'Petronor',
    nombre: 'Petronor Erandio km 5,5',
    direccion: 'BI-3704 km 5,5',
    municipio: 'Erandio-Goikoa',
    zona: 'Margen derecha',
    lat: 43.291000,
    lng: -2.959889,
    accesos: [
      { sentido: 'carril derecho',   lat: 43.291000, lng: -2.959889 },
      { sentido: 'carril izquierdo', lat: 43.291222, lng: -2.960417 },
    ],
    competidores: ['SHE-ERA-001', 'ERO-LEI-001'],
    capas: {
      c1_interno: capaPendiente(['Sistemas Petronor (Fase 2)']),
      c2_demanda: buildC2('PET-ERA-055'),
      c3_competencia: buildC3('PET-ERA-055', 'petronor'),
      c4_activo: buildC4('PET-ERA-055'),
      c5_movilidad: buildC5('PET-ERA-055'),
      c6_reputacion: c6(4.0, 113),
    },
  },

  // ────────────────────────────────────────────────────────────────────────
  // COMPETIDORES · benchmark externo
  // ────────────────────────────────────────────────────────────────────────
  {
    id: 'MOE-BIL-001',
    tipo: 'competidor',
    marca: 'Moeve / Cepsa',
    nombre: 'Moeve / Cepsa — Juan de Garay',
    direccion: 'Calle Juan de Garay, 9',
    municipio: 'Bilbao',
    zona: 'Bilbao',
    lat: 43.255917,
    lng: -2.932972,
    competidor_de: ['PET-BIL-001'],
    distancia_km: { 'PET-BIL-001': 2.53 },
    capas: {
      c1_interno: capaPendiente(['Benchmark sectorial AOP/CNMC (Fase 2)']),
      c2_demanda: buildC2('MOE-BIL-001'),
      c3_competencia: buildC3('MOE-BIL-001', 'competidor'),
      c4_activo: buildC4('MOE-BIL-001'),
      c5_movilidad: buildC5('MOE-BIL-001'),
      c6_reputacion: c6(4.0, 66),
    },
  },
  {
    id: 'NAF-BAR-001',
    tipo: 'competidor',
    marca: 'Nafte',
    nombre: 'Nafte — Retuerto',
    direccion: 'Calle Retuerto, 42',
    municipio: 'Barakaldo',
    zona: 'Margen izquierda',
    lat: 43.286667,
    lng: -3.002750,
    competidor_de: ['PET-BIL-001'],
    distancia_km: { 'PET-BIL-001': 4.11 },
    capas: {
      c1_interno: capaPendiente(['Benchmark sectorial AOP/CNMC (Fase 2)']),
      c2_demanda: buildC2('NAF-BAR-001'),
      c3_competencia: buildC3('NAF-BAR-001', 'competidor'),
      c4_activo: buildC4('NAF-BAR-001'),
      c5_movilidad: buildC5('NAF-BAR-001'),
      c6_reputacion: c6(4.4, 36),
    },
  },
  {
    id: 'MOE-POR-001',
    tipo: 'competidor',
    marca: 'Moeve / Cepsa',
    nombre: 'Moeve / Cepsa — Portugalete',
    direccion: 'Ramón y Cajal, s/n',
    municipio: 'Portugalete',
    zona: 'Margen izquierda',
    lat: 43.315389,
    lng: -3.021278,
    competidor_de: ['PET-SES-001'],
    distancia_km: { 'PET-SES-001': 0.91 },
    capas: {
      c1_interno: capaPendiente(['Benchmark sectorial AOP/CNMC (Fase 2)']),
      c2_demanda: buildC2('MOE-POR-001'),
      c3_competencia: buildC3('MOE-POR-001', 'competidor'),
      c4_activo: buildC4('MOE-POR-001'),
      c5_movilidad: buildC5('MOE-POR-001'),
      c6_reputacion: c6(4.0, 220),
    },
  },
  {
    id: 'ERO-POR-001',
    tipo: 'competidor',
    marca: 'Eroski',
    nombre: 'Eroski — Vega de Ibarra',
    direccion: 'Avenida Vega de Ibarra, s/n',
    municipio: 'Portugalete',
    zona: 'Margen izquierda',
    lat: 43.311639,
    lng: -3.024278,
    competidor_de: ['PET-SES-001'],
    distancia_km: { 'PET-SES-001': 1.13 },
    capas: {
      c1_interno: capaPendiente(['Benchmark sectorial AOP/CNMC (Fase 2)']),
      c2_demanda: buildC2('ERO-POR-001'),
      c3_competencia: buildC3('ERO-POR-001', 'competidor'),
      c4_activo: buildC4('ERO-POR-001'),
      c5_movilidad: buildC5('ERO-POR-001'),
      c6_reputacion: c6(4.0, 222),
    },
  },
  {
    id: 'SHE-ERA-001',
    tipo: 'competidor',
    marca: 'Shell',
    nombre: 'Shell — Ctra. Lutxana-Asúa',
    direccion: 'Ctra. Lutxana-Asúa, 36 km, Centro Comercial M',
    municipio: 'Erandio',
    zona: 'Margen derecha',
    lat: 43.303333,
    lng: -2.952833,
    competidor_de: ['PET-ERA-057', 'PET-ERA-055'],
    distancia_km: { 'PET-ERA-057': 0.80, 'PET-ERA-055': 1.49 },
    capas: {
      c1_interno: capaPendiente(['Benchmark sectorial AOP/CNMC (Fase 2)']),
      c2_demanda: buildC2('SHE-ERA-001'),
      c3_competencia: buildC3('SHE-ERA-001', 'competidor'),
      c4_activo: buildC4('SHE-ERA-001'),
      c5_movilidad: buildC5('SHE-ERA-001'),
      c6_reputacion: c6(4.1, 167),
    },
  },
  {
    id: 'ERO-LEI-001',
    tipo: 'competidor',
    marca: 'Eroski',
    nombre: 'Eroski — Avenida Iparraguirre',
    direccion: 'Avenida Iparraguirre, 110',
    municipio: 'Leioa',
    zona: 'Margen derecha',
    lat: 43.317694,
    lng: -2.973194,
    competidor_de: ['PET-ERA-057', 'PET-ERA-055'],
    distancia_km: { 'PET-ERA-057': 2.56, 'PET-ERA-055': 3.16 },
    capas: {
      c1_interno: capaPendiente(['Benchmark sectorial AOP/CNMC (Fase 2)']),
      c2_demanda: buildC2('ERO-LEI-001'),
      c3_competencia: buildC3('ERO-LEI-001', 'competidor'),
      c4_activo: buildC4('ERO-LEI-001'),
      c5_movilidad: buildC5('ERO-LEI-001'),
      c6_reputacion: c6(4.0, 2206),
    },
  },
];

// ============================================================================
// PLACEHOLDER · Alertas y Escenarios
// Se regeneran en la Fase 5 con la nueva lógica del v2.
// ============================================================================
export const ALERTAS = [];
export const ESCENARIOS = {};
