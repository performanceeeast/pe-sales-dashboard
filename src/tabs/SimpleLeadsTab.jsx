import React from 'react';
import { MONTHS } from '../lib/constants';
import { ProgressBar, StatCard, styles, FM, FH } from '../components/SharedUI';

const { card, cardHead: cH, input: inp, btn1: b1, th: TH, td: TD } = styles;

export default function SimpleLeadsTab({
  month, year, deals, act,
  dailyLeadCounts, saveDLC, floorDailyLeadCounts, saveFloorDLC,
}) {
  // Internet leads
  const internetTotal = (dailyLeadCounts || []).reduce((s, d) => s + (d.count || 0), 0);
  // Walk-in / Phone leads
  const floorTotal = (floorDailyLeadCounts || []).reduce((s, d) => s + (d.count || 0), 0);
  const totalLeads = internetTotal + floorTotal;
  const totalDeals = deals.length;
  const closeRate = totalLeads > 0 ? Math.round(totalDeals / totalLeads * 100) : 0;
  const internetCloseRate = internetTotal > 0 ? Math.round(totalDeals / (internetTotal + floorTotal) * 100) : 0;

  // Per-rep breakdown
  const repStats = act.map((sp) => {
    const repDeals = deals.filter((d) => d.salesperson === sp.id).length;
    const repFloor = (floorDailyLeadCounts || []).filter((d) => d.salesperson === sp.id).reduce((s, d) => s + (d.count || 0), 0);
    return { ...sp, deals: repDeals, floor: repFloor };
  }).sort((a, b) => b.deals - a.deals);

  return (
    <div>
      {/* Summary stats */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <StatCard label="INTERNET LEADS" value={internetTotal} accent="#0284c7" />
        <StatCard label="WALK-IN / PHONE" value={floorTotal} accent="#7c3aed" />
        <StatCard label="TOTAL LEADS" value={totalLeads} accent="#2563eb" />
        <StatCard label="DEALS CLOSED" value={totalDeals} accent="#16a34a" />
        <StatCard label="CLOSE RATE" value={closeRate + '%'} accent={closeRate >= 20 ? '#16a34a' : closeRate >= 10 ? '#d97706' : 'var(--brand-red)'} />
      </div>

      {/* Two-column input */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
        {/* Internet Leads */}
        <div style={{ ...card, flex: 1, minWidth: 280 }}>
          <div style={{ ...cH, background: '#f0f9ff', borderBottomColor: '#bae6fd' }}>
            <span style={{ color: '#0284c7' }}>INTERNET LEADS — {MONTHS[month].toUpperCase()}</span>
          </div>
          <div style={{ padding: 14 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 12, flexWrap: 'wrap' }}>
              <div>
                <label style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 3 }}>DATE</label>
                <input type="date" id="sl-inet-date" defaultValue={new Date().toISOString().split('T')[0]} style={{ ...inp, width: 140 }} />
              </div>
              <div>
                <label style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 3 }}>LEADS</label>
                <input type="number" id="sl-inet-count" min="0" placeholder="0" style={{ ...inp, width: 80, textAlign: 'center' }} />
              </div>
              <button onClick={() => {
                const date = document.getElementById('sl-inet-date').value;
                const count = parseInt(document.getElementById('sl-inet-count').value) || 0;
                if (!date || count <= 0) return;
                const existing = (dailyLeadCounts || []).find((d) => d.date === date);
                let updated = existing
                  ? dailyLeadCounts.map((d) => d.date === date ? { ...d, count } : d)
                  : [...(dailyLeadCounts || []), { date, count }];
                updated.sort((a, b) => a.date.localeCompare(b.date));
                saveDLC(updated);
                document.getElementById('sl-inet-count').value = '';
              }} style={{ ...b1, background: '#0284c7', padding: '7px 14px' }}>LOG</button>
            </div>

            {/* Internet lead entries */}
            {(dailyLeadCounts || []).length > 0 && (
              <div style={{ maxHeight: 200, overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><th style={{ ...TH, background: '#f0f9ff' }}>DATE</th><th style={{ ...TH, background: '#f0f9ff' }}>LEADS</th><th style={{ ...TH, background: '#f0f9ff', width: 30 }}></th></tr></thead>
                  <tbody>
                    {(dailyLeadCounts || []).slice().reverse().map((d) => (
                      <tr key={d.date}>
                        <td style={{ ...TD, fontFamily: FM, fontSize: 11 }}>{d.date}</td>
                        <td style={{ ...TD, fontFamily: FM, fontWeight: 700, color: '#0284c7' }}>{d.count}</td>
                        <td style={TD}><button onClick={() => saveDLC(dailyLeadCounts.filter((x) => x.date !== d.date))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>✕</button></td>
                      </tr>
                    ))}
                    <tr style={{ background: '#f0f9ff', borderTop: '2px solid #0284c7' }}>
                      <td style={{ ...TD, fontFamily: FH, fontWeight: 700, fontSize: 11 }}>TOTAL</td>
                      <td style={{ ...TD, fontFamily: FH, fontWeight: 700, color: '#0284c7', fontSize: 14 }}>{internetTotal}</td>
                      <td style={TD}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Walk-In / Phone Leads */}
        <div style={{ ...card, flex: 1, minWidth: 280 }}>
          <div style={{ ...cH, background: '#f5f3ff', borderBottomColor: '#ddd6fe' }}>
            <span style={{ color: '#7c3aed' }}>WALK-IN / PHONE — {MONTHS[month].toUpperCase()}</span>
          </div>
          <div style={{ padding: 14 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 12, flexWrap: 'wrap' }}>
              <div>
                <label style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 3 }}>DATE</label>
                <input type="date" id="sl-floor-date" defaultValue={new Date().toISOString().split('T')[0]} style={{ ...inp, width: 140 }} />
              </div>
              <div>
                <label style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 3 }}>SALESPERSON</label>
                <select id="sl-floor-sp" defaultValue="" style={{ ...inp, width: 130 }}>
                  <option value="">— All —</option>
                  {act.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 3 }}>LEADS</label>
                <input type="number" id="sl-floor-count" min="0" placeholder="0" style={{ ...inp, width: 80, textAlign: 'center' }} />
              </div>
              <button onClick={() => {
                const date = document.getElementById('sl-floor-date').value;
                const sp = document.getElementById('sl-floor-sp').value;
                const count = parseInt(document.getElementById('sl-floor-count').value) || 0;
                if (!date || count <= 0) return;
                const existing = (floorDailyLeadCounts || []).find((d) => d.date === date && (d.salesperson || '') === sp);
                let updated = existing
                  ? floorDailyLeadCounts.map((d) => (d.date === date && (d.salesperson || '') === sp) ? { ...d, count } : d)
                  : [...(floorDailyLeadCounts || []), { date, salesperson: sp || null, count }];
                updated.sort((a, b) => a.date.localeCompare(b.date));
                saveFloorDLC(updated);
                document.getElementById('sl-floor-count').value = '';
              }} style={{ ...b1, background: '#7c3aed', padding: '7px 14px' }}>LOG</button>
            </div>

            {/* Floor lead entries */}
            {(floorDailyLeadCounts || []).length > 0 && (
              <div style={{ maxHeight: 200, overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><th style={{ ...TH, background: '#f5f3ff' }}>DATE</th><th style={{ ...TH, background: '#f5f3ff' }}>REP</th><th style={{ ...TH, background: '#f5f3ff' }}>LEADS</th><th style={{ ...TH, background: '#f5f3ff', width: 30 }}></th></tr></thead>
                  <tbody>
                    {(floorDailyLeadCounts || []).slice().reverse().map((d, i) => {
                      const sp = d.salesperson ? act.find((s) => s.id === d.salesperson) : null;
                      return (
                        <tr key={d.date + (d.salesperson || '') + i}>
                          <td style={{ ...TD, fontFamily: FM, fontSize: 11 }}>{d.date}</td>
                          <td style={TD}>{sp ? sp.name.split(' ')[0] : <span style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)' }}>All</span>}</td>
                          <td style={{ ...TD, fontFamily: FM, fontWeight: 700, color: '#7c3aed' }}>{d.count}</td>
                          <td style={TD}><button onClick={() => saveFloorDLC(floorDailyLeadCounts.filter((x) => !(x.date === d.date && (x.salesperson || '') === (d.salesperson || ''))))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>✕</button></td>
                        </tr>
                      );
                    })}
                    <tr style={{ background: '#f5f3ff', borderTop: '2px solid #7c3aed' }}>
                      <td style={{ ...TD, fontFamily: FH, fontWeight: 700, fontSize: 11 }}>TOTAL</td>
                      <td style={TD}></td>
                      <td style={{ ...TD, fontFamily: FH, fontWeight: 700, color: '#7c3aed', fontSize: 14 }}>{floorTotal}</td>
                      <td style={TD}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Closing rate by lead type */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={cH}>CLOSING RATES BY LEAD TYPE — {MONTHS[month].toUpperCase()}</div>
        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 16 }}>
            {[
              { label: 'INTERNET', leads: internetTotal, color: '#0284c7' },
              { label: 'WALK-IN / PHONE', leads: floorTotal, color: '#7c3aed' },
              { label: 'COMBINED', leads: totalLeads, color: '#2563eb' },
            ].map((type) => {
              const rate = type.leads > 0 ? Math.round(totalDeals / type.leads * 100) : 0;
              return (
                <div key={type.label} style={{ flex: 1, minWidth: 150, padding: '14px 16px', background: 'var(--bg-tertiary)', borderRadius: 8 }}>
                  <div style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 8 }}>{type.label}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 }}>
                    <div>
                      <span style={{ fontFamily: FH, fontSize: 24, fontWeight: 700, color: type.color, lineHeight: 1 }}>{type.leads}</span>
                      <span style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)', marginLeft: 4 }}>leads</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontFamily: FH, fontSize: 20, fontWeight: 700, color: rate >= 20 ? '#16a34a' : rate >= 10 ? '#d97706' : 'var(--brand-red)', lineHeight: 1 }}>{rate}%</span>
                      <div style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)' }}>CLOSE RATE</div>
                    </div>
                  </div>
                  <ProgressBar value={totalDeals} max={Math.max(type.leads, 1)} color={rate >= 20 ? '#16a34a' : rate >= 10 ? '#d97706' : 'var(--brand-red)'} />
                  <div style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{totalDeals} deals from {type.leads} leads</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Per-rep breakdown */}
      <div style={card}>
        <div style={cH}>SALESPERSON BREAKDOWN — {MONTHS[month].toUpperCase()}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 0 }}>
          {repStats.map((r, idx) => (
            <div key={r.id} style={{ padding: '14px 16px', borderRight: idx < repStats.length - 1 ? '1px solid var(--border-secondary)' : 'none', borderBottom: '1px solid var(--border-secondary)', textAlign: 'center' }}>
              <div style={{ fontFamily: FH, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{r.name.split(' ')[0]}</div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 6 }}>
                <div>
                  <div style={{ fontFamily: FH, fontSize: 20, fontWeight: 700, color: '#7c3aed', lineHeight: 1 }}>{r.floor}</div>
                  <div style={{ fontFamily: FM, fontSize: 7, color: 'var(--text-muted)' }}>TRAFFIC</div>
                </div>
                <div>
                  <div style={{ fontFamily: FH, fontSize: 20, fontWeight: 700, color: '#16a34a', lineHeight: 1 }}>{r.deals}</div>
                  <div style={{ fontFamily: FM, fontSize: 7, color: 'var(--text-muted)' }}>DEALS</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
