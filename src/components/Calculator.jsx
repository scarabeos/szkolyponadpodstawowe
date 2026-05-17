import useStore from '../store/useStore';
import { gradeToPoints } from '../utils/scoring';

const GRADE_LABELS = { 6: 'celujący', 5: 'bardzo dobry', 4: 'dobry', 3: 'dostateczny', 2: 'dopuszczający', 1: 'niedostateczny' };

function GradeSelect({ label, storeKey }) {
  const value = useStore((s) => s.grades[storeKey]);
  const setGrade = useStore((s) => s.setGrade);

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-slate-600">{label}</label>
      <div className="flex items-center gap-2">
        <select
          value={value}
          onChange={(e) => setGrade(storeKey, e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          {[6, 5, 4, 3, 2, 1].map((g) => (
            <option key={g} value={g}>
              {g} – {GRADE_LABELS[g]}
            </option>
          ))}
        </select>
        <span className="text-xs bg-indigo-100 text-indigo-700 font-bold rounded px-2 py-1 min-w-[44px] text-center">
          {gradeToPoints(value)} pkt
        </span>
      </div>
    </div>
  );
}

function ExamSlider({ label, storeKey }) {
  const value = useStore((s) => s.examResults[storeKey]);
  const setExamResult = useStore((s) => s.setExamResult);

  const multiplier = storeKey === 'angielski_proc' ? 0.3 : 0.35;
  const pts = ((value * multiplier)).toFixed(2);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-slate-600">{label}</label>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-indigo-700">{value}%</span>
          <span className="text-xs bg-indigo-100 text-indigo-700 font-bold rounded px-2 py-1">
            {pts} pkt
          </span>
        </div>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => setExamResult(storeKey, e.target.value)}
        className="w-full accent-indigo-600"
      />
      <div className="flex justify-between text-xs text-slate-400">
        <span>0%</span><span>50%</span><span>100%</span>
      </div>
    </div>
  );
}

export default function Calculator() {
  const extraPoints = useStore((s) => s.extraPoints);
  const setExtraPoints = useStore((s) => s.setExtraPoints);
  const score = useStore((s) => s.getScore());
  const grades = useStore((s) => s.grades);
  const examResults = useStore((s) => s.examResults);

  const gradePts = gradeToPoints(grades.polski) + gradeToPoints(grades.matematyka) +
    gradeToPoints(grades.przedmiot1) + gradeToPoints(grades.przedmiot2);
  const examPts = (examResults.polski_proc * 0.35 + examResults.matematyka_proc * 0.35 + examResults.angielski_proc * 0.3);

  const setActiveTab = useStore((s) => s.setActiveTab);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Podsumowanie */}
      <div className="bg-white rounded-2xl shadow p-5 border border-slate-100">
        <h2 className="text-lg font-bold text-slate-700 mb-4">📊 Podsumowanie punktów</h2>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-blue-50 rounded-xl p-3">
            <div className="text-2xl font-extrabold text-blue-700">{gradePts}</div>
            <div className="text-xs text-blue-500 mt-1">za oceny<br/><span className="text-slate-400">max 72</span></div>
          </div>
          <div className="bg-purple-50 rounded-xl p-3">
            <div className="text-2xl font-extrabold text-purple-700">{examPts.toFixed(2)}</div>
            <div className="text-xs text-purple-500 mt-1">z egzaminu<br/><span className="text-slate-400">max 100</span></div>
          </div>
          <div className="bg-amber-50 rounded-xl p-3">
            <div className="text-2xl font-extrabold text-amber-700">{extraPoints}</div>
            <div className="text-xs text-amber-500 mt-1">osiągnięcia<br/><span className="text-slate-400">max 28</span></div>
          </div>
        </div>
        <div className="mt-4 text-center">
          <div className="text-4xl font-extrabold text-indigo-700">{score.toFixed(2)}</div>
          <div className="text-sm text-slate-500">łączny wynik / 200 punktów</div>
        </div>
        <div className="mt-3">
          <div className="w-full bg-slate-100 rounded-full h-3">
            <div
              className="bg-indigo-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (score / 200) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Oceny */}
      <div className="bg-white rounded-2xl shadow p-5 border border-slate-100">
        <h2 className="text-lg font-bold text-slate-700 mb-4">📝 Oceny na świadectwie</h2>
        <p className="text-xs text-slate-400 mb-4">
          Wliczane są: język polski, matematyka oraz dwa inne przedmioty (wybrane przez szkołę lub wskazane w kryteriach).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <GradeSelect label="Język polski" storeKey="polski" />
          <GradeSelect label="Matematyka" storeKey="matematyka" />
          <GradeSelect label="Przedmiot dodatkowy 1" storeKey="przedmiot1" />
          <GradeSelect label="Przedmiot dodatkowy 2" storeKey="przedmiot2" />
        </div>
      </div>

      {/* Egzamin */}
      <div className="bg-white rounded-2xl shadow p-5 border border-slate-100">
        <h2 className="text-lg font-bold text-slate-700 mb-4">📋 Wyniki egzaminu ósmoklasisty</h2>
        <p className="text-xs text-slate-400 mb-4">
          Język polski × 0,35 + matematyka × 0,35 + język obcy × 0,30 = maks. 100 punktów
        </p>
        <div className="space-y-5">
          <ExamSlider label="Język polski" storeKey="polski_proc" />
          <ExamSlider label="Matematyka" storeKey="matematyka_proc" />
          <ExamSlider label="Język angielski" storeKey="angielski_proc" />
        </div>
      </div>

      {/* Osiągnięcia */}
      <div className="bg-white rounded-2xl shadow p-5 border border-slate-100">
        <h2 className="text-lg font-bold text-slate-700 mb-2">🏆 Dodatkowe punkty za osiągnięcia</h2>
        <p className="text-xs text-slate-400 mb-4">
          Finaliści olimpiad, wolontariat, wzorowe zachowanie, zawody sportowe – łącznie maksymalnie 28 punktów.
        </p>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="0"
            max="28"
            value={extraPoints}
            onChange={(e) => setExtraPoints(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 w-24 text-lg font-bold text-center focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <span className="text-sm text-slate-500">punktów (0 – 28)</span>
        </div>
      </div>

      <div className="text-center pb-4">
        <button
          onClick={() => setActiveTab('szkoly')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow"
        >
          Zobacz dopasowane szkoły →
        </button>
      </div>
    </div>
  );
}

