import { getDatabase, getAllHealthData, getAllScreentimeData, getScreentimeByCategoryLast7Days } from '../db/database';
import { HealthDaily, ScreenTimeEntry, NamedSeries, TimeSeriesPoint } from '../types';

function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map((s) => parseInt(s, 10));
  return new Date(y, m - 1, d);
}

export async function loadHealthDaily(): Promise<HealthDaily[]> {
  const db = await getDatabase();
  const rows = await getAllHealthData(db);
  
  return rows.map((row) => ({
    date: row.date,
    steps: row.steps,
    sleepMinutes: row.sleep_minutes,
    activeEnergyKcal: row.active_energy_kcal,
    workoutMinutes: row.workout_minutes,
  }));
}

export async function loadScreentime(): Promise<ScreenTimeEntry[]> {
  const db = await getDatabase();
  const rows = await getAllScreentimeData(db);
  
  return rows.map((row) => ({
    date: row.date,
    app: row.app,
    minutes: row.minutes,
    category: row.category,
  }));
}

export function buildTimeSeries(values: { date: string; value: number }[]): TimeSeriesPoint[] {
  return values
    .map((v) => ({ date: parseDate(v.date), value: v.value }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

export async function healthSeries(): Promise<{ 
  steps: NamedSeries; 
  sleep: NamedSeries; 
  energy: NamedSeries; 
  workout: NamedSeries 
}> {
  const h = await loadHealthDaily();
  return {
    steps: { name: 'Steps', points: buildTimeSeries(h.map((r) => ({ date: r.date, value: r.steps }))) },
    sleep: { name: 'Sleep (min)', points: buildTimeSeries(h.map((r) => ({ date: r.date, value: r.sleepMinutes }))) },
    energy: { name: 'Active Energy (kcal)', points: buildTimeSeries(h.map((r) => ({ date: r.date, value: r.activeEnergyKcal }))) },
    workout: { name: 'Workout (min)', points: buildTimeSeries(h.map((r) => ({ date: r.date, value: r.workoutMinutes }))) },
  };
}

export async function aggregateScreentimeByCategoryLast7Days(lastDate: string): Promise<Record<string, number>> {
  const db = await getDatabase();
  const rows = await getScreentimeByCategoryLast7Days(db, lastDate);
  
  const agg: Record<string, number> = {};
  for (const row of rows) {
    agg[row.category] = row.total_minutes;
  }
  return agg;
}
