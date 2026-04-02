import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { MONTHS, UNIT_TYPES, UNIT_COLORS } from '../lib/constants';
import { StatCard, styles, FM, FH } from '../components/SharedUI';

const { card, cardHead: cH, input: inp, btn1: b1, th: TH, td: TD } = styles;

export default function HistoryTab({ historyYear, historyData, historyLoading, loadHistory, currentYear, saveHistoryMonth }) {
  const compYears = [2022, 2023, 2024, 2025, 2026].filter((y) => y <= currentYear);
  const [editingMonth, setEditingMonth] = useState(null);
  const [editUnits, setEditUnits] = useState({});

  const hMonthData = MONTHS.map((mName, mIdx) => {
    const mData = historyData[mIdx];
    const counts = { month: mName.substring(0, 3), monthFull: mName, monthIdx: mIdx, ...Object.fromEntries(UNIT_TYPES.map((u) => [u, 0])), total: 0 };
    if (mData && mData.deals) {
      mData.deals.forEach((d) => UNIT_TYPES.forEach((u) => { counts[u] += d.units?.[u] || 0; }));
      counts.total = UNIT_TYPES.reduce((s, u) => s + counts[u], 0);
    }
    // Also check for manually entered history counts
    if (mData && mData.historyCounts) {
      UNIT_TYPES.forEach((u) => { counts[u] += mData.historyCounts[u] || 0; });
      counts.total = UNIT_TYPES.reduce((s, u) => s + counts[u], 0);
    }
    return counts;
  });
  const hTotal = { ...Object.fromEntries(UNIT_TYPES.map((u) => [u, 0])), total: 0 };
  hMonthData.forEach((m) => { UNIT_TYPES.forEach((u) => { hTotal[u] += m[u]; }); hTotal.total += m.total; });

  function startEdit(mIdx) {
    const mData = historyData[mIdx];
    const existing = (mData && mData.historyCounts) || {};
    setEditUnits(Object.fromEntries(UNIT_TYPES.map((u) => [u, existing[u] || 0])));
    setEditingMonth(mIdx);
  }

  function saveEdit() {
    if (editingMonth === null) return;
    saveHistoryMonth(historyYear, editingMonth, { historyCounts: editUnits });
    setEditingMonth(null);
    setEditUnits({});
    // Reload to reflect changes
    loadHistory(historyYear);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontFamily: FH, fontSize: 14, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>HISTORICAL DATA — {historyYear}</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {compYears.map((y) => (
            <button key={y} onClick={() => loadHistory(y)} style={{ padding: '6px 14px', borderRadius: 4, border: 'none', cursor: 'pointer', fontFamily: FH, fontSize: 11, fontWeight: 600, letterSpacing: 1, background: historyYear === y ? 'var(--brand-red)' : 'var(--bg-primary)', color: historyYear === y ? 'var(--text-inverse)' : 'var(--text-secondary)', transition: 'all .15s' }}>{y}</button>
          ))}
        </div>
      </div>
      {historyLoading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontFamily: FM, fontSize: 11 }}>LOADING {historyYear} DATA...</div>
      ) : (
        <div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            <StatCard label={historyYear + ' TOTAL'} value={hTotal.total} accent="var(--brand-red)" />
            {UNIT_TYPES.map((u) => <StatCard key={u} label={u} value={hTotal[u]} accent={UNIT_COLORS[u]} />)}
          </div>

          <div style={{ ...card, marginBottom: 16 }}>
            <div style={cH}>UNITS SOLD BY MONTH — {historyYear}</div>
            <div style={{ padding: 16, height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hMonthData} barCategoryGap="12%">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                  <XAxis dataKey="month" tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontFamily: FM }} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: FM }} />
                  <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-primary)', borderRadius: 6, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontFamily: FM, fontSize: 10 }} />
                  {UNIT_TYPES.map((u) => <Bar key={u} dataKey={u} stackId="a" fill={UNIT_COLORS[u]} />)}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Editable monthly table */}
          <div style={{ ...card, marginBottom: 16 }}>
            <div style={{ ...cH, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>MONTHLY BREAKDOWN — {historyYear}</span>
              <span style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)' }}>Click any month to add/edit historical data</span>
            </div>
            <div style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['Month', ...UNIT_TYPES, 'TOTAL', ''].map((h) => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                <tbody>
                  {hMonthData.map((m) => (
                    <tr key={m.month} style={{ cursor: 'pointer' }} onClick={() => startEdit(m.monthIdx)} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--row-hover)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ ...TD, fontFamily: FH, fontWeight: 500 }}>{m.monthFull}</td>
                      {UNIT_TYPES.map((u) => <td key={u} style={{ ...TD, fontFamily: FM, textAlign: 'center', color: m[u] > 0 ? UNIT_COLORS[u] : 'var(--border-primary)', fontWeight: 700 }}>{m[u]}</td>)}
                      <td style={{ ...TD, fontFamily: FH, fontWeight: 700, fontSize: 14, color: 'var(--brand-red)', textAlign: 'center' }}>{m.total}</td>
                      <td style={{ ...TD, fontFamily: FM, fontSize: 10, color: 'var(--text-muted)' }}>edit</td>
                    </tr>
                  ))}
                  <tr style={{ background: 'var(--bg-tertiary)', borderTop: '2px solid var(--brand-red)' }}>
                    <td style={{ ...TD, fontFamily: FH, fontWeight: 700, letterSpacing: 1 }}>TOTAL</td>
                    {UNIT_TYPES.map((u) => <td key={u} style={{ ...TD, fontFamily: FM, textAlign: 'center', fontWeight: 700, color: UNIT_COLORS[u] }}>{hTotal[u]}</td>)}
                    <td style={{ ...TD, fontFamily: FH, fontWeight: 700, fontSize: 16, color: 'var(--brand-red)', textAlign: 'center' }}>{hTotal.total}</td>
                    <td style={TD}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Edit modal inline */}
          {editingMonth !== null && (
            <div style={{ ...card, marginBottom: 16, border: '2px solid var(--brand-red)' }}>
              <div style={{ ...cH, background: '#fef2f2', borderBottomColor: '#fecaca' }}>
                <span style={{ color: 'var(--brand-red)' }}>EDIT HISTORICAL DATA — {MONTHS[editingMonth].toUpperCase()} {historyYear}</span>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)', marginBottom: 12 }}>
                  ENTER UNIT COUNTS FOR THIS MONTH. THESE ARE ADDED ON TOP OF ANY DEALS ALREADY LOGGED.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${UNIT_TYPES.length}, 1fr)`, gap: 10, marginBottom: 14 }}>
                  {UNIT_TYPES.map((u) => (
                    <div key={u} style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: FM, fontSize: 10, color: UNIT_COLORS[u], fontWeight: 700, marginBottom: 4 }}>{u}</div>
                      <input type="number" min="0" value={editUnits[u] || ''} onChange={(e) => setEditUnits({ ...editUnits, [u]: parseInt(e.target.value) || 0 })} style={{ ...inp, textAlign: 'center', fontSize: 14, fontWeight: 700, padding: '8px 4px' }} placeholder="0" />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => { setEditingMonth(null); setEditUnits({}); }} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 4, padding: '8px 16px', cursor: 'pointer', fontFamily: FM, fontSize: 11, color: 'var(--text-secondary)' }}>CANCEL</button>
                  <button onClick={saveEdit} style={b1}>SAVE {MONTHS[editingMonth].toUpperCase()} DATA</button>
                </div>
              </div>
            </div>
          )}

          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '12px 16px', fontFamily: FM, fontSize: 11, color: '#2563eb' }}>
            💡 Use this historical data to inform monthly goal decisions. Compare {historyYear} volumes with your current targets on the Goals & Spiffs tab.
          </div>
        </div>
      )}
    </div>
  );
}
