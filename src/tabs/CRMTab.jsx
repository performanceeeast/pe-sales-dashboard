import React, { useState, useEffect, useCallback } from 'react';
import { loadCustomers, saveCustomer, deleteCustomer, loadInteractions, saveInteraction, loadReminders, saveReminder, completeReminder } from '../lib/storage';
import { canSeeAllCustomers } from '../lib/auth';
import { Modal, styles, FM, FH } from '../components/SharedUI';

const { card, cardHead: cH, input: inp, btn1: b1, btn2: b2, th: TH, td: TD } = styles;

// ── Two pipelines ──
const PIPELINE_INTERNET = 'internet';
const PIPELINE_FLOOR = 'floor';

const PIPELINES = {
  [PIPELINE_INTERNET]: {
    label: 'INTERNET LEADS',
    color: '#0284c7',
    sources: ['WEBSITE', 'FACEBOOK'],
    stages: [
      { id: 'contacted', label: 'CONTACTED', color: '#0284c7' },
      { id: 'conversation', label: 'CONVERSATION', color: '#2563eb' },
      { id: 'appt_set', label: 'APPT SET', color: '#d97706' },
      { id: 'appt_showed', label: 'APPT SHOWED', color: '#16a34a' },
    ],
    convertStage: 'appt_showed',
    convertLabel: 'CONVERT TO ISM TRACKER',
  },
  [PIPELINE_FLOOR]: {
    label: 'FLOOR LEADS',
    color: '#7c3aed',
    sources: ['WALK-IN', 'PHONE', 'REFERRAL', 'OTHER'],
    stages: [
      { id: 'initial_contact', label: 'INITIAL CONTACT', color: '#7c3aed' },
      { id: 'quoted', label: 'QUOTED', color: '#2563eb' },
      { id: 'negotiations', label: 'NEGOTIATIONS', color: '#d97706' },
      { id: 'sold', label: 'SOLD', color: '#16a34a' },
      { id: 'delivered', label: 'DELIVERED', color: '#059669' },
    ],
    convertStage: 'delivered',
    convertLabel: 'CONVERT TO DEAL',
  },
};

const ALL_SOURCES = ['WEBSITE', 'FACEBOOK', 'WALK-IN', 'PHONE', 'REFERRAL', 'OTHER'];

const INTERACTION_TYPES = [
  { id: 'call', label: 'Phone Call', icon: '📞' },
  { id: 'text', label: 'Text', icon: '💬' },
  { id: 'visit', label: 'Visit', icon: '🏪' },
  { id: 'email', label: 'Email', icon: '📧' },
  { id: 'note', label: 'Note', icon: '📝' },
];

const FORMAT_FIELDS = [
  { id: 'format_family', label: 'Family', placeholder: 'Married, kids who ride, family trail riding...' },
  { id: 'format_occupation', label: 'Occupation', placeholder: 'Construction, farming, factory schedule...' },
  { id: 'format_recreation', label: 'Recreation', placeholder: 'Hunts, rides at Busco, camping...' },
  { id: 'format_motivation', label: 'Motivation', placeholder: 'More power, utility for land, riding with friends...' },
  { id: 'format_animals', label: 'Animals', placeholder: 'Horses, fence lines, dogs, animal transport...' },
  { id: 'format_teams', label: 'Teams/Transport', placeholder: 'NC State fan, rides with group, truck/trailer setup...' },
];

function getPipeline(source) {
  if (PIPELINES[PIPELINE_INTERNET].sources.includes(source)) return PIPELINE_INTERNET;
  return PIPELINE_FLOOR;
}

function getStagesForPipeline(pipelineId) {
  return PIPELINES[pipelineId]?.stages || PIPELINES[PIPELINE_FLOOR].stages;
}

