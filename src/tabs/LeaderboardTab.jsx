import React from 'react';
import { UNIT_TYPES as DEFAULT_UNIT_TYPES, UNIT_COLORS } from '../lib/constants';
import { MONTHS } from '../lib/constants';
import { getSpUnits, getRepSpiffs } from '../lib/calculations';
import { styles, FM, FH } from '../components/SharedUI';

const { card, td: TD } = styles;

export default function LeaderboardTab({ month, year, deals, act, pgaTiers, beSpiffs, hitList, setSelRep, unitTypes: propUnitTypes }) {
  const UNIT_TYPES = propUnitTypes || DEFAULT_UNIT_TYPES;
  return (
    <div>
      <div style={{ fontFamily: FH, fontSize: 14, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 14 }}>
        LEADERBOARD — {MONTHS[month].toUpperCase()} {year}
      </div>
      {act.length === 0 && (
        <div style={{ ...card, padding: 40, textAlign: 'center' }}>
          <div style={{ fontFamily: FM, fontSize: 11, color: 'var(--text-muted)' }}>No salespeople configured. Add users in the Admin panel.</div>
        </div>
      )}
      {deals.length === 0 && act.length > 0 && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 16px', marginBottom: 14, fontFamily: FM, fontSize: 11, color: '#2563eb' }}>
          No deals logged for {MONTHS[month]} yet. Log deals on the Deals tab to see the leaderboard populate.
        </div>
      )}
      {act.slice().sort((a, b) => getSpUnits(deals, b.id, UNIT_TYPES).total - getSpUnits(deals, a.id, UNIT_TYPES).total).map((s, r) => {
        const u = getSpUnits(deals, s.id, UNIT_TYPES);
        const sf = getRepSpiffs(deals, s.id, pgaTiers, beSpiffs, hitList, UNIT_TYPES);
        const repDeals = deals.filter((d) => d.salesperson === s.id);
        const totalPga = repDeals.reduce((sum, d) => sum + (d.pgaAmount || 0), 0);
        const medal = r === 0 ? '🥇' : r === 1 ? '🥈' : r === 2 ? '🥉' : '';
        return (
          <div key={s.id} onClick={() => setSelRep(s.id)} style={{ ...card, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px', flexWrap: 'wrap', cursor: 'pointer', transition: 'box-shadow .15s' }}>
            <div style={{ fontFamily: FH, fontSize: 22, fontWeight: 700, color: r === 0 ? 'var(--brand-red)' : 'var(--text-muted)', width: 30, textAlign: 'center' }}>{r < 3 ? medal : r + 1}</div>
            <div style={{ minWidth: 120 }}>
              <div style={{ fontFamily: FH, fontSize: 14, fontWeight: 700, letterSpacing: 0.5 }}>{s.name}</div>
              <div style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)' }}>Click for dashboard</div>
            </div>
            <div style={{ flex: 1, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {UNIT_TYPES.map((t) => (
                <div key={t} style={{ textAlign: 'center', minWidth: 40 }}>
                  <div style={{ fontFamily: FH, fontSize: 18, fontWeight: 700, color: UNIT_COLORS[t], lineHeight: 1 }}>{u[t]}</div>
                  <div style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)', letterSpacing: 1 }}>{t}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <div style={{ background: '#fffbeb', borderRadius: 6, padding: '6px 10px', textAlign: 'center' }}>
                <div style={{ fontFamily: FM, fontSize: 10, fontWeight: 700, color: '#d97706' }}>${totalPga.toLocaleString()}</div>
                <div style={{ fontFamily: FM, fontSize: 7, color: 'var(--text-muted)' }}>PG&A</div>
              </div>
              <div style={{ background: '#f0fdf4', borderRadius: 6, padding: '6px 10px', textAlign: 'center' }}>
                <div style={{ fontFamily: FM, fontSize: 10, fontWeight: 700, color: '#16a34a' }}>${sf.totalSpiffs}</div>
                <div style={{ fontFamily: FM, fontSize: 7, color: 'var(--text-muted)' }}>SPIFFS</div>
              </div>
              <div style={{ background: 'var(--bg-tertiary)', borderRadius: 6, padding: '6px 12px', textAlign: 'center' }}>
                <div style={{ fontFamily: FH, fontSize: 20, fontWeight: 700, color: 'var(--brand-red)', lineHeight: 1 }}>{u.total}</div>
                <div style={{ fontFamily: FM, fontSize: 7, color: 'var(--text-muted)' }}>UNITS</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
