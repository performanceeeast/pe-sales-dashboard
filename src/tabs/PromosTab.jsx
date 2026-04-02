import React, { useState, useEffect, useCallback } from 'react';
import { Modal, styles, FM, FH } from '../components/SharedUI';
import { loadDocuments, uploadDocument, deleteDocument } from '../lib/storage';
import { canManagePromos } from '../lib/auth';
import { OEM_BRANDS, PROMO_STATUSES, getActivePromos, getExpiringPromos } from '../lib/promoConstants';

const { card, cardHead: cH, input: inp, btn1: b1, btn2: b2, th: TH, td: TD, label: lbl } = styles;

export default function PromosTab({ currentUser, storeId, storeConfig, promoRecords, savePromoRecords, pricingRecords, savePricingRecords }) {
  const [subView, setSubView] = useState('programs'); // programs | docs
  const [modal, setModal] = useState(null);
  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Quick-add promo form
  const [pf, setPf] = useState({ programName: '', brand: '', type: 'monthly_promo', aprRate: '', rebateAmount: '', customerCash: '', effectiveStart: '', effectiveEnd: '', categories: [], notes: '' });

  const canManage = canManagePromos(currentUser);
  const activePromos = getActivePromos(promoRecords, storeId);
  const expiringPromos = getExpiringPromos(promoRecords, storeId);
  const unitTypes = storeConfig?.unit_types || [];

  const refreshDocs = useCallback(async () => {
    setDocsLoading(true);
    const d = await loadDocuments(null, storeId);
    setDocs(d);
    setDocsLoading(false);
  }, [storeId]);

  useEffect(() => { if (subView === 'docs') refreshDocs(); }, [subView, refreshDocs]);

  function addPromo() {
    if (!pf.programName.trim()) return;
    const promo = {
      ...pf,
      id: Date.now().toString(),
      status: 'published',
      storeIds: storeId ? [storeId] : [],
      aprRate: pf.aprRate ? parseFloat(pf.aprRate) : null,
      rebateAmount: pf.rebateAmount ? parseFloat(pf.rebateAmount) : null,
      customerCash: pf.customerCash ? parseFloat(pf.customerCash) : null,
      createdBy: currentUser?.id,
      createdAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
    };
    savePromoRecords([...(promoRecords || []), promo]);
    setPf({ programName: '', brand: '', type: 'monthly_promo', aprRate: '', rebateAmount: '', customerCash: '', effectiveStart: '', effectiveEnd: '', categories: [], notes: '' });
    setModal(null);
  }

  function deletePromo(id) { savePromoRecords((promoRecords || []).filter((r) => r.id !== id)); }
  function archivePromo(id) { savePromoRecords((promoRecords || []).map((r) => r.id === id ? { ...r, status: 'archived', updatedAt: new Date().toISOString() } : r)); }

  async function handleDocUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    await uploadDocument(file, 'promo_flyer', currentUser.id, storeId);
    setUploading(false);
    refreshDocs();
    e.target.value = '';
  }

  return (
    <div>
      {/* Sub-nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 2, background: 'var(--tab-bg)', borderRadius: 6, padding: 2 }}>
          {[{ id: 'programs', label: `CURRENT PROGRAMS (${activePromos.length})` }, { id: 'docs', label: 'DOCUMENTS' }].map((v) => (
            <button key={v.id} onClick={() => setSubView(v.id)} style={{
              padding: '6px 12px', borderRadius: 4, border: 'none', cursor: 'pointer',
              fontFamily: FH, fontSize: 9, fontWeight: 600, letterSpacing: 0.5,
              background: subView === v.id ? 'var(--brand-red)' : 'transparent',
              color: subView === v.id ? 'var(--text-inverse)' : 'var(--text-muted)',
              transition: 'all .15s',
            }}>{v.label}</button>
          ))}
        </div>
        {canManage && subView === 'programs' && (
          <button onClick={() => setModal('addPromo')} style={b1}>+ ADD PROGRAM</button>
        )}
      </div>

      {/* ═══ CURRENT PROGRAMS ═══ */}
      {subView === 'programs' && (
        <div>
          {expiringPromos.length > 0 && (
            <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 16px', marginBottom: 14, fontFamily: FM, fontSize: 11, color: '#d97706', fontWeight: 600 }}>
              {'\u26A0\uFE0F'} {expiringPromos.length} program{expiringPromos.length > 1 ? 's' : ''} expiring within 7 days
            </div>
          )}

          {activePromos.length === 0 ? (
            <div style={{ ...card, padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{'\uD83C\uDF1F'}</div>
              <div style={{ fontFamily: FH, fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>NO ACTIVE PROGRAMS</div>
              <div style={{ fontFamily: FM, fontSize: 11, color: 'var(--text-muted)' }}>Click "+ ADD PROGRAM" to add current OEM promotions and financing offers.</div>
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
                          {p.categories?.map((c) => <span key={c} style={{ fontFamily: FM, fontSize: 8, fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '1px 5px', borderRadius: 3 }}>{c}</span>)}
                        </div>
                        <div style={{ fontFamily: FH, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{p.programName}</div>
                        {p.aprRate !== null && p.aprRate !== undefined && <div style={{ fontFamily: FM, fontSize: 13, color: '#16a34a', fontWeight: 700, marginTop: 3 }}>{p.aprRate}% APR{p.aprTerm ? ` for ${p.aprTerm} months` : ''}</div>}
                        {p.rebateAmount && <div style={{ fontFamily: FM, fontSize: 13, color: '#d97706', fontWeight: 700, marginTop: 2 }}>${Number(p.rebateAmount).toLocaleString()} Rebate</div>}
                        {p.customerCash && <div style={{ fontFamily: FM, fontSize: 13, color: '#7c3aed', fontWeight: 700, marginTop: 2 }}>${Number(p.customerCash).toLocaleString()} Customer Cash</div>}
                        {p.notes && <div style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{p.notes}</div>}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        <div style={{ fontFamily: FM, fontSize: 9, color: isExpiring ? '#d97706' : 'var(--text-muted)' }}>{p.effectiveStart || '?'} — {p.effectiveEnd || 'Ongoing'}</div>
                        {canManage && (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button onClick={() => archivePromo(p.id)} style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>ARCHIVE</button>
                            <button onClick={() => deletePromo(p.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>{'\u2715'}</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Archived */}
          {(promoRecords || []).filter((p) => p.status === 'archived').length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontFamily: FH, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 6 }}>ARCHIVED ({(promoRecords || []).filter((p) => p.status === 'archived').length})</div>
              <div style={{ opacity: 0.5 }}>
                {(promoRecords || []).filter((p) => p.status === 'archived').map((p) => (
                  <div key={p.id} style={{ ...card, padding: '8px 14px', marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: FM, fontSize: 11 }}>{p.brand ? p.brand + ' — ' : ''}{p.programName}</span>
                    <span style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)' }}>{p.effectiveStart} — {p.effectiveEnd}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ DOCUMENTS ═══ */}
      {subView === 'docs' && (
        <div>
          {canManage && (
            <div style={{ marginBottom: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ ...b1, padding: '6px 14px', fontSize: 10, cursor: 'pointer' }}>
                UPLOAD FILE
                <input type="file" accept=".pdf,.xlsx,.xls,.csv,.png,.jpg,.doc,.docx" onChange={handleDocUpload} style={{ display: 'none' }} />
              </label>
              {uploading && <span style={{ fontFamily: FM, fontSize: 10, color: 'var(--brand-red)', fontWeight: 700 }}>UPLOADING...</span>}
            </div>
          )}
          {docsLoading ? (
            <div style={{ padding: 30, textAlign: 'center', fontFamily: FM, fontSize: 11, color: 'var(--text-muted)' }}>LOADING...</div>
          ) : docs.length === 0 ? (
            <div style={{ ...card, padding: 30, textAlign: 'center', fontFamily: FM, fontSize: 11, color: 'var(--text-muted)' }}>No documents uploaded.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {docs.map((d) => {
                const isPdf = d.mime_type?.includes('pdf');
                const isImage = d.mime_type?.includes('image');
                const icon = isPdf ? '\uD83D\uDCC4' : d.name?.match(/\.xlsx?$/i) ? '\uD83D\uDCCA' : isImage ? '\uD83D\uDDBC\uFE0F' : '\uD83D\uDCC1';
                return (
                  <div key={d.id} style={{ ...card, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 20 }}>{icon}</div>
                    <div style={{ flex: 1, minWidth: 120 }}>
                      <div style={{ fontFamily: FH, fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{d.name}</div>
                      <div style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)' }}>{d.created_at ? new Date(d.created_at).toLocaleDateString() : ''}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => setViewingDoc(d)} style={{ ...b1, padding: '4px 10px', fontSize: 9 }}>VIEW</button>
                      {canManage && <button onClick={async () => { if (confirm('Delete?')) { await deleteDocument(d); refreshDocs(); } }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>{'\u2715'}</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Program Modal */}
      <Modal open={modal === 'addPromo'} onClose={() => setModal(null)} title="Add Current Program" wide>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><label style={lbl}>PROGRAM NAME</label><input value={pf.programName} onChange={(e) => setPf({ ...pf, programName: e.target.value })} style={{ ...inp, fontSize: 14, fontWeight: 600 }} placeholder="e.g. Polaris Spring Sales Event" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={lbl}>BRAND</label>
              <select value={pf.brand} onChange={(e) => setPf({ ...pf, brand: e.target.value })} style={inp}>
                <option value="">— Select —</option>
                {OEM_BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div><label style={lbl}>CATEGORIES</label>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {unitTypes.map((ut) => {
                  const sel = pf.categories.includes(ut);
                  return <button key={ut} onClick={() => setPf({ ...pf, categories: sel ? pf.categories.filter((c) => c !== ut) : [...pf.categories, ut] })} type="button" style={{ padding: '3px 8px', borderRadius: 3, border: sel ? '2px solid var(--brand-red)' : '1px solid var(--border-primary)', background: sel ? 'var(--brand-red-soft)' : 'var(--card-bg)', fontFamily: FM, fontSize: 9, fontWeight: sel ? 700 : 500, color: sel ? 'var(--brand-red)' : 'var(--text-muted)', cursor: 'pointer' }}>{ut}</button>;
                })}
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div><label style={lbl}>APR RATE (%)</label><input type="number" step="0.01" value={pf.aprRate} onChange={(e) => setPf({ ...pf, aprRate: e.target.value })} style={inp} placeholder="0.00" /></div>
            <div><label style={lbl}>REBATE ($)</label><input type="number" value={pf.rebateAmount} onChange={(e) => setPf({ ...pf, rebateAmount: e.target.value })} style={inp} placeholder="0" /></div>
            <div><label style={lbl}>CUSTOMER CASH ($)</label><input type="number" value={pf.customerCash} onChange={(e) => setPf({ ...pf, customerCash: e.target.value })} style={inp} placeholder="0" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={lbl}>EFFECTIVE FROM</label><input type="date" value={pf.effectiveStart} onChange={(e) => setPf({ ...pf, effectiveStart: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>EFFECTIVE TO</label><input type="date" value={pf.effectiveEnd} onChange={(e) => setPf({ ...pf, effectiveEnd: e.target.value })} style={inp} /></div>
          </div>
          <div><label style={lbl}>NOTES</label><textarea value={pf.notes} onChange={(e) => setPf({ ...pf, notes: e.target.value })} style={{ ...inp, minHeight: 50, resize: 'vertical' }} placeholder="Program details, terms, eligibility..." /></div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setModal(null)} style={b2}>CANCEL</button>
            <button onClick={addPromo} style={b1}>ADD PROGRAM</button>
          </div>
        </div>
      </Modal>

      {/* Document Viewer */}
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
