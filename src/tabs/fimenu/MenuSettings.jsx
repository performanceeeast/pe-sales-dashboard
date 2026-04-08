import React, { useState, useEffect } from 'react';
import { DEFAULT_LENDERS, DEFAULT_TERMS } from '../../lib/fiMenuConstants';
import { Modal, styles, FM, FH } from '../../components/SharedUI';

const { card, cardHead: cH, input: inp, btn1: b1, btn2: b2, th: TH, td: TD, label: lbl } = styles;

export default function MenuSettings({ fiMenuConfig, saveFiMenuConfig, products, packages }) {
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

  // Sync local state when config changes from outside (e.g. month change)
  useEffect(() => { setLocalDocFee(String(config.defaultDocFee ?? 299)); }, [config.defaultDocFee]);
  useEffect(() => { setLocalTaxRate(String(config.defaultTaxRate ?? 0)); }, [config.defaultTaxRate]);
  useEffect(() => { setLocalTerms((config.defaultTerms || DEFAULT_TERMS).join(', ')); }, [config.defaultTerms]);
  useEffect(() => { setLocalLenders((config.lenders || DEFAULT_LENDERS).join(', ')); }, [config.lenders]);
  useEffect(() => { setLocalDisclaimer(config.disclaimer || 'All prices and payments are estimates. Final terms subject to lender approval.'); }, [config.disclaimer]);

  function updateConfig(updates) {
    // Always merge against the LATEST fiMenuConfig from props (not a stale closure)
    saveFiMenuConfig({ ...(fiMenuConfig || {}), ...updates });
  }

  // ── Product CRUD ──
  // Always read products list from fiMenuConfig at call time so we don't operate
  // on a stale derived `products` prop that may be the fallback default list.
  function saveProduct(p) {
    const currentProducts = (fiMenuConfig && fiMenuConfig.products) ? fiMenuConfig.products : products;
    const existing = currentProducts.find((x) => x.id === p.id);
    const updated = existing
      ? currentProducts.map((x) => x.id === p.id ? p : x)
      : [...currentProducts, { ...p, id: p.id || Date.now().toString() }];
    saveFiMenuConfig({ ...(fiMenuConfig || {}), products: updated });
    setEditProduct(null);
    setModal(null);
  }

  function deleteProduct(id) {
    if (!confirm('Remove this product?')) return;
    const currentProducts = (fiMenuConfig && fiMenuConfig.products) ? fiMenuConfig.products : products;
    saveFiMenuConfig({ ...(fiMenuConfig || {}), products: currentProducts.filter((p) => p.id !== id) });
  }

  // ── Package CRUD ──
  function savePackage(pkg) {
    const currentPackages = (fiMenuConfig && fiMenuConfig.packages) ? fiMenuConfig.packages : packages;
    const existing = currentPackages.find((x) => x.id === pkg.id);
    const updated = existing
      ? currentPackages.map((x) => x.id === pkg.id ? pkg : x)
      : [...currentPackages, { ...pkg, id: pkg.id || Date.now().toString() }];
    saveFiMenuConfig({ ...(fiMenuConfig || {}), packages: updated });
    setEditPackage(null);
    setModal(null);
  }

  function deletePackage(id) {
    if (!confirm('Remove this package?')) return;
    const currentPackages = (fiMenuConfig && fiMenuConfig.packages) ? fiMenuConfig.packages : packages;
    saveFiMenuConfig({ ...(fiMenuConfig || {}), packages: currentPackages.filter((p) => p.id !== id) });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ═══ PRODUCTS ═══ */}
      <div style={card}>
        <div style={{ ...cH, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>F&I PRODUCT CATALOG ({products.length})</span>
          <button onClick={() => { setEditProduct({ id: '', name: '', description: '', category: 'universal', retailPrice: 0, cost: 0, term: '', taxable: false, financeable: true, provider: '' }); setModal('editProduct'); }} style={{ ...b1, padding: '4px 12px', fontSize: 9 }}>+ ADD PRODUCT</button>
        </div>
        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Product', 'Category', 'Retail', 'Cost', 'Gross', 'Provider', 'Term', ''].map((h) => <th key={h} style={TH}>{h}</th>)}</tr></thead>
            <tbody>
              {products.length === 0 && <tr><td colSpan={8} style={{ ...TD, padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontFamily: FM, fontSize: 11 }}>NO PRODUCTS CONFIGURED</td></tr>}
              {products.map((p) => (
                <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => { setEditProduct({ ...p }); setModal('editProduct'); }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--row-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ ...TD, fontFamily: FH, fontWeight: 600, fontSize: 11 }}>{p.name}</td>
                  <td style={TD}><span style={{ fontFamily: FM, fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: p.category === 'marine' ? '#eff6ff' : p.category === 'powersports' ? '#fef2f2' : 'var(--bg-tertiary)', color: p.category === 'marine' ? '#2563eb' : p.category === 'powersports' ? '#b91c1c' : 'var(--text-muted)' }}>{p.category?.toUpperCase()}</span></td>
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
        <div style={{ ...cH, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>PACKAGE TEMPLATES ({packages.length})</span>
          <button onClick={() => { setEditPackage({ id: '', name: '', description: '', products: [], color: '#6b7280', displayOrder: packages.length + 1, recommended: false }); setModal('editPackage'); }} style={{ ...b1, padding: '4px 12px', fontSize: 9 }}>+ ADD PACKAGE</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {packages.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontFamily: FM, fontSize: 11 }}>NO PACKAGES CONFIGURED</div>}
          {packages.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)).map((pkg) => (
            <div key={pkg.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 4, height: 32, borderRadius: 2, background: pkg.color || '#6b7280' }} />
                <div>
                  <div style={{ fontFamily: FH, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {pkg.name}
                    {pkg.recommended && <span style={{ fontFamily: FM, fontSize: 8, fontWeight: 700, color: '#d97706', background: '#fef3c7', padding: '1px 6px', borderRadius: 3 }}>RECOMMENDED</span>}
                  </div>
                  <div style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)' }}>
                    {pkg.products.length} products: {pkg.products.map((pid) => products.find((p) => p.id === pid)?.name || pid).join(', ')}
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
        <div style={{ ...cH, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>DEFAULT SETTINGS</span>
          <span style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)' }}>Changes save when you click out of a field</span>
        </div>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div>
              <label style={lbl}>DEFAULT DOC FEE ($)</label>
              <input
                type="number"
                value={localDocFee}
                onChange={(e) => setLocalDocFee(e.target.value)}
                onBlur={() => { const v = parseInt(localDocFee) || 0; if (v !== config.defaultDocFee) updateConfig({ defaultDocFee: v }); }}
                style={{ ...inp, textAlign: 'center' }}
              />
            </div>
            <div>
              <label style={lbl}>DEFAULT TAX RATE (%)</label>
              <input
                type="number"
                step="0.01"
                value={localTaxRate}
                onChange={(e) => setLocalTaxRate(e.target.value)}
                onBlur={() => { const v = parseFloat(localTaxRate) || 0; if (v !== config.defaultTaxRate) updateConfig({ defaultTaxRate: v }); }}
                style={{ ...inp, textAlign: 'center' }}
              />
            </div>
            <div>
              <label style={lbl}>DEFAULT TERMS</label>
              <input
                value={localTerms}
                onChange={(e) => setLocalTerms(e.target.value)}
                onBlur={() => { const arr = localTerms.split(',').map((t) => parseInt(t.trim())).filter(Boolean); updateConfig({ defaultTerms: arr }); }}
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
              onBlur={() => { const arr = localLenders.split(',').map((l) => l.trim()).filter(Boolean); updateConfig({ lenders: arr }); }}
              style={inp}
            />
          </div>
          <div>
            <label style={lbl}>DISCLAIMER TEXT</label>
            <textarea
              value={localDisclaimer}
              onChange={(e) => setLocalDisclaimer(e.target.value)}
              onBlur={() => { if (localDisclaimer !== config.disclaimer) updateConfig({ disclaimer: localDisclaimer }); }}
              style={{ ...inp, minHeight: 60, resize: 'vertical' }}
            />
          </div>
        </div>
      </div>

      {/* ═══ EDIT PRODUCT MODAL ═══ */}
      <Modal open={modal === 'editProduct' && !!editProduct} onClose={() => { setModal(null); setEditProduct(null); }} title={editProduct?.id ? 'Edit Product' : 'Add Product'} wide>
        {editProduct && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div><label style={lbl}>PRODUCT NAME</label><input value={editProduct.name} onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>DESCRIPTION</label><textarea value={editProduct.description || ''} onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })} style={{ ...inp, minHeight: 50, resize: 'vertical' }} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div><label style={lbl}>RETAIL PRICE ($)</label><input type="number" value={editProduct.retailPrice || ''} onChange={(e) => setEditProduct({ ...editProduct, retailPrice: parseInt(e.target.value) || 0 })} style={inp} /></div>
              <div><label style={lbl}>COST ($)</label><input type="number" value={editProduct.cost || ''} onChange={(e) => setEditProduct({ ...editProduct, cost: parseInt(e.target.value) || 0 })} style={inp} /></div>
              <div><label style={lbl}>CATEGORY</label>
                <select value={editProduct.category || 'universal'} onChange={(e) => setEditProduct({ ...editProduct, category: e.target.value })} style={inp}>
                  <option value="universal">Universal</option>
                  <option value="powersports">Powersports</option>
                  <option value="marine">Marine</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div><label style={lbl}>PROVIDER</label><input value={editProduct.provider || ''} onChange={(e) => setEditProduct({ ...editProduct, provider: e.target.value })} style={inp} /></div>
              <div><label style={lbl}>TERM</label><input value={editProduct.term || ''} onChange={(e) => setEditProduct({ ...editProduct, term: e.target.value })} style={inp} placeholder="36 mo" /></div>
              <div><label style={lbl}>CONTRACT CODE</label><input value={editProduct.contractCode || ''} onChange={(e) => setEditProduct({ ...editProduct, contractCode: e.target.value })} style={inp} /></div>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: FM, fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" checked={editProduct.taxable || false} onChange={(e) => setEditProduct({ ...editProduct, taxable: e.target.checked })} /> Taxable
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: FM, fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" checked={editProduct.financeable !== false} onChange={(e) => setEditProduct({ ...editProduct, financeable: e.target.checked })} /> Financeable
              </label>
            </div>
            <div><label style={lbl}>DISCLAIMER</label><textarea value={editProduct.disclaimer || ''} onChange={(e) => setEditProduct({ ...editProduct, disclaimer: e.target.value })} style={{ ...inp, minHeight: 40, resize: 'vertical' }} /></div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setModal(null); setEditProduct(null); }} style={b2}>CANCEL</button>
              <button onClick={() => saveProduct(editProduct)} style={b1}>{editProduct.id ? 'UPDATE' : 'ADD'} PRODUCT</button>
            </div>
          </div>
        )}
      </Modal>

      {/* ═══ EDIT PACKAGE MODAL ═══ */}
      <Modal open={modal === 'editPackage' && !!editPackage} onClose={() => { setModal(null); setEditPackage(null); }} title={editPackage?.id ? 'Edit Package' : 'Add Package'}>
        {editPackage && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div><label style={lbl}>PACKAGE NAME</label><input value={editPackage.name} onChange={(e) => setEditPackage({ ...editPackage, name: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>DESCRIPTION</label><input value={editPackage.description || ''} onChange={(e) => setEditPackage({ ...editPackage, description: e.target.value })} style={inp} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label style={lbl}>DISPLAY ORDER</label><input type="number" value={editPackage.displayOrder || ''} onChange={(e) => setEditPackage({ ...editPackage, displayOrder: parseInt(e.target.value) || 0 })} style={inp} /></div>
              <div><label style={lbl}>COLOR</label><input type="color" value={editPackage.color || '#6b7280'} onChange={(e) => setEditPackage({ ...editPackage, color: e.target.value })} style={{ ...inp, padding: 4, height: 36 }} /></div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: FM, fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input type="checkbox" checked={editPackage.recommended || false} onChange={(e) => setEditPackage({ ...editPackage, recommended: e.target.checked })} /> Mark as Recommended
            </label>
            <div>
              <label style={lbl}>INCLUDED PRODUCTS</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                {products.map((p) => {
                  const included = (editPackage.products || []).includes(p.id);
                  return (
                    <label key={p.id} onClick={() => {
                      const prods = included ? editPackage.products.filter((x) => x !== p.id) : [...(editPackage.products || []), p.id];
                      setEditPackage({ ...editPackage, products: prods });
                    }} style={{
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
              <button onClick={() => { setModal(null); setEditPackage(null); }} style={b2}>CANCEL</button>
              <button onClick={() => savePackage(editPackage)} style={b1}>{editPackage.id ? 'UPDATE' : 'ADD'} PACKAGE</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
