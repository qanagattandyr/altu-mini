import * as SQLite from 'expo-sqlite';
import healthRaw from '../../assets/data/health_daily.json';
import screentimeRaw from '../../assets/data/screentime.json';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) {
    return db;
  }

  db = await SQLite.openDatabaseAsync('altu.db');
  await initializeDatabase(db);
  return db;
}

async function initializeDatabase(database: SQLite.SQLiteDatabase) {
  // Create tables
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS health_daily (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE NOT NULL,
      steps INTEGER DEFAULT 0,
      sleep_minutes INTEGER DEFAULT 0,
      active_energy_kcal INTEGER DEFAULT 0,
      workout_minutes INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS screentime (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      app TEXT NOT NULL,
      minutes INTEGER DEFAULT 0,
      category TEXT,
      UNIQUE(date, app)
    );

    CREATE INDEX IF NOT EXISTS idx_health_date ON health_daily(date);
    CREATE INDEX IF NOT EXISTS idx_screentime_date ON screentime(date);
    CREATE INDEX IF NOT EXISTS idx_screentime_category ON screentime(category);
  `);

  // Check if data already exists
  const healthCount = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM health_daily'
  );

  // Check what the latest date in DB is
  const latestDate = await database.getFirstAsync<{ latest: string }>(
    'SELECT MAX(date) as latest FROM health_daily'
  );

  const expectedLatest = healthRaw[healthRaw.length - 1].date;
  
  // Re-seed if empty OR if data is outdated
  if ((healthCount && healthCount.count === 0) || 
      !latestDate?.latest || 
      latestDate.latest !== expectedLatest) {
    console.log('Seeding database with initial data...');
    await seedDatabase(database);
  }
}

async function seedDatabase(database: SQLite.SQLiteDatabase) {
  // Insert health data
  const healthStatement = await database.prepareAsync(
    'INSERT OR REPLACE INTO health_daily (date, steps, sleep_minutes, active_energy_kcal, workout_minutes) VALUES (?, ?, ?, ?, ?)'
  );

  for (const row of healthRaw) {
    await healthStatement.executeAsync([
      row.date,
      row.steps || 0,
      row.sleep_minutes || 0,
      row.active_energy_kcal || 0,
      row.workout_minutes || 0,
    ]);
  }
  await healthStatement.finalizeAsync();

  // Insert screentime data
  const screentimeStatement = await database.prepareAsync(
    'INSERT OR REPLACE INTO screentime (date, app, minutes, category) VALUES (?, ?, ?, ?)'
  );

  for (const row of screentimeRaw) {
    await screentimeStatement.executeAsync([
      row.date,
      row.app,
      row.minutes || 0,
      row.category || 'Other',
    ]);
  }
  await screentimeStatement.finalizeAsync();

  console.log('Database seeded successfully');
}

// Query functions
export async function getAllHealthData(database: SQLite.SQLiteDatabase) {
  return await database.getAllAsync<{
    id: number;
    date: string;
    steps: number;
    sleep_minutes: number;
    active_energy_kcal: number;
    workout_minutes: number;
  }>('SELECT * FROM health_daily ORDER BY date ASC');
}

export async function getAllScreentimeData(database: SQLite.SQLiteDatabase) {
  return await database.getAllAsync<{
    id: number;
    date: string;
    app: string;
    minutes: number;
    category: string;
  }>('SELECT * FROM screentime ORDER BY date ASC, app ASC');
}

export async function getHealthByDate(database: SQLite.SQLiteDatabase, date: string) {
  return await database.getFirstAsync<{
    date: string;
    steps: number;
    sleep_minutes: number;
    active_energy_kcal: number;
    workout_minutes: number;
  }>('SELECT * FROM health_daily WHERE date = ?', [date]);
}

export async function getScreentimeByDate(database: SQLite.SQLiteDatabase, date: string) {
  return await database.getAllAsync<{
    date: string;
    app: string;
    minutes: number;
    category: string;
  }>('SELECT * FROM screentime WHERE date = ? ORDER BY minutes DESC', [date]);
}

export async function getScreentimeByCategory(database: SQLite.SQLiteDatabase) {
  return await database.getAllAsync<{
    category: string;
    total_minutes: number;
  }>(`
    SELECT category, SUM(minutes) as total_minutes 
    FROM screentime 
    GROUP BY category 
    ORDER BY total_minutes DESC
  `);
}

export async function getScreentimeByCategoryLast7Days(
  database: SQLite.SQLiteDatabase, 
  lastDate: string
) {
  return await database.getAllAsync<{
    category: string;
    total_minutes: number;
  }>(`
    SELECT category, SUM(minutes) as total_minutes 
    FROM screentime 
    WHERE date >= date(?, '-7 days') AND date <= ?
    GROUP BY category 
    ORDER BY total_minutes DESC
  `, [lastDate, lastDate]);
}
