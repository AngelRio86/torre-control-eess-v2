// ============================================================================
// MOTOR DE TRANSFORMACIÓN · Torre de Control EESS v2
// ============================================================================
// Recomienda una "pathway" estratégica para cada estación Petronor en base a
// señales observables. NO es una caja negra: cada pathway genera un score de
// ajuste con la lista de señales que lo soportan/contradicen.
//
// Pathways disponibles:
//   MODERNIZE       → renovar como EESS fuel-first con upgrade comercial
//   EV_HUB          → transformar a hub de carga rápida + servicios EV
//   CONVENIENCE_HUB → reforzar tienda/foodservice/lavado (no-fuel first)
//   REPOSITION      → ajuste low-touch (precio, operación, marca)
//   DIVEST          → desinvertir / cambio de uso del solar
// ============================================================================

import { strategicScore } from './scoring';

// helper seguro
const val = (kpi) => (kpi && kpi.valor != null ? kpi.valor : null);

// Una "señal" puntúa positivamente o negativamente una pathway.
// score: +1 a +3 = soporta; -1 a -3 = contradice
// Devuelve un objeto { score, label, evidence } para auditoría.
function signal(condition, score, label, evidence) {
  return condition ? { score, label, evidence } : null;
}

// Construye y devuelve todas las señales relevantes de la estación,
// agrupadas por pathway, con evidencia trazable.
function evaluateStation(station) {
  const c2 = station.capas.c2_demanda;
  const c3 = station.capas.c3_competencia;
  const c4 = station.capas.c4_activo;
  const c5 = station.capas.c5_movilidad;
  const c6 = station.capas.c6_reputacion;

  const renta_pc = val(c2?.renta_per_capita);
  const poblacion = val(c2?.poblacion);
  const pct65 = val(c2?.pct_mayores_65);
  const veh_mil = val(c2?.veh_por_mil_hab);

  const gap_g95 = val(c3?.gap_vs_min_g95);
  const n_super = val(c3?.n_supermercados_1km);
  const n_cafes = val(c3?.n_cafes_1km);
  const n_rest = val(c3?.n_restaurantes_1km);
  const n_ev = val(c3?.n_cargadores_ev_osm);
  const dist_comp = val(c3?.dist_eess_competencia_m);

  const n_surt = val(c4?.n_surtidores);
  const h24 = val(c4?.horas_servicio_24h);
  const tienda = val(c4?.tienda);
  const lavado = val(c4?.lavado);
  const sup = val(c4?.superficie_m2);
  const anyo = val(c4?.anyo_construccion);

  const imd = val(c5?.imd);
  const pct_pes = val(c5?.pct_pesados);

  const rating = val(c6?.rating);

  const fmt = (v, unit = '') => v != null ? `${v}${unit}` : 'n/d';

  // ── pathway: MODERNIZE ──────────────────────────────────────────────────
  const modernize = [
    signal(imd != null && imd >= 15000, +3, 'IMD alto', `${fmt(imd)} veh/día`),
    signal(anyo != null && anyo < 2000, +2, 'Activo envejecido', `construido ~${anyo}`),
    signal(tienda === false || lavado === false, +2, 'Faltan servicios actuales',
            `tienda=${tienda ? 'sí' : 'no'}, lavado=${lavado ? 'sí' : 'no'}`),
    signal(sup != null && sup >= 1000, +1, 'Solar suficiente', `${sup} m²`),
    signal(renta_pc != null && renta_pc >= 14000, +1, 'Mercado solvente', `${fmt(renta_pc, ' €/cápita')}`),
    signal(rating != null && rating < 3.8, +1, 'Margen de mejora en servicio', `★${rating}`),
    signal(imd != null && imd < 8000, -2, 'Tráfico insuficiente para capex grande', `${fmt(imd)} veh/día`),
    signal(sup != null && sup < 700, -1, 'Solar pequeño para modernización amplia', `${sup} m²`),
  ].filter(Boolean);

  // ── pathway: EV_HUB ──────────────────────────────────────────────────────
  const evHub = [
    signal(n_ev != null && n_ev >= 1, +2, 'Zona ya tiene EV (validación de demanda)', `${n_ev} cargador(es) en 1km`),
    signal(renta_pc != null && renta_pc >= 16000, +2, 'Renta alta (perfil EV)', `${fmt(renta_pc, ' €/cápita')}`),
    signal(sup != null && sup >= 1500, +2, 'Superficie amplia para HPC', `${sup} m²`),
    signal(imd != null && imd >= 12000, +2, 'Flujo suficiente para captar EV en corredor', `${fmt(imd)} veh/día`),
    signal(h24 === true, +1, 'Ya opera 24h (ventaja para EV nocturno)', ''),
    signal(poblacion != null && poblacion >= 50000, +1, 'Mercado urbano denso', `${poblacion} hab`),
    signal(n_ev === 0, -1, 'Zona EV-virgen (riesgo de pionero)', '0 cargadores en 1km'),
    signal(renta_pc != null && renta_pc < 13000, -2, 'Renta baja → adopción EV lenta', `${fmt(renta_pc, ' €/cápita')}`),
    signal(sup != null && sup < 800, -2, 'Solar pequeño para HPC + bays', `${sup} m²`),
  ].filter(Boolean);

  // ── pathway: CONVENIENCE_HUB ────────────────────────────────────────────
  const convenience = [
    signal(poblacion != null && poblacion >= 80000, +2, 'Mercado denso (compra impulso)', `${poblacion} hab`),
    signal(pct65 != null && pct65 >= 25, +2, 'Población envejecida (mayor uso shop/foodservice)', `${pct65}%`),
    signal(n_super != null && n_super >= 3, -1, 'Competencia retail cercana fuerte', `${n_super} supermercados`),
    signal(n_cafes != null && n_cafes >= 5, +1, 'Zona con cultura de café/foodservice', `${n_cafes} cafés`),
    signal(tienda === true && lavado === true, +1, 'Ya tiene baseline de servicios', ''),
    signal(sup != null && sup >= 1200, +1, 'Espacio para área comercial ampliada', `${sup} m²`),
    signal(imd != null && imd < 10000, +1, 'Bajo tráfico de paso (mejor para destino vs paso)', `${fmt(imd)} veh/día`),
    signal(rating != null && rating >= 4.0, +1, 'Buena reputación (palanca de retención)', `★${rating}`),
  ].filter(Boolean);

  // ── pathway: REPOSITION (low-touch) ─────────────────────────────────────
  const reposition = [
    signal(dist_comp != null && dist_comp < 1000, +2, 'Competencia muy cercana (lucha por precio)', `${dist_comp}m al competidor`),
    signal(gap_g95 != null && gap_g95 > 0.05, +2, 'Precio por encima de la competencia', `+${gap_g95.toFixed(3)} €/L vs min`),
    signal(rating != null && rating < 4.0, +1, 'Reputación mejorable sin capex', `★${rating}`),
    signal(imd != null && imd < 12000, +1, 'Tráfico moderado: capex grande no justifica', `${fmt(imd)} veh/día`),
    signal(sup != null && sup < 1200, +1, 'Solar limitado para grandes proyectos', `${sup} m²`),
    signal(anyo != null && anyo >= 1995, +1, 'Activo no es muy viejo: bastará un retoque', `~${anyo}`),
  ].filter(Boolean);

  // ── pathway: DIVEST ─────────────────────────────────────────────────────
  const divest = [
    signal(imd != null && imd < 7000, +3, 'Tráfico insuficiente', `${fmt(imd)} veh/día`),
    signal(anyo != null && anyo < 1985, +2, 'Activo muy obsoleto', `~${anyo}`),
    signal(tienda === false && lavado === false, +2, 'Sin opcionalidad comercial', ''),
    signal(renta_pc != null && renta_pc < 13000, +1, 'Demanda débil', `${fmt(renta_pc, ' €/cápita')}`),
    signal(dist_comp != null && dist_comp < 600, +1, 'Competencia muy cercana fragmenta el flujo', `${dist_comp}m`),
    signal(sup != null && sup >= 1500, +1, 'Solar con valor alternativo (residencial/logístico)', `${sup} m²`),
    signal(rating != null && rating >= 4.3, -1, 'Reputación buena: difícil destruir valor existente', `★${rating}`),
    signal(imd != null && imd >= 15000, -3, 'Tráfico alto: nunca divestir', `${fmt(imd)} veh/día`),
  ].filter(Boolean);

  return { modernize, evHub, convenience, reposition, divest };
}

