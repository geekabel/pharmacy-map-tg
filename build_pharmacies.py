"""Consolide les sources en un seul data/pharmacies-final.json.

Sources :
  - data/filtered-data.json  : pharmacies curées (lat/lon/name/phone/address)
  - data/pharmacies.json     : extract OSM brut (fallback pour les coords)
  - data/pharmacy_names.json : pharmacies de garde du jour (inam.tg)
  - data/geocode_cache.json  : cache Nominatim (créé/mis à jour ici)

Sortie :
  - data/pharmacies-final.json : liste consolidée avec {lat, lon, name, phone,
    address, onDuty, source}.

Matching : normalisation (accents, casse, abréviations ST/SAINT, ponctuation)
puis fuzzy ratio rapidfuzz ≥ 85.

Géocodage : Nominatim OSM, 1 req/s, cache persistant.
"""
import json
import os
import re
import sys
import time
import unicodedata
from pathlib import Path

import requests
from rapidfuzz import fuzz

DATA_DIR = Path(__file__).parent / "data"
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
NOMINATIM_UA = "pharmacy-map-tg/1.0 (https://github.com/geekabel/pharmacy-map-tg)"
MATCH_THRESHOLD = 85


def normalize(name: str) -> str:
    s = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode().upper()
    s = re.sub(r"\bST\b", "SAINT", s)
    s = re.sub(r"\bSTE\b", "SAINTE", s)
    s = re.sub(r"^PHARMACIE\s+", "", s)
    s = re.sub(r"[^A-Z0-9 ]+", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def best_match(target: str, candidates: list[dict], key="name"):
    target_n = normalize(target)
    best = None
    best_score = 0
    for cand in candidates:
        score = fuzz.token_sort_ratio(target_n, normalize(cand[key]))
        if score > best_score:
            best_score = score
            best = cand
    return (best, best_score) if best_score >= MATCH_THRESHOLD else (None, best_score)


def load_json(path: Path, default):
    if not path.exists():
        return default
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def save_json(path: Path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def clean_phone(phone: str) -> str:
    return re.sub(r"^[^\d+]+", "", phone or "").strip()


def osm_to_dicts(osm_data: dict) -> list[dict]:
    result = []
    for el in osm_data.get("elements", []):
        name = el.get("tags", {}).get("name")
        if not name or "lat" not in el or "lon" not in el:
            continue
        result.append({
            "lat": el["lat"],
            "lon": el["lon"],
            "name": name,
        })
    return result


def geocode(address: str, name: str, cache: dict) -> tuple[float, float] | None:
    key = normalize(f"{name} {address}")
    if key in cache:
        cached = cache[key]
        return tuple(cached) if cached else None

    query = f"{name}, {address}, Lomé, Togo" if address else f"{name}, Lomé, Togo"
    try:
        time.sleep(1.1)  # Nominatim policy: max 1 req/s
        response = requests.get(
            NOMINATIM_URL,
            params={"q": query, "format": "json", "limit": 1, "countrycodes": "tg"},
            headers={"User-Agent": NOMINATIM_UA},
            timeout=20,
        )
        response.raise_for_status()
        results = response.json()
    except Exception as e:
        print(f"[geocode] erreur pour {name!r}: {e}", file=sys.stderr)
        results = []

    if results:
        lat, lon = float(results[0]["lat"]), float(results[0]["lon"])
        cache[key] = [lat, lon]
        return lat, lon
    cache[key] = None
    return None


def build():
    curated = load_json(DATA_DIR / "filtered-data.json", [])
    osm_raw = load_json(DATA_DIR / "pharmacies.json", {"elements": []})
    on_duty = load_json(DATA_DIR / "pharmacy_names.json", [])
    cache = load_json(DATA_DIR / "geocode_cache.json", {})

    osm_pharmacies = osm_to_dicts(osm_raw)

    # 1. Marquer onDuty sur les pharmacies curées via fuzzy match
    consolidated = []
    matched_on_duty = set()  # indices de on_duty déjà matchés

    for ph in curated:
        entry = {
            "lat": ph["lat"],
            "lon": ph["lon"],
            "name": ph["name"],
            "phone": clean_phone(ph.get("phone", "")),
            "address": ph.get("address", ""),
            "onDuty": False,
            "source": "curated",
        }
        match, score = best_match(ph["name"], on_duty)
        if match:
            entry["onDuty"] = True
            if not entry["phone"]:
                entry["phone"] = clean_phone(match.get("phone", ""))
            if not entry["address"]:
                entry["address"] = match.get("address", "")
            matched_on_duty.add(id(match))
        consolidated.append(entry)

    # 2. Pour chaque pharmacie de garde non matchée : OSM puis géocodage
    new_entries = 0
    geocoded = 0
    for od in on_duty:
        if id(od) in matched_on_duty:
            continue

        coords = None
        source = None

        osm_match, _ = best_match(od["name"], osm_pharmacies)
        if osm_match:
            coords = (osm_match["lat"], osm_match["lon"])
            source = "osm"

        if coords is None:
            geo = geocode(od.get("address", ""), od["name"], cache)
            if geo:
                coords = geo
                source = "nominatim"
                geocoded += 1

        if coords is None:
            print(f"[skip] de garde sans coords: {od['name']!r}", file=sys.stderr)
            continue

        consolidated.append({
            "lat": coords[0],
            "lon": coords[1],
            "name": od["name"],
            "phone": clean_phone(od.get("phone", "")),
            "address": od.get("address", ""),
            "onDuty": True,
            "source": source,
        })
        new_entries += 1

    save_json(DATA_DIR / "pharmacies-final.json", consolidated)
    save_json(DATA_DIR / "geocode_cache.json", cache)

    total_on_duty = sum(1 for p in consolidated if p["onDuty"])
    print(f"[build] {len(consolidated)} pharmacies | "
          f"{total_on_duty}/{len(on_duty)} de garde affichées | "
          f"{new_entries} ajoutées hors curated | "
          f"{geocoded} géocodages effectués")


if __name__ == "__main__":
    build()
