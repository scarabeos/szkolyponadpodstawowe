#!/usr/bin/env python3
"""
parse_thresholds.py
-------------------
Skrypt do parsowania progów punktowych rekrutacji do szkół ponadpodstawowych
z pliku PDF (np. z systemu Vulcan / Wydział Edukacji UMŁ).

Użycie:
    python3 parse_thresholds.py <plik.pdf> [--year 2025] [--out public/lodz-schools.json]

Wymagania:
    pip install pdfplumber

Jak zdobyć PDF:
    1. Wejdź na https://nabor.pcss.pl/lodz
    2. Po zakończeniu rekrutacji (lipiec) pobierz „Wyniki rekrutacji" lub
       „Progi punktowe" jako PDF.
    3. Urząd Miasta Łodzi publikuje zestawienia pod adresem:
       https://uml.lodz.pl/dla-mieszkancow/edukacja/
"""

import argparse
import json
import re
import sys
from pathlib import Path

try:
    import pdfplumber
except ImportError:
    sys.exit("Brakuje biblioteki pdfplumber. Zainstaluj: pip install pdfplumber")


# ---------------------------------------------------------------------------
# Pomocnicze wyrażenia regularne
# ---------------------------------------------------------------------------

# Dopasowuje liczbę punktów, np. "143,90" lub "143.90"
RE_POINTS = re.compile(r"\b(\d{2,3}[.,]\d{1,2})\b")

# Słowa-klucze wskazujące na wiersz z progiem
RE_THRESHOLD_HINT = re.compile(
    r"próg|minimalna|last accepted|punkty|points|threshold",
    re.IGNORECASE,
)

# Typ szkoły na podstawie nazwy
RE_TYPE = re.compile(r"\b(liceum|LO|technikum|branżowa|BS)\b", re.IGNORECASE)


def normalize_number(s: str) -> float:
    """Zamienia '143,90' lub '143.90' na 143.9."""
    return float(s.replace(",", "."))


def detect_type(text: str) -> str:
    m = RE_TYPE.search(text)
    if not m:
        return "LO"
    val = m.group(1).lower()
    if "technikum" in val:
        return "T"
    if "branżowa" in val or "bs" in val:
        return "BS1"
    return "LO"


def slugify(text: str) -> str:
    """Tworzy prosty identyfikator z tekstu."""
    text = text.lower()
    text = re.sub(r"[łł]", "l", text)
    text = re.sub(r"[ąa]", "a", text)
    text = re.sub(r"[ęe]", "e", text)
    text = re.sub(r"[óo]", "o", text)
    text = re.sub(r"[śs]", "s", text)
    text = re.sub(r"[źżz]", "z", text)
    text = re.sub(r"[ńn]", "n", text)
    text = re.sub(r"[ćc]", "c", text)
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")[:60]


# ---------------------------------------------------------------------------
# Parsowanie tabel (preferowana metoda – gdy PDF zawiera osadzone tabele)
# ---------------------------------------------------------------------------

def parse_tables(pdf) -> list[dict]:
    """Próbuje odczytać dane z tabel PDF."""
    results = []
    for page in pdf.pages:
        tables = page.extract_tables()
        for table in tables:
            # Szukaj nagłówka, który zawiera „szkołę" lub „próg"
            header = [str(c).lower() if c else "" for c in (table[0] or [])]
            school_col = next(
                (i for i, h in enumerate(header) if "szkoł" in h or "school" in h or "nazwa" in h), None
            )
            profile_col = next(
                (i for i, h in enumerate(header) if "profil" in h or "oddział" in h or "klasa" in h), None
            )
            threshold_col = next(
                (i for i, h in enumerate(header) if "próg" in h or "punkty" in h or "min" in h), None
            )

            if threshold_col is None:
                # Spróbuj znaleźć kolumnę zawierającą liczby w formacie XXX,XX
                for row in table[1:]:
                    for i, cell in enumerate(row or []):
                        if cell and RE_POINTS.search(str(cell)):
                            threshold_col = i
                            break
                    if threshold_col is not None:
                        break

            if threshold_col is None:
                continue

            current_school = ""
            for row in table[1:]:
                if not row:
                    continue
                cells = [str(c).strip() if c else "" for c in row]

                # Aktualizuj nazwę szkoły (komórka może obejmować wiele wierszy)
                if school_col is not None and cells[school_col]:
                    current_school = cells[school_col]

                profile = cells[profile_col] if profile_col is not None and profile_col < len(cells) else ""
                threshold_raw = cells[threshold_col] if threshold_col < len(cells) else ""

                m = RE_POINTS.search(threshold_raw)
                if not m:
                    continue

                threshold_val = normalize_number(m.group(1))
                school_name = current_school or "Nieznana szkoła"

                results.append({
                    "school": school_name,
                    "profile": profile,
                    "type": detect_type(school_name + " " + profile),
                    "threshold": threshold_val,
                })

    return results


# ---------------------------------------------------------------------------
# Parsowanie tekstu (fallback – gdy PDF nie zawiera tabel)
# ---------------------------------------------------------------------------

