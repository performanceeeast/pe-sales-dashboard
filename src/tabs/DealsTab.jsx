import React, { useState } from 'react';
import { MONTHS, UNIT_TYPES as DEFAULT_UNIT_TYPES, UNIT_COLORS } from '../lib/constants';
import { canEditDeal } from '../lib/auth';
import { Modal, styles, FM, FH } from '../components/SharedUI';
import { DealForm } from '../components/Forms';

const { card, cardHead: cH, input: inp, btn1: b1, th: TH, td: TD } = styles;

export default function DealsTab({
  month, year, deals, spList, act, tot, pgaTiers,
  modal, setModal, addDeal, delDeal, updateDeal, currentUser,
  unitTypes: propUnitTypes, backEndProducts, beSpiffs,
}) {
  const UNIT_TYPES = propUnitTypes || DEFAULT_UNIT_TYPES;
  // Only show back-end products that have a spiff set in Manager > Goals & Spiffs
  const spiffProductNames = (beSpiffs || []).filter(s => s.amount > 0 && s.product !== 'ALL OF THE ABOVE').map(s => s.product);
  const activeBackEndProducts = (backEndProducts || []).filter(p => spiffProductNames.includes(p));
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

  const sorted = deals.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 160px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontFamily: FH, fontSize: 14, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Deal Log — {MONTHS[month].toUpperCase()} {year}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)' }}>{deals.length} DEAL{deals.length !== 1 ? 'S' : ''}</span>
          <button onClick={() => setModal('addDeal')} style={b1}>+ NEW DEAL</button>
        </div>
      </div>

      {/* Desktop table view */}
      <div className="deals-table-view" style={{ ...card, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ position: 'sticky', top: 0, zIndex: 1 }}>{['Date', 'Customer', 'Rep', 'Deal #', ...UNIT_TYPES, 'P&L', 'BE', 'Tot', ''].map((h) => <th key={h} style={{ ...TH, position: 'sticky', top: 0, background: 'var(--bg-tertiary)' }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {deals.length === 0 && (
                <tr><td colSpan={UNIT_TYPES.length + 8} style={{ ...TD, padding: 80, textAlign: 'center', color: 'var(--text-muted)', fontFamily: FM, fontSize: 12 }}>
                  <div style={{ marginBottom: 8, fontSize: 28, opacity: 0.3 }}>📋</div>
                  No deals logged for {MONTHS[month]}. Click <strong style={{ color: 'var(--brand-red)' }}>+ NEW DEAL</strong> to get started.
                </td></tr>
              )}
              {sorted.map((d) => {
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
                      {editable && <button onClick={(e) => { e.stopPropagation(); if (confirm(`Delete deal for ${d.customer || 'this customer'}?`)) delDeal(d.id); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>✕</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>Click any deal row to edit (own deals only for salespeople)</div>

      <Modal open={modal === 'addDeal'} onClose={() => setModal(null)} title="Log a New Deal" wide>
        <DealForm spList={act} onSave={addDeal} onCancel={() => setModal(null)} pgaTiers={pgaTiers} unitTypes={UNIT_TYPES} backEndProducts={activeBackEndProducts} beSpiffs={beSpiffs} />
      </Modal>

      <Modal open={modal === 'editDeal' && editingDeal} onClose={() => { setEditingDeal(null); setModal(null); }} title="Edit Deal" wide>
        {editingDeal && (
          <DealForm spList={act} onSave={handleSaveEdit} onCancel={() => { setEditingDeal(null); setModal(null); }} pgaTiers={pgaTiers} editDeal={editingDeal} unitTypes={UNIT_TYPES} backEndProducts={activeBackEndProducts} beSpiffs={beSpiffs} />
        )}
      </Modal>

      <style>{`
        @media (max-width: 768px) {
          .deals-table-view table thead { display: none; }
          .deals-table-view table, .deals-table-view table tbody, .deals-table-view table tr, .deals-table-view table td {
            display: block; width: 100%;
          }
          .deals-table-view table tr {
            padding: 12px 14px; border-bottom: 1px solid var(--border-secondary);
            position: relative;
          }
          .deals-table-view table td {
            padding: 2px 0 !important; border: none !important; text-align: left !important;
          }
          .deals-table-view table td:before {
            font-family: ${FM}; font-size: 9px; color: var(--text-muted);
            letter-spacing: 0.5px; margin-right: 6px;
          }
        }
      `}</style>
    </div>
  );
}
