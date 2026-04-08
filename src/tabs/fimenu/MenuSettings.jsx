import React, { useState, useEffect, useRef } from 'react';
import { DEFAULT_LENDERS, DEFAULT_TERMS, PRODUCT_CATEGORIES, normalizeCategory } from '../../lib/fiMenuConstants';
import { Modal, styles, FM, FH } from '../../components/SharedUI';
import { readFiMenuConfigBackup } from '../../lib/storage';

const { card, cardHead: cH, input: inp, btn1: b1, btn2: b2, th: TH, td: TD, label: lbl } = styles;

// ═══════════════════════════════════════════════════════════════════
// Isolated product edit form. Holds its own state so parent re-renders
// NEVER disrupt what the user is typing. Only the initial value is
// passed in via props; everything else lives inside this component.
// ═══════════════════════════════════════════════════════════════════
function ProductEditForm({ initial, onSave, onCancel }) {
  const [f, setF] = useState(() => ({
    id: '', name: '', description: '', category: 'universal',
    retailPrice: 0, cost: 0, term: '', provider: '', contractCode: '',
    taxable: false, financeable: true, disclaimer: '',
    ...initial,
  }));
  const u = (k, v) => setF((prev) => ({ ...prev, [k]: v }));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div><label style={lbl}>PRODUCT NAME</label><input value={f.name} onChange={(e) => u('name', e.target.value)} style={inp} /></div>
      <div><label style={lbl}>DESCRIPTION</label><textarea value={f.description || ''} onChange={(e) => u('description', e.target.value)} style={{ ...inp, minHeight: 50, resize: 'vertical' }} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <div><label style={lbl}>RETAIL PRICE ($)</label><input type="number" value={f.retailPrice || ''} onChange={(e) => u('retailPrice', parseInt(e.target.value) || 0)} style={inp} /></div>
        <div><label style={lbl}>COST ($)</label><input type="number" value={f.cost || ''} onChange={(e) => u('cost', parseInt(e.target.value) || 0)} style={inp} /></div>
        <div><label style={lbl}>CATEGORY</label>
          <select value={normalizeCategory(f.category)} onChange={(e) => u('category', e.target.value)} style={inp}>
            {PRODUCT_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <div><label style={lbl}>PROVIDER</label><input value={f.provider || ''} onChange={(e) => u('provider', e.target.value)} style={inp} /></div>
        <div><label style={lbl}>TERM</label><input value={f.term || ''} onChange={(e) => u('term', e.target.value)} style={inp} placeholder="36 mo" /></div>
        <div><label style={lbl}>CONTRACT CODE</label><input value={f.contractCode || ''} onChange={(e) => u('contractCode', e.target.value)} style={inp} /></div>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: FM, fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <input type="checkbox" checked={f.taxable || false} onChange={(e) => u('taxable', e.target.checked)} /> Taxable
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: FM, fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <input type="checkbox" checked={f.financeable !== false} onChange={(e) => u('financeable', e.target.checked)} /> Financeable
        </label>
      </div>
      <div><label style={lbl}>DISCLAIMER</label><textarea value={f.disclaimer || ''} onChange={(e) => u('disclaimer', e.target.value)} style={{ ...inp, minHeight: 40, resize: 'vertical' }} /></div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={b2}>CANCEL</button>
        <button onClick={() => onSave(f)} style={b1}>{f.id ? 'UPDATE' : 'ADD'} PRODUCT</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Isolated package edit form. Same pattern — internal state only.
// ═══════════════════════════════════════════════════════════════════
function PackageEditForm({ initial, onSave, onCancel, products }) {
  const [f, setF] = useState(() => ({
    id: '', name: '', description: '', category: 'universal',
    products: [], color: '#6b7280', displayOrder: 1, recommended: false,
    ...initial,
  }));
  const u = (k, v) => setF((prev) => ({ ...prev, [k]: v }));
  const toggleProduct = (pid) => setF((prev) => {
    const cur = prev.products || [];
    const next = cur.includes(pid) ? cur.filter((x) => x !== pid) : [...cur, pid];
    return { ...prev, products: next };
  });
  const pkgCat = normalizeCategory(f.category);
  const filteredProducts = (products || []).filter((p) => {
    const pCat = normalizeCategory(p.category);
    return pCat === 'universal' || pCat === pkgCat;
  });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div><label style={lbl}>PACKAGE NAME</label><input value={f.name} onChange={(e) => u('name', e.target.value)} style={inp} /></div>
      <div><label style={lbl}>DESCRIPTION</label><input value={f.description || ''} onChange={(e) => u('description', e.target.value)} style={inp} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
        <div><label style={lbl}>CATEGORY</label>
          <select value={pkgCat} onChange={(e) => u('category', e.target.value)} style={inp}>
            {PRODUCT_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
        <div><label style={lbl}>DISPLAY ORDER</label><input type="number" value={f.displayOrder || ''} onChange={(e) => u('displayOrder', parseInt(e.target.value) || 0)} style={inp} /></div>
        <div><label style={lbl}>COLOR</label><input type="color" value={f.color || '#6b7280'} onChange={(e) => u('color', e.target.value)} style={{ ...inp, padding: 4, height: 36 }} /></div>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: FM, fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer' }}>
        <input type="checkbox" checked={f.recommended || false} onChange={(e) => u('recommended', e.target.checked)} /> Mark as Recommended
      </label>
      <div>
        <label style={lbl}>INCLUDED PRODUCTS</label>
        <div style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', marginBottom: 6 }}>
          Showing products matching the selected category (plus Universal).
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
          {filteredProducts.map((p) => {
            const included = (f.products || []).includes(p.id);
            return (
              <label key={p.id} onClick={() => toggleProduct(p.id)} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 4, cursor: 'pointer',
                background: included ? '#f0fdf4' : 'var(--card-bg)', border: included ? '1px solid #bbf7d0' : '1px solid var(--border-secondary)',
              }}>
                <span style={{ fontFamily: FM, fontSize: 14, color: included ? '#16a34a' : 'var(--text-muted)' }}>{included ? '\u2713' : '\u25CB'}</span>
                <span style={{ fontFamily: FM, fontSize: 11, color: included ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: included ? 600 : 400 }}>{p.name}</span>
                <span style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>${p.retailPrice}</span>
              </label>
            );
          })}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={b2}>CANCEL</button>
        <button onClick={() => onSave(f)} style={b1}>{f.id ? 'UPDATE' : 'ADD'} PACKAGE</button>
      </div>
    </div>
  );
}

