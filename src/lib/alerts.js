// ============================================================================
// MOTOR DE ALERTAS · Torre de Control EESS v2
// ============================================================================
// Genera alertas justificadas con datos observables. Cada alerta tiene:
//   - severity:  'high' | 'medium' | 'low'
//   - category:  'PRICING' | 'REPUTATION' | 'COMPETITIVE' | 'ASSET_GAP' |
//                'EV_RISK' | 'DEMAND' | 'TRAFFIC'
//   - title, message (humano-legible)
//   - evidence: { kpi, value, threshold } para trazabilidad
// ============================================================================

const val = (kpi) => (kpi && kpi.valor != null ? kpi.valor : null);

function alert(severity, category, title, message, evidence) {
  return { severity, category, title, message, evidence };
}

// ============================================================================
// Generador de alertas para UNA estación
// ============================================================================
export function alertsForStation(station) {
  const a = [];
  const c2 = station.capas.c2_demanda;
  const c3 = station.capas.c3_competencia;
  const c4 = station.capas.c4_activo;
  const c5 = station.capas.c5_movilidad;
  const c6 = station.capas.c6_reputacion;

  const isPetronor = station.tipo === 'petronor';

  // ── 1. PRICING (solo Petronor con cluster vs competencia) ───────────────
  const gap_g95 = val(c3?.gap_vs_min_g95);
  const gap_d = val(c3?.gap_vs_min_diesel);
  if (isPetronor) {
    if (gap_g95 != null && gap_g95 >= 0.10) {
      a.push(alert('high', 'PRICING',
        'Precio G95 muy por encima de la competencia',
        `Esta estación está +${gap_g95.toFixed(3)} €/L por encima del competidor más barato del cluster. ` +
        `Riesgo alto de pérdida de cuota.`,
        { kpi: 'gap_vs_min_g95', value: gap_g95, threshold: 0.10 }));
    } else if (gap_g95 != null && gap_g95 >= 0.05) {
      a.push(alert('medium', 'PRICING',
        'Precio G95 por encima del cluster',
        `+${gap_g95.toFixed(3)} €/L vs. competidor más barato. Revisar estrategia de pricing.`,
        { kpi: 'gap_vs_min_g95', value: gap_g95, threshold: 0.05 }));
    }
    if (gap_d != null && gap_d >= 0.10) {
      a.push(alert('high', 'PRICING',
        'Precio diésel muy por encima de la competencia',
        `+${gap_d.toFixed(3)} €/L vs. competidor más barato. El diésel concentra la mayor parte del volumen.`,
        { kpi: 'gap_vs_min_diesel', value: gap_d, threshold: 0.10 }));
    } else if (gap_d != null && gap_d >= 0.05) {
      a.push(alert('medium', 'PRICING',
        'Precio diésel por encima del cluster',
        `+${gap_d.toFixed(3)} €/L vs. competidor más barato.`,
        { kpi: 'gap_vs_min_diesel', value: gap_d, threshold: 0.05 }));
    }
  }

  // ── 2. REPUTATION ───────────────────────────────────────────────────────
  const rating = val(c6?.rating);
  const n_res = val(c6?.n_resenas);
  if (rating != null) {
    if (rating < 3.7) {
      a.push(alert('high', 'REPUTATION',
        'Rating crítico en Google Maps',
        `★${rating} con ${n_res ?? '?'} reseñas. La percepción del cliente está deteriorada y afecta ` +
        `directamente a la conversión de tráfico de paso.`,
        { kpi: 'rating', value: rating, threshold: 3.7 }));
    } else if (rating < 4.0 && n_res != null && n_res >= 100) {
      a.push(alert('medium', 'REPUTATION',
        'Rating por debajo de la media del cluster',
        `★${rating} con ${n_res} reseñas. Mejora low-touch posible (limpieza, atención, surtidores).`,
        { kpi: 'rating', value: rating, threshold: 4.0 }));
    }
  }

  // ── 3. COMPETITIVE (competencia muy cercana) ────────────────────────────
  const dist_comp = val(c3?.dist_eess_competencia_m);
  if (dist_comp != null && dist_comp < 600) {
    a.push(alert('high', 'COMPETITIVE',
      'Competidor a menos de 600 metros',
      `EESS competidora a solo ${dist_comp} m. El cliente puede comparar precio en segundos.`,
      { kpi: 'dist_eess_competencia_m', value: dist_comp, threshold: 600 }));
  } else if (dist_comp != null && dist_comp < 1200) {
    a.push(alert('medium', 'COMPETITIVE',
      'Competencia cercana en 1km',
      `Competidor a ${dist_comp} m. Zona de competencia directa.`,
      { kpi: 'dist_eess_competencia_m', value: dist_comp, threshold: 1200 }));
  }

  // ── 4. ASSET_GAP (déficits de servicio) ─────────────────────────────────
  const tienda = val(c4?.tienda);
  const lavado = val(c4?.lavado);
  const h24 = val(c4?.horas_servicio_24h);
  const imd = val(c5?.imd);
  const anyo = val(c4?.anyo_construccion);

  // Si NO tiene tienda y el tráfico es alto → alerta
  if (tienda === false && imd != null && imd >= 12000) {
    a.push(alert('high', 'ASSET_GAP',
      'Sin tienda en estación con tráfico alto',
      `IMD ${imd.toLocaleString('es-ES')} veh/día sin tienda asociada. Pérdida estructural ` +
      `de ingresos no-fuel.`,
      { kpi: 'tienda', value: false, threshold: 'imd>=12000' }));
  }
  // Si NO tiene lavado y la superficie lo permite → alerta media
  const sup = val(c4?.superficie_m2);
  if (lavado === false && sup != null && sup >= 1200 && imd != null && imd >= 10000) {
    a.push(alert('medium', 'ASSET_GAP',
      'Sin lavado pese a superficie y tráfico suficientes',
      `Solar de ${sup} m² con IMD de ${imd.toLocaleString('es-ES')} veh/día. Ausencia de túnel/lavado ` +
      `desaprovecha margen no-fuel.`,
      { kpi: 'lavado', value: false, threshold: 'sup>=1200 && imd>=10000' }));
  }
  // Activo muy viejo
  if (anyo != null && anyo < 1985) {
    a.push(alert('medium', 'ASSET_GAP',
      'Activo construido hace más de 40 años',
      `Estación construida ~${anyo}. Probable necesidad de capex de modernización ` +
      `o decisión de cartera.`,
      { kpi: 'anyo_construccion', value: anyo, threshold: 1985 }));
  }
  // No 24h con tráfico alto
  if (h24 === false && imd != null && imd >= 15000) {
    a.push(alert('medium', 'ASSET_GAP',
      'Sin servicio 24h en vía de alto tráfico',
      `IMD ${imd.toLocaleString('es-ES')} veh/día sin operación 24h. Oportunidad perdida en franja nocturna.`,
      { kpi: 'horas_servicio_24h', value: false, threshold: 'imd>=15000' }));
  }

  // ── 5. EV_RISK ──────────────────────────────────────────────────────────
  const n_ev = val(c3?.n_cargadores_ev_osm);
  const renta_pc = val(c2?.renta_per_capita);
  if (n_ev != null && n_ev >= 2 && isPetronor) {
    a.push(alert('high', 'EV_RISK',
      'Zona con presencia EV consolidada',
      `${n_ev} cargadores en 1km. Si no hay plan EV propio, riesgo de obsolescencia a 3-5 años.`,
      { kpi: 'n_cargadores_ev_osm', value: n_ev, threshold: 2 }));
  } else if (n_ev === 0 && renta_pc != null && renta_pc >= 16000 && isPetronor) {
    a.push(alert('medium', 'EV_RISK',
      'Zona EV-virgen en mercado de renta alta',
      `0 cargadores en 1km en zona con renta ${renta_pc} €/cápita. Oportunidad de first-mover o riesgo ` +
      `si un competidor entra primero.`,
      { kpi: 'n_cargadores_ev_osm', value: 0, threshold: 'renta>=16000' }));
  }

  // ── 6. DEMAND ───────────────────────────────────────────────────────────
  const pct65 = val(c2?.pct_mayores_65);
  if (pct65 != null && pct65 >= 27) {
    a.push(alert('low', 'DEMAND',
      'Demografía envejecida en el área',
      `${pct65}% mayores de 65 años. Demanda de combustible en declive estructural a largo plazo.`,
      { kpi: 'pct_mayores_65', value: pct65, threshold: 27 }));
  }

  // ── 7. TRAFFIC ──────────────────────────────────────────────────────────
  if (imd != null && imd < 7000) {
    a.push(alert('high', 'TRAFFIC',
      'Tráfico crítico para sostener una EESS',
      `IMD ${imd.toLocaleString('es-ES')} veh/día. Volumen muy bajo: difícil sostener una EESS estándar.`,
      { kpi: 'imd', value: imd, threshold: 7000 }));
  } else if (imd != null && imd < 10000) {
    a.push(alert('medium', 'TRAFFIC',
      'Tráfico moderado',
      `IMD ${imd.toLocaleString('es-ES')} veh/día. Por debajo del óptimo. Capex grande poco justificable.`,
      { kpi: 'imd', value: imd, threshold: 10000 }));
  }

  // Ordenar por severidad
  const sevOrder = { high: 0, medium: 1, low: 2 };
  a.sort((x, y) => sevOrder[x.severity] - sevOrder[y.severity]);

  return a;
}

