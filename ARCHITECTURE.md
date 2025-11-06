# Altu Mini - Architecture Diagram

## 📊 Overall System Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          APP STARTUP (App.tsx)                          │
├─────────────────────────────────────────────────────────────────────────┤
│  1. NavigationContainer                                                 │
│  2. Stack Navigator (RootStack)                                         │
│     ├── Tabs (Bottom Tab Navigator)                                     │
│     │   ├── Dashboard Screen                                            │
│     │   └── Ask Altu Screen                                             │
│     └── Detail Screens (Modal presentations)                            │
│         ├── StepsDetailScreen                                           │
│         ├── SleepDetailScreen                                           │
│         ├── WorkoutDetailScreen                                         │
│         └── EnergyDetailScreen                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        DATA INITIALIZATION                              │
├─────────────────────────────────────────────────────────────────────────┤
│  src/db/database.ts                                                     │
│  ┌───────────────────────────────────────────┐                         │
│  │ initDatabase()                            │                         │
│  │ ├── Create tables if not exist            │                         │
│  │ │   ├── health_daily                      │                         │
│  │ │   └── screentime                        │                         │
│  │ ├── Check if data is outdated             │                         │
│  │ │   └── Compare latest DB date vs JSON    │                         │
│  │ └── Auto-reseed if needed                 │                         │
│  │     ├── DELETE all rows                   │                         │
│  │     └── INSERT from JSON files            │                         │
│  └───────────────────────────────────────────┘                         │
│                                                                          │
│  Data Sources:                                                          │
│  ├── assets/data/health_daily.json                                     │
│  │   └── Steps, Sleep, Workout, Energy (Jul 28 - Nov 6, 2025)         │
│  └── assets/data/screentime.json                                       │
│      └── App usage by category (Jul 28 - Nov 6, 2025)                 │
└─────────────────────────────────────────────────────────────────────────┘
```

## 🏠 Dashboard Screen Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      DASHBOARD SCREEN                                   │
│                   (src/screens/DashboardScreen.tsx)                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  useEffect on mount:                                                    │
│  ┌────────────────────────────────────────────────────────────┐        │
│  │ loadData()                                                 │        │
│  │ ├── healthSeries() → All metrics for 90 days              │        │
│  │ └── loadScreentime() → All screentime data                │        │
│  └────────────────────────────────────────────────────────────┘        │
│                           │                                             │
│                           ▼                                             │
│  ┌────────────────────────────────────────────────────────────┐        │
│  │ DATA PROCESSING                                            │        │
│  │ ├── Extract last 7 days for sparklines                    │        │
│  │ ├── Calculate 90-day averages                             │        │
│  │ ├── Calculate 7-day averages                              │        │
│  │ ├── Aggregate screentime by category                      │        │
│  │ │   ├── Filter last 7 days                                │        │
│  │ │   ├── Sum minutes per category                          │        │
│  │ │   ├── Sort descending                                   │        │
│  │ │   └── Take top 3 (.slice(0, 3))                         │        │
│  │ └── Calculate correlations (workout ↔ energy)             │        │
│  └────────────────────────────────────────────────────────────┘        │
│                           │                                             │
│                           ▼                                             │
│  ┌────────────────────────────────────────────────────────────┐        │
│  │ RENDER UI COMPONENTS                                       │        │
│  │                                                            │        │
│  │ 1. Header (Animated based on scroll)                      │        │
│  │    └── "Summary" + Today's date                           │        │
│  │                                                            │        │
│  │ 2. Metric Tiles (2x2 Grid + 1 Full Width)                │        │
│  │    ├── Steps (pink) → onPress: Navigate('StepsDetail')   │        │
│  │    ├── Sleep (purple) → onPress: Navigate('SleepDetail') │        │
│  │    ├── Workout (green) → Navigate('WorkoutDetail')       │        │
│  │    ├── Energy (orange) → Navigate('EnergyDetail')        │        │
│  │    └── Screen Time (blue, full width)                    │        │
│  │                                                            │        │
│  │ 3. Insights (Conditional Rendering)                       │        │
│  │    ├── Workout-Energy Correlation                         │        │
│  │    │   └── Shows if: corr > 0.7                           │        │
│  │    ├── High Screen Time                                   │        │
│  │    │   └── Shows if: today > 7d_avg * 1.15               │        │
│  │    ├── Low Steps                                          │        │
│  │    │   └── Shows if: today < 7d_avg * 0.93               │        │
│  │    └── Poor Sleep                                         │        │
│  │        └── Shows if: today < 90d_avg * 0.9               │        │
│  │                                                            │        │
│  │ 4. Screen Time Categories                                 │        │
│  │    └── Top 3 categories with bar charts                   │        │
│  └────────────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────────────┘
```

