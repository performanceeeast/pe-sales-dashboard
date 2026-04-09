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
    freight: menu.freight || 0, prep: menu.prep || 0, freightPrep: menu.freightPrep || 0,
    docFee: menu.docFee || 0, downPayment: menu.downPayment || 0,
    tradeAllowance: menu.tradeAllowance || 0, tradePayoff: menu.tradePayoff || 0,
    apr: menu.apr || 0, term: menu.term || 60,
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

    // Landscape grid: each package is a vertical column that grows to fill available height
    const stepsHtml = steps.map((step) => {
      const increase = step.summary.withProductsPayment - baseSummary.basePayment;
      return `
        <div class="pkg-card" style="border:1px solid #e2e8f0;border-radius:8px;padding:14px 14px 12px;${step.recommended ? `border-color:${brand};border-width:2px;` : ''}page-break-inside:avoid;display:flex;flex-direction:column;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
            <div style="width:4px;height:22px;background:${step.color || '#6b7280'};border-radius:2px;"></div>
            <div style="font-family:Oswald;font-size:15px;font-weight:700;color:${step.color || '#333'};flex:1;">${step.name.toUpperCase()}</div>
            ${step.recommended ? `<span style="font-size:8px;color:${brand};font-weight:700;background:#fef2f2;padding:2px 6px;border-radius:3px;letter-spacing:0.5px;">★ REC</span>` : ''}
          </div>
          <div style="text-align:center;padding:10px 0;border-top:1px dashed #e2e8f0;border-bottom:1px dashed #e2e8f0;margin-bottom:10px;">
            <div style="font-family:Oswald;font-size:30px;font-weight:700;color:#d97706;line-height:1;">+$${increase.toFixed(0)}/mo</div>
            <div style="font-size:8px;color:#94a3b8;margin-top:3px;letter-spacing:1px;">OVER BASE PAYMENT</div>
            <div style="font-size:13px;color:#1e293b;font-weight:700;margin-top:5px;">$${step.summary.withProductsPayment.toFixed(2)}/mo total</div>
          </div>
          <div style="font-size:10px;color:#475569;line-height:1.6;flex:1;">
            ${step.products.map((p) => `<div style="padding:2px 0;"><span style="color:#16a34a;font-weight:700;">✓</span> ${p.name}</div>`).join('')}
          </div>
          <div style="margin-top:10px;padding-top:8px;border-top:1.5px solid #1e293b;display:flex;align-items:center;justify-content:center;gap:8px;">
            <span style="display:inline-block;width:16px;height:16px;border:1.5px solid #1e293b;border-radius:2px;flex-shrink:0;"></span>
            <span style="font-family:Oswald;font-size:11px;font-weight:700;letter-spacing:1px;">SELECT</span>
          </div>
        </div>
      `;
    }).join('');

    const w = window.open('', '_blank', 'width=1100,height=850');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Finance Menu - ${menu.customer}</title>
      <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; }
        @page { size: letter landscape; margin: 0.35in; }
        html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; }
        body { font-family: Outfit, sans-serif; color: #1e293b; font-size: 12px; }
        /* Fill the printable area: 11in landscape - 0.7in margins = 10.3in wide / 7.8in tall */
        .menu-page {
          padding: 20px;
          display: flex;
          flex-direction: column;
          min-height: 7.6in;
        }
        .pkg-grid { flex: 1; display: flex; gap: 10px; align-items: stretch; }
        .pkg-card { flex: 1; }
        @media print {
          .menu-page { padding: 0; min-height: calc(8.5in - 0.7in - 4px); }
        }
      </style>
      </head><body>
      <div class="menu-page">
        <!-- HEADER -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:8px;border-bottom:3px solid ${brand};">
          <img src="${logo}" style="height:38px;" onerror="this.style.display='none'"/>
          <div style="text-align:center;flex:1;">
            <div style="font-family:Oswald;font-size:16px;font-weight:700;color:${brand};letter-spacing:2px;">FINANCE & PROTECTION MENU</div>
          </div>
          <div style="font-size:11px;color:#94a3b8;text-align:right;">${menu.date}</div>
        </div>

        <!-- CUSTOMER + DEAL INFO ROW -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:24px;margin-bottom:10px;">
          <div style="flex:1;">
            <div style="font-family:Oswald;font-size:18px;font-weight:700;line-height:1.2;">${menu.customer}</div>
            <div style="font-size:11px;color:#64748b;margin-top:2px;">${menu.year || ''} ${menu.make || ''} ${menu.model || ''} ${menu.vin ? '| ' + menu.vin : ''}</div>
          </div>
          <div style="text-align:right;font-size:11px;color:#64748b;line-height:1.4;">
            Sale: $${(menu.salePrice || 0).toLocaleString()} | Down: $${(menu.downPayment || 0).toLocaleString()}<br/>
            ${menu.lender || 'TBD'} @ ${menu.apr || 0}% / ${menu.term}mo
          </div>
        </div>

        <!-- BASE PAYMENT BAR -->
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:10px 18px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;">
          <div style="font-size:10px;color:#94a3b8;letter-spacing:2px;font-weight:600;">BASE MONTHLY PAYMENT (no optional protections)</div>
          <div style="font-family:Oswald;font-size:24px;font-weight:700;color:#64748b;line-height:1;">$${baseSummary.basePayment.toFixed(2)}/mo</div>
        </div>

        <div style="font-family:Oswald;font-size:11px;font-weight:700;color:#64748b;letter-spacing:2px;margin-bottom:8px;">PAYMENT OPTIONS</div>

        <!-- HORIZONTAL PACKAGE GRID — flex:1 to fill remaining vertical space -->
        <div class="pkg-grid">
          ${stepsHtml}
        </div>

        <!-- CUSTOMER SELECTION + SIGNATURE ROW -->
        <div style="border:2px solid #1e293b;border-radius:6px;padding:12px 18px;margin-top:12px;">
          <div style="font-family:Oswald;font-size:11px;font-weight:700;letter-spacing:1.5px;margin-bottom:8px;color:#1e293b;">CUSTOMER ACKNOWLEDGEMENT &amp; SELECTION</div>
          <div style="font-size:10px;color:#475569;line-height:1.5;margin-bottom:12px;">
            I/We acknowledge the optional protection products were offered and explained. Check the SELECT box above the package of choice (or check DECLINE ALL below) and sign. By declining, I/we may be responsible for future repair costs, maintenance expenses, or negative equity that may have otherwise been covered.
          </div>
          <div style="display:flex;gap:28px;align-items:flex-end;">
            <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
              <span style="display:inline-block;width:16px;height:16px;border:1.5px solid #1e293b;border-radius:2px;"></span>
              <span style="font-family:Oswald;font-size:11px;font-weight:700;letter-spacing:0.5px;">DECLINE ALL</span>
            </div>
            <div style="flex:1;">
              <div style="border-bottom:1px solid #1e293b;height:28px;"></div>
              <div style="font-size:9px;color:#94a3b8;margin-top:3px;">Customer Signature</div>
            </div>
            <div style="flex:1;">
              <div style="border-bottom:1px solid #1e293b;height:28px;"></div>
              <div style="font-size:9px;color:#94a3b8;margin-top:3px;">Printed Name</div>
            </div>
            <div style="width:130px;">
              <div style="border-bottom:1px solid #1e293b;height:28px;"></div>
              <div style="font-size:9px;color:#94a3b8;margin-top:3px;">Date</div>
            </div>
          </div>
        </div>

        <div style="font-size:8px;color:#94a3b8;line-height:1.4;margin-top:8px;">
          ${menu.disclaimerText || 'All prices and payments are estimates. Final terms subject to lender approval. Optional protection products are not required for purchase or financing.'}
        </div>
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
      <div style={{ fontFamily: FH, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 8 }}>PAYMENT OPTIONS</div>

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