// ============================================================================
// Agregado de portafolio
// ============================================================================
export function portfolioAlerts(stations) {
  const byStation = {};
  let totalHigh = 0, totalMedium = 0, totalLow = 0;

  for (const s of stations) {
    const a = alertsForStation(s);
    byStation[s.id] = a;
    for (const x of a) {
      if (x.severity === 'high') totalHigh++;
      else if (x.severity === 'medium') totalMedium++;
      else totalLow++;
    }
  }

  return { byStation, totalHigh, totalMedium, totalLow };
}

// ============================================================================
// Helper de UI — color por categoría
// ============================================================================
export const CATEGORY_META = {
  PRICING:     { label: 'Pricing',      icon: '💶', color: 'var(--accent)' },
  REPUTATION:  { label: 'Reputación',   icon: '⭐', color: 'var(--yellow)' },
  COMPETITIVE: { label: 'Competencia',  icon: '⚔️', color: 'var(--accent)' },
  ASSET_GAP:   { label: 'Activo',       icon: '🏗️', color: 'var(--yellow)' },
  EV_RISK:     { label: 'Movilidad EV', icon: '⚡', color: 'var(--blue)' },
  DEMAND:      { label: 'Demanda',      icon: '👥', color: '#7c3aed' },
  TRAFFIC:     { label: 'Tráfico',      icon: '🚗', color: 'var(--blue)' },
};

export const SEVERITY_META = {
  high:   { label: 'Crítica', color: 'var(--accent)', bg: 'var(--accent-soft)', border: 'var(--accent-border)' },
  medium: { label: 'Media',   color: 'var(--yellow)', bg: 'var(--yellow-soft)', border: 'var(--yellow-border)' },
  low:    { label: 'Baja',    color: 'var(--text-sub)', bg: 'var(--bg)',         border: 'var(--border)' },
};
