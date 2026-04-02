import React, { useState, useEffect } from 'react';
import { MONTHS } from '../lib/constants';
import { ProgressBar, styles, FM, FH } from '../components/SharedUI';
import { loadCustomers, loadInteractions } from '../lib/storage';

const { card, cardHead: cH, input: inp, btn1: b1, th: TH, td: TD } = styles;

// ── GSM Checklist Items (matches sales-manager-checklist.vercel.app) ──
const GSM_CHECKLISTS = {
  daily: {
    label: 'DAILY',
    color: 'var(--brand-red)',
    tracked: true,
    sections: [
      { name: 'Daily Tasks', items: [
        'Save-a-Deal meeting',
        'Traffic log audit on all open leads — where are we at with each lead, what are the next steps',
        'Showroom and lot organized and units displayed properly',
        'Used and new inventory listed on web and priced',
        'Units warranty registered',
      ]},
    ],
  },
  weekly: {
    label: 'WEEKLY',
    color: '#d97706',
    tracked: true,
    sections: [
      { name: 'Weekly Tasks', items: [
        'Review lost deals and breakdowns',
        'Deposit deals reviewed — customer updated, unit status, ETA, etc.',
        'New units needed through service',
        'Used unit reconditioning',
        'Plan for aged inventory',
        'Review customer complaints and issues',
      ]},
    ],
  },
  monthly: {
    label: 'MONTHLY',
    color: '#2563eb',
    tracked: true,
    sections: [
      { name: 'Sales Star Program', items: [
        'Verified Star eligibility for each salesperson',
        'Confirmed delivery photos for all deals',
        'Verified Google Review requirements',
        'Verified social media product video requirements',
        'Calculated average team Star rating',
      ]},
      { name: 'OEM & Compliance', items: [
        'Verified 100% OEM training completion',
        'Ensured salespeople only sold certified brands',
        'Addressed any OEM compliance issues',
        'OEM program tracking',
        'Promotion scheduling',
      ]},
      { name: 'Inventory & Merchandising', items: [
        'Reviewed inventory turns',
        'Flagged all 90+ day units with action plans',
        'Confirmed showroom refresh completed',
      ]},
      { name: 'Leadership & Reporting', items: [
        'Conducted monthly department performance meeting',
        'Set expectations and priorities for upcoming month',
      ]},
    ],
  },
  quarterly: {
    label: 'QUARTERLY',
    color: '#16a34a',
    tracked: true,
    sections: [
      { name: 'Training & Development', items: [
        'Conducted quarterly department-wide training day',
        'Attended OEM sales/leadership training',
        'Reinforced CRM, FORMAT, and follow-up standards',
      ]},
      { name: 'Process Audits', items: [
        'Performed deep CRM audit',
        'Audited delivery documentation accuracy',
        'Audited F&I menu presentation compliance',
      ]},
      { name: 'Inventory Strategy', items: [
        'Executed Hero Unit strategies',
        'Reviewed stocking profiles (collaborative only)',
        'Evaluated recon-to-market effectiveness',
      ]},
    ],
  },
  yearly: {
    label: 'ANNUAL',
    color: '#7c3aed',
    tracked: true,
    sections: [
      { name: 'Strategic Planning', items: [
        'Annual department performance review completed',
        'Next year sales goals established with Operations Director',
        'OEM program review and brand strategy alignment',
        'Team development plans set for each direct report',
      ]},
    ],
  },
  ongoing: {
    label: 'ONGOING',
    color: '#0284c7',
    tracked: false, // visual reference only — not checklisted
    sections: [
      { name: 'Base Employment Standards', items: [
        'Creates a disciplined, positive, high-performance environment',
        'Leads through accountability and example',
        'Present during core sales hours and peak traffic',
        'Ensures adherence to dealership, OEM, and legal policies',
        'All delivery, F&I, and contract documentation complete and accurate',
        'Zero tolerance: No fraud, improper disclosures, or unethical behavior',
      ]},
      { name: 'Leadership Responsibilities', items: [
        'Leads Sales, ISM, F&I, Marine SM, and PSE SM',
        'Enforces Sales Star Program standards',
        'Provides daily coaching and direction',
        'Oversees lead management through ISM',
        'Handles training, onboarding, and corrective action',
      ]},
      { name: 'Sales Responsibilities', items: [
        'Achieves monthly volume and gross expectations',
        'Manages appointment funnel (set/show/close)',
        'Ensures outbound follow-up and customer contact discipline',
        'Confirms delivery photos, videos, reviews, and FORMAT notes',
      ]},
      { name: 'Finance Responsibilities', items: [
        'Ensures consistent menu presentations',
        'Tracks PUS and product penetration daily',
        'Validates contract accuracy and documentation completeness',
        'Coaches F&I Manager on performance gaps',
      ]},
      { name: 'Inventory Responsibilities', items: [
        'Collaborates with Operations Director on forecasting and ordering',
        'Controls aging inventory; eliminates 90+ day units',
        'Oversees trade appraisals and recon timelines',
        'Ensures merchandising standards: photos, videos, descriptions',
      ]},
      { name: 'Customer Experience', items: [
        'Maintains a 5-star delivery process',
        'Handles escalated customer concerns',
        'Reviews CSI feedback and trends',
      ]},
    ],
  },
};

