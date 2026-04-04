import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { MONTHS, UNIT_TYPES, UNIT_COLORS, DEFAULT_SALESPEOPLE, DEFAULT_GOALS, DEFAULT_PGA_TIERS, DEFAULT_BE_SPIFFS } from './lib/constants';
import { loadMonth, saveMonth, loadYear, loadUsers } from './lib/storage';
import { getSpUnits, getRepSpiffs } from './lib/calculations';
import { canSeeTab, canManageUsers, ROLES } from './lib/auth';
import { StatCard, TabTransition, styles, FM, FH, FB } from './components/SharedUI';
import { useTheme } from './contexts/ThemeContext';
import { useStore } from './contexts/StoreContext';
import { useNotifications } from './contexts/NotificationContext';
import StorePickerScreen from './components/StorePickerScreen';
import LoginScreen from './components/LoginScreen';
import AdminPanel from './components/AdminPanel';

import DashboardTab from './tabs/DashboardTab';
import DealsTab from './tabs/DealsTab';
import ISMLeadsTab from './tabs/ISMLeadsTab';
import FloorLeadsTab from './tabs/FloorLeadsTab';
// LeaderboardTab removed from nav — kept as file for potential re-enable
import GoalsTab from './tabs/GoalsTab';
import HistoryTab from './tabs/HistoryTab';
import RepDashboard from './tabs/RepDashboard';
import GSMDashTab from './tabs/GSMDashTab';
import FIDashTab from './tabs/FIDashTab';
// CRMTab disabled — kept as files for potential re-enable
import PromosTab from './tabs/PromosTab';
// InventoryTab removed from nav — kept as file for potential re-enable
import SimpleLeadsTab from './tabs/SimpleLeadsTab';

const { card, cardHead: cH, input: inp, btn1: b1, btn2: b2, th: TH, td: TD } = styles;
const SESSION_KEY = 'peg-auth-session';