export default function MenuSettings({ fiMenuConfig, saveFiMenuConfig, products, packages, storeId }) {
  const [modal, setModal] = useState(null);
  const [editProduct, setEditProduct] = useState(null);
  const [editPackage, setEditPackage] = useState(null);

  const config = fiMenuConfig || {};
  const lenders = config.lenders || DEFAULT_LENDERS;
  const defaultDocFee = config.defaultDocFee ?? 299;
  const defaultTaxRate = config.defaultTaxRate ?? 0;
  const defaultTerms = config.defaultTerms || DEFAULT_TERMS;
  const disclaimer = config.disclaimer || 'All prices and payments are estimates. Final terms subject to lender approval.';

  // Local state for default settings inputs — prevents save-on-every-keystroke
  // which caused cascading re-renders and flicker in open modals.
  const [localDocFee, setLocalDocFee] = useState(String(defaultDocFee));
  const [localTaxRate, setLocalTaxRate] = useState(String(defaultTaxRate));
  const [localTerms, setLocalTerms] = useState(defaultTerms.join(', '));
  const [localLenders, setLocalLenders] = useState(lenders.join(', '));
  const [localDisclaimer, setLocalDisclaimer] = useState(disclaimer);
  // Staged local copies of products and packages — every add/edit/delete updates
  // these, and only the SAVE CHANGES button commits them back to fiMenuConfig.
  // This protects manually-entered data from silent save failures.
  const [localProducts, setLocalProducts] = useState(() => (fiMenuConfig && fiMenuConfig.products) || products || []);
  const [localPackages, setLocalPackages] = useState(() => (fiMenuConfig && fiMenuConfig.packages) || packages || []);
  // Per-category defaults: { offroad: { docFee: '299', taxRate: '6.75' }, ... }
  const [localCatDefaults, setLocalCatDefaults] = useState(() => {
    const dpc = (fiMenuConfig && fiMenuConfig.defaultsPerCategory) || {};
    const out = {};
    PRODUCT_CATEGORIES.forEach((c) => {
      const v = dpc[c.id] || {};
      out[c.id] = { docFee: v.docFee != null ? String(v.docFee) : '', taxRate: v.taxRate != null ? String(v.taxRate) : '' };
    });
    return out;
  });

  // Sync local state when config changes from outside (e.g. month change)
  useEffect(() => { setLocalDocFee(String(config.defaultDocFee ?? 299)); }, [config.defaultDocFee]);
  useEffect(() => { setLocalTaxRate(String(config.defaultTaxRate ?? 0)); }, [config.defaultTaxRate]);
  useEffect(() => { setLocalTerms((config.defaultTerms || DEFAULT_TERMS).join(', ')); }, [config.defaultTerms]);
  useEffect(() => { setLocalLenders((config.lenders || DEFAULT_LENDERS).join(', ')); }, [config.lenders]);
  useEffect(() => { setLocalDisclaimer(config.disclaimer || 'All prices and payments are estimates. Final terms subject to lender approval.'); }, [config.disclaimer]);
  useEffect(() => {
    const dpc = config.defaultsPerCategory || {};
    const out = {};
    PRODUCT_CATEGORIES.forEach((c) => {
      const v = dpc[c.id] || {};
      out[c.id] = { docFee: v.docFee != null ? String(v.docFee) : '', taxRate: v.taxRate != null ? String(v.taxRate) : '' };
    });
    setLocalCatDefaults(out);
  }, [config.defaultsPerCategory]);

  // Track what remote was the last time we synced local to it. If remote changes externally
  // (month switch, external save) AND local matches our last-synced snapshot, adopt the new
  // remote. If local has diverged (user has unsaved edits), keep the user's edits.
  const lastSyncedProductsRef = useRef(JSON.stringify((fiMenuConfig && fiMenuConfig.products) || []));
  const lastSyncedPackagesRef = useRef(JSON.stringify((fiMenuConfig && fiMenuConfig.packages) || []));
  useEffect(() => {
    const remote = (fiMenuConfig && fiMenuConfig.products) || [];
    const remoteStr = JSON.stringify(remote);
    if (remoteStr === lastSyncedProductsRef.current) return; // no external change
    // Remote changed. Adopt only if local matches what we last synced.
    setLocalProducts((prev) => {
      const localStr = JSON.stringify(prev);
      if (localStr === lastSyncedProductsRef.current) {
        lastSyncedProductsRef.current = remoteStr;
        return remote;
      }
      // User has unsaved edits — keep them. Baseline stays at old.
      return prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fiMenuConfig?.products]);
  useEffect(() => {
    const remote = (fiMenuConfig && fiMenuConfig.packages) || [];
    const remoteStr = JSON.stringify(remote);
    if (remoteStr === lastSyncedPackagesRef.current) return;
    setLocalPackages((prev) => {
      const localStr = JSON.stringify(prev);
      if (localStr === lastSyncedPackagesRef.current) {
        lastSyncedPackagesRef.current = remoteStr;
        return remote;
      }
      return prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fiMenuConfig?.packages]);

  // Dirty state computations (by deep comparison)
  const remoteProducts = (fiMenuConfig && fiMenuConfig.products) || [];
  const remotePackages = (fiMenuConfig && fiMenuConfig.packages) || [];
  const productsDirty = JSON.stringify(localProducts) !== JSON.stringify(remoteProducts);
  const packagesDirty = JSON.stringify(localPackages) !== JSON.stringify(remotePackages);

  function updateConfig(updates) {
    // Always merge against the LATEST fiMenuConfig from props (not a stale closure)
    saveFiMenuConfig({ ...(fiMenuConfig || {}), ...updates });
  }

  // Save all default settings fields at once. Called by the SAVE CHANGES button.
  function saveAllDefaults() {
    const updates = {};
    const docFeeVal = parseInt(localDocFee) || 0;
    if (docFeeVal !== config.defaultDocFee) updates.defaultDocFee = docFeeVal;
    const taxRateVal = parseFloat(localTaxRate) || 0;
    if (taxRateVal !== config.defaultTaxRate) updates.defaultTaxRate = taxRateVal;
    const termsArr = localTerms.split(',').map((t) => parseInt(t.trim())).filter(Boolean);
    updates.defaultTerms = termsArr;
    const lendersArr = localLenders.split(',').map((l) => l.trim()).filter(Boolean);
    updates.lenders = lendersArr;
    if (localDisclaimer !== config.disclaimer) updates.disclaimer = localDisclaimer;
    // Per-category defaults
    const existingPerCat = config.defaultsPerCategory || {};
    const newPerCat = { ...existingPerCat };
    PRODUCT_CATEGORIES.forEach((cat) => {
      if (cat.id === 'universal') return;
      const entry = localCatDefaults[cat.id] || {};
      const parsedFee = entry.docFee === '' || entry.docFee == null ? undefined : (parseInt(entry.docFee) || 0);
      const parsedTax = entry.taxRate === '' || entry.taxRate == null ? undefined : (parseFloat(entry.taxRate) || 0);
      newPerCat[cat.id] = { ...(existingPerCat[cat.id] || {}), docFee: parsedFee, taxRate: parsedTax };
    });
    updates.defaultsPerCategory = newPerCat;
    saveFiMenuConfig({ ...(fiMenuConfig || {}), ...updates });
  }

  // Detect whether any default settings field has unsaved changes
  const defaultsDirty = (() => {
    if ((parseInt(localDocFee) || 0) !== (config.defaultDocFee ?? 299)) return true;
    if ((parseFloat(localTaxRate) || 0) !== (config.defaultTaxRate ?? 0)) return true;
    if (localTerms !== (config.defaultTerms || DEFAULT_TERMS).join(', ')) return true;
    if (localLenders !== (config.lenders || DEFAULT_LENDERS).join(', ')) return true;
    if (localDisclaimer !== (config.disclaimer || 'All prices and payments are estimates. Final terms subject to lender approval.')) return true;
    const existingPerCat = config.defaultsPerCategory || {};
    for (const cat of PRODUCT_CATEGORIES) {
      if (cat.id === 'universal') continue;
      const entry = localCatDefaults[cat.id] || {};
      const existing = existingPerCat[cat.id] || {};
      const parsedFee = entry.docFee === '' || entry.docFee == null ? undefined : (parseInt(entry.docFee) || 0);
      const parsedTax = entry.taxRate === '' || entry.taxRate == null ? undefined : (parseFloat(entry.taxRate) || 0);
      if (parsedFee !== existing.docFee) return true;
      if (parsedTax !== existing.taxRate) return true;
    }
    return false;
  })();

  // ── Product CRUD (operates on localProducts — staged until SAVE CHANGES clicked) ──
  function saveProduct(p) {
    const newId = p.id || Date.now().toString();
    const product = { ...p, id: newId };
    setLocalProducts((prev) => {
      const existing = prev.find((x) => x.id === newId);
      return existing ? prev.map((x) => x.id === newId ? product : x) : [...prev, product];
    });
    setEditProduct(null);
    setModal(null);
  }

  function deleteProduct(id) {
    if (!confirm('Stage this product for removal? (click SAVE CHANGES to persist)')) return;
    setLocalProducts((prev) => prev.filter((p) => p.id !== id));
  }

  function commitProducts() {
    saveFiMenuConfig({ ...(fiMenuConfig || {}), products: localProducts });
    lastSyncedProductsRef.current = JSON.stringify(localProducts);
  }

  function discardProductChanges() {
    if (!confirm('Discard all unsaved product changes?')) return;
    setLocalProducts(remoteProducts);
    lastSyncedProductsRef.current = JSON.stringify(remoteProducts);
  }

  // Manually restore from the dedicated F&I backup. Used if live data has somehow
  // been wiped but localStorage still has the user's hand-built catalog.
  function recoverFromBackup() {
    const backup = readFiMenuConfigBackup(storeId);
    if (!backup) {
      alert('No F&I backup found in this browser.');
      return;
    }
    const backupProducts = (backup.products && backup.products.length) || 0;
    const backupPackages = (backup.packages && backup.packages.length) || 0;
    if (!confirm(`Found a backup with ${backupProducts} product(s) and ${backupPackages} package(s). Restore this to the current view? (You will still need to click SAVE CHANGES to persist it.)`)) return;
    setLocalProducts(Array.isArray(backup.products) ? backup.products : []);
    setLocalPackages(Array.isArray(backup.packages) ? backup.packages : []);
  }

  // ── Package CRUD (operates on localPackages — staged until SAVE CHANGES clicked) ──
  function savePackage(pkg) {
    const newId = pkg.id || Date.now().toString();
    const packageObj = { ...pkg, id: newId };
    setLocalPackages((prev) => {
      const existing = prev.find((x) => x.id === newId);
      return existing ? prev.map((x) => x.id === newId ? packageObj : x) : [...prev, packageObj];
    });
    setEditPackage(null);
    setModal(null);
  }

  function deletePackage(id) {
    if (!confirm('Stage this package for removal? (click SAVE CHANGES to persist)')) return;
    setLocalPackages((prev) => prev.filter((p) => p.id !== id));
  }

  function commitPackages() {
    saveFiMenuConfig({ ...(fiMenuConfig || {}), packages: localPackages });
    lastSyncedPackagesRef.current = JSON.stringify(localPackages);
  }

  function discardPackageChanges() {
    if (!confirm('Discard all unsaved package changes?')) return;
    setLocalPackages(remotePackages);
    lastSyncedPackagesRef.current = JSON.stringify(remotePackages);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ═══ PRODUCTS ═══ */}
      <div style={card}>
        <div style={{ ...cH, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span>F&I PRODUCT CATALOG ({localProducts.length})</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {productsDirty && (
              <span style={{ fontFamily: FM, fontSize: 9, fontWeight: 700, color: '#d97706', background: '#fef3c7', padding: '3px 8px', borderRadius: 3 }}>UNSAVED CHANGES</span>
            )}
            <button onClick={recoverFromBackup} title="Restore catalog from browser backup" style={{ ...b2, padding: '4px 10px', fontSize: 9 }}>RECOVER</button>
            {productsDirty && (
              <button onClick={discardProductChanges} style={{ ...b2, padding: '4px 10px', fontSize: 9 }}>DISCARD</button>
            )}
            <button onClick={commitProducts} disabled={!productsDirty} style={{ ...b1, padding: '4px 12px', fontSize: 9, background: '#16a34a', opacity: productsDirty ? 1 : 0.4, cursor: productsDirty ? 'pointer' : 'default' }}>SAVE CHANGES</button>
            <button onClick={() => { setEditProduct({ id: '', name: '', description: '', category: 'universal', retailPrice: 0, cost: 0, term: '', taxable: false, financeable: true, provider: '' }); setModal('editProduct'); }} style={{ ...b1, padding: '4px 12px', fontSize: 9 }}>+ ADD PRODUCT</button>
          </div>
        </div>
        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Product', 'Category', 'Retail', 'Cost', 'Gross', 'Provider', 'Term', ''].map((h) => <th key={h} style={TH}>{h}</th>)}</tr></thead>
            <tbody>
              {localProducts.length === 0 && <tr><td colSpan={8} style={{ ...TD, padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontFamily: FM, fontSize: 11 }}>NO PRODUCTS CONFIGURED</td></tr>}
              {localProducts.map((p) => (
                <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => { setEditProduct({ ...p }); setModal('editProduct'); }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--row-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ ...TD, fontFamily: FH, fontWeight: 600, fontSize: 11 }}>{p.name}</td>
                  <td style={TD}>{(() => { const cat = PRODUCT_CATEGORIES.find((c) => c.id === normalizeCategory(p.category)) || PRODUCT_CATEGORIES[0]; return <span style={{ fontFamily: FM, fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: cat.bg, color: cat.color }}>{cat.label.toUpperCase()}</span>; })()}</td>
                  <td style={{ ...TD, fontFamily: FM, fontWeight: 700 }}>${(p.retailPrice || 0).toLocaleString()}</td>
                  <td style={{ ...TD, fontFamily: FM, color: 'var(--text-secondary)' }}>${(p.cost || 0).toLocaleString()}</td>
                  <td style={{ ...TD, fontFamily: FM, fontWeight: 700, color: '#16a34a' }}>${((p.retailPrice || 0) - (p.cost || 0)).toLocaleString()}</td>
                  <td style={{ ...TD, fontFamily: FM, fontSize: 10, color: 'var(--text-muted)' }}>{p.provider || '\u2014'}</td>
                  <td style={{ ...TD, fontFamily: FM, fontSize: 10, color: 'var(--text-muted)' }}>{p.term || '\u2014'}</td>
                  <td style={TD} onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => deleteProduct(p.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>{'\u2715'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ PACKAGES ═══ */}
      <div style={card}>
        <div style={{ ...cH, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span>PACKAGE TEMPLATES ({localPackages.length})</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {packagesDirty && (
              <span style={{ fontFamily: FM, fontSize: 9, fontWeight: 700, color: '#d97706', background: '#fef3c7', padding: '3px 8px', borderRadius: 3 }}>UNSAVED CHANGES</span>
            )}
            {packagesDirty && (
              <button onClick={discardPackageChanges} style={{ ...b2, padding: '4px 10px', fontSize: 9 }}>DISCARD</button>
            )}
            <button onClick={commitPackages} disabled={!packagesDirty} style={{ ...b1, padding: '4px 12px', fontSize: 9, background: '#16a34a', opacity: packagesDirty ? 1 : 0.4, cursor: packagesDirty ? 'pointer' : 'default' }}>SAVE CHANGES</button>
            <button onClick={() => { setEditPackage({ id: '', name: '', description: '', products: [], color: '#6b7280', displayOrder: localPackages.length + 1, recommended: false, category: 'universal' }); setModal('editPackage'); }} style={{ ...b1, padding: '4px 12px', fontSize: 9 }}>+ ADD PACKAGE</button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {localPackages.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontFamily: FM, fontSize: 11 }}>NO PACKAGES CONFIGURED</div>}
          {localPackages.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)).map((pkg) => (
            <div key={pkg.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 4, height: 32, borderRadius: 2, background: pkg.color || '#6b7280' }} />
                <div>
                  <div style={{ fontFamily: FH, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {pkg.name}
                    {(() => { const cat = PRODUCT_CATEGORIES.find((c) => c.id === normalizeCategory(pkg.category)) || PRODUCT_CATEGORIES[0]; return <span style={{ fontFamily: FM, fontSize: 8, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: cat.bg, color: cat.color }}>{cat.label.toUpperCase()}</span>; })()}
                    {pkg.recommended && <span style={{ fontFamily: FM, fontSize: 8, fontWeight: 700, color: '#d97706', background: '#fef3c7', padding: '1px 6px', borderRadius: 3 }}>RECOMMENDED</span>}
                  </div>
                  <div style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)' }}>
                    {pkg.products.length} products: {pkg.products.map((pid) => localProducts.find((p) => p.id === pid)?.name || pid).join(', ')}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => { setEditPackage({ ...pkg }); setModal('editPackage'); }} style={{ ...b2, padding: '3px 10px', fontSize: 9 }}>EDIT</button>
                <button onClick={() => deletePackage(pkg.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>{'\u2715'}</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ DEFAULTS ═══ */}
      <div style={card}>
        <div style={{ ...cH, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <span>DEFAULT SETTINGS</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {defaultsDirty && (
              <span style={{ fontFamily: FM, fontSize: 9, fontWeight: 700, color: '#d97706', background: '#fef3c7', padding: '3px 8px', borderRadius: 3 }}>UNSAVED CHANGES</span>
            )}
            <button
              onClick={saveAllDefaults}
              disabled={!defaultsDirty}
              style={{ ...b1, padding: '5px 14px', fontSize: 10, opacity: defaultsDirty ? 1 : 0.4, cursor: defaultsDirty ? 'pointer' : 'default' }}
            >
              SAVE CHANGES
            </button>
          </div>
        </div>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Per-category doc fee and tax rate */}
          <div>
            <label style={{ ...lbl, marginBottom: 6 }}>DOC FEE & TAX RATE BY CATEGORY</label>
            <div style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', marginBottom: 8 }}>
              Auto-populates on menu builder based on unit type. Leave blank to use the legacy default below.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8, alignItems: 'center' }}>
              <div style={{ fontFamily: FM, fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1 }}>CATEGORY</div>
              <div style={{ fontFamily: FM, fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, textAlign: 'center' }}>DOC FEE ($)</div>
              <div style={{ fontFamily: FM, fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, textAlign: 'center' }}>TAX RATE (%)</div>
              {PRODUCT_CATEGORIES.filter((c) => c.id !== 'universal').map((cat) => {
                const localFee = (localCatDefaults[cat.id] && localCatDefaults[cat.id].docFee) || '';
                const localTax = (localCatDefaults[cat.id] && localCatDefaults[cat.id].taxRate) || '';
                const setFee = (v) => setLocalCatDefaults((p) => ({ ...p, [cat.id]: { ...(p[cat.id] || {}), docFee: v } }));
                const setTax = (v) => setLocalCatDefaults((p) => ({ ...p, [cat.id]: { ...(p[cat.id] || {}), taxRate: v } }));
                return (
                  <React.Fragment key={cat.id}>
                    <div style={{ fontFamily: FH, fontSize: 11, fontWeight: 700, color: cat.color }}>{cat.label.toUpperCase()}</div>
                    <input type="number" value={localFee} onChange={(e) => setFee(e.target.value)} style={{ ...inp, textAlign: 'center' }} placeholder="299" />
                    <input type="number" step="0.01" value={localTax} onChange={(e) => setTax(e.target.value)} style={{ ...inp, textAlign: 'center' }} placeholder="0.00" />
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-secondary)', paddingTop: 14 }}>
            <label style={{ ...lbl, marginBottom: 6 }}>FALLBACK DEFAULTS (used when category-specific not set)</label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div>
              <label style={lbl}>FALLBACK DOC FEE ($)</label>
              <input
                type="number"
                value={localDocFee}
                onChange={(e) => setLocalDocFee(e.target.value)}
                style={{ ...inp, textAlign: 'center' }}
              />
            </div>
            <div>
              <label style={lbl}>FALLBACK TAX RATE (%)</label>
              <input
                type="number"
                step="0.01"
                value={localTaxRate}
                onChange={(e) => setLocalTaxRate(e.target.value)}
                style={{ ...inp, textAlign: 'center' }}
              />
            </div>
            <div>
              <label style={lbl}>DEFAULT TERMS</label>
              <input
                value={localTerms}
                onChange={(e) => setLocalTerms(e.target.value)}
                style={inp}
                placeholder="24, 36, 48, 60..."
              />
            </div>
          </div>
          <div>
            <label style={lbl}>LENDERS (comma-separated)</label>
            <input
              value={localLenders}
              onChange={(e) => setLocalLenders(e.target.value)}
              style={inp}
            />
          </div>
          <div>
            <label style={lbl}>DISCLAIMER TEXT</label>
            <textarea
              value={localDisclaimer}
              onChange={(e) => setLocalDisclaimer(e.target.value)}
              style={{ ...inp, minHeight: 60, resize: 'vertical' }}
            />
          </div>
          {/* Bottom save button for convenience */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8, borderTop: '1px solid var(--border-secondary)' }}>
            {defaultsDirty && (
              <span style={{ fontFamily: FM, fontSize: 10, color: '#d97706', alignSelf: 'center' }}>You have unsaved changes</span>
            )}
            <button
              onClick={saveAllDefaults}
              disabled={!defaultsDirty}
              style={{ ...b1, opacity: defaultsDirty ? 1 : 0.4, cursor: defaultsDirty ? 'pointer' : 'default' }}
            >
              SAVE CHANGES
            </button>
          </div>
        </div>
      </div>

      {/* ═══ EDIT PRODUCT MODAL ═══ */}
      <Modal open={modal === 'editProduct' && !!editProduct} onClose={() => { setModal(null); setEditProduct(null); }} title={editProduct?.id ? 'Edit Product' : 'Add Product'} wide>
        {editProduct && (
          <ProductEditForm
            key={editProduct.id || '__new__'}
            initial={editProduct}
            onSave={(p) => saveProduct(p)}
            onCancel={() => { setModal(null); setEditProduct(null); }}
          />
        )}
      </Modal>

      {/* ═══ EDIT PACKAGE MODAL ═══ */}
      <Modal open={modal === 'editPackage' && !!editPackage} onClose={() => { setModal(null); setEditPackage(null); }} title={editPackage?.id ? 'Edit Package' : 'Add Package'}>
        {editPackage && (
          <PackageEditForm
            key={editPackage.id || '__new__'}
            initial={editPackage}
            products={localProducts}
            onSave={(pkg) => savePackage(pkg)}
            onCancel={() => { setModal(null); setEditPackage(null); }}
          />
        )}
      </Modal>
    </div>
  );
}
