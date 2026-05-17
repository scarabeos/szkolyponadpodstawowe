import useStore from '../store/useStore';

const TYPE_OPTIONS = ['wszystkie', 'LO', 'T', 'BS1'];
const TYPE_LABELS = { wszystkie: 'Wszystkie typy', LO: 'Liceum (LO)', T: 'Technikum', BS1: 'Branżowa (BS1)' };

export default function FilterBar() {
  const filters = useStore((s) => s.filters);
  const setFilter = useStore((s) => s.setFilter);

  return (
    <div className="bg-white rounded-2xl shadow p-4 border border-slate-100 flex flex-col sm:flex-row gap-3">
      {/* Wyszukiwarka */}
      <input
        type="text"
        placeholder="🔍 Szukaj szkoły lub profilu..."
        value={filters.query}
        onChange={(e) => setFilter('query', e.target.value)}
        className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />

      {/* Typ szkoły */}
      <select
        value={filters.type}
        onChange={(e) => setFilter('type', e.target.value)}
        className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
      >
        {TYPE_OPTIONS.map((t) => (
          <option key={t} value={t}>{TYPE_LABELS[t]}</option>
        ))}
      </select>

      {/* Tylko osiągalne */}
      <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer whitespace-nowrap">
        <input
          type="checkbox"
          checked={filters.onlyReachable}
          onChange={(e) => setFilter('onlyReachable', e.target.checked)}
          className="accent-indigo-600 w-4 h-4"
        />
        Tylko osiągalne
      </label>
    </div>
  );
}

