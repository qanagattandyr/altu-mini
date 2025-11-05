import { getDatabase } from '../db/database';

/**
 * Helper functions that could be exposed to GPT via function calling
 * For future implementation of OpenAI function calling feature
 */

export async function getHealthForDateRange(startDate: string, endDate: string) {
  const db = await getDatabase();
  const results = await db.getAllAsync<{
    date: string;
    steps: number;
    sleep_minutes: number;
    active_energy_kcal: number;
    workout_minutes: number;
  }>(
    'SELECT * FROM health_daily WHERE date >= ? AND date <= ? ORDER BY date ASC',
    [startDate, endDate]
  );
  return results;
}

export async function getScreentimeForApp(appName: string, days: number = 7) {
  const db = await getDatabase();
  const results = await db.getAllAsync<{
    date: string;
    minutes: number;
  }>(
    `SELECT date, SUM(minutes) as minutes 
     FROM screentime 
     WHERE app LIKE ? 
     AND date >= date('now', '-' || ? || ' days')
     GROUP BY date 
     ORDER BY date DESC`,
    [`%${appName}%`, days]
  );
  return results;
}

export async function getTopApps(limit: number = 5) {
  const db = await getDatabase();
  const results = await db.getAllAsync<{
    app: string;
    total_minutes: number;
    days_used: number;
  }>(
    `SELECT app, 
            SUM(minutes) as total_minutes, 
            COUNT(DISTINCT date) as days_used
     FROM screentime 
     GROUP BY app 
     ORDER BY total_minutes DESC 
     LIMIT ?`,
    [limit]
  );
  return results;
}

export async function getCorrelationData(metric1: 'steps' | 'sleep_minutes' | 'workout_minutes' | 'active_energy_kcal', 
                                         metric2: 'steps' | 'sleep_minutes' | 'workout_minutes' | 'active_energy_kcal') {
  const db = await getDatabase();
  const results = await db.getAllAsync<any>(
    `SELECT date, ${metric1} as metric1, ${metric2} as metric2 
     FROM health_daily 
     WHERE ${metric1} > 0 AND ${metric2} > 0
     ORDER BY date ASC`
  );
  return results;
}

export async function getStreaks(metric: 'steps' | 'workout_minutes', threshold: number) {
  const db = await getDatabase();
  const results = await db.getAllAsync<{
    date: string;
    value: number;
  }>(
    `SELECT date, ${metric} as value 
     FROM health_daily 
     WHERE ${metric} >= ?
     ORDER BY date DESC`,
    [threshold]
  );
  
  // Calculate streaks
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  
  for (let i = 0; i < results.length; i++) {
    if (i === 0) {
      currentStreak = 1;
      tempStreak = 1;
    } else {
      const prevDate = new Date(results[i - 1].date);
      const currDate = new Date(results[i].date);
      const dayDiff = (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (dayDiff === 1) {
        tempStreak++;
        if (i === 0) currentStreak = tempStreak;
      } else {
        if (tempStreak > longestStreak) longestStreak = tempStreak;
        tempStreak = 1;
      }
    }
  }
  
  if (tempStreak > longestStreak) longestStreak = tempStreak;
  
  return {
    currentStreak,
    longestStreak,
    metric,
    threshold
  };
}

/**
 * Function definitions for OpenAI function calling
 * These can be added to the API request to let GPT call these functions
 */
export const AVAILABLE_FUNCTIONS = [
  {
    name: 'getHealthForDateRange',
    description: 'Get health data for a specific date range',
    parameters: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format'
        },
        endDate: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format'
        }
      },
      required: ['startDate', 'endDate']
    }
  },
  {
    name: 'getScreentimeForApp',
    description: 'Get screentime data for a specific app',
    parameters: {
      type: 'object',
      properties: {
        appName: {
          type: 'string',
          description: 'Name of the app to query'
        },
        days: {
          type: 'number',
          description: 'Number of days to look back (default 7)'
        }
      },
      required: ['appName']
    }
  },
  {
    name: 'getStreaks',
    description: 'Calculate current and longest streaks for a metric',
    parameters: {
      type: 'object',
      properties: {
        metric: {
          type: 'string',
          enum: ['steps', 'workout_minutes'],
          description: 'The metric to calculate streaks for'
        },
        threshold: {
          type: 'number',
          description: 'Minimum value to count as a streak day'
        }
      },
      required: ['metric', 'threshold']
    }
  }
];
