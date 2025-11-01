# Altu Mini – React Native (Expo)

A small health dashboard app built with Expo React Native. It loads mock HealthKit and Screen Time JSON data, displays charts, and answers simple natural-language questions using an LLM with locally computed metrics.

## Tech
- React Native (Expo, TypeScript)
- React Navigation (tabs)
- victory-native + react-native-svg for charts
- OpenAI API (fetch) – key provided via `.env`

## Getting Started

1. Ensure Node 20.19.4+ is installed (Expo RN 0.81 requires it).
2. Add your OpenAI key to a `.env` file in the workspace root (next to this project folder):
   
   ```bash
   OPENAI_API_KEY=sk-...
   ```

3. Install dependencies (already done if using this repo):
   
   ```bash
   npm install
   ```

4. Run the app:
   
   ```bash
   npm run ios    # iOS Simulator
   npm run android
   npm run web
   ```

Expo reads `app.config.js`, which loads `.env` and injects `OPENAI_API_KEY` at `expo.extra.OPENAI_API_KEY`.

## Data
Mock input files are bundled at `assets/data/health_daily.json` and `assets/data/screentime.json`. Data loaders live in `src/data/loaders.ts`. Types in `src/types.ts`.

## App Structure
- `src/screens/DashboardScreen.tsx`: Time series charts (steps, sleep) and a scatter plot comparing steps vs workout minutes.
- `src/screens/AskAltuScreen.tsx`: Text input to ask questions. It computes a small summary from local data and sends a concise prompt to OpenAI.
- `src/utils/analytics.ts`: Simple helpers (averages, trend, moving average).

## Notes & Tradeoffs (≈150 words)
I prioritized fast iteration with Expo. The data loading and analytics are kept separate from UI (`src/data`, `src/utils`) to maintain clarity. I used `victory-native` for straightforward charting and kept the number of charts minimal but representative: a daily time series and a simple comparison. For the LLM, I avoided the SDK to sidestep React Native polyfill issues and used `fetch` directly; the prompt sends compact, locally computed summaries to reduce token usage while still enabling grounded answers. Env config is handled via `app.config.js` + `dotenv`, exposing keys through `expo.extra`.

With more time, I would: add richer correlations (e.g., sleep vs. energy), more charts with toggles and adjustable windows, caching of derived metrics, and a more robust data semantics layer (units, outlier handling). I would also add question routing and guardrails so the model always cites which numbers it used and optionally returns structured JSON along with text.
