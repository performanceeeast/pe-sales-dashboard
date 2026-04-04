# Performance East Sales Dashboard — Current State

**Last Updated:** April 2026
**Live URL:** https://pe-sales-dashboard.vercel.app
**Repo:** https://github.com/performanceeeast/pe-sales-dashboard
**Stack:** React 18 · Vite · Supabase · Recharts · Vercel

---

## Stores

| Store | Location | Unit Types | Theme | ISM |
|-------|----------|-----------|-------|-----|
| Goldsboro | Goldsboro, NC | ATV, SXS, PWC, BOAT, TRAILER, YOUTH | Red (#b91c1c) | Yes |
| Cedar Point | Cedar Point, NC | BOAT, ENGINE REPOWER, TRAILER | Navy (#1e3a5f) | No |

---

## Navigation Structure

```
TOP LEVEL:  HOME  |  SALES  |  LEADS  |  MGR  |  F&I  |  (ADMIN)

HOME
  └── Dashboard (goals, KPIs, bulletin, follow-ups, YTD charts)

SALES
  ├── DEALS — deal log, add/edit/delete deals
  ├── PROGRAMS — current OEM promotions (manual add, archive)
  └── HISTORY — year-over-year comparison, editable historical data

LEADS (Goldsboro)
  ├── INTERNET LEADS — ISM tracking, daily counts, per-rep breakdown
  └── FLOOR TRAFFIC — walk-in/phone tracking, per-rep attribution

LEADS (Cedar Point)
  └── Combined internet + walk-in/phone view

MANAGER
  ├── GOALS & SPIFFS — unit targets, PG&A tiers, back-end spiffs, hit list, contests
  └── ACCOUNTABILITY — star program, pipeline health, GSM checklists, compensation

F&I
  ├── KPIs & DEALS — PUS, EW%, LSP%, GAP%, Battery%, commission tier, deal log
  ├── FINANCE MENUS — menu builder, stepped payment presentation, print
  └── SETTINGS — product catalog, package templates, defaults, disclaimers

ADMIN (admin role only)
  └── User management, data migration, backup
```

---

## Roles & Permissions

| Role | Tabs Visible | Can Edit Deals | Can See Cost | Can Manage Users |
|------|-------------|---------------|-------------|-----------------|
| Admin | All | All | Yes | Yes |
| GSM (Sales Manager) | All | All | Yes | No |
| Sales/Finance Mgr | All (Cedar Point) | All | Yes | No |
| Finance Manager | HOME, SALES, LEADS, F&I | All | Yes | No |
| ISM | HOME, SALES, LEADS | All | No | No |
| Salesperson | HOME, SALES | Own only | No | No |

---

## Features — Fully Working

### Dashboard (HOME)
- Goal progress bars per unit type (target vs actual)
- Combined stat cards: units sold, % to goal, leads, ISM, floor traffic
- Bulletin board with sticky notes (add/remove)
- Sales meeting notes (date-stamped)
- Pending delivery tasks (7-day follow-ups, parts/service signoffs)
- Actual vs Target bar chart
- YTD units sold by month (stacked bar)
- YTD salesperson performance table
- Dark/light theme toggle
- Store-specific branding (logo, colors, footer)

### Deals
- Log deals with: date, customer, salesperson, deal #, units by type, PG&A amount
- Back-end product selection (Extended Warranty, Lifetime Oil Change, GAP, Lifetime Battery)
- Delivery checklist: Parts intro (signoff), Service intro (signoff), Delivery photo, FORMAT notes, Google Review, Referral, 7-day follow-up
- Electronic signoff for Parts/Service team members
- Edit/delete deals with role-based permissions
- Confirm dialog on delete

### Goal Tracking
- Per-unit-type monthly targets with stretch goals and payouts
- PG&A tier-based flat spiffs
- Back-end product spiffs with "all of the above" bonus
- Aged inventory hit list with spiff tracking and sold-by attribution
- Monthly contests with winner assignment
- 15% qualification rule (must sell 15% of goal category)

### Leaderboard
- Rep rankings by total units (component exists, removed from main nav)
- PG&A total per rep
- Spiff breakdown per rep

### Lead Tracking
- **ISM (Goldsboro):** Daily internet lead counts, per-rep appointment performance (set/showed/sold/close rate), monthly funnel, YTD leaderboard, historical backfill
- **Floor Traffic (Goldsboro):** Daily traffic counts with salesperson attribution, traffic vs deals chart, monthly funnel
- **Combined (Cedar Point):** Internet + walk-in/phone in one simple view with closing rate cards

### Manager Dashboard (GSM)
- Pipeline health: total leads, active, stale (7+ days), unassigned per rep
- Star program scoring: per-rep checklist completion (Parts, Service, Photo, FORMAT, Google Review, Referral, Follow-up)
- Star levels: 1-Star (13%), 2-Star (14%), 3-Star (15%) commission tiers
- Google Reviews tracking per rep
- F&I KPI panel (5 KPIs with hit/miss)
- GSM accountability checklist: daily, weekly, monthly, quarterly, annual, ongoing
- Bonus configuration (admin-editable): star bonuses, KPI bonuses
- Compensation summary: fixed commission + star bonus + F&I bonus

### F&I Dashboard
- 5 KPI cards: PUS, Extended Warranty %, Lifetime Service %, GAP %, Lifetime Battery %
- Auto-calculated from F&I deal data + manual override
- Commission tier: 15% base + 0.5% per KPI hit, 18% perfect month
- F&I deal log with product penetration tracking
- Monthly F&I tracker chart (PUS, EW%, GAP% by month)
- Monthly breakdown table

### F&I Menu Builder
- Deal setup: customer, date, salesperson, finance manager, unit info, pricing, trade, down payment, lender, term, APR
- Real-time payment calculator (standard amortization)
- **Outboard warranty selector:** Brand → Plan → Condition → HP Group → Term cascade
  - Mercury Gold (2.5-425 HP, 1-5 year terms, $50 deductible)
  - Mercury Platinum (2.5-600 HP, 1-5 year terms, $50 deductible)
  - Yamaha Y.E.S. (2-450 HP, 12/24/36 mo new, 12/24 mo used, $0 deductible)
  - Suzuki SEP (1-350 HP, 72/84/96 mo new, 12/24 mo used, $25 deductible)
  - 179 rate rows from actual source rate sheets
  - Mercury surcharge rules defined (not yet wired to UI selector)
  - HP groups filtered to only show groups with available rates
- Editable retail prices per deal on all products (warranty + standard F&I)
- Dealer cost and gross visible to managers
- Product selection with toggle buttons
- Package quick-select: Platinum, Gold, Silver, Basic
- **Stepped payment presentation:** step-up (+$XX/mo) as BIG number, total payment smaller underneath
- **Print menu:** opens formatted printable page with:
  - Store logo + branding
  - Customer/deal info
  - Base payment card
  - Stepped package options with included protections
  - Declination acknowledgement section with per-product accept/decline checkboxes
  - Customer signature + printed name + date lines
  - Finance manager signature + date line
- Menu settings: product CRUD, package CRUD, default doc fee/tax/terms/lenders/disclaimers
- Save/load menus with status tracking (draft, presented, accepted, declined)

### Programs & Promotions
- Manual add: program name, brand, categories, APR rate, rebate amount, customer cash, effective dates, notes
- Active programs list with brand badges, expiring-soon warnings
- Archive/delete for managers
- Document upload + in-app viewer (PDF iframe, images inline)

### Multi-Store
- Store picker landing page with Goldsboro (red) and Cedar Point (navy) cards
- Per-store data isolation via store_id on all Supabase tables
- Per-store unit types, F&I products, theme branding
- Admin can switch stores from header dropdown
- "Change Store" button on login screen

### Other
- Dark/light theme with store-specific brand color override
- PWA configured (manifest, service worker, offline caching)
- Notification bell with in-app alerts
- Mobile responsive CSS (768px + 400px breakpoints)
- Tab transition animations (fade)
- Modal animations (scale-up)
- Loading spinners (app load, login, file upload)

---

## Features — Built but Disabled/Hidden

| Feature | Status | Files | Notes |
|---------|--------|-------|-------|
| CRM (customer pipeline) | Hidden | `src/tabs/crm/` (5 files) | Kanban, funnel, FORMAT notes, dead leads, auto-reminders. `canSeeTab('crm')` returns false. |
| Inventory Import | Hidden | `src/tabs/InventoryTab.jsx` | DMS Excel parser, review/publish, aging analysis. Removed from Sales sub-nav. |
| Leaderboard | Hidden | `src/tabs/LeaderboardTab.jsx` | Rep rankings. Removed from Sales sub-nav (data still on Dashboard). |
| Inventory Matching Engine | Hidden | `src/lib/matchingEngine.js` | Promo-to-unit matching with opportunity scoring. Only used by hidden InventoryTab. |
| Promo Excel Parser | Deleted | Was `src/lib/promoParser.js` | Removed in audit cleanup. |
| CRM Automation | Available | `src/lib/crmAutomation.js` | Follow-up rules, sequences. Used by CRM (which is hidden). |
| Push Notifications | Partial | `src/lib/pushNotifications.js` | Permission request works, used by CRM. No server-side push. |

---

## Data Architecture

### Storage
- **Primary:** Supabase PostgreSQL (monthly_data table with JSONB blob per store/month)
- **Cache:** localStorage offline fallback
- **Files:** Supabase Storage bucket "documents"
- **Pattern:** `loadMonth(storeId, year, month)` → state → `updateAndSave()` → `saveMonth()` (1-second debounce)

### Monthly Data Blob Fields
```
deals, leads, floorLeads, goals, sp (salespeople), pga (PG&A tiers),
be (back-end spiffs), hitList, contests, dailyLeadCounts, bulkLeadCounts,
floorDailyLeadCounts, floorBulkLeadCounts, notes, meetingNotes,
googleReviews, gsmChecklist, fiKpis, fiChecklist, fiDeals, fiTargets,
gsmBonusConfig, promos, priceList, fiMenus, fiMenuConfig,
promoRecords, pricingRecords, inventoryItems
```

### Supabase Tables
| Table | Purpose |
|-------|---------|
| monthly_data | All monthly state (JSONB blob) |
| crm_users | User accounts, roles, PINs |
| stores | Store configs (unit types, theme) |
| customers | CRM customer records |
| interactions | CRM activity log |
| reminders | CRM follow-ups |
| documents | Uploaded file metadata |

---

## Tech Details

### Dependencies
- react 18.3.1, react-dom 18.3.1
- recharts 2.12.7 (charts)
- @supabase/supabase-js 2.45.0 (backend)
- xlsx 0.18.5 (Excel parsing)
- vite-plugin-pwa 0.20.0 (PWA)
- vite 5.4.2, @vitejs/plugin-react 4.3.1

### File Counts
- 46 source files (~9,700 lines after cleanup)
- 5 context providers (Theme, Store, App, Notification + React.StrictMode)
- 49 useState calls in App.jsx (centralized state)
- 25+ save functions (all debounced via updateAndSave)

### Recent Audit Fixes Applied
- 1-second save debouncing (was saving to Supabase on every keystroke)
- Removed 896 lines of orphaned code (3 deleted files, 3 dead imports)
- Stable updateAndSave via useCallback + dataRef pattern
- Memoized derived calculations (act, tTgt, tStr)
- Supabase credentials moved to env vars (with fallback)
- Dead state variables cleaned up
- Modal animation CSS keyframe added
- Confirm dialogs on all delete buttons
- Loading spinners on app load and login
- Polished empty states with icons and actionable guidance

### Known Limitations
- Client-only PIN authentication (no server-side session validation)
- PINs stored in plaintext (should be hashed)
- All state in one component (App.jsx) — should be split into contexts
- No TypeScript
- No automated tests
- Inline styles throughout (~10K lines) — no CSS modules or Tailwind
- Monthly data blob could grow large at scale (currently fine for 2 stores)

---

## File Structure

```
peg-sales-tracker/
├── index.html
├── package.json
├── vite.config.js
├── .gitignore
├── .env.local (gitignored — Supabase credentials)
├── PE-SALES-DASHBOARD-AUDIT.md
├── CURRENT-STATE.md (this file)
├── public/
│   ├── logo.png (Goldsboro)
│   └── logo-cedarpoint.png (Cedar Point)
└── src/
    ├── App.jsx (555 lines — main shell, all state)
    ├── main.jsx (22 lines — provider tree)
    ├── index.css (210 lines — global styles, animations, responsive)
    ├── components/
    │   ├── SharedUI.jsx (199 — Modal, StatCard, ProgressBar, styles)
    │   ├── Forms.jsx (368 — DealForm, GoalForm, PgaForm, etc.)
    │   ├── LoginScreen.jsx (113 — PIN auth + store-aware)
    │   ├── AdminPanel.jsx (184 — user CRUD)
    │   └── StorePickerScreen.jsx (95 — store selector)
    ├── contexts/
    │   ├── ThemeContext.jsx (137 — dark/light + store branding)
    │   ├── StoreContext.jsx (153 — multi-store config)
    │   ├── AppContext.jsx (49 — navigation)
    │   └── NotificationContext.jsx (108 — in-app alerts)
    ├── lib/
    │   ├── storage.js (514 — Supabase CRUD + row mappers)
    │   ├── warrantyCatalog.js (354 — Mercury/Yamaha/Suzuki 179 rates)
    │   ├── auth.js (113 — roles + permissions)
    │   ├── constants.js (87 — unit types, colors, defaults)
    │   ├── calculations.js (83 — spiff math)
    │   ├── fiMenuCalc.js (83 — payment calculator)
    │   ├── fiMenuConstants.js (157 — F&I products/packages)
    │   ├── promoConstants.js (134 — promo data models)
    │   ├── supabaseClient.js (6 — connection)
    │   ├── crmAutomation.js (184 — CRM rules, hidden)
    │   ├── pushNotifications.js (52 — browser push, partial)
    │   ├── matchingEngine.js (372 — promo matching, hidden)
    │   ├── inventoryConstants.js (171 — inventory models, hidden)
    │   └── inventoryParser.js (176 — DMS parser, hidden)
    ├── tabs/
    │   ├── DashboardTab.jsx (339)
    │   ├── DealsTab.jsx (80)
    │   ├── FIDashTab.jsx (380)
    │   ├── GoalsTab.jsx (129)
    │   ├── GSMDashTab.jsx (615)
    │   ├── HistoryTab.jsx (147)
    │   ├── ISMLeadsTab.jsx (275)
    │   ├── FloorLeadsTab.jsx (256)
    │   ├── SimpleLeadsTab.jsx (218)
    │   ├── PromosTab.jsx (250)
    │   ├── RepDashboard.jsx (109)
    │   ├── LeaderboardTab.jsx (66, hidden)
    │   ├── InventoryTab.jsx (435, hidden)
    │   ├── crm/ (5 files, 1615 lines, hidden)
    │   └── fimenu/
    │       ├── MenuBuilder.jsx (354)
    │       ├── MenuList.jsx (87)
    │       ├── MenuPresentation.jsx (229)
    │       └── MenuSettings.jsx (231)
```
