# Altu Mini – React Native (Expo)

A health dashboard app built with Expo React Native featuring a modern, information-dense interface. It loads HealthKit and Screen Time JSON data, displays interactive visualizations with sparklines, and provides AI-powered insights using GPT-4o-mini.

## Features

### Dashboard
- **Compact Metric Tiles**: 2-column grid layout displaying Steps, Sleep, Workout, Energy, and Screen Time
- **7-Day Sparklines**: Mini trend visualizations for each metric
- **Smart Comparisons**: Percentage changes vs 90-day and 7-day averages with color-coded indicators
- **Collapsing Header Animation**: iOS Health app-style shrinking title on scroll
- **Auto-Generated Insights**: Dynamic insight cards based on correlations and thresholds
  - Workout-energy correlation detection
  - Screen time and step anomaly alerts
  - Sleep pattern notifications
- **Screen Time Breakdown**: Top 3 categories from last 7 days with horizontal bar visualization

### AI Chat Assistant
- **Custom Chat UI**: Built from scratch with ChatGPT-style typing animation
- **Full Data Access**: Complete health and screentime datasets sent to AI for detailed queries
- **Conversational Context**: Maintains last 10 messages for follow-up questions
- **Markdown Support**: Rich text formatting with bold, italics, code blocks, and lists
- **OpenAI Integration**: GPT-4o-mini for intelligent health data analysis

## Tech Stack
- React Native (Expo ~54.0.20, TypeScript ~5.9.2)
- React Navigation 7.x (bottom tabs)
- expo-linear-gradient for backgrounds
- react-native-svg for custom charts and sparklines
- react-native-markdown-display for chat message formatting
- OpenAI API (GPT-4o-mini) via fetch
- Custom components: MetricTile, InsightCard, Sparkline, MiniBars

## Getting Started

1. Ensure Node 20.19.4+ is installed
2. Add your OpenAI key to a `.env` file in the workspace root (next to this project folder):
   
   ```bash
   OPENAI_API_KEY=sk-...
   ```

3. Install dependencies:
   
   ```bash
   npm install
   ```

4. Run the app:
   
   ```bash
   npm run start
   ```

Expo reads `app.config.js`, which loads `.env` and injects `OPENAI_API_KEY` at `expo.extra.OPENAI_API_KEY`.

## Data
Mock input files are bundled at `assets/data/health_daily.json` and `assets/data/screentime.json`. 
- **Health Data**: Steps, sleep (minutes), active energy (kcal), workout minutes
- **Screen Time Data**: App usage by date with categories
- Data loaders in `src/data/loaders.ts` with UTC date handling
- Type definitions in `src/types.ts`

## App Structure
- `src/screens/DashboardScreen.tsx`: Redesigned with compact 2-column grid, sparklines, insights, screen time breakdown, and animated collapsing header
- `src/screens/AskAltuScreen.tsx`: Custom chat UI with typing animation, markdown rendering, conversation history, and full data access
- `src/components/MetricTile.tsx`: Reusable tile with value, change indicator, sparkline, and invertColors support
- `src/components/InsightCard.tsx`: Auto-generated insight display with emoji and colored border
- `src/components/Sparkline.tsx`: Custom SVG mini line chart with padding to prevent cropping
- `src/components/MiniBars.tsx`: Horizontal bar chart for screen time categories
- `src/utils/analytics.ts`: Pearson correlation, averages, and statistical helpers

## Design Highlights
- **Blue gradient background**: Consistent across all screens
- **Animated header**: Shrinking "Summary" title on scroll (iOS Health app style)
- **Information density**: Maximized data visibility without clutter
- **Smart color coding**: 
  - Green for positive changes (more steps, less screen time)
  - Red for negative changes (fewer steps, more screen time)
  - Inverted logic for Screen Time metric
- **Markdown-rich chat**: AI responses support bold, italics, code, and lists
- **Responsive layouts**: Grid system with proper spacing and shadows
- **Visual polish**: Fixed sparkline overflow and stroke cropping issues

## Notes & Design Decisions

### UI/UX Evolution
- **From large cards to compact tiles**: Maximized information density while maintaining readability
- **Custom chat implementation**: Replaced third-party library (@flyerhq/react-native-chat-ui) for better control and customization
- **Sparkline padding**: Added stroke-width-based padding calculations to prevent edge cropping
- **Inverted color logic**: Screen Time uses red for increases (bad) and green for decreases (good)
- **UTC date handling**: Fixed timezone issues to display correct dates (e.g., Oct 25 instead of Oct 24)
- **Unit conversions**: Sleep displayed in hours (with 1 decimal) instead of minutes for better readability

### Technical Approach
I prioritized fast iteration with Expo while maintaining clean architecture. Data loading and analytics are separate from UI (`src/data`, `src/utils`) for clarity. Used custom SVG components instead of heavy charting libraries for better performance and control. 

For the chat, I replaced the third-party @flyerhq library with a custom implementation for better control. The AI now receives complete datasets instead of summaries, enabling it to answer specific questions like "What were my steps yesterday?" The chat maintains conversation history (last 10 messages) for contextual follow-ups, and uses react-native-markdown-display to render formatted responses.

For animations, I used React Native's Animated API for the collapsing header effect, interpolating scroll position to smoothly transition the title size and subtitle opacity.

For the LLM integration, I avoided the SDK to sidestep React Native polyfill issues and used `fetch` directly. Env config is handled via `app.config.js` + `dotenv`, exposing keys through `expo.extra`.

### Recent Improvements
- Added "avg" suffix to time period labels (90d avg, 7d avg) for clarity
- Screen time categories filtered to last 7 days instead of all-time data
- MetricTile component supports `invertColors` prop for metrics where increases are negative
- Fixed sparkline overflow with explicit width constraints
- Implemented padding-based calculations to prevent stroke clipping
- **Collapsing header animation**: Title shrinks from 32pt to 20pt on scroll, subtitle fades out
- **Full data access in chat**: AI now receives complete health and screentime datasets instead of summaries
- **Conversation memory**: Chat maintains last 10 messages for contextual follow-up questions
- **Markdown rendering**: Chat messages support rich formatting (bold, italics, code, lists)

### Future Enhancements
With more time, I would: add historical trend views with date range pickers, more sophisticated correlations (e.g., sleep quality vs. screen time before bed), data export/import functionality, push notifications for anomalies, and deeper screen time analysis (app-level insights, weekday vs weekend patterns). I would also add question routing in the chat to handle different query types and return structured JSON responses for data-heavy questions.
