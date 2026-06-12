# Scripts de ingesta de datos reales

Estos scripts en Python pueblan las capas C1–C5 del dashboard a partir de fuentes públicas gratuitas. Solo dependen de la librería estándar de Python 3 — sin `pip install`.

## Cómo se usan

Desde la raíz del repo (donde está `package.json`):

```bash
python3 scripts/fetch_miteco.py
```

Cada script escribe un JSON en `src/data/` que la app importa al arrancar. Tras ejecutarlos, reinicia `npm run dev` y la capa correspondiente se rellena en el dashboard.

## Scripts disponibles

| Script | Capa | Fuente | Output |
|---|---|---|---|
| `fetch_miteco.py` | C3 (parcial) | MITECO Geoportal de Hidrocarburos | `src/data/c3_miteco.json` |

## Por venir

- `fetch_catastro.py` — C4 — Sede del Catastro (superficie, año, valor catastral)
- `fetch_ine.py` + `fetch_eustat.py` — C2 — INE + Eustat (demografía, renta, parque vehicular)
- `fetch_aforos_dgt.py` — C5 — Aforos DGT (IMD en N-634 y BI-3704)
- `fetch_openchargemap.py` — C3 (cargadores EV)
- `fetch_overpass.py` — C3 (POIs vía OpenStreetMap)

## Refresco

Los datos MITECO se actualizan diariamente. Re-ejecuta el script cuando quieras refrescar precios y vuelve a hacer commit del JSON resultante.
