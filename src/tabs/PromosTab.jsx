import React, { useState, useEffect, useCallback } from 'react';
import { Modal, styles, FM, FH } from '../components/SharedUI';
import { loadDocuments, uploadDocument, deleteDocument } from '../lib/storage';

const { card, cardHead: cH, input: inp, btn1: b1, btn2: b2, th: TH, td: TD, label: lbl } = styles;

const DOC_CATEGORIES = [
  { id: 'price_list', label: 'OEM Price Lists', icon: '\uD83D\uDCB2' },
  { id: 'build_sheet', label: 'Build Sheets', icon: '\uD83D\uDEE0\uFE0F' },
  { id: 'promo_flyer', label: 'Promo Flyers', icon: '\uD83C\uDF1F' },
  { id: 'other', label: 'Other', icon: '\uD83D\uDCC4' },
];

export default function PromosTab({ currentUser }) {
  const [modal, setModal] = useState(null);
  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('price_list');
  const [docFilter, setDocFilter] = useState('all');
  const [excelPreview, setExcelPreview] = useState(null);
  const [excelImporting, setExcelImporting] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);

  const isManager = currentUser?.role === 'admin' || currentUser?.role === 'gsm';

  const refreshDocs = useCallback(async () => {
    setDocsLoading(true);
    const d = await loadDocuments(docFilter === 'all' ? null : docFilter);
    setDocs(d);
    setDocsLoading(false);
  }, [docFilter]);

  useEffect(() => { refreshDocs(); }, [refreshDocs]);

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const isExcel = file.name.match(/\.(xlsx?|xls|csv)$/i);
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
        await doUpload(file);
      }
    } else {
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

  async function handleExcelUploadOnly() {
    if (!excelPreview?.file) return;
    await doUpload(excelPreview.file);
    setExcelPreview(null);
    setModal(null);
  }

  function formatFileSize(bytes) {
    if (!bytes) return '\u2014';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  return (
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
            const isExcelFile = d.name?.match(/\.(xlsx?|xls|csv)$/i);
            const isImage = d.mime_type?.includes('image');
            const fileIcon = isPdf ? '\uD83D\uDCC4' : isExcelFile ? '\uD83D\uDCCA' : isImage ? '\uD83D\uDDBC\uFE0F' : '\uD83D\uDCC1';
            return (
              <div key={d.id} style={{ ...card, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 24, flexShrink: 0 }}>{fileIcon}</div>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <div style={{ fontFamily: FH, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{d.name}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: FM, fontSize: 8, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: 'var(--brand-red-soft)', color: 'var(--brand-red)' }}>{cat.label}</span>
                    <span style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)' }}>{formatFileSize(d.file_size)}</span>
                    <span style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)' }}>{d.created_at ? new Date(d.created_at).toLocaleDateString() : ''}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => setViewingDoc(d)} style={{ ...b1, padding: '5px 12px', fontSize: 9 }}>VIEW</button>
                  <a href={d.file_path} download={d.name} style={{ ...b2, padding: '5px 12px', fontSize: 9, textDecoration: 'none', display: 'inline-block' }}>DOWNLOAD</a>
                  {isManager && (
                    <button onClick={() => handleDeleteDoc(d)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14 }}>✕</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Excel Preview Modal */}
      <Modal open={modal === 'excelPreview'} onClose={() => { setModal(null); setExcelPreview(null); }} title={'Excel File: ' + (excelPreview?.fileName || '')} wide>
        {excelPreview && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 14px', fontFamily: FM, fontSize: 11, color: '#2563eb', lineHeight: 1.6 }}>
              This Excel file has {excelPreview.sheets.length} sheet{excelPreview.sheets.length > 1 ? 's' : ''}. You can store it in the document library.
            </div>
            {excelPreview.sheets.map((sheet) => (
              <div key={sheet.name} style={card}>
                <div style={{ ...cH }}><span>{sheet.name} ({sheet.totalRows} rows)</span></div>
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
              <button onClick={handleExcelUploadOnly} style={b1}>UPLOAD FILE</button>
            </div>
          </div>
        )}
      </Modal>

      {/* In-App Document Viewer */}
      <Modal open={!!viewingDoc} onClose={() => setViewingDoc(null)} title={viewingDoc?.name || 'Document'} wide>
        {viewingDoc && (() => {
          const isPdf = viewingDoc.mime_type?.includes('pdf');
          const isImage = viewingDoc.mime_type?.includes('image');
          return (
            <div>
              {isPdf && (
                <iframe
                  src={viewingDoc.file_path}
                  style={{ width: '100%', height: '70vh', border: '1px solid var(--border-primary)', borderRadius: 6 }}
                  title={viewingDoc.name}
                />
              )}
              {isImage && (
                <img src={viewingDoc.file_path} alt={viewingDoc.name} style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 6 }} />
              )}
              {!isPdf && !isImage && (
                <div style={{ padding: 30, textAlign: 'center' }}>
                  <div style={{ fontFamily: FM, fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                    This file type cannot be previewed in the browser.
                  </div>
                  <a href={viewingDoc.file_path} target="_blank" rel="noopener noreferrer" style={{ ...b1, textDecoration: 'none', display: 'inline-block', padding: '8px 20px' }}>OPEN IN NEW TAB</a>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                <a href={viewingDoc.file_path} download={viewingDoc.name} style={{ ...b2, textDecoration: 'none', display: 'inline-block' }}>DOWNLOAD</a>
                <button onClick={() => setViewingDoc(null)} style={b2}>CLOSE</button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