// F&I KPI definitions (V2 — 4 KPIs + battery)
const FI_KPIS = [
  { id: 'pus', label: 'PUS (Profit Per Unit Sold)', target: 1000, unit: '$', bonus: 250 },
  { id: 'ew', label: 'Extended Warranty', target: 40, unit: '%', bonus: 250 },
  { id: 'lsp', label: 'Lifetime Service Plan', target: 15, unit: '%', bonus: 250 },
  { id: 'gap', label: 'GAP Penetration', target: 20, unit: '%', bonus: 250 },
  { id: 'battery', label: 'Lifetime Battery', target: 40, unit: '%', bonus: 250 },
];

// V2 star level calculation — cumulative requirements
function calcRepStar(repDeals, googleReviewCount) {
  const total = repDeals.length;
  if (total === 0) return { star: 0, details: {} };

  const check = (field) => repDeals.filter((d) => d.starChecklist?.[field]).length;
  const pct = (count) => total > 0 ? Math.round(count / total * 100) : 0;

  const photo = check('deliveryPhoto');
  const format = check('formatNotes');
  const followUp = check('postSaleFollowUp');
  const parts = check('partsIntro');
  const service = check('serviceIntro');
  const referral = check('referralRequest');
  const gReview = check('googleReview');

  const details = {
    photoPct: pct(photo), formatPct: pct(format), followUpPct: pct(followUp),
    partsPct: pct(parts), servicePct: pct(service), referralPct: pct(referral),
    gReviewPct: pct(gReview), googleReviews: googleReviewCount, totalDeals: total,
  };

  // 1-Star: 100% photo + 100% FORMAT
  const star1 = pct(photo) >= 100 && pct(format) >= 100;
  // 2-Star: all 1-star + 3 reviews + 100% followUp + 100% parts + 100% service
  const star2 = star1 && googleReviewCount >= 3 && pct(followUp) >= 100 && pct(parts) >= 100 && pct(service) >= 100;
  // 3-Star: all 2-star + 5 reviews + 100% referral
  const star3 = star2 && googleReviewCount >= 5 && pct(referral) >= 100;

  const star = star3 ? 3 : star2 ? 2 : star1 ? 1 : 0;
  return { star, details };
}

