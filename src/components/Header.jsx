import useStore from '../store/useStore';

export default function Header() {
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const score = useStore((s) => s.getScore());

  return (
    <header className="bg-indigo-700 text-white shadow-md">
      <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight">🎓 Szkoły Łódź</h1>
          <p className="text-indigo-200 text-sm">Kalkulator rekrutacji ponadpodstawowej</p>
        </div>

        {/* Wynik */}
        <div className="bg-indigo-600 rounded-xl px-4 py-2 text-center min-w-[130px]">
          <div className="text-xs text-indigo-200 uppercase tracking-wide">Twój wynik</div>
          <div className="text-3xl font-extrabold">{score.toFixed(2)}</div>
          <div className="text-xs text-indigo-300">/ 200 pkt</div>
        </div>
      </div>

      {/* Zakładki */}
      <nav className="max-w-5xl mx-auto px-4 flex gap-1 pb-0">
        {['kalkulator', 'szkoly', 'ulubione'].map((tab) => {
          const labels = { kalkulator: '🧮 Kalkulator', szkoly: '🏫 Szkoły', ulubione: '❤️ Ulubione' };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab
                  ? 'bg-white text-indigo-700'
                  : 'text-indigo-200 hover:bg-indigo-600'
              }`}
            >
              {labels[tab]}
            </button>
          );
        })}
      </nav>
    </header>
  );
}