def parse_text(pdf) -> list[dict]:
    """Parsuje surowy tekst strony szukając wzorców: nazwa szkoły + próg."""
    results = []
    full_text = "\n".join(page.extract_text() or "" for page in pdf.pages)
    lines = full_text.splitlines()

    current_school = ""
    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Heurystyka: wiersz z nazwą szkoły (nie zawiera liczby-progu, ale zawiera LO/Technikum itp.)
        if RE_TYPE.search(line) and not RE_POINTS.search(line):
            current_school = line
            continue

        # Wiersz z progiem
        m = RE_POINTS.search(line)
        if m and current_school:
            threshold_val = normalize_number(m.group(1))
            # Pomijamy liczby wyglądające jak numery stron (<10) lub rok (>2000)
            if threshold_val < 10 or threshold_val > 200:
                continue
            results.append({
                "school": current_school,
                "profile": line.replace(m.group(0), "").strip(" ,-–"),
                "type": detect_type(current_school),
                "threshold": threshold_val,
            })

    return results


# ---------------------------------------------------------------------------
# Scalanie z istniejącym plikiem JSON
# ---------------------------------------------------------------------------

def merge_into_json(new_entries: list[dict], json_path: Path, year: int) -> int:
    """
    Próbuje dopasować sparsowane rekordy do istniejącego pliku JSON
    i dodaje klucz z nowym rokiem. Zwraca liczbę zaktualizowanych rekordów.
    """
    if not json_path.exists():
        print(f"[WARN] Plik {json_path} nie istnieje – zostanie utworzony nowy.")
        schools = []
    else:
        with open(json_path, encoding="utf-8") as f:
            schools = json.load(f)

    updated = 0
    unmatched = []

    for entry in new_entries:
        best_match = None
        best_score = 0

        for school in schools:
            # Proste dopasowanie – ile słów z nazwy szkoły pokrywa się
            a_words = set(entry["school"].lower().split())
            b_words = set(school["school"].lower().split())
            common = len(a_words & b_words)
            if common > best_score:
                best_score = common
                best_match = school

        if best_match and best_score >= 2:
            best_match.setdefault("thresholds", {})[str(year)] = entry["threshold"]
            updated += 1
        else:
            # Dodaj jako nowy rekord
            schools.append({
                "id": slugify(entry["school"] + "-" + entry.get("profile", "")),
                "school": entry["school"],
                "address": "",
                "type": entry["type"],
                "profile": entry.get("profile", ""),
                "subjects": [],
                "thresholds": {str(year): entry["threshold"]},
            })
            unmatched.append(entry["school"])
            updated += 1

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(schools, f, ensure_ascii=False, indent=2)

    if unmatched:
        print(f"\n[INFO] Dodano {len(unmatched)} nowych rekordów (nie znaleziono dopasowania):")
        for name in unmatched[:10]:
            print(f"       • {name}")
        if len(unmatched) > 10:
            print(f"       ... i {len(unmatched) - 10} więcej")

    return updated


# ---------------------------------------------------------------------------
# Tryb podglądu (--preview) – drukuje co znaleziono bez zapisywania
# ---------------------------------------------------------------------------

def preview(entries: list[dict]):
    print(f"\n{'─'*60}")
    print(f"  Znaleziono {len(entries)} rekordów:")
    print(f"{'─'*60}")
    for e in entries[:30]:
        print(f"  [{e['type']:4}] {e['school'][:40]:<40} | {e.get('profile','')[:25]:<25} | {e['threshold']}")
    if len(entries) > 30:
        print(f"  ... i {len(entries) - 30} więcej")
    print(f"{'─'*60}\n")


# ---------------------------------------------------------------------------
# Główna logika
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Parsuje progi punktowe szkół ponadpodstawowych z pliku PDF."
    )
    parser.add_argument("pdf", help="Ścieżka do pliku PDF z progami punktowymi")
    parser.add_argument("--year", type=int, default=2025, help="Rok rekrutacji (domyślnie: 2025)")
    parser.add_argument(
        "--out",
        default="public/lodz-schools.json",
        help="Ścieżka do pliku JSON do zaktualizowania (domyślnie: public/lodz-schools.json)",
    )
    parser.add_argument(
        "--preview",
        action="store_true",
        help="Tylko podgląd – nie zapisuje zmian do pliku JSON",
    )
    args = parser.parse_args()

    pdf_path = Path(args.pdf)
    if not pdf_path.exists():
        sys.exit(f"[ERROR] Plik nie istnieje: {pdf_path}")

    print(f"\n🔍 Otwieram: {pdf_path} …")

    with pdfplumber.open(pdf_path) as pdf:
        print(f"   Stron w PDF: {len(pdf.pages)}")

        # Najpierw próbuj tabel
        entries = parse_tables(pdf)
        method = "tabele"

        if not entries:
            print("   [INFO] Nie wykryto tabel – próbuję parsowanie tekstu …")
            entries = parse_text(pdf)
            method = "tekst"

    print(f"   Metoda: {method} | Znalezione rekordy: {len(entries)}")

    if not entries:
        print("\n[WARN] Nie udało się sparsować żadnych danych.")
        print("       Możliwe przyczyny:")
        print("       • PDF jest obrazem (zeskanowany) – wymagany OCR")
        print("       • Niestandardowy format tabel")
        print("       Rozwiązanie: zapisz tabelę z przeglądarki jako CSV i użyj --csv")
        sys.exit(1)

    preview(entries)

    if args.preview:
        print("[INFO] Tryb podglądu – plik JSON nie został zmieniony.")
        return

    out_path = Path(args.out)
    updated = merge_into_json(entries, out_path, args.year)
    print(f"✅ Zaktualizowano {updated} rekordów w pliku: {out_path}")
    print(f"   Możesz teraz uruchomić aplikację: npm run dev\n")


if __name__ == "__main__":
    main()

