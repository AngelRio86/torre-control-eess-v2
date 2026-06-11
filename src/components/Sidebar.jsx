import BrandTag from './BrandTag';

export default function Sidebar({ stations, selectedId, onSelect }) {
  return (
    <aside
      className="flex flex-col shrink-0 overflow-hidden border-r"
      style={{ width: '288px', background: 'var(--surface)', borderColor: 'var(--border)' }}
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
        <div style={{
          fontSize: '10px',
          color: 'var(--text-dim)',
          fontFamily: 'JetBrains Mono, monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          marginBottom: '10px',
          paddingLeft: '4px',
        }}>
          Estaciones · {stations.length}
        </div>

        <div className="flex flex-col gap-1">
          {stations.map(st => {
            const isSelected = st.id === selectedId;
            return (
              <button
                key={st.id}
                onClick={() => onSelect(st.id)}
                className="w-full text-left px-3 py-2.5 rounded-lg transition-all"
                style={{
                  background: isSelected ? '#FFF1F2' : 'transparent',
                  border: `1px solid ${isSelected ? 'rgba(192,0,26,0.25)' : 'transparent'}`,
                }}
                onMouseEnter={e => {
                  if (!isSelected) e.currentTarget.style.background = 'var(--bg)';
                }}
                onMouseLeave={e => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span
                    className="text-xs font-medium leading-snug"
                    style={{ color: isSelected ? 'var(--accent)' : 'var(--text-head)' }}
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
