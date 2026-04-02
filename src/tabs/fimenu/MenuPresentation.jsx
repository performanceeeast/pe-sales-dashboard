import React from 'react';
import { calcDealSummary } from '../../lib/fiMenuCalc';
import { styles, FM, FH, FB } from '../../components/SharedUI';

const { card, cardHead: cH, btn1: b1, btn2: b2 } = styles;

export default function MenuPresentation({ menu, packages, products, onBack, storeTheme }) {
  if (!menu) return null;

  // Build stepped packages sorted by product count (fewest → most = lowest → highest payment)
  const presentPackages = (packages || [])
    .filter((pkg) => pkg.products.length > 0)
    .sort((a, b) => a.products.length - b.products.length);

  // Calculate summary for each package
  const dealBase = {
    salePrice: menu.salePrice || 0, accessories: menu.accessories || 0,
    freightPrep: menu.freightPrep || 0, docFee: menu.docFee || 0,
    downPayment: menu.downPayment || 0, tradeAllowance: menu.tradeAllowance || 0,
    tradePayoff: menu.tradePayoff || 0, apr: menu.apr || 0, term: menu.term || 60,
  };

  const baseSummary = calcDealSummary(dealBase, [], menu.taxRate || 0);

  const steps = presentPackages.map((pkg) => {
    const pkgProducts = pkg.products.map((pid) => {
      const p = products.find((x) => x.id === pid);
      if (!p) return null;
      return { productId: p.id, name: p.name, retailPrice: p.retailPrice, cost: p.cost, financeable: p.financeable, taxable: p.taxable, description: p.description };
    }).filter(Boolean);
    const summary = calcDealSummary(dealBase, pkgProducts, menu.taxRate || 0);
    return { ...pkg, products: pkgProducts, summary };
  });

  // For print: build the stepped payment HTML
  function handlePrint() {
    const logo = storeTheme?.logo || '/logo.png';
    const brand = storeTheme?.brand_primary || '#b91c1c';

    const stepsHtml = steps.map((step, i) => {
      const prevPayment = i === 0 ? baseSummary.basePayment : steps[i - 1].summary.withProductsPayment;
      const increase = step.summary.withProductsPayment - prevPayment;
      return `
        <div style="border:1px solid #e2e8f0;border-radius:8px;padding:16px;${step.recommended ? `border-color:${brand};border-width:2px;` : ''}margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <div>
              <div style="font-family:Oswald;font-size:13px;font-weight:700;color:${step.color || '#333'};">${step.name.toUpperCase()}</div>
              ${step.recommended ? '<span style="font-size:9px;color:#d97706;font-weight:700;">★ RECOMMENDED</span>' : ''}
            </div>
            <div style="text-align:right;">
              <div style="font-family:Oswald;font-size:28px;font-weight:700;color:${brand};">$${step.summary.withProductsPayment.toFixed(2)}/mo</div>
              <div style="font-size:10px;color:#94a3b8;">+$${increase.toFixed(2)}/mo from ${i === 0 ? 'base' : 'previous'}</div>
            </div>
          </div>
          <div style="font-size:10px;color:#64748b;margin-bottom:6px;">INCLUDED PROTECTIONS:</div>
          ${step.products.map((p) => `<div style="display:flex;align-items:center;gap:4px;padding:2px 0;font-size:11px;"><span style="color:#16a34a;">✓</span> ${p.name}</div>`).join('')}
        </div>
      `;
    }).join('');

    // Declination section
    const allProductNames = [...new Set(steps.flatMap((s) => s.products.map((p) => p.name)))];
    const declinationHtml = `
      <div style="margin-top:24px;padding-top:16px;border-top:2px solid #1e293b;">
        <div style="font-family:Oswald;font-size:14px;font-weight:700;margin-bottom:8px;">OPTIONAL COVERAGE ACKNOWLEDGEMENT</div>
        <div style="font-size:11px;color:#1e293b;line-height:1.6;margin-bottom:12px;">
          I, the undersigned customer, acknowledge that the following optional protection products were offered and explained to me
          in connection with my purchase. I understand that by declining any or all of these products, I may be responsible for costs
          that would otherwise be covered by such protection. I have made my decision voluntarily and without pressure.
        </div>
        <div style="font-size:10px;color:#64748b;margin-bottom:8px;">PRODUCTS OFFERED:</div>
        ${allProductNames.map((name) => `<div style="display:flex;align-items:center;gap:8px;padding:3px 0;font-size:11px;">
          <span style="display:inline-block;width:14px;height:14px;border:1px solid #94a3b8;border-radius:2px;"></span> ${name}
          <span style="margin-left:auto;display:flex;gap:12px;">
            <span style="font-size:9px;color:#64748b;">☐ ACCEPT</span>
            <span style="font-size:9px;color:#64748b;">☐ DECLINE</span>
          </span>
        </div>`).join('')}
        <div style="margin-top:20px;">
          <div style="font-size:10px;font-weight:700;color:#1e293b;margin-bottom:4px;">SELECTED PACKAGE:</div>
          <div style="border-bottom:1px solid #1e293b;height:24px;margin-bottom:16px;"></div>
        </div>
        <div style="display:flex;gap:40px;margin-top:16px;">
          <div style="flex:1;">
            <div style="border-bottom:1px solid #1e293b;height:30px;"></div>
            <div style="font-size:9px;color:#94a3b8;margin-top:4px;">Customer Signature</div>
          </div>
          <div style="flex:1;">
            <div style="border-bottom:1px solid #1e293b;height:30px;"></div>
            <div style="font-size:9px;color:#94a3b8;margin-top:4px;">Printed Name</div>
          </div>
          <div style="width:120px;">
            <div style="border-bottom:1px solid #1e293b;height:30px;"></div>
            <div style="font-size:9px;color:#94a3b8;margin-top:4px;">Date</div>
          </div>
        </div>
        <div style="display:flex;gap:40px;margin-top:16px;">
          <div style="flex:1;">
            <div style="border-bottom:1px solid #1e293b;height:30px;"></div>
            <div style="font-size:9px;color:#94a3b8;margin-top:4px;">Finance Manager Signature</div>
          </div>
          <div style="width:120px;">
            <div style="border-bottom:1px solid #1e293b;height:30px;"></div>
            <div style="font-size:9px;color:#94a3b8;margin-top:4px;">Date</div>
          </div>
        </div>
      </div>
    `;

    const w = window.open('', '_blank', 'width=800,height=900');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Finance Menu - ${menu.customer}</title>
      <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet">
      </head><body style="font-family:Outfit,sans-serif;padding:30px;color:#1e293b;max-width:800px;margin:0 auto;font-size:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;padding-bottom:12px;border-bottom:3px solid ${brand};">
        <img src="${logo}" style="height:36px;" onerror="this.style.display='none'"/>
        <div style="text-align:right;"><div style="font-family:Oswald;font-size:12px;font-weight:700;color:${brand};">FINANCE & PROTECTION MENU</div><div style="font-size:10px;color:#94a3b8;">${menu.date}</div></div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:16px;">
        <div><div style="font-family:Oswald;font-size:16px;font-weight:700;">${menu.customer}</div><div style="font-size:11px;color:#64748b;">${menu.year || ''} ${menu.make || ''} ${menu.model || ''} ${menu.vin ? '| ' + menu.vin : ''}</div></div>
        <div style="text-align:right;font-size:11px;color:#64748b;">Sale: $${(menu.salePrice || 0).toLocaleString()} | Down: $${(menu.downPayment || 0).toLocaleString()}<br/>${menu.lender || 'TBD'} @ ${menu.apr || 0}% / ${menu.term}mo</div>
      </div>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin-bottom:16px;text-align:center;">
        <div style="font-size:10px;color:#94a3b8;letter-spacing:2px;font-weight:600;">BASE MONTHLY PAYMENT</div>
        <div style="font-family:Oswald;font-size:32px;font-weight:700;color:#64748b;">$${baseSummary.basePayment.toFixed(2)}/mo</div>
        <div style="font-size:10px;color:#94a3b8;">No optional protections included</div>
      </div>
      <div style="font-family:Oswald;font-size:11px;font-weight:700;color:#64748b;letter-spacing:2px;margin-bottom:8px;">STEPPED PAYMENT OPTIONS</div>
      ${stepsHtml}
      <div style="font-size:9px;color:#94a3b8;margin-top:16px;padding-top:8px;border-top:1px solid #e2e8f0;">
        ${menu.disclaimerText || 'All prices and payments are estimates. Final terms subject to lender approval. Optional protection products are not required for purchase or financing.'}
      </div>
      ${declinationHtml}
      </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontFamily: FH, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{menu.customer}</div>
          <div style={{ fontFamily: FM, fontSize: 11, color: 'var(--text-muted)' }}>
            {menu.year} {menu.make} {menu.model} {menu.vin ? `| ${menu.vin}` : ''} | {menu.lender || 'TBD'} @ {menu.apr}% / {menu.term}mo
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={onBack} style={b2}>BACK</button>
          <button onClick={handlePrint} style={b1}>PRINT MENU</button>
        </div>
      </div>

      {/* Base Payment Card */}
      <div style={{
        ...card, marginBottom: 12, padding: 20, textAlign: 'center',
        background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)',
      }}>
        <div style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2, fontWeight: 600 }}>BASE MONTHLY PAYMENT</div>
        <div style={{ fontFamily: FH, fontSize: 36, fontWeight: 700, color: 'var(--text-secondary)', margin: '8px 0', lineHeight: 1 }}>
          ${baseSummary.basePayment.toFixed(2)}/mo
        </div>
        <div style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)' }}>No optional protections included</div>
      </div>

      {/* Stepped Payment Options */}
      <div style={{ fontFamily: FH, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 8 }}>STEPPED PAYMENT OPTIONS</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {steps.map((step, i) => {
          const prevPayment = i === 0 ? baseSummary.basePayment : steps[i - 1].summary.withProductsPayment;
          const increase = step.summary.withProductsPayment - prevPayment;

          return (
            <div key={step.id} style={{
              ...card, padding: '16px 20px',
              border: step.recommended ? '2px solid var(--brand-red)' : '1px solid var(--border-primary)',
              background: step.recommended ? 'var(--brand-red-soft)' : 'var(--card-bg)',
              position: 'relative',
            }}>
              {step.recommended && (
                <div style={{
                  position: 'absolute', top: -8, right: 16,
                  fontFamily: FM, fontSize: 8, fontWeight: 700, color: 'var(--text-inverse)',
                  background: 'var(--brand-red)', padding: '2px 10px', borderRadius: 3, letterSpacing: 1,
                }}>RECOMMENDED</div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                {/* Left: Package name + products */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 4, height: 28, borderRadius: 2, background: step.color || '#6b7280' }} />
                    <div style={{ fontFamily: FH, fontSize: 14, fontWeight: 700, color: step.color || 'var(--text-primary)' }}>{step.name.toUpperCase()}</div>
                    <div style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)' }}>{step.description}</div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, paddingLeft: 12 }}>
                    {step.products.map((p) => (
                      <span key={p.productId} style={{
                        fontFamily: FM, fontSize: 10, padding: '2px 8px', borderRadius: 3,
                        background: '#f0fdf4', color: '#16a34a', fontWeight: 600,
                      }}>{'\u2713'} {p.name}</span>
                    ))}
                  </div>
                </div>

                {/* Right: Payment */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: FH, fontSize: 28, fontWeight: 700, color: 'var(--brand-red)', lineHeight: 1 }}>
                    ${step.summary.withProductsPayment.toFixed(2)}/mo
                  </div>
                  <div style={{ fontFamily: FM, fontSize: 10, color: '#d97706', fontWeight: 600, marginTop: 2 }}>
                    +${increase.toFixed(2)}/mo from {i === 0 ? 'base' : steps[i - 1].name}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Disclaimer */}
      <div style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', padding: '12px 0', borderTop: '1px solid var(--border-primary)' }}>
        {menu.disclaimerText || 'All prices and payments are estimates. Final terms subject to lender approval. Optional protection products are not required for purchase or financing.'}
      </div>
    </div>
  );
}
