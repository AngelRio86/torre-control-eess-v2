#!/usr/bin/env python3
"""
Fetch MITECO carburantes data y produce src/data/c3_miteco.json
para nuestras 10 EESS del área metropolitana de Bilbao.

Uso (desde la raíz del repo):
    python3 scripts/fetch_miteco.py

Sin dependencias externas — usa solo la librería estándar de Python 3.
"""
import urllib.request
import json
import math
import sys
import os
from datetime import datetime

# ═════════════════════════════════════════════════════════════════════════════
# 1. Estaciones target
#    (mantener sincronizado con src/data/stations.js)
# ═════════════════════════════════════════════════════════════════════════════
STATIONS = [
    # Petronor (4)
    {"id": "PET-BIL-001", "tipo": "petronor",   "marca": "Petronor",
     "lat": 43.265278, "lng": -2.961389,
     "competidores": ["MOE-BIL-001", "NAF-BAR-001"]},
    {"id": "PET-SES-001", "tipo": "petronor",   "marca": "Petronor",
     "lat": 43.313194, "lng": -3.010500,
     "competidores": ["MOE-POR-001", "ERO-POR-001"]},
    {"id": "PET-ERA-057", "tipo": "petronor",   "marca": "Petronor",
     "lat": 43.307528, "lng": -2.944833,
     "competidores": ["SHE-ERA-001", "ERO-LEI-001"]},
    {"id": "PET-ERA-055", "tipo": "petronor",   "marca": "Petronor",
     "lat": 43.291000, "lng": -2.959889,
     "competidores": ["SHE-ERA-001", "ERO-LEI-001"]},

    # Competidores (6)
    {"id": "MOE-BIL-001", "tipo": "competidor", "marca": "Moeve / Cepsa",
     "lat": 43.255917, "lng": -2.932972},
    {"id": "NAF-BAR-001", "tipo": "competidor", "marca": "Nafte",
     "lat": 43.286667, "lng": -3.002750},
    {"id": "MOE-POR-001", "tipo": "competidor", "marca": "Moeve / Cepsa",
     "lat": 43.315389, "lng": -3.021278},
    {"id": "ERO-POR-001", "tipo": "competidor", "marca": "Eroski",
     "lat": 43.311639, "lng": -3.024278},
    {"id": "SHE-ERA-001", "tipo": "competidor", "marca": "Shell",
     "lat": 43.303333, "lng": -2.952833},
    {"id": "ERO-LEI-001", "tipo": "competidor", "marca": "Eroski",
     "lat": 43.317694, "lng": -2.973194},
]

# Bizkaia = provincia 48 en MITECO
MITECO_URL = (
    "https://sedeaplicaciones.minetur.gob.es/"
    "ServiciosRESTCarburantes/PreciosCarburantes/"
    "EstacionesTerrestres/FiltroProvincia/48"
)

# Distancia máxima en metros para considerar match GPS válido
MAX_DIST_M = 250

OUTPUT_PATH = "src/data/c3_miteco.json"


# ═════════════════════════════════════════════════════════════════════════════
# 2. Helpers
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


def parse_price(s):
    """MITECO devuelve precios como 'X,XXX' o '' si no aplica."""
    if not s or not s.strip():
        return None
    try:
        return float(s.strip().replace(",", "."))
    except ValueError:
        return None


def parse_coord(s):
    if not s:
        return None
    try:
        return float(s.strip().replace(",", "."))
    except (ValueError, AttributeError):
        return None


