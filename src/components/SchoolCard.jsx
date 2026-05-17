import useStore from '../store/useStore';
import { getAdmissionStatus } from '../utils/scoring';

const STATUS_CONFIG = {
  above: {
    bg: 'bg-green-50 border-green-200',
    badge: 'bg-green-100 text-green-700',
    dot: 'bg-green-500',
    label: 'W zasięgu',
  },
  close: {
    bg: 'bg-yellow-50 border-yellow-200',
    badge: 'bg-yellow-100 text-yellow-700',
    dot: 'bg-yellow-400',
    label: 'Blisko progu',
  },
  below: {
    bg: 'bg-red-50 border-red-200',
    badge: 'bg-red-100 text-red-700',
    dot: 'bg-red-400',
    label: 'Poniżej progu',
  },
  unknown: {
    bg: 'bg-slate-50 border-slate-200',
    badge: 'bg-slate-100 text-slate-600',
    dot: 'bg-slate-400',
    label: 'Brak danych',
  },
};

const TYPE_LABELS = { LO: 'Liceum', T: 'Technikum', BS1: 'Branżowa Szkoła I st.' };

export default function SchoolCard({ school }) {
  const score = useStore((s) => s.getScore());
  const favorites = useStore((s) => s.favorites);
  const toggleFavorite = useStore((s) => s.toggleFavorite);

  const threshold2024 = school.thresholds?.['2024'];
  const threshold2023 = school.thresholds?.['2023'];
  const status = getAdmissionStatus(score, threshold2024);
  const cfg = STATUS_CONFIG[status];
  const isFav = favorites.includes(school.id);

  const diff = threshold2024 != null ? (score - threshold2024).toFixed(2) : null;

  return (
    <div className={`rounded-2xl border p-4 flex flex-col gap-3 transition-shadow hover:shadow-md ${cfg.bg}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 rounded px-2 py-0.5">
              {TYPE_LABELS[school.type] ?? school.type}
            </span>
            <span className={`text-xs font-semibold rounded px-2 py-0.5 flex items-center gap-1 ${cfg.badge}`}>
              <span className={`inline-block w-2 h-2 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          </div>
          <h3 className="mt-1 font-bold text-slate-800 text-sm leading-tight">{school.school}</h3>
          <p className="text-sm text-slate-600 mt-0.5 italic">{school.profile}</p>
          <p className="text-xs text-slate-400 mt-0.5">{school.address}</p>
        </div>

        {/* Ulubione */}
        <button
          onClick={() => toggleFavorite(school.id)}
          title={isFav ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
          className="text-xl leading-none mt-0.5 flex-shrink-0 hover:scale-110 transition-transform"
        >
          {isFav ? '❤️' : '🤍'}
        </button>
      </div>

      {/* Progi i wynik */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="bg-white/70 rounded-lg py-2 px-1">
          <div className="font-extrabold text-base text-slate-800">{threshold2024 ?? '—'}</div>
          <div className="text-slate-500">próg 2024</div>
        </div>
        <div className="bg-white/70 rounded-lg py-2 px-1">
          <div className="font-extrabold text-base text-slate-800">{threshold2023 ?? '—'}</div>
          <div className="text-slate-500">próg 2023</div>
        </div>
        <div className="bg-white/70 rounded-lg py-2 px-1">
          <div className={`font-extrabold text-base ${diff != null && diff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {diff != null ? (diff >= 0 ? `+${diff}` : diff) : '—'}
          </div>
          <div className="text-slate-500">różnica</div>
        </div>
      </div>

      {/* Przedmioty */}
      {school.subjects?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {school.subjects.map((s) => (
            <span key={s} className="text-xs bg-white/80 border border-slate-200 text-slate-600 rounded px-2 py-0.5">
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

