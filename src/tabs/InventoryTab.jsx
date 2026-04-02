import React, { useState, useMemo } from 'react';
import { Modal, StatCard, ProgressBar, styles, FM, FH } from '../components/SharedUI';
import { canManagePromos } from '../lib/auth';
import { UNIT_STATUSES, AGING_BUCKETS, calcFloorplanDays, getAgingBucket, getInventorySummary, getAgedInventory } from '../lib/inventoryConstants';
import { parseInventoryFile } from '../lib/inventoryParser';
import { runFullMatching, MATCH_CONFIDENCE } from '../lib/matchingEngine';

const { card, cardHead: cH, input: inp, btn1: b1, btn2: b2, th: TH, td: TD, label: lbl } = styles;

export default function InventoryTab({ currentUser, storeId, storeConfig, inventoryItems, saveInventoryItems, promoRecords, pricingRecords }) {
  const [subView, setSubView] = useState('opportunities'); // opportunities | active | aged | review
  const [uploading, setUploading] = useState(false);
  const [parsedItems, setParsedItems] = useState([]);
  const [parseWarnings, setParseWarnings] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('in_stock');
  const [selectedUnit, setSelectedUnit] = useState(null);

  const canManage = canManagePromos(currentUser);
  const items = inventoryItems || [];

  // Run matching engine (memoized — only recalculates when data changes)
  const matchedItems = useMemo(() => runFullMatching(
    items.filter((i) => i.status === 'in_stock' || i.status === 'on_order'),
    promoRecords, pricingRecords
  ), [items, promoRecords, pricingRecords]);

  const allEnriched = useMemo(() => runFullMatching(items, promoRecords, pricingRecords), [items, promoRecords, pricingRecords]);

  const summary = useMemo(() => getInventorySummary(items.filter((i) => i.status === 'in_stock')), [items]);
  const agedItems = useMemo(() => getAgedInventory(allEnriched.filter((i) => i.status === 'in_stock'), 61), [allEnriched]);
  const needsReview = matchedItems.filter((i) => i._needsReview);
  const expiringSupport = matchedItems.filter((i) => i._expiringPromo);
  const noPromoSupport = matchedItems.filter((i) => i._promoMatches.length === 0 && i.status === 'in_stock');
  const topOpportunities = matchedItems.filter((i) => i._opportunityScore >= 65);

  // Filtered list for active view
  const filtered = allEnriched.filter((i) => {
    if (filterStatus && i.status !== filterStatus) return false;
    if (filterCategory && i.category !== filterCategory) return false;
    if (search) {
      const s = search.toLowerCase();
      return (i.stock || '').toLowerCase().includes(s) || (i.vin || '').toLowerCase().includes(s) || (i.make || '').toLowerCase().includes(s) || (i.model || '').toLowerCase().includes(s) || String(i.year).includes(s);
    }
    return true;
  });

  // Import handling
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
      alert('Could not parse file: ' + err.message);
    }
    setUploading(false);
    e.target.value = '';
  }

  function publishParsedItems() {
    if (!saveInventoryItems) return;
    saveInventoryItems(parsedItems.map((i) => ({ ...i, updatedAt: new Date().toISOString() })));
    setParsedItems([]);
    setSubView('opportunities');
  }

  function mergeImport() {
    if (!saveInventoryItems) return;
    const existing = items;
    const incoming = parsedItems.map((i) => ({ ...i, updatedAt: new Date().toISOString() }));
    const merged = [...existing];
    incoming.forEach((inc) => {
      const matchIdx = merged.findIndex((ex) => (inc.stock && ex.stock === inc.stock) || (inc.vin && ex.vin === inc.vin));
      if (matchIdx >= 0) merged[matchIdx] = { ...merged[matchIdx], ...inc, id: merged[matchIdx].id };
      else merged.push(inc);
    });
    saveInventoryItems(merged);
    setParsedItems([]);
    setSubView('opportunities');
  }

  function updateItemStatus(id, newStatus) {
    if (!saveInventoryItems) return;
    saveInventoryItems(items.map((i) => i.id === id ? { ...i, status: newStatus, updatedAt: new Date().toISOString() } : i));
  }

  // ── Unit Detail Panel ──
  function UnitDetail({ unit }) {
    const mc = MATCH_CONFIDENCE[unit._bestPromoConfidence] || MATCH_CONFIDENCE.none;
    const pe = unit._paymentEstimate;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Score + Quick Stats */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ ...card, flex: 1, minWidth: 80, textAlign: 'center', padding: 12 }}>
            <div style={{ fontFamily: FH, fontSize: 28, fontWeight: 700, color: unit._opportunityScore >= 70 ? '#16a34a' : unit._opportunityScore >= 50 ? '#d97706' : 'var(--brand-red)', lineHeight: 1 }}>{unit._opportunityScore}</div>
            <div style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)', letterSpacing: 1, marginTop: 2 }}>OPP SCORE</div>
          </div>
          <div style={{ ...card, flex: 1, minWidth: 80, textAlign: 'center', padding: 12 }}>
            <div style={{ fontFamily: FM, fontSize: 11, fontWeight: 700, color: mc.color }}>{mc.label}</div>
            <div style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)', letterSpacing: 1, marginTop: 2 }}>PROMO MATCH</div>
          </div>
          {pe && (
            <>
              <div style={{ ...card, flex: 1, minWidth: 80, textAlign: 'center', padding: 12 }}>
                <div style={{ fontFamily: FH, fontSize: 18, fontWeight: 700, color: 'var(--text-secondary)', lineHeight: 1 }}>${pe.standardPayment.toFixed(0)}</div>
                <div style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)', letterSpacing: 1, marginTop: 2 }}>STD PMT*</div>
              </div>
              <div style={{ ...card, flex: 1, minWidth: 80, textAlign: 'center', padding: 12 }}>
                <div style={{ fontFamily: FH, fontSize: 18, fontWeight: 700, color: '#16a34a', lineHeight: 1 }}>${pe.promoPayment.toFixed(0)}</div>
                <div style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)', letterSpacing: 1, marginTop: 2 }}>PROMO PMT*</div>
              </div>
              {pe.monthlySavings > 0 && (
                <div style={{ ...card, flex: 1, minWidth: 80, textAlign: 'center', padding: 12 }}>
                  <div style={{ fontFamily: FH, fontSize: 18, fontWeight: 700, color: '#d97706', lineHeight: 1 }}>-${pe.monthlySavings.toFixed(0)}</div>
                  <div style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)', letterSpacing: 1, marginTop: 2 }}>SAVINGS/MO</div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Score Factors */}
        {unit._opportunityFactors?.length > 0 && (
          <div style={card}>
            <div style={cH}>WHY THIS SCORE</div>
            <div style={{ padding: 12 }}>
              {unit._opportunityFactors.map((f, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border-secondary)' }}>
                  <span style={{ fontFamily: FM, fontSize: 11, color: 'var(--text-primary)' }}>{f.label}</span>
                  <span style={{ fontFamily: FM, fontSize: 11, fontWeight: 700, color: f.color }}>{f.impact}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Promo Matches */}
        {unit._promoMatches.length > 0 && (
          <div style={card}>
            <div style={cH}>MATCHING PROMOTIONS ({unit._promoMatches.length})</div>
            <div style={{ padding: 12 }}>
              {unit._promoMatches.map((m) => (
                <div key={m.promoId} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-secondary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontFamily: FM, fontSize: 9, fontWeight: 700, color: MATCH_CONFIDENCE[m.confidence]?.color, background: MATCH_CONFIDENCE[m.confidence]?.color + '15', padding: '1px 6px', borderRadius: 3, marginRight: 6 }}>{MATCH_CONFIDENCE[m.confidence]?.label}</span>
                      <span style={{ fontFamily: FH, fontSize: 12, fontWeight: 700 }}>{m.promoName}</span>
                    </div>
                    {m.daysUntilExpiry !== null && m.daysUntilExpiry <= 14 && (
                      <span style={{ fontFamily: FM, fontSize: 9, fontWeight: 700, color: '#d97706' }}>Expires in {m.daysUntilExpiry}d</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                    {m.aprRate !== null && <span style={{ fontFamily: FM, fontSize: 11, color: '#16a34a', fontWeight: 700 }}>{m.aprRate}% APR{m.aprTerm ? ` / ${m.aprTerm}mo` : ''}</span>}
                    {m.rebateAmount && <span style={{ fontFamily: FM, fontSize: 11, color: '#d97706', fontWeight: 700 }}>${m.rebateAmount} Rebate</span>}
                    {m.customerCash && <span style={{ fontFamily: FM, fontSize: 11, color: '#7c3aed', fontWeight: 700 }}>${m.customerCash} Cash</span>}
                  </div>
                  {m.reasons.length > 0 && <div style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{m.reasons.join(' · ')}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {pe && (
          <div style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            *Payment estimates assume ${pe.standardAPR}% standard APR, {pe.standardTerm}mo term, $0 down. Not a lender quote.
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Sub-nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 2, background: 'var(--tab-bg)', borderRadius: 6, padding: 2 }}>
          {[
            { id: 'opportunities', label: `OPPORTUNITIES (${topOpportunities.length})` },
            { id: 'active', label: `ALL UNITS (${items.length})` },
            { id: 'aged', label: `AGED 60+ (${agedItems.length})` },
            ...(parsedItems.length > 0 ? [{ id: 'review', label: `REVIEW (${parsedItems.length})` }] : []),
          ].map((v) => (
            <button key={v.id} onClick={() => { setSubView(v.id); setSelectedUnit(null); }} style={{
              padding: '6px 12px', borderRadius: 4, border: 'none', cursor: 'pointer',
              fontFamily: FH, fontSize: 9, fontWeight: 600, letterSpacing: 0.5,
              background: subView === v.id ? 'var(--brand-red)' : 'transparent',
              color: subView === v.id ? 'var(--text-inverse)' : 'var(--text-muted)',
              transition: 'all .15s',
            }}>{v.label}</button>
          ))}
        </div>
        {canManage && (
          <label style={{ ...b1, padding: '6px 14px', fontSize: 10, cursor: 'pointer', display: 'inline-block' }}>
            IMPORT FILE
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        )}
      </div>

      {/* Manager Alerts */}
      {subView === 'opportunities' && (
        <div>
          {/* Alerts bar */}
          {(expiringSupport.length > 0 || needsReview.length > 0 || noPromoSupport.length > 5) && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              {expiringSupport.length > 0 && (
                <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 6, padding: '6px 12px', fontFamily: FM, fontSize: 10, color: '#d97706', fontWeight: 600 }}>
                  {'\u26A0\uFE0F'} {expiringSupport.length} unit{expiringSupport.length > 1 ? 's' : ''} losing promo support within 14 days
                </div>
              )}
              {needsReview.length > 0 && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '6px 12px', fontFamily: FM, fontSize: 10, color: '#dc2626', fontWeight: 600 }}>
                  {'\uD83D\uDD0D'} {needsReview.length} unit{needsReview.length > 1 ? 's' : ''} with ambiguous promo match
                </div>
              )}
              {noPromoSupport.length > 5 && (
                <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', borderRadius: 6, padding: '6px 12px', fontFamily: FM, fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>
                  {'\uD83D\uDCCB'} {noPromoSupport.length} in-stock units with no promo support
                </div>
              )}
            </div>
          )}

          {/* Summary */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            <StatCard label="IN STOCK" value={summary.inStock} accent="#16a34a" />
            <StatCard label="PROMO SUPPORTED" value={matchedItems.filter((i) => i._promoMatches.length > 0).length} accent="#2563eb" />
            <StatCard label="PROMO APR" value={matchedItems.filter((i) => i._hasPromoAPR).length} accent="#16a34a" />
            <StatCard label="EXPIRING SOON" value={expiringSupport.length} accent={expiringSupport.length > 0 ? '#d97706' : '#16a34a'} />
            <StatCard label="NO SUPPORT" value={noPromoSupport.length} accent={noPromoSupport.length > 5 ? '#dc2626' : 'var(--text-muted)'} />
          </div>

          {/* Category filters */}
          {Object.keys(summary.categories).length > 0 && (
            <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
              <button onClick={() => setFilterCategory('')} style={{ padding: '4px 10px', borderRadius: 4, fontFamily: FM, fontSize: 9, fontWeight: 700, cursor: 'pointer', border: !filterCategory ? '2px solid var(--brand-red)' : '1px solid var(--border-primary)', background: !filterCategory ? 'var(--brand-red-soft)' : 'var(--card-bg)', color: !filterCategory ? 'var(--brand-red)' : 'var(--text-muted)' }}>ALL</button>
              {Object.keys(summary.categories).map((cat) => (
                <button key={cat} onClick={() => setFilterCategory(filterCategory === cat ? '' : cat)} style={{ padding: '4px 10px', borderRadius: 4, fontFamily: FM, fontSize: 9, fontWeight: 700, cursor: 'pointer', border: filterCategory === cat ? '2px solid var(--brand-red)' : '1px solid var(--border-primary)', background: filterCategory === cat ? 'var(--brand-red-soft)' : 'var(--card-bg)', color: filterCategory === cat ? 'var(--brand-red)' : 'var(--text-muted)' }}>{cat}</button>
              ))}
            </div>
          )}

          {/* Top Opportunities Table */}
          <div style={{ ...card, overflow: 'auto' }}>
            <div style={{ ...cH, background: '#f0fdf4', borderBottomColor: '#bbf7d0' }}>
              <span style={{ color: '#16a34a' }}>TOP OPPORTUNITIES — WHAT TO SELL FIRST</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Score', 'Stock', 'Unit', 'Category', 'MSRP', 'Age', 'Promo', 'Est. Payment*', ''].map((h) => <th key={h} style={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {matchedItems.filter((i) => !filterCategory || i.category === filterCategory).slice(0, 25).map((i) => {
                  const aging = getAgingBucket(i.floorplanDays || 0);
                  const mc = MATCH_CONFIDENCE[i._bestPromoConfidence] || MATCH_CONFIDENCE.none;
                  const pe = i._paymentEstimate;
                  return (
                    <tr key={i.id} onClick={() => setSelectedUnit(selectedUnit?.id === i.id ? null : i)} style={{ cursor: 'pointer', background: selectedUnit?.id === i.id ? 'var(--brand-red-soft)' : 'transparent' }}
                      onMouseEnter={(e) => { if (selectedUnit?.id !== i.id) e.currentTarget.style.background = 'var(--row-hover)'; }}
                      onMouseLeave={(e) => { if (selectedUnit?.id !== i.id) e.currentTarget.style.background = 'transparent'; }}>
                      <td style={TD}>
                        <div style={{ fontFamily: FH, fontSize: 16, fontWeight: 700, color: i._opportunityScore >= 70 ? '#16a34a' : i._opportunityScore >= 50 ? '#d97706' : 'var(--text-muted)', lineHeight: 1 }}>{i._opportunityScore}</div>
                      </td>
                      <td style={{ ...TD, fontFamily: FM, fontWeight: 700 }}>{i.stock || '\u2014'}</td>
                      <td style={TD}>
                        <div style={{ fontFamily: FH, fontSize: 11, fontWeight: 600 }}>{i.year} {i.make}</div>
                        <div style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)' }}>{i.model} {i.trim}</div>
                      </td>
                      <td style={{ ...TD, fontFamily: FM, fontSize: 9, fontWeight: 700, color: 'var(--text-muted)' }}>{i.category}</td>
                      <td style={{ ...TD, fontFamily: FM, fontWeight: 700 }}>{i.msrp ? '$' + i.msrp.toLocaleString() : '\u2014'}</td>
                      <td style={TD}><span style={{ fontFamily: FM, fontSize: 10, fontWeight: 700, color: aging.color, background: aging.color + '15', padding: '1px 5px', borderRadius: 3 }}>{i.floorplanDays || 0}d</span></td>
                      <td style={TD}>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: FM, fontSize: 8, fontWeight: 700, color: mc.color, background: mc.color + '15', padding: '1px 5px', borderRadius: 3 }}>{mc.label}</span>
                          {i._hasPromoAPR && <span style={{ fontFamily: FM, fontSize: 8, fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '1px 5px', borderRadius: 3 }}>APR</span>}
                          {i._hasRebate && <span style={{ fontFamily: FM, fontSize: 8, fontWeight: 700, color: '#d97706', background: '#fef3c7', padding: '1px 5px', borderRadius: 3 }}>REBATE</span>}
                        </div>
                      </td>
                      <td style={TD}>
                        {pe ? (
                          <div>
                            <span style={{ fontFamily: FM, fontSize: 11, fontWeight: 700, color: '#16a34a' }}>${pe.promoPayment.toFixed(0)}/mo</span>
                            {pe.monthlySavings > 0 && <span style={{ fontFamily: FM, fontSize: 9, color: '#d97706', marginLeft: 4 }}>(-${pe.monthlySavings.toFixed(0)})</span>}
                          </div>
                        ) : <span style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)' }}>\u2014</span>}
                      </td>
                      <td style={{ ...TD, fontFamily: FM, fontSize: 10, color: 'var(--brand-red)', cursor: 'pointer' }}>{selectedUnit?.id === i.id ? '\u25B2' : '\u25BC'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ padding: '6px 14px', fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', fontStyle: 'italic', borderTop: '1px solid var(--border-secondary)' }}>
              *Payment estimates assume 7.99% standard APR, 60mo term, $0 down. Promo rates applied where matched. Not a lender quote.
            </div>
          </div>

          {/* Unit Detail Panel (expandable) */}
          {selectedUnit && (
            <div style={{ marginTop: 12 }}>
              <div style={{ ...card }}>
                <div style={{ ...cH, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{selectedUnit.year} {selectedUnit.make} {selectedUnit.model} — SALES INTELLIGENCE</span>
                  <button onClick={() => setSelectedUnit(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14 }}>{'\u2715'}</button>
                </div>
                <div style={{ padding: 14 }}>
                  <UnitDetail unit={selectedUnit} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ ALL UNITS VIEW ═══ */}
      {subView === 'active' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 200 }}><input value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inp, padding: '8px 12px' }} placeholder="Search stock #, VIN, make, model..." /></div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ ...inp, width: 'auto', padding: '8px 10px' }}>
              <option value="">All Statuses</option>
              {Object.entries(UNIT_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div style={{ ...card, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Stock', 'Year', 'Make', 'Model', 'Category', 'MSRP', 'Age', 'Status', ...(canManage ? [''] : [])].map((h) => <th key={h} style={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={9} style={{ ...TD, padding: 30, textAlign: 'center', color: 'var(--text-muted)', fontFamily: FM, fontSize: 11 }}>NO INVENTORY{items.length === 0 ? '. Import a DMS export to get started.' : ' matching filters.'}</td></tr>}
                {filtered.map((i) => {
                  const aging = getAgingBucket(i.floorplanDays || 0);
                  const statusObj = UNIT_STATUSES[i.status] || UNIT_STATUSES.in_stock;
                  return (
                    <tr key={i.id} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--row-hover)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ ...TD, fontFamily: FM, fontWeight: 700 }}>{i.stock || '\u2014'}</td>
                      <td style={{ ...TD, fontFamily: FM }}>{i.year}</td>
                      <td style={{ ...TD, fontFamily: FH, fontWeight: 600 }}>{i.make}</td>
                      <td style={TD}>{i.model} {i.trim ? <span style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)' }}>{i.trim}</span> : ''}</td>
                      <td style={{ ...TD, fontFamily: FM, fontSize: 9, fontWeight: 700, color: 'var(--text-muted)' }}>{i.category || '\u2014'}</td>
                      <td style={{ ...TD, fontFamily: FM, fontWeight: 700 }}>{i.msrp ? '$' + i.msrp.toLocaleString() : '\u2014'}</td>
                      <td style={TD}><span style={{ fontFamily: FM, fontSize: 10, fontWeight: 700, color: aging.color, background: aging.color + '15', padding: '1px 6px', borderRadius: 3 }}>{i.floorplanDays || 0}d</span></td>
                      <td style={TD}><span style={{ fontFamily: FM, fontSize: 9, fontWeight: 700, color: statusObj.color, background: statusObj.bg, padding: '2px 6px', borderRadius: 3 }}>{statusObj.label}</span></td>
                      {canManage && <td style={TD}><button onClick={() => saveInventoryItems(items.filter((x) => x.id !== i.id))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>{'\u2715'}</button></td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ AGED VIEW ═══ */}
      {subView === 'aged' && (
        <div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            {AGING_BUCKETS.map((bucket) => {
              const count = allEnriched.filter((i) => i.status === 'in_stock' && (i.floorplanDays || 0) >= bucket.min && (i.floorplanDays || 0) <= bucket.max).length;
              return (
                <div key={bucket.id} style={{ ...card, flex: 1, minWidth: 100, textAlign: 'center', padding: '12px 8px' }}>
                  <div style={{ fontFamily: FH, fontSize: 24, fontWeight: 700, color: bucket.color, lineHeight: 1 }}>{count}</div>
                  <div style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)', letterSpacing: 1, marginTop: 3 }}>{bucket.label.toUpperCase()}</div>
                </div>
              );
            })}
          </div>
          <div style={{ ...card, overflow: 'auto' }}>
            <div style={{ ...cH, background: '#fef2f2', borderBottomColor: '#fecaca' }}><span style={{ color: '#dc2626' }}>AGED 60+ DAYS — ACTION REQUIRED ({agedItems.length})</span></div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Score', 'Stock', 'Unit', 'MSRP', 'Days', 'Promo Support'].map((h) => <th key={h} style={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {agedItems.length === 0 && <tr><td colSpan={6} style={{ ...TD, padding: 20, textAlign: 'center', color: '#16a34a', fontFamily: FM, fontSize: 11 }}>{'\u2705'} No aged inventory — great job!</td></tr>}
                {agedItems.sort((a, b) => (b.floorplanDays || 0) - (a.floorplanDays || 0)).map((i) => {
                  const aging = getAgingBucket(i.floorplanDays || 0);
                  return (
                    <tr key={i.id}>
                      <td style={TD}><span style={{ fontFamily: FH, fontSize: 14, fontWeight: 700, color: i._opportunityScore >= 60 ? '#16a34a' : '#dc2626' }}>{i._opportunityScore}</span></td>
                      <td style={{ ...TD, fontFamily: FM, fontWeight: 700 }}>{i.stock}</td>
                      <td style={TD}>{i.year} {i.make} {i.model}</td>
                      <td style={{ ...TD, fontFamily: FM, fontWeight: 700 }}>{i.msrp ? '$' + i.msrp.toLocaleString() : '\u2014'}</td>
                      <td style={TD}><span style={{ fontFamily: FM, fontWeight: 700, color: aging.color }}>{i.floorplanDays}d</span></td>
                      <td style={TD}>{i._promoMatches.length > 0 ? <span style={{ fontFamily: FM, fontSize: 9, color: '#16a34a', fontWeight: 700 }}>{i._promoMatches.length} promo(s)</span> : <span style={{ fontFamily: FM, fontSize: 9, color: '#dc2626' }}>NONE</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ IMPORT REVIEW ═══ */}
      {subView === 'review' && parsedItems.length > 0 && (
        <div>
          {parseWarnings.map((w, i) => <div key={i} style={{ fontFamily: FM, fontSize: 11, color: '#2563eb', marginBottom: 4 }}>{w}</div>)}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontFamily: FH, fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>REVIEW ({parsedItems.length} units)</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setParsedItems([])} style={b2}>DISCARD</button>
              <button onClick={mergeImport} style={b2}>MERGE</button>
              <button onClick={publishParsedItems} style={b1}>REPLACE ({parsedItems.length})</button>
            </div>
          </div>
          <div style={{ ...card, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Stock', 'Year', 'Make', 'Model', 'Category', 'MSRP', 'Status', ''].map((h) => <th key={h} style={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {parsedItems.map((i) => (
                  <tr key={i.id}>
                    <td style={{ ...TD, fontFamily: FM, fontWeight: 700 }}>{i.stock}</td>
                    <td style={{ ...TD, fontFamily: FM }}>{i.year}</td>
                    <td style={{ ...TD, fontFamily: FH, fontWeight: 600 }}>{i.make}</td>
                    <td style={TD}>{i.model} {i.trim}</td>
                    <td style={{ ...TD, fontFamily: FM, fontSize: 9, color: 'var(--text-muted)' }}>{i.category || '?'}</td>
                    <td style={{ ...TD, fontFamily: FM, fontWeight: 700 }}>{i.msrp ? '$' + i.msrp.toLocaleString() : '\u2014'}</td>
                    <td style={TD}><span style={{ fontFamily: FM, fontSize: 9, fontWeight: 700, color: UNIT_STATUSES[i.status]?.color, background: UNIT_STATUSES[i.status]?.bg, padding: '2px 6px', borderRadius: 3 }}>{UNIT_STATUSES[i.status]?.label}</span></td>
                    <td style={TD}><button onClick={() => setParsedItems((p) => p.filter((x) => x.id !== i.id))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>{'\u2715'}</button></td>
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
