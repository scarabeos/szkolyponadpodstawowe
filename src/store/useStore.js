import { create } from 'zustand';
import { calculateScore } from '../utils/scoring';

const FAVORITES_KEY = 'lodz_schools_favorites';

function loadFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY)) ?? [];
  } catch {
    return [];
  }
}

const useStore = create((set, get) => ({
  // --- Dane szkół ---
  schools: [],
  schoolsLoaded: false,
  setSchools: (schools) => set({ schools, schoolsLoaded: true }),

  // --- Kalkulator: oceny ---
  grades: {
    polski: 5,
    matematyka: 5,
    przedmiot1: 5,
    przedmiot2: 5,
  },
  setGrade: (key, value) =>
    set((s) => ({ grades: { ...s.grades, [key]: Number(value) } })),

  // --- Kalkulator: wyniki egzaminu ---
  examResults: {
    polski_proc: 70,
    matematyka_proc: 60,
    angielski_proc: 75,
  },
  setExamResult: (key, value) =>
    set((s) => ({ examResults: { ...s.examResults, [key]: Number(value) } })),

  // --- Dodatkowe punkty za osiągnięcia ---
  extraPoints: 0,
  setExtraPoints: (v) => set({ extraPoints: Math.min(28, Math.max(0, Number(v) || 0)) }),

  // --- Obliczony wynik ---
  getScore: () => {
    const { grades, examResults, extraPoints } = get();
    return calculateScore(grades, examResults, extraPoints);
  },

  // --- Filtry ---
  filters: {
    type: 'wszystkie',
    query: '',
    onlyReachable: false,
  },
  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value } })),

  // --- Ulubione ---
  favorites: loadFavorites(),
  toggleFavorite: (id) => {
    set((s) => {
      const exists = s.favorites.includes(id);
      const next = exists ? s.favorites.filter((f) => f !== id) : [...s.favorites, id];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      return { favorites: next };
    });
  },

  // --- Aktywna zakładka ---
  activeTab: 'kalkulator',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));

export default useStore;

