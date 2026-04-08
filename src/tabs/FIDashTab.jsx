import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { MONTHS, BACK_END_PRODUCTS as DEFAULT_BE_PRODUCTS } from '../lib/constants';
import { Modal, ProgressBar, styles, FM, FH } from '../components/SharedUI';
import { canEditFiMenuSettings, canViewFiMenuCost } from '../lib/auth';
import { getProductsForStore, getPackagesForStore, DEFAULT_FI_PRODUCTS, DEFAULT_FI_PACKAGES } from '../lib/fiMenuConstants';
import { readFiMenuConfigBackup } from '../lib/storage';
import MenuBuilder from './fimenu/MenuBuilder';
import MenuPresentation from './fimenu/MenuPresentation';
import MenuSettings from './fimenu/MenuSettings';
import MenuList from './fimenu/MenuList';

const { card, cardHead: cH, input: inp, btn1: b1, btn2: b2, th: TH, td: TD } = styles;

const DEFAULT_FI_TARGETS = {
  pus: { label: 'PUS (Profit Per Unit Sold)', target: 1000, unit: '$' },
  ew: { label: 'Extended Warranty', target: 40, unit: '%' },
  lsp: { label: 'Lifetime Service Plan', target: 15, unit: '%' },
  gap: { label: 'GAP Penetration', target: 20, unit: '%' },
  battery: { label: 'Lifetime Battery', target: 40, unit: '%' },
};

