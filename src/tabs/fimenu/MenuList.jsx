import React, { useState } from 'react';
import { MENU_STATUSES } from '../../lib/fiMenuConstants';
import { styles, FM, FH } from '../../components/SharedUI';

const { card, cardHead: cH, input: inp, btn1: b1, btn2: b2, th: TH, td: TD } = styles;

export default function MenuList({ fiMenus, onEdit, onPresent, onDelete, act }) {
  const [search, setSearch] = useState('');

  const filtered = (fiMenus || []).filter((m) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (m.customer || '').toLowerCase().includes(s)
      || (m.dealNumber || '').toLowerCase().includes(s)
      || (m.vin || '').toLowerCase().includes(s)
      || (m.make || '').toLowerCase().includes(s)
      || (m.model || '').toLowerCase().includes(s);
  }).sort((a, b) => (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || ''));

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inp, maxWidth: 400, padding: '8px 12px' }} placeholder="Search customer, deal #, VIN, make, model..." />
      </div>

      <div style={card}>
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{'\uD83D\uDCCB'}</div>
            <div style={{ fontFamily: FH, fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>NO FINANCE MENUS</div>
            <div style={{ fontFamily: FM, fontSize: 11, color: 'var(--text-muted)' }}>Click "+ NEW MENU" to build your first finance presentation.</div>
          </div>
        ) : (
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Date', 'Customer', 'Unit', 'Rep', 'Status', 'Package', 'Payment', ''].map((h) => <th key={h} style={TH}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  const status = MENU_STATUSES[m.status] || MENU_STATUSES.draft;
                  const rep = (act || []).find((a) => a.id === m.salesperson);
                  return (
                    <tr key={m.id}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--row-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ ...TD, fontFamily: FM, fontSize: 11 }}>{m.date || '\u2014'}</td>
                      <td style={{ ...TD, fontFamily: FH, fontWeight: 600 }}>{m.customer || '\u2014'}</td>
                      <td style={{ ...TD, fontFamily: FM, fontSize: 11, color: 'var(--text-secondary)' }}>
                        {m.year && m.make ? `${m.year} ${m.make} ${m.model || ''}`.trim() : '\u2014'}
                      </td>
                      <td style={{ ...TD, fontFamily: FM, fontSize: 11 }}>{rep?.name?.split(' ')[0] || '\u2014'}</td>
                      <td style={TD}>
                        <span style={{
                          fontFamily: FM, fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 3,
                          background: status.bg, color: status.color,
                        }}>{status.label}</span>
                      </td>
                      <td style={{ ...TD, fontFamily: FM, fontSize: 11, color: 'var(--text-secondary)' }}>
                        {m.selectedPackage || '\u2014'}
                      </td>
                      <td style={{ ...TD, fontFamily: FH, fontWeight: 700, color: 'var(--brand-red)' }}>
                        {m.monthlyPayment > 0 ? '$' + m.monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '/mo' : '\u2014'}
                      </td>
                      <td style={{ ...TD, whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => onEdit(m)} style={{ ...b2, padding: '3px 10px', fontSize: 9 }}>EDIT</button>
                          <button onClick={() => onPresent(m)} style={{ ...b1, padding: '3px 10px', fontSize: 9 }}>PRESENT</button>
                          <button onClick={() => { if (confirm(`Delete menu for ${m.customer}?`)) onDelete(m.id); }} style={{
                            background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13,
                          }}>{'\u2715'}</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>
        {filtered.length} menu{filtered.length !== 1 ? 's' : ''}{search ? ' matching search' : ''}
      </div>
    </div>
  );
}