// ============================================================================
// META — descripción de pathways (para UI)
// ============================================================================
export const PATHWAYS = {
  MODERNIZE: {
    key: 'MODERNIZE',
    label: 'Modernizar',
    short: 'Renovar como EESS fuel-first con upgrade comercial',
    description: 'Mantener la vocación de combustible, modernizar surtidores, ' +
                  'mejorar imagen y reforzar tienda/lavado.',
    capex: 'Medio',
    horizon: '12-18 meses',
    icon: '🔧',
  },
  EV_HUB: {
    key: 'EV_HUB',
    label: 'EV Hub',
    short: 'Transformar a hub de carga rápida + servicios EV',
    description: 'Instalar 4-8 cargadores HPC, marquesina, foodservice premium y ' +
                  'reducir gradualmente surtidores fósiles.',
    capex: 'Alto',
    horizon: '18-24 meses',
    icon: '⚡',
  },
  CONVENIENCE_HUB: {
    key: 'CONVENIENCE_HUB',
    label: 'Convenience Hub',
    short: 'Reforzar tienda / foodservice / lavado (no-fuel first)',
    description: 'Apostar por el margen no-fuel. Ampliar tienda, foodservice de marca, ' +
                  'lavado premium y servicios de proximidad.',
    capex: 'Medio',
    horizon: '9-15 meses',
    icon: '🛒',
  },
  REPOSITION: {
    key: 'REPOSITION',
    label: 'Reposicionar',
    short: 'Ajuste low-touch: precio, operación, marca',
    description: 'Sin capex grande. Ajuste de pricing, mejora operativa (limpieza, ' +
                  'horarios, personal), refresh de marca.',
    capex: 'Bajo',
    horizon: '3-6 meses',
    icon: '🎯',
  },
  DIVEST: {
    key: 'DIVEST',
    label: 'Desinvertir',
    short: 'Vender / cambio de uso del solar',
    description: 'Estación no recuperable en su forma actual. Venta o cambio de uso ' +
                  '(residencial, logística urbana, suelo industrial).',
    capex: 'Negativo (libera capital)',
    horizon: '6-12 meses',
    icon: '💼',
  },
};

