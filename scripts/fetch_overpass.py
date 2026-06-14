#!/usr/bin/env python3
"""
Fetch OpenStreetMap POIs vía Overpass API y produce src/data/c3_osm.json
para nuestras 10 EESS del área metropolitana de Bilbao.

Alimenta la Capa C3 (Competencia y entorno) con conteos de:
  - Supermercados                (shop=supermarket)
  - Cafés                        (amenity=cafe)
  - Restaurantes                 (amenity=restaurant + fast_food)
  - Hoteles / alojamiento        (tourism=hotel/motel/guest_house)
  - Lavados de coche             (amenity=car_wash)
  - Cargadores EV                (amenity=charging_station)
  - EESS competencia             (amenity=fuel)  ← sanity-check frente a MITECO

Para cada estación y categoría devuelve:
  - count        : número de POIs en el radio
  - nearest_m    : distancia al más cercano (metros)

Uso (desde la raíz del repo):
    python3 scripts/fetch_overpass.py

Sin dependencias externas — usa solo la librería estándar de Python 3.
"""
import urllib.request
import urllib.error
import json
import math
import sys
import time
from datetime import datetime, timezone

# ═════════════════════════════════════════════════════════════════════════════
# 1. Estaciones target
#    (mantener sincronizado con src/data/stations.js y fetch_miteco.py)
# ═════════════════════════════════════════════════════════════════════════════
STATIONS = [
    # Petronor (4)
    {"id": "PET-BIL-001", "lat": 43.265278, "lng": -2.961389},
    {"id": "PET-SES-001", "lat": 43.313194, "lng": -3.010500},
    {"id": "PET-ERA-057", "lat": 43.307528, "lng": -2.944833},
    {"id": "PET-ERA-055", "lat": 43.291000, "lng": -2.959889},
    # Competidores (6)
    {"id": "MOE-BIL-001", "lat": 43.255917, "lng": -2.932972},
    {"id": "NAF-BAR-001", "lat": 43.286667, "lng": -3.002750},
    {"id": "MOE-POR-001", "lat": 43.315389, "lng": -3.021278},
    {"id": "ERO-POR-001", "lat": 43.311639, "lng": -3.024278},
    {"id": "SHE-ERA-001", "lat": 43.303333, "lng": -2.952833},
    {"id": "ERO-LEI-001", "lat": 43.317694, "lng": -2.973194},
]

# Radio de búsqueda en metros — coherente con el roadmap (buffer 1 km)
RADIO_M = 1000

# Endpoint Overpass — el mirror principal. Si va lento, alternativas:
#   https://overpass.kumi.systems/api/interpreter
#   https://overpass.osm.ch/api/interpreter
OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Pausa entre llamadas para respetar el fair-use de Overpass (1 query/s aprox)
PAUSE_S = 2

OUTPUT_PATH = "src/data/c3_osm.json"

# ═════════════════════════════════════════════════════════════════════════════
# 2. Categorías Overpass — cada entrada es (clave_json, lista_filtros_OSM)
# ═════════════════════════════════════════════════════════════════════════════
CATEGORIES = [
    ("supermercados",     ['node["shop"="supermarket"]',
                           'node["shop"="convenience"]']),
    ("cafes",             ['node["amenity"="cafe"]']),
    ("restaurantes",      ['node["amenity"="restaurant"]',
                           'node["amenity"="fast_food"]']),
    ("hoteles",           ['node["tourism"="hotel"]',
                           'node["tourism"="motel"]',
                           'node["tourism"="guest_house"]',
                           'node["tourism"="hostel"]']),
    ("lavados",           ['node["amenity"="car_wash"]']),
    ("cargadores_ev",     ['node["amenity"="charging_station"]']),
    ("eess_competencia",  ['node["amenity"="fuel"]']),
]


# ═════════════════════════════════════════════════════════════════════════════
# 3. Helpers
# ═════════════════════════════════════════════════════════════════════════════
def haversine_m(lat1, lng1, lat2, lng2):
    """Distancia haversine en metros."""
    R = 6371000
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def build_query(lat, lng, radio):
    """
    Construye una query Overpass QL que devuelve TODOS los POIs de TODAS
    las categorías en un solo viaje. Más eficiente que una query por categoría.
    """
    filtros = []
    for _, lista in CATEGORIES:
        for f in lista:
            filtros.append(f"  {f}(around:{radio},{lat},{lng});")
    cuerpo = "\n".join(filtros)
    return f"""[out:json][timeout:60];
(
{cuerpo}
);
out body;
"""


def fetch_overpass(query, intentos=3):
    """POST a Overpass con reintento exponencial."""
    data = ("data=" + urllib.parse.quote(query)).encode("utf-8")
    req = urllib.request.Request(
        OVERPASS_URL,
        data=data,
        headers={
            "User-Agent": "torre-control-eess/1.0 (educational project)",
            "Content-Type": "application/x-www-form-urlencoded",
        },
    )
    espera = 5
    for intento in range(1, intentos + 1):
        try:
            with urllib.request.urlopen(req, timeout=90) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            print(f"    HTTP {e.code} en intento {intento}/{intentos}", file=sys.stderr)
            if e.code == 429 or e.code >= 500:
                time.sleep(espera)
                espera *= 2
                continue
            raise
        except (urllib.error.URLError, TimeoutError) as e:
            print(f"    Red error intento {intento}/{intentos}: {e}", file=sys.stderr)
            time.sleep(espera)
            espera *= 2
    raise RuntimeError("Overpass no responde tras reintentos")


