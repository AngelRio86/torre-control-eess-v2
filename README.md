# Torre de Control EESS · v2

Plataforma de decisión estratégica para estaciones de servicio del área metropolitana de Bilbao. Sucesora de [`torre-control-estaciones-servicio`](https://github.com/AngelRio86/torre-control-estaciones-servicio).

## Qué cambia respecto al v1

- **Universo distinto.** 4 estaciones Petronor + 6 estaciones competidoras (Moeve/Cepsa, Nafte, Shell, Eroski) seleccionadas por proximidad. Repsol queda excluido por pertenecer al mismo grupo.
- **Cada KPI lleva metadatos de fuente.** Estructura `{ valor, fuente, fecha, estado }` por dato. La UI muestra badge `● real / ○ estimado / — no disponible` junto a cada métrica.
- **Integración progresiva de fuentes públicas gratuitas:** MITECO, Catastro, INE, Eustat, DGT, OpenChargeMap, i-DE, OpenStreetMap.
- **Nueva funcionalidad:** comparador multi-estación (hasta 4) lado a lado por capa.

## Stack

React 19 · Vite · Tailwind · Leaflet (mapa) · datos estáticos generados en build-time.

## Arquitectura de datos

6 capas por estación:

1. **C1 — Interno de negocio.** Solo disponible para Petronor cuando integre el operador.
2. **C2 — Demanda territorial.** INE + Eustat + DGT + Catastro.
3. **C3 — Mapa competitivo.** MITECO (precios) + OpenChargeMap (EV) + OpenStreetMap (POIs).
4. **C4 — Activo y opcionalidad.** Catastro + i-DE.
5. **C5 — Movilidad real.** Aforos DGT.
6. **C6 — Reputación.** Google Maps (consulta manual).

## Roadmap

- [x] Fase 0 — Bootstrap del repo
- [x] Fase 1 — Modelo de datos con 10 estaciones + Capa 6 poblada
- [ ] Fase 2 — UI base (Sidebar agrupado + MapView diferenciado + StationDetail con badges de fuente)
- [ ] Fase 3 — Comparador multi-estación
- [ ] Fase 4 — Ingesta de fuentes reales gratuitas (scripts Python en `/scripts/`)
- [ ] Fase 5 — Regenerar Alertas + Escenarios para las 4 Petronor

## Ejecutar en local

```bash
npm install
npm run dev
```