def fetch_miteco():
    print(f"Fetching MITECO data…")
    print(f"  URL: {MITECO_URL}")
    req = urllib.request.Request(MITECO_URL, headers={
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) "
                      "Chrome/126.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        raw = resp.read().decode("utf-8")
    return json.loads(raw)


# ═════════════════════════════════════════════════════════════════════════════
# 3. Match por proximidad GPS
# ═════════════════════════════════════════════════════════════════════════════
def match_stations(miteco_data):
    miteco_list = miteco_data.get("ListaEESSPrecio", [])
    fecha = miteco_data.get("Fecha", "")
    print(f"  → {len(miteco_list)} estaciones en MITECO Bizkaia")
    print(f"  → Snapshot del: {fecha}\n")

    results = {}
    for our in STATIONS:
        best = None
        best_dist = float("inf")
        for m in miteco_list:
            lat = parse_coord(m.get("Latitud", ""))
            lng = parse_coord(m.get("Longitud (WGS84)", ""))
            if lat is None or lng is None:
                continue
            d = haversine_m(our["lat"], our["lng"], lat, lng)
            if d < best_dist:
                best_dist = d
                best = m

        if best is None or best_dist > MAX_DIST_M:
            print(f"  ✗  {our['id']:14s}  sin match (min={best_dist:.0f}m)")
            continue

        rec = {
            "miteco_id": best.get("IDEESS"),
            "rotulo": best.get("Rótulo", ""),
            "direccion_miteco": best.get("Dirección", ""),
            "lat_miteco": parse_coord(best.get("Latitud", "")),
            "lng_miteco": parse_coord(best.get("Longitud (WGS84)", "")),
            "distancia_match_m": round(best_dist),
            "g95": parse_price(best.get("Precio Gasolina 95 E5", "")),
            "g98": parse_price(best.get("Precio Gasolina 98 E5", "")),
            "diesel_a": parse_price(best.get("Precio Gasoleo A", "")),
            "diesel_premium": parse_price(best.get("Precio Gasoleo Premium", "")),
            "horario": best.get("Horario", ""),
            "fecha_dato": fecha.split(" ")[0] if fecha else None,
        }
        results[our["id"]] = rec
        marker = "✓" if best_dist < 50 else "△"
        rot = (best.get('Rótulo', '') or '')[:28]
        g95 = f"{rec['g95']:.3f}" if rec['g95'] is not None else "  —  "
        die = f"{rec['diesel_a']:.3f}" if rec['diesel_a'] is not None else "  —  "
        print(f"  {marker}  {our['id']:14s}  {rot:28s}  dist={best_dist:3.0f}m   G95={g95}   Diesel={die}")

    return results, fecha


# ═════════════════════════════════════════════════════════════════════════════
# 4. Métricas de cluster por Petronor
# ═════════════════════════════════════════════════════════════════════════════
def compute_clusters(prices):
    clusters = {}
    for st in STATIONS:
        if st["tipo"] != "petronor":
            continue
        pet = prices.get(st["id"])
        if not pet:
            continue
        comp_ids = st.get("competidores", [])
        comps = [prices[cid] for cid in comp_ids if prices.get(cid)]
        if not comps:
            continue

        def cluster_stats(key):
            vals = [c[key] for c in comps if c.get(key) is not None]
            if not vals:
                return None, None, None
            avg = sum(vals) / len(vals)
            mn = min(vals)
            pet_val = pet.get(key)
            gap = (pet_val - mn) if pet_val is not None else None
            return avg, mn, gap

        avg_g95,    min_g95,    gap_g95    = cluster_stats("g95")
        avg_diesel, min_diesel, gap_diesel = cluster_stats("diesel_a")

        def r3(v):
            return round(v, 3) if v is not None else None

        clusters[st["id"]] = {
            "n_competidores_con_dato":  len(comps),
            "media_competencia_g95":    r3(avg_g95),
            "min_competencia_g95":      r3(min_g95),
            "gap_vs_min_g95":           r3(gap_g95),
            "media_competencia_diesel": r3(avg_diesel),
            "min_competencia_diesel":   r3(min_diesel),
            "gap_vs_min_diesel":        r3(gap_diesel),
        }
    return clusters


# ═════════════════════════════════════════════════════════════════════════════
# 5. Main
# ═════════════════════════════════════════════════════════════════════════════
def main():
    if not os.path.exists("src/data"):
        print("✗ Error: ejecuta este script desde la raíz del repo "
              "(donde está package.json)")
        sys.exit(1)

    try:
        data = fetch_miteco()
    except Exception as e:
        print(f"\n✗ Error al fetchear MITECO: {e}")
        print("   Verifica conectividad y que el endpoint sigue activo.")
        sys.exit(1)

    prices, fecha_miteco = match_stations(data)
    clusters = compute_clusters(prices)

    matched = len(prices)
    print(f"\n  Resumen: {matched}/{len(STATIONS)} estaciones matcheadas")
    print(f"  Clusters Petronor computados: {len(clusters)}/4")

    output = {
        "fecha_actualizacion": datetime.now().strftime("%Y-%m-%d"),
        "fecha_dato_miteco": fecha_miteco,
        "fuente": "miteco",
        "estaciones": prices,
        "clusters": clusters,
    }

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print(f"\n→ Datos escritos en {OUTPUT_PATH}")
    print(f"   Reinicia `npm run dev` para verlos en el dashboard.")


if __name__ == "__main__":
    main()
