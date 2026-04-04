import React from 'react';
import { UNIT_TYPES as DEFAULT_UNIT_TYPES, UNIT_COLORS } from '../lib/constants';
import { Modal, styles, FM, FH } from '../components/SharedUI';
import { GoalForm, PgaForm, BeForm, RepForm, HitForm, ContestForm } from '../components/Forms';

const { card, cardHead: cH, input: inp, btn1: b1, btn2: b2, th: TH, td: TD } = styles;

export default function GoalsTab({
  goals, tot, tTgt, pgaTiers, beSpiffs, hitList, contests, spList, act,
  modal, setModal, saveGoals, saveReps, savePga, saveBe, saveHL, saveCT,
  unitTypes: propUnitTypes,
}) {
  const UNIT_TYPES = propUnitTypes || DEFAULT_UNIT_TYPES;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontFamily: FH, fontSize: 14, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Goals, Spiffs & Contests</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setModal('reps')} style={b2}>MANAGE REPS</button>
          <button onClick={() => setModal('editGoals')} style={b1}>EDIT GOALS</button>
        </div>
      </div>

      {/* Goals Table */}
      <div style={{ ...card, marginBottom: 16, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['Unit Type', 'Target', 'Actual', '% to Goal', 'Payout', 'Stretch', '% Stretch', 'Stretch Pay'].map((h) => <th key={h} style={TH}>{h}</th>)}</tr></thead>
          <tbody>
            {UNIT_TYPES.map((u) => {
              const g = goals[u] || {}; const p = g.target > 0 ? tot[u] / g.target : 0; const sp = g.stretch > 0 ? tot[u] / g.stretch : 0;
              return (
                <tr key={u}>
                  <td style={{ ...TD, fontFamily: FH, fontWeight: 700, color: UNIT_COLORS[u], letterSpacing: 1 }}>{u}</td>
                  <td style={{ ...TD, fontFamily: FM }}>{g.target}</td>
                  <td style={{ ...TD, fontFamily: FM, fontWeight: 700 }}>{tot[u]}</td>
                  <td style={TD}><span style={{ fontFamily: FM, fontWeight: 700, color: p >= 1 ? '#16a34a' : p >= 0.75 ? '#d97706' : 'var(--brand-red)' }}>{(p * 100).toFixed(0)}%</span></td>
                  <td style={{ ...TD, fontFamily: FM, color: 'var(--text-muted)' }}>${g.payout}</td>
                  <td style={{ ...TD, fontFamily: FM }}>{g.stretch}</td>
                  <td style={TD}><span style={{ fontFamily: FM, fontWeight: 700, color: sp >= 1 ? '#16a34a' : 'var(--text-muted)' }}>{(sp * 100).toFixed(0)}%</span></td>
                  <td style={{ ...TD, fontFamily: FM, color: 'var(--text-muted)' }}>${g.stretchPayout}</td>
                </tr>
              );
            })}
            <tr style={{ background: 'var(--bg-tertiary)', borderTop: '2px solid var(--brand-red)' }}>
              <td style={{ ...TD, fontFamily: FH, fontWeight: 700, letterSpacing: 1 }}>TOTAL</td>
              <td style={{ ...TD, fontFamily: FM, fontWeight: 700 }}>{tTgt}</td>
              <td style={{ ...TD, fontFamily: FH, fontWeight: 700, fontSize: 15, color: 'var(--brand-red)' }}>{tot.total}</td>
              <td style={TD}><span style={{ fontFamily: FM, fontWeight: 700, color: tot.total >= tTgt ? '#16a34a' : 'var(--brand-red)' }}>{tTgt > 0 ? (tot.total / tTgt * 100).toFixed(0) : 0}%</span></td>
              <td colSpan={4} />
            </tr>
          </tbody>
        </table>
        <div style={{ padding: '10px 16px', fontFamily: FM, fontSize: 10, color: 'var(--text-muted)', borderTop: '1px solid var(--border-secondary)' }}>MUST SELL 15% OF GOAL CATEGORY TO QUALIFY FOR THAT TARGET PAYOUT</div>
      </div>

      {/* Spiff Cards */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ ...card, flex: 1, minWidth: 240 }}>
          <div style={{ ...cH, display: 'flex', justifyContent: 'space-between' }}><span>PG&A FLATS</span><button onClick={() => setModal('editPga')} style={{ background: 'none', border: 'none', fontFamily: FM, fontSize: 9, color: 'var(--brand-red)', cursor: 'pointer', fontWeight: 700 }}>EDIT</button></div>
          <div style={{ padding: 14 }}>{pgaTiers.map((t, i) => (<div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border-secondary)', fontSize: 12 }}><span style={{ fontFamily: FM, fontSize: 11 }}>${t.min.toLocaleString()} – {t.max >= 999999 ? '$10,000+' : '$' + t.max.toLocaleString()}</span><span style={{ fontFamily: FM, fontWeight: 700, color: '#16a34a' }}>${t.amount}</span></div>))}</div>
        </div>
        <div style={{ ...card, flex: 1, minWidth: 240 }}>
          <div style={{ ...cH, display: 'flex', justifyContent: 'space-between' }}><span>BACK END SPIFFS</span><button onClick={() => setModal('editBe')} style={{ background: 'none', border: 'none', fontFamily: FM, fontSize: 9, color: 'var(--brand-red)', cursor: 'pointer', fontWeight: 700 }}>EDIT</button></div>
          <div style={{ padding: 14 }}>{beSpiffs.map((s, i) => (<div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border-secondary)', fontSize: 12 }}><span>{s.product}</span><span style={{ fontFamily: FM, fontWeight: 700, color: '#16a34a' }}>${s.amount}</span></div>))}</div>
        </div>
      </div>

      {/* Hit List */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ ...cH, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#faf5ff', borderBottomColor: '#e9d5ff' }}>
          <span style={{ color: '#7c3aed' }}>🎯 AGED INVENTORY HIT LIST</span>
          <button onClick={() => setModal('addHit')} style={{ ...b1, background: '#7c3aed', padding: '5px 12px', fontSize: 10 }}>+ ADD UNIT</button>
        </div>
        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Stock #', 'Year/Make/Model', 'Days', 'Spiff', 'Sold By', 'Deal #', 'Status', ''].map((h) => <th key={h} style={{ ...TH, background: '#faf5ff' }}>{h}</th>)}</tr></thead>
            <tbody>
              {hitList.length === 0 && <tr><td colSpan={8} style={{ ...TD, padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontFamily: FM, fontSize: 11 }}>{'\uD83C\uDFAF'} No aged units on the hit list. Click <strong style={{ color: '#7c3aed' }}>+ ADD UNIT</strong> to add one.</td></tr>}
              {hitList.map((h) => (
                <tr key={h.id}>
                  <td style={{ ...TD, fontFamily: FM, fontWeight: 700 }}>{h.stockNumber || '—'}</td>
                  <td style={{ ...TD, fontWeight: 600 }}>{h.description || '—'}</td>
                  <td style={{ ...TD, fontFamily: FM }}>{h.daysOld || '—'}</td>
                  <td style={{ ...TD, fontFamily: FM, fontWeight: 700, color: '#7c3aed' }}>${h.spiff || 0}</td>
                  <td style={TD}>{h.soldBy ? (spList.find((s) => s.id === h.soldBy)?.name?.split(' ')[0] || '—') : (<select value="" onChange={(e) => saveHL(hitList.map((x) => x.id === h.id ? { ...x, soldBy: e.target.value, sold: true } : x))} style={{ ...inp, width: 'auto', padding: '3px 6px', fontSize: 11 }}><option value="">Unsold</option>{act.map((s) => <option key={s.id} value={s.id}>{s.name.split(' ')[0]}</option>)}</select>)}</td>
                  <td style={TD}>{h.soldBy ? (<input value={h.dealNumber || ''} onChange={(e) => saveHL(hitList.map((x) => x.id === h.id ? { ...x, dealNumber: e.target.value } : x))} style={{ ...inp, width: 90, padding: '3px 6px', fontSize: 11 }} placeholder="Deal #" />) : '—'}</td>
                  <td style={TD}><span style={{ fontFamily: FM, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 3, background: h.sold ? '#dcfce7' : '#fef3c7', color: h.sold ? '#16a34a' : '#d97706' }}>{h.sold ? 'SOLD' : 'ACTIVE'}</span></td>
                  <td style={TD}><button onClick={() => { if (confirm(`Remove ${h.description || h.stockNumber || 'this unit'} from hit list?`)) saveHL(hitList.filter((x) => x.id !== h.id)); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contests */}
      <div style={card}>
        <div style={{ ...cH, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fefce8', borderBottomColor: '#fde68a' }}>
          <span style={{ color: '#d97706' }}>🏆 MONTHLY CONTESTS</span>
          <button onClick={() => setModal('addContest')} style={{ ...b1, background: '#d97706', padding: '5px 12px', fontSize: 10 }}>+ ADD CONTEST</button>
        </div>
        {contests.length === 0 && <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)', fontFamily: FM, fontSize: 11 }}>{'\uD83C\uDFC6'} No contests this month. Click <strong style={{ color: '#d97706' }}>+ ADD CONTEST</strong> to create one.</div>}
        {contests.map((c) => (
          <div key={c.id} style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div><div style={{ fontFamily: FH, fontSize: 14, fontWeight: 700 }}>{c.name}</div>{c.description && <div style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>{c.description}</div>}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontFamily: FM, fontWeight: 700, color: '#d97706', fontSize: 14 }}>${c.prize}</span><button onClick={() => { if (confirm(`Delete contest "${c.name}"?`)) saveCT(contests.filter((x) => x.id !== c.id)); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>✕</button></div>
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', marginRight: 6 }}>WINNERS:</span>
              {act.map((s) => {
                const won = c.winners?.includes(s.id);
                return (<button key={s.id} onClick={() => { const nw = won ? (c.winners || []).filter((w) => w !== s.id) : [...(c.winners || []), s.id]; saveCT(contests.map((x) => x.id === c.id ? { ...x, winners: nw } : x)); }} style={{ padding: '3px 10px', borderRadius: 3, border: won ? '2px solid #d97706' : '1px solid var(--border-primary)', background: won ? '#fefce8' : 'var(--card-bg)', fontFamily: FM, fontSize: 10, fontWeight: won ? 700 : 500, color: won ? '#d97706' : 'var(--text-muted)', cursor: 'pointer' }}>{won ? '🏆 ' : ''}{s.name.split(' ')[0]}</button>);
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      <Modal open={modal === 'editGoals'} onClose={() => setModal(null)} title="Edit Monthly Goals"><GoalForm goals={goals} onSave={saveGoals} onCancel={() => setModal(null)} unitTypes={UNIT_TYPES} /></Modal>
      <Modal open={modal === 'reps'} onClose={() => setModal(null)} title="Manage Salespeople"><RepForm reps={spList} onSave={saveReps} onCancel={() => setModal(null)} /></Modal>
      <Modal open={modal === 'editPga'} onClose={() => setModal(null)} title="Edit PG&A Flat Tiers"><PgaForm tiers={pgaTiers} onSave={savePga} onCancel={() => setModal(null)} /></Modal>
      <Modal open={modal === 'editBe'} onClose={() => setModal(null)} title="Edit Back End Spiffs"><BeForm spiffs={beSpiffs} onSave={saveBe} onCancel={() => setModal(null)} /></Modal>
      <Modal open={modal === 'addHit'} onClose={() => setModal(null)} title="Add Unit to Hit List"><HitForm onSave={(h) => { saveHL([...hitList, { ...h, id: Date.now().toString(), sold: false, soldBy: null, dealNumber: '' }]); setModal(null); }} onCancel={() => setModal(null)} /></Modal>
      <Modal open={modal === 'addContest'} onClose={() => setModal(null)} title="Add Monthly Contest"><ContestForm onSave={(c) => { saveCT([...contests, { ...c, id: Date.now().toString(), winners: [] }]); setModal(null); }} onCancel={() => setModal(null)} /></Modal>
    </div>
  );
}
