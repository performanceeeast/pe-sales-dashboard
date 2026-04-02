import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { MONTHS } from '../lib/constants';
import { ProgressBar, styles, FM, FH } from '../components/SharedUI';

const { card, cardHead: cH, input: inp, btn1: b1, th: TH, td: TD } = styles;

export default function TrafficLogTab({
  month, year, deals, act, spList,
  floorDailyLeadCounts, floorBulkLeadCounts,
  yearlyDeals, yearlyMonthData,
  saveFloorDLC, saveFloorBLC,
}) {
  const dailyTotal = floorDailyLeadCounts.reduce((s, d) => s + (d.count || 0), 0);
  const bulkTotal = floorBulkLeadCounts.reduce((s, d) => s + (d.count || 0), 0);
  const monthTraffic = dailyTotal + bulkTotal;
  const monthSold = deals.length;
  const closeRate = monthTraffic > 0 ? Math.round(monthSold / monthTraffic * 100) : 0;

  // Per-rep traffic from daily entries
  const repTraffic = {};
  act.forEach((sp) => { repTraffic[sp.id] = 0; });
  repTraffic['_unassigned'] = 0;
  floorDailyLeadCounts.forEach((d) => {
    if (d.salesperson && repTraffic[d.salesperson] !== undefined) repTraffic[d.salesperson] += d.count || 0;
    else repTraffic['_unassigned'] += d.count || 0;
  });

  // Per-rep deals
  const repStats = act.map((sp) => {
    const rd = deals.filter((d) => d.salesperson === sp.id);
    return { ...sp, traffic: repTraffic[sp.id] || 0, deals: rd.length, pct: monthSold > 0 ? Math.round(rd.length / monthSold * 100) : 0 };
  }).sort((a, b) => b.deals - a.deals);

  // Yearly monthly funnel
  const monthlySummary = MONTHS.map((mName, mIdx) => {
    const mData = yearlyMonthData[mIdx];
    const dlc = (mData && mData.floorDailyLeadCounts) ? mData.floorDailyLeadCounts.reduce((s, d) => s + (d.count || 0), 0) : 0;
    const blc = (mData && mData.floorBulkLeadCounts) ? mData.floorBulkLeadCounts.reduce((s, d) => s + (d.count || 0), 0) : 0;
    const traffic = dlc + blc;
    const mDeals = yearlyDeals.filter((d) => d._month === mIdx);
    return { month: mName.substring(0, 3).toUpperCase(), monthIdx: mIdx, traffic, deals: mDeals.length, closeRate: traffic > 0 ? Math.round(mDeals.length / traffic * 100) : 0 };
  }).filter((m) => m.traffic > 0 || m.deals > 0 || m.monthIdx <= month);

  const ytdTraffic = monthlySummary.reduce((s, m) => s + m.traffic, 0);
  const ytdDeals = yearlyDeals.length;
  const chartData = monthlySummary.map((m) => ({ name: m.month, Traffic: m.traffic, Deals: m.deals }));

  return (
    <div>
      <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 8, padding: '10px 16px', marginBottom: 14, fontFamily: FM, fontSize: 11, color: '#7c3aed', display: 'flex', alignItems: 'center', gap: 8 }}>
        📞 Total inbound traffic — phone calls, walk-ins, and all customer contacts. Deals entered on the Deals tab represent closed sales from this traffic.
      </div>

      {/* ── Daily Traffic Input ── */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ ...cH, background: '#f5f3ff', borderBottomColor: '#ddd6fe' }}>
          <span style={{ color: '#7c3aed' }}>📊 DAILY TRAFFIC COUNT — {MONTHS[month].toUpperCase()}</span>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 16, flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 3 }}>DATE</label>
              <input type="date" id="ftl-date" defaultValue={new Date().toISOString().split('T')[0]} style={{ ...inp, width: 140 }} />
            </div>
            <div>
              <label style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 3 }}>SALESPERSON</label>
              <select id="ftl-sp" defaultValue="" style={{ ...inp, width: 140 }}>
                <option value="">— All / Unassigned —</option>
                {act.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 3 }}>LEADS</label>
              <input type="number" id="ftl-count" min="0" defaultValue="" placeholder="0" style={{ ...inp, width: 80, textAlign: 'center' }} />
            </div>
            <button onClick={() => {
              const date = document.getElementById('ftl-date').value;
              const sp = document.getElementById('ftl-sp').value;
              const count = parseInt(document.getElementById('ftl-count').value) || 0;
              if (!date || count <= 0) return;
              const key = date + (sp ? ':' + sp : '');
              const existing = floorDailyLeadCounts.find((d) => d.date === date && (d.salesperson || '') === sp);
              let updated;
              if (existing) {
                updated = floorDailyLeadCounts.map((d) => (d.date === date && (d.salesperson || '') === sp) ? { ...d, count } : d);
              } else {
                updated = [...floorDailyLeadCounts, { date, salesperson: sp || null, count }];
              }
              updated.sort((a, b) => a.date.localeCompare(b.date));
              saveFloorDLC(updated);
              document.getElementById('ftl-count').value = '';
            }} style={{ ...b1, background: '#7c3aed', padding: '7px 16px' }}>LOG TRAFFIC</button>
          </div>

          {/* Funnel Stats */}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 16, padding: '16px', background: '#faf5ff', borderRadius: 8 }}>
            {[
              { label: 'TOTAL TRAFFIC', value: monthTraffic, color: '#7c3aed' },
              { label: 'DEALS CLOSED', value: monthSold, color: '#16a34a' },
              { label: 'CLOSE RATE', value: closeRate + '%', color: closeRate >= 20 ? '#16a34a' : closeRate >= 10 ? '#d97706' : '#b91c1c' },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: 'center', minWidth: 90 }}>
                <div style={{ fontFamily: FH, fontSize: 30, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)', letterSpacing: 0.5, marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
            <div style={{ flex: 1, minWidth: 150, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1 }}><ProgressBar value={monthSold} max={Math.max(monthTraffic, 1)} color={closeRate >= 20 ? '#16a34a' : closeRate >= 10 ? '#d97706' : '#b91c1c'} /></div>
              <span style={{ fontFamily: FM, fontSize: 11, fontWeight: 700, color: '#7c3aed' }}>{monthSold}/{monthTraffic}</span>
            </div>
          </div>

          {/* Daily entries table */}
          {floorDailyLeadCounts.length > 0 && (
            <div style={{ overflow: 'auto', maxHeight: 250 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={{ ...TH, background: '#f5f3ff' }}>DATE</th>
                  <th style={{ ...TH, background: '#f5f3ff' }}>SALESPERSON</th>
                  <th style={{ ...TH, background: '#f5f3ff' }}>TRAFFIC</th>
                  <th style={{ ...TH, background: '#f5f3ff', width: 40 }}></th>
                </tr></thead>
                <tbody>
                  {floorDailyLeadCounts.slice().reverse().map((d, i) => {
                    const sp = d.salesperson ? spList.find((s) => s.id === d.salesperson) : null;
                    return (
                      <tr key={d.date + ':' + (d.salesperson || '') + i}>
                        <td style={{ ...TD, fontFamily: FM, fontSize: 11 }}>{d.date}</td>
                        <td style={TD}>{sp ? sp.name.split(' ')[0] : <span style={{ color: 'var(--text-muted)', fontFamily: FM, fontSize: 10 }}>All</span>}</td>
                        <td style={{ ...TD, fontFamily: FM, fontWeight: 700, color: '#7c3aed' }}>{d.count}</td>
                        <td style={TD}><button onClick={() => saveFloorDLC(floorDailyLeadCounts.filter((x) => !(x.date === d.date && (x.salesperson || '') === (d.salesperson || ''))))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>✕</button></td>
                      </tr>
                    );
                  })}
                  <tr style={{ background: '#f5f3ff', borderTop: '2px solid #7c3aed' }}>
                    <td style={{ ...TD, fontFamily: FH, fontWeight: 700, letterSpacing: 1, fontSize: 11 }}>TOTAL</td>
                    <td style={TD}></td>
                    <td style={{ ...TD, fontFamily: FH, fontWeight: 700, color: '#7c3aed', fontSize: 14 }}>{dailyTotal}</td>
                    <td style={TD}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Per-Rep Traffic & Deals ── */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={cH}>SALESPERSON TRAFFIC & DEALS — {MONTHS[month].toUpperCase()}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 0 }}>
          {repStats.map((r, idx) => (
            <div key={r.id} style={{ padding: '14px 16px', borderRight: idx < repStats.length - 1 ? '1px solid var(--border-secondary)' : 'none', borderBottom: '1px solid var(--border-secondary)', textAlign: 'center' }}>
              <div style={{ fontFamily: FH, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{r.name.split(' ')[0]}</div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 6 }}>
                <div>
                  <div style={{ fontFamily: FH, fontSize: 20, fontWeight: 700, color: '#7c3aed', lineHeight: 1 }}>{r.traffic}</div>
                  <div style={{ fontFamily: FM, fontSize: 7, color: 'var(--text-muted)' }}>TRAFFIC</div>
                </div>
                <div>
                  <div style={{ fontFamily: FH, fontSize: 20, fontWeight: 700, color: '#16a34a', lineHeight: 1 }}>{r.deals}</div>
                  <div style={{ fontFamily: FM, fontSize: 7, color: 'var(--text-muted)' }}>DEALS</div>
                </div>
              </div>
              <div style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)' }}>{r.pct}% of deals</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Monthly Chart ── */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={cH}>TRAFFIC VS DEALS BY MONTH — {year}</div>
        <div style={{ padding: 16, height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontFamily: FM }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: FM }} />
              <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-primary)', borderRadius: 6, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontFamily: FM, fontSize: 10 }} />
              <Bar dataKey="Traffic" fill="#7c3aed" radius={[3, 3, 0, 0]} opacity={0.6} />
              <Bar dataKey="Deals" fill="#16a34a" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Monthly Funnel Table ── */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={cH}>MONTHLY TRAFFIC FUNNEL — {year}</div>
        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Month', 'Total Traffic', 'Deals Closed', 'Close Rate'].map((h) => <th key={h} style={TH}>{h}</th>)}</tr></thead>
            <tbody>
              {monthlySummary.map((m) => (
                <tr key={m.month} style={{ background: m.monthIdx === month ? 'var(--brand-red-soft)' : 'transparent' }}>
                  <td style={{ ...TD, fontFamily: FH, fontWeight: m.monthIdx === month ? 700 : 500, color: m.monthIdx === month ? '#7c3aed' : 'var(--text-primary)' }}>{m.month}</td>
                  <td style={{ ...TD, fontFamily: FM, fontWeight: 700, color: '#7c3aed' }}>{m.traffic || '—'}</td>
                  <td style={{ ...TD, fontFamily: FM, fontWeight: 700, color: '#16a34a' }}>{m.deals}</td>
                  <td style={TD}><span style={{ fontFamily: FM, fontWeight: 700, color: m.closeRate >= 20 ? '#16a34a' : m.closeRate >= 10 ? '#d97706' : '#b91c1c' }}>{m.traffic > 0 ? m.closeRate + '%' : '—'}</span></td>
                </tr>
              ))}
              <tr style={{ background: 'var(--bg-tertiary)', borderTop: '2px solid #7c3aed' }}>
                <td style={{ ...TD, fontFamily: FH, fontWeight: 700, letterSpacing: 1 }}>YTD</td>
                <td style={{ ...TD, fontFamily: FH, fontWeight: 700, color: '#7c3aed' }}>{ytdTraffic}</td>
                <td style={{ ...TD, fontFamily: FH, fontWeight: 700, color: '#16a34a' }}>{ytdDeals}</td>
                <td style={TD}><span style={{ fontFamily: FM, fontWeight: 700, color: '#7c3aed' }}>{ytdTraffic > 0 ? Math.round(ytdDeals / ytdTraffic * 100) : 0}%</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Historical Backfill ── */}
      <div style={card}>
        <div style={{ ...cH, background: '#fefce8', borderBottomColor: '#fde68a' }}>
          <span style={{ color: '#d97706' }}>📁 HISTORICAL TRAFFIC ENTRY</span>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)', marginBottom: 12 }}>BACKFILL PREVIOUS MONTHS WITH TOTAL TRAFFIC COUNTS. SWITCH MONTH VIA HEADER DROPDOWN.</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 14, flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 3 }}>LABEL</label>
              <input type="text" id="fblc-label" defaultValue={MONTHS[month] + ' ' + year} style={{ ...inp, width: 180 }} />
            </div>
            <div>
              <label style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 3 }}>TOTAL TRAFFIC</label>
              <input type="number" id="fblc-count" min="0" defaultValue="" placeholder="250" style={{ ...inp, width: 100, textAlign: 'center' }} />
            </div>
            <button onClick={() => {
              const label = document.getElementById('fblc-label').value.trim();
              const count = parseInt(document.getElementById('fblc-count').value) || 0;
              if (!label || count <= 0) return;
              saveFloorBLC([...floorBulkLeadCounts, { id: Date.now().toString(), label, count }]);
              document.getElementById('fblc-count').value = '';
            }} style={{ ...b1, background: '#d97706', padding: '7px 16px' }}>ADD ENTRY</button>
          </div>
          {floorBulkLeadCounts.length > 0 && floorBulkLeadCounts.map((b) => (
            <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-secondary)' }}>
              <span style={{ fontFamily: FH, fontSize: 12, fontWeight: 600 }}>{b.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: FM, fontWeight: 700, color: '#d97706' }}>{b.count} traffic</span>
                <button onClick={() => saveFloorBLC(floorBulkLeadCounts.filter((x) => x.id !== b.id))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
