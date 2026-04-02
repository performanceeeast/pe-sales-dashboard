# Performance East — Sales Goal Tracker

Internal sales tracking application for Performance East Inc., Goldsboro NC.

## Features
- **Dashboard** — Monthly goal progress, category breakdown, charts
- **Deal Logging** — Per-deal unit counts, PG&A amounts, back-end product tracking
- **Internet Leads** — ISM appointment-set conversions with show/sold tracking
- **Leaderboard** — Ranked salespeople with click-through to individual dashboards
- **Individual Rep Dashboards** — Per-deal spiff breakdown (PG&A flats, back-end spiffs, hit list bonuses)
- **Goals & Spiffs** — Editable monthly goals, PG&A tier management, back-end spiff editing
- **Hit List Board** — Aged inventory with stock #, spiff amounts, and sold-by tracking
- **Monthly Contests** — Create contests, assign winners, auto-shows on rep dashboards

## Tech Stack
- **React 18** + **Vite**
- **Recharts** for data visualization
- **localStorage** for persistence (swap `src/lib/storage.js` for Supabase/Firebase for multi-user)

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Deploy to Vercel
1. Push this repo to GitHub
2. Connect to Vercel → auto-detects Vite
3. Deploys on every push

## Upgrading to Multi-User (Supabase)
Replace `src/lib/storage.js` with Supabase client calls.
The storage API is already async — just swap `localStorage` for `supabase.from('months').select/upsert`.

## File Structure
```
src/
  App.jsx              — Main app (tabs, header, state, rep dashboard)
  main.jsx             — Entry point
  index.css            — Global styles
  components/
    SharedUI.jsx       — Modal, StatCard, ProgressBar, shared styles
    Forms.jsx          — All form components
  lib/
    constants.js       — Salespeople, goals, unit types, defaults
    storage.js         — Storage abstraction (localStorage → Supabase)
    calculations.js    — Spiff/unit calculation helpers
```
