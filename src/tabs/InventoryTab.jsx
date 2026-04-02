import React, { useState, useMemo } from 'react';
import { Modal, StatCard, ProgressBar, styles, FM, FH } from '../components/SharedUI';
import { canManagePromos } from '../lib/auth';
import { IMPORT_STATUSES, UNIT_STATUSES, AGING_BUCKETS, calcFloorplanDays, getAgingBucket, getInventorySummary, getAgedInventory } from '../lib/inventoryConstants';
import { parseInventoryFile } from '../lib/inventoryParser';

const { card, cardHead: cH, input: inp, btn1: b1, btn2: b2, th: TH, td: TD, label: lbl } = styles;

export default function InventoryTab({ currentUser, storeId, storeConfig, inventoryItems, saveInventoryItems }) {
  const [subView, setSubView] = useState('active'); // active | import | review | aged
  const [uploading, setUploading] = useState(false);
  const [parsedItems, setParsedItems] = useState([]);
  const [parseWarnings, setParseWarnings] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('in_stock');
  const [editingItem, setEditingItem] = useState(null);

  const canManage = canManagePromos(currentUser);
  const unitTypes = storeConfig?.unit_types || [];
  const items = inventoryItems || [];
  const activeItems = items.filter((i) => i.status !== 'sold');

  // Recalc floorplan days on render
  const enrichedItems = useMemo(() => items.map((i) => ({
    ...i,
    floorplanDays: i.floorplanDays || calcFloorplanDays(i.dateReceived),
  })), [items]);

  const summary = useMemo(() => getInventorySummary(enrichedItems.filter((i) => i.status === 'in_stock')), [enrichedItems]);
  const agedItems = useMemo(() => getAgedInventory(enrichedItems.filter((i) => i.status === 'in_stock'), 61), [enrichedItems]);

  // Filtered list
  const filtered = enrichedItems.filter((i) => {
    if (filterStatus && i.status !== filterStatus) return false;
    if (filterCategory && i.category !== filterCategory) return false;
    if (search) {
      const s = search.toLowerCase();
      return (i.stock || '').toLowerCase().includes(s)
        || (i.vin || '').toLowerCase().includes(s)
        || (i.make || '').toLowerCase().includes(s)
        || (i.model || '').toLowerCase().includes(s)
        || (i.trim || '').toLowerCase().includes(s)
        || String(i.year).includes(s);
    }
    return true;
  }).sort((a, b) => (b.floorplanDays || 0) - (a.floorplanDays || 0));

  // ── Import handling ──
  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = await file.arrayBuffer();
      const result = await parseInventoryFile(data, { storeId, fileName: file.name });
      setParsedItems(result.records);
      setParseWarnings(result.warnings);
      setSubView('review');
    } catch (err) {
      console.error('Parse error:', err);
      alert('Could not parse file: ' + err.message);
    }
    setUploading(false);
    e.target.value = '';
  }

  function publishParsedItems() {
    if (!saveInventoryItems) return;
    const now = new Date().toISOString();
    const published = parsedItems.map((i) => ({ ...i, status: i.status || 'in_stock', updatedAt: now }));
    // Replace inventory snapshot (daily import replaces previous)
    saveInventoryItems(published);
    setParsedItems([]);
    setSubView('active');
  }

  function mergeImport() {
    if (!saveInventoryItems) return;
    const now = new Date().toISOString();
    const existing = items;
    const incoming = parsedItems.map((i) => ({ ...i, updatedAt: now }));
    // Merge: match by stock # or VIN, update existing, add new
    const merged = [...existing];
    incoming.forEach((inc) => {
      const matchIdx = merged.findIndex((ex) => (inc.stock && ex.stock === inc.stock) || (inc.vin && ex.vin === inc.vin));
      if (matchIdx >= 0) {
        merged[matchIdx] = { ...merged[matchIdx], ...inc, id: merged[matchIdx].id };
      } else {
        merged.push(inc);
      }
    });
    saveInventoryItems(merged);
    setParsedItems([]);
    setSubView('active');
  }

  function deleteItem(id) {
    if (!saveInventoryItems) return;
    saveInventoryItems(items.filter((i) => i.id !== id));
  }

  function updateItemStatus(id, newStatus) {
    if (!saveInventoryItems) return;
    saveInventoryItems(items.map((i) => i.id === id ? { ...i, status: newStatus, updatedAt: new Date().toISOString() } : i));
  }

  return (
    <div>
      {/* Sub-nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 2, background: 'var(--tab-bg)', borderRadius: 6, padding: 2 }}>
          {[
            { id: 'active', label: `ACTIVE (${activeItems.length})` },
            { id: 'aged', label: `AGED 60+ (${agedItems.length})` },
            ...(parsedItems.length > 0 ? [{ id: 'review', label: `REVIEW (${parsedItems.length})` }] : []),
          ].map((v) => (
            <button key={v.id} onClick={() => setSubView(v.id)} style={{
              padding: '6px 12px', borderRadius: 4, border: 'none', cursor: 'pointer',
              fontFamily: FH, fontSize: 9, fontWeight: 600, letterSpacing: 0.5,
              background: subView === v.id ? 'var(--brand-red)' : 'transparent',
              color: subView === v.id ? 'var(--text-inverse)' : 'var(--text-muted)',
              transition: 'all .15s',
            }}>{v.label}</button>
          ))}
        </div>
        {canManage && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {uploading && <span style={{ fontFamily: FM, fontSize: 10, color: 'var(--brand-red)', fontWeight: 700 }}>IMPORTING...</span>}
            <label style={{ ...b1, padding: '6px 14px', fontSize: 10, cursor: 'pointer', display: 'inline-block' }}>
              IMPORT FILE
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>
        )}
      </div>

      {/* ═══ ACTIVE INVENTORY VIEW ═══ */}
      {subView === 'active' && (
        <div>
          {/* Summary cards */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            <StatCard label="IN STOCK" value={summary.inStock} accent="#16a34a" />
            <StatCard label="ON ORDER" value={summary.onOrder} accent="#2563eb" />
            <StatCard label="TOTAL MSRP" value={'$' + (summary.totalMsrp / 1000).toFixed(0) + 'k'} accent="var(--brand-red)" />
            <StatCard label="AVG AGE" value={summary.avgAge + 'd'} accent={summary.avgAge > 60 ? '#dc2626' : summary.avgAge > 30 ? '#d97706' : '#16a34a'} />
            <StatCard label="AGED 60+" value={agedItems.length} accent={agedItems.length > 0 ? '#dc2626' : '#16a34a'} />
          </div>

          {/* Category breakdown */}
          {Object.keys(summary.categories).length > 0 && (
            <div style={{ display: 'flex', gap: 4, marginBottom: 14, flexWrap: 'wrap' }}>
              <button onClick={() => setFilterCategory('')} style={{
                padding: '5px 10px', borderRadius: 4, fontFamily: FM, fontSize: 9, fontWeight: 700, cursor: 'pointer',
                border: !filterCategory ? '2px solid var(--brand-red)' : '1px solid var(--border-primary)',
                background: !filterCategory ? 'var(--brand-red-soft)' : 'var(--card-bg)',
                color: !filterCategory ? 'var(--brand-red)' : 'var(--text-muted)',
              }}>ALL ({enrichedItems.filter((i) => !filterStatus || i.status === filterStatus).length})</button>
              {Object.entries(summary.categories).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
                <button key={cat} onClick={() => setFilterCategory(filterCategory === cat ? '' : cat)} style={{
                  padding: '5px 10px', borderRadius: 4, fontFamily: FM, fontSize: 9, fontWeight: 700, cursor: 'pointer',
                  border: filterCategory === cat ? '2px solid var(--brand-red)' : '1px solid var(--border-primary)',
                  background: filterCategory === cat ? 'var(--brand-red-soft)' : 'var(--card-bg)',
                  color: filterCategory === cat ? 'var(--brand-red)' : 'var(--text-muted)',
                }}>{cat} ({count})</button>
              ))}
            </div>
          )}

          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <input value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inp, padding: '8px 12px' }} placeholder="Search stock #, VIN, make, model..." />
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ ...inp, width: 'auto', padding: '8px 10px' }}>
              <option value="">All Statuses</option>
              {Object.entries(UNIT_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          {/* Inventory table */}
          <div style={{ ...card, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Stock #', 'Year', 'Make', 'Model', 'Category', 'Condition', 'MSRP', 'Age', 'Status', ...(canManage ? [''] : [])].map((h) => <th key={h} style={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={10} style={{ ...TD, padding: 30, textAlign: 'center', color: 'var(--text-muted)', fontFamily: FM, fontSize: 11 }}>NO INVENTORY RECORDS{items.length === 0 ? '. Import a DMS export to get started.' : ' matching filters.'}</td></tr>}
                {filtered.map((i) => {
                  const aging = getAgingBucket(i.floorplanDays);
                  const statusObj = UNIT_STATUSES[i.status] || UNIT_STATUSES.in_stock;
                  return (
                    <tr key={i.id} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--row-hover)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ ...TD, fontFamily: FM, fontWeight: 700 }}>{i.stock || '\u2014'}</td>
                      <td style={{ ...TD, fontFamily: FM }}>{i.year}</td>
                      <td style={{ ...TD, fontFamily: FH, fontWeight: 600 }}>{i.make}</td>
                      <td style={TD}>{i.model} {i.trim ? <span style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)' }}>{i.trim}</span> : ''}</td>
                      <td style={TD}><span style={{ fontFamily: FM, fontSize: 9, fontWeight: 700, color: 'var(--text-muted)' }}>{i.category || '\u2014'}</span></td>
                      <td style={{ ...TD, fontFamily: FM, fontSize: 10 }}>{i.condition}</td>
                      <td style={{ ...TD, fontFamily: FM, fontWeight: 700 }}>{i.msrp ? '$' + i.msrp.toLocaleString() : '\u2014'}</td>
                      <td style={TD}>
                        <span style={{ fontFamily: FM, fontSize: 10, fontWeight: 700, color: aging.color, background: aging.color + '15', padding: '1px 6px', borderRadius: 3 }}>{i.floorplanDays}d</span>
                      </td>
                      <td style={TD}>
                        {canManage ? (
                          <select value={i.status} onChange={(e) => updateItemStatus(i.id, e.target.value)} style={{ fontFamily: FM, fontSize: 9, fontWeight: 700, color: statusObj.color, background: statusObj.bg, border: 'none', borderRadius: 3, padding: '2px 6px', cursor: 'pointer' }}>
                            {Object.entries(UNIT_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                          </select>
                        ) : (
                          <span style={{ fontFamily: FM, fontSize: 9, fontWeight: 700, color: statusObj.color, background: statusObj.bg, padding: '2px 6px', borderRadius: 3 }}>{statusObj.label}</span>
                        )}
                      </td>
                      {canManage && <td style={TD}><button onClick={() => deleteItem(i.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>{'\u2715'}</button></td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>{filtered.length} unit{filtered.length !== 1 ? 's' : ''} shown</div>
        </div>
      )}

      {/* ═══ AGED INVENTORY VIEW ═══ */}
      {subView === 'aged' && (
        <div>
          {/* Aging buckets */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            {AGING_BUCKETS.map((bucket) => {
              const count = enrichedItems.filter((i) => i.status === 'in_stock' && i.floorplanDays >= bucket.min && i.floorplanDays <= bucket.max).length;
              return (
                <div key={bucket.id} style={{ ...card, flex: 1, minWidth: 100, textAlign: 'center', padding: '12px 8px' }}>
                  <div style={{ fontFamily: FH, fontSize: 24, fontWeight: 700, color: bucket.color, lineHeight: 1 }}>{count}</div>
                  <div style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)', letterSpacing: 1, marginTop: 3 }}>{bucket.label.toUpperCase()}</div>
                  <div style={{ marginTop: 6 }}><ProgressBar value={count} max={Math.max(summary.inStock, 1)} color={bucket.color} /></div>
                </div>
              );
            })}
          </div>

          {/* Aged units list */}
          <div style={{ ...card, overflow: 'auto' }}>
            <div style={cH}>UNITS 60+ DAYS — ACTION REQUIRED ({agedItems.length})</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Stock #', 'Unit', 'Category', 'MSRP', 'Days', 'Received', 'Status'].map((h) => <th key={h} style={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {agedItems.length === 0 && <tr><td colSpan={7} style={{ ...TD, padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontFamily: FM, fontSize: 11 }}>No aged inventory — great job!</td></tr>}
                {agedItems.sort((a, b) => (b.floorplanDays || 0) - (a.floorplanDays || 0)).map((i) => {
                  const aging = getAgingBucket(i.floorplanDays);
                  return (
                    <tr key={i.id}>
                      <td style={{ ...TD, fontFamily: FM, fontWeight: 700 }}>{i.stock || '\u2014'}</td>
                      <td style={TD}>{i.year} {i.make} {i.model}</td>
                      <td style={{ ...TD, fontFamily: FM, fontSize: 9, fontWeight: 700, color: 'var(--text-muted)' }}>{i.category}</td>
                      <td style={{ ...TD, fontFamily: FM, fontWeight: 700 }}>{i.msrp ? '$' + i.msrp.toLocaleString() : '\u2014'}</td>
                      <td style={TD}><span style={{ fontFamily: FM, fontSize: 10, fontWeight: 700, color: aging.color, background: aging.color + '15', padding: '2px 8px', borderRadius: 3 }}>{i.floorplanDays} DAYS</span></td>
                      <td style={{ ...TD, fontFamily: FM, fontSize: 10, color: 'var(--text-muted)' }}>{i.dateReceived || '\u2014'}</td>
                      <td style={TD}><span style={{ fontFamily: FM, fontSize: 9, fontWeight: 700, color: UNIT_STATUSES[i.status]?.color, background: UNIT_STATUSES[i.status]?.bg, padding: '2px 6px', borderRadius: 3 }}>{UNIT_STATUSES[i.status]?.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ IMPORT REVIEW VIEW ═══ */}
      {subView === 'review' && parsedItems.length > 0 && (
        <div>
          {parseWarnings.length > 0 && (
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
              {parseWarnings.map((w, i) => <div key={i} style={{ fontFamily: FM, fontSize: 11, color: '#2563eb', lineHeight: 1.6 }}>{w}</div>)}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontFamily: FH, fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 1 }}>REVIEW IMPORTED UNITS ({parsedItems.length})</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setParsedItems([])} style={b2}>DISCARD ALL</button>
              <button onClick={mergeImport} style={{ ...b2, color: '#2563eb', borderColor: '#bfdbfe' }}>MERGE WITH EXISTING</button>
              <button onClick={publishParsedItems} style={b1}>REPLACE INVENTORY ({parsedItems.length})</button>
            </div>
          </div>

          <div style={{ ...card, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Stock #', 'VIN', 'Year', 'Make', 'Model', 'Category', 'Condition', 'MSRP', 'Status', ''].map((h) => <th key={h} style={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {parsedItems.map((i) => (
                  <tr key={i.id}>
                    <td style={{ ...TD, fontFamily: FM, fontWeight: 700 }}>{i.stock || '\u2014'}</td>
                    <td style={{ ...TD, fontFamily: FM, fontSize: 10, color: 'var(--text-muted)' }}>{i.vin ? i.vin.slice(-8) : '\u2014'}</td>
                    <td style={{ ...TD, fontFamily: FM }}>{i.year}</td>
                    <td style={{ ...TD, fontFamily: FH, fontWeight: 600 }}>{i.make}</td>
                    <td style={TD}>{i.model} {i.trim}</td>
                    <td style={{ ...TD, fontFamily: FM, fontSize: 9, fontWeight: 700, color: 'var(--text-muted)' }}>{i.category || '?'}</td>
                    <td style={{ ...TD, fontFamily: FM, fontSize: 10 }}>{i.condition}</td>
                    <td style={{ ...TD, fontFamily: FM, fontWeight: 700 }}>{i.msrp ? '$' + i.msrp.toLocaleString() : '\u2014'}</td>
                    <td style={TD}><span style={{ fontFamily: FM, fontSize: 9, fontWeight: 700, color: UNIT_STATUSES[i.status]?.color || '#6b7280', background: UNIT_STATUSES[i.status]?.bg || '#f3f4f6', padding: '2px 6px', borderRadius: 3 }}>{UNIT_STATUSES[i.status]?.label || i.status}</span></td>
                    <td style={TD}><button onClick={() => setParsedItems((prev) => prev.filter((x) => x.id !== i.id))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>{'\u2715'}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
