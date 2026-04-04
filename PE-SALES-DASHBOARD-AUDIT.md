# Performance East Sales Dashboard — Complete Application Audit

**Date:** April 2026
**Codebase:** `peg-sales-tracker` (React 18 + Vite + Supabase)
**Total Source Files:** 49
**Total Lines of Code:** ~10,600

---

## 1. Project Structure & Architecture

### Tech Stack
| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 18.3.1 |
| Build Tool | Vite | 5.4.2 |
| Backend/DB | Supabase (PostgreSQL) | 2.45.0 |
| Charts | Recharts | 2.12.7 |
| Excel Parsing | SheetJS (xlsx) | 0.18.5 |
| PWA | vite-plugin-pwa | 0.20.0 |
| Hosting | Vercel | Auto-deploy from GitHub |

### Architecture Pattern
- **Single-Page Application** — no router, tab-based navigation via `view` state
- **Centralized state** — all 49 state variables live in `App.jsx`
- **Props-down pattern** — data flows from App to tabs via props (no Redux/Zustand)
- **4 React Contexts** — Theme, Store, App (navigation), Notifications
- **Supabase persistence** — monthly data blob (JSONB) + localStorage offline cache
- **Multi-store** — store picker + per-store data isolation via `store_id` column

### Directory Structure
```
src/
├── App.jsx                    (555 lines — main shell, ALL state)
├── main.jsx                   (22 lines — provider tree)
├── index.css                  (181 lines — global styles + responsive)
├── components/                (5 files — shared UI)
│   ├── SharedUI.jsx           (199 — Modal, StatCard, ProgressBar, styles)
│   ├── Forms.jsx              (368 — DealForm, GoalForm, etc.)
│   ├── LoginScreen.jsx        (103 — PIN auth)
│   ├── AdminPanel.jsx         (184 — user management)
│   └── StorePickerScreen.jsx  (95 — store selector landing)
├── contexts/                  (4 files — React contexts)
│   ├── ThemeContext.jsx        (137 — dark/light + store branding)
│   ├── StoreContext.jsx        (153 — multi-store config)
│   ├── AppContext.jsx          (49 — navigation context)
│   └── NotificationContext.jsx (108 — in-app notifications)
├── lib/                       (13 files — business logic)
│   ├── storage.js             (514 — Supabase CRUD + row mappers)
│   ├── warrantyCatalog.js     (354 — Mercury/Yamaha/Suzuki rates)
│   ├── matchingEngine.js      (372 — promo-to-inventory matching) *ORPHANED*
│   ├── auth.js                (113 — role permissions)
│   ├── constants.js           (87 — unit types, colors, defaults)
│   ├── calculations.js        (83 — spiff calculations)
│   ├── fiMenuCalc.js          (83 — payment calculator)
│   ├── fiMenuConstants.js     (157 — F&I products/packages)
│   ├── inventoryConstants.js  (171 — inventory data models) *PARTIALLY ORPHANED*
│   ├── inventoryParser.js     (176 — DMS import parser) *ORPHANED*
│   ├── promoConstants.js      (134 — promo data models)
│   ├── promoParser.js         (188 — promo Excel parser) *ORPHANED*
│   ├── crmAutomation.js       (184 — CRM follow-up rules)
│   ├── pushNotifications.js   (52 — browser push API)
│   └── supabaseClient.js      (6 — Supabase connection)
├── tabs/                      (15 files — tab views)
│   ├── DashboardTab.jsx       (339 — main KPI dashboard)
│   ├── DealsTab.jsx           (80 — deal log)
│   ├── FIDashTab.jsx          (380 — F&I KPIs + menu builder host)
│   ├── GoalsTab.jsx           (129 — goals/spiffs config)
│   ├── GSMDashTab.jsx         (615 — manager accountability)
│   ├── HistoryTab.jsx         (147 — historical data)
│   ├── ISMLeadsTab.jsx        (275 — internet lead tracking)
│   ├── FloorLeadsTab.jsx      (256 — floor traffic)
│   ├── SimpleLeadsTab.jsx     (218 — Cedar Point combined leads)
│   ├── PromosTab.jsx          (250 — current programs + docs)
│   ├── RepDashboard.jsx       (109 — individual rep view)
│   ├── LeaderboardTab.jsx     (66 — rep rankings) *ORPHANED*
│   ├── InventoryTab.jsx       (435 — inventory import) *ORPHANED*
│   ├── CRMTab.jsx             (553 — old CRM) *ORPHANED*
│   └── crm/                   (5 files — new CRM module) *UNREACHABLE*
│       ├── index.jsx          (1,197 — CRM orchestrator)
│       ├── CRMKanbanView.jsx  (121)
│       ├── CRMKanbanCard.jsx  (74)
│       ├── CRMFunnelView.jsx  (88)
│       └── FormatNotes.jsx    (135)
└── tabs/fimenu/               (5 files — F&I menu builder)
    ├── FIMenuTab.jsx          (155) *ORPHANED — replaced by FIDashTab*
    ├── MenuBuilder.jsx        (354 — deal setup + products)
    ├── MenuList.jsx           (87 — saved menus table)
    ├── MenuPresentation.jsx   (229 — stepped payment view)
    └── MenuSettings.jsx       (231 — product/package CRUD)
```

