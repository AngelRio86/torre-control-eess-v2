// Torre de Control EESS · v2 — Bilbao Metropolitano
// Esquema v2: cada KPI lleva metadatos { valor, fuente, fecha, estado }
// 4 Petronor + 6 competidores (Repsol excluido por pertenecer al mismo grupo)

import C3_MITECO from './c3_miteco.json';

// ============================================================================
// REGISTRO DE FUENTES
// ============================================================================
export const FUENTES = {
  GMAPS_MANUAL: { id: 'gmaps_manual', label: 'Google Maps (consulta manual)', tipo: 'real' },
  MITECO:       { id: 'miteco',       label: 'MITECO Geoportal de Hidrocarburos', tipo: 'real' },
  CATASTRO:     { id: 'catastro',     label: 'Sede Electrónica del Catastro', tipo: 'real' },
  INE:          { id: 'ine',          label: 'INE — Padrón + Atlas de Renta', tipo: 'real' },
  EUSTAT:       { id: 'eustat',       label: 'Eustat', tipo: 'real' },
  DGT:          { id: 'dgt',          label: 'DGT — Parque de vehículos', tipo: 'real' },
  AFOROS_DGT:   { id: 'aforos_dgt',   label: 'DGT — Mapa de aforos', tipo: 'real' },
  OPENCHARGE:   { id: 'openchargemap',label: 'OpenChargeMap', tipo: 'real' },
  IDE:          { id: 'ide',          label: 'i-DE — Mapa de capacidad de la red', tipo: 'real' },
  OSM:          { id: 'osm',          label: 'OpenStreetMap (Overpass API)', tipo: 'real' },
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
// BUILDER · Capa C3 a partir de c3_miteco.json
// Si el script de ingesta aún no se ha ejecutado, el JSON está vacío y la capa
// queda como "pendiente". Una vez ejecutado `python3 scripts/fetch_miteco.py`,
// la capa se rellena automáticamente con los precios reales.
// ============================================================================
function buildC3(stationId, tipo) {
  const data = C3_MITECO?.estaciones?.[stationId];
  if (!data) {
    return capaPendiente(['MITECO', 'OpenChargeMap', 'OpenStreetMap']);
  }

  const fecha = data.fecha_dato || C3_MITECO.fecha_actualizacion;
  const c3 = {
    disponible: true,
    parcial: true, // EV (OpenChargeMap) y POIs (OSM) aún pendientes en Fase 4
    miteco_id: data.miteco_id,
    rotulo_miteco: data.rotulo,
    horario: data.horario,
    g95:            data.g95            != null ? dato(data.g95,            FUENTES.MITECO, fecha) : noDisp(),
    g98:            data.g98            != null ? dato(data.g98,            FUENTES.MITECO, fecha) : noDisp(),
    diesel_a:       data.diesel_a       != null ? dato(data.diesel_a,       FUENTES.MITECO, fecha) : noDisp(),
    diesel_premium: data.diesel_premium != null ? dato(data.diesel_premium, FUENTES.MITECO, fecha) : noDisp(),
  };

  // Para Petronor: añadir métricas de cluster (vs. sus 2 competidores)
  const cluster = C3_MITECO?.clusters?.[stationId];
  if (cluster && tipo === 'petronor') {
    c3.n_competidores_con_dato  = cluster.n_competidores_con_dato;
    c3.media_competencia_g95    = cluster.media_competencia_g95    != null ? dato(cluster.media_competencia_g95,    FUENTES.MITECO, fecha) : noDisp();
    c3.min_competencia_g95      = cluster.min_competencia_g95      != null ? dato(cluster.min_competencia_g95,      FUENTES.MITECO, fecha) : noDisp();
    c3.gap_vs_min_g95           = cluster.gap_vs_min_g95           != null ? dato(cluster.gap_vs_min_g95,           FUENTES.MITECO, fecha) : noDisp();
    c3.media_competencia_diesel = cluster.media_competencia_diesel != null ? dato(cluster.media_competencia_diesel, FUENTES.MITECO, fecha) : noDisp();
    c3.min_competencia_diesel   = cluster.min_competencia_diesel   != null ? dato(cluster.min_competencia_diesel,   FUENTES.MITECO, fecha) : noDisp();
    c3.gap_vs_min_diesel        = cluster.gap_vs_min_diesel        != null ? dato(cluster.gap_vs_min_diesel,        FUENTES.MITECO, fecha) : noDisp();
  }

  return c3;
}

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
      c2_demanda: capaPendiente(['INE', 'Eustat', 'DGT', 'Catastro']),
      c3_competencia: buildC3('PET-BIL-001', 'petronor'),
      c4_activo: capaPendiente(['Catastro', 'i-DE']),
      c5_movilidad: capaPendiente(['Aforos DGT']),
      c6_reputacion: {
        disponible: true,
        rating:    dato(3.9, FUENTES.GMAPS_MANUAL, '2026-06-11'),
        n_resenas: dato(458, FUENTES.GMAPS_MANUAL, '2026-06-11'),
      },
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
      c2_demanda: capaPendiente(['INE', 'Eustat', 'DGT', 'Catastro']),
      c3_competencia: buildC3('PET-SES-001', 'petronor'),
      c4_activo: capaPendiente(['Catastro', 'i-DE']),
      c5_movilidad: capaPendiente(['Aforos DGT']),
      c6_reputacion: {
        disponible: true,
        rating:    dato(4.4, FUENTES.GMAPS_MANUAL, '2026-06-11'),
        n_resenas: dato(36, FUENTES.GMAPS_MANUAL, '2026-06-11'),
      },
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
      c2_demanda: capaPendiente(['INE', 'Eustat', 'DGT', 'Catastro']),
      c3_competencia: buildC3('PET-ERA-057', 'petronor'),
      c4_activo: capaPendiente(['Catastro', 'i-DE']),
      c5_movilidad: capaPendiente(['Aforos DGT']),
      c6_reputacion: {
        disponible: true,
        rating:    dato(4.0, FUENTES.GMAPS_MANUAL, '2026-06-11'),
        n_resenas: dato(361, FUENTES.GMAPS_MANUAL, '2026-06-11'),
      },
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
      c2_demanda: capaPendiente(['INE', 'Eustat', 'DGT', 'Catastro']),
      c3_competencia: buildC3('PET-ERA-055', 'petronor'),
      c4_activo: capaPendiente(['Catastro', 'i-DE']),
      c5_movilidad: capaPendiente(['Aforos DGT']),
      c6_reputacion: {
        disponible: true,
        rating:    dato(4.0, FUENTES.GMAPS_MANUAL, '2026-06-11'),
        n_resenas: dato(113, FUENTES.GMAPS_MANUAL, '2026-06-11'),
      },
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
      c2_demanda: capaPendiente(['INE', 'Eustat', 'DGT', 'Catastro']),
      c3_competencia: buildC3('MOE-BIL-001', 'competidor'),
      c4_activo: capaPendiente(['Catastro', 'i-DE']),
      c5_movilidad: capaPendiente(['Aforos DGT']),
      c6_reputacion: {
        disponible: true,
        rating:    dato(4.0, FUENTES.GMAPS_MANUAL, '2026-06-11'),
        n_resenas: dato(66, FUENTES.GMAPS_MANUAL, '2026-06-11'),
      },
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
      c2_demanda: capaPendiente(['INE', 'Eustat', 'DGT', 'Catastro']),
      c3_competencia: buildC3('NAF-BAR-001', 'competidor'),
      c4_activo: capaPendiente(['Catastro', 'i-DE']),
      c5_movilidad: capaPendiente(['Aforos DGT']),
      c6_reputacion: {
        disponible: true,
        rating:    dato(4.4, FUENTES.GMAPS_MANUAL, '2026-06-11'),
        n_resenas: dato(36, FUENTES.GMAPS_MANUAL, '2026-06-11'),
      },
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
      c2_demanda: capaPendiente(['INE', 'Eustat', 'DGT', 'Catastro']),
      c3_competencia: buildC3('MOE-POR-001', 'competidor'),
      c4_activo: capaPendiente(['Catastro', 'i-DE']),
      c5_movilidad: capaPendiente(['Aforos DGT']),
      c6_reputacion: {
        disponible: true,
        rating:    dato(4.0, FUENTES.GMAPS_MANUAL, '2026-06-11'),
        n_resenas: dato(220, FUENTES.GMAPS_MANUAL, '2026-06-11'),
      },
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
      c2_demanda: capaPendiente(['INE', 'Eustat', 'DGT', 'Catastro']),
      c3_competencia: buildC3('ERO-POR-001', 'competidor'),
      c4_activo: capaPendiente(['Catastro', 'i-DE']),
      c5_movilidad: capaPendiente(['Aforos DGT']),
      c6_reputacion: {
        disponible: true,
        rating:    dato(4.0, FUENTES.GMAPS_MANUAL, '2026-06-11'),
        n_resenas: dato(222, FUENTES.GMAPS_MANUAL, '2026-06-11'),
      },
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
      c2_demanda: capaPendiente(['INE', 'Eustat', 'DGT', 'Catastro']),
      c3_competencia: buildC3('SHE-ERA-001', 'competidor'),
      c4_activo: capaPendiente(['Catastro', 'i-DE']),
      c5_movilidad: capaPendiente(['Aforos DGT']),
      c6_reputacion: {
        disponible: true,
        rating:    dato(4.1, FUENTES.GMAPS_MANUAL, '2026-06-11'),
        n_resenas: dato(167, FUENTES.GMAPS_MANUAL, '2026-06-11'),
      },
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
      c2_demanda: capaPendiente(['INE', 'Eustat', 'DGT', 'Catastro']),
      c3_competencia: buildC3('ERO-LEI-001', 'competidor'),
      c4_activo: capaPendiente(['Catastro', 'i-DE']),
      c5_movilidad: capaPendiente(['Aforos DGT']),
      c6_reputacion: {
        disponible: true,
        rating:    dato(4.0, FUENTES.GMAPS_MANUAL, '2026-06-11'),
        n_resenas: dato(2206, FUENTES.GMAPS_MANUAL, '2026-06-11'),
      },
    },
  },
];

// ============================================================================
// PLACEHOLDER · Alertas y Escenarios
// Se regeneran en la Fase 5 con la nueva lógica del v2.
// ============================================================================
export const ALERTAS = [];
export const ESCENARIOS = {};
