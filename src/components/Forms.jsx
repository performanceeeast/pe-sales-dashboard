import React, { useState } from 'react';
import { UNIT_TYPES as DEFAULT_UNIT_TYPES, UNIT_COLORS, LEAD_SOURCES, BACK_END_PRODUCTS as DEFAULT_BE_PRODUCTS, STAR_CHECKLIST } from '../lib/constants';
import { styles, FM, FH } from './SharedUI';

const { input: inp, btn1: b1, btn2: b2, label: lbl } = styles;

/* ═══ Deal Form (single page) ═══ */
export function DealForm({ spList, onSave, onCancel, pgaTiers, editDeal, unitTypes: propUnitTypes, backEndProducts: propBEProducts, beSpiffs }) {
  const UNIT_TYPES = propUnitTypes || DEFAULT_UNIT_TYPES;
  const BACK_END_PRODUCTS = propBEProducts || DEFAULT_BE_PRODUCTS;
  const spiffMap = Object.fromEntries((beSpiffs || []).map(s => [s.product, s.amount]));
  const [f, sF] = useState(editDeal ? { ...editDeal } : {
    date: new Date().toISOString().split('T')[0],
    customer: '', salesperson: '', dealNumber: '',
    units: Object.fromEntries(UNIT_TYPES.map(u => [u, 0])),
    pgaAmount: 0, backEndProducts: [],
    starChecklist: Object.fromEntries(STAR_CHECKLIST.map(s => [s.id, false])),
    followUpDate: '', referralNames: '', referralDeclined: false, signoffs: {},
  });

  const u = (k, v) => sF((p) => ({ ...p, [k]: v }));
  const uu = (t, v) => sF((p) => ({ ...p, units: { ...p.units, [t]: Math.max(0, parseInt(v) || 0) } }));
  const toggleBE = (prod) => sF((p) => {
    const bp = (p.backEndProducts || []).slice();
    const i = bp.indexOf(prod);
    if (i >= 0) bp.splice(i, 1); else bp.push(prod);
    return { ...p, backEndProducts: bp };
  });
  const toggleStar = (id) => sF((p) => ({ ...p, starChecklist: { ...(p.starChecklist || {}), [id]: !(p.starChecklist || {})[id] } }));

  const amt = f.pgaAmount || 0;
  const tier = pgaTiers.find((t) => amt >= t.min && amt <= t.max);
  const uc = UNIT_TYPES.reduce((s, t) => s + (f.units?.[t] || 0), 0);
  const sc = f.starChecklist || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Deal info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div><label style={lbl}>DATE</label><input type="date" value={f.date} onChange={(e) => u('date', e.target.value)} style={inp} /></div>
        <div><label style={lbl}>DEAL #</label><input value={f.dealNumber} onChange={(e) => u('dealNumber', e.target.value)} style={inp} placeholder="4008XXX" /></div>
      </div>
      <div><label style={lbl}>CUSTOMER NAME</label><input value={f.customer} onChange={(e) => u('customer', e.target.value)} style={inp} placeholder="LAST, FIRST" /></div>
      <div><label style={lbl}>SALESPERSON</label>
        <select value={f.salesperson} onChange={(e) => u('salesperson', e.target.value)} style={{ ...inp, borderColor: !f.salesperson ? '#d97706' : undefined }}>
          <option value="">— Select Rep —</option>
          {spList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Units */}
      <div>
        <label style={lbl}>UNITS SOLD</label>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${UNIT_TYPES.length}, 1fr)`, gap: 6 }}>
          {UNIT_TYPES.map((t) => (
            <div key={t} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: FM, fontSize: 9, color: UNIT_COLORS[t], fontWeight: 700, marginBottom: 3 }}>{t}</div>
              <input type="number" min="0" value={f.units?.[t] || 0} onChange={(e) => uu(t, e.target.value)} style={{ ...inp, textAlign: 'center', padding: '7px 4px' }} />
            </div>
          ))}
        </div>
      </div>

      {/* PG&A */}
      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: 14 }}>
        <label style={{ ...lbl, color: '#d97706' }}>PARTS & LABOR AMOUNT (PER UNIT)</label>
        <input type="number" min="0" value={f.pgaAmount || ''} onChange={(e) => u('pgaAmount', parseInt(e.target.value) || 0)} style={inp} placeholder="Dollar amount" />
        {tier && amt > 0 && (
          <div style={{ fontFamily: FM, fontSize: 10, color: '#d97706', marginTop: 6 }}>
            FLAT: <strong>${tier.amount}</strong> x {uc} unit{uc !== 1 ? 's' : ''} = <strong>${tier.amount * uc}</strong>
          </div>
        )}
      </div>

      {/* Back End Products */}
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: 14 }}>
        <label style={{ ...lbl, color: '#16a34a' }}>BACK END PRODUCTS (F&I DOCUMENTED)</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
          {BACK_END_PRODUCTS.length === 0 && (
            <div style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)', padding: '6px 0' }}>No back-end spiffs configured. Add products in Manager &gt; Goals &amp; Spiffs.</div>
          )}
          {BACK_END_PRODUCTS.map((p) => {
            const sel = (f.backEndProducts || []).includes(p);
            const spiffAmt = spiffMap[p];
            return (
              <button key={p} onClick={() => toggleBE(p)} type="button" style={{
                padding: '6px 12px', borderRadius: 4,
                border: sel ? '2px solid #16a34a' : '1px solid var(--border-primary)',
                background: sel ? '#dcfce7' : 'var(--card-bg)',
                fontFamily: FM, fontSize: 10, fontWeight: sel ? 700 : 500,
                color: sel ? '#16a34a' : 'var(--text-secondary)', cursor: 'pointer',
              }}>{sel ? '✓ ' : ''}{p}{spiffAmt ? ` ($${spiffAmt})` : ''}</button>
            );
          })}
        </div>
        {BACK_END_PRODUCTS.length > 0 && f.backEndProducts?.length === BACK_END_PRODUCTS.length && (
          <div style={{ fontFamily: FM, fontSize: 10, color: '#16a34a', marginTop: 6, fontWeight: 700 }}>ALL PRODUCTS — BONUS APPLIES! {spiffMap['ALL OF THE ABOVE'] ? `($${spiffMap['ALL OF THE ABOVE']} bonus)` : ''}</div>
        )}
      </div>

      {/* Delivery Checklist */}
      <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: 6, padding: 14 }}>
        <label style={{ ...lbl, color: '#d97706', marginBottom: 8 }}>DELIVERY CHECKLIST</label>
        {STAR_CHECKLIST.map((s) => {
          const checked = !!sc[s.id];
          const signoff = f.signoffs?.[s.id];
          const isDeferred = s.deferred;

          return (
            <div key={s.id} style={{ marginBottom: 6 }}>
              <div onClick={() => { if (!isDeferred) toggleStar(s.id); }} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 4, cursor: isDeferred ? 'default' : 'pointer',
                background: checked ? '#dcfce7' : isDeferred ? 'var(--bg-tertiary)' : 'var(--card-bg)',
                border: checked ? '1px solid #bbf7d0' : '1px solid var(--border-secondary)',
                opacity: isDeferred ? 0.7 : 1,
              }}>
                <span style={{ fontFamily: FM, fontSize: 14, color: checked ? '#16a34a' : 'var(--text-muted)' }}>{checked ? '✓' : '○'}</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontFamily: FM, fontSize: 11, color: checked ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: checked ? 600 : 400 }}>{s.label}</span>
                  {isDeferred && <div style={{ fontFamily: FM, fontSize: 9, color: '#d97706', marginTop: 1 }}>Completed after delivery — appears on dashboard for follow-up</div>}
                </div>
                {s.requiresSignoff && checked && !signoff && (
                  <span style={{ fontFamily: FM, fontSize: 8, fontWeight: 700, color: '#d97706', background: '#fef3c7', padding: '2px 6px', borderRadius: 3 }}>NEEDS SIGNOFF</span>
                )}
                {signoff && (
                  <span style={{ fontFamily: FM, fontSize: 8, fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '2px 6px', borderRadius: 3 }}>SIGNED</span>
                )}
              </div>

              {/* Parts/Service signoff */}
              {s.requiresSignoff && checked && (
                <div style={{ marginTop: 4, marginLeft: 28, padding: '8px 10px', borderRadius: 4, background: signoff ? '#f0fdf4' : '#fffbeb', border: signoff ? '1px solid #bbf7d0' : '1px solid #fde68a' }}>
                  {signoff ? (
                    <div style={{ fontFamily: FM, fontSize: 10, color: '#16a34a', fontWeight: 700 }}>
                      SIGNED: {signoff.name} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>({signoff.role}) {new Date(signoff.timestamp).toLocaleString()}</span>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontFamily: FM, fontSize: 9, color: '#d97706', fontWeight: 700, marginBottom: 4 }}>
                        Hand device to {s.signoffRole} team member to sign off
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                          <input id={`signoff-name-${s.id}`} style={inp} placeholder={`${s.signoffRole === 'parts' ? 'Parts' : 'Service'} team member name`} onClick={(e) => e.stopPropagation()} />
                        </div>
                        <button onClick={(e) => {
                          e.stopPropagation();
                          const name = document.getElementById(`signoff-name-${s.id}`)?.value?.trim();
                          if (!name) { alert('Enter name to sign off.'); return; }
                          sF((p) => ({ ...p, signoffs: { ...(p.signoffs || {}), [s.id]: { name, role: s.signoffRole, timestamp: new Date().toISOString() } } }));
                        }} style={{ ...b1, background: '#16a34a', padding: '6px 14px', fontSize: 10 }}>SIGN</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Referral details */}
              {s.id === 'referralRequest' && checked && (
                <div style={{ marginTop: 4, marginLeft: 28, padding: '6px 10px', borderRadius: 4, background: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: FM, fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: 4 }}>
                    <input type="checkbox" checked={f.referralDeclined || false} onChange={(e) => u('referralDeclined', e.target.checked)} /> Customer Declined
                  </label>
                  {!f.referralDeclined && (
                    <div><label style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>REFERRAL NAME(S)</label>
                    <input value={f.referralNames || ''} onChange={(e) => u('referralNames', e.target.value)} style={inp} placeholder="Name(s) provided" /></div>
                  )}
                </div>
              )}

              {/* 7-day follow-up date */}
              {s.deferred && (
                <div style={{ marginTop: 4, marginLeft: 28, padding: '6px 10px', borderRadius: 4, background: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <label style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)' }}>FOLLOW-UP DATE:</label>
                    <input type="date" value={f.followUpDate || ''} onChange={(e) => u('followUpDate', e.target.value)} style={{ ...inp, width: 150, padding: '4px 8px' }}
                      min={(() => { const d = new Date(f.date || Date.now()); d.setDate(d.getDate() + 7); return d.toISOString().split('T')[0]; })()} />
                    {!f.followUpDate && f.date && (
                      <button onClick={() => { const d = new Date(f.date); d.setDate(d.getDate() + 7); u('followUpDate', d.toISOString().split('T')[0]); }}
                        style={{ ...b2, padding: '4px 10px', fontSize: 9 }}>SET 7 DAYS</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={b2}>CANCEL</button>
        <button onClick={() => onSave(f)} style={b1}>{editDeal ? 'UPDATE DEAL' : 'SAVE DEAL'}</button>
      </div>
    </div>
  );
}

/* ═══ Lead Form ═══ */
export function LeadForm({ spList, onSave, onCancel, editLead }) {
  const [f, sF] = useState(editLead ? { ...editLead } : {
    leadDate: new Date().toISOString().split('T')[0], apptDate: '',
    customer: '', unitInterested: '', salesperson: spList[0]?.id || '', source: 'WEBSITE',
    showed: false, sold: false,
  });
  const u = (k, v) => sF((p) => ({ ...p, [k]: v }));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div><label style={lbl}>LEAD DATE</label><input type="date" value={f.leadDate} onChange={(e) => u('leadDate', e.target.value)} style={inp} /></div>
        <div><label style={lbl}>APPOINTMENT DATE</label><input type="date" value={f.apptDate} onChange={(e) => u('apptDate', e.target.value)} style={inp} /></div>
      </div>
      <div><label style={lbl}>CUSTOMER NAME</label><input value={f.customer} onChange={(e) => u('customer', e.target.value)} style={inp} placeholder="LAST, FIRST" /></div>
      <div><label style={lbl}>UNIT INTERESTED IN</label><input value={f.unitInterested || ''} onChange={(e) => u('unitInterested', e.target.value)} style={inp} placeholder="e.g. 2024 Polaris General XP 1000" /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div><label style={lbl}>ASSIGNED SALESPERSON</label>
          <select value={f.salesperson} onChange={(e) => u('salesperson', e.target.value)} style={{ ...inp, borderColor: !f.salesperson ? '#d97706' : undefined }}>
            <option value="">— Select Rep —</option>
            {spList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div><label style={lbl}>LEAD SOURCE</label><select value={f.source} onChange={(e) => u('source', e.target.value)} style={inp}>{LEAD_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={b2}>CANCEL</button>
        <button onClick={() => onSave(f)} style={{ ...b1, background: '#2563eb' }}>{editLead ? 'UPDATE APPOINTMENT' : 'SAVE APPOINTMENT'}</button>
      </div>
    </div>
  );
}

/* ═══ Hit List Form ═══ */
export function HitForm({ onSave, onCancel }) {
  const [f, sF] = useState({ stockNumber: '', description: '', daysOld: '', spiff: 0 });
  const u = (k, v) => sF((p) => ({ ...p, [k]: v }));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div><label style={lbl}>STOCK NUMBER</label><input value={f.stockNumber} onChange={(e) => u('stockNumber', e.target.value)} style={inp} placeholder="STK-12345" /></div>
        <div><label style={lbl}>DAYS ON LOT</label><input type="number" value={f.daysOld || ''} onChange={(e) => u('daysOld', parseInt(e.target.value) || 0)} style={inp} placeholder="120" /></div>
      </div>
      <div><label style={lbl}>YEAR / MAKE / MODEL</label><input value={f.description} onChange={(e) => u('description', e.target.value)} style={inp} placeholder="2024 Polaris General XP 1000" /></div>
      <div><label style={lbl}>SPIFF AMOUNT ($)</label><input type="number" value={f.spiff || ''} onChange={(e) => u('spiff', parseInt(e.target.value) || 0)} style={inp} placeholder="Enter flat spiff" /></div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={b2}>CANCEL</button>
        <button onClick={() => onSave(f)} style={{ ...b1, background: '#7c3aed' }}>ADD TO HIT LIST</button>
      </div>
    </div>
  );
}

/* ═══ Contest Form ═══ */
export function ContestForm({ onSave, onCancel }) {
  const [f, sF] = useState({ name: '', description: '', prize: 0 });
  const u = (k, v) => sF((p) => ({ ...p, [k]: v }));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div><label style={lbl}>CONTEST NAME</label><input value={f.name} onChange={(e) => u('name', e.target.value)} style={inp} placeholder="e.g. Most SxS Units Sold" /></div>
      <div><label style={lbl}>DESCRIPTION / RULES</label><input value={f.description} onChange={(e) => u('description', e.target.value)} style={inp} placeholder="Sell the most SxS units this month" /></div>
      <div><label style={lbl}>PRIZE AMOUNT ($)</label><input type="number" value={f.prize || ''} onChange={(e) => u('prize', parseInt(e.target.value) || 0)} style={inp} placeholder="500" /></div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={b2}>CANCEL</button>
        <button onClick={() => onSave(f)} style={{ ...b1, background: '#d97706' }}>ADD CONTEST</button>
      </div>
    </div>
  );
}

/* ═══ Goal Form ═══ */
export function GoalForm({ goals, onSave, onCancel, unitTypes: propUnitTypes }) {
  const UNIT_TYPES = propUnitTypes || DEFAULT_UNIT_TYPES;
  const [f, sF] = useState(JSON.parse(JSON.stringify(goals)));
  const u = (t, k, v) => sF((p) => ({ ...p, [t]: { ...p[t], [k]: parseInt(v) || 0 } }));
  return (
    <div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead><tr>{['Type', 'Target', 'Stretch', 'Payout', 'Stretch Pay'].map((h) => (
          <th key={h} style={{ padding: 6, textAlign: 'left', fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 0.8, textTransform: 'uppercase' }}>{h}</th>
        ))}</tr></thead>
        <tbody>{UNIT_TYPES.map((t) => (
          <tr key={t}>
            <td style={{ padding: 4, fontWeight: 700, color: UNIT_COLORS[t], fontFamily: FM, fontSize: 11 }}>{t}</td>
            {['target', 'stretch', 'payout', 'stretchPayout'].map((k) => (
              <td key={k} style={{ padding: 4 }}><input type="number" value={f[t]?.[k] || 0} onChange={(e) => u(t, k, e.target.value)} style={{ ...inp, width: 75, textAlign: 'center' }} /></td>
            ))}
          </tr>
        ))}</tbody>
      </table>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
        <button onClick={onCancel} style={b2}>CANCEL</button>
        <button onClick={() => onSave(f)} style={b1}>SAVE</button>
      </div>
    </div>
  );
}

/* ═══ PGA Tier Form ═══ */
export function PgaForm({ tiers, onSave, onCancel }) {
  const [f, sF] = useState(JSON.parse(JSON.stringify(tiers)));
  const u = (i, k, v) => { const n = f.slice(); n[i] = { ...n[i], [k]: parseInt(v) || 0 }; sF(n); };
  return (
    <div>
      {f.map((t, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontFamily: FM, fontSize: 10 }}>$</span>
          <input type="number" value={t.min} onChange={(e) => u(i, 'min', e.target.value)} style={{ ...inp, width: 75, textAlign: 'center' }} />
          <span style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)' }}>to $</span>
          <input type="number" value={t.max >= 999999 ? '' : t.max} onChange={(e) => u(i, 'max', e.target.value || 999999)} style={{ ...inp, width: 75, textAlign: 'center' }} placeholder="MAX" />
          <span style={{ fontFamily: FM, fontSize: 10 }}>= $</span>
          <input type="number" value={t.amount} onChange={(e) => u(i, 'amount', e.target.value)} style={{ ...inp, width: 60, textAlign: 'center' }} />
          <button onClick={() => sF(f.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>x</button>
        </div>
      ))}
      <button onClick={() => sF([...f, { min: 0, max: 0, amount: 0 }])} style={{ ...b2, marginBottom: 14, fontSize: 10 }}>+ ADD TIER</button>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={b2}>CANCEL</button>
        <button onClick={() => onSave(f)} style={b1}>SAVE</button>
      </div>
    </div>
  );
}

/* ═══ Back End Spiff Form ═══ */
export function BeForm({ spiffs, onSave, onCancel }) {
  const [f, sF] = useState(JSON.parse(JSON.stringify(spiffs)));
  const u = (i, k, v) => { const n = f.slice(); n[i] = { ...n[i], [k]: k === 'amount' ? (parseInt(v) || 0) : v }; sF(n); };
  return (
    <div>
      {f.map((s, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <input value={s.product} onChange={(e) => u(i, 'product', e.target.value)} style={{ ...inp, flex: 1 }} placeholder="Product name" />
          <span style={{ fontFamily: FM, fontSize: 10 }}>$</span>
          <input type="number" value={s.amount} onChange={(e) => u(i, 'amount', e.target.value)} style={{ ...inp, width: 60, textAlign: 'center' }} />
          <button onClick={() => sF(f.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>x</button>
        </div>
      ))}
      <button onClick={() => sF([...f, { product: '', amount: 0 }])} style={{ ...b2, marginBottom: 14, fontSize: 10 }}>+ ADD PRODUCT</button>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={b2}>CANCEL</button>
        <button onClick={() => onSave(f)} style={b1}>SAVE</button>
      </div>
    </div>
  );
}

/* ═══ Rep Management Form ═══ */
export function RepForm({ reps, onSave, onCancel }) {
  const [r, sR] = useState(JSON.parse(JSON.stringify(reps)));
  const [nn, sN] = useState('');
  function add() { if (nn.trim()) { sR([...r, { id: Date.now().toString(), name: nn.trim(), active: true }]); sN(''); } }
  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        {r.map((x) => (
          <div key={x.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border-secondary)' }}>
            <button onClick={() => sR(r.map((y) => y.id === x.id ? { ...y, active: !y.active } : y))} style={{
              background: x.active ? '#dcfce7' : '#fef2f2', border: 'none', borderRadius: 3,
              padding: '2px 10px', cursor: 'pointer', fontFamily: FM, fontSize: 10,
              fontWeight: 700, color: x.active ? '#16a34a' : '#b91c1c',
            }}>{x.active ? 'ACTIVE' : 'INACTIVE'}</button>
            <span style={{ flex: 1, fontFamily: FH, fontSize: 13, fontWeight: 600 }}>{x.name}</span>
            <button onClick={() => sR(r.filter((y) => y.id !== x.id))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>x</button>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <input value={nn} onChange={(e) => sN(e.target.value)} style={{ ...inp, flex: 1 }} placeholder="New salesperson name" onKeyDown={(e) => e.key === 'Enter' && add()} />
        <button onClick={add} style={b2}>ADD</button>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={b2}>CANCEL</button>
        <button onClick={() => onSave(r)} style={b1}>SAVE</button>
      </div>
    </div>
  );
}
