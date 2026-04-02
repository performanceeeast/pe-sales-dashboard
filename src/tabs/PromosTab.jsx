import React, { useState, useEffect, useCallback } from 'react';
import { MONTHS, UNIT_TYPES, UNIT_COLORS } from '../lib/constants';
import { Modal, styles, FM, FH } from '../components/SharedUI';
import { loadDocuments, uploadDocument, deleteDocument } from '../lib/storage';

const { card, cardHead: cH, input: inp, btn1: b1, btn2: b2, th: TH, td: TD, label: lbl } = styles;

const OEM_BRANDS = ['Polaris', 'Honda', 'Yamaha', 'Can-Am', 'Kawasaki', 'Sea-Doo', 'Suzuki', 'Mercury', 'Other'];
const DOC_CATEGORIES = [
  { id: 'price_list', label: 'OEM Price Lists', icon: '\uD83D\uDCB2' },
  { id: 'build_sheet', label: 'Build Sheets', icon: '\uD83D\uDEE0\uFE0F' },
  { id: 'promo_flyer', label: 'Promo Flyers', icon: '\uD83C\uDF1F' },
  { id: 'other', label: 'Other', icon: '\uD83D\uDCC4' },
];

export default function PromosTab({ month, year, promos, savePromos, priceList, savePriceList, currentUser }) {
  const [modal, setModal] = useState(null);
  const [editingPromo, setEditingPromo] = useState(null);
  const [editingUnit, setEditingUnit] = useState(null);
  const [tab, setTab] = useState('promos'); // 'promos' | 'pricing' | 'docs'
  const [search, setSearch] = useState('');

  // Document library state
  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('price_list');
  const [docFilter, setDocFilter] = useState('all');
  const [excelPreview, setExcelPreview] = useState(null);
  const [excelImporting, setExcelImporting] = useState(false);

  const isManager = currentUser?.role === 'admin' || currentUser?.role === 'gsm';
  const allPromos = promos || [];
  const allPricing = priceList || [];

  // Load documents when switching to docs tab
  const refreshDocs = useCallback(async () => {
    setDocsLoading(true);
    const d = await loadDocuments(docFilter === 'all' ? null : docFilter);
    setDocs(d);
    setDocsLoading(false);
  }, [docFilter]);

  useEffect(() => { if (tab === 'docs') refreshDocs(); }, [tab, refreshDocs]);

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const isExcel = file.name.match(/\.(xlsx?|xls|csv)$/i);

    // If Excel, try to parse and preview before uploading
    if (isExcel) {
      try {
        const XLSX = await import('xlsx');
        const data = await file.arrayBuffer();
        const wb = XLSX.read(data, { type: 'array' });
        const sheets = wb.SheetNames.map((name) => {
          const ws = wb.Sheets[name];
          const json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
          return { name, data: json.slice(0, 50), fullData: json, totalRows: json.length };
        });
        setExcelPreview({ file, sheets, fileName: file.name });
        setModal('excelPreview');
      } catch (err) {
        console.error('Excel parse error:', err);
        // Fall back to just uploading the file
        await doUpload(file);
      }
    } else {
      // PDF or other file — upload directly
      await doUpload(file);
    }
    e.target.value = '';
  }

  async function doUpload(file) {
    setUploading(true);
    await uploadDocument(file, uploadCategory, currentUser.id);
    setUploading(false);
    await refreshDocs();
  }

  async function handleDeleteDoc(doc) {
    if (!confirm(`Delete "${doc.name}"? This cannot be undone.`)) return;
    await deleteDocument(doc);
    await refreshDocs();
  }

  // Import Excel rows into price list
  async function handleExcelImport(sheet) {
    setExcelImporting(true);
    const rows = sheet.fullData;
    if (rows.length < 2) { setExcelImporting(false); return; }

    // Use first row as headers
    const headers = rows[0].map((h) => String(h).toLowerCase().trim().replace(/[^a-z0-9]/g, '_'));
    let imported = 0;

    for (let i = 1; i < rows.length; i++) {
      const row = {};
      headers.forEach((h, idx) => { row[h] = rows[i][idx] || ''; });

      const get = (...keys) => {
        for (const k of keys) { if (row[k] && String(row[k]).trim()) return String(row[k]).trim(); }
        return '';
      };

      const model = get('model', 'model_name', 'description', 'product', 'unit', 'name');
      const make = get('make', 'brand', 'manufacturer', 'oem');
      const msrp = parseInt(get('msrp', 'price', 'retail', 'retail_price', 'list_price', 'suggested_retail')) || 0;

      if (!model && !msrp) continue;

      const unit = {
        id: Date.now().toString() + '_' + i,
        year: parseInt(get('year', 'model_year', 'yr')) || new Date().getFullYear(),
        make: make || 'Unknown',
        model,
        unitType: guessUnitType(get('type', 'category', 'unit_type', 'class') || model),
        msrp,
        dealerCost: parseInt(get('dealer_cost', 'cost', 'dealer', 'wholesale', 'invoice', 'dealer_price')) || 0,
        notes: get('notes', 'options', 'color', 'trim', 'configuration', 'spec'),
      };
      imported++;
      savePriceList([...allPricing, unit]);
    }

    setExcelImporting(false);
    setExcelPreview(null);
    setModal(null);
    alert(`Imported ${imported} units into price list.`);
  }

  // Also upload the Excel file to document storage for reference
  async function handleExcelUploadOnly() {
    if (!excelPreview?.file) return;
    await doUpload(excelPreview.file);
    setExcelPreview(null);
    setModal(null);
  }

  function guessUnitType(text) {
    const t = text.toLowerCase();
    if (t.includes('atv') || t.includes('quad') || t.includes('fourtrax') || t.includes('sportsman') || t.includes('grizzly') || t.includes('kodiak')) return 'ATV';
    if (t.includes('sxs') || t.includes('side by side') || t.includes('ranger') || t.includes('general') || t.includes('rzr') || t.includes('maverick') || t.includes('talon') || t.includes('pioneer') || t.includes('teryx') || t.includes('mule')) return 'SXS';
    if (t.includes('pwc') || t.includes('jet ski') || t.includes('waverunner') || t.includes('sea-doo') || t.includes('spark') || t.includes('gti') || t.includes('rxt')) return 'PWC';
    if (t.includes('boat') || t.includes('pontoon') || t.includes('bass') || t.includes('center console') || t.includes('deck') || t.includes('fish')) return 'BOAT';
    if (t.includes('trailer')) return 'TRAILER';
    if (t.includes('youth') || t.includes('50cc') || t.includes('90cc') || t.includes('kids') || t.includes('outlaw 70')) return 'YOUTH';
    return 'SXS';
  }

  function formatFileSize(bytes) {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  // ── Promo form state ──
  const emptyPromo = { name: '', type: 'oem', brand: '', description: '', discount: '', startDate: '', endDate: '', active: true, unitTypes: [] };
  const [pf, setPf] = useState({ ...emptyPromo });

  function savePromo() {
    if (!pf.name.trim()) return;
    const promo = { ...pf, id: pf.id || Date.now().toString() };
    if (editingPromo) {
      savePromos(allPromos.map((p) => p.id === editingPromo.id ? promo : p));
    } else {
      savePromos([...allPromos, promo]);
    }
    setPf({ ...emptyPromo });
    setEditingPromo(null);
    setModal(null);
  }

  function deletePromo(id) {
    if (!confirm('Delete this promotion?')) return;
    savePromos(allPromos.filter((p) => p.id !== id));
  }

  function togglePromoActive(id) {
    savePromos(allPromos.map((p) => p.id === id ? { ...p, active: !p.active } : p));
  }

  // ── Pricing form state ──
  const emptyUnit = { year: new Date().getFullYear(), make: '', model: '', unitType: 'SXS', msrp: '', dealerCost: '', notes: '' };
  const [uf, setUf] = useState({ ...emptyUnit });

  function saveUnit() {
    if (!uf.make.trim() || !uf.model.trim()) return;
    const unit = { ...uf, id: uf.id || Date.now().toString(), msrp: parseInt(uf.msrp) || 0, dealerCost: parseInt(uf.dealerCost) || 0 };
    if (editingUnit) {
      savePriceList(allPricing.map((u) => u.id === editingUnit.id ? unit : u));
    } else {
      savePriceList([...allPricing, unit]);
    }
    setUf({ ...emptyUnit });
    setEditingUnit(null);
    setModal(null);
  }

  function deleteUnit(id) {
    savePriceList(allPricing.filter((u) => u.id !== id));
  }

  // Active vs expired promos
  const now = new Date().toISOString().split('T')[0];
  const activePromos = allPromos.filter((p) => p.active && (!p.endDate || p.endDate >= now));
  const expiredPromos = allPromos.filter((p) => !p.active || (p.endDate && p.endDate < now));

  // Filter pricing
  const filteredPricing = allPricing.filter((u) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (u.make || '').toLowerCase().includes(s)
      || (u.model || '').toLowerCase().includes(s)
      || (u.unitType || '').toLowerCase().includes(s)
      || String(u.year).includes(s);
  });

  // Auto-load docs on mount
  useEffect(() => { refreshDocs(); }, [refreshDocs]);

  return (
    <div>
      {/* ═══ DOCUMENT LIBRARY (Pricing & Current Promo Sheets) ═══ */}

      {/* REMOVED: Promotions view */}
      {false && /* ═══ PROMOTIONS VIEW ═══ */}
      {tab === 'promos' && (
        <div>
          {/* Active Promos */}
          <div style={{ fontFamily: FH, fontSize: 12, fontWeight: 700, color: '#16a34a', letterSpacing: 1, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            ACTIVE PROMOTIONS ({activePromos.length})
          </div>
          {activePromos.length === 0 && (
            <div style={{ ...card, padding: 24, textAlign: 'center', fontFamily: FM, fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>
              No active promotions for {MONTHS[month]}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {activePromos.map((p) => (
              <div key={p.id} style={{ ...card, padding: '14px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{
                        fontFamily: FM, fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 3,
                        background: p.type === 'oem' ? '#eff6ff' : '#f0fdf4',
                        color: p.type === 'oem' ? '#2563eb' : '#16a34a',
                      }}>{p.type === 'oem' ? 'OEM' : 'DEALER'}</span>
                      {p.brand && <span style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', fontWeight: 600 }}>{p.brand}</span>}
                      {p.unitTypes?.length > 0 && p.unitTypes.map((ut) => (
                        <span key={ut} style={{ fontFamily: FM, fontSize: 8, fontWeight: 700, color: UNIT_COLORS[ut] || 'var(--text-muted)' }}>{ut}</span>
                      ))}
                    </div>
                    <div style={{ fontFamily: FH, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{p.name}</div>
                    {p.description && <div style={{ fontFamily: FM, fontSize: 11, color: 'var(--text-secondary)', marginTop: 3, lineHeight: 1.4 }}>{p.description}</div>}
                    {p.discount && <div style={{ fontFamily: FH, fontSize: 14, fontWeight: 700, color: '#16a34a', marginTop: 4 }}>{p.discount}</div>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    {(p.startDate || p.endDate) && (
                      <div style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)' }}>
                        {p.startDate || '?'} — {p.endDate || 'Ongoing'}
                      </div>
                    )}
                    {isManager && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => { setPf({ ...p }); setEditingPromo(p); setModal('addPromo'); }} style={{
                          background: 'none', border: 'none', fontFamily: FM, fontSize: 9, color: 'var(--brand-red)', cursor: 'pointer', fontWeight: 700,
                        }}>EDIT</button>
                        <button onClick={() => togglePromoActive(p.id)} style={{
                          background: 'none', border: 'none', fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 700,
                        }}>ARCHIVE</button>
                        <button onClick={() => deletePromo(p.id)} style={{
                          background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13,
                        }}>✕</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Expired/Archived */}
          {expiredPromos.length > 0 && (
            <>
              <div style={{ fontFamily: FH, fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 8 }}>
                ARCHIVED ({expiredPromos.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, opacity: 0.6 }}>
                {expiredPromos.map((p) => (
                  <div key={p.id} style={{ ...card, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontFamily: FM, fontSize: 9, fontWeight: 700, color: p.type === 'oem' ? '#2563eb' : '#16a34a', marginRight: 6 }}>{p.type === 'oem' ? 'OEM' : 'DEALER'}</span>
                      <span style={{ fontFamily: FH, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{p.name}</span>
                      {p.discount && <span style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)', marginLeft: 8 }}>{p.discount}</span>}
                    </div>
                    {isManager && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => togglePromoActive(p.id)} style={{ background: 'none', border: 'none', fontFamily: FM, fontSize: 9, color: '#16a34a', cursor: 'pointer', fontWeight: 700 }}>REACTIVATE</button>
                        <button onClick={() => deletePromo(p.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>✕</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══ PRICE LIST VIEW ═══ */}
      {false && (
        <div>
          <div style={{ marginBottom: 12 }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inp, maxWidth: 400, padding: '8px 12px' }} placeholder="Search make, model, year, type..." />
          </div>
          <div style={{ ...card, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Year', 'Make', 'Model', 'Type', 'MSRP', 'Dealer Cost', 'Margin', 'Notes', ...(isManager ? [''] : [])].map((h) => <th key={h || '_'} style={TH}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filteredPricing.length === 0 && (
                  <tr><td colSpan={9} style={{ ...TD, padding: 30, textAlign: 'center', color: 'var(--text-muted)', fontFamily: FM, fontSize: 11 }}>NO UNITS IN PRICE LIST</td></tr>
                )}
                {filteredPricing.sort((a, b) => (a.make + a.model).localeCompare(b.make + b.model)).map((u) => {
                  const margin = u.msrp && u.dealerCost ? u.msrp - u.dealerCost : null;
                  return (
                    <tr key={u.id} style={{ cursor: isManager ? 'pointer' : 'default' }}
                      onClick={() => { if (isManager) { setUf({ ...u }); setEditingUnit(u); setModal('addUnit'); } }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--row-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ ...TD, fontFamily: FM, fontSize: 11 }}>{u.year}</td>
                      <td style={{ ...TD, fontFamily: FH, fontWeight: 600 }}>{u.make}</td>
                      <td style={{ ...TD, fontWeight: 500 }}>{u.model}</td>
                      <td style={TD}><span style={{ fontFamily: FM, fontSize: 9, fontWeight: 700, color: UNIT_COLORS[u.unitType] || 'var(--text-muted)' }}>{u.unitType}</span></td>
                      <td style={{ ...TD, fontFamily: FM, fontWeight: 700, color: 'var(--text-primary)' }}>{u.msrp ? '$' + u.msrp.toLocaleString() : '—'}</td>
                      <td style={{ ...TD, fontFamily: FM, color: 'var(--text-secondary)' }}>{u.dealerCost ? '$' + u.dealerCost.toLocaleString() : '—'}</td>
                      <td style={{ ...TD, fontFamily: FM, fontWeight: 700, color: margin > 0 ? '#16a34a' : 'var(--text-muted)' }}>{margin !== null ? '$' + margin.toLocaleString() : '—'}</td>
                      <td style={{ ...TD, fontFamily: FM, fontSize: 10, color: 'var(--text-muted)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.notes || '—'}</td>
                      {isManager && (
                        <td style={TD} onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => deleteUnit(u.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>✕</button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>
            {filteredPricing.length} unit{filteredPricing.length !== 1 ? 's' : ''} in price list{isManager ? ' · Click row to edit' : ''}
          </div>
        </div>
      )}

      {/* ═══ DOCUMENT LIBRARY VIEW ═══ */}
      {(
        <div>
          {/* Upload bar */}
          {isManager && (
            <div style={{ ...card, padding: '14px 18px', marginBottom: 14, display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ ...lbl, marginBottom: 4 }}>UPLOAD FILE (PDF, Excel, Images)</label>
                <input type="file" accept=".pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg,.doc,.docx" onChange={handleFileUpload} style={{
                  fontFamily: FM, fontSize: 11, color: 'var(--text-primary)', padding: 6,
                  background: 'var(--input-bg)', border: '1px solid var(--input-border)',
                  borderRadius: 6, width: '100%', boxSizing: 'border-box',
                }} />
              </div>
              <div>
                <label style={{ ...lbl, marginBottom: 4 }}>FOLDER</label>
                <select value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)} style={{ ...inp, width: 'auto', padding: '7px 10px' }}>
                  {DOC_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                </select>
              </div>
              {uploading && <span style={{ fontFamily: FM, fontSize: 10, color: 'var(--brand-red)', fontWeight: 700 }}>UPLOADING...</span>}
            </div>
          )}

          {/* Folder filter */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 14, flexWrap: 'wrap' }}>
            <button onClick={() => setDocFilter('all')} style={{
              padding: '6px 12px', borderRadius: 4, border: docFilter === 'all' ? '2px solid var(--brand-red)' : '1px solid var(--border-primary)',
              background: docFilter === 'all' ? 'var(--brand-red-soft)' : 'var(--card-bg)',
              fontFamily: FH, fontSize: 10, fontWeight: 700, color: docFilter === 'all' ? 'var(--brand-red)' : 'var(--text-secondary)', cursor: 'pointer',
            }}>ALL FILES ({docs.length})</button>
            {DOC_CATEGORIES.map((c) => {
              const count = docs.filter((d) => d.category === c.id).length;
              return (
                <button key={c.id} onClick={() => setDocFilter(c.id)} style={{
                  padding: '6px 12px', borderRadius: 4, border: docFilter === c.id ? '2px solid var(--brand-red)' : '1px solid var(--border-primary)',
                  background: docFilter === c.id ? 'var(--brand-red-soft)' : 'var(--card-bg)',
                  fontFamily: FM, fontSize: 10, fontWeight: 600, color: docFilter === c.id ? 'var(--brand-red)' : 'var(--text-secondary)', cursor: 'pointer',
                }}>{c.icon} {c.label} {count > 0 ? `(${count})` : ''}</button>
              );
            })}
          </div>

          {/* Document list */}
          {docsLoading ? (
            <div style={{ padding: 30, textAlign: 'center', fontFamily: FM, fontSize: 11, color: 'var(--text-muted)' }}>LOADING DOCUMENTS...</div>
          ) : docs.length === 0 ? (
            <div style={{ ...card, padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{'\uD83D\uDCC1'}</div>
              <div style={{ fontFamily: FH, fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>NO DOCUMENTS YET</div>
              <div style={{ fontFamily: FM, fontSize: 11, color: 'var(--text-muted)' }}>Upload OEM price lists, build sheets, and promo flyers above.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {docs.map((d) => {
                const cat = DOC_CATEGORIES.find((c) => c.id === d.category) || DOC_CATEGORIES[3];
                const isPdf = d.mime_type?.includes('pdf');
                const isExcel = d.name?.match(/\.(xlsx?|xls|csv)$/i);
                const isImage = d.mime_type?.includes('image');
                const fileIcon = isPdf ? '\uD83D\uDCC4' : isExcel ? '\uD83D\uDCCA' : isImage ? '\uD83D\uDDBC\uFE0F' : '\uD83D\uDCC1';

                return (
                  <div key={d.id} style={{ ...card, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 24, flexShrink: 0 }}>{fileIcon}</div>
                    <div style={{ flex: 1, minWidth: 150 }}>
                      <div style={{ fontFamily: FH, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{d.name}</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{
                          fontFamily: FM, fontSize: 8, fontWeight: 700, padding: '1px 6px', borderRadius: 3,
                          background: 'var(--brand-red-soft)', color: 'var(--brand-red)',
                        }}>{cat.label}</span>
                        <span style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)' }}>{formatFileSize(d.file_size)}</span>
                        <span style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)' }}>{d.created_at ? new Date(d.created_at).toLocaleDateString() : ''}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <a href={d.file_path} target="_blank" rel="noopener noreferrer" style={{
                        ...b2, padding: '5px 12px', fontSize: 9, textDecoration: 'none', display: 'inline-block',
                      }}>VIEW</a>
                      <a href={d.file_path} download={d.name} style={{
                        ...b2, padding: '5px 12px', fontSize: 9, textDecoration: 'none', display: 'inline-block',
                      }}>DOWNLOAD</a>
                      {isManager && (
                        <button onClick={() => handleDeleteDoc(d)} style={{
                          background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14,
                        }}>✕</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ EXCEL PREVIEW MODAL ═══ */}
      <Modal open={modal === 'excelPreview'} onClose={() => { setModal(null); setExcelPreview(null); }} title={'Excel File: ' + (excelPreview?.fileName || '')} wide>
        {excelPreview && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 14px', fontFamily: FM, fontSize: 11, color: '#2563eb', lineHeight: 1.6 }}>
              This Excel file has {excelPreview.sheets.length} sheet{excelPreview.sheets.length > 1 ? 's' : ''}.
              You can import rows into the price list, or just store the file in the document library.
            </div>

            {excelPreview.sheets.map((sheet) => (
              <div key={sheet.name} style={card}>
                <div style={{ ...cH, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{sheet.name} ({sheet.totalRows} rows)</span>
                  <button onClick={() => handleExcelImport(sheet)} disabled={excelImporting} style={{
                    ...b1, padding: '4px 12px', fontSize: 9, opacity: excelImporting ? 0.6 : 1,
                  }}>{excelImporting ? 'IMPORTING...' : 'IMPORT TO PRICE LIST'}</button>
                </div>
                <div style={{ overflow: 'auto', maxHeight: 250 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>{(sheet.data[0] || []).slice(0, 8).map((h, i) => <th key={i} style={{ ...TH, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{String(h)}</th>)}</tr>
                    </thead>
                    <tbody>
                      {sheet.data.slice(1, 10).map((row, ri) => (
                        <tr key={ri}>{row.slice(0, 8).map((cell, ci) => (
                          <td key={ci} style={{ ...TD, fontSize: 10, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(cell)}</td>
                        ))}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {sheet.totalRows > 10 && (
                  <div style={{ padding: '6px 14px', fontFamily: FM, fontSize: 10, color: 'var(--text-muted)', borderTop: '1px solid var(--border-secondary)' }}>
                    Showing 9 of {sheet.totalRows - 1} data rows
                  </div>
                )}
              </div>
            ))}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setModal(null); setExcelPreview(null); }} style={b2}>CANCEL</button>
              <button onClick={handleExcelUploadOnly} style={{ ...b2, color: '#2563eb', borderColor: '#bfdbfe' }}>STORE FILE ONLY</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Promo/Unit modals hidden — document-only view */}
      {false && <Modal open={modal === 'addPromo'} onClose={() => { setModal(null); setEditingPromo(null); }} title={editingPromo ? 'Edit Promotion' : 'New Promotion'} wide>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><label style={lbl}>PROMOTION NAME</label><input value={pf.name} onChange={(e) => setPf({ ...pf, name: e.target.value })} style={inp} placeholder="e.g. Spring SXS Blowout" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={lbl}>TYPE</label>
              <select value={pf.type} onChange={(e) => setPf({ ...pf, type: e.target.value })} style={inp}>
                <option value="oem">OEM / Manufacturer</option>
                <option value="dealer">Dealer Special</option>
              </select>
            </div>
            <div><label style={lbl}>BRAND</label>
              <select value={pf.brand} onChange={(e) => setPf({ ...pf, brand: e.target.value })} style={inp}>
                <option value="">— All Brands —</option>
                {OEM_BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <div><label style={lbl}>DESCRIPTION / DETAILS</label><textarea value={pf.description} onChange={(e) => setPf({ ...pf, description: e.target.value })} style={{ ...inp, minHeight: 60, resize: 'vertical' }} placeholder="Promo details, terms, eligibility..." /></div>
          <div><label style={lbl}>DISCOUNT / OFFER</label><input value={pf.discount} onChange={(e) => setPf({ ...pf, discount: e.target.value })} style={inp} placeholder="e.g. $1,500 Off MSRP, 3.99% for 60 mo, Free Winch" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={lbl}>START DATE</label><input type="date" value={pf.startDate} onChange={(e) => setPf({ ...pf, startDate: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>END DATE</label><input type="date" value={pf.endDate} onChange={(e) => setPf({ ...pf, endDate: e.target.value })} style={inp} /></div>
          </div>
          <div>
            <label style={lbl}>APPLIES TO UNIT TYPES</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {UNIT_TYPES.map((ut) => {
                const sel = (pf.unitTypes || []).includes(ut);
                return (
                  <button key={ut} onClick={() => setPf({ ...pf, unitTypes: sel ? pf.unitTypes.filter((x) => x !== ut) : [...(pf.unitTypes || []), ut] })} type="button" style={{
                    padding: '5px 12px', borderRadius: 4,
                    border: sel ? `2px solid ${UNIT_COLORS[ut]}` : '1px solid var(--border-primary)',
                    background: sel ? UNIT_COLORS[ut] + '15' : 'var(--card-bg)',
                    fontFamily: FM, fontSize: 10, fontWeight: sel ? 700 : 500,
                    color: UNIT_COLORS[ut], cursor: 'pointer',
                  }}>{sel ? '✓ ' : ''}{ut}</button>
                );
              })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => { setModal(null); setEditingPromo(null); }} style={b2}>CANCEL</button>
            <button onClick={savePromo} style={b1}>{editingPromo ? 'UPDATE' : 'CREATE'} PROMO</button>
          </div>
        </div>
      </Modal>}
    </div>
  );
}
