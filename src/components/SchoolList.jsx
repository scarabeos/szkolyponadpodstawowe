import useStore from '../store/useStore';
import { getAdmissionStatus } from '../utils/scoring';
import FilterBar from './FilterBar';
import SchoolCard from './SchoolCard';

export default function SchoolList({ favoritesOnly = false }) {
  const schools = useStore((s) => s.schools);
  const filters = useStore((s) => s.filters);
  const score = useStore((s) => s.getScore());
  const favorites = useStore((s) => s.favorites);
  const schoolsLoaded = useStore((s) => s.schoolsLoaded);

  if (!schoolsLoaded) {
    return (
      <div className="text-center py-20 text-slate-400">
        <div className="text-4xl mb-2">⏳</div>
        Ładowanie danych szkół...
      </div>
    );
  }

  let filtered = favoritesOnly
    ? schools.filter((s) => favorites.includes(s.id))
    : schools;

  if (!favoritesOnly) {
    if (filters.type !== 'wszystkie') {
      filtered = filtered.filter((s) => s.type === filters.type);
    }
    if (filters.query.trim()) {
      const q = filters.query.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.school.toLowerCase().includes(q) ||
          s.profile.toLowerCase().includes(q) ||
          s.subjects?.some((sub) => sub.toLowerCase().includes(q))
      );
    }
    if (filters.onlyReachable) {
      filtered = filtered.filter((s) => {
        const st = getAdmissionStatus(score, s.thresholds?.['2024']);
        return st === 'above' || st === 'close';
      });
    }
  }

  // Sortuj: powyżej progu → blisko → poniżej → brak danych
  const ORDER = { above: 0, close: 1, below: 2, unknown: 3 };
  filtered = [...filtered].sort((a, b) => {
    const sa = ORDER[getAdmissionStatus(score, a.thresholds?.['2024'])];
    const sb = ORDER[getAdmissionStatus(score, b.thresholds?.['2024'])];
    if (sa !== sb) return sa - sb;
    return (b.thresholds?.['2024'] ?? 0) - (a.thresholds?.['2024'] ?? 0);
  });

  return (
    <div className="space-y-4">
      {!favoritesOnly && <FilterBar />}

      {favoritesOnly && filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <div className="text-5xl mb-3">🤍</div>
          <p>Nie masz jeszcze ulubionych szkół.</p>
          <p className="text-sm mt-1">Kliknij serduszko przy szkole, aby ją zapisać.</p>
        </div>
      )}

      {!favoritesOnly && filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <div className="text-5xl mb-3">🔍</div>
          <p>Brak wyników dla podanych filtrów.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map((school) => (
          <SchoolCard key={school.id} school={school} />
        ))}
      </div>

      {!favoritesOnly && filtered.length > 0 && (
        <p className="text-xs text-center text-slate-400 pt-2">
          Wyświetlono {filtered.length} z {schools.length} profili klas
        </p>
      )}
    </div>
  );
}

