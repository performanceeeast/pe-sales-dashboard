import React, { useState, useMemo } from 'react';
import { DEFAULT_LENDERS, DEFAULT_TERMS, createEmptyMenu } from '../../lib/fiMenuConstants';
import { calcDealSummary } from '../../lib/fiMenuCalc';
import { canViewFiMenuCost } from '../../lib/auth';
import { StatCard, styles, FM, FH } from '../../components/SharedUI';

const { card, cardHead: cH, input: inp, btn1: b1, btn2: b2, label: lbl } = styles;

export default function MenuBuilder({ menu, onSave, onCancel, onPresent, products, packages, act, currentUser, storeConfig, fiMenuConfig }) {
  const [f, sF] = useState(menu || createEmptyMenu(currentUser, storeConfig));
  const u = (k, v) => sF((p) => ({ ...p, [k]: v }));
  const showCost = canViewFiMenuCost(currentUser);

  const config = fiMenuConfig || {};
  const lenders = config.lenders || DEFAULT_LENDERS;
  const terms = config.defaultTerms || DEFAULT_TERMS;
  const unitTypes = storeConfig?.unit_types || [];

  // Toggle a product in/out of selection
  function toggleProduct(product) {
    sF((prev) => {
      const existing = prev.selectedProducts.find((p) => p.productId === product.id);
      if (existing) {
        return { ...prev, selectedProducts: prev.selectedProducts.filter((p) => p.productId !== product.id), selectedPackage: null };
      }
      return {
        ...prev,
        selectedProducts: [...prev.selectedProducts, { productId: product.id, name: product.name, retailPrice: product.retailPrice, cost: product.cost, financeable: product.financeable, taxable: product.taxable, accepted: null, declined: false, notes: '' }],
        selectedPackage: null,
      };
    });
  }

  // Apply a package template
  function applyPackage(pkg) {
    const newProducts = pkg.products.map((pid) => {
      const p = products.find((x) => x.id === pid);
      if (!p) return null;
      return { productId: p.id, name: p.name, retailPrice: p.retailPrice, cost: p.cost, financeable: p.financeable, taxable: p.taxable, accepted: null, declined: false, notes: '' };
    }).filter(Boolean);
    sF((prev) => ({ ...prev, selectedProducts: newProducts, selectedPackage: pkg.name }));
  }

  // Real-time payment calculation
  const summary = useMemo(() => {
    return calcDealSummary(
      { salePrice: f.salePrice || 0, accessories: f.accessories || 0, freightPrep: f.freightPrep || 0, docFee: f.docFee || 0, downPayment: f.downPayment || 0, tradeAllowance: f.tradeAllowance || 0, tradePayoff: f.tradePayoff || 0, apr: f.apr || 0, term: f.term || 60 },
      f.selectedProducts || [],
      f.taxRate || 0
    );
  }, [f.salePrice, f.accessories, f.freightPrep, f.docFee, f.downPayment, f.tradeAllowance, f.tradePayoff, f.apr, f.term, f.taxRate, f.selectedProducts]);

  function handleSave(status = 'draft') {
    const saved = { ...f, status, updatedAt: new Date().toISOString(), amountFinanced: summary.withProductsFinanced, monthlyPayment: summary.withProductsPayment, totalOfPayments: summary.totalOfPayments, financeCharge: summary.financeCharge, basePayment: summary.basePayment };
    if (!saved.id) saved.id = Date.now().toString();
    onSave(saved);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* ── DEAL INFO ── */}
      <div style={card}>
        <div style={cH}>DEAL INFORMATION</div>
        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
            <div><label style={lbl}>CUSTOMER</label><input value={f.customer} onChange={(e) => u('customer', e.target.value)} style={{ ...inp, fontWeight: 600, fontSize: 14 }} placeholder="Customer Name" /></div>
            <div><label style={lbl}>DATE</label><input type="date" value={f.date} onChange={(e) => u('date', e.target.value)} style={inp} /></div>
            <div><label style={lbl}>DEAL #</label><input value={f.dealNumber} onChange={(e) => u('dealNumber', e.target.value)} style={inp} placeholder="Deal number" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div><label style={lbl}>SALESPERSON</label>
              <select value={f.salesperson} onChange={(e) => u('salesperson', e.target.value)} style={inp}>
                <option value="">— Select —</option>
                {(act || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div><label style={lbl}>FINANCE MANAGER</label><input value={f.financeManager} onChange={(e) => u('financeManager', e.target.value)} style={inp} /></div>
            <div><label style={lbl}>STORE</label><input value={storeConfig ? (storeConfig.has_ism !== false ? 'Goldsboro' : 'Cedar Point') : ''} readOnly style={{ ...inp, color: 'var(--text-muted)' }} /></div>
          </div>
        </div>
      </div>

      {/* ── UNIT INFO ── */}
      <div style={card}>
        <div style={cH}>UNIT INFORMATION</div>
        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
            <div><label style={lbl}>UNIT TYPE</label>
              <select value={f.unitType} onChange={(e) => u('unitType', e.target.value)} style={inp}>
                <option value="">— Select —</option>
                {unitTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><label style={lbl}>NEW / USED</label>
              <select value={f.newUsed || 'new'} onChange={(e) => u('newUsed', e.target.value)} style={inp}>
                <option value="new">New</option><option value="used">Used</option>
              </select>
            </div>
            <div><label style={lbl}>YEAR</label><input type="number" value={f.year || ''} onChange={(e) => u('year', parseInt(e.target.value) || 0)} style={inp} /></div>
            <div><label style={lbl}>MAKE</label><input value={f.make} onChange={(e) => u('make', e.target.value)} style={inp} placeholder="Polaris, Yamaha..." /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
            <div><label style={lbl}>MODEL</label><input value={f.model} onChange={(e) => u('model', e.target.value)} style={inp} placeholder="General XP 1000, F250..." /></div>
            <div><label style={lbl}>VIN / STOCK #</label><input value={f.vin} onChange={(e) => u('vin', e.target.value)} style={inp} /></div>
          </div>
        </div>
      </div>

      {/* ── PRICING ── */}
      <div style={card}>
        <div style={cH}>DEAL STRUCTURE</div>
        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
            <div><label style={lbl}>SALE PRICE ($)</label><input type="number" value={f.salePrice || ''} onChange={(e) => u('salePrice', parseFloat(e.target.value) || 0)} style={{ ...inp, fontWeight: 700, fontSize: 14 }} placeholder="0" /></div>
            <div><label style={lbl}>ACCESSORIES ($)</label><input type="number" value={f.accessories || ''} onChange={(e) => u('accessories', parseFloat(e.target.value) || 0)} style={inp} placeholder="0" /></div>
            <div><label style={lbl}>FREIGHT / PREP ($)</label><input type="number" value={f.freightPrep || ''} onChange={(e) => u('freightPrep', parseFloat(e.target.value) || 0)} style={inp} placeholder="0" /></div>
            <div><label style={lbl}>DOC FEE ($)</label><input type="number" value={f.docFee || ''} onChange={(e) => u('docFee', parseFloat(e.target.value) || 0)} style={inp} placeholder="299" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
            <div><label style={lbl}>TAX RATE (%)</label><input type="number" step="0.01" value={f.taxRate || ''} onChange={(e) => u('taxRate', parseFloat(e.target.value) || 0)} style={inp} placeholder="0" /></div>
            <div><label style={lbl}>DOWN PAYMENT ($)</label><input type="number" value={f.downPayment || ''} onChange={(e) => u('downPayment', parseFloat(e.target.value) || 0)} style={inp} placeholder="0" /></div>
            <div><label style={lbl}>TRADE ALLOWANCE ($)</label><input type="number" value={f.tradeAllowance || ''} onChange={(e) => u('tradeAllowance', parseFloat(e.target.value) || 0)} style={inp} placeholder="0" /></div>
            <div><label style={lbl}>TRADE PAYOFF ($)</label><input type="number" value={f.tradePayoff || ''} onChange={(e) => u('tradePayoff', parseFloat(e.target.value) || 0)} style={inp} placeholder="0" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div><label style={lbl}>LENDER</label>
              <select value={f.lender} onChange={(e) => u('lender', e.target.value)} style={inp}>
                <option value="">— Select —</option>
                {lenders.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div><label style={lbl}>TERM (MONTHS)</label>
              <select value={f.term} onChange={(e) => u('term', parseInt(e.target.value) || 60)} style={inp}>
                {terms.map((t) => <option key={t} value={t}>{t} months</option>)}
              </select>
            </div>
            <div><label style={lbl}>APR (%)</label><input type="number" step="0.01" value={f.apr || ''} onChange={(e) => u('apr', parseFloat(e.target.value) || 0)} style={inp} placeholder="0.00" /></div>
          </div>
        </div>
      </div>

      {/* ── PAYMENT SUMMARY (real-time) ── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <StatCard label="BASE PAYMENT" value={'$' + summary.basePayment.toFixed(2)} sub="no products" accent="var(--text-secondary)" />
        <StatCard label="WITH PRODUCTS" value={'$' + summary.withProductsPayment.toFixed(2)} sub={f.term + ' months'} accent="var(--brand-red)" />
        <StatCard label="DIFFERENCE" value={'+$' + summary.paymentDifference.toFixed(2)} sub="per month" accent="#d97706" />
        <StatCard label="AMOUNT FINANCED" value={'$' + summary.withProductsFinanced.toLocaleString()} accent="#2563eb" />
        {showCost && <StatCard label="F&I GROSS" value={'$' + summary.productsGross.toLocaleString()} accent="#16a34a" />}
      </div>

      {/* ── PACKAGE QUICK SELECT ── */}
      <div style={card}>
        <div style={cH}>QUICK PACKAGE SELECT</div>
        <div style={{ padding: 14, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {packages.map((pkg) => {
            const active = f.selectedPackage === pkg.name;
            return (
              <button key={pkg.id} onClick={() => applyPackage(pkg)} style={{
                padding: '8px 16px', borderRadius: 6, cursor: 'pointer',
                border: active ? `2px solid ${pkg.color}` : '1px solid var(--border-primary)',
                background: active ? pkg.color + '15' : 'var(--card-bg)',
                fontFamily: FH, fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
                color: pkg.color, transition: 'all .15s',
              }}>
                {active ? '\u2713 ' : ''}{pkg.name.toUpperCase()}
                {pkg.recommended && <span style={{ fontFamily: FM, fontSize: 8, marginLeft: 4, color: '#d97706' }}>{'\u2605'}</span>}
              </button>
            );
          })}
          {f.selectedProducts.length > 0 && (
            <button onClick={() => sF((p) => ({ ...p, selectedProducts: [], selectedPackage: null }))} style={{ ...b2, padding: '8px 14px', fontSize: 10, color: 'var(--text-muted)' }}>CLEAR ALL</button>
          )}
        </div>
      </div>

      {/* ── PRODUCT SELECTION ── */}
      <div style={card}>
        <div style={{ ...cH, display: 'flex', justifyContent: 'space-between' }}>
          <span>F&I PRODUCTS ({f.selectedProducts.length} selected)</span>
          {showCost && <span style={{ fontFamily: FM, fontSize: 10, color: '#16a34a', fontWeight: 700 }}>GROSS: ${summary.productsGross.toLocaleString()}</span>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {products.map((p) => {
            const selected = f.selectedProducts.find((sp) => sp.productId === p.id);
            const isSelected = !!selected;
            return (
              <div key={p.id} style={{
                padding: '12px 16px', borderBottom: '1px solid var(--border-secondary)',
                background: isSelected ? '#f0fdf4' : 'transparent',
                transition: 'background .15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={() => toggleProduct(p)} style={{
                    width: 28, height: 28, borderRadius: 6, border: isSelected ? '2px solid #16a34a' : '1px solid var(--border-primary)',
                    background: isSelected ? '#dcfce7' : 'var(--card-bg)', cursor: 'pointer',
                    fontFamily: FM, fontSize: 14, color: isSelected ? '#16a34a' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>{isSelected ? '\u2713' : ''}</button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: FH, fontSize: 12, fontWeight: 700, color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)' }}>{p.name}</div>
                    <div style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{p.description}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: FH, fontSize: 14, fontWeight: 700, color: isSelected ? 'var(--brand-red)' : 'var(--text-muted)' }}>${p.retailPrice.toLocaleString()}</div>
                    {showCost && (
                      <div style={{ fontFamily: FM, fontSize: 9, color: '#16a34a' }}>gross: ${(p.retailPrice - p.cost).toLocaleString()}</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── NOTES ── */}
      <div style={card}>
        <div style={cH}>DEAL NOTES</div>
        <div style={{ padding: 14 }}>
          <textarea value={f.dealNotes || ''} onChange={(e) => u('dealNotes', e.target.value)} style={{ ...inp, minHeight: 60, resize: 'vertical' }} placeholder="Internal notes about this deal..." />
        </div>
      </div>

      {/* ── ACTIONS ── */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={b2}>CANCEL</button>
        <button onClick={() => handleSave('draft')} style={b2}>SAVE DRAFT</button>
        <button onClick={() => { handleSave('presented'); if (onPresent) onPresent(); }} style={b1}>SAVE & PRESENT</button>
      </div>
    </div>
  );
}
