import { useState } from 'react';
import Sidebar from './components/Sidebar';
import MapView from './components/MapView';
import StationDetail from './components/StationDetail';
import { STATIONS } from './data/stations';

export default function App() {
  const [selectedId, setSelectedId] = useState(null);
  const [view, setView] = useState('map');
  const selected = STATIONS.find(s => s.id === selectedId);

  const handleSelect = id => { setSelectedId(id); setView('detail'); };
  const handleBack  = () => { setView('map'); setSelectedId(null); };

  const nPetronor = STATIONS.filter(s => s.tipo === 'petronor').length;
  const nCompetidores = STATIONS.filter(s => s.tipo === 'competidor').length;

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar stations={STATIONS} selectedId={selectedId} onSelect={handleSelect} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header
          className="flex items-center justify-between px-5 py-2.5 border-b shrink-0"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-3">
            {view === 'detail' && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 mr-2 transition-opacity hover:opacity-60"
                style={{ fontSize: '12px', color: 'var(--text-sub)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 5l-7 7 7 7" />
                </svg>
                Volver al mapa
              </button>
            )}
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
            <span style={{
              fontFamily: 'DM Serif Display, serif',
              color: 'var(--text-head)',
              fontSize: '15px',
            }}>
              Torre de Control · Estaciones de Servicio · Bilbao Metropolitano
            </span>
          </div>
          <div className="flex items-center gap-3" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              BILBAO METROPOLITANO · {nPetronor} EESS + {nCompetidores} COMP
            </span>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              padding: '2px 8px',
              borderRadius: '4px',
            }}>
              {new Date()
                .toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                .toUpperCase()}
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          {view === 'map'
            ? <MapView stations={STATIONS} selectedId={selectedId} onSelect={handleSelect} />
            : <StationDetail station={selected} onBack={handleBack} />
          }
        </div>
      </div>
    </div>
  );
}
