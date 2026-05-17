/**
 * Przelicza ocenę (1-6) na punkty rekrutacyjne.
 * Skala MEN: celujący=18, bardzo dobry=17, dobry=14, dostateczny=11, dopuszczający=8, niedostateczny=0
 */
export function gradeToPoints(grade) {
  const map = { 6: 18, 5: 17, 4: 14, 3: 11, 2: 8, 1: 2 };
  return map[grade] ?? 0;
}

/**
 * Oblicza łączną liczbę punktów rekrutacyjnych.
 *
 * Wzór MEN:
 *  - Punkty za oceny (max 72):
 *      język polski (max 18) + matematyka (max 18) + dwa inne obowiązkowe (max 18 każdy)
 *  - Punkty z egzaminu ósmoklasisty (max 100):
 *      wynik z języka polskiego [%] × 0,35
 *      + wynik z matematyki [%] × 0,35
 *      + wynik z języka obcego [%] × 0,30
 *  - Dodatkowe punkty za osiągnięcia (max 28)
 *
 * @param {Object} grades        - { polski, matematyka, przedmiot1, przedmiot2 }  (wartości 1-6)
 * @param {Object} examResults   - { polski_proc, matematyka_proc, angielski_proc } (wartości 0-100)
 * @param {number} extraPoints   - punkty za osiągnięcia (0-28)
 * @returns {number} łączna liczba punktów (max 200)
 */
export function calculateScore(grades, examResults, extraPoints = 0) {
  const polishPts = gradeToPoints(grades.polski ?? 0);
  const mathPts = gradeToPoints(grades.matematyka ?? 0);
  const other1Pts = gradeToPoints(grades.przedmiot1 ?? 0);
  const other2Pts = gradeToPoints(grades.przedmiot2 ?? 0);
  const gradePts = polishPts + mathPts + other1Pts + other2Pts;

  const examPts =
    (examResults.polski_proc ?? 0) * 0.35 +
    (examResults.matematyka_proc ?? 0) * 0.35 +
    (examResults.angielski_proc ?? 0) * 0.3;

  const extra = Math.min(Number(extraPoints) || 0, 28);
  return Math.round((gradePts + examPts + extra) * 100) / 100;
}

/**
 * Zwraca status porównania wyniku kandydata z progiem szkoły.
 * @returns {'above' | 'close' | 'below' | 'unknown'}
 */
export function getAdmissionStatus(score, threshold) {
  if (threshold == null) return 'unknown';
  if (score >= threshold) return 'above';
  if (score >= threshold - 10) return 'close';
  return 'below';
}

