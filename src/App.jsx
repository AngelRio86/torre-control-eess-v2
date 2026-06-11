import { STATIONS } from './data/stations';

export default function App() {
  const petronor = STATIONS.filter(s => s.tipo === 'petronor');
  const competidores = STATIONS.filter(s => s.tipo === 'competidor');

  return (
    <div className="flex h-screen w-screen overflow-hidden flex-col" style={{ background:'var(--bg)' }}>
      <header className="flex items-center justify-between px-5 py-2.5 border-b shrink-0" style={{ background:'var(--surface)', borderColor:'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background:'var(--accent)' }} />
          <span style={{ fontFamily:'DM Serif Display, serif', color:'var(--text-head)', fontSize:'15px' }}>
            Torre de Control · Estaciones de Servicio · Bilbao Metropolitano
          </span>
        </div>
        <div className="flex items-center gap-3" style={{ fontSize:'11px', color:'var(--text-dim)' }}>
          <span style={{ fontFamily:'JetBrains Mono, monospace' }}>
            BILBAO METROPOLITANO · {petronor.length} EESS + {competidores.length} COMP
          </span>
          <span style={{ fontFamily:'JetBrains Mono, monospace', background:'var(--bg)', border:'1px solid var(--border)', padding:'2px 8px', borderRadius:'4px' }}>
            {new Date().toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'}).toUpperCase()}
          </span>
        </div>
      </header>
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto fade-up">
          <div className="mb-8">
            <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:'10px', color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'6px' }}>
              Fase 1 · Modelo de datos cargado
            </div>
            <h2 style={{ fontFamily:'DM Serif Display, serif', fontSize:'26px', color:'var(--text-head)', marginBottom:'8px', lineHeight:1.2 }}>
              {STATIONS.length} estaciones registradas
            </h2>
            <p style={{ fontSize:'13px', color:'var(--text-sub)', maxWidth:'56ch' }}>
              UI completa pendiente (Sidebar, MapView, StationDetail, Comparador). Esta vista placeholder valida que el esquema v2 carga correctamente con metadatos de fuente por KPI.
            </p>
          </div>
          <section className="mb-8">
            <div className="flex items-baseline justify-between mb-3">
              <h3 style={{ fontFamily:'JetBrains Mono, monospace', fontSize:'11px', color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
                Petronor · {petronor.length}
              </h3>
              <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:'10px', color:'var(--text-dim)' }}>cliente potencial</span>
            </div>
            <div className="space-y-2">
              {petronor.map(s => (
                <div key={s.id} className="px-4 py-3 rounded-md border" style={{ background:'var(--surface)', borderColor:'var(--border)' }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div style={{ fontSize:'13px', color:'var(--text-head)', fontWeight:500 }}>{s.nombre}</div>
                      <div style={{ fontSize:'11px', color:'var(--text-sub)', marginTop:'2px' }}>{s.direccion} · {s.municipio}</div>
                      {s.accesos && (
                        <div style={{ fontSize:'10px', color:'var(--text-dim)', marginTop:'4px', fontFamily:'JetBrains Mono, monospace' }}>
                          {s.accesos.length} accesos físicos
                        </div>
                      )}
                    </div>
                    <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:'10px', color:'var(--text-dim)' }}>{s.id}</div>
                  </div>
                  {s.competidores && s.competidores.length > 0 && (
                    <div style={{ fontSize:'10px', color:'var(--text-dim)', marginTop:'8px', paddingTop:'8px', borderTop:'1px solid var(--border-soft)', fontFamily:'JetBrains Mono, monospace' }}>
                      ↳ Competidores: {s.competidores.join(' · ')}
                    </div>
                  )}
                  {s.capas?.c6_reputacion?.rating?.valor && (
                    <div style={{ fontSize:'10px', color:'var(--text-sub)', marginTop:'4px', fontFamily:'JetBrains Mono, monospace' }}>
                      ● C6 Reputación · {s.capas.c6_reputacion.rating.valor} ★ ({s.capas.c6_reputacion.n_resenas.valor} reseñas)
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
          <section>
            <div className="flex items-baseline justify-between mb-3">
              <h3 style={{ fontFamily:'JetBrains Mono, monospace', fontSize:'11px', color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
                Competidores · {competidores.length}
              </h3>
              <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:'10px', color:'var(--text-dim)' }}>benchmark externo</span>
            </div>
            <div className="space-y-2">
              {competidores.map(s => (
                <div key={s.id} className="px-4 py-3 rounded-md border" style={{ background:'var(--surface)', borderColor:'var(--border)' }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div style={{ fontSize:'13px', color:'var(--text-head)', fontWeight:500 }}>{s.nombre}</div>
                      <div style={{ fontSize:'11px', color:'var(--text-sub)', marginTop:'2px' }}>
                        {s.direccion} · {s.municipio} · <span style={{ color:'var(--text-dim)' }}>{s.marca}</span>
                      </div>
                    </div>
                    <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:'10px', color:'var(--text-dim)' }}>{s.id}</div>
                  </div>
                  <div style={{ fontSize:'10px', color:'var(--text-dim)', marginTop:'8px', paddingTop:'8px', borderTop:'1px solid var(--border-soft)', fontFamily:'JetBrains Mono, monospace' }}>
                    ↳ Competidor de: {s.competidor_de.map(pid => `${pid} (${s.distancia_km[pid]} km)`).join(' · ')}
                  </div>
                  {s.capas?.c6_reputacion?.rating?.valor && (
                    <div style={{ fontSize:'10px', color:'var(--text-sub)', marginTop:'4px', fontFamily:'JetBrains Mono, monospace' }}>
                      ● C6 Reputación · {s.capas.c6_reputacion.rating.valor} ★ ({s.capas.c6_reputacion.n_resenas.valor} reseñas)
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
