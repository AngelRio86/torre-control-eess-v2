import BrandTag from './BrandTag';

function CheckboxIcon({ checked, disabled }) {
  return (
    <span style={{
      width: '16px',
      height: '16px',
      borderRadius: '4px',
      border: `1.5px solid ${
        checked ? 'var(--accent)' : disabled ? 'var(--muted)' : 'var(--text-dim)'
      }`,
      background: checked ? 'var(--accent)' : 'transparent',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      opacity: disabled ? 0.4 : 1,
      transition: 'all 0.15s',
    }}>
      {checked && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
          <path d="M5 12l5 5L20 7" />
        </svg>
      )}
    </span>
  );
}

export default function Sidebar({
  stations,
  selectedId,
  onSelect,
  mode = 'browse',
  selectedForCompare = [],
  onToggleCompare,
  maxCompare = 4,
}) {
  const isSelectMode = mode === 'select';
  const isCompareMode = mode === 'compare';

  return (
    <aside
      className="flex flex-col shrink-0 overflow-hidden border-r"
      style={{
        width: '288px',
        background: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Logo header */}
      <div
        className="px-4 py-3 border-b flex items-center gap-2"
        style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
      >
        <div
          className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
          style={{ background: 'var(--accent)' }}
        >
          P
        </div>
        <div>
          <div style={{
            fontSize: '10px',
            color: 'var(--text-dim)',
            fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            Petronor · Bilbao Metropolitano
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="flex items-center justify-between mb-2 pl-1">
          <div style={{
            fontSize: '10px',
            color: 'var(--text-dim)',
            fontFamily: 'JetBrains Mono, monospace',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
          }}>
            Estaciones · {stations.length}
          </div>
          {isSelectMode && (
            <div style={{
              fontSize: '10px',
              color: 'var(--accent)',
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 600,
            }}>
              {selectedForCompare.length}/{maxCompare}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          {stations.map(st => {
            const isBrowseSelected = !isSelectMode && !isCompareMode && st.id === selectedId;
            const isInCompare = (isSelectMode || isCompareMode) && selectedForCompare.includes(st.id);
            const isMarked = isBrowseSelected || isInCompare;
            const atMax = selectedForCompare.length >= maxCompare;
            const isDisabled = isSelectMode && atMax && !isInCompare;

            const handleClick = () => {
              if (isSelectMode) {
                if (isDisabled) return;
                onToggleCompare(st.id);
              } else if (isCompareMode) {
                // En modo compare el sidebar es read-only; no hace nada
                return;
              } else {
                onSelect(st.id);
              }
            };

            return (
              <button
                key={st.id}
                onClick={handleClick}
                disabled={isDisabled}
                className="w-full text-left px-3 py-2.5 rounded-lg transition-all"
                style={{
                  background: isMarked ? '#FFF1F2' : 'transparent',
                  border: `1px solid ${isMarked ? 'rgba(192,0,26,0.25)' : 'transparent'}`,
                  cursor: isDisabled ? 'not-allowed' : isCompareMode ? 'default' : 'pointer',
                  opacity: isDisabled ? 0.5 : 1,
                }}
                onMouseEnter={e => {
                  if (!isMarked && !isDisabled && !isCompareMode) {
                    e.currentTarget.style.background = 'var(--bg)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isMarked) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div className="flex items-start gap-2">
                  {isSelectMode && (
                    <div style={{ paddingTop: '2px' }}>
                      <CheckboxIcon checked={isInCompare} disabled={isDisabled} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span
                        className="text-xs font-medium leading-snug"
                        style={{ color: isMarked ? 'var(--accent)' : 'var(--text-head)' }}
                      >
                        {st.nombre}
                      </span>
                      <div className="shrink-0">
                        <BrandTag marca={st.marca} size="sm" />
                      </div>
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--text-dim)',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}>
                      {st.municipio}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div
        className="px-4 py-3 border-t"
        style={{
          borderColor: 'var(--border)',
          color: 'var(--text-dim)',
          fontFamily: 'JetBrains Mono, monospace',
          background: 'var(--bg)',
          fontSize: '10px',
        }}
      >
        <div>Forecourt Transition Intelligence</div>
        <div style={{ color: 'var(--muted)', marginTop: '1px' }}>
          v2.0 · Bilbao Metropolitano 2026
        </div>
      </div>
    </aside>
  );
}
