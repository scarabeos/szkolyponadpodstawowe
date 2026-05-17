import { useEffect } from 'react';
import useStore from './store/useStore';
import Header from './components/Header';
import Calculator from './components/Calculator';
import SchoolList from './components/SchoolList';

export default function App() {
  const setSchools = useStore((s) => s.setSchools);
  const activeTab = useStore((s) => s.activeTab);

  useEffect(() => {
    fetch('/lodz-schools.json')
      .then((r) => r.json())
      .then((data) => setSchools(data))
      .catch((err) => console.error('Błąd ładowania danych szkół:', err));
  }, [setSchools]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {activeTab === 'kalkulator' && <Calculator />}
        {activeTab === 'szkoly' && <SchoolList />}
        {activeTab === 'ulubione' && <SchoolList favoritesOnly />}
      </main>

      <footer className="text-center text-xs text-slate-400 py-4 border-t border-slate-200">
        Dane progów punktowych na podstawie informacji Wydziału Edukacji UMŁ (rok szkolny 2023/2024 i 2022/2023).
        Aplikacja ma charakter informacyjny – zawsze sprawdzaj oficjalne komunikaty rekrutacyjne.
      </footer>
    </div>
  );
}