def classify(tags):
    """Dado el dict de tags de un POI, devuelve la clave_json a la que pertenece."""
    amenity = tags.get("amenity")
    shop = tags.get("shop")
    tourism = tags.get("tourism")

    if shop in ("supermarket", "convenience"):
        return "supermercados"
    if amenity == "cafe":
        return "cafes"
    if amenity in ("restaurant", "fast_food"):
        return "restaurantes"
    if tourism in ("hotel", "motel", "guest_house", "hostel"):
        return "hoteles"
    if amenity == "car_wash":
        return "lavados"
    if amenity == "charging_station":
        return "cargadores_ev"
    if amenity == "fuel":
        return "eess_competencia"
    return None


# ═════════════════════════════════════════════════════════════════════════════
# 4. Pipeline
# ═════════════════════════════════════════════════════════════════════════════
def main():
    print("┌" + "─" * 72 + "┐")
    print("│  Overpass API → Capa C3 (entorno comercial)" + " " * 28 + "│")
    print("│  10 estaciones · radio " + f"{RADIO_M}".rjust(4) + " m · 7 categorías" + " " * 26 + "│")
    print("└" + "─" * 72 + "┘")
    print()

    # ── MODO MERGE: cargar JSON previo si existe ─────────────────────────────
    # Estaciones que ya tienen dato completo se saltan. Solo se piden las que
    # falten o tengan {"error": ...}. Así Overpass falla en distintas estaciones
    # cada vez sin perder lo ya conseguido.
    import os as _os
    estaciones_previas = {}
    if _os.path.exists(OUTPUT_PATH):
        try:
            with open(OUTPUT_PATH, "r", encoding="utf-8") as f:
                previo = json.load(f)
            estaciones_previas = previo.get("estaciones", {}) or {}
            n_ok_previas = sum(
                1 for v in estaciones_previas.values()
                if isinstance(v, dict) and "error" not in v
            )
            if n_ok_previas:
                print(f"  → JSON previo encontrado: {n_ok_previas}/10 estaciones OK, "
                      f"reintenta solo las que faltan\n")
        except Exception:
            estaciones_previas = {}

    salida = {
        "fecha_actualizacion": datetime.now(timezone.utc).isoformat(),
        "fuente": "openstreetmap_overpass",
        "radio_metros": RADIO_M,
        "categorias": [c[0] for c in CATEGORIES],
        "estaciones": dict(estaciones_previas),  # arranca con lo previo
    }

    for i, st in enumerate(STATIONS, 1):
        sid = st["id"]
        # ¿Ya teníamos dato completo? Saltar.
        prev = estaciones_previas.get(sid)
        if isinstance(prev, dict) and "error" not in prev:
            print(f"[{i:2}/10] {sid}  · ya OK, se omite")
            continue

        print(f"[{i:2}/10] {sid}  ({st['lat']:.4f}, {st['lng']:.4f})")
        query = build_query(st["lat"], st["lng"], RADIO_M)

        try:
            resp = fetch_overpass(query)
        except Exception as e:
            print(f"        ✗ Error: {e}", file=sys.stderr)
            salida["estaciones"][sid] = {"error": str(e)}
            continue

        elementos = resp.get("elements", [])

        # Inicializa contadores por categoría
        por_categoria = {clave: {"count": 0, "nearest_m": None}
                         for clave, _ in CATEGORIES}

        for el in elementos:
            tags = el.get("tags", {})
            clave = classify(tags)
            if not clave:
                continue
            # Distancia al POI
            plat = el.get("lat")
            plng = el.get("lon")
            if plat is None or plng is None:
                continue
            d = haversine_m(st["lat"], st["lng"], plat, plng)
            bucket = por_categoria[clave]
            bucket["count"] += 1
            if bucket["nearest_m"] is None or d < bucket["nearest_m"]:
                bucket["nearest_m"] = round(d)

        salida["estaciones"][sid] = por_categoria

        # Log compacto
        resumen = "  ".join(
            f"{k.split('_')[0][:4]}={v['count']}"
            for k, v in por_categoria.items()
        )
        print(f"        ✓ {resumen}")

        if i < len(STATIONS):
            time.sleep(PAUSE_S)

    # Escribir output
    import os
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(salida, f, indent=2, ensure_ascii=False)

    print()
    print(f"✓ Escrito {OUTPUT_PATH}")
    print(f"  {len(salida['estaciones'])} estaciones · "
          f"{sum(1 for v in salida['estaciones'].values() if 'error' not in v)} con dato")


if __name__ == "__main__":
    main()
