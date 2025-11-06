import { getDatabase } from '../db/database';

/**
 * Two-stage query approach:
 * 1. GPT generates SQL query based on question
 * 2. Execute query to get relevant data
 * 3. GPT answers with only relevant data
 */

export async function executeGeneratedQuery(sqlQuery: string): Promise<any[]> {
  const db = await getDatabase();
  
  // Security: Only allow SELECT statements
  const trimmed = sqlQuery.trim().toUpperCase();
  if (!trimmed.startsWith('SELECT')) {
    throw new Error('Only SELECT queries are allowed');
  }
  
  // Prevent dangerous operations
  const forbidden = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE'];
  for (const word of forbidden) {
    if (trimmed.includes(word)) {
      throw new Error(`Query contains forbidden operation: ${word}`);
    }
  }
  
  try {
    const results = await db.getAllAsync(sqlQuery);
    return results;
  } catch (error: any) {
    throw new Error(`Query execution failed: ${error.message}`);
  }
}

export function getQueryGenerationSystemPrompt(): string {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
  const year = today.getFullYear();
  
  // Calculate yesterday
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  // Calculate 7 days ago
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
  
  return `You are a SQL query generator for a health tracking SQLite database.

CURRENT DATE: ${todayStr} (${year})
YESTERDAY: ${yesterdayStr}
7 DAYS AGO: ${sevenDaysAgoStr}

DATABASE SCHEMA:
1. health_daily table:
   - date (TEXT, format YYYY-MM-DD)
   - steps (INTEGER)
   - sleep_minutes (INTEGER)
   - active_energy_kcal (INTEGER)
   - workout_minutes (INTEGER)

2. screentime table:
   - date (TEXT, format YYYY-MM-DD)
   - app (TEXT)
   - minutes (INTEGER)
   - category (TEXT)

IMPORTANT DATE INSTRUCTIONS:
- Today is ${todayStr}
- Yesterday is ${yesterdayStr}
- Current year is ${year}
- When user says "10/25" they mean ${year}-10-25
- When user says "today" use '${todayStr}'
- When user says "yesterday" use '${yesterdayStr}'
- When user says "last week" use dates >= '${sevenDaysAgoStr}'
- ALWAYS use explicit date strings like '${todayStr}', NOT date('now')
- Always use YYYY-MM-DD format for dates

QUERY INSTRUCTIONS:
1. Generate ONLY a SELECT query, nothing else
2. Use proper SQLite syntax
3. For dates, use explicit strings like '2025-11-04', NOT date('now')
4. Use aggregations: SUM, AVG, COUNT, MAX, MIN
5. Return ONLY the SQL query, no explanation
6. Query should return data relevant to answer the user's question

EXAMPLES:
Q: "What were my steps yesterday?"
A: SELECT date, steps FROM health_daily WHERE date = '${yesterdayStr}'

Q: "What were my steps today?"
A: SELECT date, steps FROM health_daily WHERE date = '${todayStr}'

Q: "Average sleep last week?"
A: SELECT AVG(sleep_minutes) as avg_sleep FROM health_daily WHERE date >= '${sevenDaysAgoStr}' AND date <= '${todayStr}'

Q: "What was my sleep on 10/25?"
A: SELECT date, sleep_minutes FROM health_daily WHERE date = '${year}-10-25'

Q: "Top 3 apps by usage?"
A: SELECT app, SUM(minutes) as total_minutes FROM screentime GROUP BY app ORDER BY total_minutes DESC LIMIT 3

Q: "Days I worked out more than 30 minutes?"
A: SELECT date, workout_minutes FROM health_daily WHERE workout_minutes > 30 ORDER BY date DESC

Now generate a query for the user's question.`;
}

export const ANSWER_SYSTEM_PROMPT = `You are Altu, a helpful health assistant.

You will receive:
1. The user's original question
2. The SQL query that was executed
3. The query results

INSTRUCTIONS:
1. Answer the user's question using ONLY the query results
2. Be concise and conversational
3. Use **bold** for numbers and key metrics
4. If results are empty, say data is not available
5. Don't mention SQL or technical details
6. Format nicely with markdown
7. IMPORTANT: Always address the user directly as "you/your" - this is THEIR personal data, not generic "people" data

EXAMPLES:
User: "What were my steps yesterday?"
Results: [{"date": "2024-11-03", "steps": 8234}]
Response: Yesterday you walked **8,234 steps**! 🚶

User: "Top 3 apps?"
Results: [{"app": "Instagram", "total_minutes": 234}, ...]
Response: Your top 3 apps are:
• **Instagram** - 3.9h
• **Twitter** - 2.1h
• **Safari** - 1.8h`;
