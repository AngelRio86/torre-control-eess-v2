import { useState } from 'react';
import Sidebar from './components/Sidebar';
import MapView from './components/MapView';
import StationDetail from './components/StationDetail';
import CompareView from './components/CompareView';
import { STATIONS } from './data/stations';

const MAX_COMPARE = 4;

export default function App() {
  // 'browse'  → mapa o ficha (modo normal)
  // 'select'  → el usuario está marcando estaciones para comparar
  // 'compare' → mostrando la vista comparativa
  const [mode, setMode] = useState('browse');

  const [selectedId, setSelectedId] = useState(null);
  const [view, setView] = useState('map'); // 'map' | 'detail'
  const [selectedForCompare, setSelectedForCompare] = useState([]);

  const selected = STATIONS.find(s => s.id === selectedId);
  const compareStations = STATIONS.filter(s => selectedForCompare.includes(s.id));

  // ── Handlers de modo browse ────────────────────────────────────────────────
  const handleOpenDetail = id => {
    setSelectedId(id);
    setView('detail');
  };
  const handleBackToMap = () => {
    setView('map');
    setSelectedId(null);
  };

  // ── Handlers del flujo de comparación ──────────────────────────────────────
  const handleEnterSelect = () => {
    setMode('select');
    setView('map');
    setSelectedId(null);
    setSelectedForCompare([]);
  };
  const handleCancelSelect = () => {
    setMode('browse');
    setSelectedForCompare([]);
  };
  const handleToggleCompare = id => {
    setSelectedForCompare(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, id];
    });
  };
  const handleLaunchCompare = () => {
    if (selectedForCompare.length < 2) return;
    setMode('compare');
  };
  const handleExitCompare = () => {
    setMode('browse');
    setSelectedForCompare([]);
  };

  // ── Router del clic en marcador del mapa ───────────────────────────────────
  // En modo browse → abre ficha; en modo select → toggle compare
  const handleMarkerClick = id => {
    if (mode === 'select') handleToggleCompare(id);
    else handleOpenDetail(id);
  };

  // ── Router del clic en sidebar ─────────────────────────────────────────────
  // Sidebar ya conoce el modo y dispara onSelect (browse) o onToggleCompare (select)
  // Le pasamos handleOpenDetail como onSelect.

  const nPetronor = STATIONS.filter(s => s.tipo === 'petronor').length;
  const nCompetidores = STATIONS.filter(s => s.tipo === 'competidor').length;

  // ─────────────────────────────────────────────────────────────────────────
  // Render del header (cambia según el modo)
  // ─────────────────────────────────────────────────────────────────────────
  const renderHeader = () => {
    if (mode === 'select') {
      const canCompare = selectedForCompare.length >= 2;
      return (
        <>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancelSelect}
              className="flex items-center gap-1.5 transition-opacity hover:opacity-60"
              style={{ fontSize: '12px', color: 'var(--text-sub)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
              Cancelar
            </button>
            <div className="w-px h-4" style={{ background: 'var(--border)' }} />
            <span style={{ fontSize: '13px', color: 'var(--text-head)', fontWeight: 500 }}>
              Selecciona estaciones para comparar
            </span>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '11px',
              color: 'var(--text-dim)',
              padding: '2px 8px',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
            }}>
              {selectedForCompare.length}/{MAX_COMPARE}
            </span>
          </div>
          <button
            onClick={handleLaunchCompare}
            disabled={!canCompare}
            style={{
              padding: '6px 14px',
              background: canCompare ? 'var(--accent)' : 'var(--border)',
              color: canCompare ? 'white' : 'var(--text-dim)',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: canCompare ? 'pointer' : 'not-allowed',
              fontFamily: 'DM Sans, sans-serif',
              transition: 'opacity 0.15s',
            }}
          >
            Comparar ({selectedForCompare.length})
          </button>
        </>
      );
    }

    if (mode === 'compare') {
      return (
        <>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExitCompare}
              className="flex items-center gap-1.5 mr-2 transition-opacity hover:opacity-60"
              style={{ fontSize: '12px', color: 'var(--text-sub)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Volver al mapa
            </button>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
            <span style={{
              fontFamily: 'DM Serif Display, serif',
              color: 'var(--text-head)',
              fontSize: '15px',
            }}>
              Comparación de {selectedForCompare.length} estaciones
            </span>
          </div>
          <div className="flex items-center gap-3" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              BILBAO METROPOLITANO · {nPetronor} EESS + {nCompetidores} COMP
            </span>
          </div>
        </>
      );
    }

    // mode === 'browse'
    return (
      <>
        <div className="flex items-center gap-3">
          {view === 'detail' && (
            <button
              onClick={handleBackToMap}
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
          <button
            onClick={handleEnterSelect}
            style={{
              padding: '4px 12px',
              background: 'var(--surface)',
              color: 'var(--accent)',
              border: '1px solid var(--accent)',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FFF1F2'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 6h13M3 12h13M3 18h13M20 6v12M20 6l-3 3M20 6l3 3" />
            </svg>
            Comparar
          </button>
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
      </>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render del área principal
  // ─────────────────────────────────────────────────────────────────────────
  const renderMain = () => {
    if (mode === 'compare') {
      return <CompareView stations={compareStations} />;
    }
    if (mode === 'browse' && view === 'detail' && selected) {
      return <StationDetail station={selected} onBack={handleBackToMap} />;
    }
    return (
      <MapView
        stations={STATIONS}
        selectedId={selectedId}
        onSelect={handleMarkerClick}
        mode={mode}
        selectedForCompare={selectedForCompare}
      />
    );
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar
        stations={STATIONS}
        selectedId={selectedId}
        onSelect={handleOpenDetail}
        mode={mode}
        selectedForCompare={selectedForCompare}
        onToggleCompare={handleToggleCompare}
        maxCompare={MAX_COMPARE}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header
          className="flex items-center justify-between px-5 py-2.5 border-b shrink-0"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          {renderHeader()}
        </header>
        <div className="flex-1 overflow-hidden">{renderMain()}</div>
      </div>
    </div>
  );
}