### Orphaned Files (10 files, ~2,700 lines)
These files exist but are not rendered or reachable from the current navigation:

| File | Lines | Reason |
|------|-------|--------|
| `CRMTab.jsx` | 553 | Replaced by `crm/index.jsx`, but `crm/index.jsx` is also unreachable |
| `crm/index.jsx` + 4 sub-files | 1,615 | CRM disabled — `canSeeTab('crm')` returns `false` |
| `LeaderboardTab.jsx` | 66 | Removed from Sales sub-nav during simplification |
| `InventoryTab.jsx` | 435 | Removed from Sales sub-nav during simplification |
| `fimenu/FIMenuTab.jsx` | 155 | Was standalone tab, functionality moved into FIDashTab |
| `matchingEngine.js` | 372 | Only imported by orphaned InventoryTab |
| `inventoryParser.js` | 176 | Only imported by orphaned InventoryTab |
| `promoParser.js` | 188 | Not imported anywhere |

---

## 2. Application Flow

### Entry Point Flow
```
index.html → main.jsx → Provider Tree → App.jsx
                          ↓
                ThemeProvider (dark/light + store branding)
                  └── StoreProvider (multi-store config)
                        └── AppProvider (navigation)
                              └── NotificationProvider
                                    └── App
```

### User Flow
1. **Store Picker** → Select Goldsboro or Cedar Point (or restored from localStorage)
2. **Login** → Select user from dropdown, enter 4-digit PIN
3. **Dashboard** → Main KPI summary (HOME tab)
4. **Sales** → Deals / Programs / History (sub-views)
5. **Leads** → ISM + Floor (Goldsboro) or Combined (Cedar Point)
6. **Manager** → Goals & Spiffs / Accountability
7. **F&I** → KPIs & Deals / Finance Menus / Settings

### Data Flow
```
User Action → setState() → updateAndSave()
                              ↓
                    getAllData() — builds full monthly blob
                              ↓
                    saveMonth(storeId, year, month, data)
                              ↓
                ┌─────────────┴─────────────┐
          Supabase Upsert            localStorage Cache
       (monthly_data table)      (peg-sales-{store}-{yr}-{mo})
```

### Supabase Tables
| Table | Purpose | Row Key |
|-------|---------|---------|
| `monthly_data` | ALL monthly state as JSONB blob | `(store_id, year, month)` |
| `crm_users` | User accounts + PINs + roles | `id` |
| `stores` | Store configs (unit types, theme) | `id` (text) |
| `customers` | CRM customer records | `id` (uuid) |
| `interactions` | CRM activity log | `id` (uuid) |
| `reminders` | CRM follow-ups | `id` (uuid) |
| `documents` | Uploaded file metadata | `id` (uuid) |

### Navigation Structure
```
Top-level: HOME | SALES | LEADS | MGR | F&I | (ADMIN)

SALES sub-views:    DEALS | PROGRAMS | HISTORY
LEADS sub-views:    INTERNET LEADS | FLOOR TRAFFIC (or Combined for Cedar Point)
MANAGER sub-views:  GOALS & SPIFFS | ACCOUNTABILITY
F&I sub-views:      KPIs & DEALS | FINANCE MENUS | SETTINGS
```

