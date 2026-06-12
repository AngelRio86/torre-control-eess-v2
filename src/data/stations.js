// Torre de Control EESS · v2 — Bilbao Metropolitano
// Esquema v2: cada KPI lleva metadatos { valor, fuente, fecha, estado }
// 4 Petronor + 6 competidores (Repsol excluido por pertenecer al mismo grupo)

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
// HELPERS
// ============================================================================
// Constructor de KPI con metadatos. Uso: dato(1.689, FUENTES.MITECO, '2026-06-11')
export const dato = (valor, fuente, fecha) => ({
  valor,
  fuente: fuente.id,
  fecha,
  estado: fuente.tipo,
});

// KPI marcado como no disponible (placeholder visible en UI)
export const noDisp = () => ({
  valor: null,
  fuente: FUENTES.NO_DISP.id,
  fecha: null,
  estado: 'no_disponible',
});

// Capa pendiente de integración. La UI la pinta como estado 'pendiente'.
const capaPendiente = (fuentes_previstas) => ({
  disponible: false,
  motivo: 'Pendiente de integración',
  fuentes_previstas,
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
      c2_demanda: capaPendiente(['INE', 'Eustat', 'DGT', 'Catastro']),
      c3_competencia: capaPendiente(['MITECO', 'OpenChargeMap', 'OpenStreetMap']),
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
      c3_competencia: capaPendiente(['MITECO', 'OpenChargeMap', 'OpenStreetMap']),
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
      c3_competencia: capaPendiente(['MITECO', 'OpenChargeMap', 'OpenStreetMap']),
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
    // Entidad única con dos accesos físicos (carriles opuestos sin conexión).
    // El mapa renderiza ambos puntos unidos por una línea suave.
    accesos: [
      { sentido: 'carril derecho',   lat: 43.291000, lng: -2.959889 },
      { sentido: 'carril izquierdo', lat: 43.291222, lng: -2.960417 },
    ],
    competidores: ['SHE-ERA-001', 'ERO-LEI-001'],
    capas: {
      c1_interno: capaPendiente(['Sistemas Petronor (Fase 2)']),
      c2_demanda: capaPendiente(['INE', 'Eustat', 'DGT', 'Catastro']),
      c3_competencia: capaPendiente(['MITECO', 'OpenChargeMap', 'OpenStreetMap']),
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
  // (registros únicos con relación N:M vía competidor_de)
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
      c3_competencia: capaPendiente(['MITECO', 'OpenChargeMap', 'OpenStreetMap']),
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
      c3_competencia: capaPendiente(['MITECO', 'OpenChargeMap', 'OpenStreetMap']),
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
      c3_competencia: capaPendiente(['MITECO', 'OpenChargeMap', 'OpenStreetMap']),
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
      c3_competencia: capaPendiente(['MITECO', 'OpenChargeMap', 'OpenStreetMap']),
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
      c3_competencia: capaPendiente(['MITECO', 'OpenChargeMap', 'OpenStreetMap']),
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
      c3_competencia: capaPendiente(['MITECO', 'OpenChargeMap', 'OpenStreetMap']),
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
