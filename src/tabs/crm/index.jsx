import React, { useState, useEffect, useCallback, useRef } from 'react';
import { loadCustomers, saveCustomer, deleteCustomer, loadInteractions, saveInteraction, loadReminders, saveReminder, completeReminder } from '../../lib/storage';
import { canSeeAllCustomers, canDeleteCustomer } from '../../lib/auth';
import { Modal, styles, FM, FH } from '../../components/SharedUI';
import { useNotifications } from '../../contexts/NotificationContext';
import FormatNotes, { FORMAT_FIELDS } from './FormatNotes';
import CRMKanbanView from './CRMKanbanView';
import CRMFunnelView from './CRMFunnelView';
import { processInteraction, processStageChange, processNewLead, DEFAULT_SEQUENCES, getNextSequenceStep } from '../../lib/crmAutomation';
import { showLocalNotification, isPushSupported, requestPermission, getPermissionState } from '../../lib/pushNotifications';

const { card, cardHead: cH, input: inp, btn1: b1, btn2: b2, th: TH, td: TD } = styles;

// ── Two pipelines ──
const PIPELINE_INTERNET = 'internet';
const PIPELINE_FLOOR = 'floor';

// Dead stage shared across pipelines
const DEAD_STAGE = { id: 'dead', label: 'DEAD', color: '#6b7280' };