const emptyCustomer = {
  first_name: '', last_name: '', phone: '', email: '',
  address_line1: '', city: '', state: 'NC', zip: '',
  format_family: '', format_occupation: '', format_recreation: '',
  format_motivation: '', format_animals: '', format_teams: '',
  unit_of_interest: '', stock_number: '', lead_source: 'WALK-IN',
  status: '', notes: '', assigned_to: '',
};

export default function CRMTab({ currentUser, act, onConvertDeal }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [interactions, setInteractions] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ ...emptyCustomer });
  const [search, setSearch] = useState('');
  const [filterPipeline, setFilterPipeline] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRep, setFilterRep] = useState('');
  const [intNote, setIntNote] = useState('');
  const [intType, setIntType] = useState('call');
  const [remDate, setRemDate] = useState('');
  const [remNote, setRemNote] = useState('');
  const [remType, setRemType] = useState('follow_up');
  const [converted, setConverted] = useState(null);

  const canSeeAll = canSeeAllCustomers(currentUser);

  const refresh = useCallback(async () => {
    setLoading(true);
    const filters = {};
    if (!canSeeAll) filters.assigned_to = currentUser.id;
    const data = await loadCustomers(filters);
    setCustomers(data);
    setLoading(false);
  }, [currentUser, canSeeAll]);

  useEffect(() => { refresh(); }, [refresh]);

  // Client-side filtering
  const filtered = customers.filter((c) => {
    if (filterPipeline) {
      const pl = getPipeline(c.lead_source);
      if (pl !== filterPipeline) return false;
    }
    if (filterStatus && c.status !== filterStatus) return false;
    if (filterRep && c.assigned_to !== filterRep) return false;
    if (search) {
      const s = search.toLowerCase();
      const match = (c.first_name + ' ' + c.last_name).toLowerCase().includes(s)
        || (c.phone || '').includes(s)
        || (c.unit_of_interest || '').toLowerCase().includes(s)
        || (c.stock_number || '').toLowerCase().includes(s);
      if (!match) return false;
    }
    return true;
  });

  // Stage counts for active pipeline filter
  const activePipelineStages = filterPipeline ? getStagesForPipeline(filterPipeline) : [];
  const stageCounts = {};
  activePipelineStages.forEach((s) => {
    stageCounts[s.id] = customers.filter((c) => getPipeline(c.lead_source) === filterPipeline && c.status === s.id).length;
  });

  async function openCustomer(cust) {
    setSelected(cust);
    setConverted(null);
    const [ints, rems] = await Promise.all([
      loadInteractions(cust.id),
      loadReminders(cust.assigned_to || currentUser.id),
    ]);
    setInteractions(ints);
    setReminders(rems.filter((r) => r.customer_id === cust.id));
  }

  async function handleSaveCustomer() {
    const pipeline = getPipeline(form.lead_source);
    const defaultStatus = PIPELINES[pipeline].stages[0].id;
    const cust = {
      ...form,
      status: form.status || defaultStatus,
      created_by: currentUser.id,
      assigned_to: form.assigned_to || currentUser.id,
    };
    const saved = await saveCustomer(cust);
    setModal(null);
    setForm({ ...emptyCustomer });
    await refresh();
    if (saved?.id) openCustomer(saved);
  }

  async function handleUpdate(updates) {
    const updated = { ...selected, ...updates };
    const saved = await saveCustomer(updated);
    setSelected(saved);
    await refresh();
  }

  async function handleLogInteraction() {
    if (!intNote.trim()) return;
    await saveInteraction({ customer_id: selected.id, user_id: currentUser.id, type: intType, notes: intNote.trim() });
    setIntNote('');
    setInteractions(await loadInteractions(selected.id));
  }

  async function handleAddReminder() {
    if (!remDate) return;
    await saveReminder({ customer_id: selected.id, user_id: selected.assigned_to || currentUser.id, due_date: remDate, reminder_type: remType, notes: remNote });
    setRemDate(''); setRemNote('');
    const rems = await loadReminders(selected.assigned_to || currentUser.id);
    setReminders(rems.filter((r) => r.customer_id === selected.id));
  }

  async function handleCompleteRem(id) {
    const n = prompt('Completion notes:');
    if (n === null) return;
    await completeReminder(id, n);
    const rems = await loadReminders(selected.assigned_to || currentUser.id);
    setReminders(rems.filter((r) => r.customer_id === selected.id));
  }

  function handleConvert() {
    const c = selected;
    const pipeline = getPipeline(c.lead_source);
    if (pipeline === PIPELINE_FLOOR && onConvertDeal) {
      // Convert to deal — pass customer data up to App
      onConvertDeal({
        customer: c.first_name + ' ' + c.last_name,
        customer_id: c.id,
        salesperson: c.assigned_to,
        unit_of_interest: c.unit_of_interest,
        stock_number: c.stock_number,
      });
      setConverted('deal');
    } else if (pipeline === PIPELINE_INTERNET) {
      setConverted('ism');
    }
  }

  // ═══ DETAIL VIEW ═══
  if (selected) {
    const c = selected;
    const pipeline = getPipeline(c.lead_source);
    const pl = PIPELINES[pipeline];
    const stages = pl.stages;
    const currentStageIdx = stages.findIndex((s) => s.id === c.status);
    const currentStage = stages[currentStageIdx] || stages[0];
    const isConvertStage = c.status === pl.convertStage;
    const assignedRep = act.find((a) => a.id === c.assigned_to);
    const formatCount = FORMAT_FIELDS.filter((f) => c[f.id] && c[f.id].trim()).length;
    const overdueRems = reminders.filter((r) => !r.completed && new Date(r.due_date) < new Date());

    return (
      <div>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <button onClick={() => setSelected(null)} style={{ ...b2, padding: '6px 14px' }}>BACK</button>
          <div style={{ flex: 1, minWidth: 150 }}>
            <div style={{ fontFamily: FH, fontSize: 18, fontWeight: 700 }}>{c.first_name} {c.last_name}</div>
            <div style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)' }}>
              {c.phone}{c.email ? ' · ' + c.email : ''} · <span style={{ color: pl.color, fontWeight: 700 }}>{pl.label}</span>
            </div>
          </div>
          <select value={c.assigned_to || ''} onChange={(e) => handleUpdate({ assigned_to: e.target.value })} style={{ ...inp, width: 'auto', padding: '6px 10px', fontSize: 11 }}>
            <option value="">— Assign Rep —</option>
            {act.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>

        {/* Stage pipeline */}
        <div style={{ display: 'flex', gap: 3, marginBottom: 14 }}>
          {stages.map((s, idx) => {
            const active = s.id === c.status;
            const past = idx < currentStageIdx;
            return (
              <button key={s.id} onClick={() => handleUpdate({ status: s.id })} style={{
                flex: 1, padding: '8px 4px', borderRadius: 4, border: 'none', cursor: 'pointer',
                background: active ? s.color : past ? s.color + '30' : 'var(--bg-primary)',
                color: active ? 'var(--text-inverse)' : past ? s.color : 'var(--text-muted)',
                fontFamily: FH, fontSize: 9, fontWeight: 700, letterSpacing: 0.5, transition: 'all .15s',
              }}>{s.label}</button>
            );
          })}
        </div>

        {/* Convert banner */}
        {isConvertStage && !converted && (
          <div style={{ background: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: 8, padding: '12px 16px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: FM, fontSize: 11, color: '#16a34a', fontWeight: 700 }}>READY TO CONVERT — {pl.convertLabel}</span>
            <button onClick={handleConvert} style={{ ...b1, background: '#16a34a', padding: '6px 16px', fontSize: 10 }}>{pl.convertLabel}</button>
          </div>
        )}
        {converted === 'deal' && (
          <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 16px', marginBottom: 14, fontFamily: FM, fontSize: 11, color: '#16a34a', fontWeight: 700 }}>
            CONVERTED TO DEAL — Go to the DEALS tab to complete the deal entry.
          </div>
        )}
        {converted === 'ism' && (
          <div style={{ background: '#dbeafe', border: '1px solid #bfdbfe', borderRadius: 8, padding: '12px 16px', marginBottom: 14, fontFamily: FM, fontSize: 11, color: '#2563eb', fontWeight: 700 }}>
            APPOINTMENT SHOWED — This lead will appear in the INTERNET SALES tracker.
          </div>
        )}

        {/* Overdue alert */}
        {overdueRems.length > 0 && (
          <div style={{ background: '#fef2f2', border: '2px solid #fecaca', borderRadius: 8, padding: '10px 16px', marginBottom: 14, fontFamily: FM, fontSize: 11, color: '#b91c1c', fontWeight: 700 }}>
            {overdueRems.length} OVERDUE FOLLOW-UP{overdueRems.length > 1 ? 'S' : ''} — ACTION REQUIRED
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {/* Left: Contact + FORMAT */}
          <div>
            <div style={{ ...card, marginBottom: 14 }}>
              <div style={cH}>CONTACT INFORMATION</div>
              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div><label style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>FIRST</label><input value={c.first_name} onChange={(e) => handleUpdate({ first_name: e.target.value })} style={inp} /></div>
                  <div><label style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>LAST</label><input value={c.last_name} onChange={(e) => handleUpdate({ last_name: e.target.value })} style={inp} /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div><label style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>PHONE</label><input value={c.phone || ''} onChange={(e) => handleUpdate({ phone: e.target.value })} style={inp} /></div>
                  <div><label style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>EMAIL</label><input value={c.email || ''} onChange={(e) => handleUpdate({ email: e.target.value })} style={inp} /></div>
                </div>
                <div><label style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>ADDRESS</label><input value={c.address_line1 || ''} onChange={(e) => handleUpdate({ address_line1: e.target.value })} style={inp} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8 }}>
                  <div><label style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>CITY</label><input value={c.city || ''} onChange={(e) => handleUpdate({ city: e.target.value })} style={inp} /></div>
                  <div><label style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>ST</label><input value={c.state || 'NC'} onChange={(e) => handleUpdate({ state: e.target.value })} style={inp} /></div>
                  <div><label style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>ZIP</label><input value={c.zip || ''} onChange={(e) => handleUpdate({ zip: e.target.value })} style={inp} /></div>
                </div>
              </div>
            </div>

            <div style={{ ...card, marginBottom: 14 }}>
              <div style={cH}>UNIT & LEAD INFO</div>
              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
                  <div><label style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>UNIT OF INTEREST</label><input value={c.unit_of_interest || ''} onChange={(e) => handleUpdate({ unit_of_interest: e.target.value })} style={inp} /></div>
                  <div><label style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>STOCK #</label><input value={c.stock_number || ''} onChange={(e) => handleUpdate({ stock_number: e.target.value })} style={inp} /></div>
                </div>
                <div><label style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>SOURCE</label>
                  <select value={c.lead_source || 'WALK-IN'} onChange={(e) => {
                    const newSource = e.target.value;
                    const newPipeline = getPipeline(newSource);
                    const newStatus = PIPELINES[newPipeline].stages[0].id;
                    handleUpdate({ lead_source: newSource, status: newStatus });
                  }} style={inp}>
                    {ALL_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div><label style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>NOTES</label><textarea value={c.notes || ''} onChange={(e) => handleUpdate({ notes: e.target.value })} style={{ ...inp, minHeight: 60, resize: 'vertical' }} /></div>
              </div>
            </div>

            <div style={card}>
              <div style={{ ...cH, background: '#fefce8', borderBottomColor: '#fde68a', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#d97706' }}>FORMAT NOTES</span>
                <span style={{ fontFamily: FM, fontSize: 10, color: formatCount >= 2 ? '#16a34a' : '#b91c1c', fontWeight: 700 }}>{formatCount}/6</span>
              </div>
              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {FORMAT_FIELDS.map((f) => (
                  <div key={f.id}>
                    <label style={{ fontFamily: FM, fontSize: 8, color: '#d97706', display: 'block', marginBottom: 2, fontWeight: 700 }}>{f.label.toUpperCase()}</label>
                    <input value={c[f.id] || ''} onChange={(e) => handleUpdate({ [f.id]: e.target.value })} style={inp} placeholder={f.placeholder} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Interactions + Reminders */}
          <div>
            <div style={{ ...card, marginBottom: 14 }}>
              <div style={cH}>LOG INTERACTION</div>
              <div style={{ padding: 14 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
                  {INTERACTION_TYPES.map((t) => (
                    <button key={t.id} onClick={() => setIntType(t.id)} style={{
                      padding: '5px 10px', borderRadius: 4, border: intType === t.id ? '2px solid var(--brand-red)' : '1px solid var(--border-primary)',
                      background: intType === t.id ? '#fef2f2' : 'var(--card-bg)', fontFamily: FM, fontSize: 10,
                      fontWeight: intType === t.id ? 700 : 400, color: intType === t.id ? 'var(--brand-red)' : 'var(--text-secondary)', cursor: 'pointer',
                    }}>{t.icon} {t.label}</button>
                  ))}
                </div>
                <textarea value={intNote} onChange={(e) => setIntNote(e.target.value)} style={{ ...inp, minHeight: 60, resize: 'vertical', marginBottom: 8 }} placeholder="Notes from the interaction..." />
                <button onClick={handleLogInteraction} style={{ ...b1, width: '100%' }}>LOG {INTERACTION_TYPES.find((t) => t.id === intType)?.label?.toUpperCase()}</button>
              </div>
            </div>

            <div style={{ ...card, marginBottom: 14 }}>
              <div style={{ ...cH, background: overdueRems.length > 0 ? '#fef2f2' : '#eff6ff', borderBottomColor: overdueRems.length > 0 ? '#fecaca' : '#bfdbfe' }}>
                <span style={{ color: overdueRems.length > 0 ? '#b91c1c' : '#2563eb' }}>REMINDERS & FOLLOW-UPS</span>
              </div>
              <div style={{ padding: 14 }}>
                {reminders.filter((r) => !r.completed).map((r) => {
                  const overdue = new Date(r.due_date) < new Date();
                  return (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', marginBottom: 6, borderRadius: 4, background: overdue ? '#fef2f2' : 'var(--bg-tertiary)', border: overdue ? '1px solid #fecaca' : '1px solid var(--border-primary)' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: FM, fontSize: 11, fontWeight: 600, color: overdue ? '#b91c1c' : 'var(--text-primary)' }}>{r.due_date} — {r.reminder_type?.replace('_', ' ').toUpperCase()}</div>
                        {r.notes && <div style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>{r.notes}</div>}
                      </div>
                      <button onClick={() => handleCompleteRem(r.id)} style={{ ...b1, padding: '4px 10px', fontSize: 9, background: '#16a34a' }}>DONE</button>
                    </div>
                  );
                })}
                <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: 10, marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div><label style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>DUE DATE</label><input type="date" value={remDate} onChange={(e) => setRemDate(e.target.value)} style={{ ...inp, width: 130 }} /></div>
                    <div><label style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>TYPE</label>
                      <select value={remType} onChange={(e) => setRemType(e.target.value)} style={{ ...inp, width: 110 }}>
                        <option value="follow_up">Follow-Up</option><option value="callback">Callback</option><option value="appointment">Appointment</option><option value="custom">Custom</option>
                      </select>
                    </div>
                    <input value={remNote} onChange={(e) => setRemNote(e.target.value)} style={{ ...inp, flex: 1, minWidth: 100 }} placeholder="Note..." />
                    <button onClick={handleAddReminder} style={{ ...b1, padding: '7px 14px', fontSize: 10 }}>SET</button>
                  </div>
                </div>
              </div>
            </div>

            <div style={card}>
              <div style={cH}>ACTIVITY LOG ({interactions.length})</div>
              <div style={{ maxHeight: 400, overflow: 'auto' }}>
                {interactions.length === 0 && <div style={{ padding: 20, textAlign: 'center', fontFamily: FM, fontSize: 11, color: 'var(--text-muted)' }}>NO INTERACTIONS</div>}
                {interactions.map((i) => {
                  const tObj = INTERACTION_TYPES.find((t) => t.id === i.type) || { icon: '📝', label: 'Note' };
                  const rep = act.find((a) => a.id === i.user_id);
                  return (
                    <div key={i.id} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-secondary)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontFamily: FM, fontSize: 10, fontWeight: 700 }}>{tObj.icon} {tObj.label}</span>
                        <span style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)' }}>
                          {new Date(i.created_at).toLocaleDateString()} {new Date(i.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {rep ? ' · ' + rep.name.split(' ')[0] : ''}
                        </span>
                      </div>
                      <div style={{ fontFamily: FM, fontSize: 11, color: 'var(--text-secondary)' }}>{i.notes}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══ LIST VIEW ═══
  return (
    <div>
      {/* Pipeline toggle */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <button onClick={() => { setFilterPipeline(''); setFilterStatus(''); }} style={{
          padding: '8px 16px', borderRadius: 4, border: !filterPipeline ? '2px solid var(--brand-red)' : '1px solid var(--border-primary)',
          background: !filterPipeline ? '#fef2f2' : 'var(--card-bg)', fontFamily: FH, fontSize: 11, fontWeight: 700,
          color: !filterPipeline ? 'var(--brand-red)' : 'var(--text-secondary)', cursor: 'pointer',
        }}>ALL LEADS ({customers.length})</button>
        {Object.entries(PIPELINES).map(([id, pl]) => {
          const count = customers.filter((c) => getPipeline(c.lead_source) === id).length;
          return (
            <button key={id} onClick={() => { setFilterPipeline(filterPipeline === id ? '' : id); setFilterStatus(''); }} style={{
              padding: '8px 16px', borderRadius: 4, border: filterPipeline === id ? `2px solid ${pl.color}` : '1px solid var(--border-primary)',
              background: filterPipeline === id ? pl.color + '15' : 'var(--card-bg)', fontFamily: FH, fontSize: 11, fontWeight: 700,
              color: pl.color, cursor: 'pointer',
            }}>{pl.label} ({count})</button>
          );
        })}
      </div>

      {/* Stage filter (when pipeline selected) */}
      {filterPipeline && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
          <button onClick={() => setFilterStatus('')} style={{
            padding: '5px 10px', borderRadius: 4, border: !filterStatus ? '1px solid var(--text-primary)' : '1px solid var(--border-primary)',
            background: !filterStatus ? 'var(--text-primary)' : 'var(--card-bg)', fontFamily: FM, fontSize: 10, fontWeight: 700,
            color: !filterStatus ? 'var(--text-inverse)' : 'var(--text-secondary)', cursor: 'pointer',
          }}>ALL</button>
          {activePipelineStages.map((s) => (
            <button key={s.id} onClick={() => setFilterStatus(filterStatus === s.id ? '' : s.id)} style={{
              padding: '5px 10px', borderRadius: 4, border: filterStatus === s.id ? `2px solid ${s.color}` : '1px solid var(--border-primary)',
              background: filterStatus === s.id ? s.color + '15' : 'var(--card-bg)', fontFamily: FM, fontSize: 10, fontWeight: 700,
              color: s.color, cursor: 'pointer',
            }}>{s.label} ({stageCounts[s.id] || 0})</button>
          ))}
        </div>
      )}

      {/* Search + filter + add */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inp, padding: '8px 12px' }} placeholder="Search name, phone, unit, stock #..." />
        </div>
        {canSeeAll && (
          <select value={filterRep} onChange={(e) => setFilterRep(e.target.value)} style={{ ...inp, width: 'auto', padding: '8px 10px', fontSize: 11 }}>
            <option value="">ALL REPS</option>
            {act.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        )}
        <button onClick={() => { setForm({ ...emptyCustomer, assigned_to: currentUser.id }); setModal('addCustomer'); }} style={b1}>+ NEW LEAD</button>
      </div>

      {/* Customer list */}
      <div style={card}>
        {loading ? (
          <div style={{ padding: 30, textAlign: 'center', fontFamily: FM, fontSize: 11, color: 'var(--text-muted)' }}>LOADING...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', fontFamily: FM, fontSize: 11, color: 'var(--text-muted)' }}>NO LEADS FOUND</div>
        ) : (
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Name', 'Phone', 'Unit', 'Source', 'Stage', 'Rep', 'Updated'].map((h) => <th key={h} style={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.map((c) => {
                  const pl = getPipeline(c.lead_source);
                  const stages = getStagesForPipeline(pl);
                  const stg = stages.find((s) => s.id === c.status) || stages[0];
                  const rep = act.find((a) => a.id === c.assigned_to);
                  return (
                    <tr key={c.id} onClick={() => openCustomer(c)} style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--row-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ ...TD, fontFamily: FH, fontWeight: 600 }}>{c.first_name} {c.last_name}</td>
                      <td style={{ ...TD, fontFamily: FM, fontSize: 11 }}>{c.phone || '—'}</td>
                      <td style={{ ...TD, fontFamily: FM, fontSize: 11, color: 'var(--text-secondary)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.unit_of_interest || '—'}</td>
                      <td style={TD}>
                        <span style={{ fontFamily: FM, fontSize: 9, fontWeight: 700, color: PIPELINES[pl].color }}>{c.lead_source}</span>
                      </td>
                      <td style={TD}>
                        <span style={{ fontFamily: FM, fontSize: 9, fontWeight: 700, color: stg.color, background: stg.color + '15', padding: '2px 8px', borderRadius: 3 }}>{stg.label}</span>
                      </td>
                      <td style={{ ...TD, fontFamily: FM, fontSize: 11 }}>{rep?.name?.split(' ')[0] || <span style={{ color: '#fca5a5', fontWeight: 700 }}>UNASSIGNED</span>}</td>
                      <td style={{ ...TD, fontFamily: FM, fontSize: 10, color: 'var(--text-muted)' }}>{c.updated_at ? new Date(c.updated_at).toLocaleDateString() : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Lead Modal */}
      <Modal open={modal === 'addCustomer'} onClose={() => setModal(null)} title="New Lead" wide>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div><label style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>FIRST NAME</label><input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} style={inp} /></div>
            <div><label style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>LAST NAME</label><input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} style={inp} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div><label style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>PHONE</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inp} /></div>
            <div><label style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>EMAIL</label><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inp} /></div>
          </div>
          <div><label style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>UNIT OF INTEREST</label><input value={form.unit_of_interest} onChange={(e) => setForm({ ...form, unit_of_interest: e.target.value })} style={inp} placeholder="2025 Polaris General XP 1000" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <div><label style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>LEAD SOURCE</label>
              <select value={form.lead_source} onChange={(e) => setForm({ ...form, lead_source: e.target.value })} style={inp}>
                {ALL_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>ASSIGN TO</label>
              <select value={form.assigned_to || currentUser.id} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} style={inp}>
                <option value="">— Select Rep —</option>
                {act.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>STOCK #</label>
              <input value={form.stock_number} onChange={(e) => setForm({ ...form, stock_number: e.target.value })} style={inp} placeholder="Optional" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <button onClick={() => setModal(null)} style={b2}>CANCEL</button>
            <button onClick={handleSaveCustomer} style={b1}>CREATE LEAD</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