export default function GSMDashTab({
  month, year, deals, act, currentUser, googleReviews,
  gsmChecklist, saveGsmChecklist, fiKpis, saveFiKpis,
  gsmBonusConfig, saveGsmBonusConfig, saveGoogleReviews,
}) {
  const [checklistTab, setChecklistTab] = useState('daily');
  const [editBonuses, setEditBonuses] = useState(false);
  const isAdmin = currentUser?.role === 'admin';

  // Pipeline health data
  const [pipelineData, setPipelineData] = useState({ customers: [], repActivity: {} });
  useEffect(() => {
    (async () => {
      const customers = await loadCustomers();
      // Get today's and this week's activity counts per rep
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const weekAgo = new Date(now - 7 * 86400000).toISOString();
      const repActivity = {};
      for (const sp of act) {
        const repCustomers = customers.filter((c) => c.assigned_to === sp.id);
        const activeLeads = repCustomers.filter((c) => c.status && c.status !== 'delivered' && c.status !== 'sold');
        const staleLeads = repCustomers.filter((c) => {
          if (!c.updated_at) return true;
          return (now - new Date(c.updated_at)) > 7 * 86400000;
        });
        repActivity[sp.id] = {
          totalLeads: repCustomers.length,
          activeLeads: activeLeads.length,
          staleLeads: staleLeads.length,
        };
      }
      setPipelineData({ customers, repActivity });
    })();
  }, [act]);

  // Bonus config with defaults
  const bc = {
    star3: 2000, star25: 1000, star2: 650,
    kpiBonus: 250, kpiPerfect: 1250,
    ...(gsmBonusConfig || {}),
  };

  function updateBc(key, val) {
    saveGsmBonusConfig({ ...bc, [key]: parseInt(val) || 0 });
  }

  // ── V2 Star Program Scoring ──
  const gReviews = googleReviews || {};
  const repStarScores = act.map((sp) => {
    const rd = deals.filter((d) => d.salesperson === sp.id);
    const reviews = gReviews[sp.id] || 0;
    const { star, details } = calcRepStar(rd, reviews);
    return { ...sp, star, ...details };
  });
  const repsWithDeals = repStarScores.filter((r) => r.totalDeals > 0);
  const avgStar = repsWithDeals.length > 0 ? repsWithDeals.reduce((s, r) => s + r.star, 0) / repsWithDeals.length : 0;
  const avgStarRounded = Math.round(avgStar * 10) / 10;

  let starBonus = 0;
  if (avgStarRounded >= 3.0) starBonus = bc.star3;
  else if (avgStarRounded >= 2.5) starBonus = bc.star25;
  else if (avgStarRounded >= 2.0) starBonus = bc.star2;

  // ── F&I KPIs ──
  const kpiValues = fiKpis || {};
  const kpiHits = FI_KPIS.filter((k) => {
    const val = kpiValues[k.id] || 0;
    return val >= k.target;
  });
  const fiBonus = kpiHits.length === 5 ? bc.kpiPerfect : kpiHits.length * bc.kpiBonus;

  // ── Checklist State ──
  const cl = gsmChecklist || {};
  const activeList = GSM_CHECKLISTS[checklistTab];
  const allItems = activeList.sections.flatMap((s) => s.items);
  const checkedCount = allItems.filter((item) => cl[checklistTab + ':' + item]).length;
  const totalItems = allItems.length;
  const allDone = checkedCount === totalItems;

  function toggleItem(item) {
    const key = checklistTab + ':' + item;
    saveGsmChecklist({ ...cl, [key]: !cl[key] });
  }

  return (
    <div>
      {/* ═══ PIPELINE HEALTH & REP ACTIVITY ═══ */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ ...cH, background: '#f5f3ff', borderBottomColor: '#ddd6fe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#7c3aed' }}>PIPELINE HEALTH & REP ACTIVITY</span>
          <span style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)' }}>{pipelineData.customers.length} total leads</span>
        </div>
        <div style={{ padding: 16 }}>
          {/* Summary stats */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16, padding: '12px 16px', background: '#faf5ff', borderRadius: 8 }}>
            {[
              { label: 'TOTAL PIPELINE', value: pipelineData.customers.length, color: '#7c3aed' },
              { label: 'ACTIVE LEADS', value: pipelineData.customers.filter((c) => c.status && !['delivered', 'sold'].includes(c.status)).length, color: '#2563eb' },
              { label: 'STALE (7+ DAYS)', value: pipelineData.customers.filter((c) => !c.updated_at || (Date.now() - new Date(c.updated_at)) > 7 * 86400000).length, color: '#b91c1c' },
              { label: 'UNASSIGNED', value: pipelineData.customers.filter((c) => !c.assigned_to).length, color: '#d97706' },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: 'center', minWidth: 80 }}>
                <div style={{ fontFamily: FH, fontSize: 24, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)', letterSpacing: 0.5, marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Per-rep activity */}
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                {['REP', 'TOTAL LEADS', 'ACTIVE', 'STALE (7+ DAYS)', 'DEALS THIS MO', 'STATUS'].map((h) => (
                  <th key={h} style={{ ...TH, background: '#faf5ff', fontSize: 8 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {act.map((sp) => {
                  const ra = pipelineData.repActivity[sp.id] || {};
                  const repDeals = deals.filter((d) => d.salesperson === sp.id).length;
                  const hasStale = (ra.staleLeads || 0) > 0;
                  const isHealthy = (ra.staleLeads || 0) === 0 && (ra.activeLeads || 0) > 0;
                  return (
                    <tr key={sp.id}>
                      <td style={{ ...TD, fontFamily: FH, fontWeight: 700, fontSize: 11 }}>{sp.name.split(' ')[0]}</td>
                      <td style={{ ...TD, fontFamily: FM, fontWeight: 700, textAlign: 'center' }}>{ra.totalLeads || 0}</td>
                      <td style={{ ...TD, fontFamily: FM, fontWeight: 700, color: '#2563eb', textAlign: 'center' }}>{ra.activeLeads || 0}</td>
                      <td style={{ ...TD, fontFamily: FM, fontWeight: 700, color: hasStale ? '#b91c1c' : 'var(--text-muted)', textAlign: 'center' }}>{ra.staleLeads || 0}</td>
                      <td style={{ ...TD, fontFamily: FM, fontWeight: 700, color: repDeals > 0 ? '#16a34a' : 'var(--text-muted)', textAlign: 'center' }}>{repDeals}</td>
                      <td style={TD}>
                        <span style={{
                          fontFamily: FM, fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 3,
                          background: isHealthy ? '#dcfce7' : hasStale ? '#fef2f2' : '#fef3c7',
                          color: isHealthy ? '#16a34a' : hasStale ? '#b91c1c' : '#d97706',
                        }}>{isHealthy ? 'HEALTHY' : hasStale ? 'NEEDS ATTENTION' : 'LOW ACTIVITY'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ═══ STAR PROGRAM SCORING ═══ */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ ...cH, background: '#fefce8', borderBottomColor: '#fde68a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#d97706' }}>STAR PROGRAM — TEAM SCORING — {MONTHS[month].toUpperCase()}</span>
          {isAdmin && <button onClick={() => setEditBonuses(!editBonuses)} style={{ background: 'none', border: 'none', fontFamily: FM, fontSize: 9, color: '#d97706', cursor: 'pointer', fontWeight: 700 }}>{editBonuses ? 'DONE' : 'EDIT BONUSES'}</button>}
        </div>
        <div style={{ padding: 16 }}>
          {/* Edit bonus config */}
          {editBonuses && isAdmin && (
            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: 14, marginBottom: 14 }}>
              <div style={{ fontFamily: FH, fontSize: 10, fontWeight: 700, color: '#d97706', letterSpacing: 1, marginBottom: 10 }}>BONUS CONFIGURATION</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                {[
                  { key: 'star3', label: '3.0+ Star Bonus' }, { key: 'star25', label: '2.5-2.9 Star Bonus' },
                  { key: 'star2', label: '2.0-2.4 Star Bonus' }, { key: 'kpiBonus', label: 'Per KPI Hit Bonus' },
                  { key: 'kpiPerfect', label: 'Perfect Month (All 5 KPIs)' },
                ].map((item) => (
                  <div key={item.key}>
                    <label style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 0.5, display: 'block', marginBottom: 3 }}>{item.label}</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontFamily: FM, fontSize: 12, color: 'var(--text-secondary)' }}>$</span>
                      <input type="number" min="0" value={bc[item.key]} onChange={(e) => updateBc(item.key, e.target.value)} style={{ ...inp, width: 80, textAlign: 'center', padding: '4px 6px', fontSize: 12, fontWeight: 700 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team average */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16, padding: '14px 20px', background: '#fefce8', borderRadius: 8 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: FH, fontSize: 36, fontWeight: 700, color: '#d97706', lineHeight: 1 }}>{avgStarRounded.toFixed(1)}</div>
              <div style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, marginTop: 2 }}>AVG STAR</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FM, fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
                {avgStarRounded >= 3.0 ? `3.0+ Stars — $${bc.star3.toLocaleString()}` : avgStarRounded >= 2.5 ? `2.5-2.9 Stars — $${bc.star25.toLocaleString()}` : avgStarRounded >= 2.0 ? `2.0-2.4 Stars — $${bc.star2.toLocaleString()}` : 'Below 2.0 — No Bonus'}
              </div>
              <ProgressBar value={avgStarRounded} max={3} color={avgStarRounded >= 3 ? '#16a34a' : avgStarRounded >= 2 ? '#d97706' : 'var(--brand-red)'} />
            </div>
            <div style={{ textAlign: 'center', borderLeft: '1px solid #fde68a', paddingLeft: 16 }}>
              <div style={{ fontFamily: FH, fontSize: 24, fontWeight: 700, color: starBonus > 0 ? '#16a34a' : 'var(--brand-red)', lineHeight: 1 }}>${starBonus.toLocaleString()}</div>
              <div style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, marginTop: 2 }}>STAR BONUS</div>
            </div>
          </div>

          {/* Per-rep star scoring */}
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                {['REP', 'DEALS', 'PARTS', 'SVC', 'PHOTO', 'FORMAT', 'G-REV', 'REF', 'F/U', 'REVIEWS', 'STAR'].map((h) => <th key={h} style={{ ...TH, background: '#fefce8', fontSize: 8 }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {repStarScores.map((r) => {
                  const clr = (pct) => pct >= 100 ? '#16a34a' : pct > 0 ? '#d97706' : 'var(--border-primary)';
                  return (
                    <tr key={r.id}>
                      <td style={{ ...TD, fontFamily: FH, fontWeight: 700, fontSize: 11 }}>{r.name.split(' ')[0]}</td>
                      <td style={{ ...TD, fontFamily: FM, fontWeight: 700, color: 'var(--brand-red)', textAlign: 'center' }}>{r.totalDeals || 0}</td>
                      <td style={TD}><span style={{ fontFamily: FM, fontSize: 10, fontWeight: 700, color: clr(r.partsPct || 0) }}>{r.partsPct || 0}%</span></td>
                      <td style={TD}><span style={{ fontFamily: FM, fontSize: 10, fontWeight: 700, color: clr(r.servicePct || 0) }}>{r.servicePct || 0}%</span></td>
                      <td style={TD}><span style={{ fontFamily: FM, fontSize: 10, fontWeight: 700, color: clr(r.photoPct || 0) }}>{r.photoPct || 0}%</span></td>
                      <td style={TD}><span style={{ fontFamily: FM, fontSize: 10, fontWeight: 700, color: clr(r.formatPct || 0) }}>{r.formatPct || 0}%</span></td>
                      <td style={TD}><span style={{ fontFamily: FM, fontSize: 10, fontWeight: 700, color: clr(r.gReviewPct || 0) }}>{r.gReviewPct || 0}%</span></td>
                      <td style={TD}><span style={{ fontFamily: FM, fontSize: 10, fontWeight: 700, color: clr(r.referralPct || 0) }}>{r.referralPct || 0}%</span></td>
                      <td style={TD}><span style={{ fontFamily: FM, fontSize: 10, fontWeight: 700, color: clr(r.followUpPct || 0) }}>{r.followUpPct || 0}%</span></td>
                      <td style={TD}>
                        <input type="number" min="0" value={gReviews[r.id] || ''} onChange={(e) => saveGoogleReviews({ ...gReviews, [r.id]: parseInt(e.target.value) || 0 })} style={{ ...inp, width: 40, textAlign: 'center', padding: '2px', fontSize: 11, fontWeight: 700 }} placeholder="0" />
                      </td>
                      <td style={{ ...TD, textAlign: 'center' }}>
                        <span style={{ fontFamily: FH, fontSize: 14, fontWeight: 700, color: r.star >= 3 ? '#16a34a' : r.star >= 2 ? '#d97706' : r.star >= 1 ? '#2563eb' : 'var(--text-muted)' }}>
                          {r.star > 0 ? Array(r.star).fill('⭐').join('') : '—'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Commission reference */}
          <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[{ s: 0, l: 'Base 12%' }, { s: 1, l: '1-Star 13%' }, { s: 2, l: '2-Star 14%' }, { s: 3, l: '3-Star 15%' }].map((t) => (
              <div key={t.s} style={{ padding: '4px 10px', borderRadius: 4, fontFamily: FM, fontSize: 10, background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>{t.l}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ F&I KPI PANEL ═══ */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ ...cH, background: '#eff6ff', borderBottomColor: '#bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#2563eb' }}>📊 F&I KPI PERFORMANCE — {MONTHS[month].toUpperCase()}</span>
          {isAdmin && <button onClick={() => setEditBonuses(!editBonuses)} style={{ background: 'none', border: 'none', fontFamily: FM, fontSize: 9, color: '#2563eb', cursor: 'pointer', fontWeight: 700 }}>{editBonuses ? 'DONE' : 'EDIT BONUSES'}</button>}
        </div>
        <div style={{ padding: 16 }}>
          {/* Edit bonus config panel */}
          {editBonuses && isAdmin && (
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 14, marginBottom: 14 }}>
              <div style={{ fontFamily: FH, fontSize: 10, fontWeight: 700, color: '#2563eb', letterSpacing: 1, marginBottom: 10 }}>BONUS CONFIGURATION</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                {[
                  { key: 'kpiBonus', label: 'Per KPI Hit Bonus' },
                  { key: 'kpiPerfect', label: 'Perfect Month (All KPIs)' },
                ].map((item) => (
                  <div key={item.key}>
                    <label style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 0.5, display: 'block', marginBottom: 3 }}>{item.label}</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontFamily: FM, fontSize: 12, color: 'var(--text-secondary)' }}>$</span>
                      <input type="number" min="0" value={bc[item.key]} onChange={(e) => updateBc(item.key, e.target.value)} style={{ ...inp, width: 90, textAlign: 'center', padding: '4px 8px', fontSize: 12, fontWeight: 700 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
            {FI_KPIS.map((k) => {
              const val = kpiValues[k.id] || 0;
              const hit = val >= k.target;
              return (
                <div key={k.id} style={{ background: hit ? '#f0fdf4' : '#fef2f2', borderRadius: 8, padding: '14px 16px', border: `1px solid ${hit ? '#bbf7d0' : '#fecaca'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontFamily: FH, fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{k.label}</div>
                    <span style={{ fontFamily: FM, fontSize: 10, fontWeight: 700, color: hit ? '#16a34a' : 'var(--brand-red)', padding: '2px 8px', borderRadius: 3, background: hit ? '#dcfce7' : '#fef2f2' }}>{hit ? 'HIT' : 'MISS'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)' }}>ACTUAL:</span>
                    <input
                      type="number" min="0"
                      value={val || ''}
                      onChange={(e) => saveFiKpis({ ...kpiValues, [k.id]: parseFloat(e.target.value) || 0 })}
                      style={{ ...inp, width: 80, textAlign: 'center', padding: '4px 8px', fontSize: 13, fontWeight: 700 }}
                      placeholder="0"
                    />
                    <span style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)' }}>TARGET: {k.unit === '$' ? '$' : ''}{k.target}{k.unit === '%' ? '%' : ''}</span>
                  </div>
                  <div style={{ marginTop: 8 }}><ProgressBar value={val} max={k.target * 1.2} color={hit ? '#16a34a' : 'var(--brand-red)'} /></div>
                </div>
              );
            })}
          </div>

          {/* Bonus Summary */}
          <div style={{ background: 'var(--bg-tertiary)', borderRadius: 8, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>KPIs HIT: {kpiHits.length}/5 {kpiHits.length === 5 ? '— PERFECT MONTH BONUS' : ''}</div>
              <div style={{ fontFamily: FM, fontSize: 11, color: 'var(--text-secondary)' }}>
                {kpiHits.map((k) => k.label.split(' ')[0]).join(', ') || 'None'}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: FH, fontSize: 28, fontWeight: 700, color: fiBonus > 0 ? '#16a34a' : 'var(--brand-red)', lineHeight: 1 }}>${fiBonus.toLocaleString()}</div>
              <div style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1 }}>F&I BONUS</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ GSM ACCOUNTABILITY CHECKLIST ═══ */}
      <div style={card}>
        <div style={cH}>
          <span>📋 GSM ACCOUNTABILITY CHECKLIST</span>
        </div>
        {/* Frequency tabs */}
        <div style={{ display: 'flex', gap: 2, padding: '8px 12px', background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-primary)', flexWrap: 'wrap' }}>
          {Object.entries(GSM_CHECKLISTS).map(([key, list]) => {
            const items = list.sections.flatMap((s) => s.items);
            const done = list.tracked ? items.filter((item) => cl[key + ':' + item]).length : 0;
            const total = items.length;
            const isActive = checklistTab === key;
            return (
              <button key={key} onClick={() => setChecklistTab(key)} style={{
                padding: '6px 12px', borderRadius: 4, border: 'none', cursor: 'pointer',
                fontFamily: FH, fontSize: 10, fontWeight: 600, letterSpacing: 0.8,
                background: isActive ? list.color : 'transparent',
                color: isActive ? 'var(--text-inverse)' : 'var(--text-secondary)',
                transition: 'all .15s',
              }}>
                {list.label}
                {list.tracked && <span style={{ fontFamily: FM, fontSize: 8, marginLeft: 4, opacity: 0.8 }}>{done}/{total}</span>}
              </button>
            );
          })}
        </div>

        {/* Progress bar (tracked tabs only) */}
        {activeList.tracked && (
          <div style={{ padding: '10px 16px', background: allDone ? '#f0fdf4' : 'var(--card-bg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1 }}><ProgressBar value={checkedCount} max={totalItems} color={allDone ? '#16a34a' : activeList.color} /></div>
              <span style={{ fontFamily: FM, fontSize: 11, fontWeight: 700, color: allDone ? '#16a34a' : activeList.color }}>{checkedCount}/{totalItems}</span>
              {allDone && <span style={{ fontFamily: FM, fontSize: 10, fontWeight: 700, color: '#16a34a', padding: '2px 8px', background: '#dcfce7', borderRadius: 3 }}>PASS</span>}
              {!allDone && checkedCount > 0 && <span style={{ fontFamily: FM, fontSize: 10, fontWeight: 700, color: 'var(--brand-red)', padding: '2px 8px', background: '#fef2f2', borderRadius: 3 }}>INCOMPLETE</span>}
            </div>
          </div>
        )}

        {/* Ongoing visual reference banner */}
        {!activeList.tracked && (
          <div style={{ padding: '10px 16px', background: '#f0f9ff', borderBottom: '1px solid #bae6fd' }}>
            <span style={{ fontFamily: FM, fontSize: 10, color: '#0284c7' }}>VISUAL REFERENCE ONLY — These are ongoing responsibilities, not daily checkboxes.</span>
          </div>
        )}

        {/* Checklist / Reference items */}
        <div style={{ padding: '0 16px 16px' }}>
          {activeList.sections.map((section) => (
            <div key={section.name} style={{ marginTop: 14 }}>
              <div style={{ fontFamily: FH, fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' }}>{section.name}</div>
              {section.items.map((item) => {
                if (!activeList.tracked) {
                  // Visual reference — no checkbox
                  return (
                    <div key={item} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', marginBottom: 2,
                      borderRadius: 4, background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)',
                    }}>
                      <span style={{ fontFamily: FM, fontSize: 13, color: activeList.color, flexShrink: 0 }}>•</span>
                      <span style={{ fontFamily: FM, fontSize: 11, color: 'var(--text-primary)' }}>{item}</span>
                    </div>
                  );
                }
                const checked = !!cl[checklistTab + ':' + item];
                return (
                  <div key={item} onClick={() => toggleItem(item)} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', marginBottom: 2,
                    borderRadius: 4, cursor: 'pointer', transition: 'all .15s',
                    background: checked ? '#f0fdf4' : 'var(--card-bg)',
                    border: checked ? '1px solid #bbf7d0' : '1px solid var(--border-secondary)',
                  }}>
                    <span style={{ fontFamily: FM, fontSize: 15, color: checked ? '#16a34a' : 'var(--text-muted)', flexShrink: 0 }}>{checked ? '✓' : '○'}</span>
                    <span style={{ fontFamily: FM, fontSize: 11, color: checked ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: checked ? 500 : 400 }}>{item}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bonus Eligibility Gate */}
        <div style={{ padding: '12px 16px', background: '#fef2f2', borderTop: '2px solid #fecaca', fontFamily: FM, fontSize: 10, color: 'var(--brand-red)', lineHeight: 1.6 }}>
          <strong>BONUS ELIGIBILITY GATE:</strong> If ANY daily, weekly, monthly, or quarterly standard is missed, ALL bonuses are forfeited. Fixed commission (3% override) still applies.
        </div>
      </div>

      {/* ═══ TOTAL COMPENSATION SUMMARY ═══ */}
      <div style={{ ...card, marginTop: 16, background: 'var(--bg-tertiary)' }}>
        <div style={{ ...cH, background: 'var(--text-primary)', borderBottomColor: 'var(--brand-red)' }}>
          <span style={{ color: 'var(--text-inverse)' }}>💰 GSM MONTHLY COMPENSATION SUMMARY</span>
        </div>
        <div style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-primary)' }}>
              <span style={{ fontFamily: FM, fontSize: 12, color: 'var(--text-secondary)' }}>Fixed Commission (3% Override)</span>
              <span style={{ fontFamily: FM, fontSize: 12, color: 'var(--text-muted)' }}>Calculated from gross</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-primary)' }}>
              <span style={{ fontFamily: FM, fontSize: 12, color: 'var(--text-secondary)' }}>Star Team Bonus (Avg {avgStarRounded.toFixed(1)})</span>
              <span style={{ fontFamily: FH, fontSize: 14, fontWeight: 700, color: starBonus > 0 ? '#16a34a' : 'var(--brand-red)' }}>${starBonus.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-primary)' }}>
              <span style={{ fontFamily: FM, fontSize: 12, color: 'var(--text-secondary)' }}>F&I KPI Bonus ({kpiHits.length}/5 hit{kpiHits.length === 5 ? ' — Perfect Month' : ''})</span>
              <span style={{ fontFamily: FH, fontSize: 14, fontWeight: 700, color: fiBonus > 0 ? '#16a34a' : 'var(--brand-red)' }}>${fiBonus.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '3px solid var(--brand-red)', marginTop: 4 }}>
              <span style={{ fontFamily: FH, fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>TOTAL BONUS</span>
              <span style={{ fontFamily: FH, fontSize: 22, fontWeight: 700, color: 'var(--brand-red)' }}>${(starBonus + fiBonus).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
