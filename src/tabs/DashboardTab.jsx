import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { MONTHS, UNIT_TYPES, UNIT_COLORS, STAR_CHECKLIST } from '../lib/constants';
import { ProgressBar, StatCard, styles, FM, FH } from '../components/SharedUI';

const { card, cardHead: cH, input: inp, btn1: b1, btn2: b2, th: TH, td: TD } = styles;

export default function DashboardTab({
  month, year, goals, tot, tTgt, tStr,
  ls, floorTrafficStats, yearlyMonthSales, ytdTotal, yearlyRepPerf,
  notes, saveNotes, meetingNotes, saveMeetingNotes,
  deals, currentUser, act, updateDeal,
}) {
  const [noteTitle, setNoteTitle] = useState('');
  const [noteText, setNoteText] = useState('');
  const [mtgDate, setMtgDate] = useState(new Date().toISOString().split('T')[0]);
  const [mtgText, setMtgText] = useState('');

  // Combined leads
  const combinedLeads = (ls.total || 0) + (floorTrafficStats.total || 0);
  const combinedSold = (ls.sold || 0) + (floorTrafficStats.sold || 0);

  return (
    <div>
      {/* ── NOTES / BULLETIN BOARD ── */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
        {/* Sticky Notes */}
        <div style={{ ...card, flex: 1, minWidth: 300 }}>
          <div style={{ ...cH, background: '#fefce8', borderBottomColor: '#fde68a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#d97706' }}>📌 BULLETIN BOARD</span>
          </div>
          <div style={{ padding: 14 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} style={{ ...inp, flex: 1, minWidth: 100 }} placeholder="Title" />
              <input value={noteText} onChange={(e) => setNoteText(e.target.value)} style={{ ...inp, flex: 2, minWidth: 150 }} placeholder="Note..." onKeyDown={(e) => {
                if (e.key === 'Enter' && noteText.trim()) {
                  saveNotes([...notes, { id: Date.now().toString(), title: noteTitle.trim(), text: noteText.trim(), pinned: false }]);
                  setNoteTitle(''); setNoteText('');
                }
              }} />
              <button onClick={() => {
                if (!noteText.trim()) return;
                saveNotes([...notes, { id: Date.now().toString(), title: noteTitle.trim(), text: noteText.trim(), pinned: false }]);
                setNoteTitle(''); setNoteText('');
              }} style={{ ...b1, background: '#d97706', padding: '6px 12px', fontSize: 10 }}>PIN</button>
            </div>
            {notes.length === 0 && <div style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', padding: 8 }}>No notes pinned</div>}
            {notes.map((n) => (
              <div key={n.id} style={{ background: '#fefce8', borderRadius: 6, padding: '8px 12px', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div>
                  {n.title && <div style={{ fontFamily: FH, fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{n.title}</div>}
                  <div style={{ fontFamily: FM, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{n.text}</div>
                </div>
                <button onClick={() => saveNotes(notes.filter((x) => x.id !== n.id))} style={{ background: 'none', border: 'none', color: '#d97706', cursor: 'pointer', fontSize: 12, flexShrink: 0 }}>✕</button>
              </div>
            ))}
          </div>
        </div>

        {/* Meeting Notes */}
        <div style={{ ...card, flex: 1, minWidth: 300 }}>
          <div style={{ ...cH, background: '#f0fdf4', borderBottomColor: '#bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#16a34a' }}>📋 SALES MEETING NOTES</span>
          </div>
          <div style={{ padding: 14 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <input type="date" value={mtgDate} onChange={(e) => setMtgDate(e.target.value)} style={{ ...inp, width: 140 }} />
              <input value={mtgText} onChange={(e) => setMtgText(e.target.value)} style={{ ...inp, flex: 1, minWidth: 150 }} placeholder="Meeting notes..." onKeyDown={(e) => {
                if (e.key === 'Enter' && mtgText.trim()) {
                  saveMeetingNotes([{ id: Date.now().toString(), date: mtgDate, text: mtgText.trim() }, ...meetingNotes]);
                  setMtgText('');
                }
              }} />
              <button onClick={() => {
                if (!mtgText.trim()) return;
                saveMeetingNotes([{ id: Date.now().toString(), date: mtgDate, text: mtgText.trim() }, ...meetingNotes]);
                setMtgText('');
              }} style={{ ...b1, background: '#16a34a', padding: '6px 12px', fontSize: 10 }}>ADD</button>
            </div>
            <div style={{ maxHeight: 160, overflow: 'auto' }}>
              {meetingNotes.length === 0 && <div style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', padding: 8 }}>No meeting notes</div>}
              {meetingNotes.map((n) => (
                <div key={n.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--border-secondary)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)', flexShrink: 0, width: 70 }}>{n.date}</span>
                  <span style={{ fontFamily: FM, fontSize: 11, color: 'var(--text-primary)', flex: 1, lineHeight: 1.4 }}>{n.text}</span>
                  <button onClick={() => saveMeetingNotes(meetingNotes.filter((x) => x.id !== n.id))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, flexShrink: 0 }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── PENDING FOLLOW-UPS & DELIVERY TASKS ── */}
      {deals && currentUser && (() => {
        const isManager = currentUser.role === 'admin' || currentUser.role === 'gsm';
        const relevantDeals = isManager ? deals : deals.filter((d) => d.salesperson === currentUser.id);
        const today = new Date().toISOString().split('T')[0];

        // Find deals with incomplete checklist items
        const pendingTasks = [];
        relevantDeals.forEach((d) => {
          const sc = d.starChecklist || {};
          const repName = (act || []).find((a) => a.id === d.salesperson)?.name?.split(' ')[0] || '';

          STAR_CHECKLIST.forEach((item) => {
            if (sc[item.id]) return; // already done

            // For deferred items (7-day follow-up), check if due date has arrived
            if (item.deferred) {
              const dealDate = new Date(d.date);
              const dueDate = new Date(dealDate);
              dueDate.setDate(dueDate.getDate() + 7);
              const dueDateStr = dueDate.toISOString().split('T')[0];
              const isOverdue = dueDateStr <= today;
              const isDueSoon = !isOverdue && dueDateStr <= new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];
              pendingTasks.push({
                dealId: d.id, customer: d.customer || 'Unknown', rep: repName, task: item.label,
                itemId: item.id, dueDate: dueDateStr, isOverdue, isDueSoon, deferred: true,
                requiresSignoff: item.requiresSignoff,
              });
            } else if (item.requiresSignoff && !d.signoffs?.[item.id]) {
              // Signoff required but not done
              pendingTasks.push({
                dealId: d.id, customer: d.customer || 'Unknown', rep: repName, task: item.label + ' (needs signoff)',
                itemId: item.id, isOverdue: true, requiresSignoff: true,
              });
            } else if (!item.deferred) {
              pendingTasks.push({
                dealId: d.id, customer: d.customer || 'Unknown', rep: repName, task: item.label,
                itemId: item.id, isOverdue: false,
              });
            }
          });
        });

        // Sort: overdue first, then due soon, then others
        pendingTasks.sort((a, b) => (b.isOverdue ? 1 : 0) - (a.isOverdue ? 1 : 0) || (b.isDueSoon ? 1 : 0) - (a.isDueSoon ? 1 : 0));

        if (pendingTasks.length === 0) return null;

        const overdueCount = pendingTasks.filter((t) => t.isOverdue).length;

        return (
          <div style={{ ...card, marginBottom: 16, border: overdueCount > 0 ? '2px solid #fecaca' : '1px solid var(--border-primary)' }}>
            <div style={{
              ...cH,
              background: overdueCount > 0 ? '#fef2f2' : '#eff6ff',
              borderBottomColor: overdueCount > 0 ? '#fecaca' : '#bfdbfe',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ color: overdueCount > 0 ? '#b91c1c' : '#2563eb' }}>
                {overdueCount > 0 ? '\u26A0\uFE0F' : '\uD83D\uDCCB'} PENDING DELIVERY TASKS ({pendingTasks.length})
              </span>
              {overdueCount > 0 && (
                <span style={{ fontFamily: FM, fontSize: 9, fontWeight: 700, color: '#b91c1c', background: '#fecaca', padding: '2px 8px', borderRadius: 3 }}>
                  {overdueCount} OVERDUE
                </span>
              )}
            </div>
            <div style={{ maxHeight: 300, overflow: 'auto' }}>
              {pendingTasks.slice(0, 20).map((t, i) => (
                <div key={t.dealId + t.itemId} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                  borderBottom: '1px solid var(--border-secondary)',
                  background: t.isOverdue ? '#fef2f2' : t.isDueSoon ? '#fffbeb' : 'transparent',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: FM, fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {t.customer} {isManager && t.rep ? <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({t.rep})</span> : ''}
                    </div>
                    <div style={{ fontFamily: FM, fontSize: 10, color: t.isOverdue ? '#b91c1c' : t.isDueSoon ? '#d97706' : 'var(--text-secondary)', marginTop: 1 }}>
                      {t.task}
                      {t.dueDate && <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>Due: {t.dueDate}</span>}
                    </div>
                  </div>
                  {!t.requiresSignoff && !t.deferred && (
                    <button onClick={() => {
                      const deal = deals.find((d) => d.id === t.dealId);
                      if (deal) updateDeal(deal.id, { ...deal, starChecklist: { ...(deal.starChecklist || {}), [t.itemId]: true } });
                    }} style={{ ...b1, background: '#16a34a', padding: '4px 12px', fontSize: 9, flexShrink: 0 }}>DONE</button>
                  )}
                  {t.deferred && t.isOverdue && (
                    <button onClick={() => {
                      const deal = deals.find((d) => d.id === t.dealId);
                      if (deal) updateDeal(deal.id, { ...deal, starChecklist: { ...(deal.starChecklist || {}), [t.itemId]: true } });
                    }} style={{ ...b1, background: '#16a34a', padding: '4px 12px', fontSize: 9, flexShrink: 0 }}>COMPLETED</button>
                  )}
                  {t.deferred && !t.isOverdue && (
                    <span style={{ fontFamily: FM, fontSize: 9, color: '#d97706', fontWeight: 600, flexShrink: 0 }}>
                      {t.isDueSoon ? 'DUE SOON' : 'UPCOMING'}
                    </span>
                  )}
                </div>
              ))}
              {pendingTasks.length > 20 && (
                <div style={{ padding: '8px 16px', fontFamily: FM, fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>
                  + {pendingTasks.length - 20} more tasks
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── COMBINED STATS ── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <StatCard label="UNITS SOLD" value={tot.total} sub={'of ' + tTgt + ' target'} />
        <StatCard label="% TO GOAL" value={Math.round(tTgt > 0 ? tot.total / tTgt * 100 : 0) + '%'} sub={'stretch: ' + tStr} accent={tot.total >= tTgt ? '#16a34a' : '#b91c1c'} />
        <StatCard label="ALL LEADS" value={combinedLeads} sub={combinedSold + ' deals closed'} accent="#0284c7" />
        <StatCard label="ISM LEADS" value={ls.total} sub={ls.sold + ' sold'} accent="#2563eb" />
        <StatCard label="FLOOR TRAFFIC" value={floorTrafficStats.total} sub={floorTrafficStats.sold + ' deals'} accent="#7c3aed" />
      </div>

      {/* ── GOAL PROGRESS ── */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={cH}>GOAL PROGRESS — {MONTHS[month].toUpperCase()}</div>
        <div style={{ padding: 16 }}>
          {UNIT_TYPES.map((u) => {
            const g = goals[u] || {}; const pct = g.target > 0 ? (tot[u] / g.target * 100) : 0;
            return (
              <div key={u} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 60, fontFamily: FM, fontSize: 11, fontWeight: 700, color: UNIT_COLORS[u], textAlign: 'right' }}>{u}</div>
                <div style={{ flex: 1 }}><ProgressBar value={tot[u]} max={g.target || 1} color={UNIT_COLORS[u]} /></div>
                <div style={{ width: 100, fontFamily: FM, fontSize: 11, color: 'var(--text-secondary)' }}>
                  <span style={{ fontWeight: 700, color: pct >= 100 ? '#16a34a' : 'var(--text-primary)' }}>{tot[u]}</span>/{g.target} ({pct.toFixed(0)}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CHART ── */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={cH}>ACTUAL VS TARGET — {MONTHS[month].toUpperCase()}</div>
        <div style={{ padding: 16, height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={UNIT_TYPES.map((u) => ({ name: u, Target: goals[u]?.target || 0, Actual: tot[u], Stretch: goals[u]?.stretch || 0 }))} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: FM }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: FM }} />
              <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-primary)', borderRadius: 6, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontFamily: FM, fontSize: 10 }} />
              <Bar dataKey="Target" fill="var(--text-muted)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Actual" fill="var(--brand-red)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Stretch" fill="#16a34a" radius={[3, 3, 0, 0]} opacity={0.3} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── YEARLY SECTION ── */}
      <div style={{ fontFamily: FH, fontSize: 14, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 12, marginTop: 24, borderTop: '2px solid var(--border-primary)', paddingTop: 16 }}>
        {year} YEAR-TO-DATE
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <StatCard label="YTD UNITS" value={ytdTotal.total} accent="var(--brand-red)" />
        {UNIT_TYPES.map((u) => <StatCard key={u} label={u} value={ytdTotal[u]} accent={UNIT_COLORS[u]} />)}
      </div>

      <div style={{ ...card, marginBottom: 16 }}>
        <div style={cH}>UNITS SOLD BY MONTH — {year}</div>
        <div style={{ padding: 16, height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearlyMonthSales.filter((m) => m.total > 0 || m.monthIdx <= month)} barCategoryGap="15%">
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

      {/* Yearly month table */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={cH}>MONTHLY BREAKDOWN — {year}</div>
        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Month', ...UNIT_TYPES, 'TOTAL'].map((h) => <th key={h} style={TH}>{h}</th>)}</tr></thead>
            <tbody>
              {yearlyMonthSales.filter((m) => m.total > 0 || m.monthIdx <= month).map((m) => (
                <tr key={m.month} style={{ background: m.monthIdx === month ? 'var(--brand-red-soft)' : 'transparent' }}>
                  <td style={{ ...TD, fontFamily: FH, fontWeight: m.monthIdx === month ? 700 : 500, color: m.monthIdx === month ? '#2563eb' : 'var(--text-primary)' }}>{m.month}</td>
                  {UNIT_TYPES.map((u) => <td key={u} style={{ ...TD, fontFamily: FM, textAlign: 'center', color: m[u] > 0 ? UNIT_COLORS[u] : 'var(--border-primary)', fontWeight: 700 }}>{m[u]}</td>)}
                  <td style={{ ...TD, fontFamily: FH, fontWeight: 700, fontSize: 14, color: 'var(--brand-red)', textAlign: 'center' }}>{m.total}</td>
                </tr>
              ))}
              <tr style={{ background: 'var(--bg-tertiary)', borderTop: '2px solid var(--brand-red)' }}>
                <td style={{ ...TD, fontFamily: FH, fontWeight: 700, letterSpacing: 1 }}>YTD</td>
                {UNIT_TYPES.map((u) => <td key={u} style={{ ...TD, fontFamily: FM, textAlign: 'center', fontWeight: 700, color: UNIT_COLORS[u] }}>{ytdTotal[u]}</td>)}
                <td style={{ ...TD, fontFamily: FH, fontWeight: 700, fontSize: 16, color: 'var(--brand-red)', textAlign: 'center' }}>{ytdTotal.total}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Yearly rep performance */}
      <div style={card}>
        <div style={{ ...cH, background: '#fefce8', borderBottomColor: '#fde68a' }}>
          <span style={{ color: '#d97706' }}>🏆 {year} SALESPERSON PERFORMANCE (YTD)</span>
        </div>
        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Rank', 'Salesperson', ...UNIT_TYPES, 'TOTAL'].map((h) => <th key={h} style={{ ...TH, background: '#fefce8' }}>{h}</th>)}</tr></thead>
            <tbody>
              {yearlyRepPerf.map((r, idx) => {
                const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : (idx + 1);
                return (
                  <tr key={r.id}>
                    <td style={{ ...TD, fontFamily: FH, fontSize: 16, fontWeight: 700, color: idx === 0 ? '#d97706' : 'var(--text-muted)', textAlign: 'center', width: 50 }}>{medal}</td>
                    <td style={{ ...TD, fontFamily: FH, fontWeight: 700, letterSpacing: 0.5 }}>{r.name}</td>
                    {UNIT_TYPES.map((u) => <td key={u} style={{ ...TD, fontFamily: FM, textAlign: 'center', fontWeight: 700, color: r[u] > 0 ? UNIT_COLORS[u] : 'var(--border-primary)' }}>{r[u]}</td>)}
                    <td style={{ ...TD, fontFamily: FH, fontWeight: 700, fontSize: 15, color: 'var(--brand-red)', textAlign: 'center' }}>{r.total}</td>
                  </tr>
                );
              })}
              <tr style={{ background: '#fefce8', borderTop: '2px solid #d97706' }}>
                <td style={TD} />
                <td style={{ ...TD, fontFamily: FH, fontWeight: 700, letterSpacing: 1 }}>TEAM TOTAL</td>
                {UNIT_TYPES.map((u) => <td key={u} style={{ ...TD, fontFamily: FM, textAlign: 'center', fontWeight: 700, color: UNIT_COLORS[u] }}>{ytdTotal[u]}</td>)}
                <td style={{ ...TD, fontFamily: FH, fontWeight: 700, fontSize: 16, color: 'var(--brand-red)', textAlign: 'center' }}>{ytdTotal.total}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