const PIPELINES = {
  [PIPELINE_INTERNET]: {
    label: 'INTERNET LEADS', color: '#0284c7',
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
    label: 'FLOOR LEADS', color: '#7c3aed',
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

// Default follow-up days per stage (configurable by managers)
const DEFAULT_STAGE_FOLLOWUP_DAYS = {
  contacted: 1,
  conversation: 2,
  appt_set: 0, // same day — confirm appointment
  appt_showed: 1,
  initial_contact: 1,
  quoted: 2,
  negotiations: 1,
  sold: 3,
  delivered: 7,
};

const FOLLOWUP_STORAGE_KEY = 'peg-stage-followup-days';

function loadFollowupDays() {
  try { return { ...DEFAULT_STAGE_FOLLOWUP_DAYS, ...JSON.parse(localStorage.getItem(FOLLOWUP_STORAGE_KEY)) }; }
  catch { return { ...DEFAULT_STAGE_FOLLOWUP_DAYS }; }
}

function saveFollowupDays(days) {
  try { localStorage.setItem(FOLLOWUP_STORAGE_KEY, JSON.stringify(days)); } catch {}
}

const DEAD_REASONS = [
  'No response after multiple attempts',
  'Bought elsewhere',
  'Not in market anymore',
  'Budget issue',
  'Wrong contact info',
  'Duplicate lead',
  'Other',
];

const ALL_SOURCES = ['WEBSITE', 'FACEBOOK', 'WALK-IN', 'PHONE', 'REFERRAL', 'OTHER'];

const INTERACTION_TYPES = [
  { id: 'call', label: 'Phone Call', icon: '\uD83D\uDCDE' },
  { id: 'text', label: 'Text', icon: '\uD83D\uDCAC' },
  { id: 'visit', label: 'Visit', icon: '\uD83C\uDFEA' },
  { id: 'email', label: 'Email', icon: '\uD83D\uDCE7' },
  { id: 'note', label: 'Note', icon: '\uD83D\uDCDD' },
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
  next_step: '', next_step_date: '',
  dead_reason: '', dead_requested_by: '', dead_reviewed: false,
};

export default function CRMTab({ currentUser, act, onConvertDeal }) {
  const { addNotification } = useNotifications();
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
  const [crmView, setCrmView] = useState('list'); // 'list' | 'kanban' | 'funnel'
  const [followupDays, setFollowupDays] = useState(loadFollowupDays);
  const [showFollowupConfig, setShowFollowupConfig] = useState(false);
  const [deadModal, setDeadModal] = useState(false);
  const [deadReason, setDeadReason] = useState('');
  const [deadReasonCustom, setDeadReasonCustom] = useState('');
  const [filterDead, setFilterDead] = useState(false);
  const [importModal, setImportModal] = useState(false);
  const [importData, setImportData] = useState(null);
  const [importPreview, setImportPreview] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const canSeeAll = canSeeAllCustomers(currentUser);
  const canDel = canDeleteCustomer(currentUser);

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
  // Count dead leads for the badge
  const deadLeads = customers.filter((c) => c.status === 'dead');
  const deadNeedsReview = deadLeads.filter((c) => !c.dead_reviewed);

  const filtered = customers.filter((c) => {
    // Dead lead filtering
    if (filterDead) return c.status === 'dead';
    if (!filterDead && c.status === 'dead') return false;

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

    // Auto-create "contact new lead" reminders
    if (saved?.id) {
      const autoReminders = processNewLead(null, saved);
      for (const rem of autoReminders) {
        await saveReminder(rem);
      }
      openCustomer(saved);
    }
  }

  // Debounced save — update local state instantly, save to DB after 800ms of no typing
  const saveTimerRef = useRef(null);

  function handleUpdate(updates) {
    const updated = { ...selected, ...updates };
    setSelected(updated);

    // Clear any pending save
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    // Schedule save after 800ms idle
    saveTimerRef.current = setTimeout(async () => {
      await saveCustomer(updated);
      refresh(); // refresh list in background, don't await
    }, 800);
  }

  // Flush any pending save when leaving detail view or unmounting
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  async function handleStageChange(customer, newStageId) {
    const oldStage = customer.status;
    const updated = { ...customer, status: newStageId };
    await saveCustomer(updated);
    addNotification({
      icon: '\uD83D\uDD04',
      title: `${customer.first_name} ${customer.last_name} moved to ${newStageId.replace('_', ' ').toUpperCase()}`,
      body: `Stage changed from ${oldStage?.replace('_', ' ') || 'new'}`,
      action: { tab: 'crm' },
    });

    // Auto-create reminders based on stage change rules
    const autoReminders = processStageChange(null, newStageId, updated);
    for (const rem of autoReminders) {
      await saveReminder(rem);
    }

    if (getPermissionState() === 'granted') {
      showLocalNotification('Stage updated', `${customer.first_name} ${customer.last_name} → ${newStageId.replace('_', ' ').toUpperCase()}`);
    }

    await refresh();
  }

  async function handleLogInteraction() {
    if (!intNote.trim()) return;
    await saveInteraction({ customer_id: selected.id, user_id: currentUser.id, type: intType, notes: intNote.trim() });
    setIntNote('');
    setInteractions(await loadInteractions(selected.id));

    const typeName = INTERACTION_TYPES.find((t) => t.id === intType)?.label || intType;
    addNotification({
      icon: INTERACTION_TYPES.find((t) => t.id === intType)?.icon || '\uD83D\uDCDD',
      title: `Logged ${typeName} with ${selected.first_name} ${selected.last_name}`,
      action: { tab: 'crm' },
    });

    // Auto-create follow-up reminders based on automation rules
    const autoReminders = processInteraction(null, intType, selected);
    for (const rem of autoReminders) {
      await saveReminder(rem);
    }
    if (autoReminders.length > 0) {
      const rems = await loadReminders(selected.assigned_to || currentUser.id);
      setReminders(rems.filter((r) => r.customer_id === selected.id));
      addNotification({
        icon: '\u23F0',
        title: `Auto follow-up set for ${selected.first_name} ${selected.last_name}`,
        body: `${autoReminders.length} reminder(s) created`,
        action: { tab: 'crm' },
      });
    }

    // Push notification
    if (getPermissionState() === 'granted') {
      showLocalNotification(`${typeName} logged`, `${selected.first_name} ${selected.last_name} — ${intNote.trim().substring(0, 60)}`);
    }
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
      onConvertDeal({
        customer: c.first_name + ' ' + c.last_name,
        customer_id: c.id,
        salesperson: c.assigned_to,
        unit_of_interest: c.unit_of_interest,
        stock_number: c.stock_number,
      });
      setConverted('deal');
      addNotification({
        icon: '\uD83C\uDF89',
        title: `${c.first_name} ${c.last_name} converted to DEAL`,
        action: { tab: 'deals' },
      });
    } else if (pipeline === PIPELINE_INTERNET) {
      setConverted('ism');
    }
  }

  async function handleDeleteCustomer(cust) {
    const name = cust.first_name + ' ' + cust.last_name;
    if (!confirm(`Delete "${name}" permanently? This cannot be undone.`)) return;
    await deleteCustomer(cust.id);
    setSelected(null);
    await refresh();
  }

  // Mark lead as dead (salesperson requests, manager reviews)
  async function handleMarkDead() {
    const reason = deadReason === 'Other' ? deadReasonCustom : deadReason;
    if (!reason.trim()) return;
    await saveCustomer({
      ...selected,
      status: 'dead',
      dead_reason: reason,
      dead_requested_by: currentUser.id,
      dead_reviewed: false,
    });
    addNotification({
      icon: '\u26D4',
      title: `${selected.first_name} ${selected.last_name} marked DEAD`,
      body: reason,
      action: { tab: 'crm' },
    });
    setDeadModal(false);
    setDeadReason('');
    setDeadReasonCustom('');
    setSelected(null);
    await refresh();
  }

  // Manager: approve dead lead (confirm it stays dead)
  async function handleApproveDead(cust) {
    await saveCustomer({ ...cust, dead_reviewed: true });
    await refresh();
  }

  // Manager: revive a dead lead back to first stage
  async function handleReviveLead(cust) {
    const pipeline = getPipeline(cust.lead_source);
    const firstStage = PIPELINES[pipeline].stages[0].id;
    await saveCustomer({
      ...cust,
      status: firstStage,
      dead_reason: '',
      dead_requested_by: '',
      dead_reviewed: false,
      next_step: 'Re-engage — revived from dead leads',
      next_step_date: new Date().toISOString().split('T')[0],
    });
    addNotification({
      icon: '\u267B\uFE0F',
      title: `${cust.first_name} ${cust.last_name} revived`,
      body: `Moved back to ${firstStage.replace('_', ' ').toUpperCase()}`,
      action: { tab: 'crm' },
    });
    await refresh();
  }

  // ── CSV Import ──
  function handleCSVFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) { alert('CSV must have a header row and at least one data row.'); return; }
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'));
      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
        const row = {};
        headers.forEach((h, idx) => { row[h] = vals[idx] || ''; });
        rows.push(row);
      }
      setImportData({ headers, rows });
      setImportPreview(rows.slice(0, 5));
    };
    reader.readAsText(file);
  }

  // Column mapping from common CSV headers to our fields
  function mapCSVRow(row) {
    const get = (...keys) => {
      for (const k of keys) { if (row[k] && row[k].trim()) return row[k].trim(); }
      return '';
    };
    return {
      first_name: get('first_name', 'first', 'firstname', 'fname', 'given_name'),
      last_name: get('last_name', 'last', 'lastname', 'lname', 'surname', 'family_name'),
      phone: get('phone', 'phone_number', 'mobile', 'cell', 'telephone', 'primary_phone'),
      email: get('email', 'email_address', 'e_mail'),
      address_line1: get('address', 'address_line1', 'street', 'address1', 'street_address'),
      city: get('city', 'town'),
      state: get('state', 'st', 'province') || 'NC',
      zip: get('zip', 'zipcode', 'zip_code', 'postal', 'postal_code'),
      unit_of_interest: get('unit', 'unit_of_interest', 'vehicle', 'model', 'product', 'interest'),
      stock_number: get('stock', 'stock_number', 'stock_no', 'sku'),
      lead_source: get('source', 'lead_source', 'origin') || 'OTHER',
      notes: get('notes', 'note', 'comments', 'comment'),
      assigned_to: currentUser.id,
      status: '',
    };
  }

  async function handleImport() {
    if (!importData?.rows?.length) return;
    setImporting(true);
    let imported = 0;
    let skipped = 0;
    for (const row of importData.rows) {
      const mapped = mapCSVRow(row);
      if (!mapped.first_name && !mapped.last_name && !mapped.phone) { skipped++; continue; }
      const pipeline = getPipeline(mapped.lead_source.toUpperCase().includes('WEB') || mapped.lead_source.toUpperCase().includes('FACE') ? 'WEBSITE' : mapped.lead_source);
      mapped.lead_source = ALL_SOURCES.includes(mapped.lead_source.toUpperCase()) ? mapped.lead_source.toUpperCase() : 'OTHER';
      mapped.status = PIPELINES[pipeline].stages[0].id;
      mapped.created_by = currentUser.id;
      await saveCustomer(mapped);
      imported++;
    }
    setImporting(false);
    setImportResult({ imported, skipped });
    await refresh();
  }

  // ═══ DETAIL VIEW ═══
  if (selected) {
    const c = selected;
    const pipeline = getPipeline(c.lead_source);
    const pl = PIPELINES[pipeline];
    const stages = pl.stages;
    const currentStageIdx = stages.findIndex((s) => s.id === c.status);
    const isConvertStage = c.status === pl.convertStage;
    const overdueRems = reminders.filter((r) => !r.completed && new Date(r.due_date) < new Date());

    return (
      <div>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <button onClick={async () => {
            // Flush pending save before navigating back
            if (saveTimerRef.current) {
              clearTimeout(saveTimerRef.current);
              await saveCustomer(selected);
              refresh();
            }
            setSelected(null);
          }} style={{ ...b2, padding: '6px 14px' }}>BACK</button>
          <div style={{ flex: 1, minWidth: 150 }}>
            <div style={{ fontFamily: FH, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{c.first_name} {c.last_name}</div>
            <div style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)' }}>
              {c.phone}{c.email ? ' \u00B7 ' + c.email : ''} \u00B7 <span style={{ color: pl.color, fontWeight: 700 }}>{pl.label}</span>
            </div>
          </div>
          <select value={c.assigned_to || ''} onChange={(e) => handleUpdate({ assigned_to: e.target.value })} style={{ ...inp, width: 'auto', padding: '6px 10px', fontSize: 11 }}>
            <option value="">— Assign Rep —</option>
            {act.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          {canDel && (
            <button onClick={() => handleDeleteCustomer(c)} style={{
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6,
              padding: '6px 12px', cursor: 'pointer', fontFamily: FM, fontSize: 9,
              fontWeight: 700, color: '#b91c1c', letterSpacing: 0.5, transition: 'all .15s',
            }}>DELETE</button>
          )}
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

        {/* Dead lead banner */}
        {c.status === 'dead' && (
          <div style={{ background: '#f3f4f6', border: '2px solid #9ca3af', borderRadius: 8, padding: '12px 16px', marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ fontFamily: FH, fontSize: 13, fontWeight: 700, color: '#6b7280' }}>{'\u26D4'} DEAD LEAD {c.dead_reviewed ? '(CONFIRMED)' : '— PENDING MANAGER REVIEW'}</div>
                <div style={{ fontFamily: FM, fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Reason: {c.dead_reason || 'Not specified'}</div>
                {c.dead_requested_by && <div style={{ fontFamily: FM, fontSize: 9, color: '#9ca3af' }}>Requested by: {act.find((a) => a.id === c.dead_requested_by)?.name || 'Unknown'}</div>}
              </div>
              {canDel && (
                <div style={{ display: 'flex', gap: 6 }}>
                  {!c.dead_reviewed && (
                    <button onClick={() => handleApproveDead(c)} style={{ ...b1, background: '#6b7280', padding: '6px 14px', fontSize: 10 }}>CONFIRM DEAD</button>
                  )}
                  <button onClick={() => handleReviveLead(c)} style={{ ...b1, background: '#16a34a', padding: '6px 14px', fontSize: 10 }}>REVIVE LEAD</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ NEXT STEP — ALWAYS VISIBLE ═══ */}
        {c.status !== 'dead' && (
          <div style={{
            ...card, marginBottom: 14,
            border: !c.next_step?.trim() ? '2px solid #d97706' : '1px solid var(--border-primary)',
            background: !c.next_step?.trim() ? '#fffbeb' : 'var(--card-bg)',
          }}>
            <div style={{
              ...cH,
              background: !c.next_step?.trim() ? '#fef3c7' : '#f0fdf4',
              borderBottomColor: !c.next_step?.trim() ? '#fde68a' : '#bbf7d0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ color: !c.next_step?.trim() ? '#d97706' : '#16a34a' }}>
                {!c.next_step?.trim() ? '\u26A0\uFE0F NEXT STEP REQUIRED' : '\u2705 NEXT STEP'}
              </span>
              {c.next_step_date && <span style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)' }}>Due: {c.next_step_date}</span>}
            </div>
            <div style={{ padding: 14 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <input
                    value={c.next_step || ''}
                    onChange={(e) => handleUpdate({ next_step: e.target.value })}
                    style={{ ...inp, fontWeight: 600, fontSize: 13 }}
                    placeholder="What's the next action? (e.g., Call to discuss financing, Send quote, Schedule test ride...)"
                  />
                </div>
                <div style={{ minWidth: 130 }}>
                  <label style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>NEXT STEP DATE</label>
                  <input
                    type="date"
                    value={c.next_step_date || ''}
                    onChange={(e) => handleUpdate({ next_step_date: e.target.value })}
                    style={inp}
                  />
                </div>
              </div>
              {!c.next_step?.trim() && (
                <div style={{ fontFamily: FM, fontSize: 10, color: '#d97706', marginTop: 6, fontWeight: 600 }}>
                  Every lead must have a defined next step. What action are you taking next?
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mark Dead button for salespeople (appears before detail grid) */}
        {c.status !== 'dead' && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <button onClick={() => { setDeadReason(''); setDeadReasonCustom(''); setDeadModal(true); }} style={{
              background: 'none', border: '1px solid #9ca3af', borderRadius: 4,
              padding: '4px 12px', cursor: 'pointer', fontFamily: FM, fontSize: 9,
              fontWeight: 600, color: '#9ca3af', transition: 'all .15s',
            }}>{'\u26D4'} MARK DEAD — REQUEST REVIEW</button>
          </div>
        )}

        <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {/* Left: FORMAT (PROMINENT!) + Contact + Unit info */}
          <div>
            {/* FORMAT NOTES — TOP OF LEFT COLUMN */}
            <FormatNotes customer={c} onUpdate={handleUpdate} />

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
                {/* Quick-log buttons */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
                  {['Left VM', 'No Answer', 'Sent Quote', 'Sent Info', 'Scheduled Appt', 'Customer Will Call Back'].map((q) => (
                    <button key={q} onClick={() => setIntNote(q)} style={{
                      padding: '3px 8px', borderRadius: 3, border: '1px solid var(--border-primary)',
                      background: intNote === q ? 'var(--brand-red-soft)' : 'var(--card-bg)',
                      fontFamily: FM, fontSize: 9, color: 'var(--text-secondary)', cursor: 'pointer',
                    }}>{q}</button>
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
                  const tObj = INTERACTION_TYPES.find((t) => t.id === i.type) || { icon: '\uD83D\uDCDD', label: 'Note' };
                  const rep = act.find((a) => a.id === i.user_id);
                  return (
                    <div key={i.id} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-secondary)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontFamily: FM, fontSize: 10, fontWeight: 700, color: 'var(--text-primary)' }}>{tObj.icon} {tObj.label}</span>
                        <span style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)' }}>
                          {new Date(i.created_at).toLocaleDateString()} {new Date(i.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {rep ? ' \u00B7 ' + rep.name.split(' ')[0] : ''}
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

  // ═══ LIST / KANBAN / FUNNEL VIEW ═══
  return (
    <div>
      {/* Push notification prompt */}
      {isPushSupported() && getPermissionState() === 'default' && (
        <div style={{
          background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8,
          padding: '10px 16px', marginBottom: 10, display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: 8,
        }}>
          <span style={{ fontFamily: FM, fontSize: 11, color: '#2563eb' }}>
            Enable notifications to get alerts for reminders, leads, and deal updates.
          </span>
          <button onClick={async () => {
            const result = await requestPermission();
            if (result === 'granted') {
              addNotification({ icon: '\uD83D\uDD14', title: 'Notifications enabled!', body: 'You\'ll receive alerts for reminders and updates.' });
            }
          }} style={{ ...b1, background: '#2563eb', padding: '5px 14px', fontSize: 10 }}>ENABLE NOTIFICATIONS</button>
        </div>
      )}
      {/* View toggle + Pipeline toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => { setFilterPipeline(''); setFilterStatus(''); setFilterDead(false); }} style={{
            padding: '8px 16px', borderRadius: 4, border: !filterPipeline && !filterDead ? '2px solid var(--brand-red)' : '1px solid var(--border-primary)',
            background: !filterPipeline && !filterDead ? '#fef2f2' : 'var(--card-bg)', fontFamily: FH, fontSize: 11, fontWeight: 700,
            color: !filterPipeline && !filterDead ? 'var(--brand-red)' : 'var(--text-secondary)', cursor: 'pointer',
          }}>ALL LEADS ({customers.filter((c) => c.status !== 'dead').length})</button>
          {Object.entries(PIPELINES).map(([id, pl]) => {
            const count = customers.filter((c) => getPipeline(c.lead_source) === id && c.status !== 'dead').length;
            return (
              <button key={id} onClick={() => { setFilterPipeline(filterPipeline === id ? '' : id); setFilterStatus(''); setFilterDead(false); }} style={{
                padding: '8px 16px', borderRadius: 4, border: filterPipeline === id && !filterDead ? `2px solid ${pl.color}` : '1px solid var(--border-primary)',
                background: filterPipeline === id && !filterDead ? pl.color + '15' : 'var(--card-bg)', fontFamily: FH, fontSize: 11, fontWeight: 700,
                color: pl.color, cursor: 'pointer',
              }}>{pl.label} ({count})</button>
            );
          })}
          {/* Dead leads filter */}
          {deadLeads.length > 0 && (
            <button onClick={() => { setFilterDead(!filterDead); setFilterPipeline(''); setFilterStatus(''); }} style={{
              padding: '8px 16px', borderRadius: 4, border: filterDead ? '2px solid #6b7280' : '1px solid var(--border-primary)',
              background: filterDead ? '#f3f4f6' : 'var(--card-bg)', fontFamily: FH, fontSize: 11, fontWeight: 700,
              color: '#6b7280', cursor: 'pointer', position: 'relative',
            }}>
              {'\u26D4'} DEAD ({deadLeads.length})
              {deadNeedsReview.length > 0 && canDel && (
                <span style={{
                  position: 'absolute', top: -4, right: -4, background: '#b91c1c', color: '#fff',
                  fontFamily: FM, fontSize: 8, fontWeight: 700, width: 16, height: 16, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{deadNeedsReview.length}</span>
              )}
            </button>
          )}
          {/* Follow-up config (managers only) */}
          {canDel && (
            <button onClick={() => setShowFollowupConfig(true)} title="Configure follow-up timelines" style={{
              padding: '8px', borderRadius: 4, border: '1px solid var(--border-primary)',
              background: 'var(--card-bg)', cursor: 'pointer', fontSize: 14, lineHeight: 1,
              color: 'var(--text-muted)',
            }}>{'\u2699\uFE0F'}</button>
          )}
        </div>

        {/* View mode toggle */}
        <div style={{ display: 'flex', gap: 2, background: 'var(--tab-bg)', borderRadius: 6, padding: 2 }}>
          {[
            { id: 'list', label: 'LIST', icon: '\u2630' },
            { id: 'kanban', label: 'BOARD', icon: '\u25A6' },
            { id: 'funnel', label: 'FUNNEL', icon: '\u25BD' },
          ].map((v) => (
            <button key={v.id} onClick={() => setCrmView(v.id)} style={{
              padding: '5px 10px', borderRadius: 4, border: 'none', cursor: 'pointer',
              fontFamily: FH, fontSize: 9, fontWeight: 600, letterSpacing: 0.5,
              background: crmView === v.id ? 'var(--brand-red)' : 'transparent',
              color: crmView === v.id ? 'var(--text-inverse)' : 'var(--text-muted)',
              transition: 'all .15s',
            }}>{v.icon} {v.label}</button>
          ))}
        </div>
      </div>

      {/* Stage filter (when pipeline selected, list view only) */}
      {filterPipeline && crmView === 'list' && (
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
        {canSeeAll && (
          <button onClick={() => { setImportModal(true); setImportData(null); setImportPreview([]); setImportResult(null); }} style={{ ...b2, padding: '8px 14px' }}>IMPORT CSV</button>
        )}
        <button onClick={() => { setForm({ ...emptyCustomer, assigned_to: currentUser.id }); setModal('addCustomer'); }} style={b1}>+ NEW LEAD</button>
      </div>

      {/* View content */}
      {loading ? (
        <div style={{ padding: 30, textAlign: 'center', fontFamily: FM, fontSize: 11, color: 'var(--text-muted)' }}>LOADING...</div>
      ) : crmView === 'kanban' ? (
        // ── KANBAN VIEW ──
        <div>
          {filterPipeline ? (
            <CRMKanbanView
              customers={filtered}
              stages={getStagesForPipeline(filterPipeline)}
              pipelineColor={PIPELINES[filterPipeline].color}
              act={act}
              onOpenCustomer={openCustomer}
              onUpdateStatus={(customer, newStage) => handleStageChange(customer, newStage)}
            />
          ) : (
            // Show both pipelines
            <>
              {Object.entries(PIPELINES).map(([pid, pl]) => (
                <div key={pid} style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: FH, fontSize: 12, fontWeight: 700, color: pl.color, letterSpacing: 1, marginBottom: 8 }}>{pl.label}</div>
                  <CRMKanbanView
                    customers={customers.filter((c) => getPipeline(c.lead_source) === pid)}
                    stages={pl.stages}
                    pipelineColor={pl.color}
                    act={act}
                    onOpenCustomer={openCustomer}
                    onUpdateStatus={(customer, newStage) => handleStageChange(customer, newStage)}
                  />
                </div>
              ))}
            </>
          )}
        </div>
      ) : crmView === 'funnel' ? (
        // ── FUNNEL VIEW ──
        <CRMFunnelView customers={customers} pipelines={PIPELINES} getPipeline={getPipeline} />
      ) : (
        // ── LIST VIEW ──
        <div style={card}>
          {filtered.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', fontFamily: FM, fontSize: 11, color: 'var(--text-muted)' }}>NO LEADS FOUND</div>
          ) : (
            <div style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{[...(filterDead ? ['Name', 'Phone', 'Reason', 'Requested By', 'Status', ...(canDel ? [''] : [])] : ['Name', 'Phone', 'Unit', 'Source', 'Stage', 'Next Step', 'FORMAT', 'Rep', ...(canDel ? [''] : [])])].map((h) => <th key={h || '_del'} style={TH}>{h}</th>)}</tr></thead>
                <tbody>
                  {filtered.map((c) => {
                    const pl = getPipeline(c.lead_source);
                    const stages = getStagesForPipeline(pl);
                    const stg = c.status === 'dead' ? DEAD_STAGE : (stages.find((s) => s.id === c.status) || stages[0]);
                    const rep = act.find((a) => a.id === c.assigned_to);
                    const hasNextStep = c.next_step && c.next_step.trim();

                    // Dead leads view
                    if (filterDead) {
                      const requestedBy = act.find((a) => a.id === c.dead_requested_by);
                      return (
                        <tr key={c.id} onClick={() => openCustomer(c)} style={{ cursor: 'pointer' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--row-hover)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ ...TD, fontFamily: FH, fontWeight: 600 }}>{c.first_name} {c.last_name}</td>
                          <td style={{ ...TD, fontFamily: FM, fontSize: 11 }}>{c.phone || '—'}</td>
                          <td style={{ ...TD, fontFamily: FM, fontSize: 11, color: 'var(--text-secondary)' }}>{c.dead_reason || '—'}</td>
                          <td style={{ ...TD, fontFamily: FM, fontSize: 11 }}>{requestedBy?.name?.split(' ')[0] || '—'}</td>
                          <td style={TD}>
                            <span style={{ fontFamily: FM, fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 3, background: c.dead_reviewed ? '#f3f4f6' : '#fef2f2', color: c.dead_reviewed ? '#6b7280' : '#b91c1c' }}>
                              {c.dead_reviewed ? 'CONFIRMED' : 'NEEDS REVIEW'}
                            </span>
                          </td>
                          {canDel && (
                            <td style={TD} onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => handleReviveLead(c)} style={{ ...b1, background: '#16a34a', padding: '3px 10px', fontSize: 9 }}>REVIVE</button>
                            </td>
                          )}
                        </tr>
                      );
                    }

                    // Normal leads view
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
                        <td style={TD}>
                          {hasNextStep ? (
                            <span style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-primary)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{c.next_step}</span>
                          ) : (
                            <span style={{ fontFamily: FM, fontSize: 9, fontWeight: 700, color: '#d97706', background: '#fef3c7', padding: '1px 6px', borderRadius: 3 }}>NEEDS STEP</span>
                          )}
                        </td>
                        <td style={TD}><FormatNotes customer={c} compact /></td>
                        <td style={{ ...TD, fontFamily: FM, fontSize: 11 }}>{rep?.name?.split(' ')[0] || <span style={{ color: '#fca5a5', fontWeight: 700 }}>UNASSIGNED</span>}</td>
                        {canDel && (
                          <td style={TD} onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => handleDeleteCustomer(c)} style={{
                              background: 'none', border: 'none', color: 'var(--text-muted)',
                              cursor: 'pointer', fontSize: 13, padding: '2px 6px',
                            }} title="Delete lead">✕</button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Dead Lead Modal */}
      <Modal open={deadModal} onClose={() => setDeadModal(false)} title="Mark Lead as Dead">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 14px', fontFamily: FM, fontSize: 11, color: '#6b7280', lineHeight: 1.6 }}>
            This will send the lead to <strong>Dead — Manager Review</strong>. A manager must approve or revive the lead.
          </div>
          <div>
            <label style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 4 }}>REASON</label>
            <select value={deadReason} onChange={(e) => setDeadReason(e.target.value)} style={inp}>
              <option value="">— Select reason —</option>
              {DEAD_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          {deadReason === 'Other' && (
            <div>
              <label style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 4 }}>SPECIFY</label>
              <input value={deadReasonCustom} onChange={(e) => setDeadReasonCustom(e.target.value)} style={inp} placeholder="Reason for marking dead..." />
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setDeadModal(false)} style={b2}>CANCEL</button>
            <button onClick={handleMarkDead} disabled={!deadReason || (deadReason === 'Other' && !deadReasonCustom.trim())} style={{ ...b1, background: '#6b7280', opacity: !deadReason ? 0.5 : 1 }}>MARK DEAD</button>
          </div>
        </div>
      </Modal>

      {/* Follow-Up Timeline Config Modal */}
      <Modal open={showFollowupConfig} onClose={() => setShowFollowupConfig(false)} title="Configure Follow-Up Timelines">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 14px', fontFamily: FM, fontSize: 11, color: '#2563eb', lineHeight: 1.6 }}>
            Set the number of days after entering each stage that an automatic follow-up reminder is created.
            Set to 0 for same-day reminder. Leave blank to disable auto-follow-up for that stage.
          </div>
          {Object.entries(PIPELINES).map(([pid, pl]) => (
            <div key={pid}>
              <div style={{ fontFamily: FH, fontSize: 11, fontWeight: 700, color: pl.color, letterSpacing: 1, marginBottom: 6 }}>{pl.label}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
                {pl.stages.map((s) => (
                  <div key={s.id}>
                    <label style={{ fontFamily: FM, fontSize: 8, color: s.color, fontWeight: 700, display: 'block', marginBottom: 2 }}>{s.label}</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input
                        type="number" min="0"
                        value={followupDays[s.id] ?? ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : parseInt(e.target.value) || 0;
                          const updated = { ...followupDays, [s.id]: val };
                          setFollowupDays(updated);
                          saveFollowupDays(updated);
                        }}
                        style={{ ...inp, width: 60, textAlign: 'center', padding: '5px 4px' }}
                        placeholder="—"
                      />
                      <span style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)' }}>days</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowFollowupConfig(false)} style={b1}>DONE</button>
          </div>
        </div>
      </Modal>

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

      {/* ═══ IMPORT CSV MODAL ═══ */}
      <Modal open={importModal} onClose={() => setImportModal(false)} title="Import Customers from CSV" wide>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '12px 16px', fontFamily: FM, fontSize: 11, color: '#2563eb', lineHeight: 1.6 }}>
            Upload a CSV file with customer data. The importer will auto-map columns by header name.
            Supported headers: first_name, last_name, phone, email, address, city, state, zip, unit, stock, source, notes.
          </div>

          <div>
            <label style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 4 }}>SELECT CSV FILE</label>
            <input type="file" accept=".csv,.txt" onChange={handleCSVFile} style={{
              fontFamily: FM, fontSize: 11, color: 'var(--text-primary)',
              padding: 8, background: 'var(--input-bg)', border: '1px solid var(--input-border)',
              borderRadius: 6, width: '100%', boxSizing: 'border-box',
            }} />
          </div>

          {importData && (
            <>
              <div style={{ fontFamily: FM, fontSize: 11, color: 'var(--text-secondary)' }}>
                Found <strong style={{ color: 'var(--text-primary)' }}>{importData.rows.length}</strong> rows with columns: <span style={{ color: 'var(--text-muted)' }}>{importData.headers.join(', ')}</span>
              </div>

              {/* Preview table */}
              <div style={{ overflow: 'auto', maxHeight: 200 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{importData.headers.slice(0, 6).map((h) => <th key={h} style={TH}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {importPreview.map((row, i) => (
                      <tr key={i}>{importData.headers.slice(0, 6).map((h) => <td key={h} style={{ ...TD, fontSize: 10 }}>{row[h] || '—'}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {importData.rows.length > 5 && (
                <div style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>
                  Showing 5 of {importData.rows.length} rows
                </div>
              )}
            </>
          )}

          {importResult && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 16px', fontFamily: FM, fontSize: 11, color: '#16a34a', fontWeight: 700 }}>
              Import complete: {importResult.imported} customers imported, {importResult.skipped} skipped (missing name/phone).
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setImportModal(false)} style={b2}>CLOSE</button>
            {importData && !importResult && (
              <button onClick={handleImport} disabled={importing} style={{ ...b1, opacity: importing ? 0.6 : 1 }}>
                {importing ? 'IMPORTING...' : `IMPORT ${importData.rows.length} CUSTOMERS`}
              </button>
            )}
          </div>

          {/* Lightspeed DMS section */}
          <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: 14, marginTop: 4 }}>
            <div style={{ fontFamily: FH, fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 1, marginBottom: 6 }}>LIGHTSPEED DMS INTEGRATION</div>
            <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', borderRadius: 8, padding: '12px 16px', fontFamily: FM, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              To connect your Lightspeed DMS for automatic customer sync, you'll need your Lightspeed API credentials.
              Contact your Lightspeed DMS rep to request API access, then enter your credentials below.
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: 150 }}>
                <label style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>API KEY</label>
                <input style={inp} placeholder="Enter Lightspeed API key" disabled />
              </div>
              <div style={{ flex: 1, minWidth: 150 }}>
                <label style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>DEALER ID</label>
                <input style={inp} placeholder="Enter dealer ID" disabled />
              </div>
              <button style={{ ...b2, opacity: 0.5 }} disabled>CONNECT (COMING SOON)</button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
