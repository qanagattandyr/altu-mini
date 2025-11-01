import healthRaw from '../../assets/data/health_daily.json';
import screentimeRaw from '../../assets/data/screentime.json';
import { HealthDaily, ScreenTimeEntry, NamedSeries, TimeSeriesPoint, CorrelationPair } from '../types';

function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map((s) => parseInt(s, 10));
  return new Date(Date.UTC(y, m - 1, d));
}

export function loadHealthDaily(): HealthDaily[] {
  // Expecting array with keys matching: date, steps, sleep_minutes, active_energy_kcal, workout_minutes
  return (healthRaw as any[]).map((row) => ({
    date: row.date,
    steps: Number(row.steps ?? 0),
    sleepMinutes: Number(row.sleep_minutes ?? 0),
    activeEnergyKcal: Number(row.active_energy_kcal ?? 0),
    workoutMinutes: Number(row.workout_minutes ?? 0),
  }));
}

export function loadScreentime(): ScreenTimeEntry[] {
  // Expecting array with: date, app, minutes, category
  return (screentimeRaw as any[]).map((row) => ({
    date: row.date,
    app: String(row.app),
    minutes: Number(row.minutes ?? 0),
    category: String(row.category ?? ''),
  }));
}

export function buildTimeSeries(values: { date: string; value: number }[]): TimeSeriesPoint[] {
  return values
    .map((v) => ({ date: parseDate(v.date), value: v.value }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function healthSeries(): { steps: NamedSeries; sleep: NamedSeries; energy: NamedSeries; workout: NamedSeries } {
  const h = loadHealthDaily();
  return {
    steps: { name: 'Steps', points: buildTimeSeries(h.map((r) => ({ date: r.date, value: r.steps }))) },
    sleep: { name: 'Sleep (min)', points: buildTimeSeries(h.map((r) => ({ date: r.date, value: r.sleepMinutes }))) },
    energy: { name: 'Active Energy (kcal)', points: buildTimeSeries(h.map((r) => ({ date: r.date, value: r.activeEnergyKcal }))) },
    workout: { name: 'Workout (min)', points: buildTimeSeries(h.map((r) => ({ date: r.date, value: r.workoutMinutes }))) },
  };
}

export function correlationPairs(xKey: keyof HealthDaily, yKey: keyof HealthDaily): CorrelationPair[] {
  const h = loadHealthDaily();
  return h.map((r) => ({ x: Number(r[xKey] as number), y: Number(r[yKey] as number), date: parseDate(r.date) }));
}

export function aggregateScreentimeByApp(): Record<string, { totalMinutes: number; days: number }> {
  const data = loadScreentime();
  const agg: Record<string, { totalMinutes: number; days: number }> = {};
  for (const row of data) {
    const key = row.app;
    if (!agg[key]) agg[key] = { totalMinutes: 0, days: 0 };
    agg[key].totalMinutes += row.minutes;
    agg[key].days += 1;
  }
  return agg;
}

export function aggregateScreentimeByCategory(): Record<string, { totalMinutes: number; days: number }> {
  const data = loadScreentime();
  const agg: Record<string, { totalMinutes: number; days: number }> = {};
  for (const row of data) {
    const key = row.category || 'Other';
    if (!agg[key]) agg[key] = { totalMinutes: 0, days: 0 };
    agg[key].totalMinutes += row.minutes;
    agg[key].days += 1;
  }
  return agg;
}

export function weekdayVsWeekendForApp(appName: string): { weekdayAvg: number; weekendAvg: number } {
  const data = loadScreentime().filter((r) => r.app === appName);
  let weekdaySum = 0;
  let weekdayCount = 0;
  let weekendSum = 0;
  let weekendCount = 0;
  for (const r of data) {
    const dt = parseDate(r.date);
    const day = dt.getUTCDay();
    const isWeekend = day === 0 || day === 6;
    if (isWeekend) {
      weekendSum += r.minutes;
      weekendCount += 1;
    } else {
      weekdaySum += r.minutes;
      weekdayCount += 1;
    }
  }
  return {
    weekdayAvg: weekdayCount ? weekdaySum / weekdayCount : 0,
    weekendAvg: weekendCount ? weekendSum / weekendCount : 0,
  };
}