## 📈 Detail Screens Flow (Reusable Architecture)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DETAIL SCREEN (Generic Pattern)                      │
│  Examples: StepsDetailScreen, SleepDetailScreen, etc.                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  State Management:                                                      │
│  ├── timeRange: 'W' | 'M' | '6M' | 'Y'                                 │
│  ├── loading: boolean                                                   │
│  └── data: health series data                                          │
│                                                                          │
│  useEffect on mount & timeRange change:                                │
│  ┌────────────────────────────────────────────────────────────┐        │
│  │ loadData()                                                 │        │
│  │ └── healthSeries(days) → Get data for selected range      │        │
│  │     ├── W  → 7 days                                        │        │
│  │     ├── M  → 30 days                                       │        │
│  │     ├── 6M → 180 days                                      │        │
│  │     └── Y  → 365 days                                      │        │
│  └────────────────────────────────────────────────────────────┘        │
│                           │                                             │
│                           ▼                                             │
│  ┌────────────────────────────────────────────────────────────┐        │
│  │ DATA PROCESSING                                            │        │
│  │ ├── Extract metric data (steps/sleep/workout/energy)      │        │
│  │ ├── Calculate total for period                            │        │
│  │ ├── Calculate average                                     │        │
│  │ └── Generate highlights                                   │        │
│  │     ├── Average value                                     │        │
│  │     ├── Comparison to goal (sleep: 8h)                    │        │
│  │     └── Count thresholds (e.g., high energy days)         │        │
│  └────────────────────────────────────────────────────────────┘        │
│                           │                                             │
│                           ▼                                             │
│  ┌────────────────────────────────────────────────────────────┐        │
│  │ RENDER REUSABLE COMPONENTS                                 │        │
│  │                                                            │        │
│  │ 1. DetailHeader                                            │        │
│  │    └── Back button + Title                                │        │
│  │                                                            │        │
│  │ 2. TimeRangeSelector                                       │        │
│  │    └── [W] [M] [6M] [Y] buttons                           │        │
│  │                                                            │        │
│  │ 3. MetricTotal                                             │        │
│  │    └── Large card with total value + subtitle             │        │
│  │                                                            │        │
│  │ 4. TimeSeriesChart                                         │        │
│  │    ├── Daily bars for W/M                                 │        │
│  │    │   └── With week separators (gray lines on Mondays)   │        │
│  │    └── Monthly bars for 6M/Y                              │        │
│  │        └── No week separators                             │        │
│  │                                                            │        │
│  │ 5. HighlightCard(s)                                        │        │
│  │    └── Insights with emoji, title, description, stats     │        │
│  └────────────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────────────┘
```

## 💬 Ask Altu Screen (ChatGPT Integration)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ASK ALTU SCREEN                                 │
│                    (src/screens/AskAltuScreen.tsx)                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  User Types Question                                                    │
│           │                                                              │
│           ▼                                                              │
│  ┌────────────────────────────────────────────────────────────┐        │
│  │ TWO-STAGE QUERY PROCESS                                    │        │
│  │                                                            │        │
│  │ STAGE 1: SQL Generation                                    │        │
│  │ ┌──────────────────────────────────────────────────────┐  │        │
│  │ │ OpenAI API Call                                      │  │        │
│  │ │ ├── Model: gpt-4o-mini                               │  │        │
│  │ │ ├── System Prompt:                                   │  │        │
│  │ │ │   getQueryGenerationSystemPrompt()                │  │        │
│  │ │ │   ├── Database schema                              │  │        │
│  │ │ │   ├── Current date context (TODAY, YESTERDAY, etc)│  │        │
│  │ │ │   └── Example queries                              │  │        │
│  │ │ ├── User Message: Question                           │  │        │
│  │ │ └── Max Tokens: 200                                  │  │        │
│  │ └──────────────────────────────────────────────────────┘  │        │
│  │           │                                                │        │
│  │           ▼                                                │        │
│  │ ┌──────────────────────────────────────────────────────┐  │        │
│  │ │ Extract SQL from response                            │  │        │
│  │ │ └── Parse between ```sql and ```                     │  │        │
│  │ └──────────────────────────────────────────────────────┘  │        │
│  │           │                                                │        │
│  │           ▼                                                │        │
│  │ ┌──────────────────────────────────────────────────────┐  │        │
│  │ │ Execute SQL Query                                    │  │        │
│  │ │ └── executeGeneratedQuery(sql)                       │  │        │
│  │ │     └── SQLite database                              │  │        │
│  │ └──────────────────────────────────────────────────────┘  │        │
│  │           │                                                │        │
│  │           ▼                                                │        │
│  │ STAGE 2: Natural Language Answer                          │        │
│  │ ┌──────────────────────────────────────────────────────┐  │        │
│  │ │ OpenAI API Call                                      │  │        │
│  │ │ ├── Model: gpt-4o-mini                               │  │        │
│  │ │ ├── System Prompt: ANSWER_SYSTEM_PROMPT              │  │        │
│  │ │ │   └── "Address user as 'you/your'"                │  │        │
│  │ │ ├── User Message:                                    │  │        │
│  │ │ │   ├── Original question                            │  │        │
│  │ │ │   ├── Generated SQL                                │  │        │
│  │ │ │   └── Query results                                │  │        │
│  │ │ └── Max Tokens: 500                                  │  │        │
│  │ └──────────────────────────────────────────────────────┘  │        │
│  └────────────────────────────────────────────────────────────┘        │
│                           │                                             │
│                           ▼                                             │
│  ┌────────────────────────────────────────────────────────────┐        │
│  │ Display Conversation                                       │        │
│  │ ├── User messages (right-aligned, pink)                   │        │
│  │ └── Altu responses (left-aligned, white)                  │        │
│  │     └── Markdown formatted                                │        │
│  └────────────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────────────┘
```

