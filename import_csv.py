#!/usr/bin/env python3
"""
import_csv.py
-------------
Alternatywny skrypt importujący progi punktowe z pliku CSV.
Przydatny gdy PDF jest zeskanowany (nie daje się sparsować tekstowo).

Format CSV (z nagłówkiem):
    szkola,profil,typ,prog_2025
    "I LO im. Mikołaja Kopernika","matematyczno-fizyczna","LO",165.5
    ...

Możesz też skopiować tabelę z przeglądarki (np. ze strony Vulcan)
i wkleić ją do Excela/LibreOffice, a następnie wyeksportować jako CSV.

Użycie:
    python3 import_csv.py progi2025.csv [--year 2025] [--out public/lodz-schools.json]
"""

import argparse
import csv
import json
import sys
from pathlib import Path


def merge_csv(csv_path: Path, json_path: Path, year: int) -> int:
    if not json_path.exists():
        schools = []
    else:
        with open(json_path, encoding="utf-8") as f:
            schools = json.load(f)

    with open(csv_path, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    if not rows:
        sys.exit("[ERROR] Plik CSV jest pusty lub ma nieprawidłowy format.")

    print(f"[INFO] Wczytano {len(rows)} wierszy z {csv_path}")
    print(f"[INFO] Kolumny: {list(rows[0].keys())}\n")

    # Mapowanie możliwych nazw kolumn
    def find_col(row, *candidates):
        for c in candidates:
            for k in row.keys():
                if c.lower() in k.lower():
                    return k
        return None

    sample = rows[0]
    col_school  = find_col(sample, "szkoł", "school", "nazwa")
    col_profile = find_col(sample, "profil", "oddział", "klasa", "kierunek")
    col_thresh  = find_col(sample, "próg", "prog", "punkty", "min", str(year))
    col_type    = find_col(sample, "typ", "type", "rodzaj")

    if not col_school or not col_thresh:
        sys.exit(
            f"[ERROR] Nie znaleziono wymaganych kolumn.\n"
            f"        Oczekiwane: szkola, prog_{year}\n"
            f"        Dostępne:   {list(sample.keys())}"
        )

    updated = 0
    for row in rows:
        school_name = row.get(col_school, "").strip()
        profile     = row.get(col_profile, "").strip() if col_profile else ""
        thresh_raw  = row.get(col_thresh, "").strip().replace(",", ".")
        school_type = row.get(col_type, "LO").strip() if col_type else "LO"

        if not school_name or not thresh_raw:
            continue
        try:
            threshold = float(thresh_raw)
        except ValueError:
            print(f"[WARN] Pomijam wiersz (błędny próg): {row}")
            continue

        # Szukaj dopasowania w istniejącym JSON
        best_match = None
        best_score = 0
        for s in schools:
            a = set(school_name.lower().split())
            b = set(s["school"].lower().split())
            score = len(a & b)
            if score > best_score:
                best_score = score
                best_match = s

        if best_match and best_score >= 2:
            best_match.setdefault("thresholds", {})[str(year)] = threshold
            print(f"  ✓  {school_name[:45]:<45} → {threshold}")
        else:
            new_id = school_name.lower()
            for a, b in [("ł","l"),("ą","a"),("ę","e"),("ó","o"),("ś","s"),("ź","z"),("ż","z"),("ń","n"),("ć","c")]:
                new_id = new_id.replace(a, b)
            import re
            new_id = re.sub(r"[^a-z0-9]+", "-", new_id).strip("-")[:60]
            schools.append({
                "id": new_id,
                "school": school_name,
                "address": "",
                "type": school_type,
                "profile": profile,
                "subjects": [],
                "thresholds": {str(year): threshold},
            })
            print(f"  +  {school_name[:45]:<45} → {threshold} (nowy rekord)")

        updated += 1

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(schools, f, ensure_ascii=False, indent=2)

    return updated


def main():
    parser = argparse.ArgumentParser(description="Importuje progi z CSV do lodz-schools.json")
    parser.add_argument("csv", help="Plik CSV z progami")
    parser.add_argument("--year", type=int, default=2025)
    parser.add_argument("--out", default="public/lodz-schools.json")
    args = parser.parse_args()

    csv_path = Path(args.csv)
    if not csv_path.exists():
        sys.exit(f"[ERROR] Nie znaleziono pliku: {csv_path}")

    out_path = Path(args.out)
    updated = merge_csv(csv_path, out_path, args.year)
    print(f"\n✅ Zaktualizowano {updated} rekordów → {out_path}")


if __name__ == "__main__":
    main()