---

## 3. Functionality Audit

### Fully Implemented Features
| Feature | Status | Notes |
|---------|--------|-------|
| Multi-store support (Goldsboro + Cedar Point) | **Working** | Store picker, per-store data, branding |
| Dark/light theme | **Working** | Persists to localStorage |
| PIN-based login | **Working** | Client-side only |
| Monthly deal logging | **Working** | Add/edit/delete deals per rep |
| Unit goal tracking | **Working** | Per-unit-type targets, stretch goals, payouts |
| PG&A tier tracking | **Working** | Dollar-based flat spiffs |
| Back-end product spiffs | **Working** | Per-product with "all of the above" bonus |
| Hit list (aged inventory spiffs) | **Working** | Manual stock entry with sold-by tracking |
| Monthly contests | **Working** | Create contests, assign winners |
| Leaderboard rankings | **Working** | Calculated from deals (component exists but removed from nav) |
| ISM lead tracking | **Working** | Daily counts, per-rep breakdown, funnel |
| Floor traffic tracking | **Working** | Daily counts with rep attribution |
| GSM accountability checklist | **Working** | Daily/weekly/monthly/quarterly/annual checklists |
| Star program scoring | **Working** | Per-rep star level based on delivery checklist completion |
| F&I KPI dashboard | **Working** | PUS, EW%, LSP%, GAP%, Battery% with targets |
| F&I commission tier calc | **Working** | 15% base + 0.5% per KPI hit, 18% perfect month |
| F&I deal logging | **Working** | Separate from main deals, tracks back-end gross |
| F&I menu builder | **Working** | Deal setup, product selection, payment calc |
| F&I stepped payment presentation | **Working** | Step-up as big number, total underneath |
| F&I print with declination signature | **Working** | Opens printable window with signature lines |
| Outboard warranty catalog | **Working** | Mercury Gold/Platinum, Yamaha Y.E.S., Suzuki SEP — 179 rate rows |
| Warranty dropdown selector in F&I | **Working** | Brand → Plan → Condition → HP → Term cascade |
| Editable retail prices per deal | **Working** | Inline price editing on all F&I products |
| Bulletin board / sticky notes | **Working** | Add/remove notes on Dashboard |
| Meeting notes | **Working** | Date-stamped notes on Dashboard |
| Delivery checklist with signoffs | **Working** | Parts/Service team member electronic signoff |
| 7-day follow-up tracking | **Working** | Shows pending tasks on Dashboard |
| Current programs/promotions | **Working** | Manual add with brand, APR, rebate, dates |
| Document upload/viewer | **Working** | PDF/image in-app viewer, Supabase storage |
| User management | **Working** | Add/edit/delete users, role assignment |
| Historical data | **Working** | Year-over-year comparison, editable |
| Google Reviews tracking | **Working** | Per-rep count input on GSM dashboard |
| Notification bell | **Working** | In-app notifications for interactions, stage changes |

### Partially Implemented / Disabled Features
| Feature | Status | Notes |
|---------|--------|-------|
| CRM (customer pipeline) | **Disabled** | Fully built but `canSeeTab('crm')` returns `false` |
| CRM Kanban board | **Built, unreachable** | Drag-and-drop stages, FORMAT notes, dead leads |
| CRM follow-up automation | **Built, unreachable** | Auto-reminders on interaction/stage change |
| Push notifications | **Partially built** | Permission request works, but no server-side push |
| Inventory import system | **Built, removed from nav** | DMS Excel parser, review/publish workflow |
| Inventory matching engine | **Built, removed from nav** | Promo-to-unit matching with opportunity scoring |
| Promo Excel parser | **Built, removed from nav** | Smart column detection, review/publish pipeline |
| PWA install | **Configured** | Manifest + service worker, but not actively promoted |

### Dead-End State Variables (defined, loaded, saved, but never used)
| Variable | Lines | Purpose |
|----------|-------|---------|
| `fiChecklist` | 62, 134 | Was intended for F&I checklist — always empty |
| `promos` | 71, 143 | Legacy promo array — replaced by `promoRecords` |
| `priceList` | 72, 144 | Legacy price list — replaced by `pricingRecords` |
| `inventoryItems` | 69, 141 | Inventory data — tab removed from nav |
| `yearlyFloorLeads` | 77, 163 | Computed but never referenced |