// Suma señales agrupada → devuelve score positivo del fit de la pathway
function pathwayFit(signals) {
  return signals.reduce((s, sig) => s + sig.score, 0);
}

// ============================================================================
// API PRINCIPAL: recomendación por estación
// ============================================================================
export function recommendPathway(station) {
  if (station.tipo !== 'petronor') return null;

  const signals = evaluateStation(station);
  const fits = {
    MODERNIZE: pathwayFit(signals.modernize),
    EV_HUB: pathwayFit(signals.evHub),
    CONVENIENCE_HUB: pathwayFit(signals.convenience),
    REPOSITION: pathwayFit(signals.reposition),
    DIVEST: pathwayFit(signals.divest),
  };

  // Ranking ordenado de pathways
  const ranking = Object.entries(fits)
    .sort(([, a], [, b]) => b - a)
    .map(([key, score]) => ({
      pathway: PATHWAYS[key],
      score,
      signals: key === 'MODERNIZE' ? signals.modernize
              : key === 'EV_HUB' ? signals.evHub
              : key === 'CONVENIENCE_HUB' ? signals.convenience
              : key === 'REPOSITION' ? signals.reposition
              : signals.divest,
    }));

  // ── Reglas de override (decisión final con criterio humano-auditable) ───
  const score = strategicScore(station);
  const c5 = station.capas.c5_movilidad;
  const imd = val(c5?.imd);

  let primary = ranking[0];
  let override_reason = null;

  // Hard rule 1: si IMD < 7.000 → forzar DIVEST/REPOSITION
  if (imd != null && imd < 7000 && primary.pathway.key !== 'DIVEST' && primary.pathway.key !== 'REPOSITION') {
    const divest = ranking.find(r => r.pathway.key === 'DIVEST');
    const reposition = ranking.find(r => r.pathway.key === 'REPOSITION');
    primary = divest.score >= reposition.score ? divest : reposition;
    override_reason = `Override: IMD<7.000 fuerza decisión de cartera (no capex grande)`;
  }

  // Hard rule 2: si score global < 35 → DIVEST no puede ser el último
  if (score.score != null && score.score < 35 && primary.pathway.key === 'EV_HUB') {
    const divest = ranking.find(r => r.pathway.key === 'DIVEST');
    if (divest.score > 0) {
      primary = divest;
      override_reason = `Override: score estratégico crítico (<35) descarta EV_HUB`;
    }
  }

  return {
    primary,
    ranking,
    fits,
    signals,
    override_reason,
    strategic_score: score,
  };
}