export default function FIDashTab({
  month, year, deals, currentUser, act, storeConfig, storeTheme, storeId,
  fiKpis, saveFiKpis, fiDeals, saveFiDeals,
  fiTargets, saveFiTargets, yearlyMonthData,
  backEndProducts: propBEProducts,
  fiMenus, saveFiMenus, fiMenuConfig, saveFiMenuConfig,
}) {
  const BACK_END_PRODUCTS = propBEProducts || DEFAULT_BE_PRODUCTS;
  const [modal, setModal] = useState(null);
  const [editTargets, setEditTargets] = useState(false);
  const [subView, setSubView] = useState('kpis'); // kpis | menus | builder | presentation | settings
  const [editingMenu, setEditingMenu] = useState(null);
  const [presentingMenu, setPresentingMenu] = useState(null);

  const targets = { ...DEFAULT_FI_TARGETS, ...(fiTargets || {}) };
  const kpiValues = fiKpis || {};
  const isAdmin = currentUser?.role === 'admin';
  const fDeals = fiDeals || [];
  const canSettings = canEditFiMenuSettings(currentUser);

  // One-time seed guarded by a ref and the dedicated F&I backup. Only fires when
  // there's genuinely no data anywhere — protects manually-built catalogs from
  // being overwritten by a stray seed firing during a load race.
  const seedAttemptedRef = useRef(false);
  useEffect(() => {
    if (seedAttemptedRef.current) return;
    if (!saveFiMenuConfig || !fiMenuConfig) return;
    if (fiMenuConfig.products && fiMenuConfig.products.length > 0) return;
    if (fiMenuConfig.packages && fiMenuConfig.packages.length > 0) return;
    // Check the dedicated F&I backup before seeding — the backup may have the user's data
    const backup = readFiMenuConfigBackup(storeId);
    if (backup && ((backup.products && backup.products.length > 0) || (backup.packages && backup.packages.length > 0))) {
      // User has a backup — restore from it instead of seeding defaults
      seedAttemptedRef.current = true;
      saveFiMenuConfig({ ...fiMenuConfig, ...backup });
      return;
    }
    seedAttemptedRef.current = true;
    const seedProducts = getProductsForStore(storeConfig, DEFAULT_FI_PRODUCTS);
    const seedPackages = getPackagesForStore(storeConfig, seedProducts, DEFAULT_FI_PACKAGES);
    saveFiMenuConfig({ ...fiMenuConfig, products: seedProducts, packages: seedPackages });
  }, [fiMenuConfig?.products, fiMenuConfig?.packages, storeConfig]);

  const products = fiMenuConfig?.products || getProductsForStore(storeConfig, DEFAULT_FI_PRODUCTS);
  const packages = fiMenuConfig?.packages || getPackagesForStore(storeConfig, products, DEFAULT_FI_PACKAGES);

  // ── KPI calculations (preserved exactly) ──
  const totalDeals = deals.length;
  const totalFiDeals = fDeals.length;
  const totalBackEnd = fDeals.reduce((s, d) => s + (d.backEndTotal || 0), 0);
  const avgPus = totalFiDeals > 0 ? Math.round(totalBackEnd / totalFiDeals) : 0;

  const productCounts = {};
  BACK_END_PRODUCTS.forEach((p) => { productCounts[p] = 0; });
  productCounts['GAP'] = productCounts['GAP'] || 0;
  fDeals.forEach((d) => { (d.products || []).forEach((p) => { if (productCounts[p] !== undefined) productCounts[p]++; }); });
  const getPct = (count) => totalFiDeals > 0 ? Math.round(count / totalFiDeals * 100) : 0;

  const autoKpis = {
    pus: avgPus,
    ew: getPct(productCounts['EXTENDED WARRANTY'] || 0),
    lsp: getPct(productCounts['LIFETIME OIL CHANGE'] || 0),
    gap: getPct(productCounts['GAP'] || 0),
    battery: getPct(productCounts['LIFETIME BATTERY'] || 0),
  };

  const kpiList = Object.entries(targets).map(([id, t]) => {
    const actual = kpiValues[id] !== undefined ? kpiValues[id] : autoKpis[id] || 0;
    const hit = actual >= t.target;
    return { id, ...t, actual, hit };
  });

  const kpiHits = kpiList.filter((k) => k.hit);
  const kpiCount = kpiHits.length;
  let commissionPct = 15;
  if (kpiCount >= 5) commissionPct = 18;
  else commissionPct = 15 + (kpiCount * 0.5);

  const monthlyTracker = useMemo(() => {
    return MONTHS.map((mName, mIdx) => {
      const mData = yearlyMonthData?.[mIdx];
      const mFiDeals = (mData && mData.fiDeals) || [];
      const mDeals = (mData && mData.deals) || [];
      const mTotal = mFiDeals.reduce((s, d) => s + (d.backEndTotal || 0), 0);
      const mAvgPus = mFiDeals.length > 0 ? Math.round(mTotal / mFiDeals.length) : 0;
      const mProducts = {};
      BACK_END_PRODUCTS.forEach((p) => { mProducts[p] = 0; });
      mFiDeals.forEach((d) => { (d.products || []).forEach((p) => { if (mProducts[p] !== undefined) mProducts[p]++; }); });
      const mPct = (count) => mFiDeals.length > 0 ? Math.round(count / mFiDeals.length * 100) : 0;
      return {
        month: mName.substring(0, 3).toUpperCase(), monthIdx: mIdx,
        fiDeals: mFiDeals.length, totalDeals: mDeals.length,
        pus: mAvgPus, totalBE: mTotal,
        ew: mPct(mProducts['EXTENDED WARRANTY'] || 0),
        lsp: mPct(mProducts['LIFETIME OIL CHANGE'] || 0),
        gap: mPct(mProducts['GAP'] || 0),
        battery: mPct(mProducts['LIFETIME BATTERY'] || 0),
      };
    }).filter((m) => m.fiDeals > 0 || m.totalDeals > 0 || m.monthIdx <= month);
  }, [yearlyMonthData, month]);

  // ── F&I Deal Form (preserved exactly) ──
  const [fd, setFd] = useState({ date: new Date().toISOString().split('T')[0], customer: '', dealNumber: '', backEndTotal: '', products: [] });
  function toggleProduct(p) { setFd((prev) => ({ ...prev, products: prev.products.includes(p) ? prev.products.filter((x) => x !== p) : [...prev.products, p] })); }
  function addFiDeal() {
    if (!fd.backEndTotal && fd.products.length === 0) return;
    saveFiDeals([...fDeals, { ...fd, id: Date.now().toString(), backEndTotal: parseInt(fd.backEndTotal) || 0 }]);
    setFd({ date: new Date().toISOString().split('T')[0], customer: '', dealNumber: '', backEndTotal: '', products: [] });
    setModal(null);
  }
  function delFiDeal(id) { saveFiDeals(fDeals.filter((d) => d.id !== id)); }

  // ── Menu CRUD ──
  function handleSaveMenu(menu) {
    if (!saveFiMenus) return;
    const menus = fiMenus || [];
    if (menus.find((m) => m.id === menu.id)) {
      saveFiMenus(menus.map((m) => m.id === menu.id ? menu : m));
    } else {
      saveFiMenus([...menus, menu]);
    }
    setEditingMenu(null);
    setSubView('menus');
  }
  function deleteMenu(id) { if (saveFiMenus) saveFiMenus((fiMenus || []).filter((m) => m.id !== id)); }

  return (
    <div>
      {/* ═══ INTERNAL SUB-NAV ═══ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 2, background: 'var(--tab-bg)', borderRadius: 6, padding: 2 }}>
          {[
            { id: 'kpis', label: 'KPIs & DEALS' },
            { id: 'menus', label: 'FINANCE MENUS' },
            ...(canSettings ? [{ id: 'settings', label: 'SETTINGS' }] : []),
          ].map((v) => (
            <button key={v.id} onClick={() => { setSubView(v.id); setEditingMenu(null); setPresentingMenu(null); }} style={{
              padding: '6px 12px', borderRadius: 4, border: 'none', cursor: 'pointer',
              fontFamily: FH, fontSize: 9, fontWeight: 600, letterSpacing: 0.5,
              background: subView === v.id || (v.id === 'menus' && (subView === 'builder' || subView === 'presentation')) ? 'var(--brand-red)' : 'transparent',
              color: subView === v.id || (v.id === 'menus' && (subView === 'builder' || subView === 'presentation')) ? 'var(--text-inverse)' : 'var(--text-muted)',
              transition: 'all .15s',
            }}>{v.label}</button>
          ))}
        </div>
        {subView === 'menus' && (
          <button onClick={() => { setEditingMenu(null); setSubView('builder'); }} style={b1}>+ NEW MENU</button>
        )}
        {(subView === 'builder' || subView === 'presentation') && (
          <button onClick={() => { setSubView('menus'); setEditingMenu(null); setPresentingMenu(null); }} style={b2}>BACK TO MENUS</button>
        )}
      </div>

      {/* ═══ KPIs & DEALS VIEW (existing — preserved) ═══ */}
      {subView === 'kpis' && (
        <div>
          {/* KPI Dashboard */}
          <div style={{ ...card, marginBottom: 16 }}>
            <div style={{ ...cH, background: '#eff6ff', borderBottomColor: '#bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#2563eb' }}>F&I KPI PERFORMANCE — {MONTHS[month].toUpperCase()} {year}</span>
              {isAdmin && <button onClick={() => setEditTargets(!editTargets)} style={{ background: 'none', border: 'none', fontFamily: FM, fontSize: 9, color: '#2563eb', cursor: 'pointer', fontWeight: 700 }}>{editTargets ? 'DONE' : 'EDIT TARGETS'}</button>}
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
                {kpiList.map((k) => (
                  <div key={k.id} style={{ background: k.hit ? '#f0fdf4' : '#fef2f2', borderRadius: 8, padding: '14px 16px', border: `1px solid ${k.hit ? '#bbf7d0' : '#fecaca'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ fontFamily: FH, fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>{k.label}</div>
                      <span style={{ fontFamily: FM, fontSize: 10, fontWeight: 700, color: k.hit ? '#16a34a' : 'var(--brand-red)', padding: '2px 8px', borderRadius: 3, background: k.hit ? '#dcfce7' : '#fef2f2' }}>{k.hit ? 'HIT' : 'MISS'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)' }}>ACTUAL:</span>
                      <span style={{ fontFamily: FH, fontSize: 18, fontWeight: 700, color: k.hit ? '#16a34a' : 'var(--brand-red)' }}>{k.unit === '$' ? '$' : ''}{k.actual}{k.unit === '%' ? '%' : ''}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <span style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)' }}>TARGET:</span>
                      {editTargets ? (
                        <input type="number" min="0" value={targets[k.id]?.target || ''} onChange={(e) => saveFiTargets({ ...targets, [k.id]: { ...targets[k.id], target: parseInt(e.target.value) || 0 } })} style={{ ...inp, width: 60, textAlign: 'center', padding: '2px 6px', fontSize: 11 }} />
                      ) : (
                        <span style={{ fontFamily: FM, fontSize: 11, color: 'var(--text-secondary)' }}>{k.unit === '$' ? '$' : ''}{k.target}{k.unit === '%' ? '%' : ''}</span>
                      )}
                    </div>
                    <div style={{ marginTop: 6 }}><ProgressBar value={k.actual} max={k.target * 1.2 || 1} color={k.hit ? '#16a34a' : 'var(--brand-red)'} /></div>
                  </div>
                ))}
              </div>
              <div style={{ background: 'var(--bg-tertiary)', borderRadius: 8, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontFamily: FH, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>COMMISSION RATE FOR NEXT MONTH</div>
                  <div style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-secondary)' }}>{kpiCount}/{kpiList.length} KPIs hit{kpiCount === kpiList.length ? ' — PERFECT MONTH' : ''}</div>
                </div>
                <div style={{ fontFamily: FH, fontSize: 36, fontWeight: 700, color: kpiCount === kpiList.length ? '#16a34a' : kpiCount > 0 ? '#d97706' : 'var(--brand-red)', lineHeight: 1 }}>{commissionPct}%</div>
              </div>
            </div>
          </div>

          {/* F&I Deal Log */}
          <div style={{ ...card, marginBottom: 16 }}>
            <div style={{ ...cH, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>F&I DEAL LOG — {MONTHS[month].toUpperCase()}</span>
              <button onClick={() => setModal('addFiDeal')} style={{ ...b1, padding: '5px 12px', fontSize: 10 }}>+ LOG F&I DEAL</button>
            </div>
            <div style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['Date', 'Customer', 'Deal #', 'Back End $', ...BACK_END_PRODUCTS.map((p) => p.replace('LIFETIME ', '')), ''].map((h) => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                <tbody>
                  {fDeals.length === 0 && <tr><td colSpan={BACK_END_PRODUCTS.length + 5} style={{ ...TD, padding: 30, textAlign: 'center', color: 'var(--text-muted)', fontFamily: FM, fontSize: 11 }}>NO F&I DEALS LOGGED</td></tr>}
                  {fDeals.slice().sort((a, b) => (a.date || '').localeCompare(b.date || '')).map((d) => (
                    <tr key={d.id}>
                      <td style={{ ...TD, fontFamily: FM, fontSize: 11 }}>{d.date || '\u2014'}</td>
                      <td style={{ ...TD, fontWeight: 600 }}>{d.customer || '\u2014'}</td>
                      <td style={{ ...TD, fontFamily: FM, fontSize: 11, color: 'var(--text-muted)' }}>{d.dealNumber || '\u2014'}</td>
                      <td style={{ ...TD, fontFamily: FM, fontWeight: 700, color: '#16a34a' }}>${(d.backEndTotal || 0).toLocaleString()}</td>
                      {BACK_END_PRODUCTS.map((p) => (
                        <td key={p} style={{ ...TD, textAlign: 'center' }}>
                          <span style={{ fontFamily: FM, fontSize: 12, fontWeight: 700, color: (d.products || []).includes(p) ? '#16a34a' : 'var(--border-primary)' }}>{(d.products || []).includes(p) ? '\u2713' : '\u2014'}</span>
                        </td>
                      ))}
                      <td style={TD}><button onClick={() => delFiDeal(d.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>{'\u2715'}</button></td>
                    </tr>
                  ))}
                  {fDeals.length > 0 && (
                    <tr style={{ background: 'var(--bg-tertiary)', borderTop: '2px solid #2563eb' }}>
                      <td colSpan={3} style={{ ...TD, fontFamily: FH, fontWeight: 700, letterSpacing: 1, fontSize: 11 }}>TOTALS ({totalFiDeals} deals)</td>
                      <td style={{ ...TD, fontFamily: FH, fontWeight: 700, color: '#16a34a' }}>${totalBackEnd.toLocaleString()}</td>
                      {BACK_END_PRODUCTS.map((p) => (
                        <td key={p} style={{ ...TD, textAlign: 'center', fontFamily: FM, fontWeight: 700, color: '#2563eb', fontSize: 11 }}>{productCounts[p]}/{totalFiDeals} ({getPct(productCounts[p])}%)</td>
                      ))}
                      <td style={TD} />
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '8px 16px', fontFamily: FM, fontSize: 10, color: 'var(--text-muted)', borderTop: '1px solid var(--border-secondary)' }}>
              AVG PUS: <strong style={{ color: avgPus >= (targets.pus?.target || 1000) ? '#16a34a' : 'var(--brand-red)' }}>${avgPus.toLocaleString()}</strong> (target: ${(targets.pus?.target || 1000).toLocaleString()})
            </div>
          </div>

          {/* Month-to-Month Tracker */}
          <div style={{ ...card, marginBottom: 16 }}>
            <div style={cH}>MONTHLY F&I TRACKER — {year}</div>
            <div style={{ padding: 16, height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTracker} barCategoryGap="15%">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                  <XAxis dataKey="month" tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontFamily: FM }} />
                  <YAxis yAxisId="left" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: FM }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: FM }} domain={[0, 100]} unit="%" />
                  <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-primary)', borderRadius: 6, fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontFamily: FM, fontSize: 9 }} />
                  <Bar yAxisId="left" dataKey="pus" name="PUS ($)" fill="#2563eb" radius={[3, 3, 0, 0]} />
                  <Bar yAxisId="right" dataKey="ew" name="EW %" fill="#16a34a" radius={[3, 3, 0, 0]} opacity={0.7} />
                  <Bar yAxisId="right" dataKey="gap" name="GAP %" fill="#d97706" radius={[3, 3, 0, 0]} opacity={0.7} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={card}>
            <div style={cH}>MONTHLY PUS & PENETRATION BREAKDOWN — {year}</div>
            <div style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['Month', 'Deals', 'Total BE $', 'PUS', 'EW %', 'LSP %', 'GAP %', 'BATT %'].map((h) => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                <tbody>
                  {monthlyTracker.map((m) => {
                    const pusHit = m.pus >= (targets.pus?.target || 1000);
                    return (
                      <tr key={m.month} style={{ background: m.monthIdx === month ? 'var(--brand-red-soft)' : 'transparent' }}>
                        <td style={{ ...TD, fontFamily: FH, fontWeight: m.monthIdx === month ? 700 : 500, color: m.monthIdx === month ? '#2563eb' : 'var(--text-primary)' }}>{m.month}</td>
                        <td style={{ ...TD, fontFamily: FM, textAlign: 'center' }}>{m.fiDeals || '\u2014'}</td>
                        <td style={{ ...TD, fontFamily: FM, color: 'var(--text-secondary)' }}>{m.totalBE > 0 ? '$' + m.totalBE.toLocaleString() : '\u2014'}</td>
                        <td style={{ ...TD, fontFamily: FH, fontWeight: 700, color: m.pus > 0 ? (pusHit ? '#16a34a' : 'var(--brand-red)') : 'var(--border-primary)' }}>{m.pus > 0 ? '$' + m.pus.toLocaleString() : '\u2014'}</td>
                        <td style={{ ...TD, fontFamily: FM, fontWeight: 700, color: m.ew >= (targets.ew?.target || 40) ? '#16a34a' : m.ew > 0 ? 'var(--brand-red)' : 'var(--border-primary)', textAlign: 'center' }}>{m.ew > 0 ? m.ew + '%' : '\u2014'}</td>
                        <td style={{ ...TD, fontFamily: FM, fontWeight: 700, color: m.lsp >= (targets.lsp?.target || 15) ? '#16a34a' : m.lsp > 0 ? 'var(--brand-red)' : 'var(--border-primary)', textAlign: 'center' }}>{m.lsp > 0 ? m.lsp + '%' : '\u2014'}</td>
                        <td style={{ ...TD, fontFamily: FM, fontWeight: 700, color: m.gap >= (targets.gap?.target || 20) ? '#16a34a' : m.gap > 0 ? 'var(--brand-red)' : 'var(--border-primary)', textAlign: 'center' }}>{m.gap > 0 ? m.gap + '%' : '\u2014'}</td>
                        <td style={{ ...TD, fontFamily: FM, fontWeight: 700, color: m.battery >= (targets.battery?.target || 40) ? '#16a34a' : m.battery > 0 ? 'var(--brand-red)' : 'var(--border-primary)', textAlign: 'center' }}>{m.battery > 0 ? m.battery + '%' : '\u2014'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add F&I Deal Modal */}
          <Modal open={modal === 'addFiDeal'} onClose={() => setModal(null)} title="Log F&I Deal">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 3 }}>DATE</label><input type="date" value={fd.date} onChange={(e) => setFd({ ...fd, date: e.target.value })} style={inp} /></div>
                <div><label style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 3 }}>DEAL #</label><input value={fd.dealNumber} onChange={(e) => setFd({ ...fd, dealNumber: e.target.value })} style={inp} placeholder="4008XXX" /></div>
              </div>
              <div><label style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 3 }}>CUSTOMER NAME</label><input value={fd.customer} onChange={(e) => setFd({ ...fd, customer: e.target.value })} style={inp} placeholder="LAST, FIRST" /></div>
              <div><label style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 3 }}>TOTAL BACK END $ (F&I GROSS)</label><input type="number" min="0" value={fd.backEndTotal} onChange={(e) => setFd({ ...fd, backEndTotal: e.target.value })} style={{ ...inp, fontSize: 16, fontWeight: 700, textAlign: 'center' }} placeholder="$0" /></div>
              <div>
                <label style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 6 }}>PRODUCTS SOLD</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {BACK_END_PRODUCTS.map((p) => {
                    const sel = fd.products.includes(p);
                    return (
                      <button key={p} onClick={() => toggleProduct(p)} type="button" style={{
                        padding: '8px 14px', borderRadius: 4,
                        border: sel ? '2px solid #16a34a' : '1px solid var(--border-primary)',
                        background: sel ? '#dcfce7' : 'var(--card-bg)',
                        fontFamily: FM, fontSize: 11, fontWeight: sel ? 700 : 500,
                        color: sel ? '#16a34a' : 'var(--text-secondary)', cursor: 'pointer',
                      }}>{sel ? '\u2713 ' : ''}{p}</button>
                    );
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setModal(null)} style={b2}>CANCEL</button>
                <button onClick={addFiDeal} style={b1}>SAVE DEAL</button>
              </div>
            </div>
          </Modal>
        </div>
      )}

      {/* ═══ FINANCE MENUS VIEW ═══ */}
      {subView === 'menus' && (
        <MenuList
          fiMenus={fiMenus || []}
          onEdit={(m) => { setEditingMenu(m); setSubView('builder'); }}
          onPresent={(m) => { setPresentingMenu(m); setSubView('presentation'); }}
          onDelete={deleteMenu}
          act={act}
        />
      )}

      {/* ═══ MENU BUILDER VIEW ═══ */}
      {subView === 'builder' && (
        <MenuBuilder
          menu={editingMenu}
          onSave={handleSaveMenu}
          onCancel={() => { setSubView('menus'); setEditingMenu(null); }}
          onPresent={() => { if (editingMenu) { setPresentingMenu(editingMenu); setSubView('presentation'); } }}
          products={products}
          packages={packages}
          act={act}
          currentUser={currentUser}
          storeConfig={storeConfig}
          fiMenuConfig={fiMenuConfig}
        />
      )}

      {/* ═══ PRESENTATION VIEW ═══ */}
      {subView === 'presentation' && presentingMenu && (
        <MenuPresentation
          menu={presentingMenu}
          packages={packages}
          products={products}
          onBack={() => { setSubView('menus'); setPresentingMenu(null); }}
          storeTheme={storeTheme}
        />
      )}

      {/* ═══ SETTINGS VIEW ═══ */}
      {subView === 'settings' && canSettings && (
        <MenuSettings
          fiMenuConfig={fiMenuConfig}
          saveFiMenuConfig={saveFiMenuConfig}
          products={products}
          packages={packages}
          storeId={storeId}
        />
      )}
    </div>
  );
}
