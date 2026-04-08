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

    const stepsHtml = steps.map((step) => {
      // Difference is measured from the BASE payment, not from the previous step
      const increase = step.summary.withProductsPayment - baseSummary.basePayment;
      return `
        <div class="pkg-card" style="border:1px solid #e2e8f0;border-radius:6px;padding:8px 10px;${step.recommended ? `border-color:${brand};border-width:2px;` : ''}margin-bottom:6px;page-break-inside:avoid;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
            <div style="flex:1;min-width:0;">
              <div style="display:flex;align-items:center;gap:6px;">
                <div style="width:3px;height:18px;background:${step.color || '#6b7280'};border-radius:2px;"></div>
                <div class="pkg-name" style="font-family:Oswald;font-size:12px;font-weight:700;color:${step.color || '#333'};">${step.name.toUpperCase()}</div>
                ${step.recommended ? `<span style="font-size:8px;color:${brand};font-weight:700;background:#fef2f2;padding:1px 5px;border-radius:2px;">★ RECOMMENDED</span>` : ''}
              </div>
              <div class="pkg-products" style="font-size:9px;color:#475569;margin-top:4px;padding-left:9px;line-height:1.5;">
                ${step.products.map((p) => `<span style="display:inline-block;margin-right:8px;white-space:nowrap;"><span style="color:#16a34a;font-weight:700;">✓</span> ${p.name}</span>`).join('')}
              </div>
            </div>
            <div style="text-align:right;flex-shrink:0;">
              <div class="pkg-delta" style="font-family:Oswald;font-size:22px;font-weight:700;color:#d97706;line-height:1;">+$${increase.toFixed(0)}/mo</div>
              <div style="font-size:8px;color:#94a3b8;margin-top:1px;">over base payment</div>
              <div style="font-size:9px;color:#475569;font-weight:600;margin-top:2px;">$${step.summary.withProductsPayment.toFixed(2)}/mo total</div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Declination section — simple acknowledgement with customer signature
    const declinationHtml = `
      <div style="padding-top:16px;border-top:2px solid #1e293b;">
        <div style="font-family:Oswald;font-size:14px;font-weight:700;margin-bottom:12px;">OPTIONAL COVERAGE DECLINATION</div>
        <div style="font-size:11px;color:#1e293b;line-height:1.7;margin-bottom:12px;">
          I/We understand that Performance East Inc. offered optional protection products and services during this purchase. These products are not required to purchase the unit or obtain financing, unless otherwise required by the lender.
        </div>
        <div style="font-size:11px;color:#1e293b;line-height:1.7;margin-bottom:12px;">
          I/We have been given the opportunity to review these options and ask questions, and I/we have chosen to decline them at this time.
        </div>
        <div style="font-size:11px;color:#1e293b;line-height:1.7;margin-bottom:18px;">
          I/We understand that by declining these products, I/we may be responsible for certain future repair costs, maintenance expenses, or negative equity balances that may have otherwise been covered.
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
      <style>
        * { box-sizing: border-box; }
        body { font-family: Outfit, sans-serif; padding: 24px; color: #1e293b; max-width: 800px; margin: 0 auto; font-size: 12px; }
        .menu-page { page-break-after: always; }
        .menu-page:last-of-type { page-break-after: auto; }
        @page { size: letter; margin: 0.4in; }
        @media print {
          html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body { padding: 0; font-size: 10px; }
          .menu-header { margin-bottom: 10px !important; padding-bottom: 6px !important; }
          .menu-header img { height: 28px !important; }
          .menu-header .brand-label { font-size: 10px !important; }
          .customer-row { margin-bottom: 8px !important; }
          .customer-row .cust-name { font-size: 13px !important; }
          .customer-row .cust-details { font-size: 9px !important; }
          .base-card { padding: 8px !important; margin-bottom: 8px !important; }
          .base-card .base-label { font-size: 8px !important; }
          .base-card .base-amount { font-size: 22px !important; }
          .base-card .base-sub { font-size: 8px !important; }
          .section-label { font-size: 9px !important; margin-bottom: 4px !important; }
          .pkg-card { padding: 5px 8px !important; margin-bottom: 4px !important; }
          .pkg-name { font-size: 10px !important; }
          .pkg-delta { font-size: 18px !important; }
          .pkg-products { font-size: 8px !important; }
          .disclaimer { font-size: 7px !important; margin-top: 6px !important; padding-top: 4px !important; }
          .declination-page { page-break-before: always; }
        }
      </style>
      </head><body>
      <div class="menu-page">
        <div class="menu-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;padding-bottom:8px;border-bottom:3px solid ${brand};">
          <img src="${logo}" style="height:32px;" onerror="this.style.display='none'"/>
          <div style="text-align:right;"><div class="brand-label" style="font-family:Oswald;font-size:11px;font-weight:700;color:${brand};">FINANCE & PROTECTION MENU</div><div style="font-size:9px;color:#94a3b8;">${menu.date}</div></div>
        </div>
        <div class="customer-row" style="display:flex;justify-content:space-between;margin-bottom:10px;gap:20px;">
          <div><div class="cust-name" style="font-family:Oswald;font-size:15px;font-weight:700;">${menu.customer}</div><div class="cust-details" style="font-size:10px;color:#64748b;">${menu.year || ''} ${menu.make || ''} ${menu.model || ''} ${menu.vin ? '| ' + menu.vin : ''}</div></div>
          <div style="text-align:right;font-size:10px;color:#64748b;">Sale: $${(menu.salePrice || 0).toLocaleString()} | Down: $${(menu.downPayment || 0).toLocaleString()}<br/>${menu.lender || 'TBD'} @ ${menu.apr || 0}% / ${menu.term}mo</div>
        </div>
        <div class="base-card" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:10px;margin-bottom:10px;text-align:center;">
          <div class="base-label" style="font-size:9px;color:#94a3b8;letter-spacing:2px;font-weight:600;">BASE MONTHLY PAYMENT</div>
          <div class="base-amount" style="font-family:Oswald;font-size:26px;font-weight:700;color:#64748b;line-height:1.1;">$${baseSummary.basePayment.toFixed(2)}/mo</div>
          <div class="base-sub" style="font-size:9px;color:#94a3b8;">No optional protections included</div>
        </div>
        <div class="section-label" style="font-family:Oswald;font-size:10px;font-weight:700;color:#64748b;letter-spacing:2px;margin-bottom:6px;">STEPPED PAYMENT OPTIONS</div>
        ${stepsHtml}
        <div class="disclaimer" style="font-size:8px;color:#94a3b8;margin-top:10px;padding-top:6px;border-top:1px solid #e2e8f0;line-height:1.4;">
          ${menu.disclaimerText || 'All prices and payments are estimates. Final terms subject to lender approval. Optional protection products are not required for purchase or financing.'}
        </div>
      </div>
      <div class="declination-page">
        ${declinationHtml}
      </div>
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
        {steps.map((step) => {
          // Show the payment delta versus the BASE payment, not versus the previous tier
          const increase = step.summary.withProductsPayment - baseSummary.basePayment;

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

                {/* Right: Payment — amount OVER BASE big, total smaller */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: FH, fontSize: 32, fontWeight: 700, color: '#d97706', lineHeight: 1 }}>
                    +${increase.toFixed(0)}/mo
                  </div>
                  <div style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
                    over base payment
                  </div>
                  <div style={{ fontFamily: FM, fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    ${step.summary.withProductsPayment.toFixed(2)}/mo total
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
