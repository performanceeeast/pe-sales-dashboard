import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { MONTHS, UNIT_TYPES as DEFAULT_UNIT_TYPES, UNIT_COLORS, STAR_CHECKLIST } from '../lib/constants';
import { ProgressBar, StatCard, styles, FM, FH } from '../components/SharedUI';

const { card, cardHead: cH, input: inp, btn1: b1, btn2: b2, th: TH, td: TD } = styles;

export default function DashboardTab({
  month, year, goals, tot, tTgt, tStr,
  ls, floorTrafficStats, yearlyMonthSales, ytdTotal, yearlyRepPerf,
  notes, saveNotes, meetingNotes, saveMeetingNotes,
  deals, currentUser, act, updateDeal,
  unitTypes: propUnitTypes,
  setView, setSalesSub, setModal, pgaTiers, yearlyDeals,
  floorDailyLeadCounts, contests, saveCT,
}) {
  const UNIT_TYPES = propUnitTypes || DEFAULT_UNIT_TYPES;
  const [mtgDate, setMtgDate] = useState(new Date().toISOString().split('T')[0]);
  const [mtgText, setMtgText] = useState('');
  const [dashSub, setDashSub] = useState('monthly');
  const canManageContests = currentUser?.role === 'admin' || currentUser?.role === 'gsm' || currentUser?.role === 'sales_finance_mgr';
  const toggleContestWinner = (contestId, repId) => {
    if (!canManageContests || !saveCT) return;
    const updated = (contests || []).map((c) => {
      if (c.id !== contestId) return c;
      const winners = (c.winners || []).slice();
      const i = winners.indexOf(repId);
      if (i >= 0) winners.splice(i, 1); else winners.push(repId);
      return { ...c, winners };
    });
    saveCT(updated);
  };

  const combinedLeads = (ls.total || 0) + (floorTrafficStats.total || 0);
  const combinedSold = (ls.sold || 0) + (floorTrafficStats.sold || 0);

  // Monthly PARTS & LABOR leaderboard
  const pgaLeaderboard = useMemo(() => {
    if (!deals || !act) return [];
    return act.map((sp) => {
      const repDeals = deals.filter((d) => d.salesperson === sp.id);
      const totalPga = repDeals.reduce((s, d) => s + (d.pgaAmount || 0), 0);
      return { ...sp, totalPga, dealCount: repDeals.length };
    }).filter((r) => r.totalPga > 0 || r.dealCount > 0).sort((a, b) => b.totalPga - a.totalPga);
  }, [deals, act]);

  // YTD PARTS & LABOR leaderboard
  const ytdPgaLeaderboard = useMemo(() => {
    if (!yearlyDeals || !act) return [];
    return act.map((sp) => {
      const repDeals = yearlyDeals.filter((d) => d.salesperson === sp.id);
      const totalPga = repDeals.reduce((s, d) => s + (d.pgaAmount || 0), 0);
      return { ...sp, totalPga, dealCount: repDeals.length };
    }).filter((r) => r.totalPga > 0).sort((a, b) => b.totalPga - a.totalPga);
  }, [yearlyDeals, act]);

  // Monthly unit sales leaderboard with traffic
  const monthlyUnitLeaderboard = useMemo(() => {
    if (!deals || !act) return [];
    const repTraffic = {};
    (floorDailyLeadCounts || []).forEach((d) => {
      if (d.salesperson) repTraffic[d.salesperson] = (repTraffic[d.salesperson] || 0) + (d.count || 0);
    });
    return act.map((sp) => {
      const u = {};
      UNIT_TYPES.forEach((t) => { u[t] = 0; });
      deals.filter((d) => d.salesperson === sp.id).forEach((d) => {
        UNIT_TYPES.forEach((t) => { u[t] += d.units?.[t] || 0; });
      });
      const total = UNIT_TYPES.reduce((s, t) => s + u[t], 0);
      return { ...sp, ...u, total, traffic: repTraffic[sp.id] || 0 };
    }).sort((a, b) => b.total - a.total);
  }, [deals, act, UNIT_TYPES, floorDailyLeadCounts]);

  function goToDeal(dealId) {
    if (setView && setSalesSub && setModal) {
      setView('sales');
      setSalesSub('deals');
    }
  }

  return (
    <div>
      {/* ── ACTIVE CONTESTS / MEETING NOTES ── */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ ...card, flex: 1, minWidth: 300 }}>
          <div style={{ ...cH, background: '#fefce8', borderBottomColor: '#fde68a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#d97706' }}>{'\uD83C\uDFC6'} ACTIVE CONTESTS</span>
            {canManageContests && <span style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)' }}>Manage in MGR &gt; Goals &amp; Spiffs</span>}
          </div>
          <div style={{ padding: 14 }}>
            {(!contests || contests.length === 0) && (
              <div style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', padding: 18 }}>
                {'\uD83C\uDFC6'} No active contests — set up in Manager &gt; Goals &amp; Spiffs
              </div>
            )}
            {(contests || []).map((c) => {
              const winners = c.winners || [];
              return (
                <div key={c.id} style={{ background: '#fefce8', borderRadius: 6, padding: '10px 12px', marginBottom: 8, border: '1px solid #fde68a' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: FH, fontSize: 13, fontWeight: 700, color: '#92400e' }}>{c.name || 'Untitled Contest'}</div>
                      {c.description && <div style={{ fontFamily: FM, fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.4 }}>{c.description}</div>}
                    </div>
                    <div style={{ fontFamily: FH, fontSize: 18, fontWeight: 700, color: '#d97706', flexShrink: 0 }}>${(c.prize || 0).toLocaleString()}</div>
                  </div>
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed #fde68a' }}>
                    <div style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 4 }}>WINNERS</div>
                    {winners.length === 0 && !canManageContests && (
                      <div style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>No winners yet</div>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {canManageContests
                        ? (act || []).map((sp) => {
                          const isWinner = winners.includes(sp.id);
                          return (
                            <button key={sp.id} onClick={() => toggleContestWinner(c.id, sp.id)} type="button" style={{
                              padding: '3px 10px', borderRadius: 12, cursor: 'pointer',
                              border: isWinner ? '1px solid #16a34a' : '1px solid var(--border-primary)',
                              background: isWinner ? '#dcfce7' : 'var(--card-bg)',
                              fontFamily: FM, fontSize: 9, fontWeight: 700,
                              color: isWinner ? '#16a34a' : 'var(--text-muted)',
                            }}>{isWinner ? '\u2713 ' : ''}{sp.name?.split(' ')[0]}</button>
                          );
                        })
                        : winners.map((wid) => {
                          const sp = (act || []).find((x) => x.id === wid);
                          if (!sp) return null;
                          return (
                            <span key={wid} style={{ padding: '3px 10px', borderRadius: 12, background: '#dcfce7', border: '1px solid #16a34a', fontFamily: FM, fontSize: 9, fontWeight: 700, color: '#16a34a' }}>
                              {'\u2713 '}{sp.name?.split(' ')[0]}
                            </span>
                          );
                        })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ ...card, flex: 1, minWidth: 300 }}>
          <div style={{ ...cH, background: '#f0fdf4', borderBottomColor: '#bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#16a34a' }}>{'\uD83D\uDCCB'} SALES MEETING NOTES</span>
          </div>
          <div style={{ padding: 14 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <input type="date" value={mtgDate} onChange={(e) => setMtgDate(e.target.value)} style={{ ...inp, width: 140 }} />
              <input value={mtgText} onChange={(e) => setMtgText(e.target.value)} style={{ ...inp, flex: 1, minWidth: 150 }} placeholder="Meeting notes..." onKeyDown={(e) => {
                if (e.key === 'Enter' && mtgText.trim()) {
                  saveMeetingNotes([{ id: Date.now().toString(), date: mtgDate, text: mtgText.trim(), createdBy: currentUser?.name || '' }, ...meetingNotes]);
                  setMtgText('');
                }
              }} />
              <button onClick={() => {
                if (!mtgText.trim()) return;
                saveMeetingNotes([{ id: Date.now().toString(), date: mtgDate, text: mtgText.trim(), createdBy: currentUser?.name || '' }, ...meetingNotes]);
                setMtgText('');
              }} style={{ ...b1, background: '#16a34a', padding: '6px 12px', fontSize: 10 }}>ADD</button>
            </div>
            <div style={{ maxHeight: 160, overflow: 'auto' }}>
              {meetingNotes.length === 0 && <div style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', padding: 14 }}>{'\uD83D\uDCCB'} No meeting notes yet</div>}
              {meetingNotes.map((n) => (
                <div key={n.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--border-secondary)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)', flexShrink: 0, width: 70 }}>{n.date}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontFamily: FM, fontSize: 11, color: 'var(--text-primary)', lineHeight: 1.4 }}>{n.text}</span>
                    {n.createdBy && <div style={{ fontFamily: FM, fontSize: 8, color: '#16a34a' }}>— {n.createdBy}</div>}
                  </div>
                  <button onClick={() => saveMeetingNotes(meetingNotes.filter((x) => x.id !== n.id))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, flexShrink: 0 }}>{'\u2715'}</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── PENDING FOLLOW-UPS ── */}
      {deals && currentUser && (() => {
        const isManager = currentUser.role === 'admin' || currentUser.role === 'gsm' || currentUser.role === 'sales_finance_mgr';
        const relevantDeals = isManager ? deals : deals.filter((d) => d.salesperson === currentUser.id);
        const today = new Date().toISOString().split('T')[0];
        const pendingTasks = [];
        relevantDeals.forEach((d) => {
          const sc = d.starChecklist || {};
          const repName = (act || []).find((a) => a.id === d.salesperson)?.name?.split(' ')[0] || '';
          STAR_CHECKLIST.forEach((item) => {
            if (sc[item.id]) return;
            if (item.deferred) {
              const dealDate = new Date(d.date); const dueDate = new Date(dealDate); dueDate.setDate(dueDate.getDate() + 7);
              const dueDateStr = dueDate.toISOString().split('T')[0];
              const isOverdue = dueDateStr <= today;
              const isDueSoon = !isOverdue && dueDateStr <= new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];
              pendingTasks.push({ dealId: d.id, customer: d.customer || 'Unknown', rep: repName, task: item.label, itemId: item.id, dueDate: dueDateStr, isOverdue, isDueSoon, deferred: true, requiresSignoff: item.requiresSignoff });
            } else if (item.requiresSignoff && !d.signoffs?.[item.id]) {
              pendingTasks.push({ dealId: d.id, customer: d.customer || 'Unknown', rep: repName, task: item.label + ' (needs signoff)', itemId: item.id, isOverdue: true, requiresSignoff: true });
            } else if (!item.deferred) {
              pendingTasks.push({ dealId: d.id, customer: d.customer || 'Unknown', rep: repName, task: item.label, itemId: item.id, isOverdue: false });
            }
          });
        });
        pendingTasks.sort((a, b) => (b.isOverdue ? 1 : 0) - (a.isOverdue ? 1 : 0) || (b.isDueSoon ? 1 : 0) - (a.isDueSoon ? 1 : 0));
        if (pendingTasks.length === 0) return null;
        const overdueCount = pendingTasks.filter((t) => t.isOverdue).length;
        return (
          <div style={{ ...card, marginBottom: 16, border: overdueCount > 0 ? '2px solid #fecaca' : '1px solid var(--border-primary)' }}>
            <div style={{ ...cH, background: overdueCount > 0 ? '#fef2f2' : '#eff6ff', borderBottomColor: overdueCount > 0 ? '#fecaca' : '#bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: overdueCount > 0 ? '#b91c1c' : '#2563eb' }}>{overdueCount > 0 ? '\u26A0\uFE0F' : '\uD83D\uDCCB'} PENDING DELIVERY TASKS ({pendingTasks.length})</span>
              {overdueCount > 0 && <span style={{ fontFamily: FM, fontSize: 9, fontWeight: 700, color: '#b91c1c', background: '#fecaca', padding: '2px 8px', borderRadius: 3 }}>{overdueCount} OVERDUE</span>}
            </div>
            <div style={{ maxHeight: 300, overflow: 'auto' }}>
              {pendingTasks.slice(0, 20).map((t) => (
                <div key={t.dealId + t.itemId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid var(--border-secondary)', background: t.isOverdue ? '#fef2f2' : t.isDueSoon ? '#fffbeb' : 'transparent' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: FM, fontSize: 11, fontWeight: 600 }}>
                      <span onClick={() => goToDeal(t.dealId)} style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'var(--border-primary)' }}>{t.customer}</span>
                      {isManager && t.rep ? <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> ({t.rep})</span> : ''}
                    </div>
                    <div style={{ fontFamily: FM, fontSize: 10, color: t.isOverdue ? '#b91c1c' : t.isDueSoon ? '#d97706' : 'var(--text-secondary)', marginTop: 1 }}>
                      {t.task}{t.dueDate && <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>Due: {t.dueDate}</span>}
                    </div>
                  </div>
                  {!t.requiresSignoff && !t.deferred && <button onClick={() => { const deal = deals.find((d) => d.id === t.dealId); if (deal) updateDeal(deal.id, { ...deal, starChecklist: { ...(deal.starChecklist || {}), [t.itemId]: true } }); }} style={{ ...b1, background: '#16a34a', padding: '4px 12px', fontSize: 9, flexShrink: 0 }}>DONE</button>}
                  {t.deferred && t.isOverdue && <button onClick={() => { const deal = deals.find((d) => d.id === t.dealId); if (deal) updateDeal(deal.id, { ...deal, starChecklist: { ...(deal.starChecklist || {}), [t.itemId]: true } }); }} style={{ ...b1, background: '#16a34a', padding: '4px 12px', fontSize: 9, flexShrink: 0 }}>COMPLETED</button>}
                  {t.deferred && !t.isOverdue && <span style={{ fontFamily: FM, fontSize: 9, color: '#d97706', fontWeight: 600, flexShrink: 0 }}>{t.isDueSoon ? 'DUE SOON' : 'UPCOMING'}</span>}
                  <button onClick={() => goToDeal(t.dealId)} title="View deal" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: FM, fontSize: 9, flexShrink: 0, textDecoration: 'underline' }}>VIEW</button>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── MONTHLY / YEARLY TAB TOGGLE ── */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderRadius: 8, overflow: 'hidden', border: '2px solid var(--brand-red)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        {[{ id: 'monthly', label: MONTHS[month].toUpperCase(), sub: 'MONTHLY VIEW' }, { id: 'yearly', label: year.toString(), sub: 'YEAR-TO-DATE' }].map((v) => (
          <button key={v.id} onClick={() => setDashSub(v.id)} style={{
            padding: '12px 20px', border: 'none', cursor: 'pointer',
            fontFamily: FH, fontSize: 14, fontWeight: 700, letterSpacing: 1.5,
            background: dashSub === v.id ? 'var(--brand-red)' : 'var(--card-bg)',
            color: dashSub === v.id ? '#fff' : 'var(--text-muted)',
            transition: 'all .15s', flex: 1, textAlign: 'center',
            borderRight: v.id === 'monthly' ? '1px solid var(--brand-red)' : 'none',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          }}>
            <span>{v.label}</span>
            <span style={{ fontSize: 8, fontFamily: FM, fontWeight: 600, letterSpacing: 2, opacity: dashSub === v.id ? 0.85 : 0.5 }}>{v.sub}</span>
          </button>
        ))}
      </div>

      {/* ══════════════════════ MONTHLY VIEW ══════════════════════ */}
      {dashSub === 'monthly' && (
        <div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            <StatCard label="UNITS SOLD" value={tot.total} sub={'of ' + tTgt + ' target'} />
            <StatCard label="% TO GOAL" value={Math.round(tTgt > 0 ? tot.total / tTgt * 100 : 0) + '%'} sub={'stretch: ' + tStr} accent={tot.total >= tTgt ? '#16a34a' : '#b91c1c'} />
            <StatCard label="ALL LEADS" value={combinedLeads} sub={combinedSold + ' deals closed'} accent="#0284c7" />
            <StatCard label="INTERNET SALES" value={ls.total} sub={ls.sold + ' sold'} accent="#2563eb" />
            <StatCard label="TRAFFIC" value={floorTrafficStats.total} sub={floorTrafficStats.sold + ' deals'} accent="#7c3aed" />
          </div>

          {/* Monthly Leaderboard with Traffic */}
          {monthlyUnitLeaderboard.length > 0 && (
            <div style={{ ...card, marginBottom: 16 }}>
              <div style={{ ...cH, background: '#fef2f2', borderBottomColor: '#fecaca' }}>
                <span style={{ color: 'var(--brand-red)' }}>{'\uD83C\uDFC6'} MONTHLY LEADERBOARD — {MONTHS[month].toUpperCase()}</span>
              </div>
              <div style={{ overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['Rank', 'Salesperson', ...UNIT_TYPES, 'TOTAL', 'TRAFFIC', 'P&L $'].map((h) => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                  <tbody>
                    {monthlyUnitLeaderboard.map((r, idx) => {
                      const medal = idx === 0 ? '\uD83E\uDD47' : idx === 1 ? '\uD83E\uDD48' : idx === 2 ? '\uD83E\uDD49' : (idx + 1);
                      const repPga = pgaLeaderboard.find((p) => p.id === r.id)?.totalPga || 0;
                      return (
                        <tr key={r.id}>
                          <td style={{ ...TD, fontFamily: FH, fontSize: 16, fontWeight: 700, color: idx === 0 ? '#d97706' : 'var(--text-muted)', textAlign: 'center', width: 50 }}>{medal}</td>
                          <td style={{ ...TD, fontFamily: FH, fontWeight: 700, letterSpacing: 0.5 }}>{r.name}</td>
                          {UNIT_TYPES.map((u) => <td key={u} style={{ ...TD, fontFamily: FM, textAlign: 'center', fontWeight: 700, color: r[u] > 0 ? UNIT_COLORS[u] : 'var(--border-primary)' }}>{r[u]}</td>)}
                          <td style={{ ...TD, fontFamily: FH, fontWeight: 700, fontSize: 15, color: 'var(--brand-red)', textAlign: 'center' }}>{r.total}</td>
                          <td style={{ ...TD, fontFamily: FM, fontWeight: 700, color: r.traffic > 0 ? '#7c3aed' : 'var(--text-muted)', textAlign: 'center' }}>{r.traffic || '\u2014'}</td>
                          <td style={{ ...TD, fontFamily: FM, fontWeight: 700, color: repPga > 0 ? '#d97706' : 'var(--text-muted)', textAlign: 'center' }}>{repPga > 0 ? '$' + repPga.toLocaleString() : '\u2014'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Parts & Labor Rankings (Monthly only) */}
          <div style={{ ...card, marginBottom: 16 }}>
            <div style={{ ...cH, background: '#fffbeb', borderBottomColor: '#fde68a' }}>
              <span style={{ color: '#d97706' }}>{'\uD83D\uDCB0'} PARTS & LABOR RANKINGS — {MONTHS[month].toUpperCase()}</span>
            </div>
            <div style={{ padding: 0 }}>
              {pgaLeaderboard.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', fontFamily: FM, fontSize: 10, color: 'var(--text-muted)' }}>No Parts & Labor data this month</div>
              ) : pgaLeaderboard.map((r, idx) => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--border-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: FH, fontSize: 14, fontWeight: 700, color: idx === 0 ? '#d97706' : 'var(--text-muted)', width: 24, textAlign: 'center' }}>{idx === 0 ? '\uD83E\uDD47' : idx === 1 ? '\uD83E\uDD48' : idx === 2 ? '\uD83E\uDD49' : (idx + 1)}</span>
                    <div>
                      <div style={{ fontFamily: FH, fontSize: 12, fontWeight: 700 }}>{r.name}</div>
                      <div style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)' }}>{r.dealCount} deal{r.dealCount !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                  <div style={{ fontFamily: FH, fontSize: 16, fontWeight: 700, color: '#d97706' }}>${r.totalPga.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Goal Progress */}
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

          {/* Actual vs Target Chart */}
          <div style={{ ...card }}>
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
        </div>
      )}

      {/* ══════════════════════ YEARLY VIEW ══════════════════════ */}
      {dashSub === 'yearly' && (
        <div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            <StatCard label="YTD UNITS" value={ytdTotal.total} accent="var(--brand-red)" />
            {UNIT_TYPES.map((u) => <StatCard key={u} label={u} value={ytdTotal[u]} accent={UNIT_COLORS[u]} />)}
          </div>

          {/* Units by Month Chart */}
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

          {/* Monthly Breakdown Table */}
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

          {/* YTD Parts & Labor */}
          <div style={{ ...card, marginBottom: 16 }}>
            <div style={{ ...cH, background: '#fffbeb', borderBottomColor: '#fde68a' }}>
              <span style={{ color: '#d97706' }}>{'\uD83D\uDCB0'} PARTS & LABOR RANKINGS — {year} YTD</span>
            </div>
            <div style={{ padding: 0 }}>
              {ytdPgaLeaderboard.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', fontFamily: FM, fontSize: 10, color: 'var(--text-muted)' }}>No YTD Parts & Labor data</div>
              ) : ytdPgaLeaderboard.map((r, idx) => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--border-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: FH, fontSize: 14, fontWeight: 700, color: idx === 0 ? '#d97706' : 'var(--text-muted)', width: 24, textAlign: 'center' }}>{idx === 0 ? '\uD83E\uDD47' : idx === 1 ? '\uD83E\uDD48' : idx === 2 ? '\uD83E\uDD49' : (idx + 1)}</span>
                    <div>
                      <div style={{ fontFamily: FH, fontSize: 12, fontWeight: 700 }}>{r.name}</div>
                      <div style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)' }}>{r.dealCount} deal{r.dealCount !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                  <div style={{ fontFamily: FH, fontSize: 16, fontWeight: 700, color: '#d97706' }}>${r.totalPga.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Yearly Rep Performance */}
          <div style={card}>
            <div style={{ ...cH, background: '#fefce8', borderBottomColor: '#fde68a' }}>
              <span style={{ color: '#d97706' }}>{'\uD83C\uDFC6'} {year} SALESPERSON PERFORMANCE (YTD)</span>
            </div>
            <div style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['Rank', 'Salesperson', ...UNIT_TYPES, 'TOTAL'].map((h) => <th key={h} style={{ ...TH, background: '#fefce8' }}>{h}</th>)}</tr></thead>
                <tbody>
                  {yearlyRepPerf.map((r, idx) => {
                    const medal = idx === 0 ? '\uD83E\uDD47' : idx === 1 ? '\uD83E\uDD48' : idx === 2 ? '\uD83E\uDD49' : (idx + 1);
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
      )}
    </div>
  );
}