---

## 4. State Management & Data Handling

### State Architecture
- **49 useState calls** in App.jsx — every state change triggers a full tree re-render
- **7 useMemo calls** for derived data (totals, stats)
- **0 useCallback calls** — all 25+ save functions recreated on every render
- **Monthly data blob** (~50-500KB) serialized and saved on EVERY state change

### Data Persistence Flow
```
setState() → updateAndSave(setter, key, val) → getAllData({[key]: val})
    → saveMonth(storeId, year, month, fullBlob)
        → supabase.upsert(row)
        → localStorage.setItem(key, JSON.stringify(data))
```

### Issues
1. **No debouncing on App-level saves** — every keystroke in notes/goals triggers full blob save to Supabase
2. **`getAllData()` reconstructs entire monthly object** on every save — not memoized
3. **No useCallback wrappers** — 25+ save functions passed as props are recreated on every render
4. **Race condition potential** — rapid saves could overwrite each other since `getAllData()` reads current state
5. **Only CRM has debounced saves** (800ms) — all other tabs save immediately

### Error Handling
- Storage functions use try/catch with `console.error` fallback to localStorage
- No user-visible error messages on save failure (except in admin panel)
- Upload errors now show alerts (fixed recently)

---

## 5. UI/UX Review

### What Works Well
- Consistent card/table/button styling via SharedUI styles object
- Theme system (dark/light + store branding) is clean
- Tab navigation is simple (5 top-level, sub-views within)
- Stat cards with color-coded accents are readable
- Mobile responsive CSS exists (breakpoints at 768px, 400px)

### Issues
- **No loading skeletons** — data shows "LOADING..." text, no shimmer
- **No confirmation on destructive actions** (some delete buttons lack confirm dialogs)
- **Tab sub-views lose state on parent re-render** (e.g., switching months resets sub-view position)
- **Form inputs use 16px font** to prevent iOS zoom — correct but inconsistent with 12px body text
- **Accessibility**: No ARIA labels, no keyboard navigation for tabs, no focus management
- **Mobile**: Header tabs scroll horizontally but are very small on phone screens
- **Print**: Only F&I menu has print — no other printable views

---

## 6. Code Quality

### Positive Patterns
- Consistent style object usage (`card`, `cH`, `inp`, `b1`, `b2`, `TH`, `TD`)
- Font constants (`FM`, `FH`, `FB`) used consistently
- CSS variable-backed theming is well-implemented
- Store-aware filtering pattern (`getProductsForStore`) is reusable
- Payment calculator is pure functions (easily testable)

### Anti-Patterns
1. **God Component**: App.jsx has 49 state variables and renders everything — should be split
2. **Prop Drilling**: 20+ props passed to major tabs — Context or composition would be cleaner
3. **Inline Styles Everywhere**: ~10,000 lines of inline styles — a CSS module or Tailwind approach would be more maintainable
4. **No TypeScript**: Data models exist only as JSDoc comments or convention
5. **ID generation**: `Date.now().toString()` used for IDs — not guaranteed unique under rapid creation
6. **DOM ID access**: Some forms use `document.getElementById()` instead of React refs
7. **Duplicated filtering logic**: Store-aware filtering repeated across multiple files

### Input Validation
- Deal form requires customer name + at least one unit + salesperson (enforced in UI)
- PIN login validates 4-digit format
- Number inputs have `min="0"` but no max
- No email/phone format validation
- No XSS sanitization (React JSX escaping provides baseline protection)

---

## 7. Security Concerns

### Critical
| Issue | Risk | Details |
|-------|------|---------|
| **Client-only authentication** | HIGH | PIN checked via Supabase query — no server-side session validation. User role in sessionStorage can be spoofed via dev tools. |
| **Supabase RLS status unknown** | HIGH | If Row Level Security is not enabled, the anon key grants full read/write to all tables. |
| **Plaintext PINs** | HIGH | PINs stored unhashed in `crm_users` table. |

