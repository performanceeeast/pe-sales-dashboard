import React, { useState, useEffect, useCallback } from 'react';
import { Modal, styles, FM, FH } from '../components/SharedUI';
import { loadDocuments, uploadDocument, deleteDocument } from '../lib/storage';
import { canManagePromos } from '../lib/auth';
import { UPLOAD_TYPES, PROMO_STATUSES, OEM_BRANDS, getActivePromos, getExpiringPromos } from '../lib/promoConstants';
import { parseExcelFile } from '../lib/promoParser';

const { card, cardHead: cH, input: inp, btn1: b1, btn2: b2, th: TH, td: TD, label: lbl } = styles;

const DOC_CATEGORIES = [
  { id: 'price_list', label: 'Price Lists', icon: '\uD83D\uDCB2' },
  { id: 'promo_flyer', label: 'Promo Sheets', icon: '\uD83C\uDF1F' },
  { id: 'build_sheet', label: 'Build Sheets', icon: '\uD83D\uDEE0\uFE0F' },
  { id: 'other', label: 'Other', icon: '\uD83D\uDCC4' },
];

export default function PromosTab({ currentUser, storeId, storeConfig, promoRecords, savePromoRecords, pricingRecords, savePricingRecords }) {
  const [subView, setSubView] = useState('promos'); // promos | pricing | docs | upload
  const [modal, setModal] = useState(null);
  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('promo_flyer');
  const [docFilter, setDocFilter] = useState('all');
  const [viewingDoc, setViewingDoc] = useState(null);

  // Upload + parse state
  const [uploadType, setUploadType] = useState('monthly_promo');
  const [uploadBrand, setUploadBrand] = useState('');
  const [uploadStartDate, setUploadStartDate] = useState('');
  const [uploadEndDate, setUploadEndDate] = useState('');
  const [parsedRecords, setParsedRecords] = useState([]);
  const [parseWarnings, setParseWarnings] = useState([]);
  const [editingRecord, setEditingRecord] = useState(null);

  const canManage = canManagePromos(currentUser);
  const unitTypes = storeConfig?.unit_types || [];
  const activePromos = getActivePromos(promoRecords, storeId);
  const expiringPromos = getExpiringPromos(promoRecords, storeId);

  const refreshDocs = useCallback(async () => {
    setDocsLoading(true);
    const d = await loadDocuments(docFilter === 'all' ? null : docFilter, storeId);
    setDocs(d);
    setDocsLoading(false);
  }, [docFilter, storeId]);

  useEffect(() => { if (subView === 'docs') refreshDocs(); }, [subView, refreshDocs]);

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Upload file to Supabase storage
    setUploading(true);
    const doc = await uploadDocument(file, uploadCategory, currentUser.id, storeId);
    setUploading(false);

    // If Excel, attempt to parse
    const isExcel = file.name.match(/\.(xlsx?|xls|csv)$/i);
    if (isExcel && savePromoRecords) {
      try {
        const data = await file.arrayBuffer();
        const isPricingType = ['price_list', 'msrp_sheet', 'carryover_pricing'].includes(uploadType);
        const result = await parseExcelFile(data, uploadType, {
          brand: uploadBrand,
          storeIds: storeId ? [storeId] : [],
          effectiveStart: uploadStartDate,
          effectiveEnd: uploadEndDate,
          fileType: uploadType,
        });
        setParsedRecords(result.records.map((r) => ({
          ...r,
          sourceFileId: doc?.id || null,
          sourceFileName: file.name,
          createdBy: currentUser?.id || '',
          _isPricing: isPricingType,
        })));
        setParseWarnings(result.warnings);
        setSubView('upload');
      } catch (err) {
        console.error('Parse error:', err);
        alert('File uploaded but could not be parsed. It is available in Documents.');
      }
    }

    if (subView === 'docs') refreshDocs();
    e.target.value = '';
  }

  function publishRecord(record) {
    const published = { ...record, status: 'published', publishedBy: currentUser?.id, publishedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    if (record._isPricing) {
      savePricingRecords([...(pricingRecords || []), published]);
    } else {
      savePromoRecords([...(promoRecords || []), published]);
    }
    setParsedRecords((prev) => prev.filter((r) => r.id !== record.id));
  }

  function publishAllDrafts() {
    const now = new Date().toISOString();
    const promos = [];
    const pricing = [];
    parsedRecords.forEach((r) => {
      const published = { ...r, status: 'published', publishedBy: currentUser?.id, publishedAt: now, updatedAt: now };
      if (r._isPricing) pricing.push(published);
      else promos.push(published);
    });
    if (promos.length > 0) savePromoRecords([...(promoRecords || []), ...promos]);
    if (pricing.length > 0) savePricingRecords([...(pricingRecords || []), ...pricing]);
    setParsedRecords([]);
  }

  function deletePromoRecord(id) {
    savePromoRecords((promoRecords || []).filter((r) => r.id !== id));
  }

  function archivePromoRecord(id) {
    savePromoRecords((promoRecords || []).map((r) => r.id === id ? { ...r, status: 'archived', updatedAt: new Date().toISOString() } : r));
  }

  function formatFileSize(bytes) {
    if (!bytes) return '\u2014';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  return (
    <div>
      {/* Sub-nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 2, background: 'var(--tab-bg)', borderRadius: 6, padding: 2 }}>
          {[
            { id: 'promos', label: `ACTIVE PROMOS (${activePromos.length})` },
            { id: 'pricing', label: `PRICING (${(pricingRecords || []).filter((r) => r.status === 'published').length})` },
            { id: 'docs', label: 'DOCUMENTS' },
            ...(parsedRecords.length > 0 ? [{ id: 'upload', label: `REVIEW (${parsedRecords.length})` }] : []),
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
      </div>

      {/* Upload bar (shown on all sub-views for managers) */}
      {canManage && subView !== 'upload' && (
        <div style={{ ...card, padding: '12px 16px', marginBottom: 14, display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 140 }}>
            <label style={lbl}>FILE TYPE</label>
            <select value={uploadType} onChange={(e) => setUploadType(e.target.value)} style={{ ...inp, padding: '6px 8px' }}>
              {UPLOAD_TYPES.map((t) => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
            </select>
          </div>
          <div style={{ minWidth: 120 }}>
            <label style={lbl}>BRAND</label>
            <select value={uploadBrand} onChange={(e) => setUploadBrand(e.target.value)} style={{ ...inp, padding: '6px 8px' }}>
              <option value="">— All —</option>
              {OEM_BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div style={{ minWidth: 120 }}>
            <label style={lbl}>EFFECTIVE FROM</label>
            <input type="date" value={uploadStartDate} onChange={(e) => setUploadStartDate(e.target.value)} style={{ ...inp, padding: '6px 8px' }} />
          </div>
          <div style={{ minWidth: 120 }}>
            <label style={lbl}>EFFECTIVE TO</label>
            <input type="date" value={uploadEndDate} onChange={(e) => setUploadEndDate(e.target.value)} style={{ ...inp, padding: '6px 8px' }} />
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={lbl}>UPLOAD FILE</label>
            <input type="file" accept=".pdf,.xlsx,.xls,.csv,.png,.jpg,.doc,.docx" onChange={handleFileUpload} style={{
              fontFamily: FM, fontSize: 11, color: 'var(--text-primary)', padding: 4,
              background: 'var(--input-bg)', border: '1px solid var(--input-border)',
              borderRadius: 6, width: '100%', boxSizing: 'border-box',
            }} />
          </div>
          {uploading && <span style={{ fontFamily: FM, fontSize: 10, color: 'var(--brand-red)', fontWeight: 700 }}>UPLOADING...</span>}
        </div>
      )}

      {/* ═══ ACTIVE PROMOS VIEW ═══ */}
      {subView === 'promos' && (
        <div>
          {/* Expiring soon alert */}
          {expiringPromos.length > 0 && (
            <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 16px', marginBottom: 14, fontFamily: FM, fontSize: 11, color: '#d97706', fontWeight: 600 }}>
              {'\u26A0\uFE0F'} {expiringPromos.length} promo{expiringPromos.length > 1 ? 's' : ''} expiring within 7 days
            </div>
          )}

          {activePromos.length === 0 ? (
            <div style={{ ...card, padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{'\uD83C\uDF1F'}</div>
              <div style={{ fontFamily: FH, fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>NO ACTIVE PROMOTIONS</div>
              <div style={{ fontFamily: FM, fontSize: 11, color: 'var(--text-muted)' }}>Upload promo files above to get started. Excel files will be auto-parsed.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activePromos.map((p) => {
                const isExpiring = expiringPromos.find((x) => x.id === p.id);
                return (
                  <div key={p.id} style={{ ...card, padding: '14px 18px', borderLeft: `4px solid ${isExpiring ? '#d97706' : '#16a34a'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          {p.brand && <span style={{ fontFamily: FM, fontSize: 9, fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '1px 6px', borderRadius: 3 }}>{p.brand}</span>}
                          {p.type && <span style={{ fontFamily: FM, fontSize: 8, color: 'var(--text-muted)' }}>{UPLOAD_TYPES.find((t) => t.id === p.type)?.label || p.type}</span>}
                          {p.categories?.map((c) => <span key={c} style={{ fontFamily: FM, fontSize: 8, fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '1px 5px', borderRadius: 3 }}>{c}</span>)}
                        </div>
                        <div style={{ fontFamily: FH, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{p.programName}</div>
                        {p.aprRate !== null && <div style={{ fontFamily: FM, fontSize: 12, color: '#16a34a', fontWeight: 700, marginTop: 2 }}>{p.aprRate}% APR{p.aprTerm ? ` for ${p.aprTerm} months` : ''}</div>}
                        {p.rebateAmount && <div style={{ fontFamily: FM, fontSize: 12, color: '#d97706', fontWeight: 700, marginTop: 2 }}>${p.rebateAmount.toLocaleString()} Rebate</div>}
                        {p.customerCash && <div style={{ fontFamily: FM, fontSize: 12, color: '#7c3aed', fontWeight: 700, marginTop: 2 }}>${p.customerCash.toLocaleString()} Customer Cash</div>}
                        {p.notes && <div style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{p.notes}</div>}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        <div style={{ fontFamily: FM, fontSize: 9, color: isExpiring ? '#d97706' : 'var(--text-muted)' }}>
                          {p.effectiveStart || '?'} — {p.effectiveEnd || 'Ongoing'}
                        </div>
                        {canManage && (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button onClick={() => archivePromoRecord(p.id)} style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>ARCHIVE</button>
                            <button onClick={() => deletePromoRecord(p.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>{'\u2715'}</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Archived promos */}
          {(promoRecords || []).filter((p) => p.status === 'archived' || p.status === 'expired').length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontFamily: FH, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 6 }}>ARCHIVED ({(promoRecords || []).filter((p) => p.status === 'archived' || p.status === 'expired').length})</div>
              <div style={{ opacity: 0.5 }}>
                {(promoRecords || []).filter((p) => p.status === 'archived' || p.status === 'expired').map((p) => (
                  <div key={p.id} style={{ ...card, padding: '8px 14px', marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: FM, fontSize: 11 }}>{p.brand} — {p.programName}</span>
                    <span style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)' }}>{p.effectiveStart} — {p.effectiveEnd}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ PRICING RECORDS VIEW ═══ */}
      {subView === 'pricing' && (
        <div>
          <div style={{ ...card, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Year', 'Make', 'Model', 'Trim', 'Category', 'MSRP', 'Freight', 'Status', ...(canManage ? [''] : [])].map((h) => <th key={h} style={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {(pricingRecords || []).length === 0 && <tr><td colSpan={9} style={{ ...TD, padding: 30, textAlign: 'center', color: 'var(--text-muted)', fontFamily: FM, fontSize: 11 }}>NO PRICING RECORDS. Upload a price list to get started.</td></tr>}
                {(pricingRecords || []).filter((r) => r.status === 'published').map((r) => (
                  <tr key={r.id}>
                    <td style={{ ...TD, fontFamily: FM }}>{r.year}</td>
                    <td style={{ ...TD, fontFamily: FH, fontWeight: 600 }}>{r.make}</td>
                    <td style={TD}>{r.model}</td>
                    <td style={{ ...TD, fontFamily: FM, fontSize: 10, color: 'var(--text-muted)' }}>{r.trim || '\u2014'}</td>
                    <td style={TD}><span style={{ fontFamily: FM, fontSize: 9, fontWeight: 700, color: 'var(--text-muted)' }}>{r.category || '\u2014'}</span></td>
                    <td style={{ ...TD, fontFamily: FM, fontWeight: 700 }}>{r.msrp ? '$' + r.msrp.toLocaleString() : '\u2014'}</td>
                    <td style={{ ...TD, fontFamily: FM, color: 'var(--text-secondary)' }}>{r.freight ? '$' + r.freight.toLocaleString() : '\u2014'}</td>
                    <td style={TD}><span style={{ fontFamily: FM, fontSize: 9, fontWeight: 700, color: PROMO_STATUSES[r.status]?.color, background: PROMO_STATUSES[r.status]?.bg, padding: '1px 6px', borderRadius: 3 }}>{PROMO_STATUSES[r.status]?.label}</span></td>
                    {canManage && <td style={TD}><button onClick={() => savePricingRecords((pricingRecords || []).filter((x) => x.id !== r.id))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>{'\u2715'}</button></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ UPLOAD REVIEW VIEW ═══ */}
      {subView === 'upload' && parsedRecords.length > 0 && (
        <div>
          {parseWarnings.length > 0 && (
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
              {parseWarnings.map((w, i) => <div key={i} style={{ fontFamily: FM, fontSize: 11, color: '#2563eb', lineHeight: 1.6 }}>{w}</div>)}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontFamily: FH, fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 1 }}>REVIEW PARSED RECORDS ({parsedRecords.length})</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setParsedRecords([])} style={b2}>DISCARD ALL</button>
              <button onClick={publishAllDrafts} style={b1}>PUBLISH ALL ({parsedRecords.length})</button>
            </div>
          </div>

          <div style={{ ...card, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{parsedRecords[0]?._isPricing ? ['Year', 'Make', 'Model', 'MSRP', 'Freight', ''] : ['Brand', 'Program', 'APR', 'Rebate', 'Dates', 'Categories', '']}.map((h) => <th key={h} style={TH}>{h}</th>)</tr></thead>
              <tbody>
                {parsedRecords.map((r) => r._isPricing ? (
                  <tr key={r.id}>
                    <td style={{ ...TD, fontFamily: FM }}>{r.year}</td>
                    <td style={{ ...TD, fontFamily: FH, fontWeight: 600 }}>{r.make}</td>
                    <td style={TD}>{r.model} {r.trim}</td>
                    <td style={{ ...TD, fontFamily: FM, fontWeight: 700 }}>${(r.msrp || 0).toLocaleString()}</td>
                    <td style={{ ...TD, fontFamily: FM }}>${(r.freight || 0).toLocaleString()}</td>
                    <td style={{ ...TD, display: 'flex', gap: 4 }}>
                      <button onClick={() => publishRecord(r)} style={{ ...b1, padding: '3px 10px', fontSize: 9 }}>PUBLISH</button>
                      <button onClick={() => setParsedRecords((prev) => prev.filter((x) => x.id !== r.id))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>{'\u2715'}</button>
                    </td>
                  </tr>
                ) : (
                  <tr key={r.id}>
                    <td style={{ ...TD, fontFamily: FM }}>{r.brand}</td>
                    <td style={{ ...TD, fontFamily: FH, fontWeight: 600 }}>{r.programName}</td>
                    <td style={{ ...TD, fontFamily: FM, color: r.aprRate !== null ? '#16a34a' : 'var(--text-muted)' }}>{r.aprRate !== null ? r.aprRate + '%' : '\u2014'}</td>
                    <td style={{ ...TD, fontFamily: FM, color: r.rebateAmount ? '#d97706' : 'var(--text-muted)' }}>{r.rebateAmount ? '$' + r.rebateAmount : '\u2014'}</td>
                    <td style={{ ...TD, fontFamily: FM, fontSize: 10 }}>{r.effectiveStart || '?'} — {r.effectiveEnd || '?'}</td>
                    <td style={{ ...TD, fontFamily: FM, fontSize: 9 }}>{r.categories?.join(', ') || 'All'}</td>
                    <td style={{ ...TD, display: 'flex', gap: 4 }}>
                      <button onClick={() => publishRecord(r)} style={{ ...b1, padding: '3px 10px', fontSize: 9 }}>PUBLISH</button>
                      <button onClick={() => setParsedRecords((prev) => prev.filter((x) => x.id !== r.id))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>{'\u2715'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ DOCUMENTS VIEW ═══ */}
      {subView === 'docs' && (
        <div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 14, flexWrap: 'wrap' }}>
            <button onClick={() => setDocFilter('all')} style={{ padding: '6px 12px', borderRadius: 4, border: docFilter === 'all' ? '2px solid var(--brand-red)' : '1px solid var(--border-primary)', background: docFilter === 'all' ? 'var(--brand-red-soft)' : 'var(--card-bg)', fontFamily: FH, fontSize: 10, fontWeight: 700, color: docFilter === 'all' ? 'var(--brand-red)' : 'var(--text-secondary)', cursor: 'pointer' }}>ALL ({docs.length})</button>
            {DOC_CATEGORIES.map((c) => {
              const count = docs.filter((d) => d.category === c.id).length;
              return (
                <button key={c.id} onClick={() => setDocFilter(c.id)} style={{ padding: '6px 12px', borderRadius: 4, border: docFilter === c.id ? '2px solid var(--brand-red)' : '1px solid var(--border-primary)', background: docFilter === c.id ? 'var(--brand-red-soft)' : 'var(--card-bg)', fontFamily: FM, fontSize: 10, fontWeight: 600, color: docFilter === c.id ? 'var(--brand-red)' : 'var(--text-secondary)', cursor: 'pointer' }}>{c.icon} {c.label} {count > 0 ? `(${count})` : ''}</button>
              );
            })}
          </div>

          {docsLoading ? (
            <div style={{ padding: 30, textAlign: 'center', fontFamily: FM, fontSize: 11, color: 'var(--text-muted)' }}>LOADING...</div>
          ) : docs.length === 0 ? (
            <div style={{ ...card, padding: 40, textAlign: 'center' }}>
              <div style={{ fontFamily: FM, fontSize: 11, color: 'var(--text-muted)' }}>No documents uploaded.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {docs.map((d) => {
                const cat = DOC_CATEGORIES.find((c) => c.id === d.category) || DOC_CATEGORIES[3];
                const isPdf = d.mime_type?.includes('pdf');
                const isImage = d.mime_type?.includes('image');
                const fileIcon = isPdf ? '\uD83D\uDCC4' : d.name?.match(/\.xlsx?$/i) ? '\uD83D\uDCCA' : isImage ? '\uD83D\uDDBC\uFE0F' : '\uD83D\uDCC1';
                return (
                  <div key={d.id} style={{ ...card, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 20 }}>{fileIcon}</div>
                    <div style={{ flex: 1, minWidth: 120 }}>
                      <div style={{ fontFamily: FH, fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{d.name}</div>
                      <div style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)' }}>{cat.label} · {formatFileSize(d.file_size)} · {d.created_at ? new Date(d.created_at).toLocaleDateString() : ''}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => setViewingDoc(d)} style={{ ...b1, padding: '4px 10px', fontSize: 9 }}>VIEW</button>
                      <a href={d.file_path} download={d.name} style={{ ...b2, padding: '4px 10px', fontSize: 9, textDecoration: 'none' }}>DL</a>
                      {canManage && <button onClick={async () => { if (confirm('Delete?')) { await deleteDocument(d); refreshDocs(); } }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>{'\u2715'}</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Document Viewer Modal */}
      <Modal open={!!viewingDoc} onClose={() => setViewingDoc(null)} title={viewingDoc?.name || 'Document'} wide>
        {viewingDoc && (() => {
          const isPdf = viewingDoc.mime_type?.includes('pdf');
          const isImage = viewingDoc.mime_type?.includes('image');
          return (
            <div>
              {isPdf && <iframe src={viewingDoc.file_path} style={{ width: '100%', height: '70vh', border: '1px solid var(--border-primary)', borderRadius: 6 }} title={viewingDoc.name} />}
              {isImage && <img src={viewingDoc.file_path} alt={viewingDoc.name} style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 6 }} />}
              {!isPdf && !isImage && <div style={{ padding: 30, textAlign: 'center' }}><a href={viewingDoc.file_path} target="_blank" rel="noopener noreferrer" style={{ ...b1, textDecoration: 'none' }}>OPEN IN NEW TAB</a></div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                <a href={viewingDoc.file_path} download={viewingDoc.name} style={{ ...b2, textDecoration: 'none' }}>DOWNLOAD</a>
                <button onClick={() => setViewingDoc(null)} style={b2}>CLOSE</button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
