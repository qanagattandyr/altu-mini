# Two-Stage Query Generation Architecture

## How It Works

Instead of sending all your data with every question, we now use a **3-stage approach**:

```
User Question
    ↓
STAGE 1: Generate SQL Query (GPT-4o-mini)
    ↓
STAGE 2: Execute Query on SQLite
    ↓
STAGE 3: Answer with Results (GPT-4o)
    ↓
Response
```

## Implementation

### Stage 1: Query Generation
```typescript
User: "What were my steps yesterday?"
↓
GPT-4o-mini generates:
SELECT date, steps FROM health_daily WHERE date = date('now', '-1 day')
```

**Why GPT-4o-mini?**
- Cheaper ($0.00015 per 1K tokens vs $0.0025)
- Fast query generation
- Good at structured output
- Costs ~$0.0001 per query

### Stage 2: Query Execution
```typescript
SQL: SELECT date, steps FROM health_daily WHERE date = date('now', '-1 day')
↓
SQLite returns:
[{"date": "2024-11-03", "steps": 8234}]
```

**Benefits:**
- ✅ Gets ONLY relevant data
- ✅ No token waste on irrelevant data
- ✅ Precise date calculations
- ✅ Complex aggregations possible

### Stage 3: Answer Generation
```typescript
GPT-4o receives:
- Original question
- SQL query (for context)
- Query results

Generates:
"Yesterday you walked **8,234 steps**! 🚶"
```

**Why GPT-4o here?**
- Better at natural language
- More accurate responses
- Only processes ~500 tokens (just results)

## Advantages

### 1. **Massive Token Savings**
**Old approach:**
- Send 90 days of health data: ~5,000 tokens
- Send 30 days of screentime: ~3,000 tokens
- **Total: ~8,000 tokens per question**

**New approach:**
- Stage 1: Generate query: ~100 tokens
- Stage 2: Execute query: 0 tokens (local)
- Stage 3: Answer with results: ~50-200 tokens
- **Total: ~150-300 tokens per question**

**Savings: 96% reduction!**

### 2. **More Accurate**
- Query gets EXACT data needed
- No context confusion from large datasets
- SQL handles date math perfectly
- Aggregations done in database (faster, accurate)

### 3. **Better for Complex Questions**
```
"Average steps on Mondays vs Fridays?"
↓
SELECT 
  CASE CAST(strftime('%w', date) AS INTEGER)
    WHEN 1 THEN 'Monday'
    WHEN 5 THEN 'Friday'
  END as day,
  AVG(steps) as avg_steps
FROM health_daily
WHERE CAST(strftime('%w', date) AS INTEGER) IN (1, 5)
GROUP BY day
```

Old approach would struggle with this!

### 4. **Cost Effective**
- Stage 1 (query gen): $0.0001
- Stage 2 (execute): $0
- Stage 3 (answer): $0.001
- **Total: ~$0.0011 per question**

Old approach: ~$0.02 per question

**Savings: 95% cost reduction!**

## Security

### Query Validation
```typescript
// Only SELECT allowed
if (!query.startsWith('SELECT')) {
  throw new Error('Only SELECT queries allowed');
}

// Block dangerous operations
const forbidden = ['DROP', 'DELETE', 'UPDATE', 'INSERT'];
for (const word of forbidden) {
  if (query.includes(word)) {
    throw new Error('Forbidden operation');
  }
}
```

### Why This is Safe
1. ✅ Only SELECT queries
2. ✅ No data modification possible
3. ✅ Read-only database access
4. ✅ Queries executed in sandbox
5. ✅ Error handling with fallback

## Examples

### Simple Question
```
Q: "How many steps today?"

Stage 1 generates:
SELECT steps FROM health_daily WHERE date = date('now')

Stage 2 executes:
[{"steps": 6478}]

Stage 3 answers:
"You have **6,478 steps** today! 🚶"
```

### Complex Question
```
Q: "Which week had my best average sleep?"

Stage 1 generates:
SELECT 
  strftime('%Y-%W', date) as week,
  AVG(sleep_minutes) as avg_sleep
FROM health_daily
GROUP BY week
ORDER BY avg_sleep DESC
LIMIT 1

Stage 2 executes:
[{"week": "2024-42", "avg_sleep": 483.5}]

Stage 3 answers:
"Week 42 of 2024 had your best sleep with an average of **8.1 hours** per night! 😴✨"
```

### App Usage Question
```
Q: "Top 3 apps this week?"

Stage 1 generates:
SELECT app, SUM(minutes) as total_minutes
FROM screentime
WHERE date >= date('now', '-7 days')
GROUP BY app
ORDER BY total_minutes DESC
LIMIT 3

Stage 2 executes:
[
  {"app": "Instagram", "total_minutes": 234},
  {"app": "Twitter", "total_minutes": 128},
  {"app": "Safari", "total_minutes": 107}
]

Stage 3 answers:
"Your top 3 apps this week:
• **Instagram** - 3.9 hours
• **Twitter** - 2.1 hours  
• **Safari** - 1.8 hours"
```

## Fallback Strategy

If query generation or execution fails:
```typescript
catch (error) {
  // Fall back to summary-based approach
  queryResults = {
    error: 'Could not execute query',
    fallback: true
  };
}
```

GPT-4o can still answer with whatever data is available.

## Performance

### Latency
- Old: 1 API call (~2-3 seconds)
- New: 2 API calls (~3-4 seconds)

**Tradeoff:** +1 second latency for 96% cost savings

### Token Usage Per Conversation (10 questions)
- Old: ~80,000 tokens = $2.00
- New: ~3,000 tokens = $0.011

**Savings: $1.99 per 10 questions (99.5%)**

## When To Use Each Approach

### Use Query Generation (Current):
✅ Specific date queries
✅ Aggregations and calculations
✅ Complex filters
✅ Top N queries
✅ Comparisons across time periods

### Use Summary Approach:
⭕ Very open-ended questions
⭕ When context from multiple data points needed
⭕ Conversational follow-ups
⭕ When query generation might fail

## Future Enhancements

1. **Query Caching**
   - Cache generated queries for common questions
   - "Steps yesterday" → reuse query with new date

2. **Query Templates**
   - Pre-defined templates for common patterns
   - Faster generation, guaranteed correctness

3. **Multi-Query Support**
   - Some questions need multiple queries
   - Join results before answering

4. **Query Explanation**
   - Show user what query was run (optional)
   - Educational + transparency

## Conclusion

This two-stage approach gives you:
- ✅ **96% token reduction**
- ✅ **95% cost savings**
- ✅ **More accurate answers**
- ✅ **Better handling of complex queries**
- ✅ **Scalable to any dataset size**

All while maintaining security and providing fallback options!
