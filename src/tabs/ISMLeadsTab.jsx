import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { MONTHS } from '../lib/constants';
import { ProgressBar, StatCard, Modal, styles, FM, FH } from '../components/SharedUI';
import { LeadForm } from '../components/Forms';

const { card, cardHead: cH, input: inp, btn1: b1, th: TH, td: TD } = styles;

const numInp = { ...inp, width: 55, textAlign: 'center', padding: '4px 2px', fontSize: 12, fontWeight: 700 };

export default function ISMLeadsTab({
  month, year, leads, spList, act, ls,
  dailyLeadCounts, bulkLeadCounts, yearlyLeads, yearlyMonthData,
  saveDLC, saveBLC, addLead, delLead, updLead, modal, setModal,
  saveHistoryMonth, reloadYear,
}) {
  const [editingLead, setEditingLead] = useState(null);
  const [editingFunnel, setEditingFunnel] = useState(null); // { monthIdx, leads, set, kept, sold }
  const [editingRepHistory, setEditingRepHistory] = useState(null); // { monthIdx, reps: {repId: {leads,set,kept,sold}} }

  const repLeadStats = act.map((sp) => {
    const rl = leads.filter((l) => l.salesperson === sp.id);
    const set = rl.filter((l) => l.apptDate).length;
    const kept = rl.filter((l) => l.showed).length;
    const sold = rl.filter((l) => l.sold).length;
    return { ...sp, set, kept, sold, closeRate: kept > 0 ? Math.round(sold / kept * 100) : 0, total: rl.length };
  }).sort((a, b) => b.sold - a.sold);

  // Build monthly summary with history overrides
  const monthlySummary = MONTHS.map((mName, mIdx) => {
    const mLeads = (yearlyLeads || []).filter((l) => l._month === mIdx);
    const mData = yearlyMonthData?.[mIdx];
    const hist = mData?.ismHistoryCounts || {};
    const realLeads = mLeads.length;
    const realSet = mLeads.filter((l) => l.apptDate).length;
    const realKept = mLeads.filter((l) => l.showed).length;
    const realSold = mLeads.filter((l) => l.sold).length;
    return {
      month: mName.substring(0, 3).toUpperCase(), monthFull: mName, monthIdx: mIdx,
      leads: realLeads + (hist.leads || 0),
      set: realSet + (hist.set || 0),
      kept: realKept + (hist.kept || 0),
      sold: realSold + (hist.sold || 0),
      hasHistory: !!(hist.leads || hist.set || hist.kept || hist.sold),
    };
  });

  // Build yearly rep stats with history overrides
  const yearlyRepStats = act.map((sp) => {
    let totalLeads = 0, totalSet = 0, totalKept = 0, totalSold = 0;
    MONTHS.forEach((_, mIdx) => {
      const mLeads = (yearlyLeads || []).filter((l) => l._month === mIdx && l.salesperson === sp.id);
      totalLeads += mLeads.length;
      totalSet += mLeads.filter((l) => l.apptDate).length;
      totalKept += mLeads.filter((l) => l.showed).length;
      totalSold += mLeads.filter((l) => l.sold).length;
      // Add history overrides
      const mData = yearlyMonthData?.[mIdx];
      const repHist = (mData?.ismRepHistory || []).find((r) => r.repId === sp.id);
      if (repHist) {
        totalLeads += repHist.leads || 0;
        totalSet += repHist.set || 0;
        totalKept += repHist.kept || 0;
        totalSold += repHist.sold || 0;
      }
    });
    return { ...sp, total: totalLeads, set: totalSet, kept: totalKept, sold: totalSold, closeRate: totalKept > 0 ? Math.round(totalSold / totalKept * 100) : 0 };
  }).sort((a, b) => b.sold - a.sold);

  const yearTotals = monthlySummary.reduce((acc, m) => ({ leads: acc.leads + m.leads, set: acc.set + m.set, kept: acc.kept + m.kept, sold: acc.sold + m.sold }), { leads: 0, set: 0, kept: 0, sold: 0 });

  const dailyTotal = dailyLeadCounts.reduce((s, d) => s + (d.count || 0), 0);
  const bulkTotal = bulkLeadCounts.reduce((s, d) => s + (d.count || 0), 0);
  const monthLeadTotal = dailyTotal + bulkTotal;

  const yearlyDailyTotals = MONTHS.map((mName, mIdx) => {
    const mData = yearlyMonthData?.[mIdx];
    const dlc = (mData?.dailyLeadCounts || []).reduce((s, d) => s + (d.count || 0), 0);
    const blc = (mData?.bulkLeadCounts || []).reduce((s, d) => s + (d.count || 0), 0);
    return dlc + blc;
  });
  const ytdDigitalLeads = yearlyDailyTotals.reduce((s, v) => s + v, 0);

  const sorted = leads.slice().sort((a, b) => (b.leadDate || '').localeCompare(a.leadDate || ''));

  function handleEdit(lead) {
    setEditingLead(lead);
    setModal('editLead');
  }

  function handleSaveEdit(updated) {
    const original = leads.find((l) => l.id === updated.id);
    const merged = { ...updated, showed: original?.showed || false, sold: original?.sold || false };
    Object.keys(merged).forEach((k) => {
      if (k !== 'id' && merged[k] !== original?.[k]) {
        updLead(merged.id, k, merged[k]);
      }
    });
    setEditingLead(null);
    setModal(null);
  }

  // ── Funnel editing ──
  function startFunnelEdit(mIdx) {
    if (mIdx === month) return; // Current month uses live data
    const mData = yearlyMonthData?.[mIdx];
    const hist = mData?.ismHistoryCounts || {};
    setEditingFunnel({ monthIdx: mIdx, leads: hist.leads || 0, set: hist.set || 0, kept: hist.kept || 0, sold: hist.sold || 0 });
  }

  async function saveFunnelEdit() {
    if (!editingFunnel || !saveHistoryMonth) return;
    await saveHistoryMonth(year, editingFunnel.monthIdx, {
      ismHistoryCounts: { leads: editingFunnel.leads, set: editingFunnel.set, kept: editingFunnel.kept, sold: editingFunnel.sold },
    });
    setEditingFunnel(null);
    if (reloadYear) await reloadYear();
  }

  // ── Rep history editing ──
  function startRepEdit(mIdx) {
    if (mIdx === month) return;
    const mData = yearlyMonthData?.[mIdx];
    const existing = mData?.ismRepHistory || [];
    const reps = {};
    act.forEach((sp) => {
      const r = existing.find((x) => x.repId === sp.id) || {};
      reps[sp.id] = { leads: r.leads || 0, set: r.set || 0, kept: r.kept || 0, sold: r.sold || 0 };
    });
    setEditingRepHistory({ monthIdx: mIdx, reps });
  }

  async function saveRepEdit() {
    if (!editingRepHistory || !saveHistoryMonth) return;
    const arr = Object.entries(editingRepHistory.reps).map(([repId, data]) => ({ repId, ...data }));
    await saveHistoryMonth(year, editingRepHistory.monthIdx, { ismRepHistory: arr });
    setEditingRepHistory(null);
    if (reloadYear) await reloadYear();
  }

  return (
    <div>
      {/* Header with button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 16px', fontFamily: FM, fontSize: 11, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 8, flex: 1, marginRight: 10 }}>
          Internet Sales appointment tracking — log appointments, track show rates and conversions.
        </div>
        <button onClick={() => setModal('addLead')} style={{ ...b1, background: '#2563eb', whiteSpace: 'nowrap' }}>+ NEW APPOINTMENT</button>
      </div>

      {/* Daily Lead Count Input */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ ...cH, background: '#f0f9ff', borderBottomColor: '#bae6fd' }}>
          <span style={{ color: '#0284c7' }}>DAILY INTERNET LEAD COUNT — {MONTHS[month].toUpperCase()}</span>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 14, flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 3 }}>DATE</label>
              <input type="date" id="dlc-date" defaultValue={new Date().toISOString().split('T')[0]} style={{ ...inp, width: 150 }} />
            </div>
            <div>
              <label style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 3 }}>LEADS RECEIVED</label>
              <input type="number" id="dlc-count" min="0" defaultValue="" placeholder="0" style={{ ...inp, width: 100, textAlign: 'center' }} />
            </div>
            <button onClick={() => {
              const dateEl = document.getElementById('dlc-date');
              const countEl = document.getElementById('dlc-count');
              const date = dateEl.value; const count = parseInt(countEl.value) || 0;
              if (!date || count <= 0) return;
              const existing = dailyLeadCounts.find((d) => d.date === date);
              let updated = existing ? dailyLeadCounts.map((d) => d.date === date ? { ...d, count } : d) : [...dailyLeadCounts, { date, count }];
              updated.sort((a, b) => a.date.localeCompare(b.date));
              saveDLC(updated); countEl.value = '';
            }} style={{ ...b1, background: '#0284c7', padding: '7px 16px' }}>LOG LEADS</button>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
            {[
              { label: 'DIGITAL LEADS', value: monthLeadTotal, color: '#0284c7' },
              { label: 'APPTS SET', value: ls.set, color: '#2563eb' },
              { label: 'APPTS KEPT', value: ls.kept, color: '#d97706' },
              { label: 'SOLD', value: ls.sold, color: '#16a34a' },
              { label: 'SET RATE', value: (monthLeadTotal > 0 ? Math.round(ls.set / monthLeadTotal * 100) : 0) + '%', color: '#0284c7' },
              { label: 'CLOSE RATE', value: (monthLeadTotal > 0 ? Math.round(ls.sold / monthLeadTotal * 100) : 0) + '%', color: '#16a34a' },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: 'center', minWidth: 70 }}>
                <div style={{ fontFamily: FH, fontSize: 24, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)', letterSpacing: 0.5, marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>
          {dailyLeadCounts.length > 0 && (
            <div style={{ overflow: 'auto', maxHeight: 200 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th style={{ ...TH, background: '#f0f9ff' }}>DATE</th><th style={{ ...TH, background: '#f0f9ff' }}>LEADS</th><th style={{ ...TH, background: '#f0f9ff', width: 40 }}></th></tr></thead>
                <tbody>
                  {dailyLeadCounts.slice().reverse().map((d) => (
                    <tr key={d.date}><td style={{ ...TD, fontFamily: FM, fontSize: 11 }}>{d.date}</td><td style={{ ...TD, fontFamily: FM, fontWeight: 700, color: '#0284c7' }}>{d.count}</td><td style={TD}><button onClick={() => saveDLC(dailyLeadCounts.filter((x) => x.date !== d.date))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>✕</button></td></tr>
                  ))}
                  <tr style={{ background: '#f0f9ff', borderTop: '2px solid #0284c7' }}><td style={{ ...TD, fontFamily: FH, fontWeight: 700, letterSpacing: 1, fontSize: 11 }}>TOTAL</td><td style={{ ...TD, fontFamily: FH, fontWeight: 700, color: '#0284c7', fontSize: 14 }}>{dailyTotal}</td><td style={TD}></td></tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ═══ APPOINTMENT LOG ═══ */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ ...cH, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#eff6ff', borderBottomColor: '#bfdbfe' }}>
          <span style={{ color: '#2563eb' }}>APPOINTMENT LOG — {MONTHS[month].toUpperCase()} {year}</span>
          <span style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)' }}>{leads.length} APPOINTMENT{leads.length !== 1 ? 'S' : ''}</span>
        </div>
        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Date', 'Customer', 'Unit Interested', 'Rep', 'Source', 'Appt Kept', 'Sold', ''].map((h) => (
                  <th key={h} style={{ ...TH, background: '#f8fafc' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 && (
                <tr><td colSpan={8} style={{ ...TD, padding: 50, textAlign: 'center', color: 'var(--text-muted)', fontFamily: FM, fontSize: 12 }}>
                  No appointments logged for {MONTHS[month]}. Click <strong style={{ color: '#2563eb' }}>+ NEW APPOINTMENT</strong> to get started.
                </td></tr>
              )}
              {sorted.map((l) => {
                const rep = spList.find((s) => s.id === l.salesperson);
                return (
                  <tr key={l.id} style={{ cursor: 'pointer' }} onClick={() => handleEdit(l)} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--row-hover)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ ...TD, fontFamily: FM, fontSize: 11 }}>{l.apptDate || l.leadDate || '—'}</td>
                    <td style={{ ...TD, fontWeight: 600 }}>{l.customer || '—'}</td>
                    <td style={{ ...TD, fontFamily: FM, fontSize: 11, color: 'var(--text-secondary)' }}>{l.unitInterested || '—'}</td>
                    <td style={TD}>{rep?.name?.split(' ')[0] || '—'}</td>
                    <td style={{ ...TD, fontFamily: FM, fontSize: 10, color: 'var(--text-muted)' }}>{l.source || '—'}</td>
                    <td style={{ ...TD, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <input type="checkbox" checked={!!l.showed} onChange={(e) => updLead(l.id, 'showed', e.target.checked)} />
                        <span style={{ fontFamily: FM, fontSize: 9, fontWeight: 700, color: l.showed ? '#d97706' : 'var(--text-muted)' }}>{l.showed ? 'YES' : ''}</span>
                      </label>
                    </td>
                    <td style={{ ...TD, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <input type="checkbox" checked={!!l.sold} onChange={(e) => updLead(l.id, 'sold', e.target.checked)} />
                        <span style={{ fontFamily: FM, fontSize: 9, fontWeight: 700, color: l.sold ? '#16a34a' : 'var(--text-muted)' }}>{l.sold ? 'YES' : ''}</span>
                      </label>
                    </td>
                    <td style={TD} onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => { if (confirm(`Delete appointment for ${l.customer || 'this customer'}?`)) delLead(l.id); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Stats */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <StatCard label="INTERNET LEADS" value={ls.total} sub="appointments set" />
        <StatCard label="APPTS KEPT" value={ls.kept} accent="#d97706" />
        <StatCard label="SOLD" value={ls.sold} accent="#16a34a" />
        <StatCard label="CLOSE RATE" value={(ls.kept > 0 ? Math.round(ls.sold / ls.kept * 100) : 0) + '%'} sub="kept → sold" accent="#2563eb" />
      </div>

      {/* Per-Rep Cards */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={cH}>SALESPERSON APPOINTMENT PERFORMANCE — {MONTHS[month].toUpperCase()}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 0 }}>
          {repLeadStats.map((r, idx) => (
            <div key={r.id} style={{ padding: '16px 18px', borderRight: idx < repLeadStats.length - 1 ? '1px solid var(--border-secondary)' : 'none', borderBottom: '1px solid var(--border-secondary)' }}>
              <div style={{ fontFamily: FH, fontSize: 14, fontWeight: 700, marginBottom: 10 }}>{r.name}</div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                {[{ v: r.set, l: 'SET', c: '#2563eb' }, { v: r.kept, l: 'SHOWED', c: '#d97706' }, { v: r.sold, l: 'SOLD', c: '#16a34a' }].map((s) => (
                  <div key={s.l} style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: FH, fontSize: 22, fontWeight: 700, color: s.c, lineHeight: 1 }}>{s.v}</div>
                    <div style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)', letterSpacing: 0.5, marginTop: 2 }}>{s.l}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1 }}><ProgressBar value={r.sold} max={Math.max(r.set, 1)} color={r.closeRate >= 60 ? '#16a34a' : r.closeRate >= 40 ? '#d97706' : '#b91c1c'} /></div>
                <span style={{ fontFamily: FM, fontSize: 11, fontWeight: 700, color: r.closeRate >= 60 ? '#16a34a' : r.closeRate >= 40 ? '#d97706' : '#b91c1c' }}>{r.closeRate}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-Rep Chart */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={cH}>APPOINTMENTS BY REP — {MONTHS[month].toUpperCase()}</div>
        <div style={{ padding: 16, height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={repLeadStats.map((r) => ({ name: r.name.split(' ')[0], Set: r.set, Showed: r.kept, Sold: r.sold }))} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: FM }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: FM }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-primary)', borderRadius: 6, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontFamily: FM, fontSize: 10 }} />
              <Bar dataKey="Set" fill="#2563eb" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Showed" fill="#d97706" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Sold" fill="#16a34a" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ═══ MONTHLY INTERNET SALES FUNNEL (Editable YTD) ═══ */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ ...cH, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>MONTHLY INTERNET SALES FUNNEL — {year}</span>
          <span style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)' }}>Click any past month to edit historical data</span>
        </div>
        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Month', 'Digital Leads', 'Appts Set', 'Appts Kept', 'Sold', 'Set %', 'Close %', ''].map((h) => <th key={h} style={TH}>{h}</th>)}</tr></thead>
            <tbody>
              {monthlySummary.map((m) => {
                const cr = m.kept > 0 ? Math.round(m.sold / m.kept * 100) : 0;
                const dl = yearlyDailyTotals[m.monthIdx] || 0;
                const totalDl = dl + (m.leads - ((yearlyLeads || []).filter((l) => l._month === m.monthIdx).length));
                const setRate = totalDl > 0 ? Math.round(m.set / totalDl * 100) : 0;
                const isEditing = editingFunnel?.monthIdx === m.monthIdx;
                const isCurrent = m.monthIdx === month;
                const canEdit = m.monthIdx <= month && !isCurrent;

                if (isEditing) {
                  return (
                    <tr key={m.month} style={{ background: '#fefce8' }}>
                      <td style={{ ...TD, fontFamily: FH, fontWeight: 700, color: '#d97706' }}>{m.month}</td>
                      <td style={{ ...TD, textAlign: 'center' }}><input type="number" min="0" value={editingFunnel.leads} onChange={(e) => setEditingFunnel({ ...editingFunnel, leads: parseInt(e.target.value) || 0 })} style={numInp} /></td>
                      <td style={{ ...TD, textAlign: 'center' }}><input type="number" min="0" value={editingFunnel.set} onChange={(e) => setEditingFunnel({ ...editingFunnel, set: parseInt(e.target.value) || 0 })} style={numInp} /></td>
                      <td style={{ ...TD, textAlign: 'center' }}><input type="number" min="0" value={editingFunnel.kept} onChange={(e) => setEditingFunnel({ ...editingFunnel, kept: parseInt(e.target.value) || 0 })} style={numInp} /></td>
                      <td style={{ ...TD, textAlign: 'center' }}><input type="number" min="0" value={editingFunnel.sold} onChange={(e) => setEditingFunnel({ ...editingFunnel, sold: parseInt(e.target.value) || 0 })} style={numInp} /></td>
                      <td style={TD}>—</td>
                      <td style={TD}>—</td>
                      <td style={{ ...TD, textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={saveFunnelEdit} style={{ ...b1, padding: '3px 10px', fontSize: 9 }}>SAVE</button>
                          <button onClick={() => setEditingFunnel(null)} style={{ background: 'none', border: '1px solid var(--border-primary)', borderRadius: 3, padding: '3px 8px', fontSize: 9, cursor: 'pointer', fontFamily: FM, color: 'var(--text-muted)' }}>X</button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={m.month} style={{ background: isCurrent ? 'var(--brand-red-soft)' : 'transparent', cursor: canEdit ? 'pointer' : 'default' }} onClick={() => canEdit && startFunnelEdit(m.monthIdx)} onMouseEnter={(e) => { if (canEdit) e.currentTarget.style.background = 'var(--row-hover)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = isCurrent ? 'var(--brand-red-soft)' : 'transparent'; }}>
                    <td style={{ ...TD, fontFamily: FH, fontWeight: isCurrent ? 700 : 500, color: isCurrent ? '#2563eb' : 'var(--text-primary)' }}>{m.month}</td>
                    <td style={{ ...TD, fontFamily: FM, fontWeight: 700, color: '#0284c7' }}>{m.leads || '—'}</td>
                    <td style={{ ...TD, fontFamily: FM }}>{m.set}</td>
                    <td style={{ ...TD, fontFamily: FM }}>{m.kept}</td>
                    <td style={{ ...TD, fontFamily: FM, fontWeight: 700, color: '#16a34a' }}>{m.sold}</td>
                    <td style={TD}><span style={{ fontFamily: FM, fontWeight: 700, color: setRate >= 15 ? '#16a34a' : setRate >= 10 ? '#d97706' : '#b91c1c' }}>{m.leads > 0 ? setRate + '%' : '—'}</span></td>
                    <td style={TD}><span style={{ fontFamily: FM, fontWeight: 700, color: cr >= 60 ? '#16a34a' : cr >= 40 ? '#d97706' : '#b91c1c' }}>{cr}%</span></td>
                    <td style={{ ...TD, fontFamily: FM, fontSize: 9, color: 'var(--text-muted)' }}>{canEdit ? 'edit' : ''}{m.hasHistory ? ' *' : ''}</td>
                  </tr>
                );
              })}
              <tr style={{ background: 'var(--bg-tertiary)', borderTop: '2px solid #2563eb' }}>
                <td style={{ ...TD, fontFamily: FH, fontWeight: 700, letterSpacing: 1 }}>YTD</td>
                <td style={{ ...TD, fontFamily: FH, fontWeight: 700, color: '#0284c7' }}>{yearTotals.leads}</td>
                <td style={{ ...TD, fontFamily: FM, fontWeight: 700 }}>{yearTotals.set}</td>
                <td style={{ ...TD, fontFamily: FM, fontWeight: 700 }}>{yearTotals.kept}</td>
                <td style={{ ...TD, fontFamily: FH, fontWeight: 700, color: '#16a34a' }}>{yearTotals.sold}</td>
                <td style={TD}><span style={{ fontFamily: FM, fontWeight: 700, color: '#2563eb' }}>{yearTotals.leads > 0 ? Math.round(yearTotals.set / yearTotals.leads * 100) : 0}%</span></td>
                <td style={TD}><span style={{ fontFamily: FM, fontWeight: 700, color: '#2563eb' }}>{yearTotals.kept > 0 ? Math.round(yearTotals.sold / yearTotals.kept * 100) : 0}%</span></td>
                <td style={TD}></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{ padding: '8px 16px', fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', borderTop: '1px solid var(--border-secondary)' }}>
          * = includes manually entered historical data. Current month uses live appointment entries.
        </div>
      </div>

      {/* ═══ YEARLY INTERNET SALES LEADERBOARD (Editable) ═══ */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ ...cH, background: '#fefce8', borderBottomColor: '#fde68a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#d97706' }}>🏆 {year} INTERNET SALES YEARLY LEADERBOARD</span>
          {!editingRepHistory && (
            <div style={{ display: 'flex', gap: 4 }}>
              {MONTHS.slice(0, month).map((mName, mIdx) => (
                <button key={mIdx} onClick={() => startRepEdit(mIdx)} style={{ padding: '3px 8px', borderRadius: 3, border: '1px solid var(--border-primary)', background: 'var(--card-bg)', fontFamily: FM, fontSize: 8, color: 'var(--text-muted)', cursor: 'pointer' }}>{mName.substring(0, 3).toUpperCase()}</button>
              ))}
            </div>
          )}
        </div>

        {/* Rep history edit panel */}
        {editingRepHistory && (
          <div style={{ background: '#fefce8', borderBottom: '2px solid #fde68a', padding: 16 }}>
            <div style={{ fontFamily: FH, fontSize: 12, fontWeight: 700, color: '#d97706', marginBottom: 10 }}>
              EDIT REP DATA — {MONTHS[editingRepHistory.monthIdx].toUpperCase()} {year}
            </div>
            <div style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', marginBottom: 10 }}>
              Enter historical counts per rep. These are added on top of any appointments already logged.
            </div>
            <div style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['Rep', 'Leads', 'Set', 'Showed', 'Sold'].map((h) => <th key={h} style={{ ...TH, background: '#fefce8' }}>{h}</th>)}</tr></thead>
                <tbody>
                  {act.map((sp) => {
                    const rd = editingRepHistory.reps[sp.id] || { leads: 0, set: 0, kept: 0, sold: 0 };
                    const upd = (k, v) => setEditingRepHistory({ ...editingRepHistory, reps: { ...editingRepHistory.reps, [sp.id]: { ...rd, [k]: parseInt(v) || 0 } } });
                    return (
                      <tr key={sp.id}>
                        <td style={{ ...TD, fontFamily: FH, fontWeight: 700 }}>{sp.name}</td>
                        <td style={{ ...TD, textAlign: 'center' }}><input type="number" min="0" value={rd.leads} onChange={(e) => upd('leads', e.target.value)} style={numInp} /></td>
                        <td style={{ ...TD, textAlign: 'center' }}><input type="number" min="0" value={rd.set} onChange={(e) => upd('set', e.target.value)} style={numInp} /></td>
                        <td style={{ ...TD, textAlign: 'center' }}><input type="number" min="0" value={rd.kept} onChange={(e) => upd('kept', e.target.value)} style={numInp} /></td>
                        <td style={{ ...TD, textAlign: 'center' }}><input type="number" min="0" value={rd.sold} onChange={(e) => upd('sold', e.target.value)} style={numInp} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
              <button onClick={() => setEditingRepHistory(null)} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 4, padding: '6px 14px', cursor: 'pointer', fontFamily: FM, fontSize: 10, color: 'var(--text-secondary)' }}>CANCEL</button>
              <button onClick={saveRepEdit} style={{ ...b1, background: '#d97706' }}>SAVE {MONTHS[editingRepHistory.monthIdx].toUpperCase()} DATA</button>
            </div>
          </div>
        )}

        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Rank', 'Salesperson', 'Leads', 'Set', 'Showed', 'Sold', 'Close %'].map((h) => <th key={h} style={{ ...TH, background: '#fefce8' }}>{h}</th>)}</tr></thead>
            <tbody>
              {yearlyRepStats.map((r, idx) => (
                <tr key={r.id}>
                  <td style={{ ...TD, fontFamily: FH, fontSize: 16, fontWeight: 700, color: idx === 0 ? '#d97706' : 'var(--text-muted)', textAlign: 'center', width: 50 }}>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : (idx + 1)}</td>
                  <td style={{ ...TD, fontFamily: FH, fontWeight: 700 }}>{r.name}</td>
                  <td style={{ ...TD, fontFamily: FM }}>{r.total}</td>
                  <td style={{ ...TD, fontFamily: FM }}>{r.set}</td>
                  <td style={{ ...TD, fontFamily: FM }}>{r.kept}</td>
                  <td style={{ ...TD, fontFamily: FH, fontWeight: 700, fontSize: 15, color: '#16a34a' }}>{r.sold}</td>
                  <td style={TD}><span style={{ fontFamily: FM, fontWeight: 700, color: r.closeRate >= 60 ? '#16a34a' : r.closeRate >= 40 ? '#d97706' : '#b91c1c' }}>{r.closeRate}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Appointment Modal */}
      <Modal open={modal === 'addLead'} onClose={() => setModal(null)} title="Log New Appointment">
        <LeadForm spList={act} onSave={addLead} onCancel={() => setModal(null)} />
      </Modal>

      {/* Edit Appointment Modal */}
      <Modal open={modal === 'editLead' && editingLead} onClose={() => { setEditingLead(null); setModal(null); }} title="Edit Appointment">
        {editingLead && (
          <LeadForm spList={act} onSave={handleSaveEdit} onCancel={() => { setEditingLead(null); setModal(null); }} editLead={editingLead} />
        )}
      </Modal>
    </div>
  );
}
