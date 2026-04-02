import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { MONTHS } from '../lib/constants';
import { ProgressBar, StatCard, styles, FM, FH } from '../components/SharedUI';

const { card, cardHead: cH, input: inp, btn1: b1, th: TH, td: TD } = styles;

export default function ISMLeadsTab({
  month, year, leads, spList, act, ls,
  dailyLeadCounts, bulkLeadCounts, yearlyLeads, yearlyMonthData,
  saveDLC, saveBLC,
}) {
  const repLeadStats = act.map((sp) => {
    const rl = leads.filter((l) => l.salesperson === sp.id);
    const set = rl.filter((l) => l.apptDate).length;
    const kept = rl.filter((l) => l.showed).length;
    const sold = rl.filter((l) => l.sold).length;
    return { ...sp, set, kept, sold, closeRate: kept > 0 ? Math.round(sold / kept * 100) : 0, total: rl.length };
  }).sort((a, b) => b.sold - a.sold);

  const monthlySummary = MONTHS.map((mName, mIdx) => {
    const mLeads = yearlyLeads.filter((l) => l._month === mIdx);
    return { month: mName.substring(0, 3).toUpperCase(), monthIdx: mIdx, leads: mLeads.length, set: mLeads.filter((l) => l.apptDate).length, kept: mLeads.filter((l) => l.showed).length, sold: mLeads.filter((l) => l.sold).length };
  }).filter((m) => m.leads > 0 || m.monthIdx <= month);

  const yearlyRepStats = act.map((sp) => {
    const rl = yearlyLeads.filter((l) => l.salesperson === sp.id);
    const kept = rl.filter((l) => l.showed).length;
    const sold = rl.filter((l) => l.sold).length;
    return { ...sp, set: rl.filter((l) => l.apptDate).length, kept, sold, closeRate: kept > 0 ? Math.round(sold / kept * 100) : 0, total: rl.length };
  }).sort((a, b) => b.sold - a.sold);

  const yearTotals = { leads: yearlyLeads.length, set: yearlyLeads.filter((l) => l.apptDate).length, kept: yearlyLeads.filter((l) => l.showed).length, sold: yearlyLeads.filter((l) => l.sold).length };

  const dailyTotal = dailyLeadCounts.reduce((s, d) => s + (d.count || 0), 0);
  const bulkTotal = bulkLeadCounts.reduce((s, d) => s + (d.count || 0), 0);
  const monthLeadTotal = dailyTotal + bulkTotal;

  const yearlyDailyTotals = MONTHS.map((mName, mIdx) => {
    const mData = yearlyMonthData[mIdx];
    const dlc = (mData && mData.dailyLeadCounts) ? mData.dailyLeadCounts.reduce((s, d) => s + (d.count || 0), 0) : 0;
    const blc = (mData && mData.bulkLeadCounts) ? mData.bulkLeadCounts.reduce((s, d) => s + (d.count || 0), 0) : 0;
    return dlc + blc;
  });
  const ytdDigitalLeads = yearlyDailyTotals.reduce((s, v) => s + v, 0);

  return (
    <div>
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 16px', marginBottom: 14, fontFamily: FM, fontSize: 11, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 8 }}>
        📋 All entries = ISM appointment-set conversions handed off to assigned salesperson.
      </div>

      {/* Daily Lead Count Input */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ ...cH, background: '#f0f9ff', borderBottomColor: '#bae6fd' }}>
          <span style={{ color: '#0284c7' }}>📊 DAILY INTERNET LEAD COUNT — {MONTHS[month].toUpperCase()}</span>
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

      {/* Monthly Stats */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <StatCard label="ISM LEADS" value={ls.total} sub="appointments set" />
        <StatCard label="APPTS KEPT" value={ls.kept} accent="#d97706" />
        <StatCard label="SOLD" value={ls.sold} accent="#16a34a" />
        <StatCard label="ISM CLOSE RATE" value={(ls.kept > 0 ? Math.round(ls.sold / ls.kept * 100) : 0) + '%'} sub="kept → sold" accent="#2563eb" />
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

      {/* Monthly ISM Funnel */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={cH}>MONTHLY ISM FUNNEL — {year}</div>
        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Month', 'Digital Leads', 'Appts Set', 'Appts Kept', 'Sold', 'Set %', 'Close %'].map((h) => <th key={h} style={TH}>{h}</th>)}</tr></thead>
            <tbody>
              {monthlySummary.map((m) => {
                const cr = m.kept > 0 ? Math.round(m.sold / m.kept * 100) : 0;
                const dl = yearlyDailyTotals[m.monthIdx] || 0;
                const setRate = dl > 0 ? Math.round(m.set / dl * 100) : 0;
                return (
                  <tr key={m.month} style={{ background: m.monthIdx === month ? 'var(--brand-red-soft)' : 'transparent' }}>
                    <td style={{ ...TD, fontFamily: FH, fontWeight: m.monthIdx === month ? 700 : 500, color: m.monthIdx === month ? '#2563eb' : 'var(--text-primary)' }}>{m.month}</td>
                    <td style={{ ...TD, fontFamily: FM, fontWeight: 700, color: '#0284c7' }}>{dl || '—'}</td>
                    <td style={{ ...TD, fontFamily: FM }}>{m.set}</td>
                    <td style={{ ...TD, fontFamily: FM }}>{m.kept}</td>
                    <td style={{ ...TD, fontFamily: FM, fontWeight: 700, color: '#16a34a' }}>{m.sold}</td>
                    <td style={TD}><span style={{ fontFamily: FM, fontWeight: 700, color: setRate >= 15 ? '#16a34a' : setRate >= 10 ? '#d97706' : '#b91c1c' }}>{dl > 0 ? setRate + '%' : '—'}</span></td>
                    <td style={TD}><span style={{ fontFamily: FM, fontWeight: 700, color: cr >= 60 ? '#16a34a' : cr >= 40 ? '#d97706' : '#b91c1c' }}>{cr}%</span></td>
                  </tr>
                );
              })}
              {monthlySummary.length > 1 && (
                <tr style={{ background: 'var(--bg-tertiary)', borderTop: '2px solid #2563eb' }}>
                  <td style={{ ...TD, fontFamily: FH, fontWeight: 700, letterSpacing: 1 }}>YTD</td>
                  <td style={{ ...TD, fontFamily: FH, fontWeight: 700, color: '#0284c7' }}>{ytdDigitalLeads}</td>
                  <td style={{ ...TD, fontFamily: FM, fontWeight: 700 }}>{yearTotals.set}</td>
                  <td style={{ ...TD, fontFamily: FM, fontWeight: 700 }}>{yearTotals.kept}</td>
                  <td style={{ ...TD, fontFamily: FH, fontWeight: 700, color: '#16a34a' }}>{yearTotals.sold}</td>
                  <td style={TD}><span style={{ fontFamily: FM, fontWeight: 700, color: '#2563eb' }}>{ytdDigitalLeads > 0 ? Math.round(yearTotals.set / ytdDigitalLeads * 100) : 0}%</span></td>
                  <td style={TD}><span style={{ fontFamily: FM, fontWeight: 700, color: '#2563eb' }}>{yearTotals.kept > 0 ? Math.round(yearTotals.sold / yearTotals.kept * 100) : 0}%</span></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Yearly ISM Leaderboard */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ ...cH, background: '#fefce8', borderBottomColor: '#fde68a' }}><span style={{ color: '#d97706' }}>🏆 {year} ISM YEARLY LEADERBOARD</span></div>
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

      {/* Historical Lead Entry */}
      <div style={{ ...card }}>
        <div style={{ ...cH, background: '#fefce8', borderBottomColor: '#fde68a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#d97706' }}>📁 HISTORICAL LEAD ENTRY — {MONTHS[month].toUpperCase()}</span>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.6 }}>
            BACKFILL PREVIOUS MONTHS WITH TOTAL LEAD COUNTS. SWITCH MONTH VIA HEADER DROPDOWN.
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 14, flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 3 }}>LABEL / DATE RANGE</label>
              <input type="text" id="blc-label" defaultValue={MONTHS[month] + ' ' + year} placeholder="e.g. Jan 1-31" style={{ ...inp, width: 180 }} />
            </div>
            <div>
              <label style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 3 }}>TOTAL LEADS</label>
              <input type="number" id="blc-count" min="0" defaultValue="" placeholder="144" style={{ ...inp, width: 100, textAlign: 'center' }} />
            </div>
            <button onClick={() => {
              const labelEl = document.getElementById('blc-label');
              const countEl = document.getElementById('blc-count');
              const label = labelEl.value.trim(); const count = parseInt(countEl.value) || 0;
              if (!label || count <= 0) return;
              saveBLC([...bulkLeadCounts, { id: Date.now().toString(), label, count }]);
              countEl.value = '';
            }} style={{ ...b1, background: '#d97706', padding: '7px 16px' }}>ADD ENTRY</button>
          </div>
          {bulkLeadCounts.length > 0 && (
            <div>
              {bulkLeadCounts.map((b) => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-secondary)' }}>
                  <span style={{ fontFamily: FH, fontSize: 12, fontWeight: 600 }}>{b.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: FM, fontWeight: 700, color: '#d97706', fontSize: 14 }}>{b.count} leads</span>
                    <button onClick={() => saveBLC(bulkLeadCounts.filter((x) => x.id !== b.id))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>✕</button>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '2px solid #d97706', marginTop: 4 }}>
                <span style={{ fontFamily: FH, fontWeight: 700, fontSize: 11, letterSpacing: 1 }}>BULK TOTAL</span>
                <span style={{ fontFamily: FH, fontWeight: 700, color: '#d97706', fontSize: 14 }}>{bulkTotal}</span>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
