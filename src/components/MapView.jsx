import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getBrand, BRAND_LIST } from '../lib/brands';

function createIcon(marca, isHighlighted) {
  const b = getBrand(marca);
  const size = isHighlighted ? 44 : 34;
  const inner = isHighlighted ? 22 : 18;
  const fontSize = isHighlighted ? '11px' : '9px';
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;">
        ${isHighlighted
          ? `<div style="position:absolute;inset:0;background:${b.hex};border-radius:50%;opacity:0.2;animation:pulse-ring 2.5s infinite;"></div>`
          : ''}
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:${inner}px;height:${inner}px;background:${b.hex};border:2.5px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.22);display:flex;align-items:center;justify-content:center;color:white;font-family:DM Sans,sans-serif;font-weight:700;font-size:${fontSize};">
          ${b.initial}
        </div>
      </div>
    `,
  });
}

function buildPopupHtml(st, mode, isInCompare) {
  const b = getBrand(st.marca);
  let buttonLabel, buttonBg;
  if (mode === 'select') {
    if (isInCompare) {
      buttonLabel = '✕ Quitar de comparación';
      buttonBg = '#6B7280';
    } else {
      buttonLabel = '+ Añadir a comparación';
      buttonBg = '#C0001A';
    }
  } else {
    buttonLabel = 'Abrir ficha →';
    buttonBg = '#C0001A';
  }

  return `
    <div style="font-family:DM Sans,sans-serif;min-width:210px;">
      <div style="font-size:10px;color:#9CA3AF;font-family:JetBrains Mono,monospace;margin-bottom:3px;">${st.id}</div>
      <div style="font-weight:700;font-size:14px;color:#111827;margin-bottom:3px;">${st.nombre}</div>
      <div style="font-size:12px;color:#6B7280;margin-bottom:10px;">${st.municipio}</div>
      <div style="display:inline-block;font-size:10px;padding:2px 8px;border-radius:20px;background:${b.bg_soft};color:${b.hex};border:1px solid ${b.hex}30;font-family:JetBrains Mono,monospace;margin-bottom:10px;">
        ${st.marca}
      </div>
      <button onclick="window._sel('${st.id}')" style="width:100%;padding:7px;background:${buttonBg};color:white;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;font-family:DM Sans,sans-serif;">
        ${buttonLabel}
      </button>
    </div>
  `;
}

export default function MapView({
  stations,
  selectedId,
  onSelect,
  mode = 'browse',
  selectedForCompare = [],
}) {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markersRef = useRef({});

  // Init mapa una sola vez
  useEffect(() => {
    if (leafletMap.current) return;
    leafletMap.current = L.map(mapRef.current, {
      center: [43.295, -2.965],
      zoom: 12,
      scrollWheelZoom: true,
      zoomControl: false,
      attributionControl: false,
    });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(leafletMap.current);
    L.control.zoom({ position: 'bottomright' }).addTo(leafletMap.current);

    stations.forEach(st => {
      if (st.accesos && st.accesos.length > 1) {
        const mainMarker = L.marker([st.lat, st.lng], {
          icon: createIcon(st.marca, false),
          zIndexOffset: 100,
        });
        mainMarker.bindPopup(buildPopupHtml(st, 'browse', false), { maxWidth: 260 });
        mainMarker.addTo(leafletMap.current);
        markersRef.current[st.id] = mainMarker;

        st.accesos.forEach(acceso => {
          if (acceso.lat === st.lat && acceso.lng === st.lng) return;
          const subMarker = L.marker([acceso.lat, acceso.lng], {
            icon: createIcon(st.marca, false),
            opacity: 0.65,
          });
          subMarker.bindTooltip(`${st.nombre} · ${acceso.sentido}`, {
            permanent: false,
            direction: 'top',
            offset: [0, -10],
          });
          subMarker.addTo(leafletMap.current);
        });

        const linePoints = st.accesos.map(a => [a.lat, a.lng]);
        const brandHex = getBrand(st.marca).hex;
        L.polyline(linePoints, {
          color: brandHex,
          weight: 2,
          opacity: 0.45,
          dashArray: '4 6',
        }).addTo(leafletMap.current);
      } else {
        const marker = L.marker([st.lat, st.lng], {
          icon: createIcon(st.marca, false),
        });
        marker.bindPopup(buildPopupHtml(st, 'browse', false), { maxWidth: 260 });
        marker.addTo(leafletMap.current);
        markersRef.current[st.id] = marker;
      }
    });

    window._sel = id => {
      leafletMap.current.closePopup();
      onSelect(id);
    };
    return () => { delete window._sel; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mantener actualizada la referencia a onSelect (cambia con el modo en App)
  useEffect(() => {
    window._sel = id => {
      leafletMap.current?.closePopup();
      onSelect(id);
    };
  }, [onSelect]);

  // Re-bind popups cuando cambia mode o selectedForCompare para reflejar
  // el botón correcto (Abrir ficha / Añadir / Quitar)
  useEffect(() => {
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      const st = stations.find(s => s.id === id);
      if (!st) return;
      const isInCompare = selectedForCompare.includes(id);
      marker.unbindPopup();
      marker.bindPopup(buildPopupHtml(st, mode, isInCompare), { maxWidth: 260 });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectedForCompare]);

  // Estado visual de cada marcador
  useEffect(() => {
    stations.forEach(st => {
      const m = markersRef.current[st.id];
      if (!m) return;
      const highlighted =
        (mode === 'browse' && st.id === selectedId) ||
        ((mode === 'select' || mode === 'compare') && selectedForCompare.includes(st.id));
      m.setIcon(createIcon(st.marca, highlighted));
    });
    if (mode === 'browse' && selectedId && markersRef.current[selectedId]) {
      const st = stations.find(s => s.id === selectedId);
      if (st) leafletMap.current?.setView([st.lat, st.lng], 14, { animate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, mode, selectedForCompare]);

  const nPetronor = stations.filter(s => s.tipo === 'petronor').length;
  const nCompetidores = stations.filter(s => s.tipo === 'competidor').length;

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

      {/* Leyenda de marcas */}
      <div
        className="absolute bottom-6 left-4 rounded-xl px-4 py-3 text-xs z-[1000]"
        style={{
          background: 'rgba(255,255,255,0.95)',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{
          fontSize: '10px',
          color: 'var(--text-dim)',
          fontFamily: 'JetBrains Mono, monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: '8px',
        }}>
          Marcas
        </div>
        {BRAND_LIST.map(m => {
          const b = getBrand(m);
          return (
            <div key={m} className="flex items-center gap-2 mb-1 last:mb-0">
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center text-white"
                style={{ background: b.hex, fontSize: '8px', fontWeight: 700 }}
              >
                {b.initial}
              </div>
              <span style={{ color: 'var(--text-base)', fontSize: '11px' }}>{m}</span>
            </div>
          );
        })}
      </div>

      {/* Contador */}
      <div
        className="absolute top-4 right-4 rounded-xl px-4 py-3 z-[1000]"
        style={{
          background: 'rgba(255,255,255,0.95)',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{
          fontSize: '10px',
          color: 'var(--text-dim)',
          fontFamily: 'JetBrains Mono, monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: '6px',
        }}>
          Universo
        </div>
        <div className="flex items-center gap-5">
          <div>
            <div style={{
              fontFamily: 'DM Serif Display, serif',
              fontSize: '24px',
              color: 'var(--accent)',
              lineHeight: 1,
            }}>{nPetronor}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>Petronor</div>
          </div>
          <div>
            <div style={{
              fontFamily: 'DM Serif Display, serif',
              fontSize: '24px',
              color: 'var(--text-head)',
              lineHeight: 1,
            }}>{nCompetidores}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>Competidores</div>
          </div>
        </div>
      </div>

      <div
        className="absolute bottom-6 right-4 px-3 py-1.5 rounded-lg z-[1000]"
        style={{
          background: 'rgba(255,255,255,0.9)',
          border: '1px solid var(--border)',
          fontSize: '11px',
          color: 'var(--text-dim)',
        }}
      >
        {mode === 'select'
          ? 'Clic en marcador o sidebar para añadir a comparación'
          : 'Clic en un marcador para abrir la ficha'}
      </div>
    </div>
  );
}
