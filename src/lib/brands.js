// Colores e iniciales por marca para tags, marcadores de mapa y leyendas.
// Mantener sincronizado con el campo `marca` de src/data/stations.js.

export const BRAND_COLORS = {
  'Petronor':        { hex: '#C0001A', initial: 'P', bg_soft: '#FFF1F2' },
  'Moeve / Cepsa':   { hex: '#1976D2', initial: 'M', bg_soft: '#EFF6FF' },
  'Shell':           { hex: '#D4A017', initial: 'S', bg_soft: '#FFFBEB' },
  'Eroski':          { hex: '#EB5E28', initial: 'E', bg_soft: '#FFF4ED' },
  'Nafte':           { hex: '#5E35B1', initial: 'N', bg_soft: '#F5F3FF' },
};

export const getBrand = (marca) =>
  BRAND_COLORS[marca] || { hex: '#6B7280', initial: '?', bg_soft: '#F3F4F6' };

export const BRAND_LIST = Object.keys(BRAND_COLORS);