### Medium
| Issue | Risk | Details |
|-------|------|---------|
| Hardcoded Supabase URL/key | MEDIUM | Anon key is safe type (`sb_publishable_`) but should be in env vars |
| Unencrypted localStorage cache | MEDIUM | Monthly sales data (including customer names, deal amounts) cached in plaintext |
| No file upload validation | MEDIUM | No size limits, no MIME type checking, no filename sanitization |
| No rate limiting on login | MEDIUM | 4-digit PIN = 10,000 combinations, no brute force protection |

### Low
| Issue | Risk | Details |
|-------|------|---------|
| No CSRF protection | LOW | Supabase client handles this internally |
| No audit logging | LOW | No record of who changed what and when |
| Session persists until tab close | LOW | sessionStorage clears on close, but no timeout |

---

## 8. Performance

### Bottlenecks
1. **49 state variables in one component** — any change re-renders the entire React tree
2. **Full monthly blob serialized on every save** — ~50-500KB JSON.stringify + Supabase upsert on keystroke
3. **No save debouncing** except in CRM — typing in notes/goals/meeting notes triggers immediate saves
4. **DashboardTab pending tasks calculation** — O(deals x checklist_items) on every render, not memoized
5. **25+ save functions recreated on every render** — no useCallback wrapping
6. **`act` (active salespeople)** computed on every render, not memoized

### Memory
- NotificationContext polling interval properly cleaned up
- CRM debounce timer properly cleaned up on unmount
- No other interval/timer leaks found
- Notification array capped at 100 entries

### Bundle Size
- Recharts (~200KB gzipped) is the largest dependency
- xlsx (~300KB) loaded only on demand via dynamic import
- PWA service worker caches fonts and static assets

---

## 9. Summary & Recommendations

### What's Working Well
- Core goal tracking is solid and well-designed
- F&I menu builder with warranty catalog is functional and practical
- Multi-store architecture is clean
- Theme system is well-implemented
- Delivery checklist with signoffs is good workflow
- Stepped payment presentation is clear

### Critical Issues (Fix First)
1. **Enable Supabase RLS** — without it, anyone with the anon key can access all data
2. **Add save debouncing** — the app saves the entire monthly blob to Supabase on every keystroke
3. **Remove orphaned files** — 10 files (~2,700 lines) that are imported but never rendered waste bundle size and cause confusion

### Important Issues (Fix Soon)
4. **Split App.jsx state** — 49 useState calls is unsustainable; extract data contexts for deals, leads, F&I, etc.
5. **Add useCallback to save functions** — 25+ functions recreated on every render
6. **Memoize derived calculations** — `act`, `pendingTasks`, and other computed values
7. **Move Supabase credentials to env vars** — even anon keys shouldn't be hardcoded
8. **Hash PINs** — store bcrypt hashes instead of plaintext
9. **Clean up dead state variables** — 5 variables loaded/saved but never used

### Nice-to-Have (Future)
10. Add TypeScript for data model safety
11. Add loading skeletons instead of "LOADING..." text
12. Add keyboard accessibility (ARIA labels, tab navigation)
13. Add automated tests for payment calculator and matching engine
14. Consider moving from monthly blob to normalized Supabase tables for deals
15. Add audit logging for data changes
16. Re-enable CRM module when ready (currently built but hidden)
17. Add input validation/sanitization on all user inputs

### File Cleanup Candidates
| Action | File | Lines Saved |
|--------|------|-------------|
| Delete | `src/tabs/CRMTab.jsx` | 553 |
| Delete | `src/tabs/fimenu/FIMenuTab.jsx` | 155 |
| Delete | `src/lib/promoParser.js` | 188 |
| Consider keeping (re-enable later) | `src/tabs/crm/*` | 1,615 |
| Consider keeping (re-enable later) | `src/tabs/InventoryTab.jsx` | 435 |
| Consider keeping (re-enable later) | `src/tabs/LeaderboardTab.jsx` | 66 |
| Consider keeping (re-enable later) | `src/lib/matchingEngine.js` | 372 |
| Consider keeping (re-enable later) | `src/lib/inventoryParser.js` | 176 |

---

*End of audit. Report generated from systematic review of all 49 source files.*
