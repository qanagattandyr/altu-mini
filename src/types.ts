export type HealthDaily = {
  date: string; // YYYY-MM-DD
  steps: number;
  sleepMinutes: number;
  activeEnergyKcal: number;
  workoutMinutes: number;
};

export type ScreenTimeEntry = {
  date: string; // YYYY-MM-DD
  app: string;
  minutes: number;
  category: string;
};

export type TimeSeriesPoint = {
  date: Date;
  value: number;
};

export type NamedSeries = {
  name: string;
  points: TimeSeriesPoint[];
};

export type CorrelationPair = {
  x: number;
  y: number;
  date?: Date;
};