## 🗄️ Data Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           DATA LOADERS                                  │
│                      (src/data/dbLoaders.ts)                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  healthSeries(days?: number)                                           │
│  ┌────────────────────────────────────────────────────────────┐        │
│  │ SELECT date, steps, sleep_minutes,                         │        │
│  │        active_energy_kcal, workout_minutes                 │        │
│  │ FROM health_daily                                          │        │
│  │ ORDER BY date ASC                                          │        │
│  │ LIMIT {days} (if specified)                                │        │
│  │                                                            │        │
│  │ Returns:                                                   │        │
│  │ {                                                          │        │
│  │   steps: { points: [{date, value}], latest, avg }         │        │
│  │   sleep: { points: [{date, value}], latest, avg }         │        │
│  │   workout: { points: [{date, value}], latest, avg }       │        │
│  │   energy: { points: [{date, value}], latest, avg }        │        │
│  │ }                                                          │        │
│  └────────────────────────────────────────────────────────────┘        │
│                                                                          │
│  loadScreentime()                                                       │
│  ┌────────────────────────────────────────────────────────────┐        │
│  │ SELECT date, app, minutes, category                        │        │
│  │ FROM screentime                                            │        │
│  │ ORDER BY date ASC                                          │        │
│  │                                                            │        │
│  │ Returns: Array of all screentime records                  │        │
│  └────────────────────────────────────────────────────────────┘        │
│                                                                          │
│  executeGeneratedQuery(sql: string)                                    │
│  ┌────────────────────────────────────────────────────────────┐        │
│  │ Execute raw SQL query                                      │        │
│  │ └── Used by Ask Altu for ChatGPT-generated queries        │        │
│  └────────────────────────────────────────────────────────────┘        │
│                                                                          │
│  Utilities:                                                             │
│  └── parseDate(dateStr: string) → Date                                │
│      └── Converts "YYYY-MM-DD" to local timezone Date object          │
└─────────────────────────────────────────────────────────────────────────┘
```

## 🧩 Reusable Components

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      COMPONENT LIBRARY                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Dashboard Components:                                                  │
│  ├── MetricTile         → Dashboard metric cards with sparklines       │
│  ├── InsightCard        → Dashboard insights with conditional logic    │
│  ├── ColumnChart        → Small column charts for tiles                │
│  └── MiniBars           → Small bar charts for categories              │
│                                                                          │
│  Detail Screen Components (Reusable):                                  │
│  ├── DetailHeader       → Back button + title                          │
│  ├── TimeRangeSelector  → W/M/6M/Y toggle buttons                      │
│  ├── MetricTotal        → Large value display card                     │
│  ├── TimeSeriesChart    → Full bar chart with aggregation              │
│  │   ├── Daily bars for W/M views                                      │
│  │   ├── Monthly bars for 6M/Y views                                   │
│  │   ├── Week separators (Mondays) for W/M only                        │
│  │   └── Smart label formatting                                        │
│  └── HighlightCard      → Insight cards with emoji + stats             │
│                                                                          │
│  Sparkline (legacy, replaced by ColumnChart):                          │
│  └── Line chart for dashboard tiles                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

## 🔐 Environment & Configuration

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CONFIGURATION FLOW                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  .env (gitignored)                                                      │
│  └── OPENAI_API_KEY=sk-...                                             │
│           │                                                              │
│           ▼                                                              │
│  app.config.js                                                          │
│  ├── dotenv.config()                                                    │
│  └── expo.extra.OPENAI_API_KEY = process.env.OPENAI_API_KEY           │
│           │                                                              │
│           ▼                                                              │
│  App Runtime (Constants.expoConfig.extra)                              │
│  └── Used in AskAltuScreen for OpenAI API calls                        │
└─────────────────────────────────────────────────────────────────────────┘
```

## 📊 Data Flow Summary

```
JSON Files → Database Init → SQLite → Data Loaders → Screens → UI Components
   ↓                                        ↓
(Git tracked)                         (In-memory)
   ↓                                        ↓
Auto-reseed if                      React state/effects
data outdated                              ↓
                                    User interactions
                                           ↓
                                    Navigation/ChatGPT
```

## 🎨 Color Scheme

```
Steps:      #ff6b9d  (Pink)
Sleep:      #6c5ce7  (Purple)
Workout:    #27ae60  (Green)
Energy:     #f39c12  (Orange)
Screen:     #4a90e2  (Blue)
Background: #a8d5ff → #e8f4ff (Linear Gradient)
```