export default function App() {
  const now = new Date();
  const { isDark, toggleTheme } = useTheme();
  const { currentStore, storeId, storeConfig, storeTheme, setStore, clearStore, stores } = useStore();
  const { notifications, unreadCount, markRead, markAllRead, dismissNotification } = useNotifications();
  const unitTypes = storeConfig?.unit_types || UNIT_TYPES;
  const backEndProducts = storeConfig?.back_end_products || ['EXTENDED WARRANTY', 'LIFETIME OIL CHANGE', 'GAP', 'LIFETIME BATTERY'];
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [view, setView] = useState('dashboard');
  const [goals, setGoals] = useState(DEFAULT_GOALS);
  const [spList, setSpList] = useState(DEFAULT_SALESPEOPLE);
  const [deals, setDeals] = useState([]);
  const [leads, setLeads] = useState([]);
  const [floorLeads, setFloorLeads] = useState([]);
  const [pgaTiers, setPgaTiers] = useState(DEFAULT_PGA_TIERS);
  const [beSpiffs, setBeSpiffs] = useState(DEFAULT_BE_SPIFFS);
  const [hitList, setHitList] = useState([]);
  const [contests, setContests] = useState([]);
  const [dailyLeadCounts, setDailyLeadCounts] = useState([]);
  const [bulkLeadCounts, setBulkLeadCounts] = useState([]);
  const [floorDailyLeadCounts, setFloorDailyLeadCounts] = useState([]);
  const [floorBulkLeadCounts, setFloorBulkLeadCounts] = useState([]);
  const [notes, setNotes] = useState([]);
  const [meetingNotes, setMeetingNotes] = useState([]);
  const [googleReviews, setGoogleReviews] = useState({});
  const [gsmChecklist, setGsmChecklist] = useState({});
  const [fiKpis, setFiKpis] = useState({});
  const [fiChecklist] = useState({}); // Loaded for data integrity but not actively used
  const [fiDeals, setFiDeals] = useState([]);
  const [fiTargets, setFiTargets] = useState({});
  const [fiMenus, setFiMenus] = useState([]);
  const [fiMenuConfig, setFiMenuConfig] = useState({});
  const [promoRecords, setPromoRecords] = useState([]);
  const [pricingRecords, setPricingRecords] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [gsmBonusConfig, setGsmBonusConfig] = useState({});
  const [promos, setPromos] = useState([]);
  const [priceList, setPriceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selRep, setSelRep] = useState(null);
  const [yearlyLeads, setYearlyLeads] = useState([]);
  // yearlyFloorLeads removed — was set but never referenced by any component
  const [yearlyDeals, setYearlyDeals] = useState([]);
  const [yearlyMonthData, setYearlyMonthData] = useState([]);
  const [historyYear, setHistoryYear] = useState(now.getFullYear() - 1);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [salesSub, setSalesSub] = useState('deals');
  const [leadsSub, setLeadsSub] = useState('ism');
  const [mgrSub, setMgrSub] = useState('goals');
  const [crmUsers, setCrmUsers] = useState([]);

  // ── Session persistence ──
  const sessionKey = storeId ? `peg-auth-session-${storeId}` : SESSION_KEY;
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(sessionKey);
      if (saved) setCurrentUser(JSON.parse(saved));
    } catch {}
  }, [sessionKey]);

  // Load CRM users for the selected store
  useEffect(() => {
    if (storeId) {
      setCrmUsers([]);
      loadUsers(storeId).then((users) => setCrmUsers(users));
    }
  }, [storeId]);

  function handleLogin(user) {
    setCurrentUser(user);
    sessionStorage.setItem(sessionKey, JSON.stringify(user));
  }

  function handleLogout() {
    setCurrentUser(null);
    sessionStorage.removeItem(sessionKey);
    setView('dashboard');
    setShowAdmin(false);
  }

  // ── Load ──
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
      const data = await loadMonth(storeId, year, month);
      if (data) {
        setDeals(data.deals || []); setLeads(data.leads || []); setFloorLeads(data.floorLeads || []);
        if (data.goals) setGoals(data.goals); if (data.sp) setSpList(data.sp);
        if (data.pga) setPgaTiers(data.pga); if (data.be) setBeSpiffs(data.be);
        setHitList(data.hitList || []); setContests(data.contests || []);
        setDailyLeadCounts(data.dailyLeadCounts || []); setBulkLeadCounts(data.bulkLeadCounts || []);
        setFloorDailyLeadCounts(data.floorDailyLeadCounts || []); setFloorBulkLeadCounts(data.floorBulkLeadCounts || []);
        setNotes(data.notes || []); setMeetingNotes(data.meetingNotes || []);
        setGoogleReviews(data.googleReviews || {});
        setGsmChecklist(data.gsmChecklist || {});
        setFiKpis(data.fiKpis || {});
        setFiChecklist(data.fiChecklist || {});
        setFiDeals(data.fiDeals || []);
        setFiTargets(data.fiTargets || {});
        setFiMenus(data.fiMenus || []);
        setFiMenuConfig(data.fiMenuConfig || {});
        setPromoRecords(data.promoRecords || []);
        setPricingRecords(data.pricingRecords || []);
        setInventoryItems(data.inventoryItems || []);
        setGsmBonusConfig(data.gsmBonusConfig || {});
        setPromos(data.promos || []);
        setPriceList(data.priceList || []);
      } else {
        setDeals([]); setLeads([]); setFloorLeads([]); setHitList([]); setContests([]);
        setDailyLeadCounts([]); setBulkLeadCounts([]); setFloorDailyLeadCounts([]); setFloorBulkLeadCounts([]);
        setNotes([]); setMeetingNotes([]); setGoogleReviews({}); setGsmChecklist({}); setFiKpis({}); setFiChecklist({}); setFiDeals([]); setFiTargets({}); setGsmBonusConfig({});
        setPromos([]); setPriceList([]);
        setFiMenus([]); setFiMenuConfig({});
        setPromoRecords([]); setPricingRecords([]);
        setInventoryItems([]);
      }
      const yd = await loadYear(storeId, year);
      const aL = [], aD = [], aFL = [];
      yd.forEach((m, i) => {
        if (m) {
          (m.leads || []).forEach((l) => aL.push({ ...l, _month: i }));
          (m.deals || []).forEach((d) => aD.push({ ...d, _month: i }));
          (m.floorLeads || []).forEach((f) => aFL.push({ ...f, _month: i }));
        }
      });
      setYearlyLeads(aL); setYearlyDeals(aD); setYearlyMonthData(yd);
      } catch (e) {
        console.error('Data load error:', e);
      }
      setLoading(false);
    })();
  }, [storeId, year, month]);

  // ── Save (debounced — state updates immediately, Supabase write delayed 1s) ──
  const saveTimerRef = useRef(null);
  const pendingDataRef = useRef(null);
  const dataRef = useRef(null); // Always holds the latest full data snapshot

  // Keep dataRef in sync with all state on every render
  const currentData = {
    deals, leads, floorLeads, goals, sp: spList, pga: pgaTiers, be: beSpiffs,
    hitList, contests, dailyLeadCounts, bulkLeadCounts,
    floorDailyLeadCounts, floorBulkLeadCounts, notes, meetingNotes, googleReviews,
    gsmChecklist, fiKpis, fiChecklist, fiDeals, fiTargets, gsmBonusConfig, promos, priceList, fiMenus, fiMenuConfig, promoRecords, pricingRecords, inventoryItems,
  };
  dataRef.current = currentData;

  function getAllData(overrides = {}) {
    return { ...dataRef.current, ...overrides };
  }

  // Stable updateAndSave — safe to pass to children without useCallback
  const updateAndSave = useCallback((setter, key, newVal) => {
    setter(newVal);
    // Build data from ref (latest state) with the override applied
    const data = { ...dataRef.current, [key]: newVal };
    pendingDataRef.current = data;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (pendingDataRef.current) {
        saveMonth(storeId, year, month, pendingDataRef.current);
        pendingDataRef.current = null;
      }
    }, 1000);
  }, [storeId, year, month]);

  // Flush pending save on unmount or month/store change
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        if (pendingDataRef.current) {
          saveMonth(storeId, year, month, pendingDataRef.current);
          pendingDataRef.current = null;
        }
      }
    };
  }, [storeId, year, month]);

  // ── Mutators ──
  function addDeal(d) { const nd = [...deals, { ...d, id: Date.now().toString() }]; updateAndSave(setDeals, 'deals', nd); setModal(null); }
  function delDeal(id) { updateAndSave(setDeals, 'deals', deals.filter((d) => d.id !== id)); }
  function updateDeal(id, updated) { updateAndSave(setDeals, 'deals', deals.map((d) => d.id === id ? { ...updated } : d)); }
  function addLead(l) { const nl = [...leads, { ...l, id: Date.now().toString() }]; updateAndSave(setLeads, 'leads', nl); setModal(null); }
  function delLead(id) { updateAndSave(setLeads, 'leads', leads.filter((l) => l.id !== id)); }
  function updLead(id, f, v) { updateAndSave(setLeads, 'leads', leads.map((l) => l.id === id ? { ...l, [f]: v } : l)); }
  function saveGoals(g) { updateAndSave(setGoals, 'goals', g); setModal(null); }
  function saveReps(s) { updateAndSave(setSpList, 'sp', s); setModal(null); }
  function savePga(p) { updateAndSave(setPgaTiers, 'pga', p); setModal(null); }
  function saveBe(b) { updateAndSave(setBeSpiffs, 'be', b); setModal(null); }
  function saveHL(h) { updateAndSave(setHitList, 'hitList', h); }
  function saveCT(c) { updateAndSave(setContests, 'contests', c); }
  function saveDLC(d) { updateAndSave(setDailyLeadCounts, 'dailyLeadCounts', d); }
  function saveBLC(b) { updateAndSave(setBulkLeadCounts, 'bulkLeadCounts', b); }
  function saveFloorDLC(d) { updateAndSave(setFloorDailyLeadCounts, 'floorDailyLeadCounts', d); }
  function saveFloorBLC(b) { updateAndSave(setFloorBulkLeadCounts, 'floorBulkLeadCounts', b); }
  function saveNotes(n) { updateAndSave(setNotes, 'notes', n); }
  function saveMeetingNotes(n) { updateAndSave(setMeetingNotes, 'meetingNotes', n); }
  function saveGoogleReviews(g) { updateAndSave(setGoogleReviews, 'googleReviews', g); }
  function saveGsmChecklist(g) { updateAndSave(setGsmChecklist, 'gsmChecklist', g); }
  function saveFiKpis(f) { updateAndSave(setFiKpis, 'fiKpis', f); }
  // saveFiChecklist removed — fiChecklist not actively used by any component
  function saveFiDeals(f) { updateAndSave(setFiDeals, 'fiDeals', f); }
  function saveFiTargets(f) { updateAndSave(setFiTargets, 'fiTargets', f); }
  function saveGsmBonusConfig(g) { updateAndSave(setGsmBonusConfig, 'gsmBonusConfig', g); }
  function savePromos(p) { updateAndSave(setPromos, 'promos', p); }
  function savePriceList(p) { updateAndSave(setPriceList, 'priceList', p); }
  function saveFiMenus(f) { updateAndSave(setFiMenus, 'fiMenus', f); }
  function saveFiMenuConfig(f) { updateAndSave(setFiMenuConfig, 'fiMenuConfig', f); }
  function savePromoRecords(p) { updateAndSave(setPromoRecords, 'promoRecords', p); }
  function savePricingRecords(p) { updateAndSave(setPricingRecords, 'pricingRecords', p); }
  function saveInventoryItems(i) { updateAndSave(setInventoryItems, 'inventoryItems', i); }

  async function loadHistory(yr) { setHistoryLoading(true); setHistoryData(await loadYear(storeId, yr)); setHistoryYear(yr); setHistoryLoading(false); }
  async function saveHistoryMonth(yr, mo, overrides) {
    const existing = await loadMonth(storeId, yr, mo) || {};
    const merged = { ...existing, ...overrides };
    await saveMonth(storeId, yr, mo, merged);
  }
  useEffect(() => { if (view === 'history') loadHistory(historyYear); }, [view]);

  // ── Derived ──
  // Active salespeople — prefer real crm_users accounts, fall back to monthly sp list
  const act = useMemo(() => crmUsers.length > 0
    ? crmUsers.filter((u) => u.active !== false && (u.role === 'salesperson' || u.role === 'ism' || u.role === 'gsm' || u.role === 'admin' || u.role === 'sales_finance_mgr'))
    : spList.filter((s) => s.active), [crmUsers, spList]);
  const tot = useMemo(() => {
    const t = { ...Object.fromEntries(unitTypes.map((u) => [u, 0])), total: 0 };
    deals.forEach((d) => unitTypes.forEach((u) => { t[u] += d.units?.[u] || 0; }));
    t.total = unitTypes.reduce((s, u) => s + t[u], 0); return t;
  }, [deals, unitTypes]);
  const tTgt = useMemo(() => unitTypes.reduce((s, u) => s + (goals[u]?.target || 0), 0), [unitTypes, goals]);
  const tStr = useMemo(() => unitTypes.reduce((s, u) => s + (goals[u]?.stretch || 0), 0), [unitTypes, goals]);
  const ls = useMemo(() => ({ total: leads.length, set: leads.filter((l) => l.apptDate).length, kept: leads.filter((l) => l.showed).length, sold: leads.filter((l) => l.sold).length }), [leads]);
  const floorTrafficStats = useMemo(() => {
    const traffic = floorDailyLeadCounts.reduce((s, d) => s + (d.count || 0), 0) + floorBulkLeadCounts.reduce((s, d) => s + (d.count || 0), 0);
    return { total: traffic, sold: deals.length };
  }, [floorDailyLeadCounts, floorBulkLeadCounts, deals]);

  const yearlyMonthSales = useMemo(() => MONTHS.map((mName, mIdx) => {
    const mDeals = yearlyDeals.filter((d) => d._month === mIdx);
    const counts = { month: mName.substring(0, 3), monthIdx: mIdx, ...Object.fromEntries(unitTypes.map((u) => [u, 0])), total: 0 };
    mDeals.forEach((d) => unitTypes.forEach((u) => { counts[u] += d.units?.[u] || 0; }));
    counts.total = unitTypes.reduce((s, u) => s + counts[u], 0); return counts;
  }), [yearlyDeals]);

  const ytdTotal = useMemo(() => {
    const t = { ...Object.fromEntries(unitTypes.map((u) => [u, 0])), total: 0 };
    yearlyDeals.forEach((d) => unitTypes.forEach((u) => { t[u] += d.units?.[u] || 0; }));
    t.total = unitTypes.reduce((s, u) => s + t[u], 0); return t;
  }, [yearlyDeals]);

  const yearlyRepPerf = useMemo(() => act.map((sp) => {
    const rd = yearlyDeals.filter((d) => d.salesperson === sp.id);
    const counts = { ...Object.fromEntries(unitTypes.map((u) => [u, 0])), total: 0 };
    rd.forEach((d) => unitTypes.forEach((u) => { counts[u] += d.units?.[u] || 0; }));
    counts.total = unitTypes.reduce((s, u) => s + counts[u], 0);
    return { ...sp, ...counts };
  }).sort((a, b) => b.total - a.total), [yearlyDeals, act]);

  // Scroll to top on tab change
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [view]);

  // ═══ STORE PICKER GATE ═══
  if (!currentStore) {
    return <StorePickerScreen />;
  }

  // ═══ LOGIN GATE ═══
  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} storeId={storeId} storeTheme={storeTheme} onChangeStore={clearStore} />;
  }

  // ── Loading ──
  if (loading) {
    return (
      <div style={{ fontFamily: FB, background: 'var(--bg-primary)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
          <img src={storeTheme?.logo || '/logo.png'} alt="Performance East" style={{ height: 50, marginBottom: 16 }} />
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <span style={{ display: 'inline-block', width: 20, height: 20, border: '2px solid var(--border-primary)', borderTopColor: 'var(--brand-red)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
          <div style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2 }}>LOADING...</div>
        </div>
      </div>
    );
  }

  // ── Rep Dashboard ──
  if (selRep) {
    return <RepDashboard selRep={selRep} setSelRep={setSelRep} spList={spList} deals={deals} leads={leads} contests={contests} month={month} year={year} pgaTiers={pgaTiers} beSpiffs={beSpiffs} hitList={hitList} unitTypes={unitTypes} storeTheme={storeTheme} />;
  }

  // ── Tab definitions [key, label, shortLabel, group] ──
  // ── Consolidated navigation (Phase 1) ──
  const allTabs = [
    ['dashboard', 'DASHBOARD', 'HOME', 'main'],
    ['sales', 'SALES', 'SALES', 'main'],
    ['leads', 'LEADS', 'LEADS', 'leads'],
    ['manager', 'MANAGER', 'MGR', 'mgmt'],
    ['financeDash', 'F&I', 'F&I', 'mgmt'],
    ['history', 'HISTORICAL DATA', 'HISTORY', 'main'],
  ];
  const tabs = allTabs.filter(([k]) => canSeeTab(currentUser, k, storeConfig));

  if (!canSeeTab(currentUser, view, storeConfig) && view !== 'dashboard') {
    setView('dashboard');
  }

  const roleInfo = ROLES[currentUser.role] || {};

  // ── Current tab content ──
  const tabContent = (
    <>
      {showAdmin && canManageUsers(currentUser) && <AdminPanel storeId={storeId} storeConfig={storeConfig} />}

      {/* HOME — Dashboard (preserved) */}
      {!showAdmin && view === 'dashboard' && <DashboardTab month={month} year={year} goals={goals} tot={tot} tTgt={tTgt} tStr={tStr} ls={ls} floorTrafficStats={floorTrafficStats} yearlyMonthSales={yearlyMonthSales} ytdTotal={ytdTotal} yearlyRepPerf={yearlyRepPerf} notes={notes} saveNotes={saveNotes} meetingNotes={meetingNotes} saveMeetingNotes={saveMeetingNotes} deals={deals} currentUser={currentUser} act={act} updateDeal={updateDeal} unitTypes={unitTypes} setView={setView} setSalesSub={setSalesSub} setModal={setModal} pgaTiers={pgaTiers} yearlyDeals={yearlyDeals} />}

      {/* SALES — Deals + Leaderboard + History (consolidated) */}
      {!showAdmin && view === 'sales' && (
        <div>
          <div style={{ display: 'flex', gap: 2, background: 'var(--tab-bg)', borderRadius: 6, padding: 2, marginBottom: 14 }}>
            {[{ id: 'deals', label: 'DEALS' }, { id: 'programs', label: 'PROGRAMS' }].map((v) => (
              <button key={v.id} onClick={() => setSalesSub(v.id)} style={{
                padding: '6px 12px', borderRadius: 4, border: 'none', cursor: 'pointer',
                fontFamily: FH, fontSize: 9, fontWeight: 600, letterSpacing: 0.5,
                background: salesSub === v.id ? 'var(--brand-red)' : 'transparent',
                color: salesSub === v.id ? 'var(--text-inverse)' : 'var(--text-muted)',
                transition: 'all .15s',
              }}>{v.label}</button>
            ))}
          </div>
          {salesSub === 'deals' && <DealsTab month={month} year={year} deals={deals} spList={spList} act={act} tot={tot} pgaTiers={pgaTiers} modal={modal} setModal={setModal} addDeal={addDeal} delDeal={delDeal} updateDeal={updateDeal} currentUser={currentUser} unitTypes={unitTypes} backEndProducts={backEndProducts} beSpiffs={beSpiffs} />}
          {salesSub === 'programs' && <PromosTab currentUser={currentUser} storeId={storeId} storeConfig={storeConfig} promoRecords={promoRecords} savePromoRecords={savePromoRecords} pricingRecords={pricingRecords} savePricingRecords={savePricingRecords} />}
          {/* History moved to own top-level tab */}
        </div>
      )}

      {/* LEADS — ISM + Floor (Goldsboro) or SimpleLeads (Cedar Point) */}
      {!showAdmin && view === 'leads' && storeConfig?.has_ism === false && (
        <SimpleLeadsTab month={month} year={year} deals={deals} act={act} dailyLeadCounts={dailyLeadCounts} saveDLC={saveDLC} floorDailyLeadCounts={floorDailyLeadCounts} saveFloorDLC={saveFloorDLC} />
      )}
      {!showAdmin && view === 'leads' && storeConfig?.has_ism !== false && (
        <div>
          <div style={{ display: 'flex', gap: 2, background: 'var(--tab-bg)', borderRadius: 6, padding: 2, marginBottom: 14 }}>
            {[{ id: 'ism', label: 'INTERNET LEADS' }, { id: 'floor', label: 'FLOOR TRAFFIC' }].map((v) => (
              <button key={v.id} onClick={() => setLeadsSub(v.id)} style={{
                padding: '6px 12px', borderRadius: 4, border: 'none', cursor: 'pointer',
                fontFamily: FH, fontSize: 9, fontWeight: 600, letterSpacing: 0.5,
                background: leadsSub === v.id ? 'var(--brand-red)' : 'transparent',
                color: leadsSub === v.id ? 'var(--text-inverse)' : 'var(--text-muted)',
                transition: 'all .15s',
              }}>{v.label}</button>
            ))}
          </div>
          {leadsSub === 'ism' && <ISMLeadsTab month={month} year={year} leads={leads} spList={spList} act={act} ls={ls} dailyLeadCounts={dailyLeadCounts} bulkLeadCounts={bulkLeadCounts} yearlyLeads={yearlyLeads} yearlyMonthData={yearlyMonthData} saveDLC={saveDLC} saveBLC={saveBLC} />}
          {leadsSub === 'floor' && <FloorLeadsTab month={month} year={year} deals={deals} act={act} spList={spList} floorDailyLeadCounts={floorDailyLeadCounts} floorBulkLeadCounts={floorBulkLeadCounts} yearlyDeals={yearlyDeals} yearlyMonthData={yearlyMonthData} saveFloorDLC={saveFloorDLC} saveFloorBLC={saveFloorBLC} />}
        </div>
      )}

      {/* MANAGER — Goals + GSM + Pricing (consolidated) */}
      {!showAdmin && view === 'manager' && (
        <div>
          <div style={{ display: 'flex', gap: 2, background: 'var(--tab-bg)', borderRadius: 6, padding: 2, marginBottom: 14 }}>
            {[{ id: 'goals', label: 'GOALS & SPIFFS' }, { id: 'gsm', label: 'ACCOUNTABILITY' }].map((v) => (
              <button key={v.id} onClick={() => setMgrSub(v.id)} style={{
                padding: '6px 12px', borderRadius: 4, border: 'none', cursor: 'pointer',
                fontFamily: FH, fontSize: 9, fontWeight: 600, letterSpacing: 0.5,
                background: mgrSub === v.id ? 'var(--brand-red)' : 'transparent',
                color: mgrSub === v.id ? 'var(--text-inverse)' : 'var(--text-muted)',
                transition: 'all .15s',
              }}>{v.label}</button>
            ))}
          </div>
          {mgrSub === 'goals' && <GoalsTab goals={goals} tot={tot} tTgt={tTgt} pgaTiers={pgaTiers} beSpiffs={beSpiffs} hitList={hitList} contests={contests} spList={spList} act={act} modal={modal} setModal={setModal} saveGoals={saveGoals} saveReps={saveReps} savePga={savePga} saveBe={saveBe} saveHL={saveHL} saveCT={saveCT} unitTypes={unitTypes} />}
          {mgrSub === 'gsm' && <GSMDashTab month={month} year={year} deals={deals} act={act} currentUser={currentUser} googleReviews={googleReviews} saveGoogleReviews={saveGoogleReviews} gsmChecklist={gsmChecklist} saveGsmChecklist={saveGsmChecklist} fiKpis={fiKpis} saveFiKpis={saveFiKpis} gsmBonusConfig={gsmBonusConfig} saveGsmBonusConfig={saveGsmBonusConfig} />}
        </div>
      )}

      {/* F&I — Preserved exactly (already has internal sub-views) */}
      {!showAdmin && view === 'financeDash' && <FIDashTab month={month} year={year} deals={deals} currentUser={currentUser} act={act} storeConfig={storeConfig} storeTheme={storeTheme} fiKpis={fiKpis} saveFiKpis={saveFiKpis} fiDeals={fiDeals} saveFiDeals={saveFiDeals} fiTargets={fiTargets} saveFiTargets={saveFiTargets} yearlyMonthData={yearlyMonthData} backEndProducts={backEndProducts} fiMenus={fiMenus} saveFiMenus={saveFiMenus} fiMenuConfig={fiMenuConfig} saveFiMenuConfig={saveFiMenuConfig} />}

      {/* HISTORICAL DATA — own top-level tab, viewable by all, editable by admin/gsm only */}
      {!showAdmin && view === 'history' && <HistoryTab historyYear={historyYear} historyData={historyData} historyLoading={historyLoading} loadHistory={loadHistory} currentYear={now.getFullYear()} saveHistoryMonth={saveHistoryMonth} unitTypes={unitTypes} currentUser={currentUser} />}
    </>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', fontFamily: FB, color: 'var(--text-primary)' }}>
      {/* HEADER */}
      <div className="header-main" style={{
        background: 'var(--header-bg)', borderBottom: '3px solid var(--header-border)',
        padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100, boxShadow: 'var(--shadow-sm)', flexWrap: 'wrap', gap: 8,
      }}>
        <div className="header-logo-section" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={storeTheme?.logo || '/logo.png'} alt={currentStore?.name || 'Performance East'} style={{ height: 36, objectFit: 'contain' }} />
          <div className="header-divider" style={{ width: 1, height: 28, background: 'var(--divider)' }} />
          <div>
            <div style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 2 }}>{currentStore?.short_name?.toUpperCase() || 'SALES PORTAL'}</div>
            {currentUser?.role === 'admin' && stores.length > 1 && (
              <select value={storeId || ''} onChange={(e) => { handleLogout(); setStore(e.target.value); }} style={{
                fontFamily: FM, fontSize: 8, color: 'var(--brand-red)', background: 'transparent',
                border: 'none', cursor: 'pointer', padding: 0, fontWeight: 700,
              }}>
                {stores.filter((s) => s.active).map((s) => <option key={s.id} value={s.id}>{s.short_name || s.name}</option>)}
              </select>
            )}
          </div>
          <div className="header-divider" style={{ width: 1, height: 28, background: 'var(--divider)' }} />
          <div className="header-tabs" style={{ display: 'flex', gap: 2, background: 'var(--tab-bg)', borderRadius: 6, padding: 2, flexWrap: 'wrap' }}>
            {tabs.map(([k, l, short]) => (
              <button key={k} onClick={() => { setView(k); setShowAdmin(false); setShowNotifPanel(false); }} style={{
                padding: '6px 10px', borderRadius: 4, border: 'none', cursor: 'pointer',
                fontFamily: FH, fontSize: 9, fontWeight: 500, letterSpacing: 0.8, whiteSpace: 'nowrap',
                background: view === k && !showAdmin ? 'var(--tab-active-bg)' : 'transparent',
                color: view === k && !showAdmin ? 'var(--tab-active-text)' : 'var(--tab-text)',
                transition: 'all .15s',
              }}>{short}</button>
            ))}
            {canManageUsers(currentUser) && (
              <button onClick={() => { setShowAdmin(!showAdmin); if (showAdmin) loadUsers().then((u) => { if (u.length > 0) setCrmUsers(u); }); }} style={{
                padding: '6px 10px', borderRadius: 4, border: 'none', cursor: 'pointer',
                fontFamily: FH, fontSize: 9, fontWeight: 500, letterSpacing: 0.8,
                background: showAdmin ? 'var(--tab-active-bg)' : 'transparent',
                color: showAdmin ? 'var(--tab-active-text)' : 'var(--tab-text)',
                transition: 'all .15s',
              }}>ADMIN</button>
            )}
          </div>
        </div>
        <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="header-stats" style={{ display: 'flex', gap: 6, marginRight: 6 }}>
            {[
              { v: tot.total, l: 'SOLD', c: tot.total >= tTgt ? '#16a34a' : '#d97706' },
              { v: ls.sold + floorTrafficStats.sold, l: 'LEADS', c: '#2563eb' },
              { v: hitList.filter((h) => h.sold).length + '/' + hitList.length, l: 'HIT', c: '#7c3aed' },
            ].map((s) => (
              <div key={s.l} style={{ background: 'var(--badge-bg)', borderRadius: 6, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontFamily: FM, fontSize: 12, fontWeight: 700, color: s.c }}>{s.v}</span>
                <span style={{ fontFamily: FM, fontSize: 7, color: 'var(--text-muted)' }}>{s.l}</span>
              </div>
            ))}
          </div>
          {/* Theme toggle */}
          <button onClick={toggleTheme} title={isDark ? 'Switch to light mode' : 'Switch to dark mode'} style={{
            background: 'var(--badge-bg)', border: '1px solid var(--border-primary)', borderRadius: 6,
            padding: '5px 8px', cursor: 'pointer', fontSize: 14, lineHeight: 1,
            color: 'var(--text-secondary)', transition: 'all .15s',
          }}>
            {isDark ? '\u2600\uFE0F' : '\uD83C\uDF19'}
          </button>
          {/* Notification bell */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowNotifPanel(!showNotifPanel)} style={{
              background: 'var(--badge-bg)', border: '1px solid var(--border-primary)', borderRadius: 6,
              padding: '5px 8px', cursor: 'pointer', fontSize: 14, lineHeight: 1,
              color: 'var(--text-secondary)', transition: 'all .15s', position: 'relative',
            }}>
              {'\uD83D\uDD14'}
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -4, background: 'var(--brand-red)',
                  color: 'var(--text-inverse)', fontFamily: FM, fontSize: 8, fontWeight: 700,
                  width: 16, height: 16, borderRadius: '50%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', lineHeight: 1,
                }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>
            {showNotifPanel && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 6,
                width: 320, maxHeight: 400, overflow: 'auto',
                background: 'var(--card-bg)', border: '1px solid var(--border-primary)',
                borderRadius: 10, boxShadow: 'var(--shadow-lg)', zIndex: 200,
              }}>
                <div style={{
                  padding: '10px 14px', borderBottom: '1px solid var(--border-primary)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ fontFamily: FH, fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 1 }}>NOTIFICATIONS</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} style={{
                      background: 'none', border: 'none', fontFamily: FM, fontSize: 9,
                      color: 'var(--brand-red)', cursor: 'pointer', fontWeight: 700,
                    }}>MARK ALL READ</button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', fontFamily: FM, fontSize: 11, color: 'var(--text-muted)' }}>
                    No notifications
                  </div>
                ) : (
                  notifications.slice(0, 20).map((n) => (
                    <div key={n.id} onClick={() => { markRead(n.id); if (n.action) { setView(n.action.tab); setShowNotifPanel(false); } }}
                      style={{
                        padding: '10px 14px', borderBottom: '1px solid var(--border-secondary)',
                        cursor: n.action ? 'pointer' : 'default',
                        background: n.read ? 'transparent' : 'var(--brand-red-soft)',
                        transition: 'background .15s',
                      }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: FM, fontSize: 11, fontWeight: n.read ? 400 : 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                            {n.icon && <span style={{ marginRight: 4 }}>{n.icon}</span>}{n.title}
                          </div>
                          {n.body && <div style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{n.body}</div>}
                          <div style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)', marginTop: 3 }}>
                            {new Date(n.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); dismissNotification(n.id); }} style={{
                          background: 'none', border: 'none', color: 'var(--text-muted)',
                          cursor: 'pointer', fontSize: 12, flexShrink: 0,
                        }}>✕</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <select value={month} onChange={(e) => setMonth(+e.target.value)} style={{ ...inp, width: 'auto', padding: '5px 8px', fontSize: 11, fontFamily: FM }}>
            {MONTHS.map((m, i) => <option key={i} value={i}>{m.toUpperCase()}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(+e.target.value)} style={{ ...inp, width: 'auto', padding: '5px 8px', fontSize: 11, fontFamily: FM }}>
            {[2023, 2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <div style={{ width: 1, height: 28, background: 'var(--divider)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: FH, fontSize: 11, fontWeight: 700, lineHeight: 1, color: 'var(--text-primary)' }}>{currentUser.name.split(' ')[0]}</div>
              <div style={{ fontFamily: FM, fontSize: 8, color: roleInfo.color || 'var(--text-muted)', fontWeight: 600 }}>{roleInfo.label || currentUser.role}</div>
            </div>
            <button onClick={handleLogout} style={{
              background: 'var(--badge-bg)', border: '1px solid var(--border-primary)', borderRadius: 4,
              padding: '5px 8px', cursor: 'pointer', fontFamily: FM, fontSize: 9,
              color: 'var(--text-muted)', fontWeight: 600, letterSpacing: 0.5,
              transition: 'all .15s',
            }}>OUT</button>
          </div>
        </div>
      </div>

      <div className="app-content" style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 20px 40px' }}>
        <TabTransition viewKey={showAdmin ? 'admin' : view}>
          {tabContent}
        </TabTransition>
      </div>

      <div className="app-footer" style={{ borderTop: '1px solid var(--divider)', padding: '10px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 10, fontFamily: FM, letterSpacing: 1 }}>
        {storeTheme?.footer || 'PERFORMANCE EAST INC \u00B7 SALES PORTAL'}
      </div>
    </div>
  );
}
