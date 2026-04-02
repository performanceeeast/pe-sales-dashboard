import React, { useState } from 'react';
import { MONTHS, UNIT_TYPES, UNIT_COLORS } from '../lib/constants';
import { canEditDeal } from '../lib/auth';
import { Modal, styles, FM, FH } from '../components/SharedUI';
import { DealForm } from '../components/Forms';

const { card, cardHead: cH, input: inp, btn1: b1, th: TH, td: TD } = styles;

export default function DealsTab({
  month, year, deals, spList, act, tot, pgaTiers,
  modal, setModal, addDeal, delDeal, updateDeal, currentUser,
}) {
  const [editingDeal, setEditingDeal] = useState(null);

  function handleEdit(deal) {
    if (!canEditDeal(currentUser, deal)) return;
    setEditingDeal(deal);
    setModal('editDeal');
  }

  function handleSaveEdit(updated) {
    updateDeal(updated.id, updated);
    setEditingDeal(null);
    setModal(null);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontFamily: FH, fontSize: 14, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Deal Log — {MONTHS[month].toUpperCase()} {year}</div>
        <button onClick={() => setModal('addDeal')} style={b1}>+ NEW DEAL</button>
      </div>
      <div style={{ ...card, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['Date', 'Customer', 'Rep', 'Deal #', ...UNIT_TYPES, 'PG&A', 'BE', 'Tot', ''].map((h) => <th key={h} style={TH}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {deals.length === 0 && (
              <tr><td colSpan={UNIT_TYPES.length + 8} style={{ ...TD, padding: 30, textAlign: 'center', color: 'var(--text-muted)', fontFamily: FM, fontSize: 11 }}>NO DEALS LOGGED</td></tr>
            )}
            {deals.slice().sort((a, b) => (a.date || '').localeCompare(b.date || '')).map((d) => {
              const s = spList.find((x) => x.id === d.salesperson);
              const rt = UNIT_TYPES.reduce((s2, u) => s2 + (d.units?.[u] || 0), 0);
              const editable = canEditDeal(currentUser, d);
              return (
                <tr key={d.id} style={{ cursor: editable ? 'pointer' : 'default' }} onClick={() => handleEdit(d)} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--row-hover)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ ...TD, fontFamily: FM, fontSize: 11 }}>{d.date || '—'}</td>
                  <td style={{ ...TD, fontWeight: 600 }}>{d.customer || '—'}</td>
                  <td style={TD}>{s?.name?.split(' ')[0] || '—'}</td>
                  <td style={{ ...TD, fontFamily: FM, fontSize: 11, color: 'var(--text-muted)' }}>{d.dealNumber || '—'}</td>
                  {UNIT_TYPES.map((u) => <td key={u} style={{ ...TD, textAlign: 'center', fontFamily: FM, fontWeight: 700, color: (d.units?.[u] || 0) > 0 ? UNIT_COLORS[u] : 'var(--border-primary)' }}>{d.units?.[u] || 0}</td>)}
                  <td style={{ ...TD, fontFamily: FM, fontSize: 11, color: d.pgaAmount > 0 ? '#d97706' : 'var(--border-primary)' }}>{d.pgaAmount ? '$' + d.pgaAmount.toLocaleString() : '—'}</td>
                  <td style={{ ...TD, fontSize: 10 }}>{d.backEndProducts?.length > 0 ? d.backEndProducts.length + 'p' : '—'}</td>
                  <td style={{ ...TD, textAlign: 'center', fontFamily: FH, fontWeight: 700, fontSize: 14, color: 'var(--brand-red)' }}>{rt}</td>
                  <td style={TD} onClick={(e) => e.stopPropagation()}>
                    {editable && <button onClick={(e) => { e.stopPropagation(); delDeal(d.id); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>✕</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>Click any deal row to edit (own deals only for salespeople)</div>

      <Modal open={modal === 'addDeal'} onClose={() => setModal(null)} title="Log a New Deal" wide>
        <DealForm spList={act} onSave={addDeal} onCancel={() => setModal(null)} pgaTiers={pgaTiers} />
      </Modal>

      <Modal open={modal === 'editDeal' && editingDeal} onClose={() => { setEditingDeal(null); setModal(null); }} title="Edit Deal" wide>
        {editingDeal && (
          <DealForm spList={act} onSave={handleSaveEdit} onCancel={() => { setEditingDeal(null); setModal(null); }} pgaTiers={pgaTiers} editDeal={editingDeal} />
        )}
      </Modal>
    </div>
  );
}
