import React from 'react';
import { MONTHS, UNIT_TYPES as DEFAULT_UNIT_TYPES, UNIT_COLORS } from '../lib/constants';
import { getSpUnits, getRepSpiffs } from '../lib/calculations';
import { StatCard, styles, FM, FH, FB } from '../components/SharedUI';

const { card, cardHead: cH, btn2: b2, th: TH, td: TD } = styles;

export default function RepDashboard({ selRep, setSelRep, spList, deals, leads, contests, month, year, pgaTiers, beSpiffs, hitList, unitTypes: propUnitTypes, storeTheme }) {
  const UNIT_TYPES = propUnitTypes || DEFAULT_UNIT_TYPES;
  const rep = spList.find((s) => s.id === selRep);
  const uRep = getSpUnits(deals, selRep, UNIT_TYPES);
  const sf = getRepSpiffs(deals, selRep, pgaTiers, beSpiffs, hitList, UNIT_TYPES);
  const rl = leads.filter((l) => l.salesperson === selRep);
  const repContests = contests.filter((c) => c.winners?.includes(selRep));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', fontFamily: FB, color: 'var(--text-primary)' }}>
      <div style={{ background: 'var(--header-bg)', borderBottom: '3px solid var(--header-border)', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: 'var(--shadow-sm)', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => setSelRep(null)} style={{ ...b2, padding: '6px 12px', fontSize: 13 }}>← BACK</button>
          <img src={storeTheme?.logo || '/logo.png'} alt="Performance East Inc." style={{ height: 30, objectFit: 'contain' }} />
          <div style={{ width: 1, height: 28, background: 'var(--border-primary)' }} />
          <div>
            <div style={{ fontFamily: FH, fontSize: 17, fontWeight: 700, color: 'var(--brand-red)', letterSpacing: 1, lineHeight: 1 }}>{rep?.name?.toUpperCase()}</div>
            <div style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 2 }}>MY DASHBOARD · {MONTHS[month].toUpperCase()} {year}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ v: uRep.total, l: 'UNITS', c: 'var(--brand-red)' }, { v: '$' + sf.totalSpiffs, l: 'SPIFFS', c: '#16a34a' }].map((s) => (
            <div key={s.l} style={{ background: 'var(--bg-primary)', borderRadius: 6, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontFamily: FM, fontSize: 14, fontWeight: 700, color: s.c }}>{s.v}</span>
              <span style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)' }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 20px 40px' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {UNIT_TYPES.map((t) => (
            <div key={t} style={{ ...card, flex: 1, minWidth: 60, textAlign: 'center', padding: '10px 6px' }}>
              <div style={{ fontFamily: FH, fontSize: 22, fontWeight: 700, color: UNIT_COLORS[t], lineHeight: 1 }}>{uRep[t]}</div>
              <div style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)', letterSpacing: 1, marginTop: 3 }}>{t}</div>
            </div>
          ))}
          <StatCard label="PG&A" value={'$' + sf.totalPga} accent="#d97706" />
          <StatCard label="BACK END" value={'$' + sf.totalBe} accent="#16a34a" />
          <StatCard label="HIT LIST" value={'$' + sf.totalHit} accent="#7c3aed" />
          <StatCard label="TOTAL" value={'$' + sf.totalSpiffs} accent="var(--brand-red)" />
        </div>
        <div style={{ ...card, marginBottom: 16 }}>
          <div style={cH}>MY INTERNET LEADS (ISM CONVERSIONS)</div>
          <div style={{ padding: '10px 16px', display: 'flex', gap: 20, fontFamily: FM, fontSize: 11, color: 'var(--text-secondary)' }}>
            <span>Assigned: <b style={{ color: 'var(--text-primary)' }}>{rl.length}</b></span>
            <span>Showed: <b style={{ color: 'var(--text-primary)' }}>{rl.filter((l) => l.showed).length}</b></span>
            <span>Sold: <b style={{ color: '#16a34a' }}>{rl.filter((l) => l.sold).length}</b></span>
          </div>
        </div>
        {repContests.length > 0 && (
          <div style={{ ...card, marginBottom: 16 }}>
            <div style={cH}>CONTESTS WON</div>
            <div style={{ padding: 14 }}>{repContests.map((c) => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-secondary)' }}>
                <div><span style={{ fontFamily: FH, fontWeight: 600 }}>{c.name}</span><span style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)', marginLeft: 8 }}>{c.description}</span></div>
                <span style={{ fontFamily: FM, fontWeight: 700, color: '#16a34a' }}>${c.prize}</span>
              </div>
            ))}</div>
          </div>
        )}
        <div style={card}>
          <div style={cH}>DEAL & SPIFF BREAKDOWN</div>
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Date', 'Customer', 'Deal #', 'Units', 'PG&A', 'PG&A $', 'BE $', 'Hit $', 'Total $'].map((h) => <th key={h} style={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {sf.deals.length === 0 && <tr><td colSpan={9} style={{ ...TD, padding: 30, textAlign: 'center', color: 'var(--text-muted)', fontFamily: FM, fontSize: 11 }}>NO DEALS YET</td></tr>}
                {sf.deals.sort((a, b) => (a.date || '').localeCompare(b.date || '')).map((d) => {
                  const ts = d.pgaSpiff + d.beSpiff + d.hitSpiff;
                  return (
                    <tr key={d.id}>
                      <td style={{ ...TD, fontFamily: FM, fontSize: 11 }}>{d.date || '—'}</td>
                      <td style={{ ...TD, fontWeight: 600 }}>{d.customer || '—'}</td>
                      <td style={{ ...TD, fontFamily: FM, fontSize: 11, color: 'var(--text-muted)' }}>{d.dealNumber || '—'}</td>
                      <td style={{ ...TD, fontFamily: FM, fontWeight: 700, color: 'var(--brand-red)', textAlign: 'center' }}>{d.unitCount}</td>
                      <td style={{ ...TD, fontFamily: FM }}>{d.pgaAmount ? '$' + d.pgaAmount.toLocaleString() : '—'}</td>
                      <td style={{ ...TD, fontFamily: FM, fontWeight: 700, color: d.pgaSpiff > 0 ? '#d97706' : 'var(--text-muted)' }}>{d.pgaSpiff > 0 ? '$' + d.pgaSpiff : '—'}</td>
                      <td style={{ ...TD, fontFamily: FM, fontWeight: 700, color: d.beSpiff > 0 ? '#16a34a' : 'var(--text-muted)' }}>{d.beSpiff > 0 ? '$' + d.beSpiff : '—'}</td>
                      <td style={{ ...TD, fontFamily: FM, fontWeight: 700, color: d.hitSpiff > 0 ? '#7c3aed' : 'var(--text-muted)' }}>{d.hitSpiff > 0 ? '$' + d.hitSpiff : '—'}</td>
                      <td style={{ ...TD, fontFamily: FH, fontWeight: 700, fontSize: 14, color: 'var(--brand-red)', textAlign: 'center' }}>${ts}</td>
                    </tr>
                  );
                })}
                {sf.deals.length > 0 && (
                  <tr style={{ background: 'var(--bg-tertiary)', borderTop: '2px solid var(--brand-red)' }}>
                    <td colSpan={5} style={{ ...TD, fontFamily: FH, fontWeight: 700, letterSpacing: 1, fontSize: 11 }}>TOTALS</td>
                    <td style={{ ...TD, fontFamily: FH, fontWeight: 700, color: '#d97706' }}>${sf.totalPga}</td>
                    <td style={{ ...TD, fontFamily: FH, fontWeight: 700, color: '#16a34a' }}>${sf.totalBe}</td>
                    <td style={{ ...TD, fontFamily: FH, fontWeight: 700, color: '#7c3aed' }}>${sf.totalHit}</td>
                    <td style={{ ...TD, fontFamily: FH, fontWeight: 700, fontSize: 16, color: 'var(--brand-red)', textAlign: 'center' }}>${sf.totalSpiffs}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid var(--border-primary)', padding: '10px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 10, fontFamily: FM, letterSpacing: 1 }}>{storeTheme?.footer || 'PERFORMANCE EAST INC · SALES GOAL TRACKER · GOLDSBORO, NC'}</div>
    </div>
  );
}
